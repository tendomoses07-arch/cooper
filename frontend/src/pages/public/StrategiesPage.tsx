import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Shield, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

interface StrategiesPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigate: (view: string) => void;
}

export const StrategiesPage: React.FC<StrategiesPageProps> = ({ onOpenAuth, onNavigate }) => {
  const [strategies, setStrategies] = useState<any[]>([]);

  useEffect(() => {
    api.getStrategies().then(res => {
      if (res.success) setStrategies(res.strategies);
    }).catch(console.error);
  }, []);

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Asset Allocation
        </span>
        <h1 style={{ fontSize: '2.8rem', marginTop: '8px', marginBottom: '16px' }}>
          Investment Strategies
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7' }}>
          Disciplined, risk-managed multi-asset strategies targeting liquid digital assets and institutional foreign-exchange markets.
        </p>
      </div>

      {/* Non-Guarantee Notice */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <strong>Transparency Notice:</strong> All strategies are subject to market volatility. In accordance with strict compliance rules, no simulated or fabricated historical returns are presented.
        </div>
      </div>

      {/* Strategies List */}
      <div className="grid grid-cols-3 lg-grid-cols-1 gap-6">
        {strategies.map(s => (
          <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="badge badge-info">{s.category}</span>
                <span className="badge badge-warning">{s.risk_level} RISK</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>{s.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
                {s.description}
              </p>

              {/* Assets Breakdown */}
              <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Target Composition:
                </div>
                {s.allocation_summary?.assets?.map((asset: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>{asset.name || asset.symbol}</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{asset.targetPct}%</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem', marginBottom: '16px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Min. Investment:</span>
                  <div style={{ fontWeight: 700 }}>${s.min_investment.toFixed(2)} USD</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Management Fee:</span>
                  <div style={{ fontWeight: 700 }}>{s.management_fee_pct}% Annually</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px', textAlign: 'center', marginBottom: '14px', fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
                {s.verified_performance_status}
              </div>
              <button onClick={() => onOpenAuth('register')} className="btn btn-primary" style={{ width: '100%' }}>
                Get Started & Allocate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
