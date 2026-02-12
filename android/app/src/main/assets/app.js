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

        // 1. Balance
        document.querySelectorAll('.user-balance').forEach(el =>
            el.textContent = `₹${parseFloat(wallet.currentBalance || 0).toFixed(2)}`
        );

        // Lifetime Earnings
        document.querySelectorAll('.user-lifetime-earnings').forEach(el =>
            el.textContent = `₹${parseFloat(wallet.lifetimeEarnings || 0).toFixed(2)}`
        );

        // Withdraw progress
        const progressBar = document.getElementById('withdraw-progress-bar');
        const progressText = document.getElementById('withdraw-progress-text');
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (progressBar) {
            const balance = parseFloat(wallet.currentBalance || 0);
            const pct = Math.min((balance / 500) * 100, 100);
            progressBar.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `₹${balance.toFixed(0)} / ₹500`;
            if (withdrawBtn) withdrawBtn.disabled = balance < 500;
        }

        // 2. Tasks (Home)
        const taskContainer = document.getElementById('task-container');
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

        // 3. CPX Research Sync
        if (user && !window.cpxInitialized) {
            console.log("Initializing CPX Research for user:", user.id);

            // Configuration for CPX Research
            window.cpx = {
                app_id: "31412",
                ext_user_id: user.id,
                email: user.emailAddresses?.[0]?.emailAddress || "",
                username: user.firstName || "User",
                secure_hash: "deprecated_on_frontend_use_backend_for_security",
                style: {
                    text: {
                        new_tab: "Surveys"
                    }
                }
            };

            const script = document.createElement('script');
            script.src = "https://cdn.cpx-research.com/assets/js/script_tag_v2.0.js";
            script.async = true;
            script.onload = () => {
                console.log("CPX Script Loaded");
                window.cpxInitialized = true;
            };
            document.body.appendChild(script);
        }

        // 3.5 Render API Surveys (if any)
        const surveyList = tasks.surveys || [];
        const cpxContainer = document.getElementById('cpx-research-container');
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
                            <h4 class="font-bold text-sm dark:text-white">Survey via CPX</h4>
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

        // 4. Refer Code
        const codeEl = document.getElementById('referral-code');
        if (codeEl && user) codeEl.textContent = user.referralCode;

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
        console.log("Setting up Home carousel...");
        const carousel = document.getElementById('home-carousel');
        const dots = document.querySelectorAll('.carousel-dot');
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
        }, 4000);

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
    }

    // Initialize
    const initApp = async () => {
        console.log("Initializing App...");

        // Initial setup
        setupNavigation();
        setupGlobalListeners();
        setupCarousel();
        store.subscribe(render);

        // Show Loading Overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'app-loading-overlay';
        loadingOverlay.style.cssText = "position:fixed; inset:0; background:white; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:10000; transition: opacity 0.3s;";
        loadingOverlay.innerHTML = `
            <div class="text-2xl font-black mb-4">Task<span class="text-primary">Buks</span></div>
            <div id="loading-spinner" class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div id="loading-status" class="mt-4 text-xs text-slate-400 text-center px-6">Connecting...</div>
            <div class="flex gap-4 mt-8">
                <button id="retry-init" class="hidden bg-primary text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg">Retry</button>
                <button id="skip-init" class="hidden bg-slate-100 text-slate-500 px-6 py-2 rounded-full text-xs font-bold">Ignore</button>
            </div>
        `;
        document.body.appendChild(loadingOverlay);

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
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay.parentNode) loadingOverlay.remove();
            }, 300);
            render();
        };

        // Safety Timeout (15s)
        const timeout = setTimeout(() => {
            updateStatus("Connection taking longer than expected...", true);
        }, 15000);

        try {
            // Wait for Clerk
            let r = 0;
            while (!window.Clerk && r < 100) {
                await new Promise(res => setTimeout(res, 100));
                r++;
            }

            if (!window.Clerk) {
                updateStatus("Security module failed to load. Check connection.", true);
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
