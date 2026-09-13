import { AppState } from '../types';

const STORAGE_KEY = 'ra_international_accounts';

const defaultState: AppState = {
  customers: [],
  vendors: [],
  orders: [],
  purchases: [],
  deliveries: [],
  transportReceipts: [],
  invoices: [],
  payments: [],
  vendorPayments: [],
  expenses: [],
};

export function loadState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading state:', e);
  }
  return defaultState;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateOrderNumber(prefix: string, existing: number): string {
  return `${prefix}-${String(existing + 1).padStart(4, '0')}`;
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}
