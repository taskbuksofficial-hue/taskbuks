/**
 * Real API (Connects to Node.js Backend)
 * No Modules - Global Scope for file:// support
 */

// REPLACE WITH YOUR COMPUTER'S LOCAL IP (Simulate "Cloud")
// const BASE_URL = "http://10.0.2.2:3000"; // For Emulator
const LOCAL_IP_URL = "http://172.20.54.180:3000"; // For Physical Device

const getBaseUrl = () => {
    // If running on Vercel or any other web host
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol !== 'file:') {
        return window.location.origin;
    }
    // If running in APK (file://) or locally on Mac
    return LOCAL_IP_URL;
};

const BASE_URL = getBaseUrl();
window.API_BASE_URL = BASE_URL; // Global for debug

let authToken = null;

// Helper
const fetchJson = async (endpoint, options = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("API Call Failed:", e);
        throw e;
    }
};

window.api = {
    setToken(token) {
        authToken = token;
    },
    // 1. Get User Profile
    async getProfile() {
        return await fetchJson('/api/profile');
    },

    // 2. Get Offers
    async getOffers() {
        return await fetchJson('/api/offers');
    },

    // 3. Get Streak Status
    async getStreakStatus() {
        return await fetchJson('/api/streak');
    },

    // 4. Start Task
    async startTask(taskId) {
        return await fetchJson('/api/task/start', {
            method: 'POST',
            body: JSON.stringify({ taskId })
        });
    },

    // 5. Claim Daily Bonus
    async claimDailyBonus() {
        return await fetchJson('/api/bonus/claim', {
            method: 'POST'
        });
    },

    async completeTask(taskId) {
        // Verification logic often stays client-side for simple prototypes
        // or hits a verification endpoint
        return { status: "success", reward: 5 };
    },

    // 7. Clerk Login
    async loginWithClerk(token) {
        return await fetchJson('/auth/clerk', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    },

    async claimVideoReward() {
        return await fetchJson('/api/reward/video', {
            method: 'POST'
        });
    },

    // 8. Get CPX Surveys
    async getSurveys() {
        return await fetchJson('/api/surveys');
    },

    // 9. Get Transactions
    async getTransactions() {
        return await fetchJson('/api/transactions');
    }
};
