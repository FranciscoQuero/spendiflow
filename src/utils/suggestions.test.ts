import { rankCategoriesByUsage, suggestFromConcept } from './suggestions';
import { Category, Transaction } from '../types';

const makeCategory = (id: string, overrides: Partial<Category> = {}): Category => ({
  id,
  name: id,
  nameEn: id,
  color: '#000000',
  icon: 'ellipsis-horizontal',
  type: 'expense',
  subcategories: [],
  ...overrides,
});

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: overrides.id ?? Math.random().toString(36).slice(2),
  type: 'expense',
  amount: 10,
  concept: 'Concepto',
  scope: 'personal',
  date: '2026-01-01T00:00:00.000Z',
  month: 1,
  year: 2026,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('rankCategoriesByUsage', () => {
  const casa = makeCategory('casa');
  const comida = makeCategory('comida');
  const ocio = makeCategory('ocio');
  const categories = [casa, comida, ocio];

  it('keeps original order when there is no usage history', () => {
    const result = rankCategoriesByUsage(categories, [], 'expense');
    expect(result.map((c) => c.id)).toEqual(['casa', 'comida', 'ocio']);
  });

  it('sorts by usage frequency descending', () => {
    const transactions: Transaction[] = [
      makeTransaction({ categoryId: 'ocio', date: '2026-01-10T00:00:00.000Z' }),
      makeTransaction({ categoryId: 'ocio', date: '2026-01-09T00:00:00.000Z' }),
      makeTransaction({ categoryId: 'ocio', date: '2026-01-08T00:00:00.000Z' }),
      makeTransaction({ categoryId: 'comida', date: '2026-01-07T00:00:00.000Z' }),
      makeTransaction({ categoryId: 'comida', date: '2026-01-06T00:00:00.000Z' }),
      makeTransaction({ categoryId: 'casa', date: '2026-01-05T00:00:00.000Z' }),
    ];

    const result = rankCategoriesByUsage(categories, transactions, 'expense');
    expect(result.map((c) => c.id)).toEqual(['ocio', 'comida', 'casa']);
  });

  it('ties fall back to the original relative order', () => {
    const transactions: Transaction[] = [
      makeTransaction({ categoryId: 'comida', date: '2026-01-05T00:00:00.000Z' }),
      makeTransaction({ categoryId: 'ocio', date: '2026-01-04T00:00:00.000Z' }),
    ];
    // comida and ocio are tied at 1 use each; casa has 0. Original order: casa, comida, ocio.
    const result = rankCategoriesByUsage(categories, transactions, 'expense');
    expect(result.map((c) => c.id)).toEqual(['comida', 'ocio', 'casa']);
  });

  it('only counts transactions of the matching type', () => {
    const transactions: Transaction[] = [
      makeTransaction({ type: 'income', categoryId: 'comida', date: '2026-01-05T00:00:00.000Z' }),
    ];
    const result = rankCategoriesByUsage(categories, transactions, 'expense');
    expect(result.map((c) => c.id)).toEqual(['casa', 'comida', 'ocio']);
  });

  it('only considers the most recent 200 transactions of that type', () => {
    const oldButFrequent: Transaction[] = Array.from({ length: 50 }, (_, i) =>
      makeTransaction({ categoryId: 'casa', date: `2020-01-${String((i % 27) + 1).padStart(2, '0')}T00:00:00.000Z` })
    );
    const recentWindow: Transaction[] = Array.from({ length: 200 }, (_, i) =>
      makeTransaction({ categoryId: 'ocio', date: `2026-0${(i % 9) + 1}-01T00:00:00.000Z` })
    );
    const transactions = [...oldButFrequent, ...recentWindow];

    const result = rankCategoriesByUsage(categories, transactions, 'expense');
    // "casa" usage falls outside the most recent 200-transaction window, so
    // "ocio" (fully inside the window) should rank first despite fewer total uses.
    expect(result[0].id).toBe('ocio');
  });
});

describe('suggestFromConcept', () => {
  const transactions: Transaction[] = [
    makeTransaction({
      id: '1',
      concept: 'Gimnasio',
      categoryId: 'suscripciones',
      subcategoryId: 'gimnasio-sub',
      accountId: 'acc-1',
      date: '2026-01-01T00:00:00.000Z',
    }),
    makeTransaction({
      id: '2',
      concept: 'Gimnasio',
      categoryId: 'suscripciones',
      subcategoryId: 'gimnasio-sub',
      accountId: 'acc-2',
      date: '2026-02-01T00:00:00.000Z',
    }),
    makeTransaction({
      id: '3',
      concept: 'Gasolina Repsol',
      categoryId: 'otros',
      accountId: 'acc-1',
      date: '2026-01-15T00:00:00.000Z',
    }),
    makeTransaction({
      id: '4',
      concept: 'Galletas',
      categoryId: 'comida',
      accountId: 'acc-1',
      date: '2026-01-10T00:00:00.000Z',
    }),
  ];

  it('returns nothing for queries shorter than 2 characters', () => {
    expect(suggestFromConcept('g', transactions)).toEqual([]);
    expect(suggestFromConcept('', transactions)).toEqual([]);
  });

  it('matches concepts by prefix, case-insensitively, most recent first', () => {
    const result = suggestFromConcept('ga', transactions);
    // Both "Gasolina Repsol" (2026-01-15) and "Galletas" (2026-01-10) match the "ga" prefix.
    expect(result.map((s) => s.concept)).toEqual(['Gasolina Repsol', 'Galletas']);
  });

  it('is accent-insensitive', () => {
    const withAccent: Transaction[] = [
      makeTransaction({ concept: 'Peluquería', categoryId: 'otros', date: '2026-01-01T00:00:00.000Z' }),
    ];
    const result = suggestFromConcept('peluqu', withAccent);
    expect(result.map((s) => s.concept)).toEqual(['Peluquería']);

    const resultWithAccentQuery = suggestFromConcept('peluquería', withAccent);
    expect(resultWithAccentQuery.map((s) => s.concept)).toEqual(['Peluquería']);
  });

  it('deduplicates repeated concepts, keeping the most recent occurrence', () => {
    const result = suggestFromConcept('gim', transactions);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      concept: 'Gimnasio',
      categoryId: 'suscripciones',
      subcategoryId: 'gimnasio-sub',
      accountId: 'acc-2',
    });
  });

  it('returns at most 3 suggestions, ordered by recency', () => {
    const many: Transaction[] = [
      makeTransaction({ concept: 'Ga1', date: '2026-01-01T00:00:00.000Z' }),
      makeTransaction({ concept: 'Ga2', date: '2026-01-03T00:00:00.000Z' }),
      makeTransaction({ concept: 'Ga3', date: '2026-01-02T00:00:00.000Z' }),
      makeTransaction({ concept: 'Ga4', date: '2026-01-04T00:00:00.000Z' }),
    ];
    const result = suggestFromConcept('ga', many);
    expect(result.map((s) => s.concept)).toEqual(['Ga4', 'Ga2', 'Ga3']);
  });

  it('ignores transactions with an empty concept', () => {
    const withEmpty: Transaction[] = [
      makeTransaction({ concept: '', date: '2026-01-01T00:00:00.000Z' }),
      makeTransaction({ concept: '   ', date: '2026-01-02T00:00:00.000Z' }),
    ];
    expect(suggestFromConcept('ga', withEmpty)).toEqual([]);
  });
});
