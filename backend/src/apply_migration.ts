
import * as db from './config/db';

const migrate = async () => {
    try {
        console.log("Applying schema update...");

        // 1. Enable extension
        await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        // 2. Set default for ID
        // We use ALTER COLUMN SET DEFAULT
        await db.query(`ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v4();`);

        console.log("Schema update successful: Enabled uuid-ossp and set default for id.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
