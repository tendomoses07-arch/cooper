import { Response } from 'express';
import { db } from '../../database/db';
import { config } from '../../config';
import { tradingRiskEngine } from '../trading/tradingEngine';
import { AuthRequest, logAuditAction } from '../../middleware/auth';

export const adminController = {
  /**
   * Admin Portal Dashboard KPIs (Real database calculations)
   */
  async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      // 1. User metrics
      const totalUsers = db.get<any>('SELECT COUNT(*) as count FROM users WHERE role = ?', ['INVESTOR'])?.count || 0;
      const verifiedUsers = db.get<any>("SELECT COUNT(*) as count FROM kyc_records WHERE status = 'VERIFIED'")?.count || 0;
      const pendingKYC = db.get<any>("SELECT COUNT(*) as count FROM kyc_records WHERE status IN ('PENDING', 'UNDER_REVIEW')")?.count || 0;

      // 2. Deposit metrics
      const depositStats = db.get<any>(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN amount ELSE 0 END), 0) as totalDeposits,
          COALESCE(SUM(CASE WHEN status IN ('PENDING', 'PROCESSING') THEN amount ELSE 0 END), 0) as pendingDeposits,
          COUNT(CASE WHEN status IN ('PENDING', 'PROCESSING') THEN 1 END) as pendingDepositsCount
         FROM deposits`
      );

      // 3. Withdrawal metrics
      const withdrawalStats = db.get<any>(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as totalWithdrawals,
          COALESCE(SUM(CASE WHEN status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING') THEN amount ELSE 0 END), 0) as pendingWithdrawals,
          COUNT(CASE WHEN status IN ('REQUESTED', 'UNDER_REVIEW') THEN 1 END) as pendingWithdrawalsCount
         FROM withdrawals`
      );

      // 4. Portfolio & Investments
      const investmentStats = db.get<any>(
        `SELECT
          COALESCE(SUM(allocated_amount), 0) as totalInvested,
          COALESCE(SUM(current_value), 0) as portfolioValue,
          COALESCE(SUM(unrealized_pnl), 0) as totalPnl
         FROM portfolio_allocations
         WHERE status = 'ACTIVE'`
      );

      // 5. Fees collected
      const feeAccount = db.get<any>("SELECT balance FROM ledger_accounts WHERE id = 'sys-fees'");

      // 6. Referral rewards
      const referralStats = db.get<any>(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paidRewards,
          COALESCE(SUM(CASE WHEN status = 'ELIGIBLE' THEN amount ELSE 0 END), 0) as pendingRewards
         FROM referral_rewards`
      );

      // 7. Trading & Risk Status
      const riskLimits = tradingRiskEngine.getRiskLimits();
      const openPositions = tradingRiskEngine.getOpenPositions();

      // 8. Recent Audit Logs
      const recentAudit = db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10');

      res.status(200).json({
        success: true,
        stats: {
          appMode: config.APP_MODE,
          totalUsers,
          verifiedUsers,
          pendingKYC,
          totalDeposits: parseFloat(depositStats.totalDeposits.toFixed(2)),
          pendingDeposits: parseFloat(depositStats.pendingDeposits.toFixed(2)),
          pendingDepositsCount: depositStats.pendingDepositsCount,
          totalWithdrawals: parseFloat(withdrawalStats.totalWithdrawals.toFixed(2)),
          pendingWithdrawals: parseFloat(withdrawalStats.pendingWithdrawals.toFixed(2)),
          pendingWithdrawalsCount: withdrawalStats.pendingWithdrawalsCount,
          totalInvested: parseFloat(investmentStats.totalInvested.toFixed(2)),
          portfolioValue: parseFloat(investmentStats.portfolioValue.toFixed(2)),
          totalPnl: parseFloat(investmentStats.totalPnl.toFixed(2)),
          platformFees: parseFloat((feeAccount?.balance || 0).toFixed(2)),
          paidReferralRewards: parseFloat(referralStats.paidRewards.toFixed(2)),
          tradingHalted: riskLimits.trading_halted === 1,
          openPositionsCount: openPositions.length
        },
        recentAudit
      });
    } catch (err: any) {
      console.error('Admin stats error:', err);
      res.status(500).json({ success: false, error: 'Failed to compute administrative metrics.' });
    }
  },

  /**
   * Search and list all platform users
   */
  async listUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search, role, status } = req.query;

      let sql = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.country,
               u.role, u.is_active, u.is_suspended, u.suspension_reason,
               u.referral_code, u.two_factor_enabled, u.created_at,
               k.status as kyc_status,
               COALESCE(ia.available_balance, 0) as available_balance,
               COALESCE(ia.invested_balance, 0) as invested_balance
        FROM users u
        LEFT JOIN kyc_records k ON u.id = k.user_id
        LEFT JOIN investment_accounts ia ON u.id = ia.user_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        sql += ` AND (u.email LIKE ? OR u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q, q);
      }

      if (role && role !== 'ALL') {
        sql += ' AND u.role = ?';
        params.push(role);
      }

      if (status === 'SUSPENDED') {
        sql += ' AND u.is_suspended = 1';
      } else if (status === 'ACTIVE') {
        sql += ' AND u.is_active = 1 AND u.is_suspended = 0';
      }

      sql += ' ORDER BY u.created_at DESC LIMIT 100';

      const users = db.query(sql, params);
      res.status(200).json({
        success: true,
        users: users.map(u => ({
          ...u,
          is_active: Boolean(u.is_active),
          is_suspended: Boolean(u.is_suspended),
          two_factor_enabled: Boolean(u.two_factor_enabled)
        }))
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch users list.' });
    }
  },

  /**
   * Suspend or Reactivate a user account
   */
  async toggleSuspendUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { suspend, reason } = req.body;
      const admin = req.user!;

      const user = db.get<any>('SELECT id, email, role, is_suspended FROM users WHERE id = ?', [id]);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      if (user.role === 'SUPER_ADMIN') {
        res.status(400).json({ success: false, error: 'Super Admin accounts cannot be suspended.' });
        return;
      }

      const now = new Date().toISOString();
      const isSuspended = suspend ? 1 : 0;

      db.run(
        'UPDATE users SET is_suspended = ?, suspension_reason = ?, updated_at = ? WHERE id = ?',
        [isSuspended, suspend ? reason || 'Administrative compliance review' : null, now, id]
      );

      logAuditAction(
        admin,
        suspend ? 'USER_ACCOUNT_SUSPENDED' : 'USER_ACCOUNT_REACTIVATED',
        'USER',
        id,
        { is_suspended: user.is_suspended },
        { is_suspended: isSuspended, reason },
        reason || 'Administrative action'
      );

      res.status(200).json({
        success: true,
        message: `User account ${suspend ? 'suspended' : 'reactivated'} successfully.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to update user account status.' });
    }
  },

  /**
   * Emergency Trading Kill Switch ("STOP ALL TRADING")
   */
  async toggleTradingHalt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { halt, reason } = req.body;
      const admin = req.user!;

      const result = tradingRiskEngine.setTradingHalt(Boolean(halt), admin, reason);
      res.status(200).json({
        success: true,
        message: halt ? 'EMERGENCY: ALL TRADING HAS BEEN HALTED.' : 'Trading operations resumed.',
        result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to toggle trading circuit breaker.' });
    }
  },

  /**
   * Get and update Risk Limits
   */
  async getRiskLimits(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limits = tradingRiskEngine.getRiskLimits();
      const openPositions = tradingRiskEngine.getOpenPositions();
      const recentOrders = tradingRiskEngine.getOrders();

      res.status(200).json({
        success: true,
        limits,
        openPositions,
        recentOrders
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch risk parameters.' });
    }
  },

  async updateRiskLimits(req: AuthRequest, res: Response): Promise<void> {
    try {
      const admin = req.user!;
      const updated = tradingRiskEngine.updateLimits(req.body, admin);
      res.status(200).json({ success: true, message: 'Risk limits updated successfully.', limits: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to update risk limits.' });
    }
  },

  /**
   * Execute manual trading order (Simulation / Trading Engine check)
   */
  async executeOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const admin = req.user!;
      const { strategyId, marketType, symbol, side, quantity, price, stopLoss } = req.body;

      const orderResult = await tradingRiskEngine.executeTrade(
        {
          strategyId,
          marketType,
          symbol,
          side,
          quantity: Number(quantity),
          price: price ? Number(price) : undefined,
          stopLoss: stopLoss ? Number(stopLoss) : undefined
        },
        admin
      );

      res.status(200).json({ success: true, message: 'Order executed successfully.', order: orderResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Trade execution failed.' });
    }
  },

  /**
   * View Audit Logs
   */
  async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { action, actor, limit = 100 } = req.query;

      let sql = 'SELECT * FROM audit_logs WHERE 1=1';
      const params: any[] = [];

      if (action) {
        sql += ' AND action LIKE ?';
        params.push(`%${action}%`);
      }

      if (actor) {
        sql += ' AND actor_email LIKE ?';
        params.push(`%${actor}%`);
      }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(Number(limit));

      const logs = db.query(sql, params);
      res.status(200).json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
    }
  },

  /**
   * Live Mode Checklist (Production Safety Requirement #56)
   */
  async getLiveChecklist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const setting = db.get<any>("SELECT value FROM system_settings WHERE key = 'live_checklist'");
      const checklist = setting ? JSON.parse(setting.value) : config.LIVE_MODE_CHECKLIST;

      const allChecked = checklist.every((item: any) => item.checked === true);

      res.status(200).json({
        success: true,
        appMode: config.APP_MODE,
        canSwitchToLive: allChecked,
        checklist
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch live checklist.' });
    }
  },

  async updateLiveChecklistItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { itemId, checked } = req.body;
      const admin = req.user!;

      const setting = db.get<any>("SELECT value FROM system_settings WHERE key = 'live_checklist'");
      let checklist = setting ? JSON.parse(setting.value) : [...config.LIVE_MODE_CHECKLIST];

      checklist = checklist.map((item: any) => {
        if (item.id === itemId) {
          return { ...item, checked: Boolean(checked) };
        }
        return item;
      });

      const now = new Date().toISOString();
      db.run(
        `UPDATE system_settings SET value = ?, updated_at = ? WHERE key = 'live_checklist'`,
        [JSON.stringify(checklist), now]
      );

      logAuditAction(
        admin,
        'LIVE_CHECKLIST_UPDATE',
        'SYSTEM_SETTINGS',
        itemId,
        null,
        { itemId, checked },
        `Checklist item ${itemId} set to ${checked}`
      );

      const allChecked = checklist.every((item: any) => item.checked === true);

      res.status(200).json({
        success: true,
        canSwitchToLive: allChecked,
        checklist
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to update live checklist item.' });
    }
  }
};
