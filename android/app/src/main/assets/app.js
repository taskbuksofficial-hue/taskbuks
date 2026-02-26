/**
 * Task Buks App
 * Main Entry Point - UI Wiring
 * Wrapped in IIFE to prevent global namespace collisions
 */
(function () {
    // Defines updateStatus globally for this scope immediately
    const updateStatus = (msg, isError = false) => {
        const el = document.getElementById('loading-status');
        if (el) {
            el.textContent = msg;
            if (isError) el.style.color = "red";
        }
        if (isError) {
            document.getElementById('loading-spinner')?.classList.add('hidden');
            document.getElementById('retry-init')?.classList.remove('hidden');
        }
    };

    updateStatus("Parsing App...");

    const store = window.store;
    const controller = window.controller;

    if (!store) {
        console.error("Critical: window.store is undefined");
        updateStatus("Error: Store not loaded", true);
        return;
    }
    if (!controller) {
        console.error("Critical: window.controller is undefined");
        updateStatus("Error: Controller not loaded", true);
        return;
    }

    // --- AUTH UI HELPERS ---
    window.showAuthForm = (type) => {
        document.getElementById('auth-menu').classList.add('hidden');
        document.getElementById('signin-form').classList.add('hidden');
        document.getElementById('signup-form').classList.add('hidden');

        if (type === 'menu') {
            document.getElementById('auth-menu').classList.remove('hidden');
        } else if (type === 'signin') {
            document.getElementById('signin-form').classList.remove('hidden');
        } else if (type === 'signup') {
            document.getElementById('signup-form').classList.remove('hidden');
        }
    };

    // --- VIEW SWITCHING HELPERS ---
    window.showAppView = () => {
        document.getElementById('login').classList.add('hidden');
        document.getElementById('home').classList.remove('hidden');
        document.querySelector('nav').classList.remove('hidden');
        document.getElementById('app-header')?.classList.remove('hidden');
        document.getElementById('app-header-spacer')?.classList.remove('hidden');
        setupCarousel(); // Re-init carousel if needed
    };

    window.showLoginView = () => {
        document.getElementById('login').classList.remove('hidden');
        document.getElementById('home').classList.add('hidden');
        document.querySelector('nav').classList.add('hidden');
        document.getElementById('app-header')?.classList.add('hidden');
        document.getElementById('app-header-spacer')?.classList.add('hidden');
    };

    window.handleLogin = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button');

        btn.disabled = true;
        btn.textContent = "Checking...";

        try {
            const success = await controller.login(email, password);
            if (success) {
                window.showAppView();
            } else {
                showToast("Invalid credentials");
                btn.disabled = false;
                btn.textContent = "Sign In";
            }
        } catch (err) {
            console.error(err);
            showToast("Login failed: " + err.message);
            btn.disabled = false;
            btn.textContent = "Sign In";
        }
    };

    window.handleRegister = async (e) => {
        e.preventDefault();
        // Generate device fingerprint
        let deviceId = '';
        try {
            if (window.Android && window.Android.getDeviceId) {
                deviceId = window.Android.getDeviceId();
            } else {
                // Simple browser fingerprint
                deviceId = btoa(navigator.userAgent + screen.width + screen.height + navigator.language).substring(0, 32);
            }
        } catch (e) { }

        const data = {
            full_name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            phone_number: document.getElementById('reg-phone').value,
            password: document.getElementById('reg-password').value,
            referral_code: document.getElementById('reg-referral').value,
            upi_id: document.getElementById('reg-upi')?.value || '',
            device_id: deviceId
        };
        const btn = e.target.querySelector('button');

        btn.disabled = true;
        btn.textContent = "Creating Account...";

        try {
            const success = await controller.register(data);
            if (success) {
                window.showAppView();
            } else {
                showToast("Registration failed");
                btn.disabled = false;
                btn.textContent = "Create Account";
            }
        } catch (err) {
            console.error(err);
            showToast("Registration failed: " + err.message);
            btn.disabled = false;
            btn.textContent = "Create Account";
        }
    };


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

        // Placeholder - searching first
        // Lifetime Earnings
        document.querySelectorAll('.user-lifetime-earnings').forEach(el =>
            el.textContent = `₹${parseFloat(wallet.lifetimeEarnings || 0).toFixed(2)}`
        );

        // Pending & Withdrawn amounts in wallet card
        document.querySelectorAll('.user-pending-amount').forEach(el =>
            el.textContent = `₹${parseFloat(wallet.pendingAmount || 0).toFixed(2)}`
        );
        document.querySelectorAll('.user-withdrawn-amount').forEach(el =>
            el.textContent = `₹${parseFloat(wallet.totalWithdrawn || 0).toFixed(2)}`
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

        // Withdrawal Status Banner
        const withdrawal = state.withdrawal;
        const statusBanner = document.getElementById('withdrawal-status-banner');
        if (statusBanner && withdrawal && withdrawal.hasWithdrawal) {
            const w = withdrawal.withdrawal;
            if (!w) return; // Defensive check for old corrupted cache

            statusBanner.classList.remove('hidden');

            const icon = document.getElementById('withdrawal-status-icon');
            const title = document.getElementById('withdrawal-status-title');
            const desc = document.getElementById('withdrawal-status-desc');
            const badge = document.getElementById('withdrawal-status-badge');

            if (w.status === 'PENDING') {
                icon.style.background = 'linear-gradient(135deg, #f59e0b, #fbbf24)';
                icon.querySelector('span').textContent = 'hourglass_top';
                title.textContent = `Withdrawal of ₹${w.amount} is being processed`;
                desc.textContent = 'Please allow up to 24 hours for payment.';
                badge.textContent = 'PENDING';
                badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 bg-amber-100 text-amber-700';
                statusBanner.style.background = 'rgba(245,158,11,0.04)';
                statusBanner.style.borderColor = 'rgba(245,158,11,0.15)';
                if (withdrawBtn) withdrawBtn.disabled = true;
            } else if (w.status === 'COMPLETED') {
                icon.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
                icon.querySelector('span').textContent = 'check_circle';
                title.textContent = `₹${w.amount} sent to your UPI! ✅`;
                desc.textContent = `Payment completed. UPI: ${w.upiId}`;
                badge.textContent = 'PAID';
                badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 bg-emerald-100 text-emerald-600';
                statusBanner.style.background = 'rgba(16,185,129,0.04)';
                statusBanner.style.borderColor = 'rgba(16,185,129,0.15)';
            } else if (w.status === 'FAILED') {
                icon.style.background = 'linear-gradient(135deg, #ef4444, #f87171)';
                icon.querySelector('span').textContent = 'cancel';
                title.textContent = `Withdrawal of ₹${w.amount} was rejected`;
                desc.textContent = w.adminNotes || 'Amount has been refunded to your wallet.';
                badge.textContent = 'REJECTED';
                badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 bg-red-100 text-red-600';
                statusBanner.style.background = 'rgba(239,68,68,0.04)';
                statusBanner.style.borderColor = 'rgba(239,68,68,0.15)';
            }
        } else if (statusBanner) {
            statusBanner.classList.add('hidden');
        }

        // 2. Tasks (Home)
        const topOfferContainer = document.getElementById('top-offer-container');

        if (taskContainer) {
            const availableTasks = tasks.available || [];

            // AdGem Top Offer removed

            if (availableTasks.length === 0) {
                taskContainer.innerHTML = `<div class="w-full text-center py-8 text-slate-400 text-xs">No tasks available right now.</div>`;
            } else {
                taskContainer.innerHTML = availableTasks.map(task => {
                    const reward = task.reward || task.payout_amount || 0;
                    const subtitle = task.description || task.subtitle || "Complete this task";
                    const bgColor = task.bg_color || task.bgColor || 'bg-indigo-500';
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

                        if (id) {
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
                    // Assuming md5 is available globally or imported
                    if (window.md5) {
                        var checksum = window.md5(rapidoUserId + '-' + appId + '-' + appKey);
                        var finalUserId = rapidoUserId + '-' + appId + '-' + checksum;
                        var iframeUrl = 'https://www.rapidoreach.com/ofw/?userId=' + encodeURIComponent(finalUserId);
                        console.log("Rapido Reach URL:", iframeUrl);
                        container.innerHTML = '<iframe src="' + iframeUrl + '" style="width:100%;height:800px;border:none;border-radius:16px;" allow="clipboard-write" title="Rapido Reach Surveys"></iframe>';
                    } else {
                        console.warn("MD5 library missing for Rapido Reach");
                    }
                } catch (err) {
                    console.error("Rapido Init Error:", err);
                    container.innerHTML = '<div style="color:red;text-align:center;padding:16px;font-size:14px;">Survey Error: ' + err.message + '</div>';
                }
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
                // Fallback if not set
                if (user && user.id) {
                    refCode = 'TB' + user.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
                }
            }
            codeEl.textContent = refCode || 'LOADING';
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
        // 6. Profile Data (Dynamic)
        if (user) {
            const nameEl = document.getElementById('profile-name');
            const phoneEl = document.getElementById('profile-phone');
            const emailEl = document.getElementById('profile-email');

            // Header Name
            const headerNameEl = document.getElementById('header-profile-name');

            if (nameEl) nameEl.textContent = user.full_name || 'User';
            if (phoneEl) phoneEl.textContent = user.phone_number || 'No Phone';
            if (emailEl) emailEl.textContent = user.email || 'No Email';
            if (headerNameEl) headerNameEl.textContent = "Hi, " + (user.full_name ? user.full_name.split(' ')[0] : 'User');

            // UPI ID
            const upiEl = document.getElementById('profile-upi');
            if (upiEl) upiEl.textContent = user.upi_id || 'Not set';
        }
    }

    // --- PROFILE EDIT ---
    window.editProfileUI = async () => {
        const state = store.getState();
        const user = state.user || {};

        const newName = prompt("Enter your full name:", user.full_name || "");
        if (newName === null) return; // Cancelled

        const newPhone = prompt("Enter your phone number:", user.phone_number || "");
        if (newPhone === null) return; // Cancelled

        if (!newName || !newPhone) {
            showToast("Name and Phone are required.");
            return;
        }

        try {
            updateStatus("Updating Profile...");
            const success = await controller.updateProfile(newName, newPhone);
            if (success) {
                showToast("Profile Updated!");
                render(); // Re-render to show changes immediately
            } else {
                showToast("Update failed.");
            }
        } catch (e) {
            showToast("Error: " + e.message);
        } finally {
            // Hide status/spinner if we showed one
            const loadingOverlay = document.getElementById('app-loading-overlay');
            if (loadingOverlay) loadingOverlay.style.opacity = '0';
            // Reuse updateStatus logic but usually it shows spinner, so maybe we don't need updateStatus here if it blocks UI too much
            // Just showToast is enough.
        }
    };

    // --- EDIT UPI ---
    window.editUpiUI = async () => {
        const state = store.getState();
        const currentUpi = state.user?.upi_id || '';
        const newUpi = prompt("Enter your UPI ID (e.g. yourname@upi):", currentUpi);
        if (newUpi === null) return;
        if (!newUpi || !newUpi.includes('@')) {
            showToast("Please enter a valid UPI ID (e.g. name@paytm)");
            return;
        }
        try {
            const res = await api.updateUpi(newUpi.trim());
            if (res && res.success) {
                store.setState(s => ({ user: { ...s.user, upi_id: newUpi.trim() } }));
                showToast("UPI ID updated!");
                render();
            } else {
                showToast(res?.error || "Failed to update UPI");
            }
        } catch (e) {
            showToast("Error: " + e.message);
        }
    };

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
                pill.className = 'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2 border-primary bg-primary text-white transition-all shadow-md shadow-primary/20';
                pill.innerHTML = '<span class="material-icons-round text-base">check</span>';
            }
        });

        // Update claim buttons
        const btn = document.getElementById('claim-bonus-btn');
        const btn10x = document.getElementById('claim-bonus-btn-10x');

        if (btn) {
            if (claimed) {
                btn.disabled = true;
                btn.innerHTML = 'Claimed Today!';
                btn.classList.add('hidden');
            } else {
                btn.disabled = false;
                btn.innerHTML = 'Normal Claim';
                btn.classList.remove('hidden');
            }

            // Update 10X Card on Home Screen
            const card10x = document.getElementById('daily-bonus-card-10x');
            if (card10x) {
                if (claimed) {
                    card10x.style.opacity = '0.6';
                    card10x.style.filter = 'grayscale(100%)';
                    card10x.onclick = () => window.showToast("🔥 Daily Bonus already claimed! Come back tomorrow.");
                    card10x.querySelector('h4').textContent = "Claimed";
                    card10x.querySelector('p').textContent = "Come back tomorrow";
                } else {
                    card10x.style.opacity = '1';
                    card10x.style.filter = 'none';
                    card10x.onclick = () => window.claimDailyBonus10XUI();
                    card10x.querySelector('h4').textContent = "10X Bonus";
                    card10x.querySelector('p').textContent = "Watch Video & Earn";
                }
            }

        }
    }

    // Global function for the onclick
    window.claimDailyBonusUI = async function () {
        const res = await controller.claimDailyBonus(1);
        if (res && res.success) {
            showBonusRewardModal(res.reward);
        }
    };

    window.claimDailyBonus10XUI = async function () {
        const res = await controller.claimDailyBonus10X();
        if (res && res.success) {
            showBonusRewardModal(res.reward);
        }
    };

    function showBonusRewardModal(rewardAmount) {
        const state = store.getState();
        const streak = state.dailyStreak?.currentStreak || 1;

        // 1. Set the earned amount
        const amountEl = document.getElementById('bonus-earned-amount');
        if (amountEl) {
            amountEl.textContent = rewardAmount || (10 + (streak - 1) * 2);
        }

        // 2. Build mini streak pills in modal
        const modalPills = document.getElementById('modal-streak-pills');
        if (modalPills) {
            let html = '';
            for (let i = 1; i <= 7; i++) {
                const isComplete = i <= streak;
                const isDay7 = i === 7;
                const baseReward = '50';
                const bg = isComplete
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-50 text-slate-400 border-gray-200';
                html += `
                        <div class="flex flex-col items-center">
                            <div class="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold border-2 ${bg}">
                                ${isComplete ? '<span class="material-icons-round text-sm">check</span>' : baseReward}
                            </div>
                            <span class="text-[8px] text-slate-400 mt-0.5">Day ${i}</span>
                        </div>`;
            }
            modalPills.innerHTML = html;
        }

        // 3. Show modal
        const modal = document.getElementById('bonus-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        renderStreak();
        render(); // Force UI sync
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

            // Sync Android Status Bar
            if (window.Android && window.Android.setStatusBarMode) {
                window.Android.setStatusBarMode(next === 'light' ? 'dark' : 'light');
            }
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
            // --- Carousel logic ---
            const carouselScroll = () => {
                const carousel = document.getElementById('home-carousel');
                if (!carousel) return;

                const dots = document.querySelectorAll('.carousel-dot');
                const scrollPos = carousel.scrollLeft;
                const width = carousel.offsetWidth;
                const index = Math.round(scrollPos / width);

                dots.forEach((dot, i) => {
                    if (i === index) {
                        dot.classList.add('bg-primary');
                        dot.classList.remove('bg-gray-300');
                    } else {
                        dot.classList.remove('bg-primary');
                        dot.classList.add('bg-gray-300');
                    }
                });

                // Show Banner Ad when on Slide 3 (Index 3 - Zero based, Slide 5 is index 4 if we have 5 slides)
                // Let's check the index of the "Sponsored" slide.
                // Dot 0: Refer, Dot 1: Watch, Dot 2: Daily, Dot 3: Sponsored?
                // Wait, index.html had 4 dots but 5 slides? Let me check.

                if (index === 3 || index === 4) {
                    if (window.ads) window.ads.setBannerVisible(true, 'ad-banner-carousel');
                } else {
                    // Only hide if we're not in a game
                    if (!document.getElementById('home').classList.contains('hidden')) {
                        if (window.ads) window.ads.setBannerVisible(false);
                    }
                }
            }

            const carousel = document.getElementById('home-carousel');
            if (carousel) {
                carousel.addEventListener('scroll', carouselScroll);
            }
        });
    }

    // Initialize
    const initApp = async () => {
        updateStatus("Initializing...");
        console.log("Initializing App...");

        // Safety Timeout reference
        let safetyTimer = setTimeout(() => {
            const loadingOverlay = document.getElementById('app-loading-overlay');
            if (loadingOverlay && loadingOverlay.style.opacity !== '0') {
                console.warn("Safety timeout triggered - forcing cleanup");
                cleanup();
            }
        }, 1500);

        const cleanup = () => {
            if (safetyTimer) clearTimeout(safetyTimer);
            console.log("Cleaning up loading overlay...");

            const loadingOverlay = document.getElementById('app-loading-overlay');
            if (loadingOverlay) {
                // Force hide immediately
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.visibility = 'hidden';
                loadingOverlay.style.display = 'none'; // ADDED: Direct hide
                loadingOverlay.remove(); // ADDED: Direct remove
            }

            try {
                render();
            } catch (e) {
                console.error("Render error in cleanup:", e);
            }
        };

        try {
            updateStatus("Setting up UI...");
            setupNavigation();
            setupGlobalListeners();
            setupGameCards();

            updateStatus("Subscribing Store...");
            store.subscribe(() => { render(); renderStreak(); });

            // Check for Local Token
            const token = localStorage.getItem('auth_token');

            if (token) {
                console.log("Found local token, validating...");
                updateStatus("Syncing account...");
                const success = await controller.loginWithToken(token).catch(e => {
                    console.error("Token login error:", e);
                    return false;
                });

                if (success) {
                    updateStatus("Loading data...");
                    await controller.loadDashboard();
                    window.showAppView();

                    // Sync Android Status Bar (Default to light theme/dark icons)
                    if (window.Android && window.Android.setStatusBarMode) {
                        window.Android.setStatusBarMode('dark');
                    }
                } else {
                    console.log("Token invalid, showing login");
                    localStorage.removeItem('auth_token');
                    window.showLoginView();
                }
            } else {
                console.log("No token, showing login");
                updateStatus("Ready!"); // Clear "Subscribing Store..." message
                document.getElementById('home').classList.add('hidden');
                document.querySelector('nav').classList.add('hidden');
                document.getElementById('app-header')?.classList.add('hidden');
                document.getElementById('app-header-spacer')?.classList.add('hidden');
                // Ensure login view is visible
                const loginSection = document.getElementById('login');
                if (loginSection) loginSection.classList.remove('hidden');

                // Sync Android Status Bar (Default to light theme/dark icons if no token)
                if (window.Android && window.Android.setStatusBarMode) {
                    window.Android.setStatusBarMode('dark');
                }
            }

            cleanup();
        } catch (err) {
            console.error("Init Error:", err);
            updateStatus("Error: " + err.message, true);
            // Even on error, try to show something (like login) if possible, or just cleanup so they can see the error
            cleanup();
        }
    };

    // Start
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await initApp();
        } catch (e) {
            console.error("InitApp Fatal Error:", e);
        }
    });

    // --- WITHDRAWAL MODAL FUNCTIONS ---
    window.openWithdrawModal = function () {
        const state = window.store.getState();
        const balance = parseFloat(state.wallet?.currentBalance || 0);

        // Pre-fill amount with current balance (floored to integer)
        const amountInput = document.getElementById('withdraw-amount-input');
        if (amountInput) amountInput.value = Math.floor(balance);

        const modal = document.getElementById('withdraw-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    };

    window.closeWithdrawModal = function () {
        const modal = document.getElementById('withdraw-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    window.submitWithdrawal = async function () {
        const upiId = document.getElementById('withdraw-upi-input')?.value?.trim();
        const amount = parseFloat(document.getElementById('withdraw-amount-input')?.value);

        if (!upiId) {
            window.showToast('Please enter your UPI ID');
            return;
        }
        if (!amount || amount < 100) {
            window.showToast('Minimum withdrawal is ₹100');
            return;
        }

        const submitBtn = document.getElementById('withdraw-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons-round animate-spin" style="font-size:18px;">refresh</span> Processing...';
        }

        try {
            await window.controller.requestWithdrawal(upiId, amount);
            closeWithdrawModal();
            // Refresh withdrawal status
            await window.controller.checkWithdrawalStatus();
        } catch (error) {
            // Error already shown by controller
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="material-icons-round" style="font-size:18px;">send</span> Request Withdrawal';
            }
        }
    };

})();
