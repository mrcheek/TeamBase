import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const ssl = process.env.DATABASE_URL?.includes("sslmode=require")
  ? { rejectUnauthorized: false }
  : undefined;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

export const db = drizzle(pool, { schema });
export { pool };
