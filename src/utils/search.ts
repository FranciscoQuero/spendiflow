import { Transaction } from '../types';

// Rango Unicode de los diacríticos combinantes (acentos, diéresis, tildes...)
// que quedan sueltos tras una normalización NFD, p.ej. "é" -> "e" + U+0301.
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/**
 * Normaliza un texto para búsqueda: minúsculas, sin acentos/diacríticos y
 * con espacios de sobra colapsados. Pura y sin dependencias externas para
 * poder testearla de forma aislada y reutilizarla en cualquier filtro de
 * texto de la app.
 */
export const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

/**
 * Filtra transacciones cuyo concepto o nota contengan (como subcadena,
 * case/acentos-insensible) el término de búsqueda. Con `query` vacío (o solo
 * espacios) devuelve la lista de entrada sin modificar.
 */
export const filterTransactions = (
  transactions: Transaction[],
  query: string
): Transaction[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return transactions;

  return transactions.filter((transaction) => {
    const haystack = `${transaction.concept} ${transaction.note ?? ''}`;
    return normalizeSearchText(haystack).includes(normalizedQuery);
  });
};
