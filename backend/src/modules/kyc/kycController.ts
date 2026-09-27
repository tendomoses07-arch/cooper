import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { AuthRequest, logAuditAction } from '../../middleware/auth';

export const kycController = {
  /**
   * User submits or updates KYC documents
   */
  async submitKYC(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        full_legal_name,
        date_of_birth,
        nationality,
        country_of_residence,
        id_type,
        id_number,
        address,
        occupation,
        source_of_funds,
        document_front_url,
        document_back_url,
        proof_of_address_url
      } = req.body;

      if (!full_legal_name || !date_of_birth || !nationality || !id_type || !id_number || !address || !occupation || !source_of_funds) {
        res.status(400).json({ success: false, error: 'Please fill in all required identity verification fields.' });
        return;
      }

      const now = new Date().toISOString();
      const existing = db.get<any>('SELECT id, status FROM kyc_records WHERE user_id = ?', [userId]);

      if (existing && existing.status === 'VERIFIED') {
        res.status(400).json({ success: false, error: 'Your KYC identity has already been verified.' });
        return;
      }

      if (existing) {
        db.run(
          `UPDATE kyc_records
           SET full_legal_name = ?, date_of_birth = ?, nationality = ?, country_of_residence = ?,
               id_type = ?, id_number = ?, address = ?, occupation = ?, source_of_funds = ?,
               document_front_url = COALESCE(?, document_front_url),
               document_back_url = COALESCE(?, document_back_url),
               proof_of_address_url = COALESCE(?, proof_of_address_url),
               status = 'UNDER_REVIEW', rejection_reason = NULL, updated_at = ?
           WHERE id = ?`,
          [
            full_legal_name, date_of_birth, nationality, country_of_residence || nationality,
            id_type, id_number, address, occupation, source_of_funds,
            document_front_url || null, document_back_url || null, proof_of_address_url || null,
            now, existing.id
          ]
        );
      } else {
        const kycId = uuidv4();
        db.run(
          `INSERT INTO kyc_records (
            id, user_id, full_legal_name, date_of_birth, nationality, country_of_residence,
            id_type, id_number, address, occupation, source_of_funds, status,
            document_front_url, document_back_url, proof_of_address_url, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', ?, ?, ?, ?, ?)`,
          [
            kycId, userId, full_legal_name, date_of_birth, nationality, country_of_residence || nationality,
            id_type, id_number, address, occupation, source_of_funds,
            document_front_url || null, document_back_url || null, proof_of_address_url || null,
            now, now
          ]
        );
      }

      // Sync user profile
      db.run(
        `UPDATE profiles
         SET full_legal_name = ?, date_of_birth = ?, nationality = ?, country_of_residence = ?,
             address = ?, occupation = ?, source_of_funds = ?, updated_at = ?
         WHERE user_id = ?`,
        [full_legal_name, date_of_birth, nationality, country_of_residence || nationality, address, occupation, source_of_funds, now, userId]
      );

      // Create notification
      db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, link, created_at)
         VALUES (?, ?, 'KYC Submitted for Review', 'Your identity documentation has been submitted to compliance officers. Status: UNDER_REVIEW.', 'INFO', '/kyc', ?)`,
        [uuidv4(), userId, now]
      );

      res.status(200).json({
        success: true,
        message: 'KYC documents submitted successfully. Our compliance team will review your application.',
        status: 'UNDER_REVIEW'
      });
    } catch (err: any) {
      console.error('KYC submission error:', err);
      res.status(500).json({ success: false, error: 'Failed to submit KYC documentation.' });
    }
  },

  /**
   * User checks their KYC status
   */
  async getStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const kyc = db.get<any>('SELECT * FROM kyc_records WHERE user_id = ?', [userId]);

      res.status(200).json({
        success: true,
        kyc: kyc || { status: 'PENDING' }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve KYC status.' });
    }
  },

  /**
   * Staff/Admin lists all KYC records
   */
  async listKYC(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      let sql = `
        SELECT k.*, u.email, u.phone, u.country
        FROM kyc_records k
        JOIN users u ON k.user_id = u.id
      `;
      const params: any[] = [];

      if (status && status !== 'ALL') {
        sql += ' WHERE k.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY k.created_at DESC';
      const records = db.query(sql, params);

      res.status(200).json({ success: true, records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch KYC records.' });
    }
  },

  /**
   * Compliance staff reviews KYC: approve, reject, or request more info
   */
  async reviewKYC(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { decision, notes, rejection_reason } = req.body;
      const reviewer = req.user!;

      if (!['VERIFIED', 'REJECTED', 'REQUIRES_MORE_INFORMATION'].includes(decision)) {
        res.status(400).json({ success: false, error: 'Invalid KYC decision. Must be VERIFIED, REJECTED, or REQUIRES_MORE_INFORMATION.' });
        return;
      }

      const kyc = db.get<any>('SELECT * FROM kyc_records WHERE id = ?', [id]);
      if (!kyc) {
        res.status(404).json({ success: false, error: 'KYC record not found.' });
        return;
      }

      const now = new Date().toISOString();

      db.transaction(() => {
        db.run(
          `UPDATE kyc_records
           SET status = ?, reviewer_notes = ?, rejection_reason = ?,
               reviewed_by = ?, reviewed_at = ?, updated_at = ?
           WHERE id = ?`,
          [decision, notes || null, rejection_reason || null, reviewer.id, now, now, id]
        );

        // Notify user
        let message = `Your identity verification decision: ${decision}.`;
        if (decision === 'VERIFIED') {
          message = 'Congratulations! Your identity has been verified. You can now access full deposit, investment, and withdrawal features.';
        } else if (decision === 'REJECTED') {
          message = `Your identity verification was rejected. Reason: ${rejection_reason || 'Compliance criteria not met'}.`;
        } else if (decision === 'REQUIRES_MORE_INFORMATION') {
          message = `Additional information required for your KYC: ${notes || 'Please provide clear documentation'}.`;
        }

        db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, link, created_at)
           VALUES (?, ?, 'Identity Verification Update', ?, ?, '/kyc', ?)`,
          [uuidv4(), kyc.user_id, message, decision === 'VERIFIED' ? 'SUCCESS' : 'WARNING', now]
        );

        // Audit Log
        logAuditAction(
          reviewer,
          `KYC_DECISION_${decision}`,
          'KYC_RECORD',
          id,
          { status: kyc.status },
          { status: decision, notes, rejection_reason },
          `Compliance officer decision by ${reviewer.email}`
        );
      });

      res.status(200).json({ success: true, message: `KYC record updated to ${decision}.` });
    } catch (err: any) {
      console.error('Review KYC error:', err);
      res.status(500).json({ success: false, error: 'Failed to update KYC decision.' });
    }
  }
};
