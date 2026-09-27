import React from 'react';
import { X, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

interface LegalModalProps {
  documentType: string | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ documentType, onClose }) => {
  if (!documentType) return null;

  const getContent = () => {
    switch (documentType) {
      case 'risk':
        return {
          title: 'Investment Risk Disclosure',
          subtitle: 'Mandatory statutory financial risk awareness disclosure',
          body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.7', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '16px', borderRadius: 'var(--radius-md)', color: '#fecdd3' }}>
                <strong>CRITICAL NOTICE:</strong> Investments involve risk. The value of an investment can rise or fall, and past performance does not guarantee future results.
              </div>
              <h4 style={{ color: 'var(--text-primary)' }}>1. Nature of the Platform</h4>
              <p>COOPER Complex Hub is a financial technology software platform engineered to provide verified users with technology to access and monitor structured cryptocurrency and foreign exchange investment strategies. COOPER Complex Hub does not guarantee profits, minimum yields, or capital preservation.</p>
              <h4 style={{ color: 'var(--text-primary)' }}>2. Volatility and Market Risks</h4>
              <p>Digital currency and foreign exchange markets are subject to rapid and unpredictable market swings driven by macroeconomic conditions, liquidity shifts, and regulatory changes. You acknowledge that you could sustain a partial or total loss of allocated capital.</p>
              <h4 style={{ color: 'var(--text-primary)' }}>3. No Fabricated Trading Activity</h4>
              <p>COOPER Complex Hub strictly prohibits the fabrication of trading returns, fake charts, or artificial balances. All metrics presented on the platform are derived from verified ledger accounting or real market transaction records.</p>
            </div>
          )
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          subtitle: 'General conditions governing the use of COOPER Complex Hub',
          body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.7', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              <h4 style={{ color: 'var(--text-primary)' }}>1. Acceptance of Terms</h4>
              <p>By registering for, accessing, or utilizing COOPER Complex Hub, you agree to comply with and be bound by these Terms of Service. If you do not agree, do not access the platform.</p>
              <h4 style={{ color: 'var(--text-primary)' }}>2. Eligibility and Identity Verification</h4>
              <p>Users must be at least 18 years of age and pass full Know-Your-Customer (KYC) identity verification and Anti-Money Laundering (AML) sanctions checks prior to executing financial deposits, allocations, or withdrawals.</p>
              <h4 style={{ color: 'var(--text-primary)' }}>3. Prohibited Schemes</h4>
              <p>COOPER Complex Hub is not and shall never operate as a Ponzi scheme, pyramid scheme, or recruitment-based payout engine. The platform strictly allocates capital to legitimate market strategies. Using deposits of new users to pay old users is strictly prohibited and architecturally prevented by our double-entry ledger.</p>
            </div>
          )
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          subtitle: 'How COOPER Complex Hub collects, protects, and handles personal data',
          body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.7', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              <h4 style={{ color: 'var(--text-primary)' }}>1. Data Collection</h4>
              <p>We collect identity details (full name, government ID numbers, date of birth, proof of address) required under applicable financial regulations for customer identification and anti-fraud monitoring.</p>
              <h4 style={{ color: 'var(--text-primary)' }}>2. Security of Sensitive Information</h4>
              <p>Passwords are hashed using salted cryptographic algorithms. Payment card information is handled via PCI-compliant tokenized gateways; COOPER Complex Hub never stores raw credit card numbers or CVVs on its servers.</p>
              <h4 style={{ color: 'var(--text-primary)' }}>3. Data Retention</h4>
              <p>Audit logs and financial ledger entries are retained in accordance with financial regulatory retention standards and cannot be altered or purged unilaterally.</p>
            </div>
          )
        };
      case 'referral':
        return {
          title: 'Referral Program Rules',
          subtitle: 'Single-tier transparent marketing commission terms',
          body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.7', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.3)', padding: '16px', borderRadius: 'var(--radius-md)', color: '#7dd3fc' }}>
                <strong>SINGLE-TIER TRANSPARENCY:</strong> The referral system operates strictly as a one-level marketing commission. It does NOT create multi-level trees, pyramid structures, or passive downline payouts.
              </div>
              <h4 style={{ color: 'var(--text-primary)' }}>1. Eligibility</h4>
              <p>Only verified users in good compliance standing may invite friends or colleagues through their unique referral link. Referrals must complete KYC verification.</p>
              <h4 style={{ color: 'var(--text-primary)' }}>2. Commission Funding Source</h4>
              <p>Referral commissions are paid exclusively from legitimate corporate marketing allocations and platform management fee shares. Commissions are NEVER funded from new investors' principal deposits.</p>
            </div>
          )
        };
      case 'kyc_aml':
        return {
          title: 'KYC & AML Compliance Policy',
          subtitle: 'Customer identification and anti-money laundering standards',
          body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.7', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              <h4 style={{ color: 'var(--text-primary)' }}>1. Identity Verification Requirements</h4>
              <p>Every investor must submit valid government-issued photo identification (National ID, Passport, or Driver’s License), verified residential address, and declared source of funds.</p>
              <h4 style={{ color: 'var(--text-primary)' }}>2. Financial Lockout</h4>
              <p>In accordance with financial compliance rules, restricted financial operations including strategy capital deployment and fund withdrawals remain locked until identity verification is formally approved by compliance staff.</p>
            </div>
          )
        };
      default:
        return {
          title: 'Legal Policy',
          subtitle: 'COOPER Complex Hub Institutional Guidelines',
          body: <p>Please refer to the full platform documentation.</p>
        };
    }
  };

  const { title, subtitle, body } = getContent();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '6px' }}>
          {body}
        </div>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
