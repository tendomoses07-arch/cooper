import dotenv from 'dotenv';
dotenv.config();

export interface LiveChecklistItem {
  id: string;
  title: string;
  description: string;
  checked: boolean;
}

export const config = {
  APP_NAME: 'COOPER Complex Hub',
  APP_MODE: (process.env.APP_MODE || 'DEMO') as 'DEMO' | 'LIVE',
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'cooper-complex-hub-jwt-secure-secret-2026-key',
  JWT_EXPIRES_IN: '24h',
  DEMO_BANNER_TEXT: 'DEMO MODE — No real funds are being invested. Simulated fintech environment.',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  DB_PATH: process.env.DB_PATH || 'cooper_complex_hub.db',
  
  // Default Risk Engine Configuration
  DEFAULT_RISK_LIMITS: {
    maxPositionSizeUSD: 50000,
    maxPortfolioExposurePct: 75,
    maxDailyLossPct: 3.5,
    maxDrawdownPct: 10.0,
    maxOpenPositions: 15,
    stopLossPct: 2.0,
    tradingHalted: false, // Emergency kill switch
  },

  // Fee Structure
  FEES: {
    depositFeePct: 0.0, // Free deposits
    withdrawalFeePct: 0.5, // 0.5% network & processing fee
    minWithdrawalFeeUSD: 2.0,
    strategyManagementFeePct: 1.5, // Annualized
    strategyPerformanceFeePct: 10.0, // High-water mark
    referralCommissionPct: 5.0, // 5% of net platform fee, single-tier transparent marketing commission
  },

  // Mandatory Production Safety Checklist (Prompt #56)
  LIVE_MODE_CHECKLIST: [
    { id: 'legal', title: 'Required legal structure confirmed', description: 'Entity formation, legal counsel review and terms validated.', checked: false },
    { id: 'regulatory', title: 'Required regulatory approvals confirmed', description: 'Licensing or exemptions with financial authorities in jurisdictions.', checked: false },
    { id: 'payment', title: 'Payment provider configured', description: 'Live credentials and contracts with MTN, Airtel, and Card processors.', checked: false },
    { id: 'banking', title: 'Bank arrangement configured', description: 'Designated corporate bank accounts and settlement agreements.', checked: false },
    { id: 'custody', title: 'Custody arrangement configured', description: 'Qualified institutional crypto & fiat custodians connected.', checked: false },
    { id: 'investment_manager', title: 'Investment manager configured', description: 'Licensed portfolio manager agreements executed.', checked: false },
    { id: 'forex_provider', title: 'Forex provider configured', description: 'Approved, regulated institutional forex prime broker connected.', checked: false },
    { id: 'crypto_provider', title: 'Crypto provider configured', description: 'Institutional exchange accounts with IP whitelisting & no withdrawal keys.', checked: false },
    { id: 'kyc_aml', title: 'KYC system configured', description: 'Automated identity verification, PEP/sanctions screening integration.', checked: false },
    { id: 'compliance_proc', title: 'AML/compliance procedures configured', description: 'Internal compliance officer protocols and suspicious activity reporting.', checked: false },
    { id: 'security_audit', title: 'Security audit completed', description: 'Third-party penetration testing and smart contract/API verification.', checked: false },
    { id: 'backups_monitoring', title: 'Database backups & monitoring configured', description: 'Point-in-time recovery, off-site encrypted backups, and alerting.', checked: false },
  ] as LiveChecklistItem[]
};
