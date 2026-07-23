
import "dotenv/config";

import pg from "pg";
const { Pool } = pg;

// Credentials come from .env.local / .env only — never committed (CLAUDE.md).
const CONNECTION_STRING = process.env.DATABASE_URL;
if (!CONNECTION_STRING) {
    console.error("DATABASE_URL is not set. Put it in .env.local first.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

const ADMIN_NUMBERS = ["09222453571", "09123104254"];

async function makeAdmins() {
    console.log("👮‍♂️ Promoting users to Admin...");

    try {
        for (const phone of ADMIN_NUMBERS) {
            const res = await pool.query(
                `UPDATE users SET role = 'admin' WHERE username = $1 RETURNING username, role`,
                [phone]
            );

            if (res.rowCount && res.rowCount > 0) {
                console.log(`✅ User ${phone} is now ADMIN.`);
            } else {
                console.log(`⚠️ User ${phone} not found. (Make sure they have registered first!)`);
            }
        }
    } catch (err: any) {
        console.error("❌ Error:", err.message);
    } finally {
        await pool.end();
    }
}

makeAdmins();
