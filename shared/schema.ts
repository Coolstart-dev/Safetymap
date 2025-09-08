import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  originalTitle: text("original_title"), // Store original user input
  originalDescription: text("original_description"), // Store original user input
  category: varchar("category", { length: 50 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationDescription: text("location_description"),
  imageUrl: text("image_url"),
  authoritiesContacted: boolean("authorities_contacted").default(false),
  involvementType: varchar("involvement_type", { length: 20 }).notNull(), // 'victim' or 'witness'
  incidentDateTime: timestamp("incident_date_time"), // When the incident actually occurred
  moderationStatus: varchar("moderation_status", { length: 20 }).default("approved"), // 'approved', 'rejected', 'pending'
  moderationReason: text("moderation_reason"), // Why it was rejected/modified
  isModerated: boolean("is_moderated").default(false), // Whether AI modified the content
  isPublic: boolean("is_public").default(true), // Whether report is visible to public (false for rejected reports)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  moderationStatus: true,
  moderationReason: true,
  isModerated: true,
  isPublic: true,
  originalTitle: true,
  originalDescription: true,
}).extend({
  // Make optional fields explicitly optional
  subcategory: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  locationDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  authoritiesContacted: z.boolean().optional().default(false),
  incidentDateTime: z.string().optional(), // ISO datetime string
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Category definitions
export const categories = {
  harassment: {
    name: "Personal Harassment",
    color: "#ef4444",
    subcategories: ["Physical aggression", "Unwanted behavior", "Threats"]
  },
  suspicious: {
    name: "Suspicious Activity", 
    color: "#f97316",
    subcategories: ["Strange behavior", "Suspicious noises"]
  },
  dangerous: {
    name: "Dangerous Situation",
    color: "#dc2626", 
    subcategories: ["Objects blocking road", "Slippery surfaces", "Dangerous animals", "Other"]
  },
  degradation: {
    name: "Public Space Degradation",
    color: "#8b5cf6",
    subcategories: ["Littering", "Illegal dumping", "Nighttime noise", "Dog fouling", "Graffiti", "Vandalism"]
  },
  theft: {
    name: "Theft & Vandalism",
    color: "#06b6d4",
    subcategories: ["Bike theft", "Property damage", "Porch piracy", "Pickpocketing"]
  },
  cyber: {
    name: "Cybercrime",
    color: "#ec4899", 
    subcategories: ["Online threats", "Identity theft", "Fraud"]
  }
} as const;

export type CategoryKey = keyof typeof categories;

// News Scraped Reports schema
export const scrapedReports = pgTable("scraped_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  sourceUrl: text("source_url").notNull(),
  sourceName: text("source_name").notNull(),
  sourceFavicon: text("source_favicon"),
  publishedAt: timestamp("published_at"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  postcode: varchar("postcode", { length: 10 }),
  location: text("location"),
  category: varchar("category", { length: 50 }),
  confidence: real("confidence"), // AI confidence score (0-1)
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'approved', 'rejected', 'published'
  aiAnalysis: json("ai_analysis"), // Store full AI analysis result
  extractedData: json("extracted_data"), // Coordinates, incident type, etc.
  approvedBy: varchar("approved_by", { length: 100 }),
  approvedAt: timestamp("approved_at"),
  reportId: varchar("report_id"), // Link to actual report when approved
});

export const insertScrapedReportSchema = createInsertSchema(scrapedReports).omit({
  id: true,
  scrapedAt: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  reportId: true,
});

export type InsertScrapedReport = z.infer<typeof insertScrapedReportSchema>;
export type ScrapedReport = typeof scrapedReports.$inferSelect;

// News Scraping Configuration schema
export const scrapingConfig = pgTable("scraping_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postcode: varchar("postcode", { length: 10 }).notNull(),
  keywords: json("keywords").$type<string[]>().notNull(), // Array of keywords
  isActive: boolean("is_active").default(true),
  isManual: boolean("is_manual").default(true), // Manual vs automatic scraping
  lastScrapedAt: timestamp("last_scraped_at"),
  scrapingFrequency: varchar("scraping_frequency", { length: 20 }).default("daily"), // 'hourly', 'daily', 'weekly'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScrapingConfigSchema = createInsertSchema(scrapingConfig).omit({
  id: true,
  createdAt: true,
  lastScrapedAt: true,
});

export type InsertScrapingConfig = z.infer<typeof insertScrapingConfigSchema>;
export type ScrapingConfig = typeof scrapingConfig.$inferSelect;

// Municipalities schema for context-aware reporting suggestions
export const municipalities = pgTable("municipalities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g. "Wijnegem"
  postcode: varchar("postcode", { length: 10 }).notNull(), // e.g. "2110"
  reportingUrl: text("reporting_url").notNull(), // Official municipality reporting URL
  alternativeUrl: text("alternative_url"), // Secondary reporting URL if available
  isActive: boolean("is_active").default(true),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMunicipalitySchema = createInsertSchema(municipalities).omit({
  id: true,
  createdAt: true,
  lastChecked: true,
});

export type InsertMunicipality = z.infer<typeof insertMunicipalitySchema>;
export type Municipality = typeof municipalities.$inferSelect;
