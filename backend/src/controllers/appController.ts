import { FastifyReply, FastifyRequest } from 'fastify';
import * as db from '../config/db';
import crypto from 'crypto';

export const getProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const walletResult = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);

        // Lifetime earnings = all credits (EARNING, BONUS, REFERRAL)
        const earningsResult = await db.query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type IN ('EARNING', 'BONUS', 'REFERRAL')",
            [userId]
        );

        // Total withdrawn (COMPLETED only)
        const withdrawnResult = await db.query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type = 'WITHDRAWAL' AND status = 'COMPLETED'",
            [userId]
        );

        // Pending withdrawals
        const pendingResult = await db.query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type = 'WITHDRAWAL' AND status = 'PENDING'",
            [userId]
        );

        if (userResult.rows.length === 0) {
            return reply.status(404).send({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        const wallet = walletResult.rows[0] || { balance: 0, total_earned: 0 };
        const balance = parseFloat(wallet.balance) || 0;
        const lifetimeEarnings = parseFloat(earningsResult.rows[0]?.total || '0');
        const totalWithdrawn = parseFloat(withdrawnResult.rows[0]?.total || '0');
        const pendingAmount = parseFloat(pendingResult.rows[0]?.total || '0');

        // Coins = balance * 1000 (1000 coins = ₹1)
        const totalCoins = Math.round(balance * 1000);

        return reply.send({
            ...user,
            balance,
            total_coins: totalCoins,
            lifetimeEarnings,
            totalWithdrawn,
            pendingAmount,
            isEmailVerified: true
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
    const userId = (req as any).userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const result = await db.query('SELECT last_claim_date, current_streak FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        const now = new Date();
        const lastClaim = user.last_claim_date ? new Date(user.last_claim_date) : null;

        let claimedToday = false;
        let streak = user.current_streak || 0;

        if (lastClaim) {
            const isToday = now.toDateString() === lastClaim.toDateString();
            if (isToday) {
                claimedToday = true;
            } else {
                // Check if streak is broken (more than 1 day gap)
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const isYesterday = yesterday.toDateString() === lastClaim.toDateString();

                if (!isYesterday) {
                    streak = 0; // Reset streak if they missed a day
                }
            }
        } else {
            // New user or never claimed
            streak = 0;
        }

        return reply.send({
            streak: streak,
            claimedToday: claimedToday,
            nextReward: 100 + (streak * 10)
        });
    } catch (error) {
        console.error("getStreak error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
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
    const { multiplier, fixed_reward } = req.body as { multiplier?: number, fixed_reward?: number };
    const rewardMultiplier = multiplier === 10 ? 10 : 1;

    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const result = await db.query('SELECT last_claim_date, current_streak FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        const now = new Date();
        const lastClaim = user.last_claim_date ? new Date(user.last_claim_date) : null;

        if (lastClaim && now.toDateString() === lastClaim.toDateString()) {
            return reply.status(400).send({ error: 'Already claimed today' });
        }

        let newStreak = 1;
        if (lastClaim) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (yesterday.toDateString() === lastClaim.toDateString()) {
                newStreak = (user.current_streak || 0) + 1;
            }
        }

        // NEW ECONOMY: ₹0.10/ad revenue, 50% margin = ₹0.05/ad to user
        // Free daily: 10 coins (₹0.01) + streak bonus of 2 coins/day
        // Ad-based: fixed 50 coins (₹0.05) = 50% of ₹0.10 ad revenue
        let bonusCoins;
        if (fixed_reward) {
            // Watch & Earn or ad-based claim
            bonusCoins = fixed_reward;
        } else if (rewardMultiplier === 10) {
            // 10X daily with ad = fixed 50 coins
            bonusCoins = 50;
        } else {
            // Free daily claim: 10 + (streak * 2), max 30 coins
            bonusCoins = Math.min(10 + (newStreak - 1) * 2, 30);
        }

        const bonusRupees = bonusCoins / 1000;

        // 1. Update User Streak
        await db.query(
            'UPDATE users SET current_streak = $1, last_claim_date = NOW() WHERE id = $2',
            [newStreak, userId]
        );

        // 2. Credit Wallet
        await db.query(
            `UPDATE wallets SET 
                balance = balance + $1, 
                total_earned = total_earned + $1,
                total_coins = COALESCE(total_coins, 0) + $2,
                updated_at = NOW() 
             WHERE user_id = $3`,
            [bonusRupees, bonusCoins, userId]
        );

        // 3. Log Transaction
        let description = `Daily Bonus (Day ${newStreak})`;
        if (fixed_reward) {
            description = `Watch & Earn (${fixed_reward} Coins)`;
        } else if (rewardMultiplier === 10) {
            description = `Daily Bonus 10X (Day ${newStreak})`;
        }

        await db.query(
            `INSERT INTO transactions (user_id, amount, coins, description, type, status, created_at)
             VALUES ($1, $2, $3, $4, 'BONUS', 'COMPLETED', NOW())`,
            [userId, bonusRupees, bonusCoins, description]
        );

        const walletRes = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);

        return reply.send({
            success: true,
            newBalance: walletRes.rows[0].balance,
            streak: newStreak,
            reward: bonusCoins
        });
    } catch (error) {
        console.error("claimBonus error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
export const claimVideoReward = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const rewardAmount = 0.05; // 50 coins = ₹0.05 (50% of ₹0.10 ad revenue)

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

export const addCoins = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const { coins, description } = req.body as { coins: number, description: string };

    if (!coins || coins <= 0) {
        return reply.status(400).send({ error: 'Invalid coin amount' });
    }

    const rupees = coins / 1000;

    try {
        await db.query(
            'UPDATE wallets SET balance = balance + $1, total_coins = COALESCE(total_coins, 0) + $2, updated_at = NOW() WHERE user_id = $3',
            [rupees, coins, userId]
        );

        // Record transaction
        await db.query(
            "INSERT INTO transactions (user_id, amount, coins, description, type, status) VALUES ($1, $2, $3, $4, 'EARNING', 'COMPLETED')",
            [userId, rupees, coins, description || 'Game Reward']
        );

        const walletRes = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);

        return reply.send({ success: true, newBalance: walletRes.rows[0].balance });
    } catch (error) {
        console.error("addCoins error:", error);
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

        // DEBUG: Log CPX Response
        console.log("CPX API Status:", response.status);
        console.log("CPX API Response:", JSON.stringify(data).substring(0, 500)); // Log first 500 chars

        if (Array.isArray(data)) {
            return reply.send(data);
        } else if (data.surveys) {
            return reply.send(data.surveys); // CPX sometimes returns { surveys: [...] }
        } else if (data.error || data.status === 'error') {
            console.error("CPX API Error:", data.error || data.message || "Unknown Error");
            return reply.send([]);
        }

        console.warn("CPX returned unexpected format:", JSON.stringify(data).substring(0, 100));
        return reply.send([]); // Fallback empty array

    } catch (error) {
        console.error("getCPXSurveys error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getTransactions = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const result = await db.query(
            'SELECT id, amount, description, type, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        return reply.send(result.rows);
    } catch (error) {
        console.error("getTransactions error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const handleRapidReachPostback = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const query = req.query as any;
        const userId = query.user_id || query.u;
        const amount = parseFloat(query.amount || query.a || '0');
        const transId = query.trans_id || query.t || query.transaction_id || `rr_${Date.now()}`;
        const status = query.status || query.s || 'completed';

        console.log(`RapidReach Postback received:`, JSON.stringify(query));
        console.log(`Parsed: user=${userId}, amount=${amount}, trans=${transId}, status=${status}`);

        if (!userId || !amount) {
            console.error('RapidReach: Missing user_id or amount');
            return reply.status(200).send('1'); // Always return 1 to avoid retries
        }

        // Check for duplicate
        const existing = await db.query(
            "SELECT id FROM transactions WHERE description LIKE $1",
            [`%RR:${transId}%`]
        );
        if (existing.rows.length > 0) {
            console.log('RapidReach: Duplicate transaction', transId);
            return reply.status(200).send('1');
        }

        // Ensure user exists (create minimal record if not)
        const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            // Store the postback data even without a user — log it
            console.warn(`RapidReach: User ${userId} not found in DB. Storing anyway.`);
            // Create a minimal user entry so FK constraint is satisfied
            await db.query(
                "INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
                [userId, `${userId}@postback.taskbuks.app`]
            );
        }

        // Ensure wallet exists (upsert)
        await db.query(
            "INSERT INTO wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING",
            [userId]
        );

        // Credit wallet
        await db.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
            [amount, userId]
        );

        // Record transaction
        await db.query(
            "INSERT INTO transactions (user_id, amount, description, type, status) VALUES ($1, $2, $3, 'EARNING', 'COMPLETED')",
            [userId, amount, `Survey Completed (RR:${transId})`]
        );

        console.log(`RapidReach: Successfully credited ${amount} to ${userId}`);
        return reply.status(200).send('1');
    } catch (error) {
        console.error("RapidReach postback error:", error);
        return reply.status(200).send('1'); // Return 1 even on error to prevent retries
    }
};

export const updateProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const { full_name, phone_number } = req.body as { full_name: string, phone_number: string };

    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        await db.query(
            'UPDATE users SET full_name = COALESCE($1, full_name), phone_number = COALESCE($2, phone_number) WHERE id = $3',
            [full_name, phone_number, userId]
        );

        // Fetch updated profile
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        delete user.password_hash; // Safety

        return reply.send({ success: true, user });
    } catch (error) {
        console.error("updateProfile error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

// --- WITHDRAWAL ENDPOINTS ---

export const requestWithdrawal = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { upiId, amount } = req.body as { upiId: string, amount: number };

    if (!upiId || !upiId.trim()) {
        return reply.status(400).send({ error: 'UPI ID is required' });
    }

    const withdrawAmount = parseFloat(String(amount));
    if (isNaN(withdrawAmount) || withdrawAmount < 100) {
        return reply.status(400).send({ error: 'Minimum withdrawal is ₹100' });
    }

    try {
        // Check for existing PENDING withdrawal
        const pendingCheck = await db.query(
            "SELECT id FROM transactions WHERE user_id = $1 AND type = 'WITHDRAWAL' AND status = 'PENDING'",
            [userId]
        );
        if (pendingCheck.rows.length > 0) {
            return reply.status(400).send({ error: 'You already have a pending withdrawal. Please wait for it to be processed.' });
        }

        // Check wallet balance
        const walletRes = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
        if (walletRes.rows.length === 0) {
            return reply.status(400).send({ error: 'Wallet not found' });
        }

        const currentBalance = parseFloat(walletRes.rows[0].balance);
        if (currentBalance < withdrawAmount) {
            return reply.status(400).send({ error: `Insufficient balance. You have ₹${currentBalance.toFixed(2)}` });
        }

        // Deduct from wallet
        await db.query(
            'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2',
            [withdrawAmount, userId]
        );

        // Create PENDING withdrawal transaction
        await db.query(
            `INSERT INTO transactions (user_id, amount, description, type, status, upi_id, created_at)
             VALUES ($1, $2, $3, 'WITHDRAWAL', 'PENDING', $4, NOW())`,
            [userId, withdrawAmount, `Withdrawal to UPI: ${upiId}`, upiId.trim()]
        );

        return reply.send({
            success: true,
            message: 'Withdrawal request submitted! Payments are processed manually within 24 hours.',
            withdrawal: {
                amount: withdrawAmount,
                upiId: upiId.trim(),
                status: 'PENDING'
            }
        });
    } catch (error) {
        console.error("requestWithdrawal error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getWithdrawalStatus = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        // Get the most recent withdrawal (PENDING first, then latest)
        const result = await db.query(
            `SELECT id, amount, upi_id, status, admin_notes, created_at, processed_at 
             FROM transactions 
             WHERE user_id = $1 AND type = 'WITHDRAWAL'
             ORDER BY 
                CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END,
                created_at DESC
             LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return reply.send({ hasWithdrawal: false });
        }

        const w = result.rows[0];
        return reply.send({
            hasWithdrawal: true,
            withdrawal: {
                id: w.id,
                amount: parseFloat(w.amount),
                upiId: w.upi_id,
                status: w.status,
                adminNotes: w.admin_notes,
                createdAt: w.created_at,
                processedAt: w.processed_at
            }
        });
    } catch (error) {
        console.error("getWithdrawalStatus error:", error);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
