import * as db from './src/config/db';

async function migrate() {
    console.log("Starting DB Defaults Fix...");

    try {
        // 1. Fix Users Table (Streak)
        console.log("Fixing Users table...");
        await db.query(`ALTER TABLE users ALTER COLUMN current_streak SET DEFAULT 0`);
        await db.query(`UPDATE users SET current_streak = 0 WHERE current_streak IS NULL`);
        // Force reset bad defaults if any (like 3) - though we can't easily identifying them without logic.
        // But we can ensure new users get 0. 
        // Also resets anyone with NULL to 0.

        // 2. Fix Wallets Table (Total Coins)
        console.log("Fixing Wallets table...");
        await db.query(`ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_coins INTEGER DEFAULT 0`);
        await db.query(`ALTER TABLE wallets ALTER COLUMN total_coins SET DEFAULT 0`);
        await db.query(`UPDATE wallets SET total_coins = 0 WHERE total_coins IS NULL`);

        console.log("✅ Defaults Fixed Successfully!");
    } catch (error) {
        console.error("❌ Migration Failed:", error);
    } finally {
        process.exit();
    }
}

migrate();
