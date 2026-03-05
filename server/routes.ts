import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { quickRegisterSchema, loginSchema, profileUpdateSchema, calculateProfileCompletion, insertEventSchema, insertActivitySchema, insertMembershipSchema, adminUpdateEventSchema, adminUpdateClubSchema } from "@shared/schema";
import { seedDatabase } from "./seed";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgStore = ConnectPgSimple(session);

  app.use(
    session({
      store: new PgStore({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "zrf-rugby-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    })
  );

  await seedDatabase();

  function requireAuth(req: Request, res: Response, next: Function) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  }

  async function requireAdmin(req: Request, res: Response, next: Function) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  }

  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const data = quickRegisterSchema.parse(req.body);
      const existing = await storage.getUserByPhone(data.phone);
      if (existing) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
      const tempPassword = randomBytes(16).toString("hex");
      const hashedPassword = await hashPassword(tempPassword);
      const user = await storage.createUser({
        fullName: data.fullName,
        phone: data.phone,
        password: hashedPassword,
        role: "player",
        preferredLanguage: "en",
        federationId: 1,
        photoUrl: null,
      });
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/user/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = profileUpdateSchema.parse(req.body);
      const { clubId, password: rawPassword, ...profileData } = data;
      const updatePayload: Record<string, any> = { ...profileData };
      if (rawPassword) {
        updatePayload.password = await hashPassword(rawPassword);
      }
      let updated = await storage.updateUserProfile(req.session.userId!, updatePayload);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...safeUser } = updated;
      const completion = calculateProfileCompletion(safeUser as any);
      if (completion >= 80 && !updated.profileCompleted) {
        updated = await storage.updateUserProfile(req.session.userId!, { profileCompleted: true }) || updated;
      }
      if (clubId) {
        const existing = await storage.getMembership(req.session.userId!, clubId);
        if (!existing) {
          await storage.createMembership({ userId: req.session.userId!, clubId, status: "pending" });
        }
      }
      const { password: __, ...finalUser } = updated;
      res.json(finalUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByPhone(data.phone);
      if (!user) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }
      const valid = await comparePasswords(data.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/user", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/clubs", async (_req: Request, res: Response) => {
    const allClubs = await storage.getClubs(1);
    res.json(allClubs);
  });

  app.get("/api/clubs/:id", async (req: Request, res: Response) => {
    const club = await storage.getClub(parseInt(req.params.id));
    if (!club) return res.status(404).json({ message: "Club not found" });
    res.json(club);
  });

  app.get("/api/clubs/:id/members", async (req: Request, res: Response) => {
    const members = await storage.getClubMembers(parseInt(req.params.id));
    const safeMembers = members.map(({ password: _, ...u }) => u);
    res.json(safeMembers);
  });

  app.get("/api/clubs/:id/events", async (req: Request, res: Response) => {
    const clubEvents = await storage.getClubEvents(parseInt(req.params.id));
    res.json(clubEvents);
  });

  app.get("/api/clubs/:id/score", async (req: Request, res: Response) => {
    const score = await storage.getClubScore(parseInt(req.params.id));
    res.json({ score });
  });

  app.post("/api/memberships", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = insertMembershipSchema.parse({ ...req.body, userId: req.session.userId });
      const existing = await storage.getMembership(data.userId!, data.clubId!);
      if (existing) {
        return res.status(400).json({ message: "Already a member or pending" });
      }
      const membership = await storage.createMembership(data);
      res.json(membership);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/memberships", requireAuth, async (req: Request, res: Response) => {
    const memberships = await storage.getUserMemberships(req.session.userId!);
    res.json(memberships);
  });

  app.get("/api/events", async (_req: Request, res: Response) => {
    const allEvents = await storage.getEvents(1);
    res.json(allEvents);
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.get("/api/events/:id/attendance", async (req: Request, res: Response) => {
    const att = await storage.getEventAttendance(parseInt(req.params.id));
    const safeAtt = att.map(({ user: { password: _, ...u }, ...a }) => ({ ...a, user: u }));
    res.json(safeAtt);
  });

  app.post("/api/events", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(data);
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/check-in/event", requireAuth, async (req: Request, res: Response) => {
    try {
      const { eventId, method } = req.body;
      if (!eventId || typeof eventId !== "number") {
        return res.status(400).json({ message: "Valid eventId is required" });
      }
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      const existingAttendance = await storage.getUserEventAttendance(req.session.userId!, eventId);
      if (existingAttendance) {
        return res.status(400).json({ message: "Already checked in to this event" });
      }
      const att = await storage.checkIn({
        eventId,
        userId: req.session.userId!,
        method: method || "manual",
      });
      await storage.updateUserXp(req.session.userId!, 25);
      await storage.createXpTransaction({
        userId: req.session.userId!,
        amount: 25,
        source: "event",
        sourceId: eventId,
        description: "Event check-in",
      });
      res.json(att);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const activityXpMap: Record<string, number> = {
    saq: 20, gym: 15, running: 10, recovery: 5, watching: 5, social: 10,
  };

  app.post("/api/activities", requireAuth, async (req: Request, res: Response) => {
    try {
      const { type, date, notes } = req.body;
      if (!type || !date) {
        return res.status(400).json({ message: "Activity type and date are required" });
      }
      const validTypes = Object.keys(activityXpMap);
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid activity type" });
      }
      const xpEarned = activityXpMap[type] || 10;
      const data = insertActivitySchema.parse({
        userId: req.session.userId!,
        type,
        date,
        notes: notes || null,
        xpEarned,
      });
      const activity = await storage.createActivity(data);
      await storage.updateUserXp(req.session.userId!, xpEarned);
      await storage.createXpTransaction({
        userId: req.session.userId!,
        amount: xpEarned,
        source: "activity",
        sourceId: activity.id,
        description: `${type} activity`,
      });
      res.json(activity);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/activities", requireAuth, async (req: Request, res: Response) => {
    const userActivities = await storage.getUserActivities(req.session.userId!);
    res.json(userActivities);
  });

  app.get("/api/feed", async (_req: Request, res: Response) => {
    const recentActivities = await storage.getRecentActivities(1, 20);
    const safeFeed = recentActivities.map(({ user: { password: _, ...u }, ...a }) => ({ ...a, user: u }));
    res.json(safeFeed);
  });

  app.get("/api/leaderboard/players", async (_req: Request, res: Response) => {
    const leaders = await storage.getLeaderboard(1);
    const safeLeaders = leaders.map(({ password: _, ...u }) => u);
    res.json(safeLeaders);
  });

  app.get("/api/leaderboard/clubs", async (_req: Request, res: Response) => {
    const clubLeaderboard = await storage.getClubLeaderboard(1);
    res.json(clubLeaderboard);
  });

  app.get("/api/xp-history", requireAuth, async (req: Request, res: Response) => {
    const history = await storage.getUserXpTransactions(req.session.userId!);
    res.json(history);
  });

  app.get("/api/user/attendance", requireAuth, async (req: Request, res: Response) => {
    const att = await storage.getUserAttendance(req.session.userId!);
    res.json(att);
  });

  app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
    const stats = await storage.getAdminStats(1);
    res.json(stats);
  });

  app.get("/api/admin/users", requireAdmin, async (_req: Request, res: Response) => {
    const allUsers = await storage.getAllUsers(1);
    const safeUsers = allUsers.map(({ password: _, ...u }) => u);
    res.json(safeUsers);
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { role } = req.body;
      if (!role || !["player", "coach", "personnel", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updated = await storage.updateUserRole(parseInt(req.params.id), role);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/memberships", requireAdmin, async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const all = await storage.getAllMemberships(status);
    const safe = all.map(({ user: { password: _, ...u }, ...rest }) => ({ ...rest, user: u }));
    res.json(safe);
  });

  app.patch("/api/admin/memberships/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!status || !["active", "pending", "rejected", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      await storage.updateMembershipStatus(parseInt(req.params.id), status);
      res.json({ message: "Membership updated" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/events/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = adminUpdateEventSchema.parse(req.body);
      const updated = await storage.updateEvent(parseInt(req.params.id), data as any);
      if (!updated) return res.status(404).json({ message: "Event not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/events/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteEvent(parseInt(req.params.id));
      res.json({ message: "Event deleted" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/clubs/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = adminUpdateClubSchema.parse(req.body);
      const updated = await storage.updateClub(parseInt(req.params.id), data as any);
      if (!updated) return res.status(404).json({ message: "Club not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return httpServer;
}
