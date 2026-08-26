import { Investment } from '../types';
import { getInvestmentValue } from '../hooks/useAccounts';

/**
 * Cálculo puro del beneficio de una inversión, compartido entre
 * AddInvestmentScreen, AccountsScreen e InvestmentDetailScreen.
 */

export interface InvestmentReturn {
  /** Beneficio absoluto (valor actual − total aportado). `null` si no hay valor registrado. */
  gain: number | null;
  /** Beneficio en porcentaje sobre lo aportado. `null` si no hay valor o si lo aportado es 0 (evita +∞%). */
  percent: number | null;
}

/**
 * `currentValue` debe ser `undefined` cuando la inversión no tiene ningún
 * valor registrado todavía (ni `valueHistory` ni `currentValue` en caché).
 * No confundir con `getInvestmentValue`, que devuelve 0 como fallback.
 */
export const computeInvestmentReturn = (
  totalContributed: number,
  currentValue: number | undefined
): InvestmentReturn => {
  if (currentValue === undefined) {
    return { gain: null, percent: null };
  }

  const gain = currentValue - totalContributed;
  const percent = totalContributed > 0 ? (gain / totalContributed) * 100 : null;

  return { gain, percent };
};

export const getTotalContributed = (investment: Investment): number =>
  investment.contributions.reduce((sum, c) => sum + c.amount, 0);

/** Hay un valor de mercado registrado (histórico o caché), más allá del 0 por defecto de `getInvestmentValue`. */
export const hasInvestmentValue = (investment: Investment): boolean =>
  investment.valueHistory.length > 0 || investment.currentValue !== undefined;

/**
 * Dato principal a mostrar para una inversión: el valor actual si existe;
 * si no, lo aportado como fallback (quien la ve debe saber cuál es cuál,
 * ver `hasInvestmentValue`).
 */
export const getInvestmentDisplayValue = (investment: Investment): number =>
  hasInvestmentValue(investment) ? getInvestmentValue(investment) : getTotalContributed(investment);
