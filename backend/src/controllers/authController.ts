import { FastifyReply, FastifyRequest } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../config/db';
import { User } from '../types';

const client = new OAuth2Client();

export const googleLogin = async (req: FastifyRequest, reply: FastifyReply) => {
    const { idToken } = req.body as { idToken: string };

    if (!idToken) {
        return reply.status(400).send({ error: 'Missing idToken' });
    }

    try {
        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken,
            // audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();

        if (!payload) {
            return reply.status(401).send({ error: 'Invalid token payload' });
        }

        const { sub: googleId, email, name, picture } = payload;

        // 2. Check if user exists in DB
        const existingUserResult = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        let user: User;

        if (existingUserResult.rows.length > 0) {
            // User exists, update info if needed (optional)
            user = existingUserResult.rows[0];
            // Update last login?
        } else {
            // Create new user
            // Generate a simple referral code from name or random
            const referralCode = (name?.substring(0, 4).toUpperCase() || 'USER') + Math.floor(1000 + Math.random() * 9000);

            const newUserResult = await db.query(
                `INSERT INTO users (id, email, full_name, avatar_url, referral_code, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())
                 RETURNING *`,
                [googleId, email, name, picture, referralCode]
            );
            user = newUserResult.rows[0];

            // Create a Wallet for the new user
            await db.query(
                `INSERT INTO wallets (user_id, balance, updated_at)
                 VALUES ($1, 0.00, NOW())`,
                [user.id]
            );
        }

        // 3. Return User Data (and maybe a session token for your app)
        return reply.send({
            user,
            token: 'session_token_placeholder' // In prod, generate a JWT here
        });

    } catch (error) {
        console.error('Login Error:', error);
        return reply.status(401).send({ error: 'Authentication failed' });
    }
};
