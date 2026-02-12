
import * as db from '../src/config/db';

async function getUser() {
    try {
        const res = await db.query('SELECT id FROM users LIMIT 1');
        if (res.rows.length > 0) {
            console.log("TEST_USER_ID:", res.rows[0].id);
        } else {
            console.log("No users found");
        }
    } catch (e) {
        console.error("Error fetching user:", e);
    }
}

getUser();
