import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config();

const server: FastifyInstance = Fastify({ logger: true });

// Register Plugins
server.register(cors, {
    origin: '*' // Allow all for development
});

import { googleLogin } from './controllers/authController';
import { getProfile, getOffers, getStreak, startTask, claimBonus } from './controllers/appController';

// Health Check Route
server.get('/', async (request, reply) => {
    return { status: 'ok', message: 'Task Buks Backend is Running 🚀' };
});

// Auth Routes
server.post('/auth/google', googleLogin);

// App Routes (Phase 3)
server.get('/api/profile', getProfile);
server.get('/api/offers', getOffers);
server.get('/api/streak', getStreak);
server.post('/api/task/start', startTask);
server.post('/api/bonus', claimBonus);

// Start Server
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
