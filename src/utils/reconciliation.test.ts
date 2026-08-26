import { computeImpliedBalance, computeDiscrepancy } from './reconciliation';
import { BankAccount, Transaction } from '../types';

const makeAccount = (overrides: Partial<BankAccount> = {}): BankAccount => ({
  id: 'a1',
  name: 'Cartera',
  bankName: '',
  role: 'cash',
  ownershipShare: 1,
  archived: false,
  balanceHistory: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx1',
  type: 'expense',
  amount: 10,
  concept: 'Test',
  scope: 'personal',
  date: '2026-08-10T00:00:00.000Z',
  month: 8,
  year: 2026,
  createdAt: '2026-08-10T00:00:00.000Z',
  ...overrides,
});

describe('computeImpliedBalance', () => {
  const fromDate = '2026-08-01T00:00:00.000Z';
  const toDate = '2026-08-31T00:00:00.000Z';

  it('sin saldo previo (fromDate ausente): devuelve null', () => {
    const account = makeAccount({ balanceHistory: [] });
    expect(computeImpliedBalance(account, [], undefined, toDate)).toBeNull();
  });

  it('sin saldo previo (ninguna entrada en o antes de fromDate): devuelve null', () => {
    const account = makeAccount({
      balanceHistory: [{ id: 'b1', amount: 100, date: '2026-08-15T00:00:00.000Z' }],
    });
    // fromDate anterior a la única entrada existente -> no hay base
    expect(computeImpliedBalance(account, [], fromDate, toDate)).toBeNull();
  });

  it('sin movimientos: el saldo implícito es igual al saldo base', () => {
    const account = makeAccount({
      balanceHistory: [{ id: 'b1', amount: 200, date: fromDate }],
    });
    expect(computeImpliedBalance(account, [], fromDate, toDate)).toBe(200);
  });

  it('mezcla de tipos: ingreso suma, gasto resta, transacciones de otras cuentas se ignoran', () => {
    const account = makeAccount({
      balanceHistory: [{ id: 'b1', amount: 100, date: fromDate }],
    });
    const transactions = [
      makeTx({ id: 't1', type: 'income', amount: 50, accountId: 'a1', date: '2026-08-05T00:00:00.000Z' }),
      makeTx({ id: 't2', type: 'expense', amount: 30, accountId: 'a1', date: '2026-08-10T00:00:00.000Z' }),
      makeTx({ id: 't3', type: 'expense', amount: 999, accountId: 'other', date: '2026-08-12T00:00:00.000Z' }),
    ];
    // 100 + 50 - 30 = 120 (t3 pertenece a otra cuenta, se ignora)
    expect(computeImpliedBalance(account, transactions, fromDate, toDate)).toBe(120);
  });

  it('transferencias en ambos sentidos: resta como origen, suma como destino', () => {
    const account = makeAccount({
      balanceHistory: [{ id: 'b1', amount: 100, date: fromDate }],
    });
    const transactions = [
      makeTx({
        id: 't1',
        type: 'transfer',
        amount: 40,
        accountId: 'a1',
        toAccountId: 'other',
        date: '2026-08-05T00:00:00.000Z',
      }),
      makeTx({
        id: 't2',
        type: 'transfer',
        amount: 25,
        accountId: 'other',
        toAccountId: 'a1',
        date: '2026-08-10T00:00:00.000Z',
      }),
    ];
    // 100 - 40 (origen) + 25 (destino) = 85
    expect(computeImpliedBalance(account, transactions, fromDate, toDate)).toBe(85);
  });

  it('ignora movimientos fuera del rango (antes de fromDate o después de toDate)', () => {
    const account = makeAccount({
      balanceHistory: [{ id: 'b1', amount: 100, date: fromDate }],
    });
    const transactions = [
      makeTx({ id: 't1', type: 'income', amount: 999, accountId: 'a1', date: '2026-07-15T00:00:00.000Z' }),
      makeTx({ id: 't2', type: 'income', amount: 999, accountId: 'a1', date: '2026-09-15T00:00:00.000Z' }),
      makeTx({ id: 't3', type: 'income', amount: 10, accountId: 'a1', date: fromDate }),
    ];
    // t1 y t2 fuera de rango; t3 en fromDate exacto también se excluye (estrictamente posterior)
    expect(computeImpliedBalance(account, transactions, fromDate, toDate)).toBe(100);
  });
});

describe('computeDiscrepancy', () => {
  it('devuelve null cuando no hay saldo implícito', () => {
    expect(computeDiscrepancy(150, null)).toBeNull();
  });

  it('positivo cuando el usuario declara más de lo esperado (sobra dinero)', () => {
    expect(computeDiscrepancy(150, 120)).toBe(30);
  });

  it('negativo cuando el usuario declara menos de lo esperado (falta dinero)', () => {
    expect(computeDiscrepancy(90, 120)).toBe(-30);
  });

  it('cero cuando coincide exactamente', () => {
    expect(computeDiscrepancy(120, 120)).toBe(0);
  });
});
