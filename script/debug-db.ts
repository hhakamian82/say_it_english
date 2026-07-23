
import "dotenv/config";

import pg from "pg";
const { Pool } = pg;

// Credentials come from .env.local / .env only — never committed (CLAUDE.md).
const CONNECTION_STRING = process.env.DATABASE_URL;
if (!CONNECTION_STRING) {
    console.error("DATABASE_URL is not set. Put it in .env.local first.");
    process.exit(1);
}

async function verify() {
    console.log("🔍 Debugging Connection...");
    console.log("URL:", CONNECTION_STRING.replace(/:[^:@]*@/, ":***@"));
    console.log("SSL: { rejectUnauthorized: false } (Enforced)");

    const pool = new Pool({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false } // Explicitly Force SSL
    });

    try {
        const client = await pool.connect();
        console.log("✅ SUCCESS! Connected to Supabase.");
        const res = await client.query('SELECT version()');
        console.log("📊 Version:", res.rows[0].version);
        client.release();
        await pool.end();
    } catch (err: any) {
        console.error("❌ FAILED:", err.message);
        if (err.message.includes("password")) {
            console.error("\n🧐 Password Rejected. Possibilities:");
            console.error("1. The password in DATABASE_URL was not successfully saved in Supabase.");
            console.error("2. The project ref in DATABASE_URL is incorrect.");
            console.error("3. The user 'postgres' is disabled or renamed.");
        }
    }
}

verify();
