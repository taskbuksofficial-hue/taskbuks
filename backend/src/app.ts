import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config();

const server: FastifyInstance = Fastify({ logger: true });

// Register Plugins
server.register(cors, {
    origin: '*' // Allow all for development
});

// Health Check Route
server.get('/', async (request, reply) => {
    return { status: 'ok', message: 'Task Buks Backend is Running 🚀' };
});

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
