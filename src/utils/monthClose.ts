import { BankAccount, Investment, Debt, BalanceEntry } from '../types';
import { getAccountBalance } from '../hooks/useAccounts';

// ---- Pure, testable helpers for the Month Close flow ----

const outstandingDebt = (debt: Debt): number =>
  Math.max(debt.totalAmount - debt.payments.reduce((sum, p) => sum + p.amount, 0), 0);

/** Suma neta de deudas: lo que debo resta, lo que me deben suma (igual criterio que getNetWorth). */
export const getDebtsNetImpact = (debts: Debt[]): number => {
  const iOweTotal = debts
    .filter((d) => d.direction === 'iOwe')
    .reduce((sum, d) => sum + outstandingDebt(d), 0);
  const owedToMeTotal = debts
    .filter((d) => d.direction === 'owedToMe')
    .reduce((sum, d) => sum + outstandingDebt(d), 0);
  return owedToMeTotal - iOweTotal;
};

/**
 * El BalanceEntry inmediatamente ANTERIOR al más reciente de la cuenta
 * (es decir, el saldo del cierre anterior). undefined si la cuenta tiene
 * 0 o 1 entradas (no hay cierre anterior con el que comparar).
 */
export const getPreviousBalanceEntry = (account: BankAccount): BalanceEntry | undefined => {
  if (account.balanceHistory.length < 2) return undefined;
  const sorted = [...account.balanceHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return sorted[sorted.length - 2];
};

export const getPreviousAccountBalance = (account: BankAccount): number | undefined =>
  getPreviousBalanceEntry(account)?.amount;

/** ¿Ya existe una entrada de saldo declarada en este mes/año para la cuenta? */
export const hasBalanceEntryInMonth = (
  account: BankAccount,
  month: number,
  year: number
): boolean =>
  account.balanceHistory.some((entry) => {
    const d = new Date(entry.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

export interface AccountBalanceDiff {
  accountId: string;
  current: number;
  previous?: number;
  diff?: number;
}

/** Empareja el saldo nuevo de cada cuenta activa con su saldo anterior. */
export const getAccountBalanceDiffs = (accounts: BankAccount[]): AccountBalanceDiff[] =>
  accounts
    .filter((a) => !a.archived)
    .map((a) => {
      const current = getAccountBalance(a);
      const previous = getPreviousAccountBalance(a);
      return {
        accountId: a.id,
        current,
        previous,
        diff: previous !== undefined ? current - previous : undefined,
      };
    });

export interface PreviousInvestmentSnapshot {
  id: string;
  previousValue?: number;
}

/**
 * Patrimonio neto del cierre anterior. Las cuentas usan el penúltimo
 * BalanceEntry (el que había justo antes del cierre actual); las
 * inversiones no guardan histórico de valor, así que se necesita un
 * snapshot tomado ANTES de aplicar los cambios de este cierre; las deudas
 * son de solo lectura en este flujo, así que se usa su estado actual.
 *
 * Devuelve undefined cuando no hay ningún dato previo (primer cierre):
 * ninguna cuenta activa tiene un saldo anterior al último y ninguna
 * inversión tenía valor previo registrado.
 */
export const computePreviousNetWorth = (
  accounts: BankAccount[],
  investmentSnapshots: PreviousInvestmentSnapshot[],
  debts: Debt[]
): number | undefined => {
  const activeAccounts = accounts.filter((a) => !a.archived);

  const accountPrevious = activeAccounts.map((a) => ({
    account: a,
    previous: getPreviousAccountBalance(a),
  }));

  const hasAnyAccountHistory = accountPrevious.some((x) => x.previous !== undefined);
  const hasAnyInvestmentHistory = investmentSnapshots.some(
    (s) => s.previousValue !== undefined
  );

  if (!hasAnyAccountHistory && !hasAnyInvestmentHistory) {
    return undefined;
  }

  const accountsTotal = accountPrevious.reduce(
    (sum, x) => sum + (x.previous ?? 0) * x.account.ownershipShare,
    0
  );

  const investmentsTotal = investmentSnapshots.reduce(
    (sum, s) => sum + (s.previousValue ?? 0),
    0
  );

  return accountsTotal + investmentsTotal + getDebtsNetImpact(debts);
};

/** Construye el snapshot de inversiones a partir del estado actual (llamar ANTES de mutar el store). */
export const snapshotInvestments = (investments: Investment[]): PreviousInvestmentSnapshot[] =>
  investments.map((i) => ({ id: i.id, previousValue: i.currentValue }));
