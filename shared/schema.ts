import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
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
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  textOnPrimary: text("text_on_primary").default("#FFFFFF"),
  textOnSecondary: text("text_on_secondary").default("#111111"),
  brandStyle: text("brand_style").default("classic"),
  instagramHandle: text("instagram_handle"),
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

  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  nationality: text("nationality"),
  email: text("email").unique(),
  residentialCountry: text("residential_country"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactNumber: text("emergency_contact_number"),

  registrationType: text("registration_type"),
  position: text("position"),
  playingLevel: text("playing_level"),
  height: text("height"),
  weight: text("weight"),
  medicalConditions: text("medical_conditions"),
  previousClubs: text("previous_clubs"),

  coachingCertification: text("coaching_certification"),
  coachingExperience: text("coaching_experience"),
  teamCoached: text("team_coached"),
  coachingSpecialization: text("coaching_specialization"),

  personnelRole: text("personnel_role"),
  personnelQualifications: text("personnel_qualifications"),
  personnelExperience: text("personnel_experience"),

  photoConsent: boolean("photo_consent"),
  dataConsent: boolean("data_consent"),
  profileCompleted: boolean("profile_completed").default(false),
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

export const ADMIN_ROLES = ["teambase_admin", "federation_admin", "club_admin"] as const;
export const ALL_ROLES = ["player", "coach", "personnel", "supporter", ...ADMIN_ROLES] as const;

export function isAnyAdmin(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function isTeambaseAdmin(role: string): boolean {
  return role === "teambase_admin";
}

export function isFederationAdminOrAbove(role: string): boolean {
  return role === "teambase_admin" || role === "federation_admin";
}

export function canAssignRole(assignerRole: string, targetRole: string): boolean {
  if (!isAnyAdmin(assignerRole)) return false;
  if (assignerRole === "teambase_admin") return true;
  if (assignerRole === "federation_admin") {
    return !["teambase_admin", "federation_admin"].includes(targetRole);
  }
  return false;
}

export const insertFederationSchema = createInsertSchema(federations).omit({ id: true });
export const insertClubSchema = createInsertSchema(clubs).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, xpTotal: true, tier: true, createdAt: true, profileCompleted: true });
export const insertMembershipSchema = createInsertSchema(memberships).omit({ id: true, joinedAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, checkedInAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertXpTransactionSchema = createInsertSchema(xpTransactions).omit({ id: true, createdAt: true });

export const quickRegisterSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number required"),
});

export const loginSchema = z.object({
  phone: z.string().min(1, "Phone number required"),
  password: z.string().min(1, "Password required"),
});

export const emailRegisterSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const emailLoginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

export const profileUpdateSchema = z.object({
  photoUrl: z.string().optional().nullable(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  nationality: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  residentialCountry: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  role: z.enum(["player", "coach", "personnel", "supporter"]).optional(),
  preferredLanguage: z.enum(["en", "sw"]).optional(),
  registrationType: z.enum(["new", "renewal"]).optional(),
  clubId: z.number().optional(),
  position: z.string().optional(),
  playingLevel: z.enum(["youth", "senior", "veteran"]).optional().or(z.literal("")),
  height: z.string().optional(),
  weight: z.string().optional(),
  medicalConditions: z.string().optional(),
  previousClubs: z.string().optional(),
  coachingCertification: z.string().optional(),
  coachingExperience: z.string().optional(),
  teamCoached: z.string().optional(),
  coachingSpecialization: z.string().optional(),
  personnelRole: z.string().optional(),
  personnelQualifications: z.string().optional(),
  personnelExperience: z.string().optional(),
  photoConsent: z.boolean().optional(),
  dataConsent: z.boolean().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const setPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const adminUpdateEventSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(["training", "match", "tournament", "touch_rugby", "social"]).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  clubId: z.number().optional(),
});

export const adminUpdateClubSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  trainingSchedule: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  textOnPrimary: z.string().optional().nullable(),
  textOnSecondary: z.string().optional().nullable(),
  brandStyle: z.string().optional().nullable(),
  instagramHandle: z.string().optional().nullable(),
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

export function calculateProfileCompletion(user: Omit<User, "password">): number {
  const requiredFields = [
    user.fullName,
    user.phone,
    user.photoUrl,
    user.dateOfBirth,
    user.gender,
    user.nationality,
    user.emergencyContactName,
    user.emergencyContactNumber,
    user.role && user.role !== "player" ? user.role : user.role,
    user.photoConsent !== null ? "set" : null,
    user.dataConsent !== null ? "set" : null,
  ];

  const optionalFields = [
    user.email,
    user.residentialCountry,
    user.registrationType,
  ];

  const roleFields: (string | null | undefined)[] = [];
  if (user.role === "player") {
    roleFields.push(user.position, user.playingLevel);
  } else if (user.role === "coach") {
    roleFields.push(user.coachingCertification, user.teamCoached);
  } else if (user.role === "personnel") {
    roleFields.push(user.personnelRole);
  }

  const allFields = [...requiredFields, ...optionalFields, ...roleFields];
  const filledCount = allFields.filter((f) => f !== null && f !== undefined && f !== "").length;
  return Math.round((filledCount / allFields.length) * 100);
}

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id"),
  federationId: integer("federation_id").notNull().default(1),
  authorId: integer("author_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  priority: text("priority").notNull().default("normal"),
  pinned: boolean("pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matchResults = pgTable("match_results", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().unique(),
  homeClubId: integer("home_club_id"),
  awayClubId: integer("away_club_id"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  homeTeam: text("home_team"),
  awayTeam: text("away_team"),
  period: text("period"),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matchLineups = pgTable("match_lineups", {
  id: serial("id").primaryKey(),
  matchResultId: integer("match_result_id").notNull(),
  playerId: integer("player_id").notNull(),
  team: text("team").notNull(),
  position: text("position"),
  jerseyNumber: integer("jersey_number"),
  starting: boolean("starting").default(false),
  captain: boolean("captain").default(false),
  substitutions: integer("substitutions").default(0),
});

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNoticeSchema = createInsertSchema(notices).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertMatchResultSchema = createInsertSchema(matchResults).omit({ id: true, createdAt: true });
export const insertMatchLineupSchema = createInsertSchema(matchLineups).omit({ id: true });
export const insertAppSettingSchema = createInsertSchema(appSettings).omit({ id: true, updatedAt: true });

export const noticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  clubId: z.number().optional().nullable(),
  priority: z.enum(["normal", "high", "urgent"]).optional(),
  pinned: z.boolean().optional(),
});

export const matchResultSchema = z.object({
  eventId: z.number(),
  homeClubId: z.number().optional().nullable(),
  awayClubId: z.number().optional().nullable(),
  homeScore: z.number().optional().nullable(),
  awayScore: z.number().optional().nullable(),
  homeTeam: z.string().optional().nullable(),
  awayTeam: z.string().optional().nullable(),
  period: z.string().optional().nullable(),
  status: z.enum(["scheduled", "in_progress", "finished", "cancelled"]).optional(),
  notes: z.string().optional().nullable(),
});

export const lineupEntrySchema = z.object({
  playerId: z.number(),
  team: z.enum(["home", "away"]),
  position: z.string().optional().nullable(),
  jerseyNumber: z.number().optional().nullable(),
  starting: z.boolean().optional(),
  captain: z.boolean().optional(),
});

export const createUserAdminSchema = z.object({
  fullName: z.string().min(2, "Name too short"),
  phone: z.string().min(9, "Phone required").optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, "Password min 6 chars"),
  role: z.enum(ALL_ROLES).optional(),
  clubId: z.number().optional(),
});

export const appSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().nullable(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type MatchResult = typeof matchResults.$inferSelect;
export type InsertMatchResult = z.infer<typeof insertMatchResultSchema>;
export type MatchLineup = typeof matchLineups.$inferSelect;
export type InsertMatchLineup = z.infer<typeof insertMatchLineupSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
