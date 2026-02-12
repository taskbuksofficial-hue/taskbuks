import { FastifyReply, FastifyRequest } from 'fastify';
import * as db from '../config/db';
import crypto from 'crypto';

export const getProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const walletResult = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);

        if (userResult.rows.length === 0) {
            return reply.status(404).send({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        const wallet = walletResult.rows[0] || { balance: 0 };

        return reply.send({
            ...user,
            balance: wallet.balance,
            isEmailVerified: true // Simplified
        });
    } catch (error) {
        console.error("getProfile error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getOffers = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const userId = (req as any).userId || "guest";
        const appId = process.env.ADGEM_APP_ID || "31963";

        const dbRes = await db.query('SELECT * FROM tasks WHERE is_active = true ORDER BY created_at DESC');
        const dbTasks = dbRes.rows.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            reward: parseFloat(t.reward) || 0,
            icon_url: t.icon_url,
            type: 'internal'
        }));

        // Try to fetch from AdGem (with timeout/error handling)
        let adgemOffers: any[] = [];
        const adgemUrl = `https://api.adgem.com/v1/wall/json?playerid=${userId}&appid=${appId}`;

        try {
            console.log("Fetching AdGem offers:", adgemUrl);
            const adgemRes = await fetch(adgemUrl, { signal: AbortSignal.timeout(5000) });
            const adgemData = await adgemRes.json() as any;

            // Correct Parsing: data[0].data contains the offers in the Wall JSON API
            if (adgemData && adgemData.data && adgemData.data[0] && adgemData.data[0].data) {
                adgemOffers = adgemData.data[0].data.map((offer: any) => ({
                    id: `adgem_${offer.campaign_id}`,
                    title: offer.name,
                    description: offer.instructions || offer.description,
                    reward: parseFloat(offer.amount) || 0,
                    icon_url: offer.icon,
                    type: 'adgem',
                    link: offer.url
                }));
            }
        } catch (e) {
            console.warn("AdGem fetch failed, continuing with DB tasks only:", e);
        }

        return reply.send([...adgemOffers, ...dbTasks]);
    } catch (error) {
        console.error("getOffers major failure:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getStreak = async (req: FastifyRequest, reply: FastifyReply) => {
    // Basic streak mock
    return reply.send({
        streak: 3,
        claimedToday: false
    });
};

export const startTask = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const { taskId } = req.body as { taskId: string };

    try {
        await db.query(
            'INSERT INTO user_tasks (user_id, task_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [userId, taskId, 'STARTED']
        );
        return reply.send({ success: true, status: 'started' });
    } catch (error) {
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const claimBonus = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const bonusAmount = 1.00;

    try {
        await db.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
            [bonusAmount, userId]
        );

        const walletRes = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);

        return reply.send({ success: true, newBalance: walletRes.rows[0].balance });
    } catch (error) {
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
export const claimVideoReward = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const rewardAmount = 10.0; // Consistent with JS reward amount

    try {
        await db.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
            [rewardAmount, userId]
        );

        const walletRes = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);

        return reply.send({ success: true, newBalance: walletRes.rows[0].balance });
    } catch (error) {
        console.error("claimVideoReward error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const handleAdGemPostback = async (req: FastifyRequest, reply: FastifyReply) => {
    const { player_id, amount, transaction_id } = req.query as { player_id: string, amount: string, transaction_id: string };
    const query = req.query as any;

    // Security Verification (Postback Hashing v2)
    if (process.env.ADGEM_POSTBACK_KEY && query.verifier) {
        try {
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const host = req.headers['host'];
            const originalUrl = `${protocol}://${host}${req.url}`;

            // AdGem says: remove verifier from the end of the URL
            const urlToHash = originalUrl.split('&verifier=')[0];

            const expectedSignature = crypto
                .createHmac('sha256', process.env.ADGEM_POSTBACK_KEY)
                .update(urlToHash)
                .digest('hex');

            if (expectedSignature !== query.verifier) {
                console.warn("AdGem Postback: Signature mismatch");
                return reply.status(401).send({ error: 'Invalid verifier' });
            }
        } catch (e) {
            console.error("Verification failed", e);
        }
    }

    if (!player_id || !amount) {
        return reply.status(400).send({ error: 'Missing parameters' });
    }

    try {
        await db.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
            [amount, player_id]
        );
        return reply.send({ success: true });
    } catch (error) {
        console.error("handleAdGemPostback error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const handleCPXPostback = async (req: FastifyRequest, reply: FastifyReply) => {
    const { user_id, amount_local, trans_id, status, hash } = req.query as {
        user_id: string,
        amount_local: string,
        trans_id: string,
        status: string,
        hash: string
    };

    console.log("CPX Postback received:", req.query);

    // Basic status check
    if (status !== 'qualified') {
        return reply.send({ success: true, message: 'Status not qualified' });
    }

    if (!user_id || !amount_local) {
        return reply.status(400).send({ error: 'Missing parameters' });
    }

    // Security check (if CPX_SECRET_KEY is provided)
    if (process.env.CPX_SECRET_KEY && hash) {
        const expectedHash = crypto
            .createHash('md5')
            .update(`${trans_id}-${process.env.CPX_SECRET_KEY}`)
            .digest('hex');

        if (expectedHash !== hash) {
            console.warn("CPX Hash mismatch");
            // return reply.status(401).send({ error: 'Invalid hash' });
        }
    }

    try {
        await db.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
            [amount_local, user_id]
        );

        // Log transaction
        await db.query(
            'INSERT INTO transactions (user_id, amount, description, type) VALUES ($1, $2, $3, $4)',
            [user_id, amount_local, 'Survey Reward (CPX)', 'SURVEY']
        );

        return reply.send({ success: true });
    } catch (error) {
        console.error("handleCPXPostback error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getCPXSurveys = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const appId = process.env.CPX_APP_ID || "31412"; // User provided App ID
    const secretKey = process.env.CPX_SECRET_KEY;

    if (!secretKey) {
        console.warn("CPX_SECRET_KEY not set, cannot fetch surveys securely.");
        return reply.send([]);
    }

    try {
        // Generate Secure Hash: md5(ext_user_id + secret_key)
        const secureHash = crypto
            .createHash('md5')
            .update(`${userId}-${secretKey}`)
            .digest('hex');

        const ipUser = req.ip; // Might need x-forwarded-for if behind proxy
        const userAgent = req.headers['user-agent'] || '';

        const url = `https://live-api.cpx-research.com/api/get-surveys.php?app_id=${appId}&ext_user_id=${userId}&output_method=api&ip_user=${ipUser}&user_agent=${encodeURIComponent(userAgent)}&limit=20&secure_hash=${secureHash}`;

        console.log("Fetching CPX Surveys:", url);

        const response = await fetch(url);
        const data = await response.json() as any;

        if (Array.isArray(data)) {
            return reply.send(data);
        } else if (data.status === 'error') {
            console.error("CPX API Error:", data.error);
            return reply.send([]);
        }

        return reply.send(data);

    } catch (error) {
        console.error("getCPXSurveys error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
