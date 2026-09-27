import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { ledgerService } from '../ledger/ledgerService';
import { AuthRequest } from '../../middleware/auth';

export const investmentController = {
  /**
   * List investment strategies
   */
  async getStrategies(req: any, res: Response): Promise<void> {
    try {
      const strategies = db.query('SELECT * FROM investment_strategies WHERE is_active = 1');
      const formatted = strategies.map(s => ({
        ...s,
        allocation_summary: typeof s.allocation_summary === 'string' ? JSON.parse(s.allocation_summary) : s.allocation_summary,
        is_active: Boolean(s.is_active)
      }));

      res.status(200).json({ success: true, strategies: formatted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve strategies.' });
    }
  },

  /**
   * Get single strategy details
   */
  async getStrategyById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const strategy = db.get<any>('SELECT * FROM investment_strategies WHERE id = ?', [id]);
      if (!strategy) {
        res.status(404).json({ success: false, error: 'Strategy not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        strategy: {
          ...strategy,
          allocation_summary: typeof strategy.allocation_summary === 'string' ? JSON.parse(strategy.allocation_summary) : strategy.allocation_summary
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch strategy.' });
    }
  },

  /**
   * Allocate funds to a strategy
   */
  async allocate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { strategy_id, amount } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, error: 'Invalid investment amount.' });
        return;
      }

      // Check KYC
      const kyc = db.get<any>('SELECT status FROM kyc_records WHERE user_id = ?', [userId]);
      if (!kyc || kyc.status !== 'VERIFIED') {
        res.status(403).json({
          success: false,
          error: 'Identity verification required. Complete KYC before allocating capital to strategies.'
        });
        return;
      }

      const strategy = db.get<any>('SELECT * FROM investment_strategies WHERE id = ? AND is_active = 1', [strategy_id]);
      if (!strategy) {
        res.status(404).json({ success: false, error: 'Strategy not found or inactive.' });
        return;
      }

      if (numAmount < strategy.min_investment) {
        res.status(400).json({
          success: false,
          error: `Minimum investment for this strategy is $${strategy.min_investment.toFixed(2)}.`
        });
        return;
      }

      const balances = ledgerService.getUserBalancesFromLedger(userId);
      if (balances.availableBalance < numAmount) {
        res.status(400).json({
          success: false,
          error: `Insufficient available balance ($${balances.availableBalance.toFixed(2)} available). Please deposit funds first.`
        });
        return;
      }

      const now = new Date().toISOString();
      const reference = `CPH-ALLOC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      db.transaction(() => {
        const userAvailAcc = db.get<any>(
          `SELECT id FROM ledger_accounts WHERE user_id = ? AND account_type = 'USER_AVAILABLE'`,
          [userId]
        );

        const poolAccountId = strategy.category === 'CRYPTO' ? 'sys-crypto-pool' : 'sys-forex-pool';

        // Post ledger entry
        ledgerService.recordEntry({
          transactionRef: reference,
          entryType: 'ALLOCATION',
          amount: numAmount,
          currency: 'USD',
          debitAccountId: userAvailAcc.id,
          creditAccountId: poolAccountId,
          userId,
          description: `Capital allocation to ${strategy.name}`,
          metadata: { strategyId: strategy.id, strategyName: strategy.name }
        });

        // Update or insert portfolio_allocations
        const existingAlloc = db.get<any>(
          `SELECT id, allocated_amount, current_value FROM portfolio_allocations WHERE user_id = ? AND strategy_id = ? AND status = 'ACTIVE'`,
          [userId, strategy_id]
        );

        if (existingAlloc) {
          db.run(
            `UPDATE portfolio_allocations
             SET allocated_amount = allocated_amount + ?, current_value = current_value + ?, updated_at = ?
             WHERE id = ?`,
            [numAmount, numAmount, now, existingAlloc.id]
          );
        } else {
          db.run(
            `INSERT INTO portfolio_allocations (id, user_id, strategy_id, allocated_amount, current_value, unrealized_pnl, status, allocated_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 0.00, 'ACTIVE', ?, ?)`,
            [uuidv4(), userId, strategy_id, numAmount, numAmount, now, now]
          );
        }

        // Notification
        db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, link, created_at)
           VALUES (?, ?, 'Investment Allocation Confirmed', ?, 'SUCCESS', '/portfolio', ?)`,
          [
            uuidv4(),
            userId,
            `Allocated $${numAmount.toFixed(2)} to ${strategy.name}. You can track this allocation in your portfolio.`,
            now
          ]
        );
      });

      res.status(200).json({
        success: true,
        message: `Successfully allocated $${numAmount.toFixed(2)} to ${strategy.name}.`,
        reference
      });
    } catch (err: any) {
      console.error('Allocation error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to allocate investment.' });
    }
  },

  /**
   * Redeem funds from a strategy back to user available balance
   */
  async redeem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { strategy_id, amount } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, error: 'Invalid redemption amount.' });
        return;
      }

      const allocation = db.get<any>(
        `SELECT * FROM portfolio_allocations WHERE user_id = ? AND strategy_id = ? AND status = 'ACTIVE'`,
        [userId, strategy_id]
      );

      if (!allocation || allocation.current_value < numAmount) {
        res.status(400).json({
          success: false,
          error: `Redemption amount exceeds active allocation value ($${allocation?.current_value?.toFixed(2) || 0} active).`
        });
        return;
      }

      const strategy = db.get<any>('SELECT name, category FROM investment_strategies WHERE id = ?', [strategy_id]);
      const poolAccountId = strategy?.category === 'CRYPTO' ? 'sys-crypto-pool' : 'sys-forex-pool';
      const reference = `CPH-REDM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();

      db.transaction(() => {
        const userAvailAcc = db.get<any>(
          `SELECT id FROM ledger_accounts WHERE user_id = ? AND account_type = 'USER_AVAILABLE'`,
          [userId]
        );

        // Move funds back from pool to user available account
        ledgerService.recordEntry({
          transactionRef: reference,
          entryType: 'REDEMPTION',
          amount: numAmount,
          currency: 'USD',
          debitAccountId: poolAccountId,
          creditAccountId: userAvailAcc.id,
          userId,
          description: `Capital redemption from ${strategy?.name || strategy_id}`,
          metadata: { strategyId: strategy_id }
        });

        // Deduct allocation
        const remaining = allocation.current_value - numAmount;
        if (remaining <= 0.01) {
          db.run(
            `UPDATE portfolio_allocations
             SET current_value = 0, allocated_amount = 0, status = 'REDEEMED', updated_at = ?
             WHERE id = ?`,
            [now, allocation.id]
          );
        } else {
          db.run(
            `UPDATE portfolio_allocations
             SET current_value = current_value - ?, allocated_amount = allocated_amount - ?, updated_at = ?
             WHERE id = ?`,
            [numAmount, numAmount, now, allocation.id]
          );
        }

        // Notification
        db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, link, created_at)
           VALUES (?, ?, 'Redemption Confirmed', ?, 'INFO', '/dashboard', ?)`,
          [
            uuidv4(),
            userId,
            `Redeemed $${numAmount.toFixed(2)} from ${strategy?.name || 'strategy'} to available balance.`,
            now
          ]
        );
      });

      res.status(200).json({
        success: true,
        message: `Successfully redeemed $${numAmount.toFixed(2)} to available balance.`,
        reference
      });
    } catch (err: any) {
      console.error('Redemption error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to process redemption.' });
    }
  },

  /**
   * User Portfolio Overview
   */
  async getPortfolio(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const balances = ledgerService.getUserBalancesFromLedger(userId);

      const allocations = db.query(
        `SELECT p.*, s.name as strategy_name, s.category, s.risk_level, s.allocation_summary
         FROM portfolio_allocations p
         JOIN investment_strategies s ON p.strategy_id = s.id
         WHERE p.user_id = ? AND p.status = 'ACTIVE'`,
        [userId]
      );

      const formattedAllocations = allocations.map(a => ({
        ...a,
        allocation_summary: typeof a.allocation_summary === 'string' ? JSON.parse(a.allocation_summary) : a.allocation_summary
      }));

      res.status(200).json({
        success: true,
        portfolio: {
          balances,
          allocations: formattedAllocations,
          verifiedNotice: 'No verified performance data available yet. All metrics are calculated from legitimate ledger account entries.'
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve portfolio.' });
    }
  }
};
