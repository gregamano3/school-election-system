import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env.local before creating DB connection
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function migrate() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://localhost:5432/school_election";
  const isMySQL = connectionString.startsWith("mysql");

  const drizzleDir = path.resolve(process.cwd(), "drizzle");

  if (isMySQL) {
    const mysql = (await import("mysql2/promise")).default;
    const pool = mysql.createPool({ uri: connectionString, connectionLimit: 1 });
    const conn = await pool.getConnection();
    try {
      const files = ["0000_init_mysql.sql", "0002_site_settings_mysql.sql"];
      for (const file of files) {
        const sqlPath = path.join(drizzleDir, file);
        if (!fs.existsSync(sqlPath)) continue;
        const content = fs.readFileSync(sqlPath, "utf-8");
        const statements = content
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"));
        for (const stmt of statements) {
          if (stmt) await conn.query(stmt);
        }
      }
      console.log("Migration complete: MySQL tables created/updated.");
    } finally {
      conn.release();
      await pool.end();
    }
  } else {
    const postgres = (await import("postgres")).default;
    const sql = postgres(connectionString, {
      max: 1,
      onnotice: () => {},
    });
    try {
      const files = ["0000_init.sql", "0001_add_elections_code.sql", "0002_site_settings.sql"];
      for (const file of files) {
        const sqlPath = path.join(drizzleDir, file);
        if (!fs.existsSync(sqlPath)) continue;
        const content = fs.readFileSync(sqlPath, "utf-8");
        await sql.unsafe(content);
      }
      console.log("Migration complete: PostgreSQL tables created/updated.");
    } finally {
      await sql.end();
    }
  }
}

migrate().catch(console.error).finally(() => process.exit(0));
