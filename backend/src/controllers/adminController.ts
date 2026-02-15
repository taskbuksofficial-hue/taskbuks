
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

        // Total Payouts
        const payoutRes = await db.query("SELECT SUM(amount) as total FROM transactions WHERE type = 'credit'");

        // Active Users (Logged in last 24h) - assuming updated_at tracks login
        const activeRes = await db.query("SELECT COUNT(*) FROM users WHERE updated_at > NOW() - INTERVAL '24 HOURS'");

        return reply.send({
            totalUsers: parseInt(userCount.rows[0].count),
            totalTasks: parseInt(taskCount.rows[0].count),
            totalPayouts: parseFloat(payoutRes.rows[0].total || '0'),
            activeUsers: parseInt(activeRes.rows[0].count)
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

// 2. Get Users
export const getAdminUsers = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!verifyAdmin(req, reply)) return;

    try {
        // Simple list with balance
        const res = await db.query(`
            SELECT u.id, u.full_name, u.email, u.is_active, w.balance 
            FROM users u 
            LEFT JOIN wallets w ON u.id = w.user_id 
            ORDER BY u.created_at DESC 
            LIMIT 50
        `);
        return reply.send(res.rows);
    } catch (error) {
        console.error(error);
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
    const { title, description, reward, url, icon, category } = req.body as any;

    try {
        await db.query(
            'INSERT INTO tasks (title, description, reward, action_url, icon_url, category, is_active) VALUES ($1, $2, $3, $4, $5, $6, true)',
            [title, description, reward, url, icon, category || 'App']
        );
        return reply.send({ success: true });
    } catch (error) {
        console.error(error);
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


