import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase } from './database/db';
import { seedDatabase } from './database/seed';
import { authenticate, authorize, errorHandler } from './middleware/auth';

// Import Controllers
import { authController } from './modules/auth/authController';
import { kycController } from './modules/kyc/kycController';
import { depositController } from './modules/deposits/depositController';
import { withdrawalController } from './modules/withdrawals/withdrawalController';
import { investmentController } from './modules/investments/investmentController';
import { referralController } from './modules/referrals/referralController';
import { notificationController } from './modules/notifications/notificationController';
import { supportController } from './modules/support/supportController';
import { adminController } from './modules/admin/adminController';
import { reportController } from './modules/reports/reportController';
import { db } from './database/db';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Provider-Signature']
}));
app.use(express.json());

// Public System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    platform: config.APP_NAME,
    mode: config.APP_MODE,
    time: new Date().toISOString()
  });
});

app.get('/api/config/info', (req, res) => {
  res.json({
    appName: config.APP_NAME,
    appMode: config.APP_MODE,
    bannerText: config.DEMO_BANNER_TEXT,
    timestamp: new Date().toISOString()
  });
});

// --- Auth Routes ---
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authenticate, authController.getMe);
app.post('/api/auth/2fa/toggle', authenticate, authController.toggle2FA);

// --- Public Strategy Routes ---
app.get('/api/strategies', investmentController.getStrategies);
app.get('/api/strategies/:id', investmentController.getStrategyById);

// --- KYC Routes ---
app.post('/api/kyc/submit', authenticate, kycController.submitKYC);
app.get('/api/kyc/status', authenticate, kycController.getStatus);

// --- Deposits ---
app.post('/api/deposits/initiate', authenticate, depositController.initiateDeposit);
app.post('/api/deposits/simulate-confirm', authenticate, depositController.simulateConfirm);
app.get('/api/deposits', authenticate, depositController.getDeposits);

// --- Payment Webhooks ---
app.post('/api/payments/webhook/:provider', depositController.handleWebhook);

// --- Withdrawals ---
app.post('/api/withdrawals/request', authenticate, withdrawalController.requestWithdrawal);
app.get('/api/withdrawals', authenticate, withdrawalController.getWithdrawals);

// --- Investments & Portfolio ---
app.post('/api/investments/allocate', authenticate, investmentController.allocate);
app.post('/api/investments/redeem', authenticate, investmentController.redeem);
app.get('/api/investments/portfolio', authenticate, investmentController.getPortfolio);

// --- Referrals ---
app.get('/api/referrals/dashboard', authenticate, referralController.getDashboard);

// --- Notifications ---
app.get('/api/notifications', authenticate, notificationController.getNotifications);
app.patch('/api/notifications/:id/read', authenticate, notificationController.markAsRead);

// --- Support Tickets ---
app.post('/api/support/tickets', authenticate, supportController.createTicket);
app.get('/api/support/tickets', authenticate, supportController.getTickets);
app.get('/api/support/tickets/:id', authenticate, supportController.getTicketDetails);
app.post('/api/support/tickets/:id/messages', authenticate, supportController.addMessage);

// --- Admin / Staff Portal Routes ---
// Super Admin, Compliance, Finance, Trading, Support
const adminAuth = [authenticate, authorize('SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'FINANCE_OFFICER', 'TRADING_MANAGER', 'SUPPORT_AGENT')];

app.get('/api/admin/stats', adminAuth, adminController.getDashboardStats);
app.get('/api/admin/users', adminAuth, adminController.listUsers);
app.post('/api/admin/users/:id/suspend', adminAuth, adminController.toggleSuspendUser);

// KYC Administration
app.get('/api/admin/kyc', [authenticate, authorize('SUPER_ADMIN', 'COMPLIANCE_OFFICER')], kycController.listKYC);
app.post('/api/admin/kyc/:id/review', [authenticate, authorize('SUPER_ADMIN', 'COMPLIANCE_OFFICER')], kycController.reviewKYC);

// Finance Administration
app.get('/api/admin/withdrawals', [authenticate, authorize('SUPER_ADMIN', 'FINANCE_OFFICER')], (req: express.Request, res: express.Response) => {
  const withdrawals = db.query(`
    SELECT w.*, u.email as user_email, u.first_name, u.last_name
    FROM withdrawals w
    JOIN users u ON w.user_id = u.id
    ORDER BY w.created_at DESC
  `);
  res.json({ success: true, withdrawals });
});
app.post('/api/admin/withdrawals/:id/review', [authenticate, authorize('SUPER_ADMIN', 'FINANCE_OFFICER')], withdrawalController.reviewWithdrawal);

app.get('/api/admin/deposits', [authenticate, authorize('SUPER_ADMIN', 'FINANCE_OFFICER')], (req: express.Request, res: express.Response) => {
  const deposits = db.query(`
    SELECT d.*, u.email as user_email, u.first_name, u.last_name
    FROM deposits d
    JOIN users u ON d.user_id = u.id
    ORDER BY d.created_at DESC
  `);
  res.json({ success: true, deposits });
});

// Trading & Risk Management
app.get('/api/admin/risk-limits', [authenticate, authorize('SUPER_ADMIN', 'TRADING_MANAGER')], adminController.getRiskLimits);
app.post('/api/admin/risk-limits', [authenticate, authorize('SUPER_ADMIN', 'TRADING_MANAGER')], adminController.updateRiskLimits);
app.post('/api/admin/trading/halt', [authenticate, authorize('SUPER_ADMIN', 'TRADING_MANAGER')], adminController.toggleTradingHalt);
app.post('/api/admin/trading/execute', [authenticate, authorize('SUPER_ADMIN', 'TRADING_MANAGER')], adminController.executeOrder);

// Audit Logs & Safety Checklist
app.get('/api/admin/audit-logs', adminAuth, adminController.getAuditLogs);
app.get('/api/admin/live-checklist', adminAuth, adminController.getLiveChecklist);
app.post('/api/admin/live-checklist', [authenticate, authorize('SUPER_ADMIN', 'COMPLIANCE_OFFICER')], adminController.updateLiveChecklistItem);

// Reports Export
app.get('/api/admin/reports/:type/csv', adminAuth, reportController.exportReport);

// Global Error Handler
app.use(errorHandler);

// Initialize DB and Seed
initDatabase();
seedDatabase();

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => {
    console.log(`=======================================================`);
    console.log(`  ${config.APP_NAME} - Backend Server Started`);
    console.log(`  Mode: ${config.APP_MODE}`);
    console.log(`  Port: ${config.PORT}`);
    console.log(`  URL:  http://localhost:${config.PORT}`);
    console.log(`=======================================================`);
  });
}

export default app;
