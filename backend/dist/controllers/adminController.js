"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWithdrawalStatus = exports.getAdminWithdrawals = exports.deleteAdminTask = exports.createAdminTask = exports.toggleUserBan = exports.getAdminUsers = exports.getAdminStats = void 0;
const db = __importStar(require("../config/db"));
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'; // Simple protection for now
const verifyAdmin = (req, reply) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_SECRET) {
        reply.status(403).send({ error: 'Forbidden' });
        return false;
    }
    return true;
};
// 1. Get Stats (Dashboard)
const getAdminStats = async (req, reply) => {
    if (!verifyAdmin(req, reply))
        return;
    try {
        const userCount = await db.query('SELECT COUNT(*) FROM users');
        const taskCount = await db.query('SELECT COUNT(*) FROM tasks');
        // Total Payouts
        const payoutRes = await db.query("SELECT SUM(amount) as total FROM transactions WHERE type = 'credit'");
        // Active Users (Logged in last 24h) - assuming updated_at tracks login
        const activeRes = await db.query("SELECT COUNT(*) FROM users WHERE updated_at > NOW() - INTERVAL '24 HOURS'");
        // Pending Withdrawals
        const pendingRes = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'PENDING'");
        return reply.send({
            totalUsers: parseInt(userCount.rows[0].count),
            totalTasks: parseInt(taskCount.rows[0].count),
            totalPayouts: parseFloat(payoutRes.rows[0].total || '0'),
            activeUsers: parseInt(activeRes.rows[0].count),
            pendingWithdrawals: parseInt(pendingRes.rows[0].count),
            pendingAmount: parseFloat(pendingRes.rows[0].total || '0')
        });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
exports.getAdminStats = getAdminStats;
// 2. Get Users
const getAdminUsers = async (req, reply) => {
    if (!verifyAdmin(req, reply))
        return;
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
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
exports.getAdminUsers = getAdminUsers;
// 3. Ban/Unban User
const toggleUserBan = async (req, reply) => {
    if (!verifyAdmin(req, reply))
        return;
    const { userId, isActive } = req.body;
    try {
        await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, userId]);
        return reply.send({ success: true });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Failed to update user' });
    }
};
exports.toggleUserBan = toggleUserBan;
// 4. Create Task
const createAdminTask = async (req, reply) => {
    if (!verifyAdmin(req, reply))
        return;
    const { title, description, reward, url, icon, category } = req.body;
    try {
        await db.query('INSERT INTO tasks (title, description, reward, action_url, icon_url, category, is_active) VALUES ($1, $2, $3, $4, $5, $6, true)', [title, description, reward, url, icon, category || 'App']);
        return reply.send({ success: true });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Failed to create task' });
    }
};
exports.createAdminTask = createAdminTask;
// 5. Delete Task
const deleteAdminTask = async (req, reply) => {
    if (!verifyAdmin(req, reply))
        return;
    const { taskId } = req.body;
    try {
        await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        return reply.send({ success: true });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Failed to delete task' });
    }
};
exports.deleteAdminTask = deleteAdminTask;
// 6. Get All Withdrawals (Admin)
const getAdminWithdrawals = async (req, reply) => {
    if (!verifyAdmin(req, reply))
        return;
    try {
        const res = await db.query(`
            SELECT 
                t.id, t.amount, t.upi_id, t.status, t.admin_notes, 
                t.created_at, t.processed_at,
                u.full_name, u.email, u.id as user_id
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.type = 'WITHDRAWAL'
            ORDER BY 
                CASE WHEN t.status = 'PENDING' THEN 0 ELSE 1 END,
                t.created_at DESC
            LIMIT 100
        `);
        return reply.send(res.rows);
    }
    catch (error) {
        console.error("getAdminWithdrawals error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
exports.getAdminWithdrawals = getAdminWithdrawals;
// 7. Update Withdrawal Status (Approve/Reject)
const updateWithdrawalStatus = async (req, reply) => {
    if (!verifyAdmin(req, reply))
        return;
    const { transactionId, status, adminNotes } = req.body;
    if (!transactionId || !['COMPLETED', 'FAILED'].includes(status)) {
        return reply.status(400).send({ error: 'Invalid parameters. Status must be COMPLETED or FAILED.' });
    }
    try {
        // Get the withdrawal transaction
        const txRes = await db.query("SELECT * FROM transactions WHERE id = $1 AND type = 'WITHDRAWAL'", [transactionId]);
        if (txRes.rows.length === 0) {
            return reply.status(404).send({ error: 'Withdrawal not found' });
        }
        const tx = txRes.rows[0];
        if (tx.status !== 'PENDING') {
            return reply.status(400).send({ error: `Withdrawal is already ${tx.status}` });
        }
        // Update the transaction status
        await db.query(`UPDATE transactions 
             SET status = $1, admin_notes = $2, processed_at = NOW() 
             WHERE id = $3`, [status, adminNotes || null, transactionId]);
        // If FAILED (rejected), refund the amount back to wallet
        if (status === 'FAILED') {
            await db.query('UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2', [tx.amount, tx.user_id]);
        }
        return reply.send({
            success: true,
            message: status === 'COMPLETED'
                ? 'Withdrawal marked as paid!'
                : 'Withdrawal rejected. Amount refunded to user wallet.'
        });
    }
    catch (error) {
        console.error("updateWithdrawalStatus error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
exports.updateWithdrawalStatus = updateWithdrawalStatus;
