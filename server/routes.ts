import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { AIContentModerator } from "./ai";
import { GeocodingService } from "./geocoding";

// Legacy default moderation prompt
function getDefaultModerationPrompt(): string {
  return `Je bent een content moderator voor een community safety platform waar burgers incidenten rapporteren.

Analyseer de volgende melding en geef een JSON response terug met:
- isApproved: boolean (true als de melding echt lijkt en gepubliceerd kan worden)
- isSpam: boolean (true als het een grap, meme, test of spam lijkt)
- hasInappropriateContent: boolean (true als er racisme, discriminatie, grove taal of ongepaste inhoud in staat)
- hasPII: boolean (true als er persoonlijke informatie zoals namen, telefoonnummers, adressen in staat)
- moderatedTitle: string (ALTIJD herschreven titel in formele, neutrale taal zonder persoonlijke info - ook bij afwijzing)
- moderatedDescription: string (ALTIJD herschreven beschrijving in formele, neutrale taal zonder persoonlijke info - ook bij afwijzing)
- reason: string (alleen als isApproved false is - korte uitleg waarom afgekeurd)

✅ TOEGESTAAN:
- Echte veiligheidsincidenten (diefstal, vandalisme, geweld)
- Overlast in openbare ruimte (geluidsoverlast, vervuiling)
- Verkeerssituaties en gevaarlijke situaties
- Constructieve meldingen over infrastructuur problemen
- Waarnemingen van verdachte activiteiten

❌ NIET TOEGESTAAN:
- Algemene complimenten zonder specifiek incident ("mooi park")
- Test berichten of spam ("test", "hallo")
- Persoonlijke informatie (namen, telefoonnummers, adressen)
- Racistische of discriminerende inhoud
- Grove taal of beledigingen

Richtlijnen voor herschrijven:
- Verander naar formele, neutrale taal
- Verwijder namen, telefoonnummers, specifieke adressen (maar behoud algemene locatie zoals "bij de supermarkt")
- Behoud belangrijke details over het incident zelf
- Maak het professioneel maar begrijpelijk
- Verwijder emotionele taal en vervang door feitelijke beschrijving

BELANGRIJK: Geef alleen pure JSON terug zonder markdown code blocks.`;
}

// Default content filter prompt (Type 1: What is allowed/not allowed)
function getDefaultContentFilterPrompt(): string {
  return `Je bent een content filter voor een community safety platform.

Analyseer ALLEEN of deze melding toegestaan is en geef een JSON response terug met:
- isApproved: boolean (true als de melding echt lijkt en gepubliceerd kan worden)
- isSpam: boolean (true als het een grap, meme, test of spam lijkt)
- hasInappropriateContent: boolean (true als er racisme, discriminatie, grove taal of ongepaste inhoud in staat)
- hasPII: boolean (true als er persoonlijke informatie zoals namen, telefoonnummers, adressen in staat)
- reason: string (alleen als isApproved false is - korte uitleg waarom afgekeurd)

✅ Toegestaan:
- Echte veiligheidsincidenten (diefstal, vandalisme, gevaar)
- Overlast in openbare ruimte
- Positieve observaties over de buurt
- Status updates over publieke ruimtes

❌ Niet toegestaan:
- Test berichten of spam ("test", "proberen")
- Algemene complimenten zonder specifiek incident
- Berichten met persoonlijke informatie (volledige namen, telefoonnummers, adressen)
- Racistische, discriminerende of grove taal
- Memes of grappen

BELANGRIJK: Geef alleen pure JSON terug zonder markdown code blocks.`;
}

// Default text formalization prompt (Type 2: How to rewrite text formally)
function getDefaultTextFormalizationPrompt(): string {
  return `Je bent een tekst editor die meldingen herschrijft naar formele, professionele taal.

Herschrijf de volgende melding naar een formele versie en geef een JSON response terug met:
- formalizedTitle: string (herschreven titel in formele, neutrale taal)
- formalizedDescription: string (herschreven beschrijving in formele, neutrale taal)

Richtlijnen voor herschrijven:
- Gebruik formele, neutrale taal
- Verwijder emotionele uitingen en vervang door feitelijke beschrijving
- Verwijder persoonlijke informatie (volledige namen, telefoonnummers, specifieke adressen)
- Behoud algemene locatie-informatie ("bij de supermarkt", "in het park")
- Behoud alle belangrijke details over het incident
- Maak het professioneel maar nog steeds begrijpelijk
- Gebruik Nederlandse spelling en grammatica

Voorbeelden:
- "Mijn fiets is gejat door een of andere idioot!" → "Fietsdiefstal gemeld door eigenaar"
- "Super mooi park vandaag, echt geweldig!" → "Positieve waarneming betreffende staat van het park"
- "Jan de Vries (06-12345678) heeft mijn auto bekrast" → "Eigendomsschade aan voertuig door onbekende persoon"

BELANGRIJK: Geef alleen pure JSON terug zonder markdown code blocks.`;
}

// Distance calculation helper (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const geocodingService = new GeocodingService();
  // Get public reports only (for main dashboard)
  app.get("/api/reports", async (req, res) => {
    try {
      const category = req.query.category as string;
      let reports;

      if (category && category !== 'all') {
        reports = await storage.getPublicReportsByCategory(category);
      } else {
        reports = await storage.getAllPublicReports();
      }

      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Get single report
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  // Get reports by postal code
  app.get("/api/region/:postalCode/reports", async (req, res) => {
    try {
      const postalCode = req.params.postalCode;
      const category = req.query.category as string;

      // Get postal code boundaries
      const postalInfo = await geocodingService.getPostalCodeInfo(postalCode);
      if (!postalInfo) {
        return res.status(404).json({ error: "Postal code not found" });
      }

      // Get all reports and filter by proximity to postal code center
      let allReports;
      if (category && category !== 'all') {
        allReports = await storage.getPublicReportsByCategory(category);
      } else {
        allReports = await storage.getAllPublicReports();
      }

      // Filter reports within ~2km radius of postal code center
      const radiusKm = 2;
      const reportsInPostalCode = allReports.filter(report => {
        if (!report.latitude || !report.longitude) return false;

        const distance = calculateDistance(
          postalInfo.latitude, 
          postalInfo.longitude,
          report.latitude,
          report.longitude
        );

        return distance <= radiusKm;
      });

      res.json({
        postalCode: postalInfo,
        reports: reportsInPostalCode,
        count: reportsInPostalCode.length
      });
    } catch (error) {
      console.error('Postal code reports error:', error);
      res.status(500).json({ error: "Failed to fetch region reports" });
    }
  });

  // Get AI summary for postal code
  app.get("/api/region/:postalCode/ai-summary", async (req, res) => {
    try {
      const postalCode = req.params.postalCode;

      // Get postal code info
      const postalInfo = await geocodingService.getPostalCodeInfo(postalCode);
      if (!postalInfo) {
        return res.status(404).json({ error: "Postal code not found" });
      }

      // Get all reports for this postal code (no radius limit)
      const allReports = await storage.getAllPublicReports();
      const reportsInPostalCode = allReports.filter(report => {
        if (!report.latitude || !report.longitude) return false;

        const distance = calculateDistance(
          postalInfo.latitude, 
          postalInfo.longitude,
          report.latitude,
          report.longitude
        );

        return distance <= 2; // Keep minimal radius for exact postal code area
      });

      if (reportsInPostalCode.length === 0) {
        return res.json({ summary: "Geen recente meldingen in deze regio." });
      }

      // Generate AI summary
      const moderator = new AIContentModerator();

      // Group reports by category
      const reportsByCategory = reportsInPostalCode.reduce((acc, report) => {
        if (!acc[report.category]) {
          acc[report.category] = [];
        }
        acc[report.category].push(report.description);
        return acc;
      }, {} as Record<string, string[]>);

      const categoryTexts = Object.entries(reportsByCategory)
        .map(([category, descriptions]) => `${category} (${descriptions.length} meldingen): ${descriptions.join(', ')}`)
        .join('. ');

      const prompt = `Je bent een stadsmanager die rapporteert aan de burgemeester. Groepeer deze buurtmeldingen per hoofdcategorie: ${categoryTexts}

Maak een samenvatting per categorie:
- Vermeld aantal meldingen per categorie
- Beschrijf kort wat de hoofdproblemen zijn binnen elke categorie
- Focus op publieke veiligheid en openbare ruimte
- Negeer administratieve/private zaken

Format: 
**[Categorie naam] ({aantal} meldingen):** korte beschrijving

Maximaal 3-4 categorieën, professionele toon.`;

      try {
        const summary = await moderator.generateSummary(prompt);
        res.json({ summary: summary || "Gemengde meldingen in de buurt." });
      } catch (aiError) {
        // Fallback summary without AI
        const categoryCount = reportsInPostalCode.reduce((acc, report) => {
          acc[report.category] = (acc[report.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topCategory = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)[0];

        const fallbackSummary = `${reportsInPostalCode.length} meldingen in deze regio. Meest voorkomend: ${topCategory[0]} (${topCategory[1]} meldingen).`;
        res.json({ summary: fallbackSummary });
      }

    } catch (error) {
      console.error('AI summary error:', error);
      res.status(500).json({ error: "Failed to generate AI summary" });
    }
  });

  // Get AI journalism analysis for specific category in postal code
  app.get("/api/region/:postalCode/category/:category/analysis", async (req, res) => {
    try {
      const postalCode = req.params.postalCode;
      const category = req.params.category;

      // Get postal code info
      const postalInfo = await geocodingService.getPostalCodeInfo(postalCode);
      if (!postalInfo) {
        return res.status(404).json({ error: "Postal code not found" });
      }

      // Get all reports for this category in this postal code
      const allReports = await storage.getAllPublicReports();
      const categoryReports = allReports.filter(report => {
        if (report.category !== category) return false;
        if (!report.latitude || !report.longitude) return false;

        const distance = calculateDistance(
          postalInfo.latitude, 
          postalInfo.longitude,
          report.latitude,
          report.longitude
        );

        return distance <= 2;
      });

      if (categoryReports.length < 2) {
        return res.json({ analysis: null }); // Not enough data for pattern analysis
      }

      // Prepare detailed data for AI analysis
      const detailedReports = categoryReports.map(report => ({
        description: report.description,
        location: report.locationDescription || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`,
        createdAt: new Date(report.createdAt).toLocaleDateString('nl-NL'),
        incidentTime: report.incidentDateTime ? new Date(report.incidentDateTime).toLocaleDateString('nl-NL') : null,
        subcategory: report.subcategory || 'Algemeen'
      }));

      const moderator = new AIContentModerator();

      const prompt = `Je bent een onderzoeksjournalist die patronen analyseert in buurtmeldingen. 

Analyseer deze ${categoryReports.length} meldingen in categorie "${category}":

${detailedReports.map((report, i) => `
Melding ${i+1}:
- Beschrijving: ${report.description}
- Locatie: ${report.location}
- Gemeld op: ${report.createdAt}
- Subcategorie: ${report.subcategory}
${report.incidentTime ? `- Incident datum: ${report.incidentTime}` : ''}
`).join('\n')}

Schrijf ALLEEN een korte journalistieke notitie ALS je duidelijke patronen ziet:
- Tijdsclusters (bijv. "3 fietsdiefstallen in één nacht")
- Locatieclusters (bijv. "alle incidenten rond Park X")
- Gedragspatronen (bijv. "steeds dezelfde aanpak")
- Escalatie (bijv. "toenemende ernst")

SCHRIJF NIETS als er geen opvallende patronen zijn.

Als je wel patronen ziet, format zo:
**Opvallend patroon:** [korte, pakkende kop]
[2-3 zinnen uitleg]

Journalist toon: professioneel maar toegankelijk, focus op wat burgers moeten weten.`;

      try {
        const analysis = await moderator.generateSummary(prompt);
        
        // Only return analysis if it's substantial (not just "geen patronen")
        if (analysis && analysis.length > 50 && !analysis.toLowerCase().includes('geen patronen') && !analysis.toLowerCase().includes('geen opvallende')) {
          res.json({ analysis: analysis.trim() });
        } else {
          res.json({ analysis: null });
        }
      } catch (aiError) {
        console.error('AI journalism analysis error:', aiError);
        res.json({ analysis: null });
      }

    } catch (error) {
      console.error('Category analysis error:', error);
      res.status(500).json({ error: "Failed to generate category analysis" });
    }
  });

  // Get postal code info
  app.get("/api/geocode/:postalCode", async (req, res) => {
    try {
      const postalCode = req.params.postalCode;
      const postalInfo = await geocodingService.getPostalCodeInfo(postalCode);

      if (!postalInfo) {
        return res.status(404).json({ error: "Postal code not found" });
      }

      res.json(postalInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to geocode postal code" });
    }
  });

  // Create new report with AI moderation
  app.post("/api/reports", upload.single('image'), async (req: any, res) => {
    try {
      console.log("DEBUG - Raw request body:", req.body);

      const reportData = {
        ...req.body,
        latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
        longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
        authoritiesContacted: req.body.authoritiesContacted === 'true',
        incidentDateTime: req.body.incidentDateTime || undefined,
      };

      // Add image URL if file was uploaded
      if (req.file) {
        reportData.imageUrl = `/uploads/${req.file.filename}`;
      }

      console.log("DEBUG - Processed data:", reportData);

      const validatedData = insertReportSchema.parse(reportData);

      // Run AI content moderation
      const moderator = new AIContentModerator();
      const customPrompt = await storage.getModerationPrompt();
      const moderationResult = await moderator.moderateContent(
        validatedData.title || '',
        validatedData.description || '',
        customPrompt || undefined
      );

      console.log("DEBUG - Moderation result:", moderationResult);

      // NEW STRATEGY: Save ALL reports, use isPublic flag for visibility
      const shouldReject = moderator.shouldAutoReject(moderationResult);

      // Prepare report data with moderation results - ALWAYS save with original + moderated content
      const finalReportData = {
        ...validatedData,
        originalTitle: validatedData.title,
        originalDescription: validatedData.description,
        // FORCE: Always use moderated version if available, create fallback if AI fails
        title: (moderationResult.moderatedTitle && moderationResult.moderatedTitle.trim().length > 0) 
          ? moderationResult.moderatedTitle 
          : (shouldReject ? `Gemoderate melding: ${validatedData.category}` : validatedData.title),
        description: (moderationResult.moderatedDescription && moderationResult.moderatedDescription.trim().length > 0) 
          ? moderationResult.moderatedDescription 
          : (shouldReject ? "Melding is gemoderated vanwege ongepaste inhoud." : validatedData.description),
        moderationStatus: shouldReject ? 'rejected' : 'approved',
        moderationReason: moderationResult.reason || null,
        isModerated: true, // AI always processes content
        isPublic: !shouldReject, // Only approved content is public
      };

      console.log("DEBUG - Final report data before save:", {
        id: 'will-be-generated',
        title: finalReportData.title,
        originalTitle: finalReportData.originalTitle,
        isPublic: finalReportData.isPublic,
        moderationStatus: finalReportData.moderationStatus
      });

      // ALWAYS save the report first, regardless of moderation result
      const report = await storage.createReportWithModeration(finalReportData);
      console.log("DEBUG - Report saved with ID:", report.id, "isPublic:", report.isPublic);

      // If rejected, return error to user but report is already saved in admin area
      if (shouldReject) {
        return res.status(400).json({ 
          error: "Content rejected by moderation",
          reason: moderationResult.reason || "Content appears to be spam or inappropriate",
          reportId: report.id // Include for debugging
        });
      }

      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("DEBUG - Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.log("DEBUG - Other error:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Delete report
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const success = await storage.deleteReport(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // Legacy moderation prompt routes (backward compatibility)
  app.get("/api/admin/moderation-prompt", async (req, res) => {
    try {
      const prompt = await storage.getModerationPrompt();
      res.json({ prompt: prompt || getDefaultModerationPrompt() });
    } catch (error) {
      console.error('Error fetching moderation prompt:', error);
      res.status(500).json({ error: "Failed to fetch moderation prompt" });
    }
  });

  app.post("/api/admin/moderation-prompt", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt must be a string" });
      }

      await storage.saveModerationPrompt(prompt);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving moderation prompt:', error);
      res.status(500).json({ error: "Failed to save moderation prompt" });
    }
  });

  // New separated moderation prompts routes
  app.get("/api/admin/moderation-prompts", async (req, res) => {
    try {
      const prompts = await storage.getModerationPrompts();
      res.json({
        contentFilter: prompts.contentFilter || getDefaultContentFilterPrompt(),
        textFormalization: prompts.textFormalization || getDefaultTextFormalizationPrompt()
      });
    } catch (error) {
      console.error('Error fetching moderation prompts:', error);
      res.status(500).json({ error: "Failed to fetch moderation prompts" });
    }
  });

  app.post("/api/admin/moderation-prompts", async (req, res) => {
    try {
      const { contentFilter, textFormalization } = req.body;
      
      if (typeof contentFilter !== 'string' || typeof textFormalization !== 'string') {
        return res.status(400).json({ error: "Both contentFilter and textFormalization must be strings" });
      }

      await storage.saveModerationPrompts({ contentFilter, textFormalization });
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving moderation prompts:', error);
      res.status(500).json({ error: "Failed to save moderation prompts" });
    }
  });

  // Admin routes - IMPORTANT: PUT GET BEFORE DELETE to avoid Express route conflicts
  app.get("/api/admin/reports", async (req, res) => {
    console.log("DEBUG - Admin GET route hit!");
    try {
      const category = req.query.category as string;
      let reports;

      if (category && category !== 'all') {
        reports = await storage.getReportsByCategory(category);
      } else {
        reports = await storage.getAllReports();
      }

      console.log("DEBUG - Admin reports fetched:", reports.length, "reports");
      if (reports.length > 0) {
        console.log("DEBUG - First report:", {
          id: reports[0].id,
          title: reports[0].title,
          originalTitle: reports[0].originalTitle,
          isPublic: reports[0].isPublic,
          moderationStatus: reports[0].moderationStatus
        });
      }

      res.json(reports);
    } catch (error) {
      console.log("DEBUG - Admin reports error:", error);
      res.status(500).json({ error: "Failed to fetch admin reports" });
    }
  });

  app.delete("/api/admin/reports", async (req, res) => {
    console.log("DEBUG - Admin DELETE route hit!");
    try {
      const success = await storage.deleteAllReports();
      res.json({ success, message: success ? "All reports deleted" : "Failed to delete reports" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete all reports" });
    }
  });

  // Serve uploaded images
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}