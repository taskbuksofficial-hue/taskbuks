"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const schema = `
-- users TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- wallets TABLE
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

-- tasks TABLE
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reward NUMERIC(10, 2) NOT NULL,
  icon_url TEXT,
  category TEXT DEFAULT 'App',
  bg_color TEXT DEFAULT 'bg-indigo-500',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_tasks TABLE
CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'STARTED',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_user_task UNIQUE (user_id, task_id)
);

-- transactions TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'credit',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;
const seedTasks = `
INSERT INTO tasks (title, description, reward, category, bg_color)
VALUES 
('Fotos AI', 'Get your insurance photos and took...', 5, 'App', 'bg-indigo-500'),
('Bajaj Markets', 'Get your markets for Bajaj station...', 150, 'Finance', 'bg-cyan-500'),
('Foundit', 'Earn life more material task...', 10, 'Jobs', 'bg-purple-600'),
('Dream11', 'Play fantasy cricket and win big...', 50, 'Games', 'bg-red-600'),
('Unacademy', 'Crack your goals with India''s platform...', 20, 'Education', 'bg-blue-600')
ON CONFLICT (title) DO NOTHING;
`;
// Note: Added unique constraint to title temporarily for seeding if needed, or just insert.
// Actually, let's just use title as a simple check or skip conflict check for now.
// Better: just insert normally if they don't exist.
async function init() {
    try {
        console.log("Initializing database...");
        await (0, db_1.query)(schema);
        console.log("Schema created successfully.");
        // Simple seed check
        const taskCount = await (0, db_1.query)('SELECT count(*) FROM tasks');
        if (parseInt(taskCount.rows[0].count) === 0) {
            await (0, db_1.query)(seedTasks.replace('ON CONFLICT (title) DO NOTHING', ''));
            console.log("Seed data inserted successfully.");
        }
        else {
            console.log("Tasks already exist, skipping seed.");
        }
        process.exit(0);
    }
    catch (err) {
        console.error("Initialization failed:", err);
        process.exit(1);
    }
}
init();
