import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';

export interface LedgerEntryInput {
  transactionRef: string;
  entryType: 'DEPOSIT' | 'WITHDRAWAL' | 'ALLOCATION' | 'REDEMPTION' | 'TRADING_PROFIT' | 'TRADING_LOSS' | 'FEE' | 'REFERRAL_REWARD' | 'REVERSAL';
  amount: number;
  currency?: string;
  debitAccountId: string;
  creditAccountId: string;
  userId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export const ledgerService = {
  /**
   * Records an immutable double-entry ledger record.
   * Runs within an atomic database transaction.
   */
  recordEntry(input: LedgerEntryInput) {
    if (input.amount <= 0) {
      throw new Error('Ledger transaction amount must be greater than zero.');
    }

    const entryId = uuidv4();
    const now = new Date().toISOString();
    const currency = input.currency || 'USD';

    return db.transaction(() => {
      // 1. Validate debit account exists
      const debitAccount = db.get<any>(
        'SELECT id, balance FROM ledger_accounts WHERE id = ?',
        [input.debitAccountId]
      );
      if (!debitAccount) {
        throw new Error(`Debit ledger account ${input.debitAccountId} does not exist.`);
      }

      // 2. Validate credit account exists
      const creditAccount = db.get<any>(
        'SELECT id, balance FROM ledger_accounts WHERE id = ?',
        [input.creditAccountId]
      );
      if (!creditAccount) {
        throw new Error(`Credit ledger account ${input.creditAccountId} does not exist.`);
      }

      // 3. Insert immutable ledger entry
      db.run(
        `INSERT INTO ledger_entries (
          id, transaction_ref, entry_type, amount, currency,
          debit_account_id, credit_account_id, user_id, description, status, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMMITTED', ?, ?)`,
        [
          entryId,
          input.transactionRef,
          input.entryType,
          input.amount,
          currency,
          input.debitAccountId,
          input.creditAccountId,
          input.userId || null,
          input.description,
          input.metadata ? JSON.stringify(input.metadata) : null,
          now
        ]
      );

      // 4. Update balances on ledger accounts
      db.run('UPDATE ledger_accounts SET balance = balance - ? WHERE id = ?', [input.amount, input.debitAccountId]);
      db.run('UPDATE ledger_accounts SET balance = balance + ? WHERE id = ?', [input.amount, input.creditAccountId]);

      // 5. If a user is attached, recalculate and sync their investment_accounts view
      if (input.userId) {
        this.syncUserInvestmentAccount(input.userId);
      }

      return {
        entryId,
        transactionRef: input.transactionRef,
        amount: input.amount,
        entryType: input.entryType,
        status: 'COMMITTED',
        timestamp: now
      };
    });
  },

  /**
   * Dynamically aggregates ledger entries to calculate true user available & invested balances.
   * This guarantees that balances are mathematically derived from verified ledger lines,
   * never editable directly from frontend or simple update calls.
   */
  getUserBalancesFromLedger(userId: string) {
    // Available user account
    const userAvailableAcc = db.get<any>(
      `SELECT id FROM ledger_accounts WHERE user_id = ? AND account_type = 'USER_AVAILABLE'`,
      [userId]
    );

    let availableBalance = 0;
    if (userAvailableAcc) {
      // Credits to user available account add funds; debits from user available account reduce funds
      const creditSum = db.get<any>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE credit_account_id = ? AND status = 'COMMITTED'`,
        [userAvailableAcc.id]
      )?.total || 0;

      const debitSum = db.get<any>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE debit_account_id = ? AND status = 'COMMITTED'`,
        [userAvailableAcc.id]
      )?.total || 0;

      availableBalance = Math.max(0, creditSum - debitSum);
    }

    // Active allocations in strategies
    const allocationsSum = db.get<any>(
      `SELECT COALESCE(SUM(allocated_amount), 0) as total, COALESCE(SUM(current_value), 0) as currentValue, COALESCE(SUM(unrealized_pnl), 0) as pnl
       FROM portfolio_allocations WHERE user_id = ? AND status = 'ACTIVE'`,
      [userId]
    );

    const investedBalance = allocationsSum?.total || 0;
    const portfolioValue = allocationsSum?.currentValue || 0;
    const unrealizedPnl = allocationsSum?.pnl || 0;

    // Total lifetime deposits
    const totalDeposits = db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE user_id = ? AND status = 'CONFIRMED'`,
      [userId]
    )?.total || 0;

    // Pending withdrawals currently locked
    const pendingWithdrawals = db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING')`,
      [userId]
    )?.total || 0;

    const totalAccountValue = availableBalance + portfolioValue;

    return {
      availableBalance: parseFloat(availableBalance.toFixed(2)),
      investedBalance: parseFloat(investedBalance.toFixed(2)),
      portfolioValue: parseFloat(portfolioValue.toFixed(2)),
      unrealizedPnl: parseFloat(unrealizedPnl.toFixed(2)),
      totalAccountValue: parseFloat(totalAccountValue.toFixed(2)),
      totalDeposits: parseFloat(totalDeposits.toFixed(2)),
      pendingWithdrawals: parseFloat(pendingWithdrawals.toFixed(2)),
      currency: 'USD'
    };
  },

  /**
   * Synchronizes the user's investment_accounts table row from ledger aggregates
   */
  syncUserInvestmentAccount(userId: string) {
    const balances = this.getUserBalancesFromLedger(userId);
    const now = new Date().toISOString();

    const existing = db.get<any>('SELECT id FROM investment_accounts WHERE user_id = ?', [userId]);
    if (existing) {
      db.run(
        `UPDATE investment_accounts
         SET available_balance = ?, invested_balance = ?, portfolio_value = ?,
             unrealized_pnl = ?, updated_at = ?
         WHERE user_id = ?`,
        [balances.availableBalance, balances.investedBalance, balances.portfolioValue, balances.unrealizedPnl, now, userId]
      );
    } else {
      db.run(
        `INSERT INTO investment_accounts (id, user_id, currency, available_balance, invested_balance, portfolio_value, realized_pnl, unrealized_pnl, total_fees, status, created_at, updated_at)
         VALUES (?, ?, 'USD', ?, ?, ?, 0.00, ?, 0.00, 'ACTIVE', ?, ?)`,
        [uuidv4(), userId, balances.availableBalance, balances.investedBalance, balances.portfolioValue, balances.unrealizedPnl, now, now]
      );
    }
  },

  /**
   * Helper to ensure user has ledger accounts
   */
  ensureUserLedgerAccounts(userId: string) {
    const now = new Date().toISOString();
    const userAcc = db.get<any>(
      `SELECT id FROM ledger_accounts WHERE user_id = ? AND account_type = 'USER_AVAILABLE'`,
      [userId]
    );

    if (!userAcc) {
      const availId = uuidv4();
      db.run(
        `INSERT INTO ledger_accounts (id, user_id, account_type, currency, balance, created_at)
         VALUES (?, ?, 'USER_AVAILABLE', 'USD', 0, ?)`,
        [availId, userId, now]
      );
    }

    const investAcc = db.get<any>(
      `SELECT id FROM ledger_accounts WHERE user_id = ? AND account_type = 'USER_INVESTED'`,
      [userId]
    );

    if (!investAcc) {
      const invId = uuidv4();
      db.run(
        `INSERT INTO ledger_accounts (id, user_id, account_type, currency, balance, created_at)
         VALUES (?, ?, 'USER_INVESTED', 'USD', 0, ?)`,
        [invId, userId, now]
      );
    }
  }
};
