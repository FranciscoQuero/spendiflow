import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  Transaction,
  Category,
  BankAccount,
  Investment,
  InvestmentValueEntry,
  Debt,
  Provision,
  RecurringRule,
  PlannedEvent,
  AppSettings,
  BalanceEntry,
  Contribution,
  Payment,
  ProvisionEntry,
  TransactionScope,
  AccountRole,
  DebtDirection,
  PaymentKind,
} from '../types';
import { colors } from '../theme/colors';
import { advanceDate } from '../utils/recurrence';

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
  provisions: Provision[];
  recurringRules: RecurringRule[];
  plannedEvents: PlannedEvent[];
  settings: AppSettings;

  // Transaction Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  /** Reinserta una transacción ya existente tal cual (mismo id), usado para deshacer un borrado. */
  restoreTransaction: (transaction: Transaction) => void;

  // Category Actions
  addCategory: (category: Omit<Category, 'id' | 'subcategories'>) => string;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, name: string, nameEn: string) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;

  // Bank Account Actions
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'balanceHistory'>) => string;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  addBalanceEntry: (accountId: string, entry: Omit<BalanceEntry, 'id'>) => void;

  // Investment Actions
  addInvestment: (
    investment: Omit<Investment, 'id' | 'createdAt' | 'contributions' | 'valueHistory'>
  ) => string;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addContribution: (investmentId: string, contribution: Omit<Contribution, 'id'>) => void;
  addInvestmentValueEntry: (
    investmentId: string,
    entry: Omit<InvestmentValueEntry, 'id'>
  ) => void;
  deleteInvestmentValueEntry: (investmentId: string, entryId: string) => void;

  // Debt Actions
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'payments'>) => string;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addPayment: (debtId: string, payment: Omit<Payment, 'id'>) => void;

  // Provision Actions
  addProvision: (provision: Omit<Provision, 'id' | 'createdAt' | 'entries'>) => string;
  updateProvision: (id: string, updates: Partial<Provision>) => void;
  deleteProvision: (id: string) => void;
  addProvisionEntry: (provisionId: string, entry: Omit<ProvisionEntry, 'id'>) => void;

  // Recurring Rule Actions
  addRecurringRule: (rule: Omit<RecurringRule, 'id' | 'createdAt'>) => string;
  updateRecurringRule: (id: string, updates: Partial<RecurringRule>) => void;
  deleteRecurringRule: (id: string) => void;
  confirmRecurrence: (ruleId: string, date?: string) => void;
  skipRecurrence: (ruleId: string) => void;

  // Planned Event Actions
  addPlannedEvent: (event: Omit<PlannedEvent, 'id' | 'createdAt'>) => string;
  updatePlannedEvent: (id: string, updates: Partial<PlannedEvent>) => void;
  deletePlannedEvent: (id: string) => void;

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
  // Sin cuenta por defecto hasta que el usuario elija una en Ajustes.
  defaultAccountId: undefined,
};

export const STORE_VERSION = 3;

const asRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

/** Entrada más reciente de una lista fechada, ordenando por fecha (no por posición). */
const latestEntryByDate = <T extends { date: string }>(entries: T[]): T | undefined => {
  if (entries.length === 0) return undefined;
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return sorted[sorted.length - 1];
};

/**
 * Migra un estado persistido (v0/v1/v2/undefined, potencialmente parcial) a
 * la forma v3, rellenando los campos nuevos con sus valores por defecto.
 * Exportada para poder testearla de forma aislada.
 */
export const migrate = (persistedState: unknown): StoreState => {
  const state = (persistedState && typeof persistedState === 'object'
    ? (persistedState as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const migratedTransactions = asRecordArray(state.transactions).map((t) => ({
    ...t,
    scope: (t.scope as TransactionScope | undefined) ?? 'personal',
  })) as unknown as Transaction[];

  const categories = Array.isArray(state.categories)
    ? (state.categories as Category[])
    : [...defaultExpenseCategories, ...defaultIncomeCategories];

  const migratedAccounts = asRecordArray(state.bankAccounts).map((a) => ({
    ...a,
    role: (a.role as AccountRole | undefined) ?? 'personal',
    ownershipShare: typeof a.ownershipShare === 'number' ? a.ownershipShare : 1,
    archived: typeof a.archived === 'boolean' ? a.archived : false,
    balanceHistory: Array.isArray(a.balanceHistory) ? a.balanceHistory : [],
  })) as unknown as BankAccount[];

  const investments = asRecordArray(state.investments).map((i) => {
    if (Array.isArray(i.valueHistory)) {
      // Ya migrado en una versión anterior de esta misma función (v3+).
      return { ...i, valueHistory: i.valueHistory } as unknown as Investment;
    }
    const currentValue = typeof i.currentValue === 'number' ? i.currentValue : undefined;
    const valueHistory: InvestmentValueEntry[] =
      currentValue !== undefined
        ? [
            {
              id: uuidv4(),
              value: currentValue,
              date:
                (i.lastUpdated as string | undefined) ??
                (i.createdAt as string | undefined) ??
                new Date().toISOString(),
            },
          ]
        : [];
    return { ...i, valueHistory } as unknown as Investment;
  }) as unknown as Investment[];

  const migratedDebts = asRecordArray(state.debts).map((d) => ({
    ...d,
    direction: (d.direction as DebtDirection | undefined) ?? 'iOwe',
    payments: asRecordArray(d.payments).map((p) => ({
      ...p,
      kind: (p.kind as PaymentKind | undefined) ?? 'installment',
    })),
  })) as unknown as Debt[];

  const provisions = Array.isArray(state.provisions) ? (state.provisions as Provision[]) : [];
  const recurringRules = Array.isArray(state.recurringRules)
    ? (state.recurringRules as RecurringRule[])
    : [];
  const plannedEvents = Array.isArray(state.plannedEvents)
    ? (state.plannedEvents as PlannedEvent[])
    : [];

  // El spread de `initialSettings` primero rellena de forma no destructiva
  // cualquier campo nuevo (p.ej. `defaultAccountId`) que no existiera en un
  // estado persistido antiguo, sin tocar los valores ya guardados por el
  // usuario.
  const settings =
    state.settings && typeof state.settings === 'object'
      ? { ...initialSettings, ...(state.settings as Partial<AppSettings>) }
      : initialSettings;

  return {
    ...state,
    transactions: migratedTransactions,
    categories,
    bankAccounts: migratedAccounts,
    investments,
    debts: migratedDebts,
    provisions,
    recurringRules,
    plannedEvents,
    settings,
  } as StoreState;
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
      provisions: [],
      recurringRules: [],
      plannedEvents: [],
      settings: initialSettings,

      // Transaction Actions
      addTransaction: (transaction) => {
        if (transaction.type === 'transfer') {
          if (!transaction.accountId || !transaction.toAccountId) {
            throw new Error('Transfer transactions require accountId and toAccountId');
          }
          if (transaction.accountId === transaction.toAccountId) {
            throw new Error('Transfer accountId and toAccountId must be different');
          }
        }

        const id = uuidv4();
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              ...transaction,
              id,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

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

      restoreTransaction: (transaction) =>
        set((state) => {
          // Evita duplicarla si ya está presente (p.ej. doble tap en deshacer).
          if (state.transactions.some((t) => t.id === transaction.id)) {
            return state;
          }
          return { transactions: [...state.transactions, transaction] };
        }),

      // Category Actions
      addCategory: (category) => {
        const id = uuidv4();
        set((state) => ({
          categories: [
            ...state.categories,
            {
              ...category,
              id,
              subcategories: [],
            },
          ],
        }));
        return id;
      },

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          transactions: state.transactions.map((t) =>
            t.categoryId === id
              ? { ...t, categoryId: undefined, subcategoryId: undefined }
              : t
          ),
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
      addBankAccount: (account) => {
        const id = uuidv4();
        set((state) => ({
          bankAccounts: [
            ...state.bankAccounts,
            {
              ...account,
              id,
              balanceHistory: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

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
      addInvestment: (investment) => {
        const id = uuidv4();
        set((state) => ({
          investments: [
            ...state.investments,
            {
              ...investment,
              id,
              contributions: [],
              valueHistory: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

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

      addInvestmentValueEntry: (investmentId, entry) =>
        set((state) => ({
          investments: state.investments.map((i) => {
            if (i.id !== investmentId) return i;

            const newEntry: InvestmentValueEntry = { ...entry, id: uuidv4() };
            const newEntryDay = new Date(newEntry.date).toDateString();
            // Si ya hay una entrada del mismo día, la sustituye en vez de
            // duplicarla (evita histórico ruidoso en cierres repetidos).
            const valueHistory = [
              ...i.valueHistory.filter(
                (e) => new Date(e.date).toDateString() !== newEntryDay
              ),
              newEntry,
            ];
            const latest = latestEntryByDate(valueHistory);

            return {
              ...i,
              valueHistory,
              currentValue: latest?.value,
              lastUpdated: latest?.date,
            };
          }),
        })),

      deleteInvestmentValueEntry: (investmentId, entryId) =>
        set((state) => ({
          investments: state.investments.map((i) => {
            if (i.id !== investmentId) return i;

            const valueHistory = i.valueHistory.filter((e) => e.id !== entryId);
            const latest = latestEntryByDate(valueHistory);

            return {
              ...i,
              valueHistory,
              currentValue: latest?.value,
              lastUpdated: latest?.date,
            };
          }),
        })),

      // Debt Actions
      addDebt: (debt) => {
        const id = uuidv4();
        set((state) => ({
          debts: [
            ...state.debts,
            {
              ...debt,
              id,
              payments: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

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

      // Provision Actions
      addProvision: (provision) => {
        const id = uuidv4();
        set((state) => ({
          provisions: [
            ...state.provisions,
            {
              ...provision,
              id,
              entries: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

      updateProvision: (id, updates) =>
        set((state) => ({
          provisions: state.provisions.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProvision: (id) =>
        set((state) => ({
          provisions: state.provisions.filter((p) => p.id !== id),
        })),

      addProvisionEntry: (provisionId, entry) =>
        set((state) => ({
          provisions: state.provisions.map((p) =>
            p.id === provisionId
              ? { ...p, entries: [...p.entries, { ...entry, id: uuidv4() }] }
              : p
          ),
        })),

      // Recurring Rule Actions
      addRecurringRule: (rule) => {
        const id = uuidv4();
        set((state) => ({
          recurringRules: [
            ...state.recurringRules,
            {
              ...rule,
              id,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

      updateRecurringRule: (id, updates) =>
        set((state) => ({
          recurringRules: state.recurringRules.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      deleteRecurringRule: (id) =>
        set((state) => ({
          recurringRules: state.recurringRules.filter((r) => r.id !== id),
        })),

      confirmRecurrence: (ruleId, date) => {
        const rule = get().recurringRules.find((r) => r.id === ruleId);
        if (!rule) return;

        const txDate = date || rule.nextDueDate;
        const txDateObj = new Date(txDate);

        get().addTransaction({
          ...rule.template,
          date: txDate,
          month: txDateObj.getMonth() + 1,
          year: txDateObj.getFullYear(),
        });

        const nextDueDate = advanceDate(rule.nextDueDate, rule.frequency);
        set((state) => ({
          recurringRules: state.recurringRules.map((r) =>
            r.id === ruleId ? { ...r, nextDueDate } : r
          ),
        }));
      },

      skipRecurrence: (ruleId) =>
        set((state) => ({
          recurringRules: state.recurringRules.map((r) =>
            r.id === ruleId
              ? { ...r, nextDueDate: advanceDate(r.nextDueDate, r.frequency) }
              : r
          ),
        })),

      // Planned Event Actions
      addPlannedEvent: (event) => {
        const id = uuidv4();
        set((state) => ({
          plannedEvents: [
            ...state.plannedEvents,
            {
              ...event,
              id,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

      updatePlannedEvent: (id, updates) =>
        set((state) => ({
          plannedEvents: state.plannedEvents.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deletePlannedEvent: (id) =>
        set((state) => ({
          plannedEvents: state.plannedEvents.filter((e) => e.id !== id),
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
          provisions: [],
          recurringRules: [],
          plannedEvents: [],
          settings: initialSettings,
        }),
    }),
    {
      name: 'spendiflow-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: STORE_VERSION,
      migrate: (persistedState, version) => {
        if (version >= STORE_VERSION) {
          return persistedState as StoreState;
        }
        return migrate(persistedState);
      },
    }
  )
);
