import { 
  reports, 
  scrapedReports, 
  scrapingConfig,
  type Report, 
  type InsertReport,
  type ScrapedReport,
  type InsertScrapedReport,
  type ScrapingConfig,
  type InsertScrapingConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { promises as fs } from 'fs';
import * as path from 'path';

export interface IStorage {
  getReport(id: string): Promise<Report | undefined>;
  getAllReports(): Promise<Report[]>; // Admin: All reports including rejected
  getAllPublicReports(): Promise<Report[]>; // Public: Only approved reports
  getReportsByCategory(category: string): Promise<Report[]>; // Admin: All reports by category
  getPublicReportsByCategory(category: string): Promise<Report[]>; // Public: Only approved reports by category
  createReport(report: InsertReport): Promise<Report>;
  createReportWithModeration(report: any): Promise<Report>; // For AI moderated reports
  deleteReport(id: string): Promise<boolean>;
  deleteAllReports(): Promise<boolean>; // Add admin function
  // Legacy moderation prompt methods
  getModerationPrompt(): Promise<string | null>;
  saveModerationPrompt(prompt: string): Promise<void>;
  // New separated moderation prompt methods
  getModerationPrompts(): Promise<{contentFilter: string | null, textFormalization: string | null}>;
  saveModerationPrompts(prompts: {contentFilter: string, textFormalization: string}): Promise<void>;
  
  // Scraped Reports methods
  getAllScrapedReports(): Promise<ScrapedReport[]>;
  getScrapedReportsByStatus(status: string): Promise<ScrapedReport[]>;
  createScrapedReport(report: InsertScrapedReport): Promise<ScrapedReport>;
  updateScrapedReportStatus(id: string, status: string, approvedBy?: string): Promise<boolean>;
  deleteScrapedReport(id: string): Promise<boolean>;
  
  // Scraping Configuration methods
  getScrapingConfigs(): Promise<ScrapingConfig[]>;
  createScrapingConfig(config: InsertScrapingConfig): Promise<ScrapingConfig>;
  updateScrapingConfig(id: string, config: Partial<ScrapingConfig>): Promise<boolean>;
  deleteScrapingConfig(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getAllReports(): Promise<Report[]> {
    // Admin: Get ALL reports including rejected ones
    console.log("DEBUG - getAllReports called");
    const result = await db.select().from(reports);
    console.log("DEBUG - getAllReports result:", result.length, "reports found");
    return result;
  }

  async getAllPublicReports(): Promise<Report[]> {
    // Public: Only get approved reports that are marked as public
    return await db.select().from(reports)
      .where(eq(reports.isPublic, true));
  }

  async getReportsByCategory(category: string): Promise<Report[]> {
    // Admin: All reports by category including rejected
    return await db.select().from(reports)
      .where(eq(reports.category, category));
  }

  async getPublicReportsByCategory(category: string): Promise<Report[]> {
    // Public: Only approved reports by category
    return await db.select().from(reports)
      .where(and(eq(reports.category, category), eq(reports.isPublic, true)));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values({
        ...insertReport,
        incidentDateTime: insertReport.incidentDateTime ? new Date(insertReport.incidentDateTime) : null,
      })
      .returning();
    return report;
  }

  async createReportWithModeration(reportData: any): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values({
        ...reportData,
        incidentDateTime: reportData.incidentDateTime ? new Date(reportData.incidentDateTime) : null,
      })
      .returning();
    return report;
  }

  async deleteReport(id: string): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteAllReports(): Promise<boolean> {
    try {
      await db.delete(reports);
      console.log("All reports deleted from database");
      return true;
    } catch (error) {
      console.error("Error deleting all reports:", error);
      return false;
    }
  }

  // Legacy methods for backward compatibility
  async getModerationPrompt(): Promise<string | null> {
    try {
      const promptPath = path.join(process.cwd(), 'moderation-prompt.txt');
      try {
        const prompt = await fs.readFile(promptPath, 'utf-8');
        return prompt;
      } catch (error) {
        return null;
      }
    } catch (error) {
      console.error("Error fetching moderation prompt:", error);
      return null;
    }
  }

  async saveModerationPrompt(prompt: string): Promise<void> {
    try {
      const promptPath = path.join(process.cwd(), 'moderation-prompt.txt');
      await fs.writeFile(promptPath, prompt, 'utf-8');
      console.log("Moderation prompt saved successfully");
    } catch (error) {
      console.error("Error saving moderation prompt:", error);
      throw error;
    }
  }

  // New methods for separated moderation prompts
  async getModerationPrompts(): Promise<{contentFilter: string | null, textFormalization: string | null}> {
    try {
      const contentFilterPath = path.join(process.cwd(), 'content-filter-prompt.txt');
      const textFormalizationPath = path.join(process.cwd(), 'text-formalization-prompt.txt');
      
      let contentFilter = null;
      let textFormalization = null;
      
      try {
        contentFilter = await fs.readFile(contentFilterPath, 'utf-8');
      } catch (error) {
        // File doesn't exist yet
      }
      
      try {
        textFormalization = await fs.readFile(textFormalizationPath, 'utf-8');
      } catch (error) {
        // File doesn't exist yet
      }
      
      return { contentFilter, textFormalization };
    } catch (error) {
      console.error("Error fetching moderation prompts:", error);
      return { contentFilter: null, textFormalization: null };
    }
  }

  async saveModerationPrompts(prompts: {contentFilter: string, textFormalization: string}): Promise<void> {
    try {
      const contentFilterPath = path.join(process.cwd(), 'content-filter-prompt.txt');
      const textFormalizationPath = path.join(process.cwd(), 'text-formalization-prompt.txt');
      
      await Promise.all([
        fs.writeFile(contentFilterPath, prompts.contentFilter, 'utf-8'),
        fs.writeFile(textFormalizationPath, prompts.textFormalization, 'utf-8')
      ]);
      
      console.log("Moderation prompts saved successfully");
    } catch (error) {
      console.error("Error saving moderation prompts:", error);
      throw error;
    }
  }

  // Scraped Reports methods implementation
  async getAllScrapedReports(): Promise<ScrapedReport[]> {
    return await db.select().from(scrapedReports).orderBy(desc(scrapedReports.scrapedAt));
  }

  async getScrapedReportsByStatus(status: string): Promise<ScrapedReport[]> {
    return await db.select().from(scrapedReports)
      .where(eq(scrapedReports.status, status))
      .orderBy(desc(scrapedReports.scrapedAt));
  }

  async createScrapedReport(insertScrapedReport: InsertScrapedReport): Promise<ScrapedReport> {
    const [scrapedReport] = await db
      .insert(scrapedReports)
      .values({
        ...insertScrapedReport,
        publishedAt: insertScrapedReport.publishedAt ? new Date(insertScrapedReport.publishedAt) : null,
      })
      .returning();
    return scrapedReport;
  }

  async updateScrapedReportStatus(id: string, status: string, approvedBy?: string): Promise<boolean> {
    const updateData: any = { status };
    if (approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    
    const result = await db.update(scrapedReports)
      .set(updateData)
      .where(eq(scrapedReports.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteScrapedReport(id: string): Promise<boolean> {
    const result = await db.delete(scrapedReports).where(eq(scrapedReports.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Scraping Configuration methods implementation
  async getScrapingConfigs(): Promise<ScrapingConfig[]> {
    return await db.select().from(scrapingConfig).orderBy(desc(scrapingConfig.createdAt));
  }

  async createScrapingConfig(insertConfig: InsertScrapingConfig): Promise<ScrapingConfig> {
    const [config] = await db
      .insert(scrapingConfig)
      .values(insertConfig)
      .returning();
    return config;
  }

  async updateScrapingConfig(id: string, configUpdate: Partial<ScrapingConfig>): Promise<boolean> {
    const result = await db.update(scrapingConfig)
      .set(configUpdate)
      .where(eq(scrapingConfig.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteScrapingConfig(id: string): Promise<boolean> {
    const result = await db.delete(scrapingConfig).where(eq(scrapingConfig.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();