import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Sliders, Users, ShieldCheck, DollarSign, Activity, FileSpreadsheet,
  AlertOctagon, CheckCircle2, XCircle, Search, RefreshCw, AlertTriangle,
  Download, ArrowRight, Shield, Layers, Lock
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'kyc' | 'finance' | 'trading' | 'audit' | 'checklist' | 'reports'>('stats');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Users tab state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // KYC tab state
  const [kycList, setKycList] = useState<any[]>([]);
  const [kycNotes, setKycNotes] = useState<Record<string, string>>({});

  // Finance tab state
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [depositsList, setDepositsList] = useState<any[]>([]);

  // Trading & Risk state
  const [riskLimits, setRiskLimits] = useState<any>(null);
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Audit tab state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Production Checklist state
  const [checklist, setChecklist] = useState<any[]>([]);
  const [canSwitchLive, setCanSwitchLive] = useState(false);

  // Load Admin Data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const statsRes = await api.admin.getStats();
      if (statsRes.success) setStats(statsRes.stats);

      if (activeTab === 'users') {
        const uRes = await api.admin.getUsers(userSearch ? `search=${encodeURIComponent(userSearch)}` : undefined);
        if (uRes.success) setUsersList(uRes.users);
      } else if (activeTab === 'kyc') {
        const kRes = await api.admin.getKYCList();
        if (kRes.success) setKycList(kRes.records);
      } else if (activeTab === 'finance') {
        const [wRes, dRes] = await Promise.all([api.admin.getWithdrawalsList(), api.admin.getDepositsList()]);
        if (wRes.success) setWithdrawalsList(wRes.withdrawals);
        if (dRes.success) setDepositsList(dRes.deposits);
      } else if (activeTab === 'trading') {
        const rRes = await api.admin.getRiskLimits();
        if (rRes.success) {
          setRiskLimits(rRes.limits);
          setOpenPositions(rRes.openPositions);
          setRecentOrders(rRes.recentOrders);
        }
      } else if (activeTab === 'audit') {
        const aRes = await api.admin.getAuditLogs();
        if (aRes.success) setAuditLogs(aRes.logs);
      } else if (activeTab === 'checklist') {
        const cRes = await api.admin.getLiveChecklist();
        if (cRes.success) {
          setChecklist(cRes.checklist);
          setCanSwitchLive(cRes.canSwitchToLive);
        }
      }
    } catch (err: any) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  // Emergency Kill Switch Toggle (STOP ALL TRADING)
  const handleToggleTradingHalt = async (shouldHalt: boolean) => {
    try {
      setLoading(true);
      const reason = prompt(
        shouldHalt ? 'Enter mandatory reason for emergency trading shutdown:' : 'Enter authorization reason to resume trading:'
      );
      if (!reason) {
        setLoading(false);
        return;
      }
      const res = await api.admin.toggleTradingHalt(shouldHalt, reason);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: shouldHalt ? 'EMERGENCY: ALL TRADING OPERATIONS HALTED PLATFORM-WIDE.' : 'Trading operations authorized and resumed.'
        });
        loadAdminData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update trading halt.' });
    } finally {
      setLoading(false);
    }
  };

  // User Suspension Toggle
  const handleToggleSuspend = async (userId: string, currentSuspended: boolean) => {
    try {
      const reason = prompt(`Enter reason to ${currentSuspended ? 'reactivate' : 'suspend'} user:`);
      if (!reason) return;
      const res = await api.admin.toggleSuspendUser(userId, !currentSuspended, reason);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        loadAdminData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed.' });
    }
  };

  // KYC Review Decision
  const handleReviewKYC = async (id: string, decision: 'VERIFIED' | 'REJECTED' | 'REQUIRES_MORE_INFORMATION') => {
    try {
      const note = kycNotes[id] || 'Verified in compliance with customer identification protocols.';
      const res = await api.admin.reviewKYC(id, {
        decision,
        notes: note,
        rejection_reason: decision === 'REJECTED' ? note : undefined
      });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        loadAdminData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'KYC review failed.' });
    }
  };

  // Withdrawal Review Decision
  const handleReviewWithdrawal = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const reason = prompt(`Enter reason for ${decision}:`) || 'Authorized by finance officer';
      const res = await api.admin.reviewWithdrawal(id, { decision, reason });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        loadAdminData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Withdrawal review failed.' });
    }
  };

  // Production Safety Checklist Update
  const handleChecklistToggle = async (itemId: string, checked: boolean) => {
    try {
      const res = await api.admin.updateLiveChecklistItem(itemId, checked);
      if (res.success) {
        setChecklist(res.checklist);
        setCanSwitchLive(res.canSwitchToLive);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to update checklist item.' });
    }
  };

  // CSV Report Download Trigger
  const handleExportCSV = async (type: string) => {
    try {
      setLoading(true);
      const csvData = await api.admin.exportCSV(type);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `cooper_complex_hub_${type}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to export report CSV.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '30px', paddingBottom: '80px' }}>
      
      {/* Admin Header with Emergency Kill Switch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={24} color="#f59e0b" />
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin & Compliance Portal</h1>
            <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{user?.role}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
            COOPER Complex Hub Administrative Engine • Source of Truth: SQLite / PostgreSQL Ledger
          </p>
        </div>

        {/* Emergency Kill Switch (Requirement #26) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Circuit Breaker</div>
            <span className={`badge ${stats?.tradingHalted ? 'badge-danger' : 'badge-success'}`}>
              {stats?.tradingHalted ? 'TRADING HALTED' : 'TRADING ACTIVE'}
            </span>
          </div>

          <button
            onClick={() => handleToggleTradingHalt(!stats?.tradingHalted)}
            className={`btn ${stats?.tradingHalted ? 'btn-emerald' : 'btn-danger'}`}
            style={{ fontWeight: 800, letterSpacing: '0.02em' }}
          >
            <AlertOctagon size={18} />
            <span>{stats?.tradingHalted ? 'RESUME TRADING' : 'STOP ALL TRADING'}</span>
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {feedback && (
        <div style={{
          background: feedback.type === 'success' ? 'var(--accent-emerald-subtle)' : 'var(--accent-rose-subtle)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: feedback.type === 'success' ? '#34d399' : '#fb7185',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px', marginBottom: '28px', overflowX: 'auto' }}>
        {[
          { id: 'stats', label: 'System KPIs', icon: Activity },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'kyc', label: 'KYC Compliance', icon: ShieldCheck },
          { id: 'finance', label: 'Finance & Payouts', icon: DollarSign },
          { id: 'trading', label: 'Trading & Risk Engine', icon: Sliders },
          { id: 'audit', label: 'Audit Logs', icon: Layers },
          { id: 'checklist', label: 'Production Safety Checklist', icon: Lock },
          { id: 'reports', label: 'CSV Reports', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setFeedback(null); }}
              className="btn"
              style={{
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid #f59e0b' : '2px solid transparent',
                borderRadius: '8px 8px 0 0',
                padding: '8px 16px',
                fontSize: '0.88rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? '#fbbf24' : 'inherit'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: SYSTEM KPIS (Requirement #31)
          ========================================================================= */}
      {activeTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="grid grid-cols-4 lg-grid-cols-2 md-grid-cols-1 gap-4">
            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Registered Investors</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', color: '#ffffff' }}>
                {stats?.totalUsers || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '4px' }}>
                {stats?.verifiedUsers || 0} KYC Verified ({stats?.pendingKYC || 0} pending)
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Confirmed Deposits</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', color: '#38bdf8' }}>
                ${(stats?.totalDeposits || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '4px' }}>
                Pending: ${(stats?.pendingDeposits || 0).toFixed(2)} ({stats?.pendingDepositsCount || 0} tx)
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Active Portfolio Value</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', color: '#34d399' }}>
                ${(stats?.portfolioValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Total Invested: ${(stats?.totalInvested || 0).toFixed(2)}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Platform Fees Earned</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', color: '#fbbf24' }}>
                ${(stats?.platformFees || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Referral Payouts: ${(stats?.paidReferralRewards || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Recent Audit Actions Preview */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Recent Sensitive Security & Administrative Actions</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentAudit?.map((log: any) => (
                    <tr key={log.id}>
                      <td><strong>{log.actor_email}</strong> <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{log.actor_role}</span></td>
                      <td><code>{log.action}</code></td>
                      <td>{log.resource_type} ({log.resource_id?.slice(0, 8) || 'N/A'})</td>
                      <td>{log.ip_address}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: USER MANAGEMENT (Requirement #32)
          ========================================================================= */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Registered Users</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="form-input"
                style={{ width: '280px' }}
              />
              <button onClick={loadAdminData} className="btn btn-secondary">
                <Search size={16} />
              </button>
            </div>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Country</th>
                    <th>Role</th>
                    <th>KYC</th>
                    <th>Available Balance</th>
                    <th>Invested</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.first_name} {u.last_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.referral_code}</div>
                      </td>
                      <td>
                        <div>{u.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone}</div>
                      </td>
                      <td>{u.country}</td>
                      <td><span className="badge badge-info">{u.role}</span></td>
                      <td>
                        <span className={`badge ${u.kyc_status === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>
                          {u.kyc_status || 'PENDING'}
                        </span>
                      </td>
                      <td><strong style={{ color: '#38bdf8' }}>${u.available_balance.toFixed(2)}</strong></td>
                      <td>${u.invested_balance.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${u.is_suspended ? 'badge-danger' : 'badge-success'}`}>
                          {u.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleToggleSuspend(u.id, u.is_suspended)}
                            className={`btn ${u.is_suspended ? 'btn-emerald' : 'btn-danger'} btn-sm`}
                          >
                            {u.is_suspended ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: KYC COMPLIANCE REVIEW (Requirement #33)
          ========================================================================= */}
      {activeTab === 'kyc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>KYC Identity Verification Requests</h2>

          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Document Details</th>
                    <th>Address & Occupation</th>
                    <th>Source of Funds</th>
                    <th>Current Status</th>
                    <th>Compliance Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycList.length > 0 ? (
                    kycList.map(k => (
                      <tr key={k.id}>
                        <td>
                          <strong>{k.full_legal_name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DOB: {k.date_of_birth} • {k.nationality}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{k.email}</div>
                        </td>
                        <td>
                          <div>{k.id_type}</div>
                          <code>{k.id_number}</code>
                        </td>
                        <td>
                          <div>{k.address}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{k.occupation}</div>
                        </td>
                        <td>{k.source_of_funds}</td>
                        <td>
                          <span className={`badge ${k.status === 'VERIFIED' ? 'badge-success' : k.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                            {k.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                              type="text"
                              placeholder="Reviewer note / reason..."
                              value={kycNotes[k.id] || ''}
                              onChange={(e) => setKycNotes({ ...kycNotes, [k.id]: e.target.value })}
                              className="form-input"
                              style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleReviewKYC(k.id, 'VERIFIED')}
                                className="btn btn-emerald btn-sm"
                                style={{ flex: 1 }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReviewKYC(k.id, 'REJECTED')}
                                className="btn btn-danger btn-sm"
                                style={{ flex: 1 }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No KYC records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: FINANCE ADMINISTRATION (Requirement #34)
          ========================================================================= */}
      {activeTab === 'finance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Finance & Reconciliation</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Review pending client withdrawals, verify escrow releases, and reconcile deposits.
            </p>
          </div>

          {/* Pending Withdrawals */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Client Withdrawal Requests (Escrow Queued)</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>User</th>
                    <th>Method</th>
                    <th>Gross</th>
                    <th>Fee</th>
                    <th>Net Payout</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsList.map(w => (
                    <tr key={w.id}>
                      <td><code>{w.reference}</code></td>
                      <td>{w.user_email}</td>
                      <td>{w.method}</td>
                      <td>${w.amount.toFixed(2)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>${w.fee.toFixed(2)}</td>
                      <td><strong style={{ color: '#34d399' }}>${w.net_amount.toFixed(2)}</strong></td>
                      <td>
                        <span className={`badge ${w.status === 'COMPLETED' ? 'badge-success' : w.status === 'UNDER_REVIEW' || w.status === 'REQUESTED' ? 'badge-warning' : 'badge-danger'}`}>
                          {w.status}
                        </span>
                      </td>
                      <td>
                        {(w.status === 'REQUESTED' || w.status === 'UNDER_REVIEW') && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleReviewWithdrawal(w.id, 'APPROVED')}
                              className="btn btn-emerald btn-sm"
                            >
                              Approve Payout
                            </button>
                            <button
                              onClick={() => handleReviewWithdrawal(w.id, 'REJECTED')}
                              className="btn btn-danger btn-sm"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: TRADING & RISK MANAGEMENT (Requirement #26)
          ========================================================================= */}
      {activeTab === 'trading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Risk Management & Trading Controls</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Real-time portfolio limits, exchange adapters, and emergency circuit breakers.
            </p>
          </div>

          <div className="grid grid-cols-2 lg-grid-cols-1 gap-6">
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Active Risk Engine Parameters</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Max Position Size (USD):</span>
                  <strong>${riskLimits?.max_position_size_usd?.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Max Portfolio Exposure:</span>
                  <strong>{riskLimits?.max_portfolio_exposure_pct}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Max Daily Loss Limit:</span>
                  <strong>{riskLimits?.max_daily_loss_pct}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Max Drawdown Boundary:</span>
                  <strong>{riskLimits?.max_drawdown_pct}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span>Emergency Trading State:</span>
                  <span className={`badge ${riskLimits?.trading_halted === 1 ? 'badge-danger' : 'badge-success'}`}>
                    {riskLimits?.trading_halted === 1 ? 'HALTED' : 'NORMAL'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Connected Execution Adapters</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Binance Institutional Adapter</strong>
                    <span className="badge badge-success">READY</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Type: CRYPTO • Permissions: READ / TRADE ONLY (No Withdrawal)
                  </div>
                </div>

                <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>LMAX Prime Broker Adapter</strong>
                    <span className="badge badge-success">READY</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Type: FOREX • Fix 4.4 Engine • Configurable Broker Connection
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: AUDIT LOGS (Requirement #36)
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Audit Logs</h2>

          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Resource Type</th>
                    <th>Reason / Details</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(l => (
                    <tr key={l.id}>
                      <td><strong>{l.actor_email}</strong></td>
                      <td><span className="badge badge-info">{l.actor_role}</span></td>
                      <td><code>{l.action}</code></td>
                      <td>{l.resource_type}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{l.reason || 'N/A'}</td>
                      <td>{l.ip_address}</td>
                      <td>{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: PRODUCTION SAFETY CHECKLIST (Requirement #56)
          ========================================================================= */}
      {activeTab === 'checklist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={24} color="#f59e0b" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Production Safety Checklist</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              All 12 legal, regulatory, custody, banking, and security criteria must be verified before the platform can switch from DEMO mode to LIVE mode.
            </p>
          </div>

          <div className="card" style={{ background: canSwitchLive ? 'var(--accent-emerald-subtle)' : 'rgba(245, 158, 11, 0.08)', borderColor: canSwitchLive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: canSwitchLive ? '#34d399' : '#fbbf24' }}>
                  {canSwitchLive ? '✓ ALL SAFETY CRITERIA VERIFIED — LIVE MODE ELIGIBLE' : '⚠️ LIVE MODE BLOCKED — PENDING SAFETY VERIFICATION'}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Operating in: <strong>DEMO MODE</strong> (Simulated fintech environment)
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {checklist.map((item, idx) => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: item.checked ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${item.checked ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => handleChecklistToggle(item.id, e.target.checked)}
                    className="form-checkbox"
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: item.checked ? '#34d399' : 'var(--text-primary)' }}>
                      {idx + 1}. {item.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: CSV REPORTS EXPORT (Requirement #52)
          ========================================================================= */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Audit & Financial Reports</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Export auditable CSV records for users, deposits, withdrawals, ledger entries, and audit logs.
            </p>
          </div>

          <div className="grid grid-cols-2 lg-grid-cols-1 gap-4">
            {[
              { type: 'users', title: 'User Account Master Report', desc: 'All registered investors, roles, KYC status, and balance snapshots' },
              { type: 'deposits', title: 'Deposits & Inflows Report', desc: 'All incoming deposits across MTN, Airtel, Bank, and Cards with provider references' },
              { type: 'withdrawals', title: 'Withdrawals & Outflows Report', desc: 'All requested and completed payouts, destinations, and finance approvals' },
              { type: 'ledger', title: 'Financial Ledger Journal Report', desc: 'Complete double-entry accounting records, debits, credits, and transaction hashes' },
              { type: 'audit', title: 'System Security Audit Trail', desc: 'Chronological administrative action logs, actor IPs, and decision reasons' }
            ].map(r => (
              <div key={r.type} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{r.title}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{r.desc}</p>
                </div>
                <button
                  onClick={() => handleExportCSV(r.type)}
                  disabled={loading}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
