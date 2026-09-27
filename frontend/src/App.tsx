import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { LegalModal } from './components/LegalModal';

import { LandingPage } from './pages/public/LandingPage';
import { AboutPage } from './pages/public/AboutPage';
import { StrategiesPage } from './pages/public/StrategiesPage';
import { SecurityPage } from './pages/public/SecurityPage';
import { FAQPage } from './pages/public/FAQPage';
import { UserDashboard } from './pages/user/UserDashboard';
import { AdminPortal } from './pages/admin/AdminPortal';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [legalModalDoc, setLegalModalDoc] = useState<string | null>(null);

  const handleNavigate = (view: string) => {
    if (view === 'dashboard' && !isAuthenticated) {
      setAuthModalMode('login');
      return;
    }
    if (view === 'admin' && !isAdmin) {
      setAuthModalMode('login');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (targetView?: string) => {
    setAuthModalMode(null);
    if (targetView) {
      setCurrentView(targetView);
    } else if (isAdmin) {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'landing' && (
          <LandingPage
            onOpenAuth={(mode) => setAuthModalMode(mode)}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'about' && (
          <AboutPage onOpenAuth={(mode) => setAuthModalMode(mode)} />
        )}

        {currentView === 'how-it-works' && (
          <LandingPage
            onOpenAuth={(mode) => setAuthModalMode(mode)}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'strategies' && (
          <StrategiesPage
            onOpenAuth={(mode) => setAuthModalMode(mode)}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'security' && (
          <SecurityPage />
        )}

        {currentView === 'faq' && (
          <FAQPage />
        )}

        {currentView === 'dashboard' && (
          isAuthenticated ? (
            <UserDashboard />
          ) : (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '16px' }}>Sign in to Access Your Investor Dashboard</h2>
              <button onClick={() => setAuthModalMode('login')} className="btn btn-primary">
                Sign In Now
              </button>
            </div>
          )
        )}

        {currentView === 'admin' && (
          isAdmin ? (
            <AdminPortal />
          ) : (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '16px' }}>Administrative Access Required</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Please log in with staff credentials (Super Admin, Compliance, Finance, or Trading Manager).
              </p>
              <button onClick={() => setAuthModalMode('login')} className="btn btn-secondary">
                Switch to Staff Login
              </button>
            </div>
          )
        )}
      </main>

      <Footer
        onOpenLegal={(doc) => setLegalModalDoc(doc)}
        onNavigate={handleNavigate}
      />

      {/* Auth Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Legal Modal */}
      {legalModalDoc && (
        <LegalModal
          documentType={legalModalDoc}
          onClose={() => setLegalModalDoc(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
