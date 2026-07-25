import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const client = await pool.connect();

const tables = ["notices", "audit_logs", "match_results", "match_lineups", "app_settings"];
for (const t of tables) {
  const res = await client.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = $1)`, [t]);
  console.log(`${t}: ${res.rows[0].exists ? "exists" : "MISSING"}`);
}

client.release();
await pool.end();
