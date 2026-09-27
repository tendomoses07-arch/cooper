import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { config } from '../config';

export function seedDatabase() {
  const existingUsers = db.query('SELECT COUNT(*) as count FROM users');
  if (existingUsers[0]?.count > 0) {
    console.log('[DB] Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('[DB] Starting database seeding for DEMO mode...');

  const now = new Date().toISOString();
  const salt = bcrypt.genSaltSync(10);

  // 1. Seed System Ledger Accounts
  const systemAccounts = [
    { id: 'sys-cash-mtn', type: 'PLATFORM_CASH_MTN', balance: 0.0 },
    { id: 'sys-cash-airtel', type: 'PLATFORM_CASH_AIRTEL', balance: 0.0 },
    { id: 'sys-cash-bank', type: 'PLATFORM_CASH_BANK', balance: 0.0 },
    { id: 'sys-cash-card', type: 'PLATFORM_CASH_CARD', balance: 0.0 },
    { id: 'sys-fees', type: 'PLATFORM_FEES', balance: 0.0 },
    { id: 'sys-escrow', type: 'ESCROW_WITHDRAWAL', balance: 0.0 },
    { id: 'sys-crypto-pool', type: 'BROKER_CRYPTO', balance: 0.0 },
    { id: 'sys-forex-pool', type: 'BROKER_FOREX', balance: 0.0 }
  ];

  for (const acc of systemAccounts) {
    db.run(
      `INSERT OR IGNORE INTO ledger_accounts (id, user_id, account_type, currency, balance, created_at)
       VALUES (?, NULL, ?, 'USD', ?, ?)`,
      [acc.id, acc.type, acc.balance, now]
    );
  }

  // 2. Seed Administrative Users
  const staffUsers = [
    {
      id: uuidv4(),
      first: 'Alexander',
      last: 'Cooper',
      email: 'admin@coopercomplexhub.com',
      phone: '+256700000001',
      country: 'Uganda',
      pass: 'CooperAdmin@2026!',
      role: 'SUPER_ADMIN',
      referral: 'CPH-ADMIN'
    },
    {
      id: uuidv4(),
      first: 'Grace',
      last: 'Nakato',
      email: 'compliance@coopercomplexhub.com',
      phone: '+256700000002',
      country: 'Uganda',
      pass: 'Compliance@2026!',
      role: 'COMPLIANCE_OFFICER',
      referral: 'CPH-COMPL'
    },
    {
      id: uuidv4(),
      first: 'David',
      last: 'Ochieng',
      email: 'finance@coopercomplexhub.com',
      phone: '+256700000003',
      country: 'Uganda',
      pass: 'Finance@2026!',
      role: 'FINANCE_OFFICER',
      referral: 'CPH-FIN'
    },
    {
      id: uuidv4(),
      first: 'Marcus',
      last: 'Vance',
      email: 'trading@coopercomplexhub.com',
      phone: '+256700000004',
      country: 'United Kingdom',
      pass: 'Trading@2026!',
      role: 'TRADING_MANAGER',
      referral: 'CPH-TRADE'
    },
    {
      id: uuidv4(),
      first: 'Sarah',
      last: 'Auma',
      email: 'support@coopercomplexhub.com',
      phone: '+256700000005',
      country: 'Uganda',
      pass: 'Support@2026!',
      role: 'SUPPORT_AGENT',
      referral: 'CPH-SUPP'
    }
  ];

  for (const staff of staffUsers) {
    const hash = bcrypt.hashSync(staff.pass, salt);
    db.run(
      `INSERT INTO users (id, first_name, last_name, email, phone, country, password_hash, referral_code, role, is_active, email_verified, phone_verified, two_factor_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 0, ?, ?)`,
      [staff.id, staff.first, staff.last, staff.email, staff.phone, staff.country, hash, staff.referral, staff.role, now, now]
    );
  }

  // 3. Seed Verified Demo Investor
  const demoInvestorId = uuidv4();
  const investorHash = bcrypt.hashSync('Investor@2026!', salt);
  db.run(
    `INSERT INTO users (id, first_name, last_name, email, phone, country, password_hash, referral_code, role, is_active, email_verified, phone_verified, two_factor_enabled, created_at, updated_at)
     VALUES (?, 'Demo', 'Investor', 'investor@coopercomplexhub.com', '+256772123456', 'Uganda', ?, 'CPH-INVESTOR-01', 'INVESTOR', 1, 1, 1, 0, ?, ?)`,
    [demoInvestorId, investorHash, now, now]
  );

  // User profile
  db.run(
    `INSERT INTO profiles (id, user_id, full_legal_name, date_of_birth, nationality, country_of_residence, address, occupation, source_of_funds, created_at, updated_at)
     VALUES (?, ?, 'Demo Investor Individual', '1990-05-15', 'Ugandan', 'Uganda', 'Plot 14 Lumumba Avenue, Kampala', 'Software Consultant', 'Savings & Tech Consulting', ?, ?)`,
    [uuidv4(), demoInvestorId, now, now]
  );

  // Verified KYC Record for Demo Investor
  const kycId = uuidv4();
  db.run(
    `INSERT INTO kyc_records (id, user_id, full_legal_name, date_of_birth, nationality, country_of_residence, id_type, id_number, address, occupation, source_of_funds, status, reviewer_notes, reviewed_at, created_at, updated_at)
     VALUES (?, ?, 'Demo Investor Individual', '1990-05-15', 'Ugandan', 'Uganda', 'NATIONAL_ID', 'CM90012458923KL', 'Plot 14 Lumumba Avenue, Kampala', 'Software Consultant', 'Savings & Tech Consulting', 'VERIFIED', 'Verified for demo environment testing', ?, ?, ?)`,
    [kycId, demoInvestorId, now, now, now]
  );

  // User Ledger Account
  const userLedgerAccId = uuidv4();
  db.run(
    `INSERT INTO ledger_accounts (id, user_id, account_type, currency, balance, created_at)
     VALUES (?, ?, 'USER_AVAILABLE', 'USD', 0, ?)`,
    [userLedgerAccId, demoInvestorId, now]
  );

  const userInvestedAccId = uuidv4();
  db.run(
    `INSERT INTO ledger_accounts (id, user_id, account_type, currency, balance, created_at)
     VALUES (?, ?, 'USER_INVESTED', 'USD', 0, ?)`,
    [userInvestedAccId, demoInvestorId, now]
  );

  // 4. Seed Investment Strategies (Section #8: Crypto, Forex, Combined)
  const strategies = [
    {
      id: 'crypto-strategy',
      name: 'Crypto Strategy',
      category: 'CRYPTO',
      description: 'A disciplined, risk-managed investment strategy focused on liquid cryptocurrency spot markets and hedging. Operates within pre-defined volatility parameters with systematic rebalancing.',
      risk_level: 'HIGH',
      min_investment: 250.0,
      management_fee_pct: 1.5,
      performance_fee_pct: 10.0,
      allocation_summary: JSON.stringify({
        assets: [
          { symbol: 'BTC', name: 'Bitcoin', targetPct: 50, description: 'Core store-of-value crypto asset' },
          { symbol: 'ETH', name: 'Ethereum', targetPct: 30, description: 'Smart contract layer-1 utility' },
          { symbol: 'SOL', name: 'Solana', targetPct: 15, description: 'High-throughput execution network' },
          { symbol: 'USDC', name: 'USD Coin Reserves', targetPct: 5, description: 'Cash buffer for volatility mitigation' }
        ]
      }),
      verified_performance_status: 'No verified performance data available yet.'
    },
    {
      id: 'forex-strategy',
      name: 'Forex Strategy',
      category: 'FOREX',
      description: 'Institutional-grade foreign exchange strategy trading liquid G10 currency pairs through an approved, regulated prime broker with algorithmic risk stops.',
      risk_level: 'MEDIUM',
      min_investment: 100.0,
      management_fee_pct: 1.5,
      performance_fee_pct: 10.0,
      allocation_summary: JSON.stringify({
        assets: [
          { symbol: 'EUR/USD', name: 'Euro / US Dollar', targetPct: 40, description: 'Deepest global liquidity pair' },
          { symbol: 'GBP/USD', name: 'British Pound / US Dollar', targetPct: 30, description: 'Macro monetary policy spread' },
          { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', targetPct: 30, description: 'Interest rate differential carry' }
        ]
      }),
      verified_performance_status: 'No verified performance data available yet.'
    },
    {
      id: 'combined-strategy',
      name: 'Combined Strategy',
      category: 'COMBINED',
      description: 'A multi-asset strategy combining eligible crypto market exposure with institutional foreign-exchange volatility buffering for balanced risk-adjusted allocation.',
      risk_level: 'MODERATE_HIGH',
      min_investment: 500.0,
      management_fee_pct: 2.0,
      performance_fee_pct: 12.0,
      allocation_summary: JSON.stringify({
        assets: [
          { symbol: 'FOREX_BASKET', name: 'G10 Currency Pairs', targetPct: 50, description: 'EUR/USD, GBP/USD, USD/JPY trend hedging' },
          { symbol: 'CRYPTO_BASKET', name: 'Liquid Digital Assets', targetPct: 50, description: 'BTC & ETH structured exposure' }
        ]
      }),
      verified_performance_status: 'No verified performance data available yet.'
    }
  ];

  for (const s of strategies) {
    db.run(
      `INSERT INTO investment_strategies (id, name, category, description, risk_level, min_investment, management_fee_pct, performance_fee_pct, allocation_summary, verified_performance_status, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [s.id, s.name, s.category, s.description, s.risk_level, s.min_investment, s.management_fee_pct, s.performance_fee_pct, s.allocation_summary, s.verified_performance_status, now]
    );
  }

  // 5. Seed Initial Demo Ledger Transactions for Demo Investor:
  // Deposit $5,000 via MTN Mobile Money
  const depositRef = 'CPH-20260927-000001';
  const depositId = uuidv4();
  db.run(
    `INSERT INTO deposits (id, reference, user_id, amount, currency, payment_method, provider, provider_tx_id, status, reconciliation_status, phone_number, payment_details, confirmed_at, created_at, updated_at)
     VALUES (?, ?, ?, 5000.00, 'USD', 'MTN_MOMO', 'MTN_UG_SANDBOX', 'MTN-REF-992144', 'CONFIRMED', 'RECONCILED', '+256772123456', '{"network":"MTN","note":"Initial demo deposit"}', ?, ?, ?)`,
    [depositId, depositRef, demoInvestorId, now, now, now]
  );

  // Financial Ledger Entry for the deposit:
  // Debit Platform Cash MTN -> Credit User Available Balance
  db.run(
    `INSERT INTO ledger_entries (id, transaction_ref, entry_type, amount, currency, debit_account_id, credit_account_id, user_id, description, status, metadata, created_at)
     VALUES (?, ?, 'DEPOSIT', 5000.00, 'USD', 'sys-cash-mtn', ?, ?, 'Demo Deposit confirmed via MTN Mobile Money', 'COMMITTED', '{"depositId":"${depositId}"}', ?)`,
    [uuidv4(), depositRef, userLedgerAccId, demoInvestorId, now]
  );

  // Allocate $2,000 to Crypto Strategy
  const allocRef1 = 'CPH-ALLOC-20260927-001';
  db.run(
    `INSERT INTO ledger_entries (id, transaction_ref, entry_type, amount, currency, debit_account_id, credit_account_id, user_id, description, status, metadata, created_at)
     VALUES (?, ?, 'ALLOCATION', 2000.00, 'USD', ?, 'sys-crypto-pool', ?, 'Allocation to Crypto Strategy', 'COMMITTED', '{"strategyId":"crypto-strategy"}', ?)`,
    [uuidv4(), allocRef1, userLedgerAccId, demoInvestorId, now]
  );

  db.run(
    `INSERT INTO portfolio_allocations (id, user_id, strategy_id, allocated_amount, current_value, unrealized_pnl, status, allocated_at, updated_at)
     VALUES (?, ?, 'crypto-strategy', 2000.00, 2000.00, 0.00, 'ACTIVE', ?, ?)`,
    [uuidv4(), demoInvestorId, now, now]
  );

  // Allocate $1,000 to Forex Strategy
  const allocRef2 = 'CPH-ALLOC-20260927-002';
  db.run(
    `INSERT INTO ledger_entries (id, transaction_ref, entry_type, amount, currency, debit_account_id, credit_account_id, user_id, description, status, metadata, created_at)
     VALUES (?, ?, 'ALLOCATION', 1000.00, 'USD', ?, 'sys-forex-pool', ?, 'Allocation to Forex Strategy', 'COMMITTED', '{"strategyId":"forex-strategy"}', ?)`,
    [uuidv4(), allocRef2, userLedgerAccId, demoInvestorId, now]
  );

  db.run(
    `INSERT INTO portfolio_allocations (id, user_id, strategy_id, allocated_amount, current_value, unrealized_pnl, status, allocated_at, updated_at)
     VALUES (?, ?, 'forex-strategy', 1000.00, 1000.00, 0.00, 'ACTIVE', ?, ?)`,
    [uuidv4(), demoInvestorId, now, now]
  );

  // Investment Account summary view
  db.run(
    `INSERT INTO investment_accounts (id, user_id, currency, available_balance, invested_balance, portfolio_value, realized_pnl, unrealized_pnl, total_fees, status, created_at, updated_at)
     VALUES (?, ?, 'USD', 2000.00, 3000.00, 3000.00, 0.00, 0.00, 0.00, 'ACTIVE', ?, ?)`,
    [uuidv4(), demoInvestorId, now, now]
  );

  // Seed Risk Limits
  db.run(
    `INSERT OR REPLACE INTO risk_limits (id, max_position_size_usd, max_portfolio_exposure_pct, max_daily_loss_pct, max_drawdown_pct, max_open_positions, stop_loss_pct, trading_halted, updated_by, updated_at)
     VALUES ('MAIN', ?, ?, ?, ?, ?, ?, 0, 'SYSTEM_INIT', ?)`,
    [
      config.DEFAULT_RISK_LIMITS.maxPositionSizeUSD,
      config.DEFAULT_RISK_LIMITS.maxPortfolioExposurePct,
      config.DEFAULT_RISK_LIMITS.maxDailyLossPct,
      config.DEFAULT_RISK_LIMITS.maxDrawdownPct,
      config.DEFAULT_RISK_LIMITS.maxOpenPositions,
      config.DEFAULT_RISK_LIMITS.stopLossPct,
      now
    ]
  );

  // Seed System Settings
  db.run(
    `INSERT OR REPLACE INTO system_settings (key, value, description, updated_at)
     VALUES ('app_mode', '{"mode":"DEMO"}', 'Current system environment mode', ?)`,
    [now]
  );

  db.run(
    `INSERT OR REPLACE INTO system_settings (key, value, description, updated_at)
     VALUES ('live_checklist', ?, 'Mandatory production deployment checklist requirements', ?)`,
    [JSON.stringify(config.LIVE_MODE_CHECKLIST), now]
  );

  // Seed Welcome Notification for Demo Investor
  db.run(
    `INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
     VALUES (?, ?, 'Welcome to COOPER Complex Hub', 'Your demo investment account is initialized. Review verified strategies or simulate a deposit.', 'SUCCESS', 0, '/dashboard', ?)`,
    [uuidv4(), demoInvestorId, now]
  );

  // Seed Sample Support Ticket
  const ticketId = uuidv4();
  db.run(
    `INSERT INTO support_tickets (id, ticket_number, user_id, category, subject, description, priority, status, created_at, updated_at)
     VALUES (?, 'TICK-1001', ?, 'Deposit', 'Question about MTN Mobile Money clearing timelines', 'Hello, in demo mode what are the simulated settlement windows?', 'NORMAL', 'RESOLVED', ?, ?)`,
    [ticketId, demoInvestorId, now, now]
  );

  db.run(
    `INSERT INTO support_messages (id, ticket_id, sender_id, sender_role, message, created_at)
     VALUES (?, ?, ?, 'INVESTOR', 'Hello, in demo mode what are the simulated settlement windows?', ?)`,
    [uuidv4(), ticketId, demoInvestorId, now]
  );

  db.run(
    `INSERT INTO support_messages (id, ticket_id, sender_id, sender_role, message, created_at)
     VALUES (?, ?, ?, 'SUPPORT_AGENT', 'Hi! In DEMO mode, transactions confirm after mock provider validation. In production, mobile money settles in real-time upon webhook receipt.', ?)`,
    [uuidv4(), ticketId, staffUsers[4].id, now]
  );

  console.log('[DB] Seeding completed successfully.');
}
