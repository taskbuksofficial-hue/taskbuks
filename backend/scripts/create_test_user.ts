
import * as db from '../src/config/db';

async function createUser() {
    try {
        const id = 'test_user_' + Date.now();
        await db.query('INSERT INTO users (id, email, full_name) VALUES ($1, $2, $3)', [id, 'test@example.com', 'Test User']);
        await db.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [id, 0]);
        console.log("CREATED_USER_ID:", id);
    } catch (e) {
        console.error("Error creating user:", e);
    }
}

createUser();
