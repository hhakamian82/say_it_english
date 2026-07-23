
import "dotenv/config";

import pg from "pg";
const { Pool } = pg;

// Credentials come from .env.local / .env only — never committed (CLAUDE.md).
const CONNECTION_STRING = process.env.DATABASE_URL;
if (!CONNECTION_STRING) {
    console.error("DATABASE_URL is not set. Put it in .env.local first.");
    process.exit(1);
}

// This wipes every row in the database DATABASE_URL points at — which is production.
// Nothing here can be undone, so it never runs without the flag.
if (!process.argv.includes("--yes-wipe-everything")) {
    const host = CONNECTION_STRING.replace(/:[^:@]+@/, ":***@");
    console.error("⛔ db:reset TRUNCATEs users/content/bookings/classes/enrollments/session.");
    console.error("   Target:", host);
    console.error("   Re-run with --yes-wipe-everything if that is really what you want.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function reset() {
    console.log("🧹 Starting Database Cleanup...");
    try {
        // TRUNCATE removes all rows. CASCADE handles foreign keys. RESTART IDENTITY resets ID counters to 1.
        // Quoting table names to be safe, though existing names are lowercase.
        await pool.query(`
      TRUNCATE TABLE 
        "session",
        "enrollments",
        "bookings",
        "classes",
        "content",
        "users"
      RESTART IDENTITY CASCADE;
    `);
        console.log("-----------------------------------------");
        console.log("✨ Database verified clean. All users and data removed.");
        console.log("-----------------------------------------");
    } catch (err: any) {
        console.error("❌ Error:", err.message);
    } finally {
        await pool.end();
    }
}

reset();
