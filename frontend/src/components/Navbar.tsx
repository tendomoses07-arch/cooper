import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Wallet, User as UserIcon, LogOut, LayoutDashboard, Sliders, Menu, X, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(6, 11, 19, 0.92)', borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Top DEMO MODE Banner */}
      <div className="demo-banner">
        <AlertTriangle size={14} color="#f59e0b" />
        <span>DEMO MODE — No real funds are being invested. Simulated fintech environment.</span>
      </div>

      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav('landing')} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>COOPER Complex Hub</span>
              <span className="badge badge-demo">DEMO</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Structured Crypto & Forex Platform
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button 
            onClick={() => handleNav('landing')} 
            style={{ color: currentView === 'landing' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }}
          >
            Home
          </button>
          <button 
            onClick={() => handleNav('about')} 
            style={{ color: currentView === 'about' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }}
          >
            About
          </button>
          <button 
            onClick={() => handleNav('how-it-works')} 
            style={{ color: currentView === 'how-it-works' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }}
          >
            How It Works
          </button>
          <button 
            onClick={() => handleNav('strategies')} 
            style={{ color: currentView === 'strategies' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }}
          >
            Investment Strategies
          </button>
          <button 
            onClick={() => handleNav('security')} 
            style={{ color: currentView === 'security' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }}
          >
            Security
          </button>
          <button 
            onClick={() => handleNav('faq')} 
            style={{ color: currentView === 'faq' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }}
          >
            FAQ
          </button>
        </nav>

        {/* Desktop Auth / Portal Actions */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => handleNav('dashboard')}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: currentView === 'dashboard' ? 'var(--accent-primary)' : undefined }}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>

              {isAdmin && (
                <button 
                  onClick={() => handleNav('admin')}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#f59e0b', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)' }}
                >
                  <Sliders size={16} />
                  <span>Admin Portal</span>
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                <UserIcon size={14} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.first_name}</span>
                <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{user?.role}</span>
              </div>

              <button 
                onClick={logout}
                className="btn btn-outline btn-sm" 
                title="Sign Out"
                style={{ padding: '8px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => onOpenAuth('login')} 
                className="btn btn-outline btn-sm"
              >
                Sign In
              </button>
              <button 
                onClick={() => onOpenAuth('register')} 
                className="btn btn-primary btn-sm"
              >
                Get Started
              </button>
              <button 
                onClick={() => { onOpenAuth('login'); }}
                className="btn btn-secondary btn-sm"
                style={{ color: '#fbbf24', border: '1px dashed rgba(245, 158, 11, 0.4)' }}
                title="Quick demo access for Staff & Investors"
              >
                <Lock size={14} />
                <span>Demo Access</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="hide-desktop"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ color: 'var(--text-primary)', padding: '6px' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)', padding: '20px' }} className="hide-desktop">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button onClick={() => handleNav('landing')} style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Home</button>
            <button onClick={() => handleNav('about')} style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>About</button>
            <button onClick={() => handleNav('how-it-works')} style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>How It Works</button>
            <button onClick={() => handleNav('strategies')} style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Investment Strategies</button>
            <button onClick={() => handleNav('security')} style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Security</button>
            <button onClick={() => handleNav('faq')} style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>FAQ</button>
            
            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />

            {isAuthenticated ? (
              <>
                <button onClick={() => handleNav('dashboard')} className="btn btn-primary" style={{ width: '100%' }}>
                  <LayoutDashboard size={18} />
                  <span>Investor Dashboard</span>
                </button>
                {isAdmin && (
                  <button onClick={() => handleNav('admin')} className="btn btn-outline" style={{ width: '100%', borderColor: '#f59e0b', color: '#fbbf24' }}>
                    <Sliders size={18} />
                    <span>Admin Portal</span>
                  </button>
                )}
                <button onClick={logout} className="btn btn-secondary" style={{ width: '100%' }}>
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }} className="btn btn-outline" style={{ width: '100%' }}>Sign In</button>
                <button onClick={() => { onOpenAuth('register'); setMobileMenuOpen(false); }} className="btn btn-primary" style={{ width: '100%' }}>Get Started</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
