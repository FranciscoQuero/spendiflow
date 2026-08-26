import { useStore } from '../store/useStore';
import {
  Transaction,
  Category,
  CategoryTotal,
  PeriodSummary,
  ChartPeriod,
  TransactionScope,
} from '../types';
import { getPeriodRange } from '../utils/periods';

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

/**
 * Agrupa una lista de transacciones ya filtrada por día (YYYY-MM-DD) y tipo,
 * sumando los importes. Las transferencias quedan excluidas de forma natural
 * por el filtro de `type` ('expense' | 'income'). Función pura, exportada
 * para poder testearla sin pasar por el store.
 */
export const computeDailyTotals = (
  transactions: Transaction[],
  type: 'expense' | 'income' = 'expense'
): { date: string; total: number }[] => {
  const filtered = transactions.filter((t) => t.type === type);

  const dailyTotals = filtered.reduce((acc, t) => {
    const dateKey = t.date.split('T')[0];
    acc[dateKey] = (acc[dateKey] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(dailyTotals)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const useTransactions = () => {
  const transactions = useStore((state) => state.transactions);
  const categories = useStore((state) => state.categories);

  /**
   * Transacciones del período de la granularidad dada que CONTIENE `refDate`
   * (semana lunes-domingo; mes, trimestre y año naturales — ver
   * `getPeriodRange` en `utils/periods.ts`). Sin `refDate`, usa el período
   * actual (hoy).
   */
  const getTransactionsByPeriod = (
    period: ChartPeriod,
    refDate: Date = new Date(),
    scope?: TransactionScope
  ): Transaction[] => {
    const { start, end } = getPeriodRange(period, refDate);

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const inRange = transactionDate >= start && transactionDate <= end;
      return inRange && (scope === undefined || t.scope === scope);
    });
  };

  const getPeriodSummary = (
    period: ChartPeriod,
    refDate?: Date,
    scope?: TransactionScope
  ): PeriodSummary => {
    const periodTransactions = getTransactionsByPeriod(period, refDate, scope);
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
    type: 'expense' | 'income' = 'expense',
    scope?: TransactionScope,
    refDate?: Date
  ): { date: string; total: number }[] => {
    const periodTransactions = getTransactionsByPeriod(period, refDate, scope);
    return computeDailyTotals(periodTransactions, type);
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
