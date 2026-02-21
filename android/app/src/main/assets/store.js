/**
 * State Management (Zustand-like Pattern)
 * No Modules - Global Scope
 */

const defaultState = {
    user: null, // Will fetch from API
    wallet: {
        currentBalance: 0,
        lifetimeEarnings: 0,
        totalCoins: 0
    },
    dailyStreak: {
        currentStreak: 0,
        isClaimedToday: false,
        lastClaimDate: null
    },
    tasks: {
        available: [], // Fetched from API
        ongoing: [],
        completed: [],
        surveys: [] // Fetched from CPX API
    },
    transactions: [],
    ui: {
        isLoading: false,
        error: null,
        theme: 'light'
    }
};

class Store {
    constructor() {
        // Load from local storage or use default
        try {
            const saved = localStorage.getItem('taskBuksState_v2');
            this.state = saved ? JSON.parse(saved) : defaultState;
        } catch (e) {
            console.warn("LocalStorage access failed (likely file:// protocol). Using default state.");
            this.state = defaultState;
        }
        this.listeners = new Set();
    }

    getState() {
        return this.state;
    }

    setState(updater) {
        const nextState = typeof updater === 'function'
            ? updater(this.state)
            : updater;

        // Shallow merge
        this.state = { ...this.state, ...nextState };

        // Persist
        localStorage.setItem('taskBuksState_v2', JSON.stringify(this.state));

        // Notify
        this.notify();
    }


    updateWallet(updates) {
        this.setState(s => ({ wallet: { ...s.wallet, ...updates } }));
    }

    updateStreak(updates) {
        this.setState(s => ({ dailyStreak: { ...s.dailyStreak, ...updates } }));
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    getState() {
        return this.state;
    }
}

window.store = new Store();
