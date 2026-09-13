import { AppState } from '../types';

const STORAGE_KEY = 'ra_international_accounts_v3';

const defaultState: AppState = {
  companyProfile: {
    name: 'RA International',
    address: '',
    city: '',
    phone: '',
    email: '',
    ntnNumber: '',
    gstNumber: '',
    bankAccounts: [],
  },
  masterItems: [],
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
  creditNotes: [],
  ledgerEntries: [],
  borrowings: [],
  inventoryAdjustments: [],
};

export function loadState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const state = { ...defaultState, ...parsed };
      // Migrate old invoices without GST fields
      state.invoices = state.invoices.map((inv: any) => ({
        ...inv,
        subtotal: inv.subtotal ?? inv.totalAmount,
        gstApplicable: inv.gstApplicable ?? false,
        gstRate: inv.gstRate ?? 18,
        gstAmount: inv.gstAmount ?? 0,
        paymentTerms: inv.paymentTerms ?? '',
      }));
      return state;
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

export function generateNumber(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

export function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
