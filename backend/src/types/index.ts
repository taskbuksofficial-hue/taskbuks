export interface User {
    id: string;
    email: string;
    full_name?: string;
    phone_number?: string;
    avatar_url?: string;
    referral_code?: string;
    referred_by?: string;
    created_at: Date;
    updated_at: Date;
}

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    total_earned: number;
    currency: string;
    created_at: Date;
    updated_at: Date;
}

export interface Transaction {
    id: string;
    wallet_id: string;
    amount: number;
    type: 'EARNING' | 'WITHDRAWAL' | 'BONUS' | 'REFERRAL';
    description?: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    reference_id?: string;
    created_at: Date;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    payout_amount: number;
    icon_url?: string;
    action_url: string;
    category: string;
    is_active: boolean;
    created_at: Date;
}
