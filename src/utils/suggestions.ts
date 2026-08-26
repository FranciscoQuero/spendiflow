// Funciones puras de sugerencias para el alta rápida de transacciones:
// orden de categorías por uso reciente y memoria de conceptos ya usados.

import { Category, Transaction, TransactionType } from '../types';

/** Nº de transacciones recientes (del mismo tipo) que se tienen en cuenta al puntuar categorías. */
const USAGE_WINDOW = 200;

/** Nº máximo de sugerencias de concepto a devolver. */
const MAX_CONCEPT_SUGGESTIONS = 3;

/** Longitud mínima de texto para empezar a buscar sugerencias de concepto. */
const MIN_CONCEPT_QUERY_LENGTH = 2;

/**
 * Ordena `categories` por frecuencia de uso en las últimas `USAGE_WINDOW`
 * transacciones de `type` (las más recientes primero según `date`). Las
 * categorías empatadas (incluidas las que no se han usado nunca) conservan
 * el orden relativo con el que llegaron en `categories`.
 *
 * Función pura: no lee ni escribe el store.
 */
export const rankCategoriesByUsage = (
  categories: Category[],
  transactions: Transaction[],
  type: TransactionType
): Category[] => {
  const recentOfType = [...transactions]
    .filter((tr) => tr.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, USAGE_WINDOW);

  const usageCount = new Map<string, number>();
  for (const tr of recentOfType) {
    if (!tr.categoryId) continue;
    usageCount.set(tr.categoryId, (usageCount.get(tr.categoryId) ?? 0) + 1);
  }

  return categories
    .map((category, index) => ({
      category,
      index,
      count: usageCount.get(category.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map((entry) => entry.category);
};

export interface ConceptSuggestion {
  concept: string;
  categoryId?: string;
  subcategoryId?: string;
  accountId?: string;
}

/** Quita acentos/diacríticos y pasa a minúsculas para comparar de forma insensible a mayúsculas/acentos. */
const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

/**
 * Busca en `transactions` conceptos ya usados que empiecen igual que `text`
 * (insensible a mayúsculas y acentos) y devuelve hasta 3 sugerencias, cada
 * una con la categoría/subcategoría/cuenta de su uso más reciente.
 *
 * Si hay varias transacciones con el mismo concepto (normalizado), solo se
 * devuelve la más reciente. Con menos de 2 caracteres no sugiere nada.
 *
 * Función pura: no lee ni escribe el store.
 */
export const suggestFromConcept = (
  text: string,
  transactions: Transaction[]
): ConceptSuggestion[] => {
  const query = normalize(text);
  if (query.length < MIN_CONCEPT_QUERY_LENGTH) return [];

  const sortedByRecency = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Map preserva el orden de inserción: al recorrer de más reciente a más
  // antigua y quedarnos solo con la primera aparición de cada concepto
  // normalizado, el resultado queda ya ordenado por recencia.
  const latestByNormalizedConcept = new Map<string, Transaction>();

  for (const tr of sortedByRecency) {
    const concept = tr.concept?.trim();
    if (!concept) continue;
    const normalizedConcept = normalize(concept);
    if (!normalizedConcept.startsWith(query)) continue;
    if (!latestByNormalizedConcept.has(normalizedConcept)) {
      latestByNormalizedConcept.set(normalizedConcept, tr);
    }
  }

  return Array.from(latestByNormalizedConcept.values())
    .slice(0, MAX_CONCEPT_SUGGESTIONS)
    .map((tr) => ({
      concept: tr.concept,
      categoryId: tr.categoryId,
      subcategoryId: tr.subcategoryId,
      accountId: tr.accountId,
    }));
};
