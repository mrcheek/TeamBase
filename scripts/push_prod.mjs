import pg from "pg";
import * as schema from "../shared/schema.ts";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const tables = Object.values(schema).filter(v => v?.constructor?.name === "PgTable");

for (const table of tables) {
  const tableName = table[Symbol.for("drizzle:name")];
  try {
    await db.execute(`SELECT 1 FROM "${tableName}" LIMIT 0`);
    console.log(`✓ ${tableName}`);
  } catch (e) {
    console.log(`✗ ${tableName} — creating...`);
    try {
      const stmt = db._.dialect.schemaBuilders.createTable(table).toSQL();
      await db.execute(stmt.sql);
      console.log(`  → created`);
    } catch (e2) {
      console.log(`  → error:`, e2.message);
    }
  }
}

await pool.end();
