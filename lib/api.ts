import type { BudgetCategory, FixedExpense, Goal, User } from '../types';

type TransferType = 'internal' | 'user' | 'wallet' | 'linked';

const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && (process as any).env?.API_BASE_URL) ||
  (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8080` : '');

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
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: (e as Error).message };
  }
};

export const api = {
  getUserData: (userId: string) => request(`/users/${userId}`),

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
};
