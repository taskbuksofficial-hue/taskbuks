
const API_URL = location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://taskbuks.vercel.app';
const ADMIN_KEY_STORAGE = 'taskbuks_admin_key';

let currentKey = localStorage.getItem(ADMIN_KEY_STORAGE);

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (currentKey) {
        showDashboard();
    }
});

function adminLogin() {
    const key = document.getElementById('admin-key').value;
    if (!key) return;

    localStorage.setItem(ADMIN_KEY_STORAGE, key);
    currentKey = key;
    showDashboard();
}

function logout() {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    location.reload();
}

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    refreshData();
}

async function fetchAdmin(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'x-admin-key': currentKey,
        ...options.headers
    };

    try {
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (res.status === 403) {
            logout();
            alert("Invalid or expired Admin Key");
            return null;
        }
        return await res.json();
    } catch (e) {
        console.error("Admin API Error:", e);
        document.getElementById('connection-status').innerHTML = '<span class="text-red-500">● Disconnected</span>';
        return null;
    }
}

async function refreshData() {
    const stats = await fetchAdmin('/admin/stats');
    if (stats) {
        document.getElementById('connection-status').innerHTML = '<span class="text-emerald-500">● Connected</span>';
        document.getElementById('stat-users').innerText = stats.totalUsers;
        document.getElementById('stat-tasks').innerText = stats.totalTasks;
        document.getElementById('stat-payouts').innerText = '₹' + (stats.totalPayouts || 0).toFixed(2);
        document.getElementById('stat-active').innerText = stats.activeUsers;
        document.getElementById('stat-pending-count').innerText = stats.pendingWithdrawals || 0;
        document.getElementById('stat-pending-amount').innerText = '₹' + (stats.pendingAmount || 0).toFixed(2);
    }

    // Always try to load users regardless of stats success
    loadUsers();
}

// --- USERS ---
async function loadUsers() {
    const users = await fetchAdmin('/admin/users');
    if (!users) return;

    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0';
        const rawName = u.full_name;
        const displayName = (!rawName || rawName === 'undefined' || rawName.trim() === '') ? 'User_' + u.id.substring(0, 5) : rawName;
        const initial = displayName[0].toUpperCase();

        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                        ${initial}
                    </div>
                    <div>
                        <div class="font-bold text-slate-700">${displayName}</div>
                        <div class="text-xs text-slate-400">${u.email || 'No Email'}</div>
                        <div class="text-[10px] text-blue-500 font-medium">${u.upi_id ? '💳 ' + u.upi_id : ''}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 font-mono text-sm">₹${(parseFloat(u.balance) || 0).toFixed(2)}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-[10px] font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}">
                    ${u.is_active ? 'ACTIVE' : 'BANNED'}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="toggleBan('${u.id}', ${!u.is_active})" 
                    class="text-xs font-bold px-3 py-1.5 rounded-lg border ${u.is_active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-500 hover:bg-emerald-50'} transition-colors">
                    ${u.is_active ? 'Ban' : 'Unban'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function toggleBan(userId, isActive) {
    if (!confirm(`Are you sure you want to ${isActive ? 'unban' : 'ban'} this user?`)) return;

    const res = await fetchAdmin('/admin/users/ban', {
        method: 'POST',
        body: JSON.stringify({ userId, isActive })
    });

    if (res && res.success) loadUsers();
}

// --- TASKS ---
async function loadTasks() {
    const res = await fetch(`${API_URL}/api/offers`);
    const tasks = await res.json();

    const grid = document.getElementById('tasks-grid');
    grid.innerHTML = '';

    tasks.filter(t => t.type === 'internal').forEach(t => {
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative group';
        card.innerHTML = `
            <button onclick="deleteTask('${t.id}')" class="absolute top-3 right-3 p-1.5 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100">
                <span class="material-icons-round text-sm">delete</span>
            </button>
            <div class="flex items-start gap-4 mb-3">
                <img src="${t.icon_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-xl object-cover bg-slate-100">
                <div>
                    <h4 class="font-bold text-slate-800 line-clamp-1">${t.title}</h4>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase tracking-wide">APP</span>
                </div>
            </div>
            <p class="text-xs text-slate-500 line-clamp-2 mb-4 h-8">${t.description}</p>
            <div class="flex items-center justify-between">
                <span class="text-sm font-black text-slate-800">🪙 ${t.reward}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    const res = await fetchAdmin('/admin/tasks/delete', {
        method: 'POST',
        body: JSON.stringify({ taskId })
    });
    if (res && res.success) loadTasks();
}

function openAddTaskModal() {
    document.getElementById('task-modal').classList.remove('hidden');
    document.getElementById('task-modal').classList.add('flex');
}
function closeTaskModal() {
    document.getElementById('task-modal').classList.add('hidden');
    document.getElementById('task-modal').classList.remove('flex');
}

async function handleCreateTask(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const res = await fetchAdmin('/admin/tasks/create', {
        method: 'POST',
        body: JSON.stringify(data)
    });

    if (res && res.success) {
        closeTaskModal();
        e.target.reset();
        loadTasks();
        alert("Task created!");
    } else {
        alert("Failed to create task");
    }
}

// --- WITHDRAWALS ---
async function loadWithdrawals() {
    const withdrawals = await fetchAdmin('/admin/withdrawals');
    if (!withdrawals) return;

    const tbody = document.getElementById('withdrawals-table-body');
    const emptyState = document.getElementById('withdrawals-empty');
    tbody.innerHTML = '';

    if (withdrawals.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    withdrawals.forEach(w => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0';

        const statusColors = {
            'PENDING': 'bg-amber-100 text-amber-700',
            'COMPLETED': 'bg-emerald-100 text-emerald-600',
            'FAILED': 'bg-red-100 text-red-600'
        };

        const date = new Date(w.created_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let actions = '';
        if (w.status === 'PENDING') {
            actions = `
                <button onclick="approveWithdrawal('${w.id}')" 
                    class="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors mr-1">
                    ✓ Paid
                </button>
                <button onclick="rejectWithdrawal('${w.id}')" 
                    class="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    ✗ Reject
                </button>
            `;
        } else {
            const processedDate = w.processed_at ? new Date(w.processed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
            actions = `<span class="text-xs text-slate-400">${processedDate}</span>`;
            if (w.admin_notes) {
                actions += `<span class="text-xs text-slate-300 block mt-1">${w.admin_notes}</span>`;
            }
        }

        tr.innerHTML = `
            <td class="px-5 py-4">
                <div class="font-bold text-sm text-slate-700">${w.full_name || 'Unknown'}</div>
                <div class="text-xs text-slate-400">${w.email}</div>
            </td>
            <td class="px-5 py-4">
                <span class="font-mono text-sm font-bold text-blue-600">${w.upi_id || 'N/A'}</span>
            </td>
            <td class="px-5 py-4 font-mono text-sm font-bold text-slate-800">₹${parseFloat(w.amount).toFixed(2)}</td>
            <td class="px-5 py-4">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColors[w.status] || 'bg-slate-100 text-slate-500'}">
                    ${w.status}
                </span>
            </td>
            <td class="px-5 py-4 text-xs text-slate-400">${date}</td>
            <td class="px-5 py-4 text-right">${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function approveWithdrawal(transactionId) {
    if (!confirm('Mark this withdrawal as PAID? Make sure you have sent the UPI payment to the user.')) return;

    const res = await fetchAdmin('/admin/withdrawals/update', {
        method: 'POST',
        body: JSON.stringify({ transactionId, status: 'COMPLETED', adminNotes: 'Payment sent via UPI' })
    });

    if (res && res.success) {
        alert(res.message);
        loadWithdrawals();
        refreshData(); // Update stats
    }
}

async function rejectWithdrawal(transactionId) {
    const notes = prompt('Reason for rejection (optional):');
    if (notes === null) return; // User cancelled

    const res = await fetchAdmin('/admin/withdrawals/update', {
        method: 'POST',
        body: JSON.stringify({ transactionId, status: 'FAILED', adminNotes: notes || 'Rejected by admin' })
    });

    if (res && res.success) {
        alert(res.message);
        loadWithdrawals();
        refreshData();
    }
}

// --- TAB SWITCHING ---
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${tab}`).classList.remove('hidden');

    const tabConfig = {
        users: { color: 'blue' },
        tasks: { color: 'indigo' },
        withdrawals: { color: 'amber' }
    };

    ['users', 'tasks', 'withdrawals'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (t === tab) {
            btn.className = `pb-3 px-5 text-sm font-bold border-b-2 border-${tabConfig[t].color}-500 text-${tabConfig[t].color}-600 transition-colors`;
        } else {
            btn.className = 'pb-3 px-5 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors';
        }
    });

    if (tab === 'tasks') loadTasks();
    if (tab === 'withdrawals') loadWithdrawals();
}
