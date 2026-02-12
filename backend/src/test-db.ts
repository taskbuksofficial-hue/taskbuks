
import { query } from './config/db';

async function testConnection() {
    try {
        console.log("Testing database connection...");
        const res = await query('SELECT NOW() as now');
        console.log("Database Connection Successful!", res.rows[0]);
        process.exit(0);
    } catch (error) {
        console.error("Database Connection Failed:", error);
        process.exit(1);
    }
}

testConnection();
