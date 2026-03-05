import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const federations = pgTable("federations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  logo: text("logo"),
});

export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  federationId: integer("federation_id").notNull().default(1),
  name: text("name").notNull(),
  logo: text("logo"),
  location: text("location"),
  description: text("description"),
  trainingSchedule: text("training_schedule"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  federationId: integer("federation_id").notNull().default(1),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  photoUrl: text("photo_url"),
  role: text("role").notNull().default("player"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  xpTotal: integer("xp_total").notNull().default(0),
  tier: text("tier").notNull().default("green"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clubId: integer("club_id").notNull(),
  status: text("status").notNull().default("pending"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull(),
  federationId: integer("federation_id").notNull().default(1),
  title: text("title").notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  checkedInAt: timestamp("checked_in_at").defaultNow(),
  method: text("method").notNull().default("manual"),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  xpEarned: integer("xp_earned").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const xpTransactions = pgTable("xp_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  source: text("source").notNull(),
  sourceId: integer("source_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFederationSchema = createInsertSchema(federations).omit({ id: true });
export const insertClubSchema = createInsertSchema(clubs).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, xpTotal: true, tier: true, createdAt: true });
export const insertMembershipSchema = createInsertSchema(memberships).omit({ id: true, joinedAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, checkedInAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertXpTransactionSchema = createInsertSchema(xpTransactions).omit({ id: true, createdAt: true });

export const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["player", "coach", "supporter", "admin"]).default("player"),
  preferredLanguage: z.enum(["en", "sw"]).default("en"),
  clubId: z.number().optional(),
});

export const loginSchema = z.object({
  phone: z.string().min(1, "Phone number required"),
  password: z.string().min(1, "Password required"),
});

export type Federation = typeof federations.$inferSelect;
export type InsertFederation = z.infer<typeof insertFederationSchema>;
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type InsertXpTransaction = z.infer<typeof insertXpTransactionSchema>;
