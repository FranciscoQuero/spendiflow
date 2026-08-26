import { BankAccount, Investment, Debt } from '../types';

export interface MonthlyNetWorthPoint {
  year: number;
  month: number; // 1-12
  value: number;
}

const DEFAULT_MONTHS_BACK = 12;

/** Último día/instante del mes (1-12) dado, en hora local. */
const endOfMonth = (year: number, month: number): Date =>
  new Date(year, month, 0, 23, 59, 59, 999);

/** Clave ordenable año*12+mes, útil para comparar y enumerar meses. */
const monthIndex = (year: number, month: number): number => year * 12 + (month - 1);

const monthFromIndex = (index: number): { year: number; month: number } => ({
  year: Math.floor(index / 12),
  month: (index % 12) + 1,
});

/**
 * Valor de una serie histórica (saldos de cuenta o valores de inversión) a
 * fecha de fin de mes: la entrada con la fecha más reciente que no supere
 * `cutoff`. Si no hay ninguna entrada anterior o igual a `cutoff`, arrastra
 * un 0 (todavía no existía dato para esa cuenta/inversión en ese mes).
 */
const valueAsOf = <T extends { date: string }>(
  entries: T[],
  cutoff: Date,
  getAmount: (entry: T) => number
): number => {
  const cutoffTime = cutoff.getTime();
  let latest: T | undefined;
  let latestTime = -Infinity;
  for (const entry of entries) {
    const entryTime = new Date(entry.date).getTime();
    if (entryTime <= cutoffTime && entryTime > latestTime) {
      latest = entry;
      latestTime = entryTime;
    }
  }
  return latest ? getAmount(latest) : 0;
};

const outstandingDebtAsOf = (debt: Debt, cutoff: Date): number => {
  const cutoffTime = cutoff.getTime();
  const paidByCutoff = debt.payments
    .filter((p) => new Date(p.date).getTime() <= cutoffTime)
    .reduce((sum, p) => sum + p.amount, 0);
  return Math.max(debt.totalAmount - paidByCutoff, 0);
};

/**
 * Serie mensual del patrimonio neto (cuentas activas ponderadas por
 * titularidad + inversiones - deudas que debo + deudas que me deben), desde
 * el mes calendario más antiguo con algún dato real hasta el mes actual,
 * limitada a como máximo `monthsBack` meses (los más recientes).
 *
 * Devuelve [] si no hay ningún BalanceEntry ni InvestmentValueEntry en toda
 * la app (no se inventan meses ni ceros iniciales).
 */
export const computeMonthlyNetWorthSeries = (
  accounts: BankAccount[],
  investments: Investment[],
  debts: Debt[],
  monthsBack: number = DEFAULT_MONTHS_BACK,
  referenceDate: Date = new Date()
): MonthlyNetWorthPoint[] => {
  const activeAccounts = accounts.filter((a) => !a.archived);

  const allDates: number[] = [
    ...activeAccounts.flatMap((a) => a.balanceHistory.map((e) => new Date(e.date).getTime())),
    ...investments.flatMap((i) => i.valueHistory.map((e) => new Date(e.date).getTime())),
  ];

  if (allDates.length === 0) return [];

  const earliest = new Date(Math.min(...allDates));
  const startIndex = monthIndex(earliest.getFullYear(), earliest.getMonth() + 1);
  const endIndex = monthIndex(referenceDate.getFullYear(), referenceDate.getMonth() + 1);

  // Si el rango supera monthsBack, nos quedamos con los meses más recientes.
  const clampedStartIndex = Math.max(startIndex, endIndex - monthsBack + 1);

  const points: MonthlyNetWorthPoint[] = [];
  for (let idx = clampedStartIndex; idx <= endIndex; idx++) {
    const { year, month } = monthFromIndex(idx);
    const cutoff = endOfMonth(year, month);

    const accountsTotal = activeAccounts.reduce(
      (sum, a) =>
        sum + valueAsOf(a.balanceHistory, cutoff, (e) => e.amount) * a.ownershipShare,
      0
    );

    const investmentsTotal = investments.reduce(
      (sum, i) => sum + valueAsOf(i.valueHistory, cutoff, (e) => e.value),
      0
    );

    const iOweTotal = debts
      .filter((d) => d.direction === 'iOwe')
      .reduce((sum, d) => sum + outstandingDebtAsOf(d, cutoff), 0);

    const owedToMeTotal = debts
      .filter((d) => d.direction === 'owedToMe')
      .reduce((sum, d) => sum + outstandingDebtAsOf(d, cutoff), 0);

    const value = accountsTotal + investmentsTotal - iOweTotal + owedToMeTotal;

    points.push({ year, month, value });
  }

  return points;
};
