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
exports.clerkLogin = void 0;
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const db = __importStar(require("../config/db"));
// Initialize Clerk (will need CLERK_SECRET_KEY in .env)
const clerk = (0, clerk_sdk_node_1.Clerk)({ secretKey: process.env.CLERK_SECRET_KEY });
const clerkLogin = async (req, reply) => {
    const { token } = req.body;
    if (!token) {
        return reply.status(400).send({ error: 'Missing session token' });
    }
    try {
        // 1. Verify Clerk Token
        // In a real mobile app, you might verify the JWT from the Authorizaton header.
        // For this hybrid approach, we'll verify the session token passed in the body.
        const client = await clerk.clients.verifyClient(token);
        if (!client) {
            return reply.status(401).send({ error: 'Invalid session' });
        }
        const userId = client.sessions[0].userId;
        const userDetails = await clerk.users.getUser(userId);
        const email = userDetails.emailAddresses[0].emailAddress;
        const name = `${userDetails.firstName} ${userDetails.lastName}`;
        const picture = userDetails.imageUrl;
        const clerkId = userDetails.id;
        // 2. Check/Create User in DB
        const existingUserResult = await db.query('SELECT * FROM users WHERE id = $1', // Assuming we use Clerk ID as our ID now, or map it
        [clerkId]);
        let user;
        if (existingUserResult.rows.length > 0) {
            user = existingUserResult.rows[0];
            // Ensure wallet exists (Self-healing for legacy users)
            const walletCheck = await db.query('SELECT id FROM wallets WHERE user_id = $1', [user.id]);
            if (walletCheck.rows.length === 0) {
                await db.query(`INSERT INTO wallets (user_id, balance, updated_at)
                     VALUES ($1, 0.00, NOW())`, [user.id]);
            }
        }
        else {
            const referralCode = (userDetails.firstName?.substring(0, 4).toUpperCase() || 'USER') + Math.floor(1000 + Math.random() * 9000);
            const newUserResult = await db.query(`INSERT INTO users (id, email, full_name, avatar_url, referral_code, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())
                 RETURNING *`, [clerkId, email, name, picture, referralCode]);
            user = newUserResult.rows[0];
            await db.query(`INSERT INTO wallets (user_id, balance, updated_at)
                 VALUES ($1, 0.00, NOW())`, [user.id]);
        }
        return reply.send({ user, token: 'session_verified' });
    }
    catch (error) {
        console.error('Clerk Login Error:', error);
        return reply.status(401).send({ error: 'Authentication failed', details: error.message });
    }
};
exports.clerkLogin = clerkLogin;
