import { db } from "./db";
import { sql } from "drizzle-orm";

export async function ensureTables() {
  const statements = [
    sql`CREATE TABLE IF NOT EXISTS notices (
      id SERIAL PRIMARY KEY,
      club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`,
    sql`CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`,
    sql`CREATE TABLE IF NOT EXISTS match_results (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      opponent TEXT NOT NULL,
      venue TEXT,
      home_score INTEGER NOT NULL DEFAULT 0,
      away_score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'scheduled',
      report TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`,
    sql`CREATE TABLE IF NOT EXISTS match_lineups (
      id SERIAL PRIMARY KEY,
      match_id INTEGER NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      position TEXT,
      jersey_number INTEGER,
      captain BOOLEAN DEFAULT FALSE
    )`,
    sql`CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    )`,
  ];

  for (const stmt of statements) {
    try {
      await db.execute(stmt);
    } catch (e: any) {
      if (!e.message?.includes("already exists")) {
        console.error("Migration error:", e.message);
      }
    }
  }
  console.log("Database tables ensured");
}
