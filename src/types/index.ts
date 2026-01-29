// Core Types for Spendiflow

export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  icon: string;
  subcategories: Subcategory[];
  type: TransactionType;
}

export interface Subcategory {
  id: string;
  name: string;
  nameEn: string;
  categoryId: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  concept: string;
  categoryId: string;
  subcategoryId?: string;
  date: string; // ISO string
  month: number; // 1-12
  year: number;
  note?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  balanceHistory: BalanceEntry[];
  createdAt: string;
}

export interface BalanceEntry {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Investment {
  id: string;
  name: string;
  type: string; // e.g., 'stocks', 'crypto', 'fund', 'other'
  contributions: Contribution[];
  currentValue?: number;
  lastUpdated?: string;
  createdAt: string;
}

export interface Contribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Debt {
  id: string;
  creditorName: string;
  totalAmount: number;
  payments: Payment[];
  interestRate?: number;
  dueDate?: string;
  note?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

// Period Types for Charts
export type ChartPeriod = 'week' | 'month' | 'quarter' | 'year';

// App Settings
export interface AppSettings {
  language: 'es' | 'en';
  currency: string;
  currencySymbol: string;
  theme: 'light' | 'dark' | 'system';
}

// Chart Data Types
export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
  color: string;
}

export interface PeriodSummary {
  totalExpenses: number;
  totalIncome: number;
  netBalance: number;
  byCategory: CategoryTotal[];
}
