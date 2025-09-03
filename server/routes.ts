import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { AIContentModerator } from "./ai";

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
  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      const category = req.query.category as string;
      let reports;
      
      if (category && category !== 'all') {
        reports = await storage.getReportsByCategory(category);
      } else {
        reports = await storage.getAllReports();
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
      
      // Check if content should be auto-rejected
      if (moderator.shouldAutoReject(moderationResult)) {
        return res.status(400).json({ 
          error: "Content rejected by moderation",
          reason: moderationResult.reason || "Content appears to be spam or inappropriate"
        });
      }
      
      // Prepare report data with moderation results
      const finalReportData = {
        ...validatedData,
        originalTitle: validatedData.title,
        originalDescription: validatedData.description,
        title: moderator.shouldUseModeratedVersion(moderationResult) 
          ? moderationResult.moderatedTitle 
          : validatedData.title,
        description: moderator.shouldUseModeratedVersion(moderationResult) 
          ? moderationResult.moderatedDescription 
          : validatedData.description,
        moderationStatus: moderationResult.isApproved ? 'approved' : 'pending',
        moderationReason: moderationResult.reason || null,
        isModerated: moderator.shouldUseModeratedVersion(moderationResult),
      };
      
      const report = await storage.createReportWithModeration(finalReportData);
      
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

  // Admin route - Delete all reports (for testing)
  app.delete("/api/admin/reports", async (req, res) => {
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
