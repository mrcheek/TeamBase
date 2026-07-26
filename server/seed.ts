import { db } from "./db";
import { federations, clubs, users, notices, appSettings, auditLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  const hashedPw = await hashPassword("rugby123");

  // Ensure federation + clubs exist
  let zrf = (await db.select().from(federations).limit(1))[0];
  if (!zrf) {
    zrf = (await db.insert(federations).values({ name: "Zanzibar Rugby Federation", country: "Tanzania" }).returning())[0];
  }

  async function ensureClub(name: string, data: any) {
    const existing = await db.select().from(clubs).where(eq(clubs.name, name)).limit(1);
    if (existing.length > 0) return existing[0];
    return (await db.insert(clubs).values({ federationId: zrf.id, ...data }).returning())[0];
  }

  const sharks = await ensureClub("Sharks RFC", {
    location: "Stone Town, Zanzibar",
    description: "Premier rugby club in Zanzibar.",
    trainingSchedule: "Tuesday & Thursday 5:00 PM, Saturday 9:00 AM",
    primaryColor: "#0A2342", secondaryColor: "#C8A951", accentColor: "#FFD700",
    textOnPrimary: "#FFFFFF", textOnSecondary: "#111111", brandStyle: "classic",
  });

  await ensureClub("Stone Town RFC", {
    location: "Shangani, Stone Town",
    description: "Community-driven rugby club in the heart of Stone Town.",
    trainingSchedule: "Monday & Wednesday 5:30 PM, Saturday 10:00 AM",
    primaryColor: "#8B0000", secondaryColor: "#FFFFFF", accentColor: "#DC143C",
    textOnPrimary: "#FFFFFF", textOnSecondary: "#111111", brandStyle: "bold",
  });

  await ensureClub("Pemba RFC", {
    location: "Chake Chake, Pemba",
    description: "Representing Pemba Island in Zanzibar rugby.",
    trainingSchedule: "Wednesday & Friday 4:30 PM, Sunday 8:00 AM",
    primaryColor: "#006400", secondaryColor: "#000000", accentColor: "#32CD32",
    textOnPrimary: "#FFFFFF", textOnSecondary: "#FFFFFF", brandStyle: "classic",
  });

  // Ensure teambase_admin account
  let admin = (await db.select().from(users).where(eq(users.phone, "+255654729774")).limit(1))[0];
  if (!admin) {
    admin = (await db.insert(users).values({
      federationId: zrf.id,
      fullName: "Peter Cheek",
      phone: "+255654729774",
      password: hashedPw,
      role: "teambase_admin",
      preferredLanguage: "en",
      xpTotal: 9999,
      tier: "gold",
    }).returning())[0];
    console.log("Created teambase_admin account");
  }

  // Ensure notices
  const noticeCount = await db.select({ id: notices.id }).from(notices).limit(1);
  if (noticeCount.length === 0) {
    await db.insert(notices).values([
      { federationId: zrf.id, authorId: admin.id, title: "Welcome to the Season!", body: "The Zanzibar Rugby Federation welcomes everyone to the new season.", priority: "high" },
      { clubId: sharks.id, federationId: zrf.id, authorId: admin.id, title: "Training Schedule Live", body: "All training schedules are now available on the calendar.", priority: "normal" },
      { federationId: zrf.id, authorId: admin.id, title: "Coaching Clinic Registration Open", body: "World Rugby Level 1 coaching course. Limited spots.", priority: "normal" },
    ]);
  }

  // Ensure app settings
  await db.insert(appSettings).values([
    { key: "registration_open", value: JSON.stringify(true) },
    { key: "season_terms", value: JSON.stringify("2025/2026 Season – Zanzibar Rugby Federation") },
    { key: "max_clubs_per_user", value: JSON.stringify(3) },
  ]).onConflictDoNothing();

  // Record seed audit event (once)
  const auditCount = await db.select({ id: auditLogs.id }).from(auditLogs).limit(1);
  if (auditCount.length === 0) {
    await db.insert(auditLogs).values([{ adminId: admin.id, action: "seed", entityType: "system", details: JSON.stringify({ message: "Database seeded" }) }]);
  }

  // Clean up any dummy users that might exist from previous seed
  const dummyPhones = ["+255777100001","+255777100002","+255777100003","+255777100004","+255777100005","+255777100006","+255777100008"];
  for (const phone of dummyPhones) {
    await db.delete(users).where(eq(users.phone, phone));
  }

  console.log("Database seeded successfully");
}
