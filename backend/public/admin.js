
const API_URL = location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://task-buks-backend.vercel.app'; // Update if needed
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

    // Optimistic check (real check happens on API call)
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
            logout(); // Invalid key
            alert("Invalid or expired Admin Key");
            return null;
        }
        return await res.json();
    } catch (e) {
        console.error("Admin API Error:", e);
        document.getElementById('connection-status').innerHTML = '<span class="text-red-500">Connection Error</span>';
        return null;
    }
}

async function refreshData() {
    const stats = await fetchAdmin('/admin/stats');
    if (stats) {
        document.getElementById('stat-users').innerText = stats.totalUsers;
        document.getElementById('stat-tasks').innerText = stats.totalTasks;
        document.getElementById('stat-payouts').innerText = '₹' + stats.totalPayouts.toFixed(2);
        document.getElementById('stat-active').innerText = stats.activeUsers;
    }

    // Load Users by default
    loadUsers();
}

async function loadUsers() {
    const users = await fetchAdmin('/admin/users');
    if (!users) return;

    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0';
        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        ${u.full_name ? u.full_name[0] : 'U'}
                    </div>
                    <div>
                        <div class="font-bold text-slate-700">${u.full_name || 'Unknown'}</div>
                        <div class="text-xs text-slate-400">${u.email}</div>
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
                    ${u.is_active ? 'Ban User' : 'Unban'}
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

    if (res && res.success) {
        loadUsers(); // Refresh
    }
}

// Tasks Logic
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${tab}`).classList.remove('hidden');

    document.getElementById('tab-users').className = tab === 'users' ? 'pb-2 px-4 text-sm font-bold border-b-2 border-blue-500 text-blue-600 transition-colors' : 'pb-2 px-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors';
    document.getElementById('tab-tasks').className = tab === 'tasks' ? 'pb-2 px-4 text-sm font-bold border-b-2 border-indigo-500 text-indigo-600 transition-colors' : 'pb-2 px-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors';

    if (tab === 'tasks') {
        loadTasks(); // Fetch tasks when tab switched might be better, or just rely on global data if stored
    }
}

async function loadTasks() {
    // Reuse the public API for getting tasks, but render differently
    const res = await fetch(`${API_URL}/api/offers`); // This is public
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
                <a href="${t.action_url || '#'}" target="_blank" class="text-[10px] font-bold text-blue-500 hover:underline">Test Link ↗</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Modal Logic
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
        loadTasks(); // Refresh list
        alert("Task created successfully!");
    } else {
        alert("Failed to create task");
    }
}
