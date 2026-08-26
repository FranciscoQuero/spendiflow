/**
 * Tipos de inversión soportados por la app. `Investment.type` se guarda como
 * `string` (ver src/types/index.ts), pero solo estos valores tienen label
 * traducida; cualquier otro cae en el fallback de `investmentTypeI18nKey`.
 */
export const INVESTMENT_TYPES = ['stocks', 'crypto', 'fund', 'etf', 'pension', 'other'] as const;

export type InvestmentTypeId = (typeof INVESTMENT_TYPES)[number];

/**
 * Devuelve la clave i18n (`accounts.investmentTypes.*`) para un tipo de
 * inversión. Función pura: no traduce por sí misma, para poder reutilizarse
 * tanto en componentes (con `t()`) como en tests.
 */
export const investmentTypeI18nKey = (type: string): string => {
  const isKnownType = (INVESTMENT_TYPES as readonly string[]).includes(type);
  return isKnownType ? `accounts.investmentTypes.${type}` : 'accounts.investmentTypes.other';
};
