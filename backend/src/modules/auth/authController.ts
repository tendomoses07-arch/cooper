import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { config } from '../../config';
import { ledgerService } from '../ledger/ledgerService';
import { AuthRequest, logAuditAction } from '../../middleware/auth';

export const authController = {
  /**
   * User Registration
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const {
        first_name,
        last_name,
        email,
        phone,
        country,
        password,
        confirm_password,
        referral_code,
        accept_terms,
        accept_risk
      } = req.body;

      // Validation
      if (!first_name || !last_name || !email || !phone || !country || !password) {
        res.status(400).json({ success: false, error: 'All registration fields are required.' });
        return;
      }

      if (password !== confirm_password) {
        res.status(400).json({ success: false, error: 'Passwords do not match.' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
        return;
      }

      if (!accept_terms || !accept_risk) {
        res.status(400).json({
          success: false,
          error: 'You must accept the Terms of Service, Privacy Policy, and Investment Risk Disclosure.'
        });
        return;
      }

      // Check duplicate email or phone
      const existingEmail = db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (existingEmail) {
        res.status(400).json({ success: false, error: 'An account with this email address already exists.' });
        return;
      }

      const existingPhone = db.get('SELECT id FROM users WHERE phone = ?', [phone.trim()]);
      if (existingPhone) {
        res.status(400).json({ success: false, error: 'An account with this phone number already exists.' });
        return;
      }

      // Validate referral code if provided
      let referrerId: string | null = null;
      if (referral_code && referral_code.trim()) {
        const referrer = db.get<any>('SELECT id FROM users WHERE referral_code = ?', [referral_code.trim().toUpperCase()]);
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      const userId = uuidv4();
      const userRefCode = `CPH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const now = new Date().toISOString();

      db.transaction(() => {
        // Insert User
        db.run(
          `INSERT INTO users (
            id, first_name, last_name, email, phone, country, password_hash,
            referral_code, referred_by_code, role, is_active, email_verified,
            phone_verified, two_factor_enabled, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'INVESTOR', 1, 1, 1, 0, ?, ?)`,
          [
            userId,
            first_name.trim(),
            last_name.trim(),
            email.toLowerCase().trim(),
            phone.trim(),
            country.trim(),
            passwordHash,
            userRefCode,
            referral_code ? referral_code.trim().toUpperCase() : null,
            now,
            now
          ]
        );

        // Insert Profile
        db.run(
          `INSERT INTO profiles (id, user_id, full_legal_name, country_of_residence, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), userId, `${first_name.trim()} ${last_name.trim()}`, country.trim(), now, now]
        );

        // Setup Ledger Accounts
        ledgerService.ensureUserLedgerAccounts(userId);

        // Record Referral record if referred
        if (referrerId) {
          db.run(
            `INSERT INTO referrals (id, referrer_id, referred_user_id, referral_code, status, created_at)
             VALUES (?, ?, ?, ?, 'REGISTERED', ?)`,
            [uuidv4(), referrerId, userId, referral_code.trim().toUpperCase(), now]
          );
        }

        // Welcome Notification
        db.run(
          `INSERT INTO notifications (id, user_id, title, message, type, link, created_at)
           VALUES (?, ?, 'Welcome to COOPER Complex Hub', 'Your account has been registered successfully. Complete KYC verification to unlock full financial capabilities.', 'INFO', '/kyc', ?)`,
          [uuidv4(), userId, now]
        );
      });

      const token = jwt.sign(
        { id: userId, email: email.toLowerCase().trim(), role: 'INVESTOR' },
        config.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        token,
        user: {
          id: userId,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          country: country.trim(),
          role: 'INVESTOR',
          referral_code: userRefCode,
          two_factor_enabled: false
        }
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ success: false, error: 'Registration failed due to a server error. Please try again.' });
    }
  },

  /**
   * User & Staff Login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { emailOrPhone, password, twoFactorCode } = req.body;

      if (!emailOrPhone || !password) {
        res.status(400).json({ success: false, error: 'Email/Phone and password are required.' });
        return;
      }

      const identifier = emailOrPhone.trim().toLowerCase();
      const user = db.get<any>(
        `SELECT id, first_name, last_name, email, phone, password_hash, role,
                is_active, is_suspended, suspension_reason, two_factor_enabled, referral_code
         FROM users
         WHERE lower(email) = ? OR phone = ?`,
        [identifier, identifier]
      );

      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid login credentials.' });
        return;
      }

      if (!user.is_active) {
        res.status(403).json({ success: false, error: 'This account has been deactivated.' });
        return;
      }

      if (user.is_suspended) {
        res.status(403).json({
          success: false,
          error: `Account suspended: ${user.suspension_reason || 'Compliance security hold.'}`
        });
        return;
      }

      const passwordValid = bcrypt.compareSync(password, user.password_hash);
      if (!passwordValid) {
        res.status(401).json({ success: false, error: 'Invalid login credentials.' });
        return;
      }

      // Check 2FA if enabled
      if (user.two_factor_enabled && !twoFactorCode) {
        res.status(200).json({
          success: true,
          requireTwoFactor: true,
          message: 'Two-factor authentication code required.'
        });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Audit login
      logAuditAction(
        { id: user.id, email: user.email, role: user.role },
        'USER_LOGIN',
        'AUTH',
        user.id,
        null,
        null,
        'Successful login',
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          referral_code: user.referral_code,
          two_factor_enabled: Boolean(user.two_factor_enabled)
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, error: 'Login failed due to a server error.' });
    }
  },

  /**
   * Get Current Authenticated User Profile & Financial Balances
   */
  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = db.get<any>(
        `SELECT id, first_name, last_name, email, phone, country, role,
                referral_code, two_factor_enabled, email_verified, phone_verified, created_at
         FROM users WHERE id = ?`,
        [userId]
      );

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const profile = db.get<any>('SELECT * FROM profiles WHERE user_id = ?', [userId]);
      const kyc = db.get<any>('SELECT status, reviewed_at, reviewer_notes FROM kyc_records WHERE user_id = ?', [userId]);
      const balances = ledgerService.getUserBalancesFromLedger(userId);

      res.status(200).json({
        success: true,
        user: {
          ...user,
          two_factor_enabled: Boolean(user.two_factor_enabled),
          email_verified: Boolean(user.email_verified),
          phone_verified: Boolean(user.phone_verified),
          kyc_status: kyc?.status || 'PENDING',
          profile: profile || null,
          balances
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
    }
  },

  /**
   * Toggle 2FA Simulation
   */
  async toggle2FA(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { enable } = req.body;

      db.run('UPDATE users SET two_factor_enabled = ? WHERE id = ?', [enable ? 1 : 0, userId]);
      res.status(200).json({
        success: true,
        two_factor_enabled: Boolean(enable),
        message: enable ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to update 2FA settings.' });
    }
  }
};
