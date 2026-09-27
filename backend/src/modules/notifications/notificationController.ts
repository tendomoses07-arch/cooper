import { Response } from 'express';
import { db } from '../../database/db';
import { AuthRequest } from '../../middleware/auth';

export const notificationController = {
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const notifications = db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [userId]
      );
      const unreadCount = db.get<any>(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      )?.count || 0;

      res.status(200).json({
        success: true,
        unreadCount,
        notifications: notifications.map(n => ({
          ...n,
          is_read: Boolean(n.is_read)
        }))
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve notifications.' });
    }
  },

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (id === 'all') {
        db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
      } else {
        db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
      }

      res.status(200).json({ success: true, message: 'Notification marked as read.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to update notification.' });
    }
  }
};
