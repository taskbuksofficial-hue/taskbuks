
import * as db from '../src/config/db';

async function checkBalance() {
    try {
        const id = 'test_user_1770889267936';
        const res = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [id]);
        if (res.rows.length > 0) {
            console.log("USER_BALANCE:", res.rows[0].balance);
        } else {
            console.log("No wallet found");
        }
    } catch (e) {
        console.error("Error checking balance:", e);
    }
}

checkBalance();
