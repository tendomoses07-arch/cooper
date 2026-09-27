import React from 'react';
import { Shield, TrendingUp, CheckCircle2, AlertTriangle, Layers, Lock, Cpu, Globe, Users } from 'lucide-react';

interface AboutPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* Title Header */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Institutional Overview
        </span>
        <h1 style={{ fontSize: '2.8rem', marginTop: '8px', marginBottom: '16px' }}>
          About COOPER Complex Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7' }}>
          COOPER Complex Hub is a serious financial technology platform built to provide verified investors with software to monitor structured crypto and forex investment strategies.
        </p>
      </div>

      {/* Non-Guarantee Banner */}
      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <AlertTriangle size={24} color="#fbbf24" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.95rem', color: '#fef3c7', lineHeight: '1.6' }}>
          <strong>Legal Performance Disclaimer:</strong> Investment performance is never guaranteed. Past results do not guarantee future returns. The platform operates on real market mechanics and does not manufacture returns, Ponzi payouts, or artificial profits.
        </div>
      </div>

      {/* Narrative Section */}
      <div className="grid grid-cols-2 lg-grid-cols-1 gap-8">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Cpu size={24} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.3rem' }}>What Is COOPER Complex Hub?</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem', marginBottom: '14px' }}>
            COOPER Complex Hub is engineered as an institutional bridge between verified private capital and structured market strategies across digital assets and foreign exchange.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
            Unlike deceptive platforms that simulate fake daily returns, COOPER Complex Hub is built around verifiable double-entry accounting, strict regulatory compliance, segregated custody, and server-side risk controls.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Shield size={24} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.3rem' }}>Anti-Fraud Architecture</h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Not a Ponzi Scheme:</strong> Returns are never derived from incoming member deposits.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Not a Pyramid Scheme:</strong> The referral system is single-tier only with zero multi-level recruitment bonuses.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>No Fabricated Returns:</strong> If unverified, the platform honestly displays: <em>"No verified performance data available yet."</em></span>
            </li>
          </ul>
        </div>
      </div>

      {/* Strategies Deep Dive */}
      <div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '24px', textAlign: 'center' }}>Strategy Methodologies</h2>
        <div className="grid grid-cols-3 lg-grid-cols-1 gap-6">
          <div className="card">
            <h4 style={{ fontSize: '1.15rem', color: '#38bdf8', marginBottom: '10px' }}>Crypto Strategy</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Systematic exposure to top-tier digital assets (Bitcoin, Ethereum, Solana) with cash buffer allocations to mitigate sudden drawdown volatility. Connects to institutional exchange endpoints with read-and-trade only permissions.
            </p>
          </div>
          <div className="card">
            <h4 style={{ fontSize: '1.15rem', color: '#34d399', marginBottom: '10px' }}>Forex Strategy</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Macroeconomic algorithmic trading focused on G10 currency pairs (EUR/USD, GBP/USD, USD/JPY) executed through approved regulated prime brokerage liquidity providers.
            </p>
          </div>
          <div className="card">
            <h4 style={{ fontSize: '1.15rem', color: '#c084fc', marginBottom: '10px' }}>Combined Strategy</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              A diversified multi-asset allocation targeting balanced risk exposure by pairing high-beta digital asset momentum with institutional foreign-exchange volatility buffering.
            </p>
          </div>
        </div>
      </div>

      {/* Account Management & Security */}
      <div className="card card-glass" style={{ padding: '36px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Account & Risk Management</h2>
        <div className="grid grid-cols-3 lg-grid-cols-1 gap-6">
          <div>
            <h5 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Double-Entry Ledger</h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
              Every deposit, allocation, fee, and withdrawal is cryptographically logged as balanced debit/credit entries. User balances cannot be artificially modified.
            </p>
          </div>
          <div>
            <h5 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Emergency Kill Switch</h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
              Trading management maintains an instant <em>"STOP ALL TRADING"</em> circuit breaker to freeze executions across all strategies in the event of extreme market dislocation.
            </p>
          </div>
          <div>
            <h5 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Multi-Rail Payments</h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
              Modular integration with MTN Mobile Money, Airtel Money, Bank Wire Escrow, and PCI-tokenized Visa & Mastercard rails with server-side validation.
            </p>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => onOpenAuth('register')} className="btn btn-primary btn-lg">
          Join COOPER Complex Hub Today
        </button>
      </div>
    </div>
  );
};
