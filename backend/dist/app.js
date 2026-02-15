"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const path_1 = __importDefault(require("path"));
const static_1 = __importDefault(require("@fastify/static"));
dotenv_1.default.config();
const clerk = (0, clerk_sdk_node_1.Clerk)({ secretKey: process.env.CLERK_SECRET_KEY });
const server = (0, fastify_1.default)({ logger: true });
// Register Plugins
server.register(cors_1.default, {
    origin: '*' // Allow all for development
});
// Serve Admin Panel
server.register(static_1.default, {
    root: path_1.default.join(__dirname, '../public'),
    prefix: '/admin/', // access via /admin/ (simplified)
});
// Auth Middleware
const authenticate = async (req, reply) => {
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
        req.userId = client.sessions[0].userId;
    }
    catch (error) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
};
const authController_1 = require("./controllers/authController");
const appController_1 = require("./controllers/appController");
// Auth Routes
server.post('/auth/clerk', authController_1.clerkLogin);
// App Routes (Phase 3) - Secured with preHandler
server.get('/api/profile', { preHandler: [authenticate] }, appController_1.getProfile);
server.get('/api/offers', appController_1.getOffers); // Offers can be public?
server.get('/api/streak', { preHandler: [authenticate] }, appController_1.getStreak);
server.post('/api/task/start', { preHandler: [authenticate] }, appController_1.startTask);
server.post('/api/bonus/claim', { preHandler: [authenticate] }, appController_1.claimBonus);
server.post('/api/reward/video', { preHandler: [authenticate] }, appController_1.claimVideoReward);
server.post('/api/coins/add', { preHandler: [authenticate] }, appController_1.addCoins);
// Postbacks (Public - S2S)
server.get('/api/postback/adgem', appController_1.handleAdGemPostback);
server.get('/api/postback/cpx', appController_1.handleCPXPostback);
server.get('/api/postback/rapidreach', appController_1.handleRapidReachPostback);
server.get('/api/pb/rr', appController_1.handleRapidReachPostback); // Short alias (< 100 chars)
// Surveys (Protected)
server.get('/api/surveys', { preHandler: [authenticate] }, appController_1.getCPXSurveys);
// Transactions (Protected)
server.get('/api/transactions', { preHandler: [authenticate] }, appController_1.getTransactions);
// --- ADMIN ROUTES (Protected by x-admin-key) ---
const adminController_1 = require("./controllers/adminController");
server.get('/admin/stats', adminController_1.getAdminStats);
server.get('/admin/users', adminController_1.getAdminUsers);
server.post('/admin/users/ban', adminController_1.toggleUserBan);
server.post('/admin/tasks/create', adminController_1.createAdminTask);
server.post('/admin/tasks/delete', adminController_1.deleteAdminTask);
// Export server for Vercel
exports.default = async (req, res) => {
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
        }
        catch (err) {
            server.log.error(err);
            process.exit(1);
        }
    };
    start();
}
