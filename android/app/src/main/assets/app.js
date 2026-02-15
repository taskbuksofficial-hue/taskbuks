/**
 * Task Buks App
 * Main Entry Point - UI Wiring
 * Wrapped in IIFE to prevent global namespace collisions
 */
(function () {
    const store = window.store;
    const controller = window.controller;

    // --- UI RENDERERS ---

    function render() {
        console.log("Rendering UI...");
        const state = store.getState();
        const { user, wallet, tasks, transactions } = state;

        // 0. Skeleton vs Content
        const skeleton = document.getElementById('dashboard-skeleton');
        const content = document.getElementById('home-content'); // We need to wrap home content
        const taskContainer = document.getElementById('task-container');

        // Check if we have data to show (Cache or Network)
        const hasData = tasks.available && tasks.available.length > 0;

        if (state.ui.isLoading && !hasData) {
            if (skeleton) skeleton.classList.remove('hidden');
            if (taskContainer) taskContainer.classList.add('hidden');
        } else {
            if (skeleton) skeleton.classList.add('hidden');
            if (taskContainer) taskContainer.classList.remove('hidden');
        }

        // 1. Balance (in coins and rupees)
        var totalCoins = wallet.totalCoins || 0;
        var balanceRupees = parseFloat(wallet.currentBalance || 0);
        document.querySelectorAll('.user-balance').forEach(el =>
            el.textContent = `${totalCoins} 🪙`
        );

        // Lifetime Earnings
        document.querySelectorAll('.user-lifetime-earnings').forEach(el =>
            el.textContent = `₹${parseFloat(wallet.lifetimeEarnings || 0).toFixed(2)}`
        );

        // Withdraw progress (min ₹100)
        const progressBar = document.getElementById('withdraw-progress-bar');
        const progressText = document.getElementById('withdraw-progress-text');
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (progressBar) {
            const balance = parseFloat(wallet.currentBalance || 0);
            const pct = Math.min((balance / 100) * 100, 100);
            progressBar.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `₹${balance.toFixed(0)} / ₹100`;
            if (withdrawBtn) withdrawBtn.disabled = balance < 100;
        }

        // 2. Tasks (Home)
        const topOfferContainer = document.getElementById('top-offer-container');

        if (taskContainer) {
            const availableTasks = tasks.available || [];

            // Handle Top Offer (Show the first AdGem offer as Top Offer)
            const adgemOffer = availableTasks.find(t => t.type === 'adgem');
            if (adgemOffer && topOfferContainer) {
                topOfferContainer.innerHTML = `
                    <div class="relative z-10">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                                <img src="${adgemOffer.icon_url}" class="w-full h-full object-cover" alt="${adgemOffer.title}">
                            </div>
                            <div>
                                <h4 class="font-bold text-base dark:text-white leading-none">${adgemOffer.title}</h4>
                                <p class="text-[10px] text-slate-400 mt-1">High-paying game</p>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-gray-400 mb-4 leading-relaxed w-2/3">${adgemOffer.description}</p>
                        <div class="flex items-center gap-2">
                            <div class="bg-orange-500 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg shadow-orange-500/30">Start Earning ₹${adgemOffer.reward}</div>
                            <span class="text-[10px] font-bold text-orange-500 animate-pulse">Hot 🔥</span>
                        </div>
                    </div>
                    <div class="absolute right-[-10px] top-1/2 -translate-y-1/2 opacity-10">
                         <img src="${adgemOffer.icon_url}" class="w-32 h-32 object-cover rounded-full grayscale" alt="decoration">
                    </div>
                `;
                topOfferContainer.onclick = () => window.open(adgemOffer.link, '_blank');
            }

            if (availableTasks.length === 0) {
                taskContainer.innerHTML = `<div class="w-full text-center py-8 text-slate-400 text-xs">No tasks available right now.</div>`;
            } else {
                taskContainer.innerHTML = availableTasks.map(task => {
                    const reward = task.reward || task.payout_amount || 0;
                    const subtitle = task.description || task.subtitle || "Complete this task";
                    const bgColor = task.bg_color || task.bgColor || (task.type === 'adgem' ? 'bg-orange-500' : 'bg-indigo-500');
                    const iconUrl = task.icon_url || task.icon;

                    return `
                    <div class="min-w-[200px] bg-white dark:bg-gray-800 p-4 rounded-[24px] border border-gray-100 dark:border-gray-700 ios-shadow snap-start">
                        <div class="w-14 h-14 ${bgColor} rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                            ${iconUrl ? `<img src="${iconUrl}" class="w-full h-full object-cover" alt="${task.title}">` :
                            task.materialIcon ? `<span class="material-icons-round text-white text-3xl">${task.materialIcon}</span>` :
                                `<span class="text-white text-2xl font-black">${task.title.charAt(0)}</span>`}
                        </div>
                        <h4 class="font-bold text-base mb-1 dark:text-white truncate w-full">${task.title}</h4>
                        <div class="text-[11px] text-slate-400 dark:text-gray-400 line-clamp-2 mb-4 leading-snug min-h-[2.5em]">${subtitle}</div>
                        <div class="flex items-center bg-gray-50 dark:bg-gray-900 rounded-full p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors start-task-btn" data-id="${task.id}" data-link="${task.link}">
                            <span class="flex-1 text-center text-[11px] font-bold text-slate-400">Start</span>
                            <div class="bg-primary px-3 py-1.5 rounded-full flex items-center gap-1">
                                <span class="text-[11px] font-bold text-white">Get ₹${reward}</span>
                            </div>
                        </div>
                    </div>
                `;
                }).join('');

                // Attach listeners
                document.querySelectorAll('.start-task-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const id = btn.dataset.id;
                        const link = btn.dataset.link;

                        if (id.startsWith('adgem_') && link) {
                            window.open(link, '_blank');
                        } else {
                            console.log("Start Task Clicked:", id);
                            controller.startTask(id);
                            showToast("Task started! Check 'Ongoing'");
                        }
                    };
                });
            }
        }

        // 3. Rapido Reach Integration
        var rapidoUserId = null;
        if (user && user.id) {
            rapidoUserId = user.id;
        } else if (window.Clerk && window.Clerk.user && window.Clerk.user.id) {
            rapidoUserId = window.Clerk.user.id;
        }

        if (rapidoUserId && !window.rapidoInitialized) {
            console.log("Attempting Rapido Reach Init for user:", rapidoUserId);
            var container = document.getElementById('rapidoreach-container');
            if (container) {
                console.log("Rapido container found.");
                window.rapidoInitialized = true;
                try {
                    var appId = '4pfOJz6QQrm';
                    var appKey = '8afcb7f89adf0d55c2805a3a2277299f';
                    // Rapido Reach docs: checksum = full MD5(internalUserId-appId-appKey)
                    var checksum = window.md5(rapidoUserId + '-' + appId + '-' + appKey);
                    var finalUserId = rapidoUserId + '-' + appId + '-' + checksum;
                    var iframeUrl = 'https://www.rapidoreach.com/ofw/?userId=' + encodeURIComponent(finalUserId);
                    console.log("Rapido Reach URL:", iframeUrl);
                    container.innerHTML = '<iframe src="' + iframeUrl + '" style="width:100%;height:800px;border:none;border-radius:16px;" allow="clipboard-write" title="Rapido Reach Surveys"></iframe>';
                } catch (err) {
                    console.error("Rapido Init Error:", err);
                    container.innerHTML = '<div style="color:red;text-align:center;padding:16px;font-size:14px;">Survey Error: ' + err.message + '</div>';
                }
            } else {
                console.log("Rapido container NOT found in DOM.");
            }
        }

        // 3.5 Render API Surveys (if any)
        const surveyList = tasks.surveys || [];
        const cpxContainer = document.getElementById('rapidoreach-container');
        if (cpxContainer && surveyList.length > 0) {
            let listContainer = document.getElementById('api-survey-list');
            if (!listContainer) {
                listContainer = document.createElement('div');
                listContainer.id = 'api-survey-list';
                listContainer.className = 'space-y-3 mb-6 px-1';
                cpxContainer.parentNode.insertBefore(listContainer, cpxContainer);
            }

            listContainer.innerHTML = surveyList.map(s => {
                const payout = s.payout || '?';
                const link = s.link || '#';
                return `
                <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 ios-shadow flex items-center justify-between">
                    <div class="flex items-center gap-4">
                         <div class="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
                            <span class="material-icons-round">poll</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-sm dark:text-white">Premium Survey</h4>
                            <p class="text-xs text-slate-400">Earn ₹${payout}</p>
                        </div>
                    </div>
                    <button class="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-primary/30" onclick="window.open('${link}', '_blank')">
                        Start
                    </button>
                </div>
            `;
            }).join('');
        }

        // 4. Refer Code (generate client-side if backend doesn't provide)
        const codeEl = document.getElementById('referral-code');
        if (codeEl) {
            var refCode = (user && user.referralCode) ? user.referralCode : null;
            if (!refCode) {
                // Generate from Clerk user ID or fallback
                var uid = '';
                if (user && user.id) uid = user.id;
                else if (user && user.clerkId) uid = user.clerkId;
                else if (window.Clerk && window.Clerk.user) uid = window.Clerk.user.id;

                if (uid) {
                    // Use last 8 chars of user ID, uppercased
                    refCode = 'TB' + uid.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
                } else {
                    refCode = 'TB' + Math.random().toString(36).substring(2, 8).toUpperCase();
                }
                // Store it back on user object so share buttons can use it
                if (user) user.referralCode = refCode;
            }
            codeEl.textContent = refCode;
        }

        // 5. Transactions
        const txList = document.getElementById('transaction-list');
        if (txList) {
            const txs = transactions || [];
            if (txs.length === 0) {
                txList.innerHTML = `<div class="text-center py-8 text-slate-400 text-sm">
                    <span class="material-icons-round text-4xl block mb-2 opacity-30">receipt_long</span>
                    No transactions yet.<br><span class="text-xs">Complete tasks to start earning!</span>
                </div>`;
            } else {
                txList.innerHTML = txs.map(tx => {
                    const isCredit = tx.type === 'credit';
                    const date = tx.created_at || tx.date;
                    const icon = isCredit ? 'south_west' : 'north_east';
                    const iconBg = isCredit ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
                    const amountColor = isCredit ? 'text-green-500' : 'text-red-500';
                    const sign = isCredit ? '+' : '-';
                    return `
                    <div class="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                        <div class="flex items-center gap-3">
                             <div class="w-9 h-9 rounded-full ${iconBg} flex items-center justify-center">
                                <span class="material-icons-round text-sm">${icon}</span>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">${tx.description}</p>
                                <p class="text-[10px] text-slate-400">${date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                            </div>
                        </div>
                        <span class="text-sm font-bold ${amountColor}">${sign}₹${parseFloat(tx.amount).toFixed(2)}</span>
                    </div>
                `}).join('');
            }
        }
    }

    // --- DAILY BONUS RENDERING ---

    function renderStreak() {
        const state = store.getState();
        const streak = state.dailyStreak?.currentStreak || 0;
        const claimed = state.dailyStreak?.isClaimedToday || false;

        // Update streak badge
        const badge = document.getElementById('streak-badge');
        if (badge) badge.textContent = `🔥 ${streak} Day Streak`;

        // Update 7-day pills
        document.querySelectorAll('.streak-day').forEach(el => {
            const day = parseInt(el.dataset.day);
            const pill = el.querySelector('div');
            if (day <= streak) {
                pill.className = 'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold border-2 border-primary bg-primary text-white transition-all shadow-md shadow-primary/20';
                pill.innerHTML = '<span class="material-icons-round text-base">check</span>';
            }
        });

        // Update claim button
        const btn = document.getElementById('claim-bonus-btn');
        if (btn) {
            if (claimed) {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-icons-round text-sm align-middle mr-1">check_circle</span> Claimed Today!';
                btn.className = 'w-full bg-gray-200 dark:bg-gray-700 text-slate-400 font-bold py-3 rounded-xl text-sm cursor-not-allowed';
            } else {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-icons-round text-sm align-middle mr-1">redeem</span> Claim ₹1 Daily Bonus';
                btn.className = 'w-full bg-primary text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all';
            }
        }
    }

    // Global function for the onclick
    window.claimDailyBonusUI = async function () {
        const state = store.getState();
        if (state.dailyStreak?.isClaimedToday) {
            showToast('Already claimed today!');
            return;
        }

        await controller.claimDailyBonus();

        // After claiming, show the modal
        const streak = store.getState().dailyStreak?.currentStreak || 1;
        const amount = streak >= 7 ? 2 : 1;

        // Set earned amount
        const amountEl = document.getElementById('bonus-earned-amount');
        if (amountEl) amountEl.textContent = amount;

        // Build mini streak pills in modal
        const modalPills = document.getElementById('modal-streak-pills');
        if (modalPills) {
            let html = '';
            for (let i = 1; i <= 7; i++) {
                const isComplete = i <= streak;
                const isDay7 = i === 7;
                const reward = isDay7 ? '₹2' : '₹1';
                const bg = isComplete
                    ? 'bg-primary text-white border-primary'
                    : (isDay7 ? 'bg-amber-50 text-amber-600 border-amber-400' : 'bg-gray-50 text-slate-400 border-gray-200');
                html += `
                    <div class="flex flex-col items-center">
                        <div class="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold border-2 ${bg}">
                            ${isComplete ? '<span class="material-icons-round text-sm">check</span>' : reward}
                        </div>
                        <span class="text-[8px] text-slate-400 mt-0.5">Day ${i}</span>
                    </div>`;
            }
            modalPills.innerHTML = html;
        }

        // Show modal
        const modal = document.getElementById('bonus-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        // Re-render streak and balance
        renderStreak();
        render();
    };

    // --- SETUP ---

    function setupNavigation() {
        console.log("Setting up navigation...");
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.page-section');

        navItems.forEach(item => {
            item.onclick = (e) => {
                const targetId = item.dataset.target;
                console.log("Nav item clicked:", targetId);

                navItems.forEach(nav => {
                    nav.classList.remove('text-primary', 'active');
                    nav.classList.add('text-slate-400', 'dark:text-gray-500');
                });

                item.classList.remove('text-slate-400', 'dark:text-gray-500');
                item.classList.add('text-primary', 'active');

                sections.forEach(section => {
                    section.classList.add('hidden');
                    if (section.id === targetId) {
                        section.classList.remove('hidden');
                        if (targetId === 'surveys') {
                            controller.loadSurveys();
                        }
                    }
                });
            };
        });
    }

    // Global Helpers
    window.copyToClipboard = (text) => {
        console.log("Copy to clipboard:", text);
        navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
    };

    window.showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl z-[2000] transition-opacity duration-300 opacity-0';
        toast.textContent = message;
        document.body.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.remove('opacity-0');
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    };

    function setupGlobalListeners() {
        window.toggleTheme = () => {
            console.log("Toggle Theme clicked");
            const current = store.getState().ui.theme;
            const next = current === 'light' ? 'dark' : 'light';
            store.setState({ ui: { ...store.getState().ui, theme: next } });
            document.documentElement.classList.toggle('dark');
        };
    }

    function setupCarousel() {
        console.log("Setting up Home carousels...");

        const initCarousel = (id, dotClass) => {
            const carousel = document.getElementById(id);
            const dots = document.querySelectorAll(dotClass);
            if (!carousel || dots.length === 0) return;

            let currentIndex = 0;
            const slideCount = dots.length;

            // Auto slide
            const slideInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % slideCount;
                carousel.scrollTo({
                    left: carousel.offsetWidth * currentIndex,
                    behavior: 'smooth'
                });
            }, 4000 + Math.random() * 1000); // Offset timings

            // Update dots on scroll
            carousel.onscroll = () => {
                const index = Math.round(carousel.scrollLeft / carousel.offsetWidth);
                dots.forEach((dot, i) => {
                    dot.classList.toggle('bg-primary', i === index);
                    dot.classList.toggle('bg-gray-300', i !== index);
                });
                currentIndex = index;
            };

            // Pause auto-slide on touch
            carousel.ontouchstart = () => clearInterval(slideInterval);
        };

        // Init both
        initCarousel('home-carousel', '.carousel-dot');
        initCarousel('home-carousel-2', '.carousel-dot-2');
    }

    function setupGameCards() {
        console.log("Setting up Game Cards...");
        const buttons = document.querySelectorAll('.game-play-btn');
        buttons.forEach(btn => {
            btn.onclick = (e) => {
                const gameName = btn.dataset.game;
                const reward = btn.dataset.reward;
                console.log(`Playing ${gameName} for ${reward} coins`);

                // Route all games through miniGames
                if (window.miniGames) {
                    window.miniGames.openGame(gameName);
                } else {
                    showToast(`Starting ${gameName}...`);
                }
            };
        });
    }

    // Initialize
    const initApp = async () => {
        console.log("Initializing App...");

        // Initial setup
        setupNavigation();
        setupGlobalListeners();
        setupGameCards();
        store.subscribe(() => { render(); renderStreak(); });

        // Show Loading Overlay (Use Static)
        const loadingOverlay = document.getElementById('app-loading-overlay');
        if (loadingOverlay) loadingOverlay.style.opacity = '1';

        const updateStatus = (msg, isError = false) => {
            const el = document.getElementById('loading-status');
            if (el) el.textContent = msg;
            if (isError) {
                document.getElementById('loading-spinner')?.classList.add('hidden');
                document.getElementById('retry-init')?.classList.remove('hidden');
                document.getElementById('skip-init')?.classList.remove('hidden');

                document.getElementById('retry-init').onclick = () => window.location.reload();
                document.getElementById('skip-init').onclick = cleanup;
            }
        };

        const cleanup = () => {
            console.log("Removing loading overlay");
            const loadingOverlay = document.getElementById('app-loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.visibility = 'hidden';
                setTimeout(() => {
                    if (loadingOverlay.parentNode) loadingOverlay.remove();
                }, 600);
            }
            render();
        };

        // Safety Timeout (15s)
        const timeout = setTimeout(() => {
            updateStatus("Connection taking longer than expected...", true);
        }, 15000);

        try {
            // Wait for Clerk (Increased to 30s for very slow networks)
            let r = 0;
            while (!window.Clerk && r < 300) {
                await new Promise(res => setTimeout(res, 100));
                r++;
            }

            if (!window.Clerk) {
                updateStatus(`
                    <div class="flex flex-col items-center gap-4">
                        <p>Security module failed to load.</p>
                        <button onclick="location.reload()" class="bg-white text-red-500 px-4 py-2 rounded-full font-bold">
                            Retry Connection
                        </button>
                    </div>
                `, true);
                return;
            }

            await window.Clerk.load();

            if (window.Clerk.user) {
                console.log("User logged in:", window.Clerk.user.id);
                updateStatus("Syncing account...");
                try {
                    const token = await window.Clerk.session.getToken();
                    await controller.loginWithClerk(token);
                } catch (e) {
                    console.warn("Backend sync failed", e);
                }

                updateStatus("Loading data...");
                await controller.loadDashboard();

                // Show Home and Nav
                document.getElementById('home').classList.remove('hidden');
                document.querySelector('nav').classList.remove('hidden');
                document.getElementById('login').classList.add('hidden');

                // Initialize Carousels AFTER showing home (so calculations work)
                setupCarousel();
            } else {
                console.log("User not logged in");
                // Show Login, Hide Home and Nav
                document.getElementById('login').classList.remove('hidden');
                document.getElementById('home').classList.add('hidden');
                document.querySelector('nav').classList.add('hidden');

                const loginBtn = document.getElementById('sign-in-btn');
                if (loginBtn) {
                    loginBtn.onclick = () => {
                        console.log("Sign In Clicked");
                        window.Clerk.openSignIn();
                    }
                }

                // Auto-trigger Sign In for new users (as requested)
                setTimeout(() => {
                    console.log("Auto-opening Sign In...");
                    window.Clerk.openSignIn();
                }, 1000);
            }

            clearTimeout(timeout);
            cleanup();
        } catch (err) {
            console.error("Init Error:", err);
            updateStatus("Critical Error: " + err.message, true);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
