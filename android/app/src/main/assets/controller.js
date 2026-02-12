/**
 * Controller (Business Logic)
 * Decouples UI from State/API. Handles optimistic updates and error recovery.
 * No Modules - Uses Global window.store and window.api
 */

// Access globals
const store = window.store;
const api = window.api;

window.controller = {
    async loginWithClerk(token) {
        try {
            window.api.setToken(token);
            const res = await api.loginWithClerk(token);
            if (res.user) {
                store.setState({ user: res.user, wallet: { ...store.getState().wallet, ...res.wallet } });
            }
        } catch (error) {
            console.error("Login sync failed:", error);
            // Optional: Logout clerk if sync fails?
        }
    },

    // Initial Data Load
    async loadDashboard() {
        store.setState({ ui: { ...store.getState().ui, isLoading: true, error: null } });

        try {
            // Parallel Fetch
            const [profile, offers, streakStatus, transactions] = await Promise.all([
                api.getProfile(),
                api.getOffers(),
                api.getStreakStatus(),
                api.getTransactions().catch(() => [])
            ]);

            store.setState({
                user: profile,
                wallet: {
                    currentBalance: parseFloat(profile.balance) || 0,
                    lifetimeEarnings: parseFloat(profile.lifetimeEarnings) || 0
                },
                tasks: {
                    ...store.getState().tasks,
                    available: offers
                },
                dailyStreak: {
                    ...store.getState().dailyStreak,
                    currentStreak: streakStatus.streak,
                    isClaimedToday: streakStatus.claimedToday
                },
                transactions: transactions || [],
                ui: { ...store.getState().ui, isLoading: false }
            });
        } catch (error) {
            console.error(error);
            store.setState({ ui: { ...store.getState().ui, isLoading: false, error: "Failed to load dashboard." } });
        }
    },

    // Start Task Logic
    async startTask(taskId) {
        const state = store.getState();
        const task = state.tasks.available.find(t => t.id === taskId);
        if (!task) return;

        // 1. Optimistic Update
        const ongoingTask = { ...task, startedAt: new Date().toISOString(), status: 'started' };

        store.setState(s => ({
            tasks: {
                ...s.tasks,
                available: s.tasks.available.filter(t => t.id !== taskId),
                ongoing: [ongoingTask, ...s.tasks.ongoing]
            }
        }));

        // 3. Open URL (simulated)
        if (task.trackingUrl) {
            // In a real app we'd use window.open or Linking.openURL
            console.log(`Opening ${task.trackingUrl}`);
        }

        // 2. Server Sync
        try {
            await api.startTask(taskId);
            // Success - keep optimistic state
        } catch (error) {
            // Rollback on failure
            store.setState(s => ({
                tasks: {
                    ...s.tasks,
                    available: [...s.tasks.available, task].sort((a, b) => a.id - b.id),
                    ongoing: s.tasks.ongoing.filter(t => t.id !== taskId)
                }
            }));
            alert("Failed to start task. Please try again.");
        }
    },

    // Claim Daily Bonus Logic
    async claimDailyBonus() {
        const state = store.getState();
        if (state.dailyStreak.isClaimedToday) {
            return { success: false, message: "Already claimed today!" };
        }

        // 1. Optimistic Update
        const previousBalance = state.wallet.currentBalance;
        const bonusAmount = 1;

        store.setState(s => ({
            wallet: { ...s.wallet, currentBalance: s.wallet.currentBalance + bonusAmount },
            dailyStreak: { ...s.dailyStreak, isClaimedToday: true, currentStreak: s.dailyStreak.currentStreak + 1 },
            transactions: [{
                id: Date.now(),
                amount: bonusAmount,
                description: "Daily Login Bonus",
                date: new Date().toISOString(),
                type: 'credit'
            }, ...s.transactions || []]
        }));

        // 2. Server Sync
        try {
            await api.claimDailyBonus();
            // Show Ad
            if (window.ads) {
                window.ads.showInterstitial();
            }
        } catch (error) {
            // Rollback
            store.setState(s => ({
                wallet: { ...s.wallet, currentBalance: previousBalance },
                dailyStreak: { ...s.dailyStreak, isClaimedToday: false, currentStreak: s.dailyStreak.currentStreak - 1 },
                transactions: s.transactions.slice(1) // Remove the added transaction
            }));
            alert("Failed to claim bonus. Network error.");
        }
    },

    // Complete Task Logic (Simulation)
    async completeTask(taskId) {
        const state = store.getState();
        const task = state.tasks.ongoing.find(t => t.id === taskId);
        if (!task) return;

        // Optimistic
        store.setState(s => ({
            tasks: {
                ...s.tasks,
                ongoing: s.tasks.ongoing.filter(t => t.id !== taskId),
                completed: [...s.tasks.completed, { ...task, completedAt: new Date().toISOString() }]
            },
            wallet: {
                ...s.wallet,
                currentBalance: s.wallet.currentBalance + task.reward
            },
            transactions: [{
                id: Date.now(),
                amount: task.reward,
                description: `Task Completed: ${task.title}`,
                date: new Date().toISOString(),
                type: 'credit'
            }, ...s.transactions || []]
        }));
    },

    async signOut() {
        try {
            if (window.Clerk) {
                await window.Clerk.signOut();
            }
            // Reset state
            store.setState({
                user: null,
                wallet: { currentBalance: 0, lifetimeEarnings: 0 },
                tasks: { available: [], ongoing: [], completed: [] },
                transactions: []
            });
            window.location.reload(); // Hard reload to clear all states and re-init
        } catch (error) {
            console.error("Sign-out failed:", error);
            alert("Sign-out failed. Please try again.");
        }
    },

    async claimVideoReward() {
        try {
            const res = await api.claimVideoReward();
            if (res.success) {
                const currentWallet = store.getState().wallet;
                store.setState({
                    wallet: {
                        ...currentWallet,
                        currentBalance: res.newBalance
                    }
                });
                window.showToast(`Congrats! +₹10 credited.`);
            }
        } catch (error) {
            console.error("Video Reward failed:", error);
            window.showToast("Failed to process reward.");
        }
    },

    openAdGemOfferWall() {
        const userId = window.Clerk && window.Clerk.user ? window.Clerk.user.id : "guest";
        const adGemAppId = "2054"; // Placeholder App ID
        const url = `https://api.adgem.com/v1/wall?appid=${adGemAppId}&playerid=${userId}`;

        console.log("Opening AdGem Offer Wall:", url);
        window.open(url, '_blank');
    },

    async loadSurveys() {
        console.log("Loading CPX Surveys...");
        try {
            const surveys = await api.getSurveys();
            if (Array.isArray(surveys)) {
                store.setState(s => ({
                    tasks: { ...s.tasks, surveys }
                }));
            } else if (surveys.surveys && Array.isArray(surveys.surveys)) {
                // Some APIs return inside a key
                store.setState(s => ({
                    tasks: { ...s.tasks, surveys: surveys.surveys }
                }));
            } else if (surveys.top_surveys) {
                store.setState(s => ({
                    tasks: { ...s.tasks, surveys: surveys.top_surveys }
                }));
            }
        } catch (error) {
            console.error("Failed to load surveys:", error);
        }
    }
};
