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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  moderationStatus: true,
  moderationReason: true,
  isModerated: true,
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
