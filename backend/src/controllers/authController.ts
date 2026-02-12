import { FastifyReply, FastifyRequest } from 'fastify';
import { Clerk } from '@clerk/clerk-sdk-node';
import * as db from '../config/db';
import { User } from '../types';

// Initialize Clerk (will need CLERK_SECRET_KEY in .env)
const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export const clerkLogin = async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = req.body as { token: string };

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
        const existingUserResult = await db.query(
            'SELECT * FROM users WHERE id = $1', // Assuming we use Clerk ID as our ID now, or map it
            [clerkId]
        );

        let user: User;

        if (existingUserResult.rows.length > 0) {
            user = existingUserResult.rows[0];
        } else {
            const referralCode = (userDetails.firstName?.substring(0, 4).toUpperCase() || 'USER') + Math.floor(1000 + Math.random() * 9000);

            const newUserResult = await db.query(
                `INSERT INTO users (id, email, full_name, avatar_url, referral_code, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())
                 RETURNING *`,
                [clerkId, email, name, picture, referralCode]
            );
            user = newUserResult.rows[0];

            await db.query(
                `INSERT INTO wallets (user_id, balance, updated_at)
                 VALUES ($1, 0.00, NOW())`,
                [user.id]
            );
        }

        return reply.send({ user, token: 'session_verified' });

    } catch (error) {
        console.error('Clerk Login Error:', error);
        return reply.status(401).send({ error: 'Authentication failed', details: (error as any).message });
    }
};
