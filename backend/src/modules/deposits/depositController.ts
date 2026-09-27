import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { config } from '../../config';
import { paymentService } from '../payments/paymentProviders';
import { AuthRequest } from '../../middleware/auth';

export const depositController = {
  /**
   * Initiate a deposit
   */
  async initiateDeposit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount, currency, payment_method, phone_number, payment_details } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 10) {
        res.status(400).json({ success: false, error: 'Minimum deposit amount is $10.00.' });
        return;
      }

      if (!['MTN_MOMO', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'VISA', 'MASTERCARD'].includes(payment_method)) {
        res.status(400).json({ success: false, error: 'Invalid payment method selected.' });
        return;
      }

      // Check KYC verification status
      const kyc = db.get<any>('SELECT status FROM kyc_records WHERE user_id = ?', [userId]);
      if (!kyc || kyc.status !== 'VERIFIED') {
        res.status(403).json({
          success: false,
          error: 'Identity verification (KYC) required. Please complete verification before funding your account.'
        });
        return;
      }

      const reference = paymentService.generateReference();
      const depositId = uuidv4();
      const now = new Date().toISOString();
      const curr = currency || 'USD';

      // Get provider implementation
      const provider = paymentService.getProvider(payment_method);
      const initResult = await provider.initiateDeposit({
        depositId,
        reference,
        amount: numAmount,
        currency: curr,
        userId,
        phoneNumber: phone_number,
        paymentDetails: payment_details
      });

      // Save deposit record in PENDING / PROCESSING state
      db.run(
        `INSERT INTO deposits (
          id, reference, user_id, amount, currency, payment_method, provider,
          status, reconciliation_status, phone_number, payment_details, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNRECONCILED', ?, ?, ?, ?)`,
        [
          depositId,
          reference,
          userId,
          numAmount,
          curr,
          payment_method,
          provider.name,
          initResult.status,
          phone_number || null,
          JSON.stringify(initResult.metadata),
          now,
          now
        ]
      );

      res.status(200).json({
        success: true,
        depositId,
        reference,
        amount: numAmount,
        currency: curr,
        payment_method,
        status: initResult.status,
        instructions: initResult.instructions,
        metadata: initResult.metadata,
        demoMode: config.APP_MODE === 'DEMO'
      });
    } catch (err: any) {
      console.error('Initiate deposit error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to initiate deposit.' });
    }
  },

  /**
   * DEMO MODE ONLY: Simulated Server-Side Verification Endpoint
   * Simulates an external gateway/provider confirming payment,
   * triggering backend ledger posting.
   */
  async simulateConfirm(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (config.APP_MODE !== 'DEMO' && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'FINANCE_OFFICER') {
        res.status(403).json({
          success: false,
          error: 'Simulated confirmations are strictly restricted to DEMO mode.'
        });
        return;
      }

      const { reference } = req.body;
      if (!reference) {
        res.status(400).json({ success: false, error: 'Deposit reference is required.' });
        return;
      }

      const deposit = db.get<any>('SELECT * FROM deposits WHERE reference = ?', [reference]);
      if (!deposit) {
        res.status(404).json({ success: false, error: 'Deposit reference not found.' });
        return;
      }

      // Check user authorization
      if (req.user?.role === 'INVESTOR' && deposit.user_id !== req.user.id) {
        res.status(403).json({ success: false, error: 'Unauthorized transaction.' });
        return;
      }

      // Call payment provider verification
      const provider = paymentService.getProvider(deposit.payment_method);
      const verifyResult = await provider.verifyPayment(reference, deposit.provider_tx_id);

      if (!verifyResult.confirmed) {
        res.status(400).json({
          success: false,
          error: verifyResult.reason || 'Payment could not be verified by payment gateway.'
        });
        return;
      }

      // Confirm deposit and execute double-entry ledger transactions
      const confirmation = paymentService.confirmDeposit(
        reference,
        verifyResult.providerTxId,
        `Verified in DEMO environment simulation`
      );

      res.status(200).json({
        success: true,
        message: 'Deposit confirmed and financial ledger credited successfully.',
        deposit: confirmation
      });
    } catch (err: any) {
      console.error('Simulate confirm error:', err);
      res.status(500).json({ success: false, error: err.message || 'Deposit confirmation failed.' });
    }
  },

  /**
   * Get user's deposit transactions
   */
  async getDeposits(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const deposits = db.query(
        'SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
        [userId]
      );
      res.status(200).json({ success: true, deposits });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve deposits.' });
    }
  },

  /**
   * Universal Webhook handler for asynchronous provider callbacks (MTN, Airtel, Card, Bank)
   */
  async handleWebhook(req: any, res: Response): Promise<void> {
    try {
      const providerName = req.params.provider?.toUpperCase();
      const signature = req.headers['x-provider-signature'] as string;
      const payload = req.body;

      console.log(`[PAYMENT WEBHOOK] Received callback for ${providerName}:`, payload);

      let method = 'MTN_MOMO';
      if (providerName.includes('AIRTEL')) method = 'AIRTEL_MONEY';
      else if (providerName.includes('CARD') || providerName.includes('VISA')) method = 'VISA';
      else if (providerName.includes('BANK')) method = 'BANK_TRANSFER';

      const provider = paymentService.getProvider(method);
      const validation = await provider.processWebhook(payload, signature);

      if (!validation.isValid) {
        res.status(400).json({ success: false, error: 'Invalid webhook signature or payload.' });
        return;
      }

      if (validation.status === 'CONFIRMED') {
        paymentService.confirmDeposit(validation.reference, validation.providerTxId, `Confirmed via ${providerName} webhook`);
      }

      res.status(200).json({ success: true, message: 'Webhook processed successfully.' });
    } catch (err: any) {
      console.error('[WEBHOOK ERROR]', err);
      res.status(500).json({ success: false, error: 'Webhook processing error.' });
    }
  }
};
