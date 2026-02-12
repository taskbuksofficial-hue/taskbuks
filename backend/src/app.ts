import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { Clerk } from '@clerk/clerk-sdk-node';

dotenv.config();

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

const server: FastifyInstance = Fastify({ logger: true });

// Register Plugins
server.register(cors, {
    origin: '*' // Allow all for development
});

// Auth Middleware
const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return reply.status(401).send({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        // In a real app, use verifyToken or verifySession. 
        // For simplicity with what we have:
        const client = await clerk.clients.verifyClient(token);
        if (!client || !client.sessions[0]) {
            throw new Error('Invalid session');
        }
        (req as any).userId = client.sessions[0].userId;
    } catch (error) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
};

import { clerkLogin } from './controllers/authController';
import { getProfile, getOffers, getStreak, startTask, claimBonus, claimVideoReward, handleAdGemPostback, handleCPXPostback, getCPXSurveys, getTransactions, handleRapidReachPostback } from './controllers/appController';

// Auth Routes
server.post('/auth/clerk', clerkLogin);

// App Routes (Phase 3) - Secured with preHandler
server.get('/api/profile', { preHandler: [authenticate] }, getProfile);
server.get('/api/offers', getOffers); // Offers can be public?
server.get('/api/streak', { preHandler: [authenticate] }, getStreak);
server.post('/api/task/start', { preHandler: [authenticate] }, startTask);
server.post('/api/bonus/claim', { preHandler: [authenticate] }, claimBonus);
server.post('/api/reward/video', { preHandler: [authenticate] }, claimVideoReward);

// Postbacks (Public - S2S)
server.get('/api/postback/adgem', handleAdGemPostback);
server.get('/api/postback/cpx', handleCPXPostback);
server.get('/api/postback/rapidreach', handleRapidReachPostback);

// Surveys (Protected)
server.get('/api/surveys', { preHandler: [authenticate] }, getCPXSurveys);

// Transactions (Protected)
server.get('/api/transactions', { preHandler: [authenticate] }, getTransactions);

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
