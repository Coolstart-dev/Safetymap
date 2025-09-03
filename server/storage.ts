import { reports, type Report, type InsertReport } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getAllReports(): Promise<Report[]> {
    // Admin: Get ALL reports including rejected ones
    return await db.select().from(reports).orderBy(reports.createdAt);
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
      return true;
    } catch (error) {
      console.error('Error deleting all reports:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
