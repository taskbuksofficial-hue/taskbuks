
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
            `INSERT INTO users (email, password_hash, full_name, phone_number, referral_code, referred_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING *`,
            [email, hashedPassword, full_name, phone_number, newReferralCode, referredBy]
        );
        const user = newUserResult.rows[0];

        // 6. Create Wallet
        await db.query(
            `INSERT INTO wallets (user_id, balance, updated_at)
             VALUES ($1, 0.00, NOW())`,
            [user.id]
        );

        // 7. Generate Token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        // Remove sensitive data
        delete user.password_hash;

        return reply.send({ user, token });

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
        // 1. Find User by Email (or we could add username support)
        const result = await db.query('SELECT * FROM users WHERE email = $1', [identifier]);

        if (result.rows.length === 0) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // 2. Check Password
        if (!user.password_hash) {
            // User might have signed up via social login previously
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

        return reply.send({ user, token });

    } catch (error) {
        console.error('Login Error:', error);
        return reply.status(500).send({ error: 'Login failed' });
    }
};
