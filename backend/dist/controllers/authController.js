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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db = __importStar(require("../config/db"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';
const register = async (req, reply) => {
    const { full_name, email, phone_number, password, referral_code, upi_id, device_id } = req.body;
    if (!email || !password || !full_name) {
        return reply.status(400).send({ error: 'Missing required fields' });
    }
    // Password strength validation
    if (password.length < 6) {
        return reply.status(400).send({ error: 'Password must be at least 6 characters' });
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return reply.status(400).send({ error: 'Password must contain both letters and numbers' });
    }
    try {
        // Device limit: max 2 accounts per device
        if (device_id) {
            const deviceCheck = await db.query("SELECT COUNT(*) as count FROM users WHERE device_id = $1", [device_id]);
            if (parseInt(deviceCheck.rows[0].count) >= 2) {
                return reply.status(400).send({ error: 'Maximum 2 accounts per device. Contact support if needed.' });
            }
        }
        // 1. Check if user exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return reply.status(409).send({ error: 'User already exists' });
        }
        // 2. Hash Password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // 3. Generate Referral Code
        const newReferralCode = (full_name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X') || 'USER') + Math.floor(1000 + Math.random() * 9000);
        // 4. Handle Referrer
        let referredBy = null;
        if (referral_code) {
            const referrerCheck = await db.query('SELECT referral_code FROM users WHERE referral_code = $1', [referral_code]);
            if (referrerCheck.rows.length > 0) {
                referredBy = referral_code;
            }
        }
        // 5. Create User
        const newUserResult = await db.query(`INSERT INTO users (email, password_hash, full_name, phone_number, referral_code, referred_by, upi_id, device_id, current_streak, last_claim_date, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, NULL, NOW())
             RETURNING *`, [email, hashedPassword, full_name, phone_number, newReferralCode, referredBy, upi_id || null, device_id || null]);
        const user = newUserResult.rows[0];
        // 6. Handle Rewards Logic
        const referralReward = 0.50; // ₹0.50
        const referralCoins = 500; // 500 coins
        let initialBalance = 0.00;
        let initialCoins = 0;
        if (referredBy) {
            // Find referrer ID
            const referrerResult = await db.query('SELECT id FROM users WHERE referral_code = $1', [referredBy]);
            if (referrerResult.rows.length > 0) {
                const referrerId = referrerResult.rows[0].id;
                // 6a. Credit Referrer
                await db.query(`UPDATE wallets SET 
                        balance = balance + $1, 
                        total_earned = total_earned + $1,
                        total_coins = COALESCE(total_coins, 0) + $2,
                        updated_at = NOW() 
                     WHERE user_id = $3`, [referralReward, referralCoins, referrerId]);
                await db.query(`INSERT INTO transactions (user_id, amount, coins, description, type, status, created_at)
                     VALUES ($1, $2, $3, $4, 'REFERRAL', 'COMPLETED', NOW())`, [referrerId, referralReward, referralCoins, `Referral Reward: ${full_name} joined`]);
                // 6b. Set Initial Balance for New User
                initialBalance = referralReward;
                initialCoins = referralCoins;
            }
        }
        // 7. Create Wallet
        await db.query(`INSERT INTO wallets (user_id, balance, total_earned, total_coins, updated_at)
             VALUES ($1, $2, $3, $4, NOW())`, [user.id, initialBalance, initialBalance, initialCoins]);
        // 8. Log Transaction for New User if rewarded
        if (initialBalance > 0) {
            await db.query(`INSERT INTO transactions (user_id, amount, coins, description, type, status, created_at)
                 VALUES ($1, $2, $3, $4, 'REFERRAL', 'COMPLETED', NOW())`, [user.id, initialBalance, initialCoins, 'Welcome Reward (Referral Used)']);
        }
        // 9. Generate Token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        // Remove sensitive data
        delete user.password_hash;
        // Attach Initial Wallet Data
        const userData = {
            ...user,
            balance: initialBalance,
            lifetimeEarnings: initialBalance
        };
        return reply.send({ user: userData, token });
    }
    catch (error) {
        console.error('Register Error:', error);
        return reply.status(500).send({ error: 'Registration failed', details: error.message });
    }
};
exports.register = register;
const login = async (req, reply) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return reply.status(400).send({ error: 'Missing credentials' });
    }
    try {
        // 1. Find User by Email
        const result = await db.query('SELECT * FROM users WHERE email = $1', [identifier]);
        if (result.rows.length === 0) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        // 2. Check Password
        if (!user.password_hash) {
            return reply.status(401).send({ error: 'Please login with your previous method or reset password' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }
        // 3. Generate Token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        // Remove sensitive data
        delete user.password_hash;
        // 4. Fetch Wallet & Earnings
        const walletResult = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [user.id]);
        const earningsResult = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type = 'credit'", [user.id]);
        const userData = {
            ...user,
            balance: parseFloat(walletResult.rows[0]?.balance || 0),
            lifetimeEarnings: parseFloat(earningsResult.rows[0]?.total || 0)
        };
        return reply.send({ user: userData, token });
    }
    catch (error) {
        console.error('Login Error:', error);
        return reply.status(500).send({ error: 'Login failed' });
    }
};
exports.login = login;
