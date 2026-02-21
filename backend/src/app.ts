import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';
import fastifyStatic from '@fastify/static';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

const server: FastifyInstance = Fastify({ logger: true });

// Register Plugins
server.register(cors, {
    origin: '*' // Allow all for development
});

// Serve Admin Panel
server.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/', // Serve at root
});

// Auth Middleware
const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return reply.status(401).send({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string };
        (req as any).userId = decoded.userId;
    } catch (error) {
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
};

import { register, login } from './controllers/authController';
import { getProfile, updateProfile, getOffers, getStreak, startTask, claimBonus, claimVideoReward, handleAdGemPostback, handleCPXPostback, getCPXSurveys, getTransactions, handleRapidReachPostback, addCoins, requestWithdrawal, getWithdrawalStatus } from './controllers/appController';

// Auth Routes (Custom)
server.post('/auth/register', register);
server.post('/auth/login', login);

// Helpful error for GET requests (User confusion)
server.get('/auth/register', async (req, reply) => {
    return reply.status(405).send({ error: 'Method Not Allowed. Please use POST to register.' });
});
server.get('/auth/login', async (req, reply) => {
    return reply.status(405).send({ error: 'Method Not Allowed. Please use POST to login.' });
});

// App Routes (Phase 3) - Secured with preHandler
server.get('/api/profile', { preHandler: [authenticate] }, getProfile);
server.post('/api/profile', { preHandler: [authenticate] }, updateProfile); // Update Profile
server.get('/api/offers', getOffers); // Offers can be public?
server.get('/api/streak', { preHandler: [authenticate] }, getStreak);
server.post('/api/task/start', { preHandler: [authenticate] }, startTask);
server.post('/api/bonus/claim', { preHandler: [authenticate] }, claimBonus);
server.post('/api/reward/video', { preHandler: [authenticate] }, claimVideoReward);
server.post('/api/coins/add', { preHandler: [authenticate] }, addCoins);

// Postbacks (Public - S2S)
server.get('/api/postback/adgem', handleAdGemPostback);
server.get('/api/postback/cpx', handleCPXPostback);
server.get('/api/postback/rapidreach', handleRapidReachPostback);
server.get('/api/pb/rr', handleRapidReachPostback); // Short alias (< 100 chars)

// Surveys (Protected)
server.get('/api/surveys', { preHandler: [authenticate] }, getCPXSurveys);

// Transactions (Protected)
server.get('/api/transactions', { preHandler: [authenticate] }, getTransactions);

// Withdrawal Routes (Protected)
server.post('/api/withdraw/request', { preHandler: [authenticate] }, requestWithdrawal);
server.get('/api/withdraw/status', { preHandler: [authenticate] }, getWithdrawalStatus);

// --- ADMIN ROUTES (Protected by x-admin-key) ---
import { getAdminStats, getAdminUsers, toggleUserBan, createAdminTask, deleteAdminTask, getAdminWithdrawals, updateWithdrawalStatus } from './controllers/adminController';

server.get('/admin/stats', getAdminStats);
server.get('/admin/users', getAdminUsers);
server.post('/admin/users/ban', toggleUserBan);
server.post('/admin/tasks/create', createAdminTask);
server.post('/admin/tasks/delete', deleteAdminTask);
server.get('/admin/withdrawals', getAdminWithdrawals);
server.post('/admin/withdrawals/update', updateWithdrawalStatus);

// Export server for Vercel
export default async (req: any, res: any) => {
    await server.ready();
    server.server.emit('request', req, res);
};

// Start Server locally
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const start = async () => {
        try {
            const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
            await server.listen({ port, host: '0.0.0.0' });
            console.log(`Server listening on port ${port}`);
        } catch (err) {
            server.log.error(err);
            process.exit(1);
        }
    };
    start();
}
