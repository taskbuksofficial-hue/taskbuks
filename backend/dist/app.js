"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const static_1 = __importDefault(require("@fastify/static"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';
const server = (0, fastify_1.default)({ logger: true });
// Register Plugins
server.register(cors_1.default, {
    origin: '*' // Allow all for development
});
// Serve Admin Panel
server.register(static_1.default, {
    root: path_1.default.join(__dirname, '../public'),
    prefix: '/', // Serve at root
});
// Auth Middleware
const authenticate = async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return reply.status(401).send({ error: 'No authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
    }
    catch (error) {
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
};
const authController_1 = require("./controllers/authController");
const appController_1 = require("./controllers/appController");
// Auth Routes (Custom)
server.post('/auth/register', authController_1.register);
server.post('/auth/login', authController_1.login);
// Helpful error for GET requests (User confusion)
server.get('/auth/register', async (req, reply) => {
    return reply.status(405).send({ error: 'Method Not Allowed. Please use POST to register.' });
});
server.get('/auth/login', async (req, reply) => {
    return reply.status(405).send({ error: 'Method Not Allowed. Please use POST to login.' });
});
// App Routes (Phase 3) - Secured with preHandler
server.get('/api/profile', { preHandler: [authenticate] }, appController_1.getProfile);
server.post('/api/profile', { preHandler: [authenticate] }, appController_1.updateProfile); // Update Profile
server.get('/api/offers', appController_1.getOffers); // Offers can be public?
server.get('/api/streak', { preHandler: [authenticate] }, appController_1.getStreak);
server.post('/api/task/start', { preHandler: [authenticate] }, appController_1.startTask);
server.post('/api/bonus/claim', { preHandler: [authenticate] }, appController_1.claimBonus);
server.post('/api/reward/video', { preHandler: [authenticate] }, appController_1.claimVideoReward);
server.post('/api/coins/add', { preHandler: [authenticate] }, appController_1.addCoins);
// Postbacks (Public - S2S)
server.get('/api/postback/rapidreach', appController_1.handleRapidReachPostback);
server.get('/api/pb/rr', appController_1.handleRapidReachPostback); // Short alias (< 100 chars)
// Transactions (Protected)
server.get('/api/transactions', { preHandler: [authenticate] }, appController_1.getTransactions);
// Withdrawal Routes (Protected)
server.post('/api/withdraw/request', { preHandler: [authenticate] }, appController_1.requestWithdrawal);
server.get('/api/withdraw/status', { preHandler: [authenticate] }, appController_1.getWithdrawalStatus);
server.post('/api/update-upi', { preHandler: [authenticate] }, appController_1.updateUpi);
// --- ADMIN ROUTES (Protected by x-admin-key) ---
const adminController_1 = require("./controllers/adminController");
server.get('/admin/stats', adminController_1.getAdminStats);
server.get('/admin/users', adminController_1.getAdminUsers);
server.post('/admin/users/ban', adminController_1.toggleUserBan);
server.post('/admin/tasks/create', adminController_1.createAdminTask);
server.post('/admin/tasks/delete', adminController_1.deleteAdminTask);
server.get('/admin/withdrawals', adminController_1.getAdminWithdrawals);
server.post('/admin/withdrawals/update', adminController_1.updateWithdrawalStatus);
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
