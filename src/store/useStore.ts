import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  Transaction,
  Category,
  BankAccount,
  Investment,
  Debt,
  AppSettings,
  BalanceEntry,
  Contribution,
  Payment,
} from '../types';
import { colors } from '../theme/colors';

// Default expense categories (matching Excel)
const defaultExpenseCategories: Category[] = [
  {
    id: 'casa',
    name: 'Casa',
    nameEn: 'Housing',
    color: colors.categoryColors.casa,
    icon: 'home',
    type: 'expense',
    subcategories: [
      { id: 'alquiler', name: 'Alquiler', nameEn: 'Rent', categoryId: 'casa' },
      { id: 'luz', name: 'Luz', nameEn: 'Electricity', categoryId: 'casa' },
      { id: 'gas', name: 'Gas', nameEn: 'Gas', categoryId: 'casa' },
      { id: 'agua', name: 'Agua', nameEn: 'Water', categoryId: 'casa' },
      { id: 'internet', name: 'Internet', nameEn: 'Internet', categoryId: 'casa' },
      { id: 'comunidad', name: 'Comunidad', nameEn: 'HOA fees', categoryId: 'casa' },
      { id: 'seguro-hogar', name: 'Seguro hogar', nameEn: 'Home insurance', categoryId: 'casa' },
    ],
  },
  {
    id: 'comida',
    name: 'Comida',
    nameEn: 'Food',
    color: colors.categoryColors.comida,
    icon: 'restaurant',
    type: 'expense',
    subcategories: [
      { id: 'super', name: 'Supermercado', nameEn: 'Groceries', categoryId: 'comida' },
      { id: 'comer-fuera', name: 'Comer fuera', nameEn: 'Eating out', categoryId: 'comida' },
      { id: 'delivery', name: 'Delivery', nameEn: 'Delivery', categoryId: 'comida' },
    ],
  },
  {
    id: 'suscripciones',
    name: 'Suscripciones',
    nameEn: 'Subscriptions',
    color: colors.categoryColors.suscripciones,
    icon: 'repeat',
    type: 'expense',
    subcategories: [
      { id: 'netflix', name: 'Netflix', nameEn: 'Netflix', categoryId: 'suscripciones' },
      { id: 'spotify', name: 'Spotify', nameEn: 'Spotify', categoryId: 'suscripciones' },
      { id: 'gimnasio', name: 'Gimnasio', nameEn: 'Gym', categoryId: 'suscripciones' },
      { id: 'otras-subs', name: 'Otras suscripciones', nameEn: 'Other subscriptions', categoryId: 'suscripciones' },
    ],
  },
  {
    id: 'ocio',
    name: 'Ocio',
    nameEn: 'Leisure',
    color: colors.categoryColors.ocio,
    icon: 'game-controller',
    type: 'expense',
    subcategories: [
      { id: 'cine', name: 'Cine', nameEn: 'Movies', categoryId: 'ocio' },
      { id: 'conciertos', name: 'Conciertos', nameEn: 'Concerts', categoryId: 'ocio' },
      { id: 'bares', name: 'Bares', nameEn: 'Bars', categoryId: 'ocio' },
      { id: 'hobbies', name: 'Hobbies', nameEn: 'Hobbies', categoryId: 'ocio' },
    ],
  },
  {
    id: 'otros',
    name: 'Otros',
    nameEn: 'Other',
    color: colors.categoryColors.otros,
    icon: 'ellipsis-horizontal',
    type: 'expense',
    subcategories: [
      { id: 'ropa', name: 'Ropa', nameEn: 'Clothing', categoryId: 'otros' },
      { id: 'regalos', name: 'Regalos', nameEn: 'Gifts', categoryId: 'otros' },
      { id: 'salud', name: 'Salud', nameEn: 'Health', categoryId: 'otros' },
      { id: 'transporte', name: 'Transporte', nameEn: 'Transportation', categoryId: 'otros' },
      { id: 'gasolina', name: 'Gasolina', nameEn: 'Gas/Fuel', categoryId: 'otros' },
    ],
  },
  {
    id: 'viajes',
    name: 'Viajes',
    nameEn: 'Travel',
    color: colors.categoryColors.viajes,
    icon: 'airplane',
    type: 'expense',
    subcategories: [
      { id: 'alojamiento', name: 'Alojamiento', nameEn: 'Accommodation', categoryId: 'viajes' },
      { id: 'vuelos', name: 'Vuelos', nameEn: 'Flights', categoryId: 'viajes' },
      { id: 'actividades', name: 'Actividades', nameEn: 'Activities', categoryId: 'viajes' },
    ],
  },
];

// Default income categories
const defaultIncomeCategories: Category[] = [
  {
    id: 'salario',
    name: 'Salario',
    nameEn: 'Salary',
    color: colors.income,
    icon: 'briefcase',
    type: 'income',
    subcategories: [],
  },
  {
    id: 'bonus',
    name: 'Bonus',
    nameEn: 'Bonus',
    color: colors.incomeLight,
    icon: 'gift',
    type: 'income',
    subcategories: [],
  },
  {
    id: 'otros-ingresos',
    name: 'Otros ingresos',
    nameEn: 'Other income',
    color: colors.incomeDark,
    icon: 'cash',
    type: 'income',
    subcategories: [],
  },
];

interface StoreState {
  // Data
  transactions: Transaction[];
  categories: Category[];
  bankAccounts: BankAccount[];
  investments: Investment[];
  debts: Debt[];
  settings: AppSettings;

  // Transaction Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Category Actions
  addCategory: (category: Omit<Category, 'id' | 'subcategories'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, name: string, nameEn: string) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;

  // Bank Account Actions
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'balanceHistory'>) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  addBalanceEntry: (accountId: string, entry: Omit<BalanceEntry, 'id'>) => void;

  // Investment Actions
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt' | 'contributions'>) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addContribution: (investmentId: string, contribution: Omit<Contribution, 'id'>) => void;

  // Debt Actions
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'payments'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addPayment: (debtId: string, payment: Omit<Payment, 'id'>) => void;

  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Utility Actions
  resetAllData: () => void;
}

const initialSettings: AppSettings = {
  language: 'es',
  currency: 'EUR',
  currencySymbol: '€',
  theme: 'system',
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial State
      transactions: [],
      categories: [...defaultExpenseCategories, ...defaultIncomeCategories],
      bankAccounts: [],
      investments: [],
      debts: [],
      settings: initialSettings,

      // Transaction Actions
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              ...transaction,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      // Category Actions
      addCategory: (category) =>
        set((state) => ({
          categories: [
            ...state.categories,
            {
              ...category,
              id: uuidv4(),
              subcategories: [],
            },
          ],
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      addSubcategory: (categoryId, name, nameEn) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  subcategories: [
                    ...c.subcategories,
                    { id: uuidv4(), name, nameEn, categoryId },
                  ],
                }
              : c
          ),
        })),

      deleteSubcategory: (categoryId, subcategoryId) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  subcategories: c.subcategories.filter(
                    (s) => s.id !== subcategoryId
                  ),
                }
              : c
          ),
        })),

      // Bank Account Actions
      addBankAccount: (account) =>
        set((state) => ({
          bankAccounts: [
            ...state.bankAccounts,
            {
              ...account,
              id: uuidv4(),
              balanceHistory: [],
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateBankAccount: (id, updates) =>
        set((state) => ({
          bankAccounts: state.bankAccounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      deleteBankAccount: (id) =>
        set((state) => ({
          bankAccounts: state.bankAccounts.filter((a) => a.id !== id),
        })),

      addBalanceEntry: (accountId, entry) =>
        set((state) => ({
          bankAccounts: state.bankAccounts.map((a) =>
            a.id === accountId
              ? {
                  ...a,
                  balanceHistory: [
                    ...a.balanceHistory,
                    { ...entry, id: uuidv4() },
                  ],
                }
              : a
          ),
        })),

      // Investment Actions
      addInvestment: (investment) =>
        set((state) => ({
          investments: [
            ...state.investments,
            {
              ...investment,
              id: uuidv4(),
              contributions: [],
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateInvestment: (id, updates) =>
        set((state) => ({
          investments: state.investments.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),

      deleteInvestment: (id) =>
        set((state) => ({
          investments: state.investments.filter((i) => i.id !== id),
        })),

      addContribution: (investmentId, contribution) =>
        set((state) => ({
          investments: state.investments.map((i) =>
            i.id === investmentId
              ? {
                  ...i,
                  contributions: [
                    ...i.contributions,
                    { ...contribution, id: uuidv4() },
                  ],
                }
              : i
          ),
        })),

      // Debt Actions
      addDebt: (debt) =>
        set((state) => ({
          debts: [
            ...state.debts,
            {
              ...debt,
              id: uuidv4(),
              payments: [],
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateDebt: (id, updates) =>
        set((state) => ({
          debts: state.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),

      deleteDebt: (id) =>
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
        })),

      addPayment: (debtId, payment) =>
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === debtId
              ? {
                  ...d,
                  payments: [...d.payments, { ...payment, id: uuidv4() }],
                }
              : d
          ),
        })),

      // Settings Actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Reset All Data
      resetAllData: () =>
        set({
          transactions: [],
          categories: [...defaultExpenseCategories, ...defaultIncomeCategories],
          bankAccounts: [],
          investments: [],
          debts: [],
          settings: initialSettings,
        }),
    }),
    {
      name: 'spendiflow-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
