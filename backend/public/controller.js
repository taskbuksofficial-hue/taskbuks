/**
 * Controller (Business Logic)
 * Decouples UI from State/API. Handles optimistic updates and error recovery.
 * No Modules - Uses Global window.store and window.api
 */

// Access globals
const store = window.store;
const api = window.api;

window.controller = {
    // Login with Email/Pass
    async login(email, password) {
        try {
            const res = await api.login(email, password);
            if (res.user && res.token) {
                this.handleAuthSuccess(res.user, res.token);
                return true;
            }
        } catch (error) {
            console.error("Login failed:", error);
            throw error; // Propagate to UI
        }
        return false;
    },

    // Register
    async register(data) {
        try {
            const res = await api.register(data);
            if (res.user && res.token) {
                this.handleAuthSuccess(res.user, res.token);
                return true;
            }
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        }
        return false;
    },

    // Validating Local Token
    async loginWithToken(token) {
        try {
            window.api.setToken(token);
            // We just fetch profile to validate. 
            // If token is invalid, getProfile will throw 401
            const profile = await api.getProfile();
            if (profile) {
                // Determine wallet from profile
                const wallet = {
                    currentBalance: parseFloat(profile.balance) || 0,
                    lifetimeEarnings: parseFloat(profile.lifetimeEarnings) || 0,
                    totalCoins: parseInt(profile.total_coins) || 0
                };

                const newState = {
                    user: profile,
                    wallet: { ...store.getState().wallet, ...wallet }
                };
                store.setState(newState);

                // Re-save user cache?
                localStorage.setItem('tb_user_cache', JSON.stringify(newState));
                return true;
            }
        } catch (error) {
            console.error("Token validation failed:", error);
            return false;
        }
    },

    // Central Auth Success Handler
    handleAuthSuccess(user, token) {
        window.api.setToken(token);
        localStorage.setItem('auth_token', token);

        const newState = {
            user: user,
            wallet: {
                currentBalance: parseFloat(user.balance || 0),
                lifetimeEarnings: parseFloat(user.lifetimeEarnings || 0)
            }
        };
        store.setState(newState);
        localStorage.setItem('tb_user_cache', JSON.stringify(newState));

        // Trigger dashboard load
        this.loadDashboard();
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
            // We use allSettled or catch individually to prevent one failure from blocking the others
            const [profile, offers, streakStatus, transactions] = await Promise.all([
                api.getProfile(), // Profile is critical, let it fail if needed? No, we need it.
                api.getOffers().catch(err => { console.warn("Offers failed", err); return []; }),
                api.getStreakStatus().catch(err => { console.warn("Streak failed", err); return { streak: 0, claimedToday: false }; }),
                api.getTransactions().catch(err => { console.warn("Tx failed", err); return []; })
            ]);

            if (!profile) throw new Error("Failed to load profile");

            const newData = {
                user: profile,
                wallet: {
                    currentBalance: parseFloat(profile.balance) || 0,
                    lifetimeEarnings: parseFloat(profile.lifetimeEarnings) || 0,
                    totalCoins: parseInt(profile.total_coins || 0)
                },
                tasks: {
                    ...store.getState().tasks,
                    available: offers || []
                },
                dailyStreak: {
                    ...store.getState().dailyStreak,
                    currentStreak: streakStatus.streak || 0,
                    isClaimedToday: streakStatus.claimedToday || false
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
                store.setState({ ui: { ...store.getState().ui, isLoading: false, error: "Failed to load dashboard: " + error.message } });
                throw error;
            }
        }
    },

    async updateProfile(fullName, phoneNumber) {
        try {
            const res = await api.updateProfile({ full_name: fullName, phone_number: phoneNumber });
            if (res.success && res.user) {
                const state = store.getState();
                const newState = {
                    ...state,
                    user: { ...state.user, ...res.user }
                };
                store.setState(newState);
                localStorage.setItem('tb_user_cache', JSON.stringify(newState)); // Update cache
                // Update dashboard cache too if needed, but 'user' is inside 'newState' which is what we might verify
                this.loadDashboard(); // Refresh full state just in case
                return true;
            }
        } catch (error) {
            console.error("Update Profile Failed:", error);
            throw error;
        }
        return false;
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

    // 6. Claim Daily Bonus (Normal or 10X)
    async claimDailyBonus(multiplier = 1) {
        const state = store.getState();
        if (state.dailyStreak.isClaimedToday) {
            window.showToast("Already claimed for today!");
            return;
        }

        try {
            const res = await api.claimDailyBonus(multiplier);
            if (res.success) {
                // Update local state with real DB values
                store.setState(s => ({
                    dailyStreak: {
                        ...s.dailyStreak,
                        isClaimedToday: true,
                        currentStreak: res.streak,
                        lastClaimDate: new Date().toDateString()
                    },
                    wallet: {
                        ...s.wallet,
                        currentBalance: res.newBalance,
                        totalCoins: (res.newBalance * 1000)
                    }
                }));

                window.showToast(`Success! +${res.reward} coins credited.`);
                this.loadDashboard(); // Refresh full state
            }
        } catch (error) {
            console.error("Daily Bonus failed:", error);
            window.showToast("Failed to claim bonus. Try again.");
        }
    },

    async claimDailyBonus10X() {
        const state = store.getState();
        if (state.dailyStreak.isClaimedToday) {
            window.showToast("Already claimed for today!");
            return;
        }

        // 1. Trigger Rewarded Video
        if (window.ads && window.ads.showRewarded) {
            window.showToast("Loading Video Ad for 10X Bonus...");
            window.ads.showRewarded(async (amount) => {
                if (amount > 0) {
                    // Ad completed - claim 10X!
                    await this.claimDailyBonus(10);
                } else {
                    window.showToast("Ad not completed. 10X bonus cancelled.");
                }
            });
        } else {
            window.showToast("Ads not available. Try normal claim.");
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
            // Reset state
            store.setState({
                user: null,
                wallet: { currentBalance: 0, lifetimeEarnings: 0 },
                tasks: { available: [], ongoing: [], completed: [] },
                transactions: []
            });
            localStorage.removeItem('auth_token');
            localStorage.removeItem('tb_dashboard_cache');
            localStorage.removeItem('tb_user_cache');
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
        const state = store.getState();
        const userId = state.user && state.user.id ? state.user.id : "guest";
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
