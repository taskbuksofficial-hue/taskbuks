"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
async function updateSchema() {
    try {
        console.log("Updating schema for Admin Panel...");
        // 1. Add is_active to users if not exists
        await (0, db_1.query)(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        `);
        console.log("Added 'is_active' to users.");
        // 2. Ensure tasks has reward (just in case, though init-db has it)
        // This is a no-op if column exists, but safe to run.
        // await query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reward NUMERIC(10, 2) DEFAULT 0;`);
        console.log("Schema updated successfully.");
        process.exit(0);
    }
    catch (err) {
        console.error("Schema update failed:", err);
        process.exit(1);
    }
}
updateSchema();
