import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { AuthRequest } from '../../middleware/auth';

export const supportController = {
  async createTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { category, subject, description, priority } = req.body;

      if (!category || !subject || !description) {
        res.status(400).json({ success: false, error: 'Category, subject, and description are required.' });
        return;
      }

      const ticketId = uuidv4();
      const ticketNum = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();

      db.transaction(() => {
        db.run(
          `INSERT INTO support_tickets (id, ticket_number, user_id, category, subject, description, priority, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)`,
          [ticketId, ticketNum, userId, category, subject, description, priority || 'NORMAL', now, now]
        );

        db.run(
          `INSERT INTO support_messages (id, ticket_id, sender_id, sender_role, message, created_at)
           VALUES (?, ?, ?, 'INVESTOR', ?, ?)`,
          [uuidv4(), ticketId, userId, description, now]
        );
      });

      res.status(201).json({
        success: true,
        message: 'Support ticket submitted successfully.',
        ticket: {
          id: ticketId,
          ticket_number: ticketNum,
          category,
          subject,
          status: 'OPEN'
        }
      });
    } catch (err: any) {
      console.error('Create ticket error:', err);
      res.status(500).json({ success: false, error: 'Failed to create support ticket.' });
    }
  },

  async getTickets(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;

      let sql = 'SELECT * FROM support_tickets';
      const params: any[] = [];

      if (role === 'INVESTOR') {
        sql += ' WHERE user_id = ?';
        params.push(userId);
      }
      sql += ' ORDER BY created_at DESC';

      const tickets = db.query(sql, params);
      res.status(200).json({ success: true, tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch tickets.' });
    }
  },

  async getTicketDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = db.get<any>('SELECT * FROM support_tickets WHERE id = ?', [id]);
      if (!ticket) {
        res.status(404).json({ success: false, error: 'Ticket not found.' });
        return;
      }

      if (req.user!.role === 'INVESTOR' && ticket.user_id !== req.user!.id) {
        res.status(403).json({ success: false, error: 'Unauthorized.' });
        return;
      }

      const messages = db.query(
        `SELECT m.*, u.first_name, u.last_name
         FROM support_messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.ticket_id = ?
         ORDER BY m.created_at ASC`,
        [id]
      );

      res.status(200).json({ success: true, ticket, messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch ticket messages.' });
    }
  },

  async addMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const sender = req.user!;

      if (!message || !message.trim()) {
        res.status(400).json({ success: false, error: 'Message cannot be empty.' });
        return;
      }

      const ticket = db.get<any>('SELECT * FROM support_tickets WHERE id = ?', [id]);
      if (!ticket) {
        res.status(404).json({ success: false, error: 'Ticket not found.' });
        return;
      }

      const msgId = uuidv4();
      const now = new Date().toISOString();

      db.transaction(() => {
        db.run(
          `INSERT INTO support_messages (id, ticket_id, sender_id, sender_role, message, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [msgId, id, sender.id, sender.role, message.trim(), now]
        );

        db.run(
          `UPDATE support_tickets SET updated_at = ?, status = ? WHERE id = ?`,
          [now, sender.role === 'INVESTOR' ? 'OPEN' : 'IN_PROGRESS', id]
        );
      });

      res.status(201).json({ success: true, message: 'Message sent.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to post message.' });
    }
  }
};
