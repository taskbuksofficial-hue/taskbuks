/**
 * Real API (Connects to Node.js Backend)
 * No Modules - Global Scope for file:// support
 */

// REPLACE WITH YOUR COMPUTER'S LOCAL IP (Simulate "Cloud")
// const BASE_URL = "http://10.0.2.2:3000"; // For Emulator
const BASE_URL = "http://172.20.54.180:3000"; // For Physical Device

// Helper
const fetchJson = async (endpoint, options = {}) => {
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("API Call Failed:", e);
        throw e;
    }
};

// Attach to window for global access
window.api = {
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
        return await fetchJson('/api/bonus', {
            method: 'POST'
        });
    },

    async completeTask(taskId) {
        // Verification logic often stays client-side for simple prototypes
        // or hits a verification endpoint
        return { status: "success", reward: 5 };
    }
};
