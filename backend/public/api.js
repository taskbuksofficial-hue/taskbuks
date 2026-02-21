/**
 * Real API (Connects to Node.js Backend)
 * No Modules - Global Scope for file:// support
 */

// REPLACE WITH YOUR COMPUTER'S LOCAL IP (Simulate "Cloud")
// const BASE_URL = "http://10.0.2.2:3000"; // For Emulator
const LOCAL_IP_URL = "https://taskbuks.vercel.app"; // For Physical Device

const getBaseUrl = () => {
    // Specifically handle the Android virtual domain
    if (window.location.hostname === 'app.assets.local') {
        return LOCAL_IP_URL;
    }
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

        // Parse JSON regardless of status
        let data;
        try {
            data = await res.json();
        } catch (err) {
            // Handle empty or non-JSON responses
            data = null;
        }

        if (!res.ok) {
            // Use the error message from backend if available
            const errorMessage = data?.error || `API Error: ${res.status}`;
            throw new Error(errorMessage);
        }

        return data;
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

    async updateProfile(data) {
        return await fetchJson('/api/profile', {
            method: 'POST',
            body: JSON.stringify(data)
        });
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
    async claimDailyBonus(multiplier = 1) {
        return await fetchJson('/api/bonus/claim', {
            method: 'POST',
            body: JSON.stringify({ multiplier })
        });
    },

    async completeTask(taskId) {
        // Verification logic often stays client-side for simple prototypes
        // or hits a verification endpoint
        return { status: "success", reward: 5 };
    },

    // 7. Custom Auth
    async login(identifier, password) {
        return await fetchJson('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
        });
    },

    async register(data) {
        return await fetchJson('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
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
    },

    // 10. Add Coins (Generic)
    async addCoins(coins, description) {
        return await fetchJson('/api/coins/add', {
            method: 'POST',
            body: JSON.stringify({ coins, description })
        });
    }
};
