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
                const newState = { user: res.user, wallet: { ...store.getState().wallet, ...res.wallet } };
                store.setState(newState);
                localStorage.setItem('tb_user_cache', JSON.stringify(newState)); // Cache User
            }
        } catch (error) {
            console.error("Login sync failed:", error);
        }
    },

    // Initial Data Load
    async loadDashboard() {
        // 1. Try Cache First for Instant Load
        const cached = localStorage.getItem('tb_dashboard_cache');
        if (cached) {
            console.log("Loading using Cache...");
            try {
                const data = JSON.parse(cached);
                store.setState({ ...data, ui: { ...store.getState().ui, isLoading: false } });
            } catch (e) { console.error("Cache parse error", e); }
        } else {
            store.setState({ ui: { ...store.getState().ui, isLoading: true } });
        }

        try {
            // 2. Network Fetch (Background/Update)
            const [profile, offers, streakStatus, transactions] = await Promise.all([
                api.getProfile(),
                api.getOffers(),
                api.getStreakStatus(),
                api.getTransactions().catch(() => [])
            ]);

            const newData = {
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
            };

            store.setState(newData);
            localStorage.setItem('tb_dashboard_cache', JSON.stringify(newData)); // Update Cache

        } catch (error) {
            console.error(error);
            // Only set error if no cache was loaded
            if (!cached) {
                store.setState({ ui: { ...store.getState().ui, isLoading: false, error: "Failed to load dashboard." } });
            }
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

    // 6. Claim Daily Bonus (Progressive: 100, 110, 120...)
    async claimDailyBonus() {
        const state = store.getState();
        if (state.dailyStreak.isClaimedToday) {
            alert("Already claimed for today!");
            return;
        }

        const streak = state.dailyStreak.currentStreak || 0;
        const bonusCoins = 100 + (streak * 10); // 100, 110, 120, 130...

        // Optimistic Update
        store.setState(s => ({
            dailyStreak: {
                ...s.dailyStreak,
                isClaimedToday: true,
                currentStreak: (s.dailyStreak.currentStreak || 0) + 1,
                lastClaimDate: new Date().toDateString()
            }
        }));

        // Credit Coins via Central Method
        this.addCoins(bonusCoins, `Daily Bonus (Day ${streak + 1})`);

        // Show Ad (Verification)
        if (window.ads) {
            setTimeout(() => {
                window.ads.showInterstitial();
            }, 500);
        }

        // Server Sync (Fire & Forget/Background)
        try {
            await api.claimDailyBonus();
        } catch (error) {
            console.warn("Background sync failed for bonus, but client state updated.", error);
            // We do NOT rollback here to prevent "Network Error" frustration.
            // Trust the client state for now.
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
    },

    /**
     * Central coin crediting function
     * 1000 coins = ₹1
     * All games and tasks call this to credit coins
     */
    addCoins(coins, description) {
        if (!coins || coins <= 0) return;
        var rupees = coins / 1000;
        var state = store.getState();
        store.setState(function (s) {
            return {
                wallet: {
                    ...s.wallet,
                    currentBalance: (s.wallet.currentBalance || 0) + rupees,
                    lifetimeEarnings: (s.wallet.lifetimeEarnings || 0) + rupees,
                    totalCoins: (s.wallet.totalCoins || 0) + coins
                },
                transactions: [{
                    id: Date.now(),
                    amount: rupees,
                    coins: coins,
                    description: description || ('Earned ' + coins + ' coins'),
                    date: new Date().toISOString(),
                    type: 'credit'
                }, ...(s.transactions || [])]
            };
        });
        console.log('[Wallet] +' + coins + ' coins (₹' + rupees.toFixed(4) + ') | ' + description);

        // Trigger re-render
        if (window.render) window.render();

        // Server Sync
        api.addCoins(coins, description).then(() => {
            console.log("Coins synced to server.");
        }).catch(err => {
            console.warn("Coin sync failed:", err);
        });
    }
};
