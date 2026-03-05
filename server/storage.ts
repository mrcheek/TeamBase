import { eq, desc, and, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users, clubs, federations, memberships, events, attendance, activities, xpTransactions,
  type User, type InsertUser, type Club, type InsertClub, type Federation, type InsertFederation,
  type Membership, type InsertMembership, type Event, type InsertEvent,
  type Attendance, type InsertAttendance, type Activity, type InsertActivity,
  type XpTransaction, type InsertXpTransaction,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserXp(userId: number, xpAmount: number): Promise<void>;
  updateUserProfile(userId: number, data: Partial<User>): Promise<User | undefined>;

  getFederations(): Promise<Federation[]>;
  createFederation(federation: InsertFederation): Promise<Federation>;

  getClubs(federationId?: number): Promise<Club[]>;
  getClub(id: number): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  getClubMembers(clubId: number): Promise<User[]>;
  getClubScore(clubId: number): Promise<number>;

  getMembership(userId: number, clubId: number): Promise<Membership | undefined>;
  getUserMemberships(userId: number): Promise<(Membership & { club: Club })[]>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembershipStatus(id: number, status: string): Promise<void>;

  getEvents(federationId?: number): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getClubEvents(clubId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;

  getEventAttendance(eventId: number): Promise<(Attendance & { user: User })[]>;
  checkIn(attendance: InsertAttendance): Promise<Attendance>;
  getUserAttendance(userId: number): Promise<Attendance[]>;
  getUserEventAttendance(userId: number, eventId: number): Promise<Attendance | undefined>;

  getUserActivities(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(federationId?: number, limit?: number): Promise<(Activity & { user: User })[]>;

  createXpTransaction(transaction: InsertXpTransaction): Promise<XpTransaction>;
  getUserXpTransactions(userId: number): Promise<XpTransaction[]>;

  getLeaderboard(federationId?: number): Promise<User[]>;
  getClubLeaderboard(federationId?: number): Promise<{ club: Club; score: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserProfile(userId: number, data: Partial<User>): Promise<User | undefined> {
    const { id, password, xpTotal, tier, createdAt, ...safeData } = data as any;
    const [updated] = await db.update(users).set(safeData).where(eq(users.id, userId)).returning();
    return updated;
  }

  async updateUserXp(userId: number, xpAmount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    const newXp = user.xpTotal + xpAmount;
    let tier = "green";
    if (newXp >= 1000) tier = "gold";
    else if (newXp >= 500) tier = "silver";
    else if (newXp >= 200) tier = "blue";
    await db.update(users).set({ xpTotal: newXp, tier }).where(eq(users.id, userId));
  }

  async getFederations(): Promise<Federation[]> {
    return db.select().from(federations);
  }

  async createFederation(federation: InsertFederation): Promise<Federation> {
    const [created] = await db.insert(federations).values(federation).returning();
    return created;
  }

  async getClubs(federationId?: number): Promise<Club[]> {
    if (federationId) {
      return db.select().from(clubs).where(eq(clubs.federationId, federationId));
    }
    return db.select().from(clubs);
  }

  async getClub(id: number): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club;
  }

  async createClub(club: InsertClub): Promise<Club> {
    const [created] = await db.insert(clubs).values(club).returning();
    return created;
  }

  async getClubMembers(clubId: number): Promise<User[]> {
    const membershipRows = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(and(eq(memberships.clubId, clubId), eq(memberships.status, "active")));
    if (membershipRows.length === 0) return [];
    const userIds = membershipRows.map((m) => m.userId);
    const result = await db.select().from(users).where(inArray(users.id, userIds));
    return result;
  }

  async getClubScore(clubId: number): Promise<number> {
    const members = await this.getClubMembers(clubId);
    const memberXp = members.reduce((sum, m) => sum + m.xpTotal, 0);
    return Math.floor(memberXp * 0.5);
  }

  async getMembership(userId: number, clubId: number): Promise<Membership | undefined> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.clubId, clubId)));
    return membership;
  }

  async getUserMemberships(userId: number): Promise<(Membership & { club: Club })[]> {
    const rows = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId));
    const result: (Membership & { club: Club })[] = [];
    for (const row of rows) {
      const club = await this.getClub(row.clubId);
      if (club) result.push({ ...row, club });
    }
    return result;
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const [created] = await db.insert(memberships).values(membership).returning();
    return created;
  }

  async updateMembershipStatus(id: number, status: string): Promise<void> {
    await db.update(memberships).set({ status }).where(eq(memberships.id, id));
  }

  async getEvents(federationId?: number): Promise<Event[]> {
    if (federationId) {
      return db.select().from(events).where(eq(events.federationId, federationId)).orderBy(desc(events.date));
    }
    return db.select().from(events).orderBy(desc(events.date));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getClubEvents(clubId: number): Promise<Event[]> {
    return db.select().from(events).where(eq(events.clubId, clubId)).orderBy(desc(events.date));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  async getEventAttendance(eventId: number): Promise<(Attendance & { user: User })[]> {
    const rows = await db.select().from(attendance).where(eq(attendance.eventId, eventId));
    const result: (Attendance & { user: User })[] = [];
    for (const row of rows) {
      const user = await this.getUser(row.userId);
      if (user) result.push({ ...row, user });
    }
    return result;
  }

  async checkIn(att: InsertAttendance): Promise<Attendance> {
    const [created] = await db.insert(attendance).values(att).returning();
    return created;
  }

  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.userId, userId)).orderBy(desc(attendance.checkedInAt));
  }

  async getUserEventAttendance(userId: number, eventId: number): Promise<Attendance | undefined> {
    const [result] = await db.select().from(attendance).where(
      and(eq(attendance.userId, userId), eq(attendance.eventId, eventId))
    );
    return result;
  }

  async getUserActivities(userId: number): Promise<Activity[]> {
    return db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.createdAt));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  async getRecentActivities(federationId?: number, limit = 20): Promise<(Activity & { user: User })[]> {
    const rows = await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
    const result: (Activity & { user: User })[] = [];
    for (const row of rows) {
      const user = await this.getUser(row.userId);
      if (user) result.push({ ...row, user });
    }
    return result;
  }

  async createXpTransaction(transaction: InsertXpTransaction): Promise<XpTransaction> {
    const [created] = await db.insert(xpTransactions).values(transaction).returning();
    return created;
  }

  async getUserXpTransactions(userId: number): Promise<XpTransaction[]> {
    return db.select().from(xpTransactions).where(eq(xpTransactions.userId, userId)).orderBy(desc(xpTransactions.createdAt));
  }

  async getLeaderboard(federationId?: number): Promise<User[]> {
    if (federationId) {
      return db.select().from(users).where(eq(users.federationId, federationId)).orderBy(desc(users.xpTotal)).limit(20);
    }
    return db.select().from(users).orderBy(desc(users.xpTotal)).limit(20);
  }

  async getClubLeaderboard(federationId?: number): Promise<{ club: Club; score: number }[]> {
    const allClubs = await this.getClubs(federationId);
    const result: { club: Club; score: number }[] = [];
    for (const club of allClubs) {
      const score = await this.getClubScore(club.id);
      result.push({ club, score });
    }
    return result.sort((a, b) => b.score - a.score);
  }
}

export const storage = new DatabaseStorage();
