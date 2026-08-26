import { useStore } from '../store/useStore';
import {
  Transaction,
  Category,
  CategoryTotal,
  PeriodSummary,
  ChartPeriod,
  TransactionScope,
} from '../types';

/**
 * Calcula el resumen de un período a partir de una lista de transacciones ya
 * filtrada. Excluye las transferencias, que no son ni gasto ni ingreso.
 * Función pura, exportada para poder testearla sin pasar por el store.
 */
export const computePeriodSummary = (
  transactions: Transaction[],
  categories: Category[]
): PeriodSummary => {
  const relevant = transactions.filter((t) => t.type !== 'transfer');

  const expenses = relevant.filter((t) => t.type === 'expense');
  const incomes = relevant.filter((t) => t.type === 'income');

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

  // Group expenses by category (las que no tienen categoría se excluyen del desglose)
  const expensesByCategory = expenses.reduce((acc, t) => {
    if (!t.categoryId) return acc;
    acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const byCategory: CategoryTotal[] = Object.entries(expensesByCategory).map(
    ([categoryId, total]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        categoryName: category?.name || categoryId,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        color: category?.color || '#6B7280',
      };
    }
  );

  // Sort by total descending
  byCategory.sort((a, b) => b.total - a.total);

  return {
    totalExpenses,
    totalIncome,
    netBalance: totalIncome - totalExpenses,
    byCategory,
  };
};

export const useTransactions = () => {
  const transactions = useStore((state) => state.transactions);
  const categories = useStore((state) => state.categories);

  const getTransactionsByPeriod = (
    period: ChartPeriod,
    referenceDate: Date = new Date(),
    scope?: TransactionScope
  ): Transaction[] => {
    const now = referenceDate;
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const inRange = transactionDate >= startDate && transactionDate <= now;
      return inRange && (scope === undefined || t.scope === scope);
    });
  };

  const getPeriodSummary = (
    period: ChartPeriod,
    referenceDate?: Date,
    scope?: TransactionScope
  ): PeriodSummary => {
    const periodTransactions = getTransactionsByPeriod(period, referenceDate, scope);
    return computePeriodSummary(periodTransactions, categories);
  };

  const getRecentTransactions = (limit: number = 5): Transaction[] => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  const getTransactionsByMonth = (month: number, year: number): Transaction[] => {
    return transactions.filter(
      (t) => t.month === month && t.year === year
    );
  };

  const getDailyTotals = (
    period: ChartPeriod,
    type: 'expense' | 'income' = 'expense'
  ): { date: string; total: number }[] => {
    // `type` solo puede ser 'expense' | 'income', las transferencias quedan
    // excluidas de forma natural por este filtro.
    const periodTransactions = getTransactionsByPeriod(period).filter(
      (t) => t.type === type
    );

    const dailyTotals = periodTransactions.reduce((acc, t) => {
      const dateKey = t.date.split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyTotals)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  return {
    transactions,
    getTransactionsByPeriod,
    getPeriodSummary,
    getRecentTransactions,
    getTransactionsByMonth,
    getDailyTotals,
  };
};
