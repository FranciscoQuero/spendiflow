// Core Types for Spendiflow

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionScope = 'personal' | 'business';

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
  categoryId?: string; // ausente en transferencias
  subcategoryId?: string;
  accountId?: string; // cuenta afectada: origen en expense/transfer, destino en income
  toAccountId?: string; // solo para type 'transfer': cuenta destino
  scope: TransactionScope;
  date: string; // ISO string
  month: number; // 1-12
  year: number;
  note?: string;
  createdAt: string;
}

export type AccountRole = 'personal' | 'business' | 'shared' | 'savings' | 'other';

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  role: AccountRole;
  floor?: number; // "suelo": colchón mínimo que el usuario no quiere tocar
  ownershipShare: number; // 0-1, 0.5 = cuenta compartida al 50%
  archived: boolean;
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
  valueHistory: InvestmentValueEntry[];
  // Caché denormalizada: siempre coherente con la entrada más reciente de
  // valueHistory por fecha (o undefined si valueHistory está vacío).
  currentValue?: number;
  lastUpdated?: string;
  createdAt: string;
}

export interface InvestmentValueEntry {
  id: string;
  value: number;
  date: string; // ISO
  note?: string;
}

export interface Contribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export type DebtDirection = 'iOwe' | 'owedToMe';
export type PaymentKind = 'installment' | 'extra';

export interface Debt {
  id: string;
  creditorName: string;
  totalAmount: number;
  payments: Payment[];
  interestRate?: number;
  dueDate?: string;
  note?: string;
  direction: DebtDirection;
  monthlyPayment?: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  kind: PaymentKind;
  note?: string;
}

export interface Provision {
  // "hucha" virtual dentro de una cuenta
  id: string;
  accountId: string;
  name: string;
  icon: string; // nombre de Ionicon
  color: string;
  targetAmount?: number;
  entries: ProvisionEntry[];
  archived: boolean;
  createdAt: string;
}

export interface ProvisionEntry {
  id: string;
  amount: number; // positivo = aporte a la hucha, negativo = liquidación/retirada
  date: string;
  note?: string;
}

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringRule {
  id: string;
  name: string;
  template: {
    type: TransactionType;
    amount: number;
    concept: string;
    categoryId?: string;
    subcategoryId?: string;
    accountId?: string;
    toAccountId?: string;
    scope: TransactionScope;
  };
  frequency: RecurrenceFrequency;
  nextDueDate: string; // ISO date
  active: boolean;
  createdAt: string;
}

export interface PlannedEvent {
  // calendario financiero: vencimientos con importe estimado
  id: string;
  name: string;
  date: string; // ISO
  estimatedAmount?: number;
  accountId?: string;
  note?: string;
  done: boolean;
  createdAt: string;
}

// Period Types for Charts
export type ChartPeriod = 'week' | 'month' | 'quarter' | 'year';

// App Settings
export interface AppSettings {
  language: 'es' | 'en';
  currency: string;
  currencySymbol: string;
  theme: 'light' | 'dark' | 'system';
  // Cuenta preseleccionada al crear un gasto/ingreso. `undefined` = "Ninguna".
  defaultAccountId?: string;
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
