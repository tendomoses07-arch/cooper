import React from 'react';
import { Shield, Lock, Key, Server, Database, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Security & Infrastructure
        </span>
        <h1 style={{ fontSize: '2.8rem', marginTop: '8px', marginBottom: '16px' }}>
          Security Architecture
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7' }}>
          Institutional defense-in-depth engineered to protect client assets, preserve transaction integrity, and prevent unauthorized execution.
        </p>
      </div>

      <div className="grid grid-cols-3 lg-grid-cols-1 gap-6">
        <div className="card">
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Database size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Immutable Double-Entry Ledger</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Account balances are mathematically derived from verified credit and debit entries. Historical ledger records cannot be overwritten, modified, or silently altered.
          </p>
        </div>

        <div className="card">
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Server size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Segregated Server-Side Keys</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Trading exchange credentials, database credentials, and payment API secrets are stored strictly on backend servers with zero exposure to frontend JavaScript clients.
          </p>
        </div>

        <div className="card">
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Key size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No Withdrawal API Permissions</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Exchange and prime broker trading keys are configured with strictly read and trade execution permissions. Withdrawal capabilities are permanently revoked at the API level.
          </p>
        </div>
      </div>

      <div className="card card-glass" style={{ padding: '36px' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Payment Gateway Idempotency & Webhook Verification</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem', marginBottom: '20px' }}>
          COOPER Complex Hub implements strict server-to-server cryptographic signature checks for all mobile money and card webhooks. Idempotency guards prevent duplicate crediting of accounts, even if payment notifications are retried repeatedly.
        </p>

        <div className="grid grid-cols-2 lg-grid-cols-1 gap-4" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
            <span>Encrypted Session Tokens (JWT 24-hour expiry)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
            <span>Optional Two-Factor Authentication (2FA)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
            <span>Automated Audit Logging on All Admin Actions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
            <span>Tokenized Card Payments (Zero PCI PAN Storage)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
