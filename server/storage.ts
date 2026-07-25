import { eq, desc, and, inArray, like, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, clubs, federations, memberships, events, attendance, activities, xpTransactions, pushSubscriptions,
  notices, auditLogs, matchResults, matchLineups, appSettings,
  type User, type InsertUser, type Club, type InsertClub, type Federation, type InsertFederation,
  type Membership, type InsertMembership, type Event, type InsertEvent,
  type Attendance, type InsertAttendance, type Activity, type InsertActivity,
  type XpTransaction, type InsertXpTransaction,
  type PushSubscription, type InsertPushSubscription,
  type Notice, type InsertNotice, type AuditLog, type InsertAuditLog,
  type MatchResult, type InsertMatchResult, type MatchLineup, type InsertMatchLineup,
  type AppSetting, type InsertAppSetting,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserXp(userId: number, xpAmount: number): Promise<void>;
  updateUserProfile(userId: number, data: Partial<User>): Promise<User | undefined>;

  getFederations(): Promise<Federation[]>;
  createFederation(federation: InsertFederation): Promise<Federation>;

  getClubs(federationId?: number): Promise<Club[]>;
  getClub(id: number): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  deleteClub(clubId: number): Promise<void>;
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
  getEventsInRange(from: string, to: string): Promise<Event[]>;

  getEventAttendance(eventId: number): Promise<(Attendance & { user: User })[]>;
  getEventAttendanceCount(eventId: number): Promise<number>;
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

  searchUsers(params: { query?: string; role?: string; clubId?: number; tier?: string; federationId?: number }): Promise<User[]>;
  getAllUsers(federationId?: number): Promise<User[]>;
  deleteUser(userId: number): Promise<void>;
  setUserActive(userId: number, active: boolean): Promise<void>;

  getAllMemberships(status?: string): Promise<(Membership & { user: User; club: Club })[]>;
  updateEvent(eventId: number, data: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(eventId: number): Promise<void>;
  updateClub(clubId: number, data: Partial<Club>): Promise<Club | undefined>;
  updateUserRole(userId: number, role: string): Promise<User | undefined>;
  getAdminStats(federationId?: number): Promise<{
    totalUsers: number; totalPlayers: number; totalSupporters: number;
    pendingMemberships: number; upcomingEvents: number; totalClubs: number;
    totalCoaches: number; totalPersonnel: number;
    eventsThisMonth: number; attendanceThisMonth: number;
  }>;

  getNotices(clubId?: number): Promise<(Notice & { author: User })[]>;
  createNotice(notice: InsertNotice & { authorId: number }): Promise<Notice>;
  deleteNotice(noticeId: number): Promise<void>;

  createAuditLog(log: InsertAuditLog): Promise<void>;
  getAuditLogs(limit?: number): Promise<(AuditLog & { admin: User })[]>;

  getMatchResult(eventId: number): Promise<MatchResult | undefined>;
  upsertMatchResult(data: InsertMatchResult & { id?: number }): Promise<MatchResult>;
  getMatchLineups(matchResultId: number): Promise<(MatchLineup & { player: User })[]>;
  setMatchLineups(matchResultId: number, entries: { playerId: number; team: string; position?: string; jerseyNumber?: number; starting?: boolean; captain?: boolean }[]): Promise<void>;

  getAppSetting(key: string): Promise<AppSetting | undefined>;
  setAppSetting(key: string, value: string | null): Promise<void>;
  getAllAppSettings(): Promise<AppSetting[]>;

  savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription>;
  removePushSubscription(userId: number, endpoint: string): Promise<void>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  getUserPushSubscriptions(userId: number): Promise<PushSubscription[]>;
  getClubPushSubscriptions(clubId: number): Promise<PushSubscription[]>;
  getActivityHeatmap(clubId?: number): Promise<{ day: number; count: number }[]>;
  getUserClubIds(userId: number): Promise<number[]>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async getAllUsers(federationId?: number): Promise<User[]> {
    if (federationId) {
      return db.select().from(users).where(eq(users.federationId, federationId)).orderBy(desc(users.createdAt));
    }
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllMemberships(status?: string): Promise<(Membership & { user: User; club: Club })[]> {
    let rows;
    if (status) {
      rows = await db.select().from(memberships).where(eq(memberships.status, status)).orderBy(desc(memberships.joinedAt));
    } else {
      rows = await db.select().from(memberships).orderBy(desc(memberships.joinedAt));
    }
    const result: (Membership & { user: User; club: Club })[] = [];
    for (const row of rows) {
      const user = await this.getUser(row.userId);
      const club = await this.getClub(row.clubId);
      if (user && club) result.push({ ...row, user, club });
    }
    return result;
  }

  async updateEvent(eventId: number, data: Partial<Event>): Promise<Event | undefined> {
    const { id, createdAt, ...safeData } = data as any;
    const [updated] = await db.update(events).set(safeData).where(eq(events.id, eventId)).returning();
    return updated;
  }

  async deleteEvent(eventId: number): Promise<void> {
    await db.delete(attendance).where(eq(attendance.eventId, eventId));
    await db.delete(events).where(eq(events.id, eventId));
  }

  async updateClub(clubId: number, data: Partial<Club>): Promise<Club | undefined> {
    const { id, ...safeData } = data as any;
    const [updated] = await db.update(clubs).set(safeData).where(eq(clubs.id, clubId)).returning();
    return updated;
  }

  async updateUserRole(userId: number, role: string): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
    return updated;
  }

  async getAdminStats(federationId?: number): Promise<{ totalUsers: number; totalPlayers: number; totalSupporters: number; pendingMemberships: number; upcomingEvents: number; totalClubs: number }> {
    const allUsers = await this.getAllUsers(federationId);
    const totalPlayers = allUsers.filter((u) => u.role === "player").length;
    const totalSupporters = allUsers.filter((u) => u.role === "supporter").length;
    const pendingRows = await db.select().from(memberships).where(eq(memberships.status, "pending"));
    const today = new Date().toISOString().split("T")[0];
    const allEvents = await this.getEvents(federationId);
    const upcoming = allEvents.filter((e) => e.date >= today);
    const allClubs = await this.getClubs(federationId);
    return {
      totalUsers: allUsers.length,
      totalPlayers,
      totalSupporters,
      pendingMemberships: pendingRows.length,
      upcomingEvents: upcoming.length,
      totalClubs: allClubs.length,
    };
  }
  async savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription> {
    const existing = await db.select().from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, sub.userId), eq(pushSubscriptions.endpoint, sub.endpoint)));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(pushSubscriptions).values(sub).returning();
    return created;
  }

  async removePushSubscription(userId: number, endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(
      and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint))
    );
  }

  async getUserPushSubscriptions(userId: number): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async getClubPushSubscriptions(clubId: number): Promise<PushSubscription[]> {
    const members = await this.getClubMembers(clubId);
    if (members.length === 0) return [];
    const memberIds = members.map(m => m.id);
    return db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, memberIds));
  }

  async getActivityHeatmap(clubId?: number): Promise<{ day: number; count: number }[]> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    let userIds: number[] | undefined;
    if (clubId) {
      const members = await this.getClubMembers(clubId);
      userIds = members.map(m => m.id);
      if (userIds.length === 0) return Array.from({ length: 7 }, (_, i) => ({ day: i, count: 0 }));
    }

    const allActivities = await db.select().from(activities).orderBy(desc(activities.createdAt));
    const weekActivities = allActivities.filter(a => {
      const created = a.createdAt ? new Date(a.createdAt) : null;
      if (!created || created < monday || created > sunday) return false;
      if (userIds && !userIds.includes(a.userId)) return false;
      return true;
    });

    const counts = Array.from({ length: 7 }, (_, i) => ({ day: i, count: 0 }));
    for (const a of weekActivities) {
      const created = new Date(a.createdAt!);
      let dayIdx = created.getDay() - 1;
      if (dayIdx < 0) dayIdx = 6;
      counts[dayIdx].count++;
    }
    return counts;
  }

  async getUserClubIds(userId: number): Promise<number[]> {
    const rows = await db
      .select({ clubId: memberships.clubId })
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")));
    return rows.map((r) => r.clubId);
  }

  async searchUsers(params: { query?: string; role?: string; clubId?: number; tier?: string; federationId?: number }): Promise<User[]> {
    const conditions: any[] = [];
    if (params.federationId) conditions.push(eq(users.federationId, params.federationId));
    if (params.role) conditions.push(eq(users.role, params.role));
    if (params.tier) conditions.push(eq(users.tier, params.tier));
    if (params.query) {
      const q = `%${params.query}%`;
      conditions.push(or(like(users.fullName, q), like(users.phone, q), like(users.email, q)));
    }
    let result: User[];
    if (params.clubId) {
      const memberRows = await db.select({ userId: memberships.userId }).from(memberships)
        .where(and(eq(memberships.clubId, params.clubId), eq(memberships.status, "active")));
      if (memberRows.length === 0) return [];
      const userIds = memberRows.map(m => m.userId);
      conditions.push(inArray(users.id, userIds));
      result = await db.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt));
    } else {
      result = conditions.length > 0
        ? await db.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt))
        : await db.select().from(users).orderBy(desc(users.createdAt));
    }
    return result;
  }

  async deleteUser(userId: number): Promise<void> {
    await db.delete(xpTransactions).where(eq(xpTransactions.userId, userId));
    await db.delete(activities).where(eq(activities.userId, userId));
    await db.delete(attendance).where(eq(attendance.userId, userId));
    await db.delete(memberships).where(eq(memberships.userId, userId));
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  async setUserActive(userId: number, active: boolean): Promise<void> {
    await db.update(users).set({ profileCompleted: active }).where(eq(users.id, userId));
  }

  async getNotices(clubId?: number): Promise<(Notice & { author: User })[]> {
    const rows = clubId
      ? await db.select().from(notices).where(or(eq(notices.clubId, clubId), eq(notices.clubId, null as any))).orderBy(desc(notices.pinned), desc(notices.createdAt))
      : await db.select().from(notices).orderBy(desc(notices.pinned), desc(notices.createdAt));
    const result: (Notice & { author: User })[] = [];
    for (const row of rows) {
      const author = await this.getUser(row.authorId);
      if (author) result.push({ ...row, author });
    }
    return result;
  }

  async createNotice(data: InsertNotice & { authorId: number }): Promise<Notice> {
    const [created] = await db.insert(notices).values(data).returning();
    return created;
  }

  async deleteNotice(noticeId: number): Promise<void> {
    await db.delete(notices).where(eq(notices.id, noticeId));
  }

  async createAuditLog(log: InsertAuditLog): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  async getAuditLogs(limit = 100): Promise<(AuditLog & { admin: User })[]> {
    const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
    const result: (AuditLog & { admin: User })[] = [];
    for (const row of rows) {
      const admin = await this.getUser(row.adminId);
      if (admin) result.push({ ...row, admin });
    }
    return result;
  }

  async getEventsInRange(from: string, to: string): Promise<Event[]> {
    return db.select().from(events).where(and(sql`date >= ${from}`, sql`date <= ${to}`)).orderBy(events.date);
  }

  async getEventAttendanceCount(eventId: number): Promise<number> {
    const rows = await db.select().from(attendance).where(eq(attendance.eventId, eventId));
    return rows.length;
  }

  async deleteClub(clubId: number): Promise<void> {
    const clubEvents = await this.getClubEvents(clubId);
    for (const ev of clubEvents) await this.deleteEvent(ev.id);
    await db.delete(memberships).where(eq(memberships.clubId, clubId));
    await db.delete(clubs).where(eq(clubs.id, clubId));
  }

  async getMatchResult(eventId: number): Promise<MatchResult | undefined> {
    const [row] = await db.select().from(matchResults).where(eq(matchResults.eventId, eventId));
    return row;
  }

  async upsertMatchResult(data: InsertMatchResult & { id?: number }): Promise<MatchResult> {
    if (data.id) {
      const { id, ...vals } = data;
      const [updated] = await db.update(matchResults).set(vals).where(eq(matchResults.id, id)).returning();
      return updated;
    }
    const [created] = await db.insert(matchResults).values(data as InsertMatchResult).returning();
    return created;
  }

  async getMatchLineups(matchResultId: number): Promise<(MatchLineup & { player: User })[]> {
    const rows = await db.select().from(matchLineups).where(eq(matchLineups.matchResultId, matchResultId));
    const result: (MatchLineup & { player: User })[] = [];
    for (const row of rows) {
      const player = await this.getUser(row.playerId);
      if (player) result.push({ ...row, player });
    }
    return result;
  }

  async setMatchLineups(matchResultId: number, entries: { playerId: number; team: string; position?: string; jerseyNumber?: number; starting?: boolean; captain?: boolean }[]): Promise<void> {
    await db.delete(matchLineups).where(eq(matchLineups.matchResultId, matchResultId));
    if (entries.length > 0) {
      await db.insert(matchLineups).values(entries.map(e => ({ ...e, matchResultId })));
    }
  }

  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return row;
  }

  async setAppSetting(key: string, value: string | null): Promise<void> {
    const existing = await this.getAppSetting(key);
    if (existing) {
      await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value });
    }
  }

  async getAllAppSettings(): Promise<AppSetting[]> {
    return db.select().from(appSettings);
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions);
  }
}

export const storage = new DatabaseStorage();
