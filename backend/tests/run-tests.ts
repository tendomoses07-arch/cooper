import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, initDatabase } from '../src/database/db';
import { seedDatabase } from '../src/database/seed';
import { ledgerService } from '../src/modules/ledger/ledgerService';
import { paymentService } from '../src/modules/payments/paymentProviders';
import { tradingRiskEngine } from '../src/modules/trading/tradingEngine';

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  COOPER Complex Hub - Automated Test Suite');
  console.log('======================================================\n');

  initDatabase();
  seedDatabase();

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Authentication & Security Tests
  console.log('--- 1. AUTHENTICATION & SECURITY TESTS ---');
  await test('Password hashing with bcrypt behaves securely', () => {
    const raw = 'SecureCooper@2026';
    const hash = bcrypt.hashSync(raw, 10);
    assert.ok(bcrypt.compareSync(raw, hash), 'Hash should match raw password');
    assert.ok(!bcrypt.compareSync('WrongPassword', hash), 'Wrong password must fail');
  });

  await test('Demo investor and Staff accounts exist with correct roles', () => {
    const admin = db.get<any>('SELECT role FROM users WHERE email = ?', ['admin@coopercomplexhub.com']);
    assert.strictEqual(admin?.role, 'SUPER_ADMIN');

    const investor = db.get<any>('SELECT role FROM users WHERE email = ?', ['investor@coopercomplexhub.com']);
    assert.strictEqual(investor?.role, 'INVESTOR');
  });

  // 2. Financial Ledger Tests
  console.log('\n--- 2. FINANCIAL LEDGER & INTEGRITY TESTS ---');
  const testUserId = uuidv4();
  const testUserAvailId = uuidv4();
  const now = new Date().toISOString();
  const testRef = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const testEmail = `test-${Date.now()}@coopercomplexhub.com`;
  const testPhone = `+256${Math.floor(700000000 + Math.random() * 99999999)}`;

  // Insert verified test user
  db.run(
    `INSERT INTO users (id, first_name, last_name, email, phone, country, password_hash, referral_code, role, is_active, created_at, updated_at)
     VALUES (?, 'Automated', 'Tester', ?, ?, 'Uganda', 'hash', ?, 'INVESTOR', 1, ?, ?)`,
    [testUserId, testEmail, testPhone, testRef, now, now]
  );

  // User ledger account
  db.run(
    `INSERT INTO ledger_accounts (id, user_id, account_type, currency, balance, created_at)
     VALUES (?, ?, 'USER_AVAILABLE', 'USD', 0, ?)`,
    [testUserAvailId, testUserId, now]
  );

  await test('Ledger balances derive strictly from double-entry records', () => {
    // Initial balance should be 0
    const b0 = ledgerService.getUserBalancesFromLedger(testUserId);
    assert.strictEqual(b0.availableBalance, 0);

    // Credit $1,000 via deposit
    ledgerService.recordEntry({
      transactionRef: `TEST-TX-${Date.now()}-1`,
      entryType: 'DEPOSIT',
      amount: 1000.00,
      debitAccountId: 'sys-cash-bank',
      creditAccountId: testUserAvailId,
      userId: testUserId,
      description: 'Test deposit'
    });

    const b1 = ledgerService.getUserBalancesFromLedger(testUserId);
    assert.strictEqual(b1.availableBalance, 1000.00, 'Available balance should be exactly 1000.00');

    // Debit $300 via allocation
    ledgerService.recordEntry({
      transactionRef: `TEST-TX-${Date.now()}-2`,
      entryType: 'ALLOCATION',
      amount: 300.00,
      debitAccountId: testUserAvailId,
      creditAccountId: 'sys-crypto-pool',
      userId: testUserId,
      description: 'Test allocation'
    });

    const b2 = ledgerService.getUserBalancesFromLedger(testUserId);
    assert.strictEqual(b2.availableBalance, 700.00, 'Available balance should be reduced to 700.00');
  });

  await test('Ledger rejects non-positive transaction amounts', () => {
    assert.throws(() => {
      ledgerService.recordEntry({
        transactionRef: 'TEST-FAIL-001',
        entryType: 'DEPOSIT',
        amount: -50.00,
        debitAccountId: 'sys-cash-bank',
        creditAccountId: testUserAvailId,
        userId: testUserId,
        description: 'Negative deposit'
      });
    }, /must be greater than zero/);
  });

  // 3. Payments & Idempotency Tests
  console.log('\n--- 3. PAYMENTS & IDEMPOTENCY TESTS ---');
  await test('Deposit confirmation and Idempotency: cannot credit twice', async () => {
    const ref = paymentService.generateReference();
    const depId = uuidv4();
    const timeNow = new Date().toISOString();

    db.run(
      `INSERT INTO deposits (id, reference, user_id, amount, currency, payment_method, provider, status, created_at, updated_at)
       VALUES (?, ?, ?, 250.00, 'USD', 'MTN_MOMO', 'MTN_MOMO', 'PENDING', ?, ?)`,
      [depId, ref, testUserId, timeNow, timeNow]
    );

    // First confirmation
    const firstConf = paymentService.confirmDeposit(ref, 'MTN-TEST-1234');
    assert.strictEqual(firstConf.alreadyConfirmed, false);
    assert.strictEqual(firstConf.status, 'CONFIRMED');

    // Duplicate confirmation call (idempotency check)
    const secondConf = paymentService.confirmDeposit(ref, 'MTN-TEST-1234');
    assert.strictEqual(secondConf.alreadyConfirmed, true, 'Second call must be idempotent');
  });

  // 4. Trading & Risk Circuit Breakers Tests
  console.log('\n--- 4. TRADING & RISK CIRCUIT BREAKERS ---');
  const realAdmin = db.get<any>('SELECT id, email, role FROM users WHERE email = ?', ['admin@coopercomplexhub.com']);

  await test('Trading halts block order execution when emergency switch is active', async () => {
    // Activate Emergency Halt
    tradingRiskEngine.setTradingHalt(true, realAdmin, 'Test Emergency Shutdown');
    const limitsHalted = tradingRiskEngine.getRiskLimits();
    assert.strictEqual(limitsHalted.trading_halted, 1);

    // Attempt trade while halted
    await assert.rejects(
      async () => {
        await tradingRiskEngine.executeTrade(
          {
            strategyId: 'crypto-strategy',
            marketType: 'CRYPTO',
            symbol: 'BTC/USDT',
            side: 'BUY',
            quantity: 0.1
          },
          realAdmin
        );
      },
      /Emergency trading halt is currently ACTIVE/
    );

    // Resume Trading
    tradingRiskEngine.setTradingHalt(false, realAdmin, 'Test Resume Operations');
    const limitsResumed = tradingRiskEngine.getRiskLimits();
    assert.strictEqual(limitsResumed.trading_halted, 0);
  });

  await test('Risk limits block order sizes exceeding max position limits', async () => {
    // Huge order ($64k * 5 = $320,000, max limit is $50,000)
    await assert.rejects(
      async () => {
        await tradingRiskEngine.executeTrade(
          {
            strategyId: 'crypto-strategy',
            marketType: 'CRYPTO',
            symbol: 'BTC/USDT',
            side: 'BUY',
            quantity: 10
          },
          realAdmin
        );
      },
      /Position size .* exceeds maximum limit/
    );
  });

  // 5. Investment Performance Integrity
  console.log('\n--- 5. STRATEGY DATA INTEGRITY (NO FAKE RETURNS) ---');
  await test('Strategies explicitly disclose "No verified performance data available yet."', () => {
    const strats = db.query('SELECT name, verified_performance_status FROM investment_strategies');
    assert.ok(strats.length >= 3, 'Must have at least 3 initial strategies');
    for (const s of strats) {
      assert.strictEqual(
        s.verified_performance_status,
        'No verified performance data available yet.',
        'Must never show fabricated performance'
      );
    }
  });

  console.log('\n======================================================');
  console.log(`  Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
