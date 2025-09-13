import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema, insertScrapingConfigSchema, insertMunicipalitySchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { AIContentModerator, getAILogs } from "./ai";
import { GeocodingService } from "./geocoding";
import { newsScraper } from "./news-scraper";

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

✅ Toegestaan (RUIM INTERPRETEREN):
- Echte veiligheidsincidenten (diefstal, vandalisme, gevaar)
- Verdachte activiteiten of criminele gebeurtenissen
- Overlast in openbare ruimte
- Positieve observaties over de buurt (zoals "mooie plek", "schone straat", "mooie schuur")
- Status updates over publieke ruimtes en gebouwen
- Community waarnemingen en waarschuwingen
- Infrastructurele problemen of gevaren
- Ongevallen of milieuproblemen
- Alle oprechte meldingen bedoeld om anderen te informeren

❌ STRIKT NIET TOEGESTAAN (hasInappropriateContent=true):
- Racistische woorden of slurs (n-woord, ook met spelfouten zoals "neger", "negro", etc.)
- Discriminerende taal over etniciteit, religie, geslacht, seksualiteit
- Hatelijke uitspraken tegen groepen mensen
- Grove scheldwoorden en beledigingen
- Gewelddadige dreigingen

❌ Ook niet toegestaan:
- Duidelijke test berichten ("test", "testing 123", "hallo wereld")
- Echte spam (reclame, promotie, herhaalde berichten)
- Berichten met persoonlijke informatie (volledige namen, telefoonnummers, adressen)

KRITISCH: Als er racistische/discriminerende taal in staat, ALTIJD hasInappropriateContent=true en isApproved=false zetten.
Bij andere twijfel: GOEDKEUREN. Geef alleen pure JSON terug zonder markdown code blocks.`;
}

// Default text formalization prompt (Type 2: How to rewrite text formally)
function getDefaultTextFormalizationPrompt(): string {
  return `Maak deze Nederlandse tekst formeler en professioneler, maar behoud ALLE originele details en betekenis. Geef EXACT deze JSON structuur terug:
{"formalizedTitle": "string", "formalizedDescription": "string"}

KRITIEKE REGELS:
- NOOIT nieuwe details, locaties, of gebeurtenissen toevoegen die niet in het origineel staan
- NOOIT verhalen verzinnen of extra context toevoegen  
- ALLEEN grammatica, spelling en formaliteit verbeteren
- Dezelfde basis inhoud en feiten behouden
- Als het origineel al formeel is, houd het ongewijzigd

Voorbeelden:
- "Mooie varens" → {"formalizedTitle": "Mooie varens", "formalizedDescription": "Mooie varens waargenomen"}
- "Auto geparkeerd" → {"formalizedTitle": "Voertuig geparkeerd", "formalizedDescription": "Voertuig aangetroffen op parkeerlocatie"}
- "Schoon stukkie natuur" → {"formalizedTitle": "Schoon stukje natuur", "formalizedDescription": "Schoon stukje natuur waargenomen"}

Maak dit formeler maar behoud ALLE originele betekenis en feiten:`;
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

      // Run AI content moderation - Use new separated prompts for better content filtering
      const moderator = new AIContentModerator();
      const moderationPrompts = await storage.getModerationPrompts();
      
      // Step 1: Content filtering with proper racist/discriminatory content detection
      // SECURITY: Use strong default if admin hasn't set custom prompt
      const contentFilterPrompt = moderationPrompts.contentFilter || getDefaultContentFilterPrompt();
      console.log('DEBUG - Using content filter prompt:', contentFilterPrompt ? 'Custom/Default prompt loaded' : 'No prompt available');
      
      const filterResult = await moderator.filterContent(
        validatedData.title || '',
        validatedData.description || '',
        contentFilterPrompt
      );
      
      console.log('DEBUG - Content Filter Result:', filterResult);
      
      // Step 2: Text formalization only if approved
      let moderatedTitle = validatedData.title;
      let moderatedDescription = validatedData.description;
      
      if (filterResult.isApproved) {
        const textFormalizationPrompt = moderationPrompts.textFormalization || getDefaultTextFormalizationPrompt();
        const formalizationResult = await moderator.formalizeText(
          validatedData.title || '',
          validatedData.description || '',
          textFormalizationPrompt
        );
        moderatedTitle = formalizationResult.formalizedTitle;
        moderatedDescription = formalizationResult.formalizedDescription;
      }
      
      // Construct moderation result for backward compatibility
      const moderationResult = {
        isApproved: filterResult.isApproved,
        isSpam: filterResult.isSpam,
        hasInappropriateContent: filterResult.hasInappropriateContent,
        hasPII: filterResult.hasPII,
        moderatedTitle,
        moderatedDescription,
        reason: filterResult.reason
      };

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

  // API Health Check endpoint
  app.get("/api/admin/api-health", async (req, res) => {
    try {
      const moderator = new AIContentModerator();
      const health = await moderator.checkAPIHealth();
      res.json(health);
    } catch (error) {
      console.error('Error checking API health:', error);
      res.json({ isOnline: false, error: 'Health check failed' });
    }
  });

  // AI Logs endpoint for debugging
  app.get("/api/admin/ai-logs", async (req, res) => {
    try {
      const logs = getAILogs();
      res.json(logs);
    } catch (error) {
      console.error('Error fetching AI logs:', error);
      res.status(500).json({ error: "Failed to fetch AI logs" });
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

  // Delete single report by ID (Admin only)
  app.delete("/api/admin/reports/:id", async (req, res) => {
    console.log("DEBUG - Admin DELETE single report route hit!", req.params.id);
    try {
      const { id } = req.params;
      const success = await storage.deleteReport(id);
      if (success) {
        res.json({ success: true, message: "Report deleted successfully" });
      } else {
        res.status(404).json({ error: "Report not found" });
      }
    } catch (error) {
      console.log("DEBUG - Admin delete report error:", error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // News Scraping Configuration API
  app.get("/api/admin/scraping-configs", async (req, res) => {
    try {
      const configs = await storage.getScrapingConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching scraping configs:", error);
      res.status(500).json({ error: "Failed to fetch scraping configurations" });
    }
  });

  app.post("/api/admin/scraping-configs", async (req, res) => {
    try {
      const validatedData = insertScrapingConfigSchema.parse(req.body);
      const config = await storage.createScrapingConfig(validatedData);
      res.json(config);
    } catch (error) {
      console.error("Error creating scraping config:", error);
      res.status(500).json({ error: "Failed to create scraping configuration" });
    }
  });

  app.put("/api/admin/scraping-configs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.updateScrapingConfig(id, req.body);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Scraping configuration not found" });
      }
    } catch (error) {
      console.error("Error updating scraping config:", error);
      res.status(500).json({ error: "Failed to update scraping configuration" });
    }
  });

  app.delete("/api/admin/scraping-configs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteScrapingConfig(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Scraping configuration not found" });
      }
    } catch (error) {
      console.error("Error deleting scraping config:", error);
      res.status(500).json({ error: "Failed to delete scraping configuration" });
    }
  });

  // Municipality API routes
  app.get("/api/admin/municipalities", async (req, res) => {
    try {
      const municipalities = await storage.getAllMunicipalities();
      res.json(municipalities);
    } catch (error) {
      console.error("Error fetching municipalities:", error);
      res.status(500).json({ error: "Failed to fetch municipalities" });
    }
  });

  app.get("/api/municipalities/by-postcode/:postcode", async (req, res) => {
    try {
      const { postcode } = req.params;
      const municipality = await storage.getMunicipalityByPostcode(postcode);
      if (municipality) {
        res.json(municipality);
      } else {
        res.status(404).json({ error: "Municipality not found for postcode" });
      }
    } catch (error) {
      console.error("Error fetching municipality by postcode:", error);
      res.status(500).json({ error: "Failed to fetch municipality" });
    }
  });

  app.post("/api/admin/municipalities", async (req, res) => {
    try {
      const validatedData = insertMunicipalitySchema.parse(req.body);
      const municipality = await storage.createMunicipality(validatedData);
      res.json(municipality);
    } catch (error) {
      console.error("Error creating municipality:", error);
      res.status(500).json({ error: "Failed to create municipality" });
    }
  });

  app.put("/api/admin/municipalities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.updateMunicipality(id, req.body);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Municipality not found" });
      }
    } catch (error) {
      console.error("Error updating municipality:", error);
      res.status(500).json({ error: "Failed to update municipality" });
    }
  });

  app.delete("/api/admin/municipalities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteMunicipality(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Municipality not found" });
      }
    } catch (error) {
      console.error("Error deleting municipality:", error);
      res.status(500).json({ error: "Failed to delete municipality" });
    }
  });

  // Scraped Reports API
  app.get("/api/admin/scraped-reports", async (req, res) => {
    try {
      const status = req.query.status as string;
      let reports;
      
      if (status && status !== 'all') {
        reports = await storage.getScrapedReportsByStatus(status);
      } else {
        reports = await storage.getAllScrapedReports();
      }
      
      res.json(reports);
    } catch (error) {
      console.error("Error fetching scraped reports:", error);
      res.status(500).json({ error: "Failed to fetch scraped reports" });
    }
  });

  app.put("/api/admin/scraped-reports/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const success = await storage.updateScrapedReportStatus(id, status, 'admin');
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Scraped report not found" });
      }
    } catch (error) {
      console.error("Error updating scraped report status:", error);
      res.status(500).json({ error: "Failed to update scraped report status" });
    }
  });

  app.delete("/api/admin/scraped-reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteScrapedReport(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Scraped report not found" });
      }
    } catch (error) {
      console.error("Error deleting scraped report:", error);
      res.status(500).json({ error: "Failed to delete scraped report" });
    }
  });

  // Manual News Scraping Trigger
  app.post("/api/admin/scrape-news", async (req, res) => {
    try {
      const { postcode, keywords } = req.body;
      
      if (!postcode || !keywords || !Array.isArray(keywords)) {
        return res.status(400).json({ error: "postcode and keywords array are required" });
      }
      
      console.log(`Starting manual news scraping for postcode ${postcode} with keywords:`, keywords);
      
      // Scrape news
      const scrapingResult = await newsScraper.scrapeNews(postcode, keywords);
      
      if (!scrapingResult.success) {
        return res.status(500).json({ error: scrapingResult.error });
      }
      
      // Process and save results
      const savedCount = await newsScraper.processAndSaveScrapedNews(scrapingResult.results, postcode);
      
      // Update last scraped timestamp
      const configs = await storage.getScrapingConfigs();
      const config = configs.find(c => c.postcode === postcode);
      if (config) {
        await storage.updateScrapingConfig(config.id, { lastScrapedAt: new Date() });
      }
      
      res.json({
        success: true,
        totalFound: scrapingResult.results.length,
        savedCount,
        message: `Found ${scrapingResult.results.length} articles, saved ${savedCount} incident-related reports`
      });
    } catch (error) {
      console.error("Error during manual scraping:", error);
      res.status(500).json({ error: "Failed to scrape news" });
    }
  });

  // AI Moderation Test Endpoint
  app.post("/api/admin/moderation-test", async (req, res) => {
    try {
      const startTime = Date.now();
      
      // Test case 1: Inappropriate content (should be blocked)
      const inappropriateTestData = {
        title: "neger gespot bij bushalte",
        description: "neger gespot bij bushalte vanmorgen",
        category: "degradation",
        subcategory: "Littering", 
        involvementType: "witness",
        authoritiesContacted: "false"
      };

      // Test case 2: Appropriate content (should be approved and formalized)
      const appropriateTestData = {
        title: "mooie varens in het bos",
        description: "schone natuur aangetroffen tijdens wandeling",
        category: "status",
        involvementType: "witness", 
        authoritiesContacted: "false"
      };

      const results = [];

      // Test 1: Submit inappropriate content
      console.log("MODERATION TEST: Starting test 1 (inappropriate content)");
      const test1Start = Date.now();
      try {
        const test1FormData = new FormData();
        Object.entries(inappropriateTestData).forEach(([key, value]) => {
          test1FormData.append(key, value);
        });
        
        const test1Response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/reports`, {
          method: 'POST',
          body: test1FormData
        });
        
        const test1ResponseData = await test1Response.text();
        let test1ParsedData;
        try {
          test1ParsedData = JSON.parse(test1ResponseData);
        } catch {
          test1ParsedData = test1ResponseData;
        }

        // Evaluate if test 1 passed (inappropriate content should be blocked = 400)
        const test1Passed = test1Response.status === 400;
        
        results.push({
          id: "inappropriate",
          testData: inappropriateTestData,
          expected: "Should be BLOCKED (400 status)",
          passed: test1Passed,
          submissionResult: {
            success: test1Response.ok,
            status: test1Response.status,
            response: test1ParsedData,
            durationMs: Date.now() - test1Start
          }
        });
      } catch (error) {
        results.push({
          id: "inappropriate",
          testData: inappropriateTestData,
          expected: "Should be BLOCKED (400 status)",
          passed: false,
          submissionResult: {
            success: false,
            status: 0,
            response: { error: error instanceof Error ? error.message : String(error) },
            durationMs: Date.now() - test1Start
          }
        });
      }

      // Wait 2 seconds between tests to prevent server overload
      console.log("MODERATION TEST: Waiting 2 seconds before test 2...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 2: Submit appropriate content
      console.log("MODERATION TEST: Starting test 2 (appropriate content)");
      const test2Start = Date.now();
      try {
        const test2FormData = new FormData();
        Object.entries(appropriateTestData).forEach(([key, value]) => {
          test2FormData.append(key, value);
        });
        
        const test2Response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/reports`, {
          method: 'POST',
          body: test2FormData
        });
        
        const test2ResponseData = await test2Response.text();
        let test2ParsedData;
        try {
          test2ParsedData = JSON.parse(test2ResponseData);
        } catch {
          test2ParsedData = test2ResponseData;
        }

        // Evaluate if test 2 passed (appropriate content should be approved = 201)
        const test2Passed = test2Response.status === 201;
        
        results.push({
          id: "appropriate",
          testData: appropriateTestData,
          expected: "Should be APPROVED (201 status)",
          passed: test2Passed,
          submissionResult: {
            success: test2Response.ok,
            status: test2Response.status,
            response: test2ParsedData,
            durationMs: Date.now() - test2Start
          }
        });
      } catch (error) {
        results.push({
          id: "appropriate", 
          testData: appropriateTestData,
          expected: "Should be APPROVED (201 status)",
          passed: false,
          submissionResult: {
            success: false,
            status: 0,
            response: { error: error instanceof Error ? error.message : String(error) },
            durationMs: Date.now() - test2Start
          }
        });
      }

      const totalDuration = Date.now() - startTime;
      console.log("MODERATION TEST: Completed both tests");

      // Calculate summary
      const testsPassed = results.filter(r => r.passed).length;
      const totalTests = results.length;
      const allTestsPassed = testsPassed === totalTests;

      res.json({
        startedAt: new Date(startTime).toISOString(),
        totalDurationMs: totalDuration,
        serverDelay: 2000,
        summary: {
          passed: testsPassed,
          total: totalTests,
          allPassed: allTestsPassed,
          status: allTestsPassed ? "ALL_TESTS_PASSED" : "SOME_TESTS_FAILED"
        },
        tests: results
      });

    } catch (error) {
      console.error("Error running moderation test:", error);
      res.status(500).json({ error: "Failed to run moderation test" });
    }
  });

  // Serve uploaded images
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}