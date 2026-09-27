import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api';

export interface UserBalances {
  availableBalance: number;
  investedBalance: number;
  portfolioValue: number;
  unrealizedPnl: number;
  totalAccountValue: number;
  totalDeposits: number;
  pendingWithdrawals: number;
  currency: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  role: 'INVESTOR' | 'SUPER_ADMIN' | 'COMPLIANCE_OFFICER' | 'FINANCE_OFFICER' | 'TRADING_MANAGER' | 'SUPPORT_AGENT';
  referral_code: string;
  two_factor_enabled: boolean;
  kyc_status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'REQUIRES_MORE_INFORMATION';
  balances: UserBalances;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        clearAuthToken();
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, userData: any) => {
    setAuthToken(token);
    setUser(userData);
    refreshUser();
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const isAdmin = Boolean(
    user && ['SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'FINANCE_OFFICER', 'TRADING_MANAGER', 'SUPPORT_AGENT'].includes(user.role)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
