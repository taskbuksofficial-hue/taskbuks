
import { FastifyReply, FastifyRequest } from 'fastify';
import * as db from '../config/db';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'; // Simple protection for now

const verifyAdmin = (req: FastifyRequest, reply: FastifyReply) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_SECRET) {
        reply.status(403).send({ error: 'Forbidden' });
        return false;
    }
    return true;
};

// 1. Get Stats (Dashboard)
export const getAdminStats = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!verifyAdmin(req, reply)) return;

    try {
        const userCount = await db.query('SELECT COUNT(*) FROM users');
        const taskCount = await db.query('SELECT COUNT(*) FROM tasks');

        // Total Payouts (all earnings credited)
        const payoutRes = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type IN ('EARNING', 'BONUS', 'REFERRAL')");

        // Active Users (Logged in last 24h)
        const activeRes = await db.query("SELECT COUNT(*) FROM users WHERE updated_at > NOW() - INTERVAL '24 HOURS'");

        // Pending Withdrawals
        const pendingRes = await db.query(
            "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'PENDING'"
        );

        return reply.send({
            totalUsers: parseInt(userCount.rows[0].count),
            totalTasks: parseInt(taskCount.rows[0].count),
            totalPayouts: parseFloat(payoutRes.rows[0].total || '0'),
            activeUsers: parseInt(activeRes.rows[0].count),
            pendingWithdrawals: parseInt(pendingRes.rows[0].count),
            pendingAmount: parseFloat(pendingRes.rows[0].total || '0')
        });
    } catch (error) {
        console.error("getAdminStats error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

// 2. Get Users
export const getAdminUsers = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!verifyAdmin(req, reply)) return;

    try {
        const res = await db.query(`
            SELECT u.id, u.full_name, u.email, u.is_active, w.balance 
            FROM users u 
            LEFT JOIN wallets w ON u.id::text = w.user_id 
            ORDER BY u.created_at DESC 
            LIMIT 50
        `);
        return reply.send(res.rows);
    } catch (error) {
        console.error("getAdminUsers error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

// 3. Ban/Unban User
export const toggleUserBan = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!verifyAdmin(req, reply)) return;
    const { userId, isActive } = req.body as { userId: string, isActive: boolean };

    try {
        await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, userId]);
        return reply.send({ success: true });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Failed to update user' });
    }
};

// 4. Create Task
export const createAdminTask = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!verifyAdmin(req, reply)) return;
    const { title, description, reward, icon, category } = req.body as any;

    try {
        await db.query(
            'INSERT INTO tasks (title, description, reward, icon_url, category, is_active) VALUES ($1, $2, $3, $4, $5, true)',
            [title, description, parseFloat(reward) || 0, icon || null, category || 'App']
        );
        return reply.send({ success: true });
    } catch (error) {
        console.error("createAdminTask error:", error);
        return reply.status(500).send({ error: 'Failed to create task' });
    }
};

// 5. Delete Task
export const deleteAdminTask = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!verifyAdmin(req, reply)) return;
    const { taskId } = req.body as { taskId: string };

    try {
        await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        return reply.send({ success: true });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Failed to delete task' });
    }
};

// 6. Get All Withdrawals (Admin)
export const getAdminWithdrawals = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!verifyAdmin(req, reply)) return;

    try {
        const res = await db.query(`
            SELECT 
                t.id, t.amount, t.upi_id, t.status, t.admin_notes, 
                t.created_at, t.processed_at,
                u.full_name, u.email, u.id as user_id
            FROM transactions t
            JOIN users u ON t.user_id = u.id::text
            WHERE t.type = 'WITHDRAWAL'
            ORDER BY 
                CASE WHEN t.status = 'PENDING' THEN 0 ELSE 1 END,
                t.created_at DESC
            LIMIT 100
        `);
        return reply.send(res.rows);
    } catch (error) {
        console.error("getAdminWithdrawals error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

// 7. Update Withdrawal Status (Approve/Reject)
export const updateWithdrawalStatus = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!verifyAdmin(req, reply)) return;

    const { transactionId, status, adminNotes } = req.body as {
        transactionId: string,
        status: 'COMPLETED' | 'FAILED',
        adminNotes?: string
    };

    if (!transactionId || !['COMPLETED', 'FAILED'].includes(status)) {
        return reply.status(400).send({ error: 'Invalid parameters. Status must be COMPLETED or FAILED.' });
    }

    try {
        // Get the withdrawal transaction
        const txRes = await db.query(
            "SELECT * FROM transactions WHERE id = $1 AND type = 'WITHDRAWAL'",
            [transactionId]
        );

        if (txRes.rows.length === 0) {
            return reply.status(404).send({ error: 'Withdrawal not found' });
        }

        const tx = txRes.rows[0];

        if (tx.status !== 'PENDING') {
            return reply.status(400).send({ error: `Withdrawal is already ${tx.status}` });
        }

        // Update the transaction status
        await db.query(
            `UPDATE transactions 
             SET status = $1, admin_notes = $2, processed_at = NOW() 
             WHERE id = $3`,
            [status, adminNotes || null, transactionId]
        );

        // If FAILED (rejected), refund the amount back to wallet
        if (status === 'FAILED') {
            await db.query(
                'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
                [tx.amount, tx.user_id]
            );
        }

        return reply.send({
            success: true,
            message: status === 'COMPLETED'
                ? 'Withdrawal marked as paid!'
                : 'Withdrawal rejected. Amount refunded to user wallet.'
        });
    } catch (error) {
        console.error("updateWithdrawalStatus error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
