
import { features } from 'process';
import { query } from './config/db';

async function checkTables() {
    try {
        console.log("Checking for tables...");
        const res = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'wallets', 'transactions', 'tasks', 'offers');
        `);

        const foundTables = res.rows.map(r => r.table_name);
        console.log("Found tables:", foundTables);

        if (foundTables.length === 0) {
            console.log("⚠️ No tables found. Database might be empty.");
        } else {
            console.log("✅ Tables exist.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error checking tables:", error);
        process.exit(1);
    }
}

checkTables();
