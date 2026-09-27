-- COOPER Complex Hub - PostgreSQL Production Schema
-- Designed for PostgreSQL 14+ with UUID extension and ACID Transactions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    country VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    referral_code VARCHAR(32) UNIQUE NOT NULL,
    referred_by_code VARCHAR(32),
    role VARCHAR(50) DEFAULT 'INVESTOR', -- INVESTOR, SUPER_ADMIN, COMPLIANCE_OFFICER, FINANCE_OFFICER, TRADING_MANAGER, SUPPORT_AGENT
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_legal_name VARCHAR(255),
    date_of_birth DATE,
    nationality VARCHAR(100),
    country_of_residence VARCHAR(100),
    address TEXT,
    occupation VARCHAR(150),
    source_of_funds VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. KYC Records
CREATE TABLE IF NOT EXISTS kyc_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_legal_name VARCHAR(255) NOT NULL,
    date_of_birth VARCHAR(50) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    country_of_residence VARCHAR(100) NOT NULL,
    id_type VARCHAR(50) NOT NULL, -- NATIONAL_ID, PASSPORT, DRIVERS_LICENSE
    id_number VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    occupation VARCHAR(150) NOT NULL,
    source_of_funds VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, VERIFIED, REJECTED, REQUIRES_MORE_INFORMATION
    document_front_url TEXT,
    document_back_url TEXT,
    proof_of_address_url TEXT,
    reviewer_notes TEXT,
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Investment Accounts (Aggregate View)
CREATE TABLE IF NOT EXISTS investment_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'USD',
    available_balance NUMERIC(18, 4) DEFAULT 0.0000,
    invested_balance NUMERIC(18, 4) DEFAULT 0.0000,
    portfolio_value NUMERIC(18, 4) DEFAULT 0.0000,
    realized_pnl NUMERIC(18, 4) DEFAULT 0.0000,
    unrealized_pnl NUMERIC(18, 4) DEFAULT 0.0000,
    total_fees NUMERIC(18, 4) DEFAULT 0.0000,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ledger Accounts (System & User internal accounts for double-entry)
CREATE TABLE IF NOT EXISTS ledger_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    account_type VARCHAR(50) NOT NULL, -- USER_AVAILABLE, USER_INVESTED, PLATFORM_CASH_MTN, PLATFORM_CASH_AIRTEL, PLATFORM_CASH_BANK, PLATFORM_CASH_CARD, PLATFORM_FEES, ESCROW_WITHDRAWAL
    currency VARCHAR(10) DEFAULT 'USD',
    balance NUMERIC(18, 4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Financial Ledger Entries (IMMUTABLE Source of Truth)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref VARCHAR(100) NOT NULL,
    entry_type VARCHAR(50) NOT NULL, -- DEPOSIT, WITHDRAWAL, ALLOCATION, REDEMPTION, TRADING_PROFIT, TRADING_LOSS, FEE, REFERRAL_REWARD, REVERSAL
    amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    debit_account_id UUID REFERENCES ledger_accounts(id),
    credit_account_id UUID REFERENCES ledger_accounts(id),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'COMMITTED', -- COMMITTED, REVERSED
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Deposits
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(100) UNIQUE NOT NULL, -- Format: CPH-YYYYMMDD-XXXXXX
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL, -- MTN_MOMO, AIRTEL_MONEY, BANK_TRANSFER, VISA, MASTERCARD
    provider VARCHAR(50) NOT NULL,
    provider_tx_id VARCHAR(150),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSING, CONFIRMED, FAILED, CANCELLED, EXPIRED, REFUNDED
    reconciliation_status VARCHAR(50) DEFAULT 'UNRECONCILED', -- UNRECONCILED, RECONCILED, DISCREPANCY
    phone_number VARCHAR(50),
    payment_details JSONB,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18, 4) NOT NULL,
    fee NUMERIC(18, 4) DEFAULT 0.0000,
    net_amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    method VARCHAR(50) NOT NULL, -- MTN_MOMO, AIRTEL_MONEY, BANK_TRANSFER
    destination_details JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'REQUESTED', -- REQUESTED, UNDER_REVIEW, APPROVED, PROCESSING, COMPLETED, REJECTED, CANCELLED
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Investment Strategies
CREATE TABLE IF NOT EXISTS investment_strategies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- CRYPTO, FOREX, COMBINED
    description TEXT NOT NULL,
    risk_level VARCHAR(50) NOT NULL, -- LOW, MEDIUM, HIGH, MODERATE_HIGH
    min_investment NUMERIC(18, 4) DEFAULT 100.0000,
    management_fee_pct NUMERIC(6, 2) DEFAULT 1.50,
    performance_fee_pct NUMERIC(6, 2) DEFAULT 10.00,
    allocation_summary JSONB NOT NULL,
    verified_performance_status VARCHAR(100) DEFAULT 'No verified performance data available yet.',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Portfolio Allocations
CREATE TABLE IF NOT EXISTS portfolio_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_id VARCHAR(50) NOT NULL REFERENCES investment_strategies(id),
    allocated_amount NUMERIC(18, 4) NOT NULL,
    current_value NUMERIC(18, 4) NOT NULL,
    unrealized_pnl NUMERIC(18, 4) DEFAULT 0.0000,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, REDEEMED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Trading Engine Orders & Positions
CREATE TABLE IF NOT EXISTS trading_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id VARCHAR(50) NOT NULL,
    market_type VARCHAR(50) NOT NULL, -- CRYPTO, FOREX
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL, -- BUY, SELL
    order_type VARCHAR(20) DEFAULT 'MARKET',
    quantity NUMERIC(18, 6) NOT NULL,
    price NUMERIC(18, 6),
    executed_price NUMERIC(18, 6),
    status VARCHAR(50) DEFAULT 'FILLED',
    exchange_provider VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trading_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id VARCHAR(50) NOT NULL,
    market_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity NUMERIC(18, 6) NOT NULL,
    entry_price NUMERIC(18, 6) NOT NULL,
    current_price NUMERIC(18, 6) NOT NULL,
    unrealized_pnl NUMERIC(18, 4) DEFAULT 0.0000,
    stop_loss NUMERIC(18, 6),
    take_profit NUMERIC(18, 6),
    status VARCHAR(50) DEFAULT 'OPEN',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 12. Referrals & Rewards
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(32) NOT NULL,
    status VARCHAR(50) DEFAULT 'REGISTERED', -- REGISTERED, KYC_COMPLETED, QUALIFIED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID REFERENCES referrals(id),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'ELIGIBLE', -- PENDING, ELIGIBLE, PAID
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO', -- INFO, SUCCESS, WARNING, ALERT
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    previous_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Risk Engine Limits
CREATE TABLE IF NOT EXISTS risk_limits (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'MAIN',
    max_position_size_usd NUMERIC(18, 4) DEFAULT 50000.00,
    max_portfolio_exposure_pct NUMERIC(6, 2) DEFAULT 75.00,
    max_daily_loss_pct NUMERIC(6, 2) DEFAULT 3.50,
    max_drawdown_pct NUMERIC(6, 2) DEFAULT 10.00,
    max_open_positions INTEGER DEFAULT 15,
    stop_loss_pct NUMERIC(6, 2) DEFAULT 2.00,
    trading_halted BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
