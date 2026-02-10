/**
 * Mock API (Simulates AWS Lambda)
 * No Modules - Global Scope for file:// support
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Attach to window for global access
window.api = {
    // 1. Get User Profile
    async getProfile() {
        await delay(800);
        return {
            name: "Sumit Kumar",
            phone: "+91 89500 13181",
            email: "sumitkumards07@gmail.com",
            referralCode: "BUKS8829",
            isEmailVerified: false,
            gender: "Male"
        };
    },

    // 2. Get Offers
    async getOffers() {
        await delay(1200); // Simulate network
        return [
            { id: 1, title: "Fotos AI", subtitle: "Get your insurance photos and took...", reward: 5, icon: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDq5TlMA6symkk6XKAes7jsOVejrkeb3XmL62FpmIAWMVrjVaKWXfcQW8KdNVbdN1cIHhBqAZs3e6HUyfs9uLTgmyDoFputwvjkdJleHY_6JzcXC3ikTilVh2pVRIFHS8LamVQKVq2iVmNuQ_ZHm4879z-aUTlAw8mqdxCPngSvUvHM9fTOUmKezNlilqBagT01n-OmJet7Vq-JHuw7qAlMyV2ZoEKv3-zRRbXRRwUug-WaIyNMADFrb5W9cK8T-jvPZzTFEzbIuw", bgColor: "bg-indigo-500", category: "App" },
            { id: 2, title: "Bajaj Markets", subtitle: "Get your markets for Bajaj station...", reward: 150, textIcon: "M", bgColor: "bg-cyan-500", category: "Finance" },
            { id: 3, title: "Foundit", subtitle: "Earn life more material task...", reward: 10, materialIcon: "psychology", bgColor: "bg-purple-600", category: "Jobs" },
            { id: 4, title: "Dream11", subtitle: "Play fantasy cricket and win big...", reward: 50, materialIcon: "sports_cricket", bgColor: "bg-red-600", category: "Games" },
            { id: 5, title: "Unacademy", subtitle: "Crack your goals with India's platform...", reward: 20, materialIcon: "school", bgColor: "bg-blue-600", category: "Education" }
        ];
    },

    // 3. Get Streak Status
    async getStreakStatus() {
        await delay(500);
        return {
            streak: Math.floor(Math.random() * 5),
            claimedToday: false
        };
    },

    // 4. Start Task
    async startTask(taskId) {
        await delay(600);
        // Simulate 90% success
        if (Math.random() > 0.1) return { success: true };
        throw new Error("Network error");
    },

    // 5. Claim Daily Bonus
    async claimDailyBonus() {
        await delay(600);
        if (Math.random() < 0.2) throw new Error("Failed to claim bonus. Try again.");
        return { status: "success", newBalance: 105 }; // Mock response
    },

    async completeTask(taskId) {
        await delay(1000);
        return { status: "success", reward: 5 };
    }
};
