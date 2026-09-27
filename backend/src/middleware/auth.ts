import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to access this resource.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string; email: string; role: string };
    
    const user = db.get<any>(
      'SELECT id, email, role, first_name, last_name, is_active, is_suspended, suspension_reason FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      res.status(401).json({ success: false, error: 'User account no longer exists.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ success: false, error: 'Account is deactivated. Contact compliance support.' });
      return;
    }

    if (user.is_suspended) {
      res.status(403).json({
        success: false,
        error: `Account suspended: ${user.suspension_reason || 'Compliance security hold.'}`
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Session expired or invalid token. Please sign in again.' });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied. You do not have the required administrative role for this operation.'
      });
      return;
    }

    next();
  };
}

export function logAuditAction(
  actor: { id?: string; email?: string; role?: string },
  action: string,
  resourceType: string,
  resourceId?: string,
  previousValue?: any,
  newValue?: any,
  reason?: string,
  ipAddress?: string
) {
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    let validActorId: string | null = null;
    if (actor.id) {
      const userExists = db.get('SELECT id FROM users WHERE id = ?', [actor.id]);
      if (userExists) validActorId = actor.id;
    }
    db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_email, actor_role, action, resource_type, resource_id, previous_value, new_value, ip_address, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        validActorId,
        actor.email || 'SYSTEM',
        actor.role || 'SYSTEM',
        action,
        resourceType,
        resourceId || null,
        previousValue ? JSON.stringify(previousValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress || '127.0.0.1',
        reason || null,
        now
      ]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An internal financial service error occurred. Please try again shortly or contact support.'
  });
}
