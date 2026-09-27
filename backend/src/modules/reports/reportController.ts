import { Response } from 'express';
import { db } from '../../database/db';
import { AuthRequest } from '../../middleware/auth';

function convertToCSV(rows: any[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') val = JSON.stringify(val);
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    });
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

export const reportController = {
  async exportReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params; // users, deposits, withdrawals, ledger, audit
      let rows: any[] = [];
      let filename = `cooper_complex_hub_${type}_${Date.now()}.csv`;

      switch (type) {
        case 'users':
          rows = db.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.country,
                   u.role, u.is_active, u.is_suspended, u.referral_code, u.created_at,
                   k.status as kyc_status,
                   ia.available_balance, ia.invested_balance
            FROM users u
            LEFT JOIN kyc_records k ON u.id = k.user_id
            LEFT JOIN investment_accounts ia ON u.id = ia.user_id
            ORDER BY u.created_at DESC
          `);
          break;

        case 'deposits':
          rows = db.query(`
            SELECT d.reference, d.amount, d.currency, d.payment_method, d.provider,
                   d.status, d.reconciliation_status, d.phone_number, d.confirmed_at, d.created_at,
                   u.email as user_email
            FROM deposits d
            JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
          `);
          break;

        case 'withdrawals':
          rows = db.query(`
            SELECT w.reference, w.amount, w.fee, w.net_amount, w.currency, w.method,
                   w.status, w.reviewed_at, w.completed_at, w.created_at,
                   u.email as user_email
            FROM withdrawals w
            JOIN users u ON w.user_id = u.id
            ORDER BY w.created_at DESC
          `);
          break;

        case 'ledger':
          rows = db.query(`
            SELECT l.id, l.transaction_ref, l.entry_type, l.amount, l.currency,
                   l.debit_account_id, l.credit_account_id, l.description, l.status, l.created_at,
                   u.email as user_email
            FROM ledger_entries l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC LIMIT 500
          `);
          break;

        case 'audit':
          rows = db.query(`
            SELECT actor_email, actor_role, action, resource_type, resource_id,
                   ip_address, reason, created_at
            FROM audit_logs
            ORDER BY created_at DESC LIMIT 500
          `);
          break;

        default:
          res.status(400).json({ success: false, error: 'Invalid report type specified.' });
          return;
      }

      const csvData = convertToCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
    } catch (err: any) {
      console.error('Report export error:', err);
      res.status(500).json({ success: false, error: 'Failed to generate report export.' });
    }
  }
};
