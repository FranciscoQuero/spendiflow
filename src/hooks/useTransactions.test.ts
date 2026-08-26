import { computePeriodSummary } from './useTransactions';
import { Category, Transaction } from '../types';

const categories: Category[] = [
  {
    id: 'comida',
    name: 'Comida',
    nameEn: 'Food',
    color: '#f00',
    icon: 'restaurant',
    type: 'expense',
    subcategories: [],
  },
];

const baseTransaction: Omit<Transaction, 'id' | 'type' | 'amount'> = {
  concept: 'x',
  scope: 'personal',
  date: '2026-01-01T00:00:00.000Z',
  month: 1,
  year: 2026,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('computePeriodSummary', () => {
  it('excludes transfers from totals and from the category breakdown', () => {
    const transactions: Transaction[] = [
      { ...baseTransaction, id: 't1', type: 'expense', amount: 50, categoryId: 'comida' },
      { ...baseTransaction, id: 't2', type: 'income', amount: 100 },
      {
        ...baseTransaction,
        id: 't3',
        type: 'transfer',
        amount: 9999,
        accountId: 'acc-1',
        toAccountId: 'acc-2',
      },
    ];

    const summary = computePeriodSummary(transactions, categories);

    expect(summary.totalExpenses).toBe(50);
    expect(summary.totalIncome).toBe(100);
    expect(summary.netBalance).toBe(50);
    expect(summary.byCategory).toHaveLength(1);
    expect(summary.byCategory[0].total).toBe(50);
  });

  it('excludes uncategorized expenses from the breakdown but keeps them in the total', () => {
    const transactions: Transaction[] = [
      { ...baseTransaction, id: 't1', type: 'expense', amount: 30 },
    ];

    const summary = computePeriodSummary(transactions, categories);

    expect(summary.totalExpenses).toBe(30);
    expect(summary.byCategory).toHaveLength(0);
  });
});
