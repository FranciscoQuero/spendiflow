import { normalizeSearchText, filterTransactions } from './search';
import { Transaction } from '../types';

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: overrides.id ?? 'tx-1',
  type: 'expense',
  amount: 10,
  concept: 'Café con Núñez',
  scope: 'personal',
  date: '2026-01-10T00:00:00.000Z',
  month: 1,
  year: 2026,
  createdAt: '2026-01-10T00:00:00.000Z',
  ...overrides,
});

describe('normalizeSearchText', () => {
  it('lowercases the text', () => {
    expect(normalizeSearchText('SUPERMERCADO')).toBe('supermercado');
  });

  it('strips accents and diacritics', () => {
    expect(normalizeSearchText('Café Núñez')).toBe('cafe nunez');
    expect(normalizeSearchText('Habitación')).toBe('habitacion');
  });

  it('trims and collapses extra whitespace', () => {
    expect(normalizeSearchText('  gimnasio   mensual  ')).toBe('gimnasio mensual');
  });

  it('returns an empty string for empty or whitespace-only input', () => {
    expect(normalizeSearchText('')).toBe('');
    expect(normalizeSearchText('   ')).toBe('');
  });
});

describe('filterTransactions', () => {
  const transactions: Transaction[] = [
    makeTransaction({ id: 't1', concept: 'Café con Núñez', note: undefined }),
    makeTransaction({ id: 't2', concept: 'Supermercado', note: 'Compra semanal' }),
    makeTransaction({ id: 't3', concept: 'Gimnasio', note: 'Cuota habitación' }),
    makeTransaction({ id: 't4', concept: 'Netflix', note: undefined }),
  ];

  it('returns all transactions when the query is empty', () => {
    expect(filterTransactions(transactions, '')).toEqual(transactions);
    expect(filterTransactions(transactions, '   ')).toEqual(transactions);
  });

  it('matches by concept, case-insensitively', () => {
    const result = filterTransactions(transactions, 'SUPERMERCADO');
    expect(result.map((t) => t.id)).toEqual(['t2']);
  });

  it('matches by concept ignoring accents', () => {
    const result = filterTransactions(transactions, 'nunez');
    expect(result.map((t) => t.id)).toEqual(['t1']);
  });

  it('matches by note content, ignoring accents', () => {
    const result = filterTransactions(transactions, 'habitacion');
    expect(result.map((t) => t.id)).toEqual(['t3']);
  });

  it('matches substrings, not only full words', () => {
    const result = filterTransactions(transactions, 'sema');
    expect(result.map((t) => t.id)).toEqual(['t2']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterTransactions(transactions, 'inexistente')).toEqual([]);
  });
});
