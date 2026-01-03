import type { BudgetCategory, FixedExpense, Goal, User } from '../types';

type TransferType = 'internal' | 'user' | 'wallet' | 'linked';

const API_BASE = (() => {
  const viteBase = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';
  const envBase = (typeof process !== 'undefined' && (process as any).env?.API_BASE_URL) || '';
  if (viteBase) return viteBase;
  if (envBase) return envBase;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const scheme = window.location.protocol;
    const isProd = (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) === 'production' || (typeof process !== 'undefined' && (process as any).env?.NODE_ENV) === 'production';
    if (isProd && host === 'localhost') {
      return ''; // rely on same-origin reverse proxy in production builds
    }
    return `${scheme}//${host}:8081`;
  }
  return '';
})();

const getToken = () => {
  try {
    const raw = localStorage.getItem('ventyAuthToken');
    return raw ? JSON.parse(raw) : localStorage.getItem('ventyAuthToken') || '';
  } catch {
    return localStorage.getItem('ventyAuthToken') || '';
  }
};

const headers = () => {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const request = async (path: string, init?: RequestInit) => {
  try {
    const base = API_BASE || '';
    const res = await fetch(`${base}/api${path}`, {
      method: 'GET',
      ...init,
      headers: { ...headers(), ...(init?.headers || {}) },
      credentials: 'include',
    });
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: (e as Error).message };
  }
};

export const api = {
  getUserData: (userId: string) => request(`/users/${userId}`),

  setRole: async (role: 'merchant' | 'user') => {
    const res = await request(`/auth/role`, { method: 'POST', body: JSON.stringify({ role }) });
    const token = (res as any)?.data?.token;
    if (res.ok && token) {
      try {
        localStorage.setItem('ventyAuthToken', token);
      } catch {}
    }
    return res;
  },

  // Budget Categories
  listBudgetCategories: (userId: string) =>
    request(`/users/${userId}/budget/categories`, { method: 'GET' }),
  createBudgetCategory: (userId: string, payload: { name: string; allocated: number; notes?: string }) =>
    request(`/users/${userId}/budget/categories`, { method: 'POST', body: JSON.stringify(payload) }),
  updateBudgetCategory: (userId: string, categoryId: string, payload: Partial<BudgetCategory>) =>
    request(`/users/${userId}/budget/categories/${categoryId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBudgetCategory: (userId: string, categoryId: string) =>
    request(`/users/${userId}/budget/categories/${categoryId}`, { method: 'DELETE' }),

  // Fixed Expenses (Bills)
  listFixedExpenses: (userId: string) =>
    request(`/users/${userId}/fixed-expenses`, { method: 'GET' }),
  createFixedExpense: (userId: string, payload: { name: string; amount: number; notes?: string }) =>
    request(`/users/${userId}/fixed-expenses`, { method: 'POST', body: JSON.stringify(payload) }),
  updateFixedExpense: (userId: string, id: string, payload: Partial<FixedExpense>) =>
    request(`/users/${userId}/fixed-expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFixedExpense: (userId: string, id: string) =>
    request(`/users/${userId}/fixed-expenses/${id}`, { method: 'DELETE' }),

  // Goals (Savings)
  listGoals: (userId: string) =>
    request(`/users/${userId}/goals`, { method: 'GET' }),
  createGoal: (userId: string, payload: { name: string; monthlyContribution: number; notes?: string }) =>
    request(`/users/${userId}/goals`, { method: 'POST', body: JSON.stringify(payload) }),
  updateGoal: (userId: string, id: string, payload: Partial<Goal>) =>
    request(`/users/${userId}/goals/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteGoal: (userId: string, id: string) =>
    request(`/users/${userId}/goals/${id}`, { method: 'DELETE' }),

  // Debt Items
  createDebtItem: (userId: string, payload: { label: string; amount: number; notes?: string }) =>
    request(`/users/${userId}/debts`, { method: 'POST', body: JSON.stringify(payload) }),
  updateDebtItem: (userId: string, id: string, payload: { label?: string; amount?: number; notes?: string }) =>
    request(`/users/${userId}/debts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteDebtItem: (userId: string, id: string) =>
    request(`/users/${userId}/debts/${id}`, { method: 'DELETE' }),

  // Transfers
  transfer: (userId: string, payload: { amount: number; type: TransferType; direction: 'out' | 'in'; target?: string; notes?: string }) =>
    request(`/users/${userId}/transfer`, { method: 'POST', body: JSON.stringify(payload) }),

  // Account deletion
  deleteUserAccount: (userId: string) =>
    request(`/users/${userId}`, { method: 'DELETE' }),

  // Market
  getMerchantBySlug: (slug: string) =>
    request(`/market/merchants/${slug}`, { method: 'GET' }),
  listMerchantProducts: (slug: string) =>
    request(`/market/merchants/${slug}/products`, { method: 'GET' }),
  listAllProducts: () =>
    request(`/market/products`, { method: 'GET' }),
  getProductById: (id: string) =>
    request(`/products/${id}`, { method: 'GET' }),
  createMerchantProduct: (slug: string, payload: any) =>
    request(`/market/merchants/${slug}/products`, { method: 'POST', body: JSON.stringify(payload) }),
  updateMerchant: (slug: string, payload: any) =>
    request(`/market/merchants/${slug}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Transactions
  listTransactions: (userId: string) =>
    request(`/users/${userId}/transactions`, { method: 'GET' }),
  createTransaction: (userId: string, payload: {
    type: 'income' | 'expense';
    amount: number;
    date: string;
    categoryId?: string;
    category?: string;
    source?: string;
    notes?: string;
    expType?: 'fixed' | 'variable';
    recurring?: boolean;
    scope?: 'personal' | 'merchant';
  }) => request(`/users/${userId}/transactions`, { method: 'POST', body: JSON.stringify(payload) }),
  updateTransaction: (userId: string, id: string, payload: Partial<{
    amount: number;
    date: string;
    category?: string;
    source?: string;
    notes?: string;
    expType?: 'fixed' | 'variable';
    recurring?: boolean;
    scope?: 'personal' | 'merchant';
  }>) => request(`/users/${userId}/transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTransaction: (userId: string, id: string) =>
    request(`/users/${userId}/transactions/${id}`, { method: 'DELETE' }),
  
  // Expense Categories
  listExpenseCategories: (userId: string) =>
    request(`/users/${userId}/expense-categories`, { method: 'GET' }),
  createExpenseCategory: (userId: string, payload: { name: string; icon?: string; color?: string }) =>
    request(`/users/${userId}/expense-categories`, { method: 'POST', body: JSON.stringify(payload) }),
};
