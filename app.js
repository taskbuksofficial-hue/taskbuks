/**
 * Task Buks App
 * Main Entry Point - UI Wiring
 * No Modules - Global Scope
 */

const store = window.store;
const controller = window.controller;

// --- UI RENDERERS ---

function render() {
    const state = store.getState();
    const { user, wallet, tasks, transactions } = state;

    // 1. Balance
    document.querySelectorAll('.user-balance').forEach(el =>
        el.textContent = wallet.currentBalance
    );

    // 2. Tasks (Home)
    const taskContainer = document.getElementById('task-container');
    if (taskContainer) {
        taskContainer.innerHTML = tasks.available.map(task => `
            <div class="min-w-[200px] bg-white dark:bg-gray-800 p-4 rounded-[24px] border border-gray-100 dark:border-gray-700 ios-shadow snap-start">
                <div class="w-14 h-14 ${task.bgColor} rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                    ${task.icon ? `<img src="${task.icon}" class="w-10 h-10" alt="${task.title}">` :
                task.materialIcon ? `<span class="material-icons-round text-white text-3xl">${task.materialIcon}</span>` :
                    `<span class="text-white text-2xl font-black">${task.textIcon}</span>`}
                </div>
                <h4 class="font-bold text-base mb-1 dark:text-white">${task.title}</h4>
                <div class="text-[11px] text-slate-400 dark:text-gray-400 line-clamp-2 mb-4 leading-snug min-h-[2.5em]">${task.subtitle}</div>
                <div class="flex items-center bg-gray-50 dark:bg-gray-900 rounded-full p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors start-task-btn" data-id="${task.id}">
                    <span class="flex-1 text-center text-[11px] font-bold text-slate-400">Start</span>
                    <div class="bg-primary px-3 py-1.5 rounded-full flex items-center gap-1">
                        <span class="text-[11px] font-bold text-white">Get ₹${task.reward}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Attach listeners
        document.querySelectorAll('.start-task-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                controller.startTask(id);
                showToast("Task started! Check 'Ongoing'");
            });
        });
    }

    // 3. Ongoing Tasks
    const ongoingList = document.getElementById('ongoing-list');
    const emptyState = document.getElementById('ongoing-empty');

    if (ongoingList && emptyState) {
        if (tasks.ongoing.length === 0) {
            ongoingList.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            ongoingList.classList.remove('hidden');
            ongoingList.innerHTML = tasks.ongoing.map(task => `
                <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 ios-shadow flex items-center gap-4 mb-3">
                     <div class="w-12 h-12 ${task.bgColor} rounded-xl flex items-center justify-center shrink-0">
                        ${task.icon ? `<img src="${task.icon}" class="w-8 h-8" alt="${task.title}">` :
                    task.materialIcon ? `<span class="material-icons-round text-white text-2xl">${task.materialIcon}</span>` :
                        `<span class="text-white text-xl font-black">${task.textIcon}</span>`}
                    </div>
                    <div class="flex-1 text-left">
                        <h4 class="font-bold text-sm dark:text-white">${task.title}</h4>
                        <p class="text-xs text-slate-400 dark:text-gray-400">In Progress</p>
                    </div>
                    <button class="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors verify-task-btn" data-id="${task.id}">
                        Verify
                    </button>
                </div>
            `).join('');

            document.querySelectorAll('.verify-task-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.dataset.id);
                    controller.completeTask(id);
                    showToast("Task verified! Amount credited.");
                });
            });
        }
    }

    // 4. Refer Code
    const codeEl = document.getElementById('referral-code');
    if (codeEl && user) codeEl.textContent = user.referralCode;

    // 5. Transactions
    const txList = document.getElementById('transaction-list');
    if (txList) {
        const txs = transactions || [];
        if (txs.length === 0) {
            txList.innerHTML = `<div class="text-center py-6 text-slate-400 text-sm">No transactions yet</div>`;
        } else {
            txList.innerHTML = txs.map(tx => `
                <div class="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div class="flex items-center gap-3">
                         <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                            <span class="material-icons-round text-sm">north_east</span>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-slate-700 dark:text-slate-200">${tx.description}</p>
                            <p class="text-[10px] text-slate-400">${new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <span class="text-sm font-bold text-green-500">+₹${tx.amount}</span>
                </div>
            `).join('');
        }
    }
}

// --- SETUP ---

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => {
                nav.classList.remove('text-primary', 'active');
                nav.classList.add('text-slate-400', 'dark:text-gray-500');
            });

            const button = e.currentTarget;
            button.classList.remove('text-slate-400', 'dark:text-gray-500');
            button.classList.add('text-primary', 'active');

            const targetId = button.dataset.target;
            sections.forEach(section => {
                section.classList.add('hidden');
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                }
            });
        });
    });
}

function setupGlobalListeners() {
    // Theme Toggle
    window.toggleTheme = () => {
        const current = store.getState().ui.theme;
        const next = current === 'light' ? 'dark' : 'light';
        store.setState({ ui: { ...store.getState().ui, theme: next } });
        document.documentElement.classList.toggle('dark');
    };
}

// Global Helpers (exposed to window for HTML onclicks if needed, though listeners are better)
window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
};

window.showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl z-[100] transition-opacity duration-300 opacity-0';
    toast.textContent = message;
    document.body.appendChild(toast);
    void toast.offsetWidth;
    toast.classList.remove('opacity-0');
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    setupGlobalListeners();

    // Subscribe to state changes
    store.subscribe(render);

    // Initial Load
    await controller.loadDashboard();
});

