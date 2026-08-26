import { BankAccount, Transaction } from '../types';

// ---- Pure, testable helpers for balance reconciliation (Month Close) ----

/**
 * Saldo implícito de una cuenta a fecha `toDate`, partiendo del último saldo
 * declarado a fecha `fromDate` (o antes) y sumando el efecto neto de los
 * movimientos de esa cuenta ocurridos estrictamente después de `fromDate` y
 * hasta `toDate` (inclusive): los ingresos con `accountId` = cuenta suman,
 * los gastos restan, y en las transferencias resta si la cuenta es origen
 * (`accountId`) y suma si es destino (`toAccountId`).
 *
 * Devuelve `null` cuando no hay saldo previo declarado con el que anclar el
 * cálculo (p. ej. `fromDate` ausente o cuenta sin ningún `balanceHistory`
 * anterior a esa fecha) — no aplicable.
 */
export const computeImpliedBalance = (
  account: BankAccount,
  transactions: Transaction[],
  fromDate: string | undefined,
  toDate: string
): number | null => {
  if (!fromDate) return null;

  const fromTime = new Date(fromDate).getTime();

  const priorEntries = account.balanceHistory
    .filter((entry) => new Date(entry.date).getTime() <= fromTime)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (priorEntries.length === 0) return null;

  const base = priorEntries[0].amount;
  const toTime = new Date(toDate).getTime();

  const delta = transactions.reduce((sum, t) => {
    const tTime = new Date(t.date).getTime();
    if (tTime <= fromTime || tTime > toTime) return sum;

    if (t.type === 'income') {
      return t.accountId === account.id ? sum + t.amount : sum;
    }
    if (t.type === 'expense') {
      return t.accountId === account.id ? sum - t.amount : sum;
    }
    if (t.type === 'transfer') {
      let next = sum;
      if (t.accountId === account.id) next -= t.amount;
      if (t.toAccountId === account.id) next += t.amount;
      return next;
    }
    return sum;
  }, 0);

  return base + delta;
};

/**
 * Descuadre entre el saldo declarado por el usuario y el saldo implícito
 * calculado a partir del histórico y los movimientos.
 *
 * Positivo: el usuario declaró más de lo esperado (sobra dinero).
 * Negativo: el usuario declaró menos de lo esperado (falta dinero).
 * `null` cuando no hay saldo implícito con el que comparar (no aplicable).
 */
export const computeDiscrepancy = (
  declared: number,
  implied: number | null
): number | null => {
  if (implied === null) return null;
  return declared - implied;
};
