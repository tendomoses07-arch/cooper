import { Response } from 'express';
import { db } from '../../database/db';
import { AuthRequest } from '../../middleware/auth';

export const referralController = {
  /**
   * Get Referral Dashboard data for the user
   */
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = db.get<any>('SELECT referral_code FROM users WHERE id = ?', [userId]);

      const referralCode = user?.referral_code || 'CPH-REF';
      const referralLink = `https://coopercomplexhub.com/register?ref=${referralCode}`;

      // Query referrals list
      const referrals = db.query(
        `SELECT r.id, r.status, r.created_at,
                u.first_name, u.country, u.created_at as registered_at,
                k.status as kyc_status
         FROM referrals r
         JOIN users u ON r.referred_user_id = u.id
         LEFT JOIN kyc_records k ON k.user_id = u.id
         WHERE r.referrer_id = ?
         ORDER BY r.created_at DESC`,
        [userId]
      );

      // Rewards
      const rewards = db.query(
        `SELECT * FROM referral_rewards WHERE referrer_id = ? ORDER BY created_at DESC`,
        [userId]
      );

      const totalReferrals = referrals.length;
      const verifiedReferrals = referrals.filter(r => r.kyc_status === 'VERIFIED').length;
      const pendingReferrals = totalReferrals - verifiedReferrals;

      const eligibleRewards = rewards
        .filter(r => r.status === 'ELIGIBLE')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      const paidRewards = rewards
        .filter(r => r.status === 'PAID')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      res.status(200).json({
        success: true,
        referral: {
          referralCode,
          referralLink,
          totalReferrals,
          verifiedReferrals,
          pendingReferrals,
          eligibleRewards: parseFloat(eligibleRewards.toFixed(2)),
          paidRewards: parseFloat(paidRewards.toFixed(2)),
          referralsList: referrals.map(r => ({
            id: r.id,
            name: `${r.first_name} (${r.country})`,
            status: r.status,
            kycStatus: r.kyc_status || 'PENDING',
            date: r.created_at
          })),
          rewardsList: rewards,
          complianceNotice: 'COOPER Complex Hub referral rewards operate as a single-tier transparent marketing program. Payouts are not derived from member deposits and no multi-level tree exists.'
        }
      });
    } catch (err: any) {
      console.error('Referral dashboard error:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve referral data.' });
    }
  }
};
