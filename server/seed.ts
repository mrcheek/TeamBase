import { db } from "./db";
import { federations, clubs, users, memberships, events, activities, xpTransactions } from "@shared/schema";
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
  const existing = await db.select().from(federations);
  if (existing.length > 0) return;

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
  }).returning();

  const [stoneTown] = await db.insert(clubs).values({
    federationId: zrf.id,
    name: "Stone Town RFC",
    location: "Shangani, Stone Town",
    description: "A community-driven rugby club rooted in the heart of Stone Town. Focused on inclusivity and bringing rugby to everyone.",
    trainingSchedule: "Monday & Wednesday 5:30 PM, Saturday 10:00 AM",
  }).returning();

  const [pemba] = await db.insert(clubs).values({
    federationId: zrf.id,
    name: "Pemba RFC",
    location: "Chake Chake, Pemba",
    description: "Representing Pemba Island in Zanzibar rugby. Growing the sport across the island with passion and dedication.",
    trainingSchedule: "Wednesday & Friday 4:30 PM, Sunday 8:00 AM",
  }).returning();

  const hashedPw = await hashPassword("rugby123");

  const [user1] = await db.insert(users).values({
    federationId: zrf.id,
    fullName: "Juma Hassan",
    phone: "+255777100001",
    password: hashedPw,
    role: "player",
    preferredLanguage: "sw",
    xpTotal: 450,
    tier: "blue",
  }).returning();

  const [user2] = await db.insert(users).values({
    federationId: zrf.id,
    fullName: "Amina Said",
    phone: "+255777100002",
    password: hashedPw,
    role: "coach",
    preferredLanguage: "en",
    xpTotal: 820,
    tier: "silver",
  }).returning();

  const [user3] = await db.insert(users).values({
    federationId: zrf.id,
    fullName: "Bakari Mohamed",
    phone: "+255777100003",
    password: hashedPw,
    role: "player",
    preferredLanguage: "en",
    xpTotal: 280,
    tier: "blue",
  }).returning();

  const [user4] = await db.insert(users).values({
    federationId: zrf.id,
    fullName: "Fatma Ali",
    phone: "+255777100004",
    password: hashedPw,
    role: "player",
    preferredLanguage: "sw",
    xpTotal: 150,
    tier: "green",
  }).returning();

  const [user5] = await db.insert(users).values({
    federationId: zrf.id,
    fullName: "Omar Khamis",
    phone: "+255777100005",
    password: hashedPw,
    role: "admin",
    preferredLanguage: "en",
    xpTotal: 1100,
    tier: "gold",
  }).returning();

  await db.insert(memberships).values([
    { userId: user1.id, clubId: sharks.id, status: "active" },
    { userId: user2.id, clubId: sharks.id, status: "active" },
    { userId: user3.id, clubId: stoneTown.id, status: "active" },
    { userId: user4.id, clubId: pemba.id, status: "active" },
    { userId: user5.id, clubId: sharks.id, status: "active" },
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

  console.log("Database seeded successfully with ZRF data");
}
