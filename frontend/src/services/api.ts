const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('cph_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('cph_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('cph_token');
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await res.text()) as unknown as T;
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Financial service error occurred. Please try again.');
  }

  return data;
}

export const api = {
  // Auth
  register: (body: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiRequest('/auth/me'),
  toggle2FA: (enable: boolean) => apiRequest('/auth/2fa/toggle', { method: 'POST', body: JSON.stringify({ enable }) }),

  // Strategies
  getStrategies: () => apiRequest('/strategies'),
  getStrategyById: (id: string) => apiRequest(`/strategies/${id}`),

  // Investments & Portfolio
  allocate: (strategy_id: string, amount: number) => apiRequest('/investments/allocate', { method: 'POST', body: JSON.stringify({ strategy_id, amount }) }),
  redeem: (strategy_id: string, amount: number) => apiRequest('/investments/redeem', { method: 'POST', body: JSON.stringify({ strategy_id, amount }) }),
  getPortfolio: () => apiRequest('/investments/portfolio'),

  // Deposits
  initiateDeposit: (data: any) => apiRequest('/deposits/initiate', { method: 'POST', body: JSON.stringify(data) }),
  simulateConfirmDeposit: (reference: string) => apiRequest('/deposits/simulate-confirm', { method: 'POST', body: JSON.stringify({ reference }) }),
  getDeposits: () => apiRequest('/deposits'),

  // Withdrawals
  requestWithdrawal: (data: any) => apiRequest('/withdrawals/request', { method: 'POST', body: JSON.stringify(data) }),
  getWithdrawals: () => apiRequest('/withdrawals'),

  // KYC
  submitKYC: (data: any) => apiRequest('/kyc/submit', { method: 'POST', body: JSON.stringify(data) }),
  getKYCStatus: () => apiRequest('/kyc/status'),

  // Referrals
  getReferralDashboard: () => apiRequest('/referrals/dashboard'),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),

  // Support
  createTicket: (data: any) => apiRequest('/support/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getTickets: () => apiRequest('/support/tickets'),
  getTicketDetails: (id: string) => apiRequest(`/support/tickets/${id}`),
  addSupportMessage: (id: string, message: string) => apiRequest(`/support/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Admin APIs
  admin: {
    getStats: () => apiRequest('/admin/stats'),
    getUsers: (params?: string) => apiRequest(`/admin/users${params ? `?${params}` : ''}`),
    toggleSuspendUser: (id: string, suspend: boolean, reason?: string) => apiRequest(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ suspend, reason }) }),
    getKYCList: (status?: string) => apiRequest(`/admin/kyc${status ? `?status=${status}` : ''}`),
    reviewKYC: (id: string, data: any) => apiRequest(`/admin/kyc/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
    getDepositsList: () => apiRequest('/admin/deposits'),
    getWithdrawalsList: () => apiRequest('/admin/withdrawals'),
    reviewWithdrawal: (id: string, data: any) => apiRequest(`/admin/withdrawals/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
    getRiskLimits: () => apiRequest('/admin/risk-limits'),
    updateRiskLimits: (data: any) => apiRequest('/admin/risk-limits', { method: 'POST', body: JSON.stringify(data) }),
    toggleTradingHalt: (halt: boolean, reason?: string) => apiRequest('/admin/trading/halt', { method: 'POST', body: JSON.stringify({ halt, reason }) }),
    executeTrade: (data: any) => apiRequest('/admin/trading/execute', { method: 'POST', body: JSON.stringify(data) }),
    getAuditLogs: (params?: string) => apiRequest(`/admin/audit-logs${params ? `?${params}` : ''}`),
    getLiveChecklist: () => apiRequest('/admin/live-checklist'),
    updateLiveChecklistItem: (itemId: string, checked: boolean) => apiRequest('/admin/live-checklist', { method: 'POST', body: JSON.stringify({ itemId, checked }) }),
    exportCSV: (type: string) => apiRequest<string>(`/admin/reports/${type}/csv`)
  }
};
