import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { config } from '../../config';
import { ledgerService } from '../ledger/ledgerService';
import { AuthRequest, logAuditAction } from '../../middleware/auth';

export const withdrawalController = {
  /**
   * Request a withdrawal
   */
  async requestWithdrawal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount, method, destination_details, twoFactorCode } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 20) {
        res.status(400).json({ success: false, error: 'Minimum withdrawal amount is $20.00.' });
        return;
      }

      if (!['MTN_MOMO', 'AIRTEL_MONEY', 'BANK_TRANSFER'].includes(method)) {
        res.status(400).json({ success: false, error: 'Invalid withdrawal method selected.' });
        return;
      }

      if (!destination_details) {
        res.status(400).json({ success: false, error: 'Destination payout details are required.' });
        return;
      }

      // 1. Check KYC verification
      const kyc = db.get<any>('SELECT status FROM kyc_records WHERE user_id = ?', [userId]);
      if (!kyc || kyc.status !== 'VERIFIED') {
        res.status(403).json({
          success: false,
          error: 'Identity verification required. Complete KYC before requesting withdrawals.'
        });
        return;
      }

      // 2. Check 2FA if user has it enabled
      const user = db.get<any>('SELECT two_factor_enabled FROM users WHERE id = ?', [userId]);
      if (user?.two_factor_enabled && !twoFactorCode) {
        res.status(400).json({
          success: false,
          requireTwoFactor: true,
          error: 'Two-factor authentication code is required to authorize withdrawals.'
        });
        return;
      }

      // 3. Verify legitimate ledger available balance
      const balances = ledgerService.getUserBalancesFromLedger(userId);
      const feePct = config.FEES.withdrawalFeePct / 100;
      const fee = Math.max(config.FEES.minWithdrawalFeeUSD, parseFloat((numAmount * feePct).toFixed(2)));
      const totalDeduction = numAmount; // User requests amount, fee deducted or added based on policy
      const netAmount = numAmount - fee;

      if (balances.availableBalance < totalDeduction) {
        res.status(400).json({
          success: false,
          error: `Insufficient available balance. Available: $${balances.availableBalance.toFixed(2)}, Requested: $${totalDeduction.toFixed(2)}.`
        });
        return;
      }

      const reference = `CPH-WDL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const withdrawalId = uuidv4();
      const now = new Date().toISOString();

      db.transaction(() => {
        // Find user ledger available account and platform escrow
        const userAvailAcc = db.get<any>(
          `SELECT id FROM ledger_accounts WHERE user_id = ? AND account_type = 'USER_AVAILABLE'`,
          [userId]
        );

        // Move funds from user available balance to escrow withdrawal ledger account
        ledgerService.recordEntry({
          transactionRef: reference,
          entryType: 'WITHDRAWAL',
          amount: totalDeduction,
          currency: 'USD',
          debitAccountId: userAvailAcc.id,
          creditAccountId: 'sys-escrow',
          userId,
          description: `Withdrawal request placed via ${method}. Funds reserved in escrow pending compliance approval.`,
          metadata: { withdrawalId, method, netAmount, fee }
        });

        // Insert withdrawal record
        db.run(
          `INSERT INTO withdrawals (
            id, reference, user_id, amount, fee, net_amount, currency,
            method, destination_details, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, ?, 'UNDER_REVIEW', ?, ?)`,
          [
            withdrawalId,
            reference,
            userId,
            numAmount,
            fee,
            netAmount,
            method,
            JSON.stringify(destination_details),
            now,
            now
          ]
        );

        // Notify user
        db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, link, created_at)
           VALUES (?, ?, 'Withdrawal Request Submitted', ?, 'INFO', '/withdrawals', ?)`,
          [
            uuidv4(),
            userId,
            `Your withdrawal request for $${numAmount.toFixed(2)} (Net: $${netAmount.toFixed(2)}) is UNDER_REVIEW by compliance & finance officers.`,
            now
          ]
        );
      });

      res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted successfully and queued for compliance review.',
        withdrawal: {
          id: withdrawalId,
          reference,
          amount: numAmount,
          fee,
          netAmount,
          method,
          status: 'UNDER_REVIEW'
        }
      });
    } catch (err: any) {
      console.error('Withdrawal request error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to process withdrawal request.' });
    }
  },

  /**
   * Get user's withdrawals
   */
  async getWithdrawals(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const withdrawals = db.query(
        'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
        [userId]
      );
      res.status(200).json({ success: true, withdrawals });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve withdrawals.' });
    }
  },

  /**
   * Finance officer reviews & approves or rejects withdrawal
   */
  async reviewWithdrawal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { decision, reason } = req.body; // APPROVED or REJECTED
      const reviewer = req.user!;

      if (!['APPROVED', 'REJECTED'].includes(decision)) {
        res.status(400).json({ success: false, error: 'Decision must be either APPROVED or REJECTED.' });
        return;
      }

      const withdrawal = db.get<any>('SELECT * FROM withdrawals WHERE id = ?', [id]);
      if (!withdrawal) {
        res.status(404).json({ success: false, error: 'Withdrawal record not found.' });
        return;
      }

      if (withdrawal.status !== 'REQUESTED' && withdrawal.status !== 'UNDER_REVIEW') {
        res.status(400).json({ success: false, error: `Withdrawal cannot be reviewed in status ${withdrawal.status}.` });
        return;
      }

      const now = new Date().toISOString();

      db.transaction(() => {
        if (decision === 'APPROVED') {
          // Identify cash payout account
          let cashAccount = 'sys-cash-bank';
          if (withdrawal.method === 'MTN_MOMO') cashAccount = 'sys-cash-mtn';
          else if (withdrawal.method === 'AIRTEL_MONEY') cashAccount = 'sys-cash-airtel';

          // Move funds from escrow to cash account (or fee account for the fee portion)
          ledgerService.recordEntry({
            transactionRef: `${withdrawal.reference}-DISBURSE`,
            entryType: 'WITHDRAWAL',
            amount: withdrawal.net_amount,
            currency: withdrawal.currency,
            debitAccountId: 'sys-escrow',
            creditAccountId: cashAccount,
            userId: withdrawal.user_id,
            description: `Withdrawal payout disbursed to user via ${withdrawal.method}.`
          });

          if (withdrawal.fee > 0) {
            ledgerService.recordEntry({
              transactionRef: `${withdrawal.reference}-FEE`,
              entryType: 'FEE',
              amount: withdrawal.fee,
              currency: withdrawal.currency,
              debitAccountId: 'sys-escrow',
              creditAccountId: 'sys-fees',
              userId: withdrawal.user_id,
              description: `Withdrawal processing network fee.`
            });
          }

          db.run(
            `UPDATE withdrawals
             SET status = 'COMPLETED', reviewed_by = ?, reviewed_at = ?, completed_at = ?, updated_at = ?
             WHERE id = ?`,
            [reviewer.id, now, now, now, id]
          );

          // User notification
          db.run(
            `INSERT INTO notifications (id, user_id, title, message, type, link, created_at)
             VALUES (?, ?, 'Withdrawal Approved & Disbursed', ?, 'SUCCESS', '/withdrawals', ?)`,
            [
              uuidv4(),
              withdrawal.user_id,
              `Your withdrawal of $${withdrawal.net_amount.toFixed(2)} (${withdrawal.method}) has been approved and sent to your destination account.`,
              now
            ]
          );
        } else {
          // REJECTED: Return reserved funds from escrow back to user available ledger account
          const userAvailAcc = db.get<any>(
            `SELECT id FROM ledger_accounts WHERE user_id = ? AND account_type = 'USER_AVAILABLE'`,
            [withdrawal.user_id]
          );

          ledgerService.recordEntry({
            transactionRef: `${withdrawal.reference}-REVERSAL`,
            entryType: 'REVERSAL',
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            debitAccountId: 'sys-escrow',
            creditAccountId: userAvailAcc.id,
            userId: withdrawal.user_id,
            description: `Withdrawal rejected by finance: ${reason || 'Compliance criteria'}. Funds restored to available balance.`
          });

          db.run(
            `UPDATE withdrawals
             SET status = 'REJECTED', rejection_reason = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
             WHERE id = ?`,
            [reason || 'Compliance review hold', reviewer.id, now, now, id]
          );

          // User notification
          db.run(
            `INSERT INTO notifications (id, user_id, title, message, type, link, created_at)
             VALUES (?, ?, 'Withdrawal Rejected', ?, 'WARNING', '/withdrawals', ?)`,
            [
              uuidv4(),
              withdrawal.user_id,
              `Your withdrawal request was rejected (${reason || 'Verification criteria not met'}). The reserved funds have been refunded to your available balance.`,
              now
            ]
          );
        }

        // Log audit action
        logAuditAction(
          reviewer,
          `WITHDRAWAL_${decision}`,
          'WITHDRAWAL',
          id,
          { status: withdrawal.status },
          { status: decision === 'APPROVED' ? 'COMPLETED' : 'REJECTED', reason },
          `Withdrawal decision by ${reviewer.email}`
        );
      });

      res.status(200).json({ success: true, message: `Withdrawal ${decision === 'APPROVED' ? 'approved and completed' : 'rejected and funds returned'}.` });
    } catch (err: any) {
      console.error('Review withdrawal error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to review withdrawal.' });
    }
  }
};
