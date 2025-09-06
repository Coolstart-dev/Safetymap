import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { AIContentModerator } from "./ai";
import { GeocodingService } from "./geocoding";

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
  app.get("/api/neighborhood/:postalCode/reports", async (req, res) => {
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
      res.status(500).json({ error: "Failed to fetch neighborhood reports" });
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
      const moderationResult = await moderator.moderateContent(
        validatedData.title || '',
        validatedData.description || ''
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
