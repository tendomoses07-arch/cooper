import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Shield, Lock, User, Mail, Phone, Globe, KeyRound, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (viewToNavigate?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [login2FA, setLogin2FA] = useState('');
  const [require2FA, setRequire2FA] = useState(false);

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('Uganda');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptRisk, setAcceptRisk] = useState(false);

  // Quick Preset Selector for DEMO testing
  const setQuickDemoUser = (role: string) => {
    setError(null);
    setRequire2FA(false);
    setMode('login');
    if (role === 'investor') {
      setLoginIdentifier('investor@coopercomplexhub.com');
      setLoginPassword('Investor@2026!');
    } else if (role === 'admin') {
      setLoginIdentifier('admin@coopercomplexhub.com');
      setLoginPassword('CooperAdmin@2026!');
    } else if (role === 'compliance') {
      setLoginIdentifier('compliance@coopercomplexhub.com');
      setLoginPassword('Compliance@2026!');
    } else if (role === 'finance') {
      setLoginIdentifier('finance@coopercomplexhub.com');
      setLoginPassword('Finance@2026!');
    } else if (role === 'trading') {
      setLoginIdentifier('trading@coopercomplexhub.com');
      setLoginPassword('Trading@2026!');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({
        emailOrPhone: loginIdentifier,
        password: loginPassword,
        twoFactorCode: login2FA || undefined
      });

      if (res.requireTwoFactor) {
        setRequire2FA(true);
        setError('Two-Factor Authentication is enabled on this account. Enter your 6-digit code.');
        setLoading(false);
        return;
      }

      if (res.success && res.token) {
        login(res.token, res.user);
        const targetView = ['SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'FINANCE_OFFICER', 'TRADING_MANAGER'].includes(res.user.role)
          ? 'admin'
          : 'dashboard';
        onSuccess(targetView);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!acceptTerms || !acceptRisk) {
      setError('You must accept the Terms of Service, Privacy Policy, and Investment Risk Disclosure.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({
        first_name: firstName,
        last_name: lastName,
        email: regEmail,
        phone: regPhone,
        country: regCountry,
        password: regPassword,
        confirm_password: regConfirmPassword,
        referral_code: referralCode || undefined,
        accept_terms: acceptTerms,
        accept_risk: acceptRisk
      });

      if (res.success && res.token) {
        setSuccessMsg('Account registered successfully! Accessing your investor portal...');
        login(res.token, res.user);
        setTimeout(() => {
          onSuccess('dashboard');
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>COOPER Complex Hub</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {mode === 'login' ? 'Institutional Secure Access' : 'Create Verified Investor Account'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Demo Fast Credential Picker */}
        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ 1-Click Demo Profiles (Testing Mode):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button type="button" onClick={() => setQuickDemoUser('investor')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
              Demo Investor
            </button>
            <button type="button" onClick={() => setQuickDemoUser('admin')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
              Super Admin
            </button>
            <button type="button" onClick={() => setQuickDemoUser('compliance')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
              Compliance Officer
            </button>
            <button type="button" onClick={() => setQuickDemoUser('finance')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
              Finance Officer
            </button>
            <button type="button" onClick={() => setQuickDemoUser('trading')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
              Trading Manager
            </button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: mode === 'login' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: mode === 'login' ? '2px solid var(--accent-primary)' : 'none',
              textAlign: 'center'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            style={{
              flex: 1,
              padding: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: mode === 'register' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: mode === 'register' ? '2px solid var(--accent-primary)' : 'none',
              textAlign: 'center'
            }}
          >
            Register Account
          </button>
        </div>

        {/* Error / Success Alert */}
        {error && (
          <div style={{ background: 'var(--accent-rose-subtle)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'var(--accent-emerald-subtle)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.85rem' }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address or Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="name@domain.com or +256..."
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {require2FA && (
              <div className="form-group" style={{ background: 'rgba(2, 132, 199, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
                <label className="form-label" style={{ color: 'var(--accent-cyan)' }}>Two-Factor Security Code (2FA)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={login2FA}
                    onChange={(e) => setLogin2FA(e.target.value)}
                    placeholder="Enter 6-digit code (e.g. 123456)"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                  />
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--accent-cyan)' }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '10px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Hub'}
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alexander"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Cooper"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alexander@domain.com"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+256 700 000000"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                  />
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Country of Residence</label>
                <select
                  value={regCountry}
                  onChange={(e) => setRegCountry(e.target.value)}
                  className="form-select"
                >
                  <option value="Uganda">Uganda</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Other">Other International</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Referral Code (Optional)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="e.g. CPH-INVESTOR-01"
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="form-checkbox"
                />
                <span>I agree to the <strong>Terms of Service</strong>, <strong>Privacy Policy</strong>, and <strong>Investment Terms</strong>.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acceptRisk}
                  onChange={(e) => setAcceptRisk(e.target.checked)}
                  className="form-checkbox"
                />
                <span>I acknowledge the <strong>Investment Risk Disclosure</strong> and understand that investments involve risk with no guaranteed profits.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-emerald"
              style={{ width: '100%' }}
            >
              {loading ? 'Creating Account...' : 'Register Verified Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
