-- COOPER Complex Hub - SQLite Database Schema (Embedded / Local Dev / Demo Mode)
-- Mirrors PostgreSQL tables with full relational integrity

PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    country TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by_code TEXT,
    role TEXT DEFAULT 'INVESTOR',
    is_active INTEGER DEFAULT 1,
    is_suspended INTEGER DEFAULT 0,
    suspension_reason TEXT,
    email_verified INTEGER DEFAULT 0,
    phone_verified INTEGER DEFAULT 0,
    two_factor_enabled INTEGER DEFAULT 0,
    two_factor_secret TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_legal_name TEXT,
    date_of_birth TEXT,
    nationality TEXT,
    country_of_residence TEXT,
    address TEXT,
    occupation TEXT,
    source_of_funds TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 3. KYC Records
CREATE TABLE IF NOT EXISTS kyc_records (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_legal_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    nationality TEXT NOT NULL,
    country_of_residence TEXT NOT NULL,
    id_type TEXT NOT NULL,
    id_number TEXT NOT NULL,
    address TEXT NOT NULL,
    occupation TEXT NOT NULL,
    source_of_funds TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    document_front_url TEXT,
    document_back_url TEXT,
    proof_of_address_url TEXT,
    reviewer_notes TEXT,
    rejection_reason TEXT,
    reviewed_by TEXT REFERENCES users(id),
    reviewed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 4. Investment Accounts (Aggregate View)
CREATE TABLE IF NOT EXISTS investment_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'USD',
    available_balance REAL DEFAULT 0.00,
    invested_balance REAL DEFAULT 0.00,
    portfolio_value REAL DEFAULT 0.00,
    realized_pnl REAL DEFAULT 0.00,
    unrealized_pnl REAL DEFAULT 0.00,
    total_fees REAL DEFAULT 0.00,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 5. Ledger Accounts (System & User internal accounts for double-entry)
CREATE TABLE IF NOT EXISTS ledger_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    account_type TEXT NOT NULL,
    currency TEXT DEFAULT 'USD',
    balance REAL DEFAULT 0.00,
    created_at TEXT NOT NULL
);

-- 6. Financial Ledger Entries (IMMUTABLE Source of Truth)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    transaction_ref TEXT NOT NULL,
    entry_type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    debit_account_id TEXT REFERENCES ledger_accounts(id),
    credit_account_id TEXT REFERENCES ledger_accounts(id),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'COMMITTED',
    metadata TEXT,
    created_at TEXT NOT NULL
);

-- 7. Deposits
CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_tx_id TEXT,
    status TEXT DEFAULT 'PENDING',
    reconciliation_status TEXT DEFAULT 'UNRECONCILED',
    phone_number TEXT,
    payment_details TEXT,
    confirmed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 8. Withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    fee REAL DEFAULT 0.00,
    net_amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    method TEXT NOT NULL,
    destination_details TEXT NOT NULL,
    status TEXT DEFAULT 'REQUESTED',
    reviewed_by TEXT REFERENCES users(id),
    reviewed_at TEXT,
    rejection_reason TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 9. Investment Strategies
CREATE TABLE IF NOT EXISTS investment_strategies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    min_investment REAL DEFAULT 100.00,
    management_fee_pct REAL DEFAULT 1.50,
    performance_fee_pct REAL DEFAULT 10.00,
    allocation_summary TEXT NOT NULL,
    verified_performance_status TEXT DEFAULT 'No verified performance data available yet.',
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
);

-- 10. Portfolio Allocations
CREATE TABLE IF NOT EXISTS portfolio_allocations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_id TEXT NOT NULL REFERENCES investment_strategies(id),
    allocated_amount REAL NOT NULL,
    current_value REAL NOT NULL,
    unrealized_pnl REAL DEFAULT 0.00,
    status TEXT DEFAULT 'ACTIVE',
    allocated_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 11. Trading Engine Orders & Positions
CREATE TABLE IF NOT EXISTS trading_orders (
    id TEXT PRIMARY KEY,
    strategy_id TEXT NOT NULL,
    market_type TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    order_type TEXT DEFAULT 'MARKET',
    quantity REAL NOT NULL,
    price REAL,
    executed_price REAL,
    status TEXT DEFAULT 'FILLED',
    exchange_provider TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trading_positions (
    id TEXT PRIMARY KEY,
    strategy_id TEXT NOT NULL,
    market_type TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    quantity REAL NOT NULL,
    entry_price REAL NOT NULL,
    current_price REAL NOT NULL,
    unrealized_pnl REAL DEFAULT 0.00,
    stop_loss REAL,
    take_profit REAL,
    status TEXT DEFAULT 'OPEN',
    opened_at TEXT NOT NULL,
    closed_at TEXT
);

-- 12. Referrals & Rewards
CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'REGISTERED',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS referral_rewards (
    id TEXT PRIMARY KEY,
    referral_id TEXT REFERENCES referrals(id),
    referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'ELIGIBLE',
    description TEXT,
    created_at TEXT NOT NULL,
    paid_at TEXT
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read INTEGER DEFAULT 0,
    link TEXT,
    created_at TEXT NOT NULL
);

-- 14. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'NORMAL',
    status TEXT DEFAULT 'OPEN',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 15. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT REFERENCES users(id),
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    previous_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    reason TEXT,
    created_at TEXT NOT NULL
);

-- 16. Risk Engine Limits
CREATE TABLE IF NOT EXISTS risk_limits (
    id TEXT PRIMARY KEY DEFAULT 'MAIN',
    max_position_size_usd REAL DEFAULT 50000.00,
    max_portfolio_exposure_pct REAL DEFAULT 75.00,
    max_daily_loss_pct REAL DEFAULT 3.50,
    max_drawdown_pct REAL DEFAULT 10.00,
    max_open_positions INTEGER DEFAULT 15,
    stop_loss_pct REAL DEFAULT 2.00,
    trading_halted INTEGER DEFAULT 0,
    updated_by TEXT,
    updated_at TEXT NOT NULL
);

-- 17. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL
);
