import { db } from "./db";
import { federations, clubs, users, memberships, events, activities, xpTransactions, notices, appSettings, auditLogs } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  const legacyResult = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`);
  const legacyCount = Number((legacyResult as any).rows?.[0]?.count ?? (legacyResult as any)[0]?.count ?? 0);
  if (legacyCount > 0) {
    await db.execute(sql`UPDATE users SET role = 'federation_admin' WHERE role = 'admin'`);
    console.log("Migrated legacy 'admin' roles to 'federation_admin'");
  }

  const existing = await db.select().from(federations);
  const existingNotices = await db.select().from(notices);
  if (existing.length > 0 && existingNotices.length > 0) return;

  const [zrf] = await db.insert(federations).values({
    name: "Zanzibar Rugby Federation",
    country: "Tanzania",
    logo: null,
  }).returning();

  const [sharks] = await db.insert(clubs).values({
    federationId: zrf.id,
    name: "Sharks RFC",
    location: "Stone Town, Zanzibar",
    description: "Founded in 2015, Sharks RFC is the premier rugby club in Zanzibar. Known for their fierce competitiveness and strong youth development programs.",
    trainingSchedule: "Tuesday & Thursday 5:00 PM, Saturday 9:00 AM",
    primaryColor: "#0A2342",
    secondaryColor: "#C8A951",
    accentColor: "#FFD700",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#111111",
    brandStyle: "classic",
  }).returning();

  const [stoneTown] = await db.insert(clubs).values({
    federationId: zrf.id,
    name: "Stone Town RFC",
    location: "Shangani, Stone Town",
    description: "A community-driven rugby club rooted in the heart of Stone Town. Focused on inclusivity and bringing rugby to everyone.",
    trainingSchedule: "Monday & Wednesday 5:30 PM, Saturday 10:00 AM",
    primaryColor: "#8B0000",
    secondaryColor: "#FFFFFF",
    accentColor: "#DC143C",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#111111",
    brandStyle: "bold",
  }).returning();

  const [pemba] = await db.insert(clubs).values({
    federationId: zrf.id,
    name: "Pemba RFC",
    location: "Chake Chake, Pemba",
    description: "Representing Pemba Island in Zanzibar rugby. Growing the sport across the island with passion and dedication.",
    trainingSchedule: "Wednesday & Friday 4:30 PM, Sunday 8:00 AM",
    primaryColor: "#006400",
    secondaryColor: "#000000",
    accentColor: "#32CD32",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#FFFFFF",
    brandStyle: "classic",
  }).returning();

  const hashedPw = await hashPassword("rugby123");

  async function ensureUser(data: any) {
    const existing = await db.select().from(users).where(eq(users.phone, data.phone));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(users).values(data).returning();
    return created;
  }

  const user1 = await ensureUser({
    federationId: zrf.id,
    fullName: "Juma Hassan",
    phone: "+255777100001",
    password: hashedPw,
    role: "player",
    preferredLanguage: "sw",
    xpTotal: 450,
    tier: "blue",
  });

  const user2 = await ensureUser({
    federationId: zrf.id,
    fullName: "Amina Said",
    phone: "+255777100002",
    password: hashedPw,
    role: "coach",
    preferredLanguage: "en",
    xpTotal: 820,
    tier: "silver",
  });

  const user3 = await ensureUser({
    federationId: zrf.id,
    fullName: "Bakari Mohamed",
    phone: "+255777100003",
    password: hashedPw,
    role: "player",
    preferredLanguage: "en",
    xpTotal: 280,
    tier: "blue",
  });

  const user4 = await ensureUser({
    federationId: zrf.id,
    fullName: "Fatma Ali",
    phone: "+255777100004",
    password: hashedPw,
    role: "club_admin",
    preferredLanguage: "sw",
    xpTotal: 150,
    tier: "green",
  });

  const user5 = await ensureUser({
    federationId: zrf.id,
    fullName: "Omar Khamis",
    phone: "+255777100005",
    password: hashedPw,
    role: "federation_admin",
    preferredLanguage: "en",
    xpTotal: 1100,
    tier: "gold",
  });

  const user6 = await ensureUser({
    federationId: zrf.id,
    fullName: "Salma Rashid",
    phone: "+255777100006",
    password: hashedPw,
    role: "supporter",
    preferredLanguage: "sw",
    xpTotal: 75,
    tier: "green",
  });

  const user7 = await ensureUser({
    federationId: zrf.id,
    fullName: "Peter Cheek",
    phone: "+255777100007",
    password: hashedPw,
    role: "teambase_admin",
    preferredLanguage: "en",
    xpTotal: 9999,
    tier: "gold",
  });

  const user8 = await ensureUser({
    federationId: zrf.id,
    fullName: "Dr. Mwanaidi Juma",
    phone: "+255777100008",
    password: hashedPw,
    role: "personnel",
    personnelRole: "Team Medic",
    personnelQualifications: "BSc Physiotherapy, Sports First Aid",
    personnelExperience: "5 years with Zanzibar sports teams",
    preferredLanguage: "sw",
    xpTotal: 320,
    tier: "blue",
  });

  await db.insert(memberships).values([
    { userId: user1.id, clubId: sharks.id, status: "active" },
    { userId: user2.id, clubId: sharks.id, status: "active" },
    { userId: user3.id, clubId: stoneTown.id, status: "active" },
    { userId: user4.id, clubId: pemba.id, status: "active" },
    { userId: user5.id, clubId: sharks.id, status: "active" },
    { userId: user6.id, clubId: stoneTown.id, status: "active" },
    { userId: user7.id, clubId: sharks.id, status: "active" },
    { userId: user8.id, clubId: pemba.id, status: "active" },
  ]);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextSat = new Date(today);
  nextSat.setDate(today.getDate() + (6 - today.getDay()));

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  await db.insert(events).values([
    {
      clubId: sharks.id,
      federationId: zrf.id,
      title: "Sharks Weekly Training",
      type: "training",
      date: fmt(tomorrow),
      time: "17:00",
      location: "Mnazi Mmoja Grounds, Stone Town",
      description: "Regular training session. All levels welcome. Bring water and cleats.",
    },
    {
      clubId: stoneTown.id,
      federationId: zrf.id,
      title: "Touch Rugby Afternoon",
      type: "touch_rugby",
      date: fmt(nextSat),
      time: "15:00",
      location: "Forodhani Gardens",
      description: "Casual touch rugby session. Open to everyone - no experience needed!",
    },
    {
      clubId: sharks.id,
      federationId: zrf.id,
      title: "Sharks vs Stone Town",
      type: "match",
      date: fmt(nextWeek),
      time: "14:00",
      location: "Amaan Stadium",
      description: "Friendly match between Sharks RFC and Stone Town RFC. Come support your team!",
    },
    {
      clubId: pemba.id,
      federationId: zrf.id,
      title: "Pemba Fitness Camp",
      type: "training",
      date: fmt(nextSat),
      time: "08:00",
      location: "Chake Chake Stadium",
      description: "Intensive fitness and conditioning camp. Prepare for the upcoming season.",
    },
    {
      clubId: sharks.id,
      federationId: zrf.id,
      title: "ZRF Season Opening Tournament",
      type: "tournament",
      date: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 15)),
      time: "09:00",
      location: "Amaan Stadium",
      description: "The official start of the new rugby season. All ZRF clubs competing.",
    },
  ]);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  await db.insert(activities).values([
    { userId: user1.id, type: "gym", date: fmt(yesterday), notes: "Weight training session", xpEarned: 15 },
    { userId: user1.id, type: "running", date: fmt(twoDaysAgo), notes: "5km morning run", xpEarned: 10 },
    { userId: user2.id, type: "saq", date: fmt(yesterday), notes: "Speed and agility drills", xpEarned: 20 },
    { userId: user3.id, type: "watching", date: fmt(yesterday), notes: "Watched Six Nations highlights", xpEarned: 5 },
    { userId: user4.id, type: "running", date: fmt(today), notes: "Beach run Pemba", xpEarned: 10 },
    { userId: user5.id, type: "social", date: fmt(yesterday), notes: "Club social evening", xpEarned: 10 },
  ]);

  await db.insert(xpTransactions).values([
    { userId: user1.id, amount: 15, source: "activity", description: "Gym session" },
    { userId: user1.id, amount: 10, source: "activity", description: "Morning run" },
    { userId: user2.id, amount: 20, source: "activity", description: "SAQ drills" },
    { userId: user3.id, amount: 5, source: "activity", description: "Watched rugby" },
    { userId: user5.id, amount: 10, source: "activity", description: "Club social" },
  ]);

  const noticeCount = await db.select({ id: notices.id }).from(notices).limit(3);
  if (noticeCount.length < 3) {
    await db.insert(notices).values([
      {
        federationId: zrf.id,
        authorId: user5.id,
        title: "Welcome to the Season!",
        body: "The Zanzibar Rugby Federation welcomes all clubs, players, and supporters to the new season. Training schedules are now live on the calendar.",
        priority: "high",
      },
      {
        clubId: sharks.id,
        federationId: zrf.id,
        authorId: user2.id,
        title: "Sharks Tactical Session Friday",
        body: "This Friday we'll have a tactical session ahead of our friendly against Stone Town. All players expected to attend.",
        priority: "normal",
      },
      {
        federationId: zrf.id,
        authorId: user5.id,
        title: "Coaching Clinic Registration Open",
        body: "World Rugby Level 1 coaching course available March 15-16. Limited spots. Contact federation office to register.",
        priority: "normal",
      },
    ]);
  }

  await db.insert(appSettings).values([
    { key: "registration_open", value: JSON.stringify(true) },
    { key: "season_terms", value: JSON.stringify("2025/2026 Season – Zanzibar Rugby Federation") },
    { key: "max_clubs_per_user", value: JSON.stringify(3) },
  ]).onConflictDoNothing();

  await db.insert(auditLogs).values([
    {
      adminId: user5.id,
      action: "seed",
      entityType: "system",
      details: JSON.stringify({ message: "Database seeded with initial data" }),
    },
  ]);

  console.log("Database seeded successfully with ZRF data");
}
