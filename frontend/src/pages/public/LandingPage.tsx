import React from 'react';
import { Shield, TrendingUp, Lock, RefreshCw, Smartphone, Landmark, CreditCard, ChevronRight, CheckCircle2, AlertTriangle, ArrowRight, Award, BarChart3, Layers } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onNavigate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '80px' }}>
      
      {/* 1. HERO SECTION (Requirement #5) */}
      <section style={{ position: 'relative', paddingTop: '60px', paddingBottom: '40px', overflow: 'hidden' }}>
        {/* Glow ambient background element */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, rgba(6, 11, 19, 0) 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '880px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.3)', marginBottom: '24px' }}>
            <span className="pulse-indicator" style={{ background: '#38bdf8' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Institutional Financial Infrastructure
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: '1.15', marginBottom: '24px', letterSpacing: '-0.03em' }}>
            Invest With Clarity.<br />
            <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Build With Confidence.
            </span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '36px', fontWeight: 400 }}>
            COOPER Complex Hub provides technology for accessing and monitoring structured crypto and forex investment strategies with transparent account management and risk awareness.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
            <button 
              onClick={() => onOpenAuth('register')} 
              className="btn btn-primary btn-lg"
              style={{ minWidth: '180px' }}
            >
              <span>Get Started</span>
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => onOpenAuth('login')} 
              className="btn btn-outline btn-lg"
              style={{ minWidth: '160px' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => onNavigate('strategies')} 
              className="btn btn-secondary btn-lg"
            >
              Explore Strategies
            </button>
          </div>

          {/* Key Principles Checklist */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>No Guaranteed Profit Claims</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>Immutable Ledger Source of Truth</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>Strict KYC & AML Identity Verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (Requirement #7) */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Workflow
          </span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '6px' }}>How It Works</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '10px auto 0 auto' }}>
            A disciplined four-step onboarding process built on real financial compliance and verified ledger accounting.
          </p>
        </div>

        <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-6">
          {/* Step 1 */}
          <div className="card card-interactive" style={{ background: 'var(--bg-card)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.12)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>
              01
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px' }}>Create An Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Register with your legal details, password security, and optional referral code. Two-factor authentication supported.
            </p>
          </div>

          {/* Step 2 */}
          <div className="card card-interactive" style={{ background: 'var(--bg-card)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>
              02
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px' }}>Complete KYC</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Submit government-issued identification, proof of residence, and source of funds for compliance verification before executing financial actions.
            </p>
          </div>

          {/* Step 3 */}
          <div className="card card-interactive" style={{ background: 'var(--bg-card)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>
              03
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px' }}>Fund Your Account</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Deposit using MTN Mobile Money, Airtel Money, Bank Wire, or Visa/Mastercard. Server independently reconciles every transaction.
            </p>
          </div>

          {/* Step 4 */}
          <div className="card card-interactive" style={{ background: 'var(--bg-card)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>
              04
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px' }}>Choose Strategy</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Select an available crypto, forex, or combined strategy and monitor actual portfolio allocation and performance with transparent risk metrics.
            </p>
          </div>
        </div>
      </section>

      {/* 3. INVESTMENT STRATEGIES (Requirement #8 & #9) */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Structured Portfolios
          </span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '6px' }}>Investment Strategies</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '620px', margin: '10px auto 0 auto' }}>
            Systematic strategies designed around real asset exposure. Verified performance is displayed only when legitimate historical execution records exist.
          </p>
        </div>

        <div className="grid grid-cols-3 lg-grid-cols-1 gap-6">
          {/* Strategy 1: Crypto */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #38bdf8' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-info">CRYPTO ASSETS</span>
                  <h3 style={{ fontSize: '1.35rem', marginTop: '8px' }}>Crypto Strategy</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-danger">HIGH RISK</span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '20px' }}>
                A disciplined, risk-managed investment strategy focused on liquid cryptocurrency spot markets (BTC, ETH, SOL) and cash buffer hedging.
              </p>

              {/* Allocation Breakdown */}
              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Target Allocation:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bitcoin (BTC)</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>50%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ethereum (ETH)</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>30%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Solana (SOL)</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>15%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>USD Coin Buffer (USDC)</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>5%</strong>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Min. Investment:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>$250.00 USD</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Management Fee:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>1.5% Annually</div>
                </div>
              </div>
            </div>

            {/* Performance Notice Box (Requirement #9) */}
            <div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>HISTORICAL PERFORMANCE</div>
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700, marginTop: '2px' }}>
                  No verified performance data available yet.
                </div>
              </div>

              <button onClick={() => onOpenAuth('register')} className="btn btn-primary" style={{ width: '100%' }}>
                View Strategy & Allocate
              </button>
            </div>
          </div>

          {/* Strategy 2: Forex */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #10b981' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-success">FOREIGN EXCHANGE</span>
                  <h3 style={{ fontSize: '1.35rem', marginTop: '8px' }}>Forex Strategy</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-warning">MEDIUM RISK</span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '20px' }}>
                Institutional-grade foreign exchange strategy trading liquid G10 currency pairs through an approved, regulated prime broker with algorithmic stop-loss bounds.
              </p>

              {/* Allocation Breakdown */}
              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Target Allocation:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>EUR / USD</span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>40%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GBP / USD</span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>30%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>USD / JPY</span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>30%</strong>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Min. Investment:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>$100.00 USD</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Management Fee:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>1.5% Annually</div>
                </div>
              </div>
            </div>

            {/* Performance Notice Box */}
            <div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>HISTORICAL PERFORMANCE</div>
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700, marginTop: '2px' }}>
                  No verified performance data available yet.
                </div>
              </div>

              <button onClick={() => onOpenAuth('register')} className="btn btn-emerald" style={{ width: '100%' }}>
                View Strategy & Allocate
              </button>
            </div>
          </div>

          {/* Strategy 3: Combined */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #8b5cf6' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-info" style={{ borderColor: 'rgba(139, 92, 246, 0.3)', color: '#c084fc', background: 'rgba(139, 92, 246, 0.12)' }}>
                    BALANCED MULTI-ASSET
                  </span>
                  <h3 style={{ fontSize: '1.35rem', marginTop: '8px' }}>Combined Strategy</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-warning">MODERATE-HIGH</span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '20px' }}>
                A multi-asset strategy combining eligible digital assets with institutional foreign-exchange volatility buffering for balanced risk-adjusted exposure.
              </p>

              {/* Allocation Breakdown */}
              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Target Allocation:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Forex Basket (G10 Trend Hedging)</span>
                    <strong style={{ color: 'var(--accent-purple)' }}>50%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Crypto Basket (BTC & ETH Structured)</span>
                    <strong style={{ color: 'var(--accent-purple)' }}>50%</strong>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Min. Investment:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>$500.00 USD</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Management Fee:</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>2.0% Annually</div>
                </div>
              </div>
            </div>

            {/* Performance Notice Box */}
            <div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>HISTORICAL PERFORMANCE</div>
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700, marginTop: '2px' }}>
                  No verified performance data available yet.
                </div>
              </div>

              <button onClick={() => onOpenAuth('register')} className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
                View Strategy & Allocate
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PAYMENT METHODS (Requirement #15) */}
      <section className="container">
        <div className="card card-glass" style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
            <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Multi-Rail Settlement
            </span>
            <h2 style={{ fontSize: '2rem', marginTop: '6px' }}>Supported Deposit & Payout Methods</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
              Connect directly via regional mobile wallets, global credit/debit card rails, and institutional bank escrow accounts.
            </p>
          </div>

          <div className="grid grid-cols-5 lg-grid-cols-2 md-grid-cols-1 gap-4">
            <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <Smartphone size={28} color="#fbbf24" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>MTN Mobile Money</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Instant USSD Push</div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <Smartphone size={28} color="#f43f5e" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Airtel Money</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Fast Mobile Settlement</div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <Landmark size={28} color="#38bdf8" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Bank Transfer</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Stanbic / Standard Chartered</div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <CreditCard size={28} color="#38bdf8" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Visa Card</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>3D-Secure 2.0 Tokenized</div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <CreditCard size={28} color="#f97316" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Mastercard</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Global Tokenized Rail</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECURITY & LEDGER PILLARS (Requirement #21 & #26) */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Defense In Depth
          </span>
          <h2 style={{ fontSize: '2.2rem', marginTop: '6px' }}>Built For Financial Integrity</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '10px auto 0 auto' }}>
            We eliminate common pitfalls of online platforms by anchoring all transactions to immutable cryptographic ledger accounting and systematic risk controls.
          </p>
        </div>

        <div className="grid grid-cols-3 lg-grid-cols-1 gap-6">
          <div className="card">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px' }}>Double-Entry Ledger Architecture</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Account balances cannot be edited arbitrarily from frontend requests. Balances are derived dynamically from verified ledger credits, debits, and reconciliation logs.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px' }}>Real-Time Risk Engine</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Integrated circuit breakers enforce maximum position sizes, portfolio drawdown boundaries, and provide an emergency "STOP ALL TRADING" shutdown capability.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Shield size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px' }}>Anti-Ponzi Safeguards</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              The platform rejects recruitment-based payout pyramids. Referral commissions are limited to transparent single-tier marketing expenses and never paid from incoming investor principal.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="container">
        <div style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(15, 26, 48, 0.95) 100%)', border: '1px solid rgba(2, 132, 199, 0.4)', borderRadius: 'var(--radius-lg)', padding: '50px 30px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '16px' }}>
            Experience Transparent Financial Technology
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 28px auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Join COOPER Complex Hub today in DEMO mode to test strategy monitoring, mobile money payments, and institutional risk management.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => onOpenAuth('register')} className="btn btn-primary btn-lg">
              Create Demo Account
              <ArrowRight size={18} />
            </button>
            <button onClick={() => onOpenAuth('login')} className="btn btn-outline btn-lg">
              Investor Sign In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
