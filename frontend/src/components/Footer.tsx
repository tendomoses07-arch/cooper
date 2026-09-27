import React from 'react';
import { Shield, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (doc: string) => void;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onNavigate }) => {
  return (
    <footer style={{ background: '#04080f', borderTop: '1px solid var(--border-subtle)', paddingTop: '60px', paddingBottom: '40px' }}>
      <div className="container">
        {/* Risk Disclosure Box */}
        <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '48px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', flexShrink: 0 }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 style={{ color: '#fef3c7', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
              Statutory Investment Risk Disclosure
            </h4>
            <p style={{ color: '#d6d3d1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              <strong>Investments involve risk. The value of an investment can rise or fall, and past performance does not guarantee future results.</strong> COOPER Complex Hub provides software and technology infrastructure for accessing and monitoring structured cryptocurrency and foreign-exchange strategies. The platform does not offer guaranteed profits, guaranteed returns, or risk-free investments. You should carefully consider whether trading digital assets or forex is suitable for you in light of your financial condition.
            </p>
          </div>
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-8" style={{ marginBottom: '48px' }}>
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Shield size={18} />
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>COOPER Complex Hub</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Next-generation institutional financial technology enabling transparent account management, verified ledger records, and disciplined risk-controlled crypto and forex market access.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>Double-Entry Financial Ledger Verified</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li><button onClick={() => onNavigate('landing')} style={{ color: 'inherit' }}>Home</button></li>
              <li><button onClick={() => onNavigate('about')} style={{ color: 'inherit' }}>About COOPER Complex Hub</button></li>
              <li><button onClick={() => onNavigate('how-it-works')} style={{ color: 'inherit' }}>How It Works</button></li>
              <li><button onClick={() => onNavigate('strategies')} style={{ color: 'inherit' }}>Investment Strategies</button></li>
              <li><button onClick={() => onNavigate('security')} style={{ color: 'inherit' }}>Security Architecture</button></li>
              <li><button onClick={() => onNavigate('faq')} style={{ color: 'inherit' }}>Frequently Asked Questions</button></li>
            </ul>
          </div>

          {/* Payment Integrations */}
          <div>
            <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Payment Methods
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li>MTN Mobile Money (Uganda & Regional)</li>
              <li>Airtel Money</li>
              <li>Bank Wire Transfer (Stanbic / Standard Chartered Escrow)</li>
              <li>Visa Card Payments (3D-Secure 2.0)</li>
              <li>Mastercard Card Payments</li>
              <li style={{ color: 'var(--accent-amber)', fontSize: '0.8rem', marginTop: '4px' }}>All funds held under strict custody reconciliation</li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Legal & Compliance
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li><button onClick={() => onOpenLegal('terms')} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Terms of Service</button></li>
              <li><button onClick={() => onOpenLegal('privacy')} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Privacy Policy</button></li>
              <li><button onClick={() => onOpenLegal('risk')} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Investment Risk Disclosure</button></li>
              <li><button onClick={() => onOpenLegal('referral')} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Referral Program Rules</button></li>
              <li><button onClick={() => onOpenLegal('kyc_aml')} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> KYC & AML Policy</button></li>
              <li><button onClick={() => onOpenLegal('cookie')} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Cookie Policy</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <div>
            © {new Date().getFullYear()} <strong>COOPER Complex Hub</strong>. All rights reserved. Operating in DEMO Mode.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>No Guaranteed Profits</span>
            <span>•</span>
            <span>Real Financial Ledger Backing</span>
            <span>•</span>
            <span>Anti-Pyramid Protection</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
