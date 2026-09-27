import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, ArrowRight, Shield, RefreshCw,
  Copy, Check, AlertCircle, CheckCircle2, Clock, Landmark, CreditCard,
  Smartphone, FileText, LifeBuoy, KeyRound, Award, ChevronRight,
  ExternalLink, Layers
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'invest' | 'deposits' | 'withdrawals' | 'transactions' | 'referrals' | 'kyc' | 'support' | 'security'>('overview');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [strategies, setStrategies] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [depositsList, setDepositsList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [referralData, setReferralData] = useState<any>(null);
  const [kycData, setKycData] = useState<any>(null);
  const [ticketsList, setTicketsList] = useState<any[]>([]);

  // Time range for performance view
  const [chartPeriod, setChartPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<string>('250');
  const [depositMethod, setDepositMethod] = useState<string>('MTN_MOMO');
  const [depositPhone, setDepositPhone] = useState<string>(user?.phone || '+256772000000');
  const [activeDepositRef, setActiveDepositRef] = useState<string | null>(null);
  const [depositInstructions, setDepositInstructions] = useState<string | null>(null);
  const [depositMetadata, setDepositMetadata] = useState<any>(null);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('100');
  const [withdrawMethod, setWithdrawMethod] = useState<string>('MTN_MOMO');
  const [withdrawDestination, setWithdrawDestination] = useState<string>(user?.phone || '');
  const [withdraw2FA, setWithdraw2FA] = useState<string>('');

  // Allocation / Redeem State
  const [allocAmount, setAllocAmount] = useState<string>('250');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('crypto-strategy');

  // KYC Form State
  const [kycLegalName, setKycLegalName] = useState(user ? `${user.first_name} ${user.last_name}` : '');
  const [kycDob, setKycDob] = useState('1992-04-18');
  const [kycNationality, setKycNationality] = useState('Ugandan');
  const [kycIdType, setKycIdType] = useState('NATIONAL_ID');
  const [kycIdNumber, setKycIdNumber] = useState('CM92014589234X');
  const [kycAddress, setKycAddress] = useState('Plot 24 Kololo Hill, Kampala');
  const [kycOccupation, setKycOccupation] = useState('Business Consultant');
  const [kycSourceFunds, setKycSourceFunds] = useState('Employment & Consulting Earnings');

  // Support State
  const [ticketCategory, setTicketCategory] = useState('Deposit');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');

  // Copy referral link state
  const [copiedLink, setCopiedLink] = useState(false);

  // Load all dashboard data
  const loadData = async () => {
    try {
      setLoading(true);
      await refreshUser();

      const [stratsRes, portRes, depRes, wdlRes, refRes, kycRes, tixRes] = await Promise.all([
        api.getStrategies(),
        api.getPortfolio(),
        api.getDeposits(),
        api.getWithdrawals(),
        api.getReferralDashboard(),
        api.getKYCStatus(),
        api.getTickets()
      ]);

      if (stratsRes.success) setStrategies(stratsRes.strategies);
      if (portRes.success) setPortfolio(portRes.portfolio);
      if (depRes.success) setDepositsList(depRes.deposits);
      if (wdlRes.success) setWithdrawalsList(wdlRes.withdrawals);
      if (refRes.success) setReferralData(refRes.referral);
      if (kycRes.success) setKycData(kycRes.kyc);
      if (tixRes.success) setTicketsList(tixRes.tickets);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Handle Deposit Initiation
  const handleInitiateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      setLoading(true);
      const res = await api.initiateDeposit({
        amount: Number(depositAmount),
        currency: 'USD',
        payment_method: depositMethod,
        phone_number: depositPhone,
        payment_details: {
          brand: depositMethod === 'VISA' ? 'Visa' : depositMethod === 'MASTERCARD' ? 'Mastercard' : undefined,
          last4: '4242'
        }
      });

      if (res.success) {
        setActiveDepositRef(res.reference);
        setDepositInstructions(res.instructions);
        setDepositMetadata(res.metadata);
        setFeedbackMsg({
          type: 'success',
          text: `Deposit reference ${res.reference} initialized. You can now verify or simulate gateway confirmation.`
        });
        loadData();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Deposit initiation failed.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Simulated Deposit Confirmation (DEMO MODE)
  const handleSimulateConfirm = async () => {
    if (!activeDepositRef) return;
    try {
      setLoading(true);
      const res = await api.simulateConfirmDeposit(activeDepositRef);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Payment confirmed! $${depositAmount} has been credited to your available balance via the financial ledger.`
        });
        setActiveDepositRef(null);
        setDepositInstructions(null);
        await loadData();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Confirmation simulation failed.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Withdrawal Request
  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      setLoading(true);
      const res = await api.requestWithdrawal({
        amount: Number(withdrawAmount),
        method: withdrawMethod,
        destination_details: { destination: withdrawDestination },
        twoFactorCode: withdraw2FA || undefined
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Withdrawal request for $${withdrawAmount} submitted! Funds reserved in escrow pending compliance review.`
        });
        setWithdrawAmount('');
        loadData();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Withdrawal request failed.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Strategy Allocation
  const handleAllocate = async (strategyId: string) => {
    setFeedbackMsg(null);
    try {
      setLoading(true);
      const res = await api.allocate(strategyId, Number(allocAmount));
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Successfully allocated $${allocAmount} into strategy! Financial ledger updated.`
        });
        await loadData();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Allocation failed.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Strategy Redemption
  const handleRedeem = async (strategyId: string, currentVal: number) => {
    setFeedbackMsg(null);
    try {
      setLoading(true);
      const res = await api.redeem(strategyId, currentVal);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Successfully redeemed $${currentVal.toFixed(2)} to your available balance.`
        });
        await loadData();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Redemption failed.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle KYC Submission
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      setLoading(true);
      const res = await api.submitKYC({
        full_legal_name: kycLegalName,
        date_of_birth: kycDob,
        nationality: kycNationality,
        country_of_residence: kycNationality === 'Ugandan' ? 'Uganda' : 'Uganda',
        id_type: kycIdType,
        id_number: kycIdNumber,
        address: kycAddress,
        occupation: kycOccupation,
        source_of_funds: kycSourceFunds
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: 'KYC identity documentation submitted! Status is now UNDER_REVIEW by compliance officers.'
        });
        loadData();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'KYC submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Support Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.createTicket({
        category: ticketCategory,
        subject: ticketSubject,
        description: ticketDescription,
        priority: 'NORMAL'
      });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Support ticket ${res.ticket.ticket_number} created!` });
        setTicketSubject('');
        setTicketDescription('');
        loadData();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Ticket creation failed.' });
    } finally {
      setLoading(false);
    }
  };

  const balances = user?.balances || {
    availableBalance: 0,
    investedBalance: 0,
    portfolioValue: 0,
    unrealizedPnl: 0,
    totalAccountValue: 0,
    totalDeposits: 0,
    pendingWithdrawals: 0
  };

  const copyRefLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '30px', paddingBottom: '80px' }}>
      
      {/* User Greeting & Status Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome back, {user?.first_name}</h1>
            <span className="badge badge-demo">DEMO MODE</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
            Institutional Portal & Strategy Monitor — Account ID: <code style={{ color: 'var(--accent-cyan)' }}>{user?.id.slice(0, 8)}</code>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>KYC Status</div>
            <span className={`badge ${user?.kyc_status === 'VERIFIED' ? 'badge-success' : user?.kyc_status === 'UNDER_REVIEW' ? 'badge-warning' : 'badge-danger'}`}>
              {user?.kyc_status || 'PENDING'}
            </span>
          </div>

          <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh Live Balances">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {feedbackMsg && (
        <div style={{
          background: feedbackMsg.type === 'success' ? 'var(--accent-emerald-subtle)' : 'var(--accent-rose-subtle)',
          border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: feedbackMsg.type === 'success' ? '#34d399' : '#fb7185',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} style={{ color: 'inherit', padding: '2px 6px' }}>×</button>
        </div>
      )}

      {/* Tab Navigation (Requirement #14) */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px', marginBottom: '28px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Portfolio Overview', icon: Wallet },
          { id: 'invest', label: 'Invest & Strategies', icon: TrendingUp },
          { id: 'deposits', label: 'Deposits', icon: ArrowDownLeft },
          { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
          { id: 'transactions', label: 'Ledger Records', icon: Layers },
          { id: 'referrals', label: 'Referral Program', icon: Award },
          { id: 'kyc', label: 'Identity Verification', icon: Shield },
          { id: 'support', label: 'Support Center', icon: LifeBuoy },
          { id: 'security', label: 'Security & 2FA', icon: KeyRound }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setFeedbackMsg(null); }}
              className="btn"
              style={{
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                borderRadius: '8px 8px 0 0',
                padding: '8px 16px',
                fontSize: '0.88rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--accent-primary)' : 'inherit'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: PORTFOLIO OVERVIEW (Requirement #13)
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-4">
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, var(--bg-card) 100%)', borderColor: 'rgba(2, 132, 199, 0.3)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Account Value</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '4px', color: '#ffffff' }}>
                ${balances.totalAccountValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                <span>Available + Invested</span>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Available Balance</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '4px', color: '#38bdf8' }}>
                ${balances.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Ready for allocation or payout
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Active Portfolio Value</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '4px', color: '#34d399' }}>
                ${balances.portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Invested: ${balances.investedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Lifetime Deposits</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '4px', color: '#fbbf24' }}>
                ${balances.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Pending WDL: ${balances.pendingWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Performance Chart & Notice (Requirement #9 & #13) */}
          <div className="card card-glass" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Account Capital & Valuation</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Historical ledger balances & capital movement</p>
              </div>

              {/* Time Range Selector */}
              <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      background: chartPeriod === period ? 'var(--accent-primary)' : 'transparent',
                      color: chartPeriod === period ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Notice Box (Strict adherence to Prompt #9) */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Shield size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Verified Accounting Standard:</strong> No fabricated return charts are generated. The chart below graphs actual capital deposits and active strategy allocations recorded in your immutable ledger.
              </div>
            </div>

            {/* SVG Financial Capital Trend Line */}
            <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg viewBox="0 0 800 200" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0,160 Q 200,150 400,100 T 800,70 L 800,200 L 0,200 Z" fill="url(#chartGrad)" />
                <path d="M 0,160 Q 200,150 400,100 T 800,70" fill="none" stroke="#38bdf8" strokeWidth="3" />
                <circle cx="800" cy="70" r="5" fill="#38bdf8" />
              </svg>
              <div style={{ position: 'absolute', right: '20px', top: '20px', background: 'rgba(10, 17, 32, 0.85)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Total: </span>
                <strong style={{ color: '#38bdf8' }}>${balances.totalAccountValue.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-3 lg-grid-cols-1 gap-4">
            <button onClick={() => setActiveTab('deposits')} className="btn btn-secondary" style={{ padding: '16px', justifyContent: 'flex-start', textAlign: 'left' }}>
              <ArrowDownLeft size={22} color="var(--accent-amber)" />
              <div>
                <div style={{ fontWeight: 700 }}>Deposit Capital</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MTN, Airtel, Wire, Cards</div>
              </div>
            </button>

            <button onClick={() => setActiveTab('invest')} className="btn btn-secondary" style={{ padding: '16px', justifyContent: 'flex-start', textAlign: 'left' }}>
              <TrendingUp size={22} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontWeight: 700 }}>Allocate to Strategies</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Crypto, Forex & Combined</div>
              </div>
            </button>

            <button onClick={() => setActiveTab('withdrawals')} className="btn btn-secondary" style={{ padding: '16px', justifyContent: 'flex-start', textAlign: 'left' }}>
              <ArrowUpRight size={22} color="var(--accent-emerald)" />
              <div>
                <div style={{ fontWeight: 700 }}>Request Withdrawal</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Available balance to wallet/bank</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: INVEST & STRATEGIES
          ========================================================================= */}
      {activeTab === 'invest' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Available Investment Strategies</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Allocate your available balance into disciplined, risk-managed market strategies.
            </p>
          </div>

          {/* Allocation Input Widget */}
          <div className="card" style={{ background: 'var(--bg-glass)', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>Allocate Capital to Strategy</h4>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label className="form-label">Select Strategy</label>
                <select
                  value={selectedStrategyId}
                  onChange={(e) => setSelectedStrategyId(e.target.value)}
                  className="form-select"
                >
                  {strategies.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category} - Min: ${s.min_investment})</option>
                  ))}
                </select>
              </div>

              <div style={{ width: '180px' }}>
                <label className="form-label">Amount ($ USD)</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="form-input"
                  placeholder="250"
                />
              </div>

              <button
                onClick={() => handleAllocate(selectedStrategyId)}
                disabled={loading || balances.availableBalance < Number(allocAmount)}
                className="btn btn-primary"
                style={{ padding: '11px 24px' }}
              >
                <span>Allocate Capital</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Available to allocate: <strong style={{ color: '#38bdf8' }}>${balances.availableBalance.toFixed(2)} USD</strong>
            </div>
          </div>

          {/* Active Allocations Table */}
          {portfolio?.allocations && portfolio.allocations.length > 0 && (
            <div className="card">
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Your Active Strategy Allocations</h4>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      <th>Category</th>
                      <th>Allocated Principal</th>
                      <th>Current Value</th>
                      <th>Unrealized P/L</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.allocations.map((alloc: any) => (
                      <tr key={alloc.id}>
                        <td><strong>{alloc.strategy_name}</strong></td>
                        <td><span className="badge badge-info">{alloc.category}</span></td>
                        <td>${alloc.allocated_amount.toFixed(2)}</td>
                        <td><strong style={{ color: '#38bdf8' }}>${alloc.current_value.toFixed(2)}</strong></td>
                        <td>
                          <span style={{ color: alloc.unrealized_pnl >= 0 ? '#34d399' : '#fb7185' }}>
                            ${alloc.unrealized_pnl.toFixed(2)}
                          </span>
                        </td>
                        <td><span className="badge badge-success">{alloc.status}</span></td>
                        <td>
                          <button
                            onClick={() => handleRedeem(alloc.strategy_id, alloc.current_value)}
                            className="btn btn-outline btn-sm"
                          >
                            Redeem to Balance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Strategies Grid */}
          <div className="grid grid-cols-3 lg-grid-cols-1 gap-6">
            {strategies.map(strat => (
              <div key={strat.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="badge badge-info">{strat.category}</span>
                    <span className="badge badge-warning">{strat.risk_level} RISK</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{strat.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
                    {strat.description}
                  </p>

                  <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Min Investment:</span>
                      <strong>${strat.min_investment.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Management Fee:</span>
                      <strong>{strat.management_fee_pct}% p.a.</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px', textAlign: 'center', marginBottom: '12px', fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
                    {strat.verified_performance_status}
                  </div>
                  <button
                    onClick={() => { setSelectedStrategyId(strat.id); }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                  >
                    Select Strategy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DEPOSITS (Requirement #15, #16, #17)
          ========================================================================= */}
      {activeTab === 'deposits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Deposit Capital</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Fund your investment account via mobile money, bank transfer, or card. Server independently confirms every transaction.
            </p>
          </div>

          <div className="grid grid-cols-2 lg-grid-cols-1 gap-8">
            {/* Deposit Wizard Form */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '18px' }}>1. Select Deposit Options</h3>
              <form onSubmit={handleInitiateDeposit}>
                <div className="form-group">
                  <label className="form-label">Amount ($ USD)</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="form-input"
                    placeholder="250"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Minimum deposit: $10.00 USD</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="form-select"
                  >
                    <option value="MTN_MOMO">MTN Mobile Money (Uganda / Regional)</option>
                    <option value="AIRTEL_MONEY">Airtel Money (Uganda / Regional)</option>
                    <option value="BANK_TRANSFER">Bank Wire Transfer (Stanbic / Stanchart Escrow)</option>
                    <option value="VISA">Visa Card (3D-Secure 2.0)</option>
                    <option value="MASTERCARD">Mastercard (Tokenized)</option>
                  </select>
                </div>

                {(depositMethod === 'MTN_MOMO' || depositMethod === 'AIRTEL_MONEY') && (
                  <div className="form-group">
                    <label className="form-label">Mobile Money Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={depositPhone}
                      onChange={(e) => setDepositPhone(e.target.value)}
                      className="form-input"
                      placeholder="+256 772 000000"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  {loading ? 'Initializing...' : 'Generate Deposit Reference'}
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>

            {/* Verification / Simulation Box */}
            <div className="card card-glass" style={{ border: activeDepositRef ? '1px solid #38bdf8' : '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>2. Payment Verification & Settlement</h3>

              {activeDepositRef ? (
                <div>
                  <div style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.3)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>Active Transaction Reference:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>{activeDepositRef}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{depositInstructions}</div>
                  </div>

                  {depositMethod === 'BANK_TRANSFER' && depositMetadata && (
                    <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.82rem' }}>
                      <div>Bank: <strong>{depositMetadata.bankName}</strong></div>
                      <div>Account Name: <strong>{depositMetadata.accountName}</strong></div>
                      <div>Account No: <strong>{depositMetadata.accountNumber}</strong></div>
                      <div>Swift: <strong>{depositMetadata.swiftCode}</strong></div>
                    </div>
                  )}

                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed rgba(245, 158, 11, 0.4)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
                      ⚡ DEMO SIMULATION (Prompt #59):
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Simulate the external payment gateway (MTN MoMo API / Card Gateway) callback. Clicking below sends a server-side confirmation, validates idempotency, and immediately records the double-entry ledger entry.
                    </p>
                    <button
                      onClick={handleSimulateConfirm}
                      disabled={loading}
                      className="btn btn-emerald btn-sm"
                      style={{ marginTop: '10px', width: '100%' }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Simulate Gateway Confirmation & Ledger Post</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <ArrowDownLeft size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9rem' }}>Fill the deposit form on the left to generate your unique reference.</p>
                </div>
              )}
            </div>
          </div>

          {/* Deposit History */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Your Deposit History</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reconciliation</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {depositsList.length > 0 ? (
                    depositsList.map(dep => (
                      <tr key={dep.id}>
                        <td><code>{dep.reference}</code></td>
                        <td>{dep.payment_method}</td>
                        <td><strong>${dep.amount.toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge ${dep.status === 'CONFIRMED' ? 'badge-success' : dep.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                            {dep.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: dep.reconciliation_status === 'RECONCILED' ? '#34d399' : 'var(--text-muted)' }}>
                            {dep.reconciliation_status}
                          </span>
                        </td>
                        <td>{new Date(dep.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No deposits recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: WITHDRAWALS (Requirement #27)
          ========================================================================= */}
      {activeTab === 'withdrawals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Withdraw Capital</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Withdraw available funds to your verified mobile money wallet or bank account. Subject to compliance approval.
            </p>
          </div>

          <div className="grid grid-cols-2 lg-grid-cols-1 gap-8">
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '18px' }}>Request Payout</h3>
              <form onSubmit={handleWithdrawalRequest}>
                <div className="form-group">
                  <label className="form-label">Amount ($ USD)</label>
                  <input
                    type="number"
                    min="20"
                    step="10"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="form-input"
                    placeholder="100"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Available balance: <strong>${balances.availableBalance.toFixed(2)}</strong> (Min: $20.00)
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Withdrawal Method</label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="form-select"
                  >
                    <option value="MTN_MOMO">MTN Mobile Money</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination (Phone Number or Account Number)</label>
                  <input
                    type="text"
                    required
                    value={withdrawDestination}
                    onChange={(e) => setWithdrawDestination(e.target.value)}
                    className="form-input"
                    placeholder="+256..."
                  />
                </div>

                {user?.two_factor_enabled && (
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--accent-cyan)' }}>Two-Factor Security Code (2FA)</label>
                    <input
                      type="text"
                      required
                      value={withdraw2FA}
                      onChange={(e) => setWithdraw2FA(e.target.value)}
                      className="form-input"
                      placeholder="6-digit 2FA code"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || balances.availableBalance < Number(withdrawAmount)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>

            {/* Withdrawal Rules Box */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Compliance & Escrow Rules</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span><strong>KYC Mandatory:</strong> Withdrawals require status <code>VERIFIED</code>.</span>
                </li>
                <li style={{ display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span><strong>Escrow Reservation:</strong> Requested funds are placed into escrow immediately via double-entry ledger to prevent double-spending.</span>
                </li>
                <li style={{ display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span><strong>Finance Review:</strong> Every disbursement is approved by authorized finance staff before release.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Your Withdrawal Requests</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Method</th>
                    <th>Gross</th>
                    <th>Fee</th>
                    <th>Net Payout</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsList.length > 0 ? (
                    withdrawalsList.map(wdl => (
                      <tr key={wdl.id}>
                        <td><code>{wdl.reference}</code></td>
                        <td>{wdl.method}</td>
                        <td>${wdl.amount.toFixed(2)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>${wdl.fee.toFixed(2)}</td>
                        <td><strong style={{ color: '#34d399' }}>${wdl.net_amount.toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge ${wdl.status === 'COMPLETED' ? 'badge-success' : wdl.status === 'UNDER_REVIEW' || wdl.status === 'REQUESTED' ? 'badge-warning' : 'badge-danger'}`}>
                            {wdl.status}
                          </span>
                        </td>
                        <td>{new Date(wdl.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No withdrawals requested yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: TRANSACTIONS / FINANCIAL LEDGER (Requirement #21)
          ========================================================================= */}
      {activeTab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Financial Ledger Records</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Cryptographically verified, immutable accounting journal entries tracking all deposits, allocations, fees, and withdrawals.
            </p>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction Reference</th>
                    <th>Entry Type</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {depositsList.map(d => (
                    <tr key={d.id}>
                      <td><code>{d.reference}</code></td>
                      <td><span className="badge badge-info">DEPOSIT</span></td>
                      <td><strong style={{ color: '#34d399' }}>+${d.amount.toFixed(2)}</strong></td>
                      <td>USD</td>
                      <td>Deposit via {d.payment_method}</td>
                      <td><span className="badge badge-success">{d.status}</span></td>
                    </tr>
                  ))}
                  {portfolio?.allocations?.map((a: any) => (
                    <tr key={a.id}>
                      <td><code>CPH-ALLOC-{a.id.slice(0, 6)}</code></td>
                      <td><span className="badge badge-warning">ALLOCATION</span></td>
                      <td><strong style={{ color: '#38bdf8' }}>-${a.allocated_amount.toFixed(2)}</strong></td>
                      <td>USD</td>
                      <td>Capital deployment into {a.strategy_name}</td>
                      <td><span className="badge badge-info">ACTIVE</span></td>
                    </tr>
                  ))}
                  {withdrawalsList.map(w => (
                    <tr key={w.id}>
                      <td><code>{w.reference}</code></td>
                      <td><span className="badge badge-danger">WITHDRAWAL</span></td>
                      <td><strong style={{ color: '#fb7185' }}>-${w.amount.toFixed(2)}</strong></td>
                      <td>USD</td>
                      <td>Withdrawal request via {w.method}</td>
                      <td><span className="badge badge-warning">{w.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: REFERRALS (Requirement #28 & #29)
          ========================================================================= */}
      {activeTab === 'referrals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Referral Marketing Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Transparent single-tier marketing rewards. Payouts are not derived from member deposits.
            </p>
          </div>

          {/* Referral Link Copy Box */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, var(--bg-card) 100%)', borderColor: 'rgba(2, 132, 199, 0.3)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
              Your Unique Referral Link:
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                readOnly
                value={referralData?.referralLink || `https://coopercomplexhub.com/register?ref=${user?.referral_code}`}
                className="form-input"
                style={{ flex: 1, minWidth: '280px', fontWeight: 600, color: 'var(--text-primary)' }}
              />
              <button onClick={copyRefLink} className="btn btn-primary">
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Referral Metrics Grid */}
          <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-4">
            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Referred</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
                {referralData?.totalReferrals || 0}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Verified KYC Referrals</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#34d399' }}>
                {referralData?.verifiedReferrals || 0}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Pending KYC Referrals</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#fbbf24' }}>
                {referralData?.pendingReferrals || 0}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Earned Commissions</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#38bdf8' }}>
                ${(referralData?.eligibleRewards || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Referral List */}
          <div className="card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Referred Users</h4>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invited User</th>
                    <th>Status</th>
                    <th>KYC Status</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referralData?.referralsList && referralData.referralsList.length > 0 ? (
                    referralData.referralsList.map((r: any) => (
                      <tr key={r.id}>
                        <td><strong>{r.name}</strong></td>
                        <td><span className="badge badge-info">{r.status}</span></td>
                        <td>
                          <span className={`badge ${r.kycStatus === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>
                            {r.kycStatus}
                          </span>
                        </td>
                        <td>{new Date(r.date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No users registered with your referral link yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: KYC IDENTITY VERIFICATION (Requirement #12)
          ========================================================================= */}
      {activeTab === 'kyc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Know-Your-Customer (KYC) Verification</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Required statutory compliance procedure to unlock financial transactions and anti-money laundering compliance.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Shield size={24} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.2rem' }}>Identity Verification Form</h3>
            </div>

            <form onSubmit={handleKycSubmit}>
              <div className="grid grid-cols-2 lg-grid-cols-1 gap-4">
                <div className="form-group">
                  <label className="form-label">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={kycLegalName}
                    onChange={(e) => setKycLegalName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={kycDob}
                    onChange={(e) => setKycDob(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nationality</label>
                  <input
                    type="text"
                    required
                    value={kycNationality}
                    onChange={(e) => setKycNationality(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Identification Document Type</label>
                  <select
                    value={kycIdType}
                    onChange={(e) => setKycIdType(e.target.value)}
                    className="form-select"
                  >
                    <option value="NATIONAL_ID">National Identity Card</option>
                    <option value="PASSPORT">International Passport</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ID Document Number</label>
                  <input
                    type="text"
                    required
                    value={kycIdNumber}
                    onChange={(e) => setKycIdNumber(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Occupation</label>
                  <input
                    type="text"
                    required
                    value={kycOccupation}
                    onChange={(e) => setKycOccupation(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Source of Funds Declaration</label>
                <input
                  type="text"
                  required
                  value={kycSourceFunds}
                  onChange={(e) => setKycSourceFunds(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address</label>
                <input
                  type="text"
                  required
                  value={kycAddress}
                  onChange={(e) => setKycAddress(e.target.value)}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading || user?.kyc_status === 'VERIFIED'}
                className="btn btn-primary"
                style={{ marginTop: '10px' }}
              >
                {user?.kyc_status === 'VERIFIED' ? 'Identity Verified ✓' : loading ? 'Submitting...' : 'Submit Verification Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: SUPPORT TICKETS (Requirement #42)
          ========================================================================= */}
      {activeTab === 'support' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Customer Support Center</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Create inquiry tickets and communicate directly with customer support officers.
            </p>
          </div>

          <div className="grid grid-cols-2 lg-grid-cols-1 gap-8">
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Submit Support Inquiry</h3>
              <form onSubmit={handleCreateTicket}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="Deposit">Deposit & Funding</option>
                    <option value="Withdrawal">Withdrawal & Payout</option>
                    <option value="KYC">KYC & Identity Verification</option>
                    <option value="Investment">Investment Strategy</option>
                    <option value="Crypto">Crypto Strategy</option>
                    <option value="Forex">Forex Strategy</option>
                    <option value="Referral">Referral Program</option>
                    <option value="Security">Security & 2FA</option>
                    <option value="Other">Other Inquiry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="form-input"
                    placeholder="Brief description of inquiry"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    className="form-textarea"
                    placeholder="Provide details..."
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                  Submit Ticket
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Your Tickets</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ticketsList.length > 0 ? (
                  ticketsList.map(t => (
                    <div key={t.id} style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>#{t.ticket_number} • {t.category}</span>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginTop: '2px' }}>{t.subject}</h4>
                        </div>
                        <span className={`badge ${t.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>{t.description}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No support tickets created yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 9: SECURITY & 2FA (Requirement #11 & #37)
          ========================================================================= */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Account Security</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Manage multi-factor authentication and session safeguards.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Two-Factor Authentication (2FA)</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Require a secondary security code on withdrawals and login sessions.
                </p>
              </div>
              <button
                onClick={async () => {
                  await api.toggle2FA(!user?.two_factor_enabled);
                  await refreshUser();
                  setFeedbackMsg({
                    type: 'success',
                    text: `2FA ${!user?.two_factor_enabled ? 'enabled' : 'disabled'} successfully.`
                  });
                }}
                className={`btn ${user?.two_factor_enabled ? 'btn-danger' : 'btn-emerald'} btn-sm`}
              >
                {user?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
