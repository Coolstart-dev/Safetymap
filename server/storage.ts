import { type Report, type InsertReport } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getReport(id: string): Promise<Report | undefined>;
  getAllReports(): Promise<Report[]>;
  getReportsByCategory(category: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  deleteReport(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private reports: Map<string, Report>;

  constructor() {
    this.reports = new Map();
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getReportsByCategory(category: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...insertReport,
      id,
      createdAt: new Date(),
      subcategory: insertReport.subcategory || null,
      latitude: insertReport.latitude || null,
      longitude: insertReport.longitude || null,
      locationDescription: insertReport.locationDescription || null,
      imageUrl: insertReport.imageUrl || null,
      authoritiesContacted: insertReport.authoritiesContacted || false,
      incidentDateTime: insertReport.incidentDateTime ? new Date(insertReport.incidentDateTime) : null,
    };
    this.reports.set(id, report);
    return report;
  }

  async deleteReport(id: string): Promise<boolean> {
    return this.reports.delete(id);
  }
}

export const storage = new MemStorage();
