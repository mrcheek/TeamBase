import { db } from "./db";
import { sql } from "drizzle-orm";

export async function ensureTables() {
  // Check if match_results has correct schema and recreate if needed
  try {
    await db.execute(sql`SELECT away_club_id FROM match_results LIMIT 0`);
  } catch {
    await db.execute(sql`DROP TABLE IF EXISTS match_lineups CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS match_results CASCADE`);
  }

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
    sql`DO $$ BEGIN
      PERFORM home_club_id FROM match_results LIMIT 0;
    EXCEPTION WHEN undefined_column THEN
      DROP TABLE IF EXISTS match_lineups CASCADE;
      DROP TABLE IF EXISTS match_results CASCADE;
    END $$`,
    sql`CREATE TABLE IF NOT EXISTS match_results (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
      home_club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
      away_club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
      home_score INTEGER DEFAULT 0,
      away_score INTEGER DEFAULT 0,
      home_team TEXT,
      away_team TEXT,
      period TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`,
    sql`CREATE TABLE IF NOT EXISTS match_lineups (
      id SERIAL PRIMARY KEY,
      match_result_id INTEGER NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
      player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
