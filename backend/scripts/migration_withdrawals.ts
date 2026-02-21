import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    console.log('Running withdrawal migration...');

    try {
        // Add UPI ID, admin notes, and processed_at columns to transactions
        await pool.query(`
            ALTER TABLE public.transactions 
            ADD COLUMN IF NOT EXISTS upi_id TEXT,
            ADD COLUMN IF NOT EXISTS admin_notes TEXT,
            ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
        `);
        console.log('✅ Added upi_id, admin_notes, processed_at columns to transactions table');

        console.log('✅ Migration complete!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
