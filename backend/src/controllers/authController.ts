
import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as db from '../config/db';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

// Register specific schema
interface RegisterBody {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    referral_code?: string;
}

interface LoginBody {
    identifier: string; // Email or Username (though we primarily use email)
    password: string;
}

export const register = async (req: FastifyRequest, reply: FastifyReply) => {
    const { full_name, email, phone_number, password, referral_code } = req.body as RegisterBody;

    if (!email || !password || !full_name) {
        return reply.status(400).send({ error: 'Missing required fields' });
    }

    try {
        // 1. Check if user exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return reply.status(409).send({ error: 'User already exists' });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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
        const newUserResult = await db.query(
            `INSERT INTO users (email, password_hash, full_name, phone_number, referral_code, referred_by, current_streak, last_claim_date, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, 0, NULL, NOW())
             RETURNING *`,
            [email, hashedPassword, full_name, phone_number, newReferralCode, referredBy]
        );
        const user = newUserResult.rows[0];

        // 6. Handle Rewards Logic
        const referralReward = 0.50; // ₹0.50
        const referralCoins = 500;   // 500 coins
        let initialBalance = 0.00;
        let initialCoins = 0;

        if (referredBy) {
            // Find referrer ID
            const referrerResult = await db.query('SELECT id FROM users WHERE referral_code = $1', [referredBy]);
            if (referrerResult.rows.length > 0) {
                const referrerId = referrerResult.rows[0].id;

                // 6a. Credit Referrer
                await db.query(
                    `UPDATE wallets SET 
                        balance = balance + $1, 
                        total_earned = total_earned + $1,
                        total_coins = COALESCE(total_coins, 0) + $2,
                        updated_at = NOW() 
                     WHERE user_id = $3`,
                    [referralReward, referralCoins, referrerId]
                );
                await db.query(
                    `INSERT INTO transactions (user_id, amount, coins, description, type, status, created_at)
                     VALUES ($1, $2, $3, $4, 'REFERRAL', 'COMPLETED', NOW())`,
                    [referrerId, referralReward, referralCoins, `Referral Reward: ${full_name} joined`]
                );

                // 6b. Set Initial Balance for New User
                initialBalance = referralReward;
                initialCoins = referralCoins;
            }
        }

        // 7. Create Wallet
        await db.query(
            `INSERT INTO wallets (user_id, balance, total_earned, total_coins, updated_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [user.id, initialBalance, initialBalance, initialCoins]
        );

        // 8. Log Transaction for New User if rewarded
        if (initialBalance > 0) {
            await db.query(
                `INSERT INTO transactions (user_id, amount, coins, description, type, status, created_at)
                 VALUES ($1, $2, $3, $4, 'REFERRAL', 'COMPLETED', NOW())`,
                [user.id, initialBalance, initialCoins, 'Welcome Reward (Referral Used)']
            );
        }

        // 9. Generate Token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        // Remove sensitive data
        delete user.password_hash;

        // Attach Initial Wallet Data
        const userData = {
            ...user,
            balance: initialBalance,
            lifetimeEarnings: initialBalance
        };

        return reply.send({ user: userData, token });

    } catch (error) {
        console.error('Register Error:', error);
        return reply.status(500).send({ error: 'Registration failed', details: (error as any).message });
    }
};

export const login = async (req: FastifyRequest, reply: FastifyReply) => {
    const { identifier, password } = req.body as LoginBody;

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

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        // 3. Generate Token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        // Remove sensitive data
        delete user.password_hash;

        // 4. Fetch Wallet & Earnings
        const walletResult = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [user.id]);
        const earningsResult = await db.query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type = 'credit'",
            [user.id]
        );

        const userData = {
            ...user,
            balance: parseFloat(walletResult.rows[0]?.balance || 0),
            lifetimeEarnings: parseFloat(earningsResult.rows[0]?.total || 0)
        };

        return reply.send({ user: userData, token });

    } catch (error) {
        console.error('Login Error:', error);
        return reply.status(500).send({ error: 'Login failed' });
    }
};
