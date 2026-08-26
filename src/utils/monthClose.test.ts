import {
  computePreviousNetWorth,
  getAccountBalanceDiffs,
  getPreviousAccountBalance,
  hasBalanceEntryInMonth,
  getDebtsNetImpact,
} from './monthClose';
import { BankAccount, Debt, Investment } from '../types';

const makeAccount = (overrides: Partial<BankAccount> = {}): BankAccount => ({
  id: 'a1',
  name: 'Cuenta',
  bankName: 'Banco',
  role: 'personal',
  ownershipShare: 1,
  archived: false,
  balanceHistory: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeInvestment = (overrides: Partial<Investment> = {}): Investment => ({
  id: 'i1',
  name: 'Fondo',
  type: 'fund',
  contributions: [],
  valueHistory: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeDebt = (overrides: Partial<Debt> = {}): Debt => ({
  id: 'd1',
  creditorName: 'Acreedor',
  totalAmount: 1000,
  payments: [],
  direction: 'iOwe',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('computePreviousNetWorth', () => {
  it('primer cierre sin histórico: devuelve undefined', () => {
    const accounts = [makeAccount({ balanceHistory: [{ id: 'b1', amount: 1000, date: '2026-08-26' }] })];
    const result = computePreviousNetWorth(accounts, [], []);
    expect(result).toBeUndefined();
  });

  it('cuenta compartida al 50% pondera el saldo anterior', () => {
    const accounts = [
      makeAccount({
        ownershipShare: 0.5,
        balanceHistory: [
          { id: 'b1', amount: 2000, date: '2026-07-26' }, // previous
          { id: 'b2', amount: 2400, date: '2026-08-26' }, // current
        ],
      }),
    ];
    const result = computePreviousNetWorth(accounts, [], []);
    // previous balance 2000 * 0.5 share = 1000
    expect(result).toBe(1000);
  });

  it('cuenta archivada queda excluida del patrimonio previo', () => {
    const accounts = [
      makeAccount({
        id: 'active',
        balanceHistory: [
          { id: 'b1', amount: 500, date: '2026-07-26' },
          { id: 'b2', amount: 600, date: '2026-08-26' },
        ],
      }),
      makeAccount({
        id: 'archived',
        archived: true,
        balanceHistory: [
          { id: 'b1', amount: 9000, date: '2026-07-26' },
          { id: 'b2', amount: 9500, date: '2026-08-26' },
        ],
      }),
    ];
    const result = computePreviousNetWorth(accounts, [], []);
    expect(result).toBe(500);
  });

  it('deuda owedToMe suma en vez de restar', () => {
    const accounts = [
      makeAccount({
        balanceHistory: [
          { id: 'b1', amount: 100, date: '2026-07-26' },
          { id: 'b2', amount: 100, date: '2026-08-26' },
        ],
      }),
    ];
    const debts = [
      makeDebt({ id: 'iOwe', direction: 'iOwe', totalAmount: 300, payments: [] }),
      makeDebt({ id: 'owedToMe', direction: 'owedToMe', totalAmount: 200, payments: [] }),
    ];
    const result = computePreviousNetWorth(accounts, [], debts);
    // 100 (account) - 300 (iOwe) + 200 (owedToMe) = 0
    expect(result).toBe(0);
  });

  it('usa el valor previo del histórico de la inversión cuando existe', () => {
    const accounts = [makeAccount()];
    const investments = [
      makeInvestment({
        valueHistory: [
          { id: 'v1', value: 500, date: '2026-07-26' }, // previous
          { id: 'v2', value: 600, date: '2026-08-26' }, // current
        ],
      }),
    ];
    const result = computePreviousNetWorth(accounts, investments, []);
    expect(result).toBe(500);
  });

  it('inversión sin histórico: no aporta valor previo (primer cierre de esa inversión)', () => {
    const accounts = [
      makeAccount({
        balanceHistory: [
          { id: 'b1', amount: 100, date: '2026-07-26' },
          { id: 'b2', amount: 100, date: '2026-08-26' },
        ],
      }),
    ];
    const investments = [makeInvestment({ valueHistory: [] })];
    const result = computePreviousNetWorth(accounts, investments, []);
    // sin aporte de la inversión (sin histórico): solo el saldo previo de la cuenta
    expect(result).toBe(100);
  });

  it('inversión con una sola entrada: no hay valor previo con el que comparar', () => {
    const accounts = [
      makeAccount({
        balanceHistory: [
          { id: 'b1', amount: 100, date: '2026-07-26' },
          { id: 'b2', amount: 100, date: '2026-08-26' },
        ],
      }),
    ];
    const investments = [
      makeInvestment({ valueHistory: [{ id: 'v1', value: 500, date: '2026-08-26' }] }),
    ];
    const result = computePreviousNetWorth(accounts, investments, []);
    expect(result).toBe(100);
  });

  it('dos cierres el mismo día: la sustitución deja una sola entrada por fecha, sin duplicar el previo', () => {
    const accounts = [makeAccount()];
    const investments = [
      makeInvestment({
        valueHistory: [
          { id: 'v1', value: 400, date: '2026-07-26' }, // cierre del mes anterior
          // El cierre de agosto se declaró dos veces el mismo día; la
          // acción del store sustituye la primera entrada de ese día, así
          // que el histórico persistido nunca contiene un duplicado.
          { id: 'v2', value: 700, date: '2026-08-26' },
        ],
      }),
    ];
    const result = computePreviousNetWorth(accounts, investments, []);
    expect(result).toBe(400);
  });
});

describe('getPreviousAccountBalance', () => {
  it('devuelve undefined con 0 o 1 entradas', () => {
    expect(getPreviousAccountBalance(makeAccount({ balanceHistory: [] }))).toBeUndefined();
    expect(
      getPreviousAccountBalance(
        makeAccount({ balanceHistory: [{ id: 'b1', amount: 100, date: '2026-08-01' }] })
      )
    ).toBeUndefined();
  });

  it('devuelve el penúltimo saldo ordenado por fecha', () => {
    const account = makeAccount({
      balanceHistory: [
        { id: 'b2', amount: 200, date: '2026-08-26' },
        { id: 'b1', amount: 100, date: '2026-07-26' },
        { id: 'b0', amount: 50, date: '2026-06-26' },
      ],
    });
    expect(getPreviousAccountBalance(account)).toBe(100);
  });
});

describe('hasBalanceEntryInMonth', () => {
  it('detecta una entrada dentro del mes/año dado', () => {
    const account = makeAccount({
      balanceHistory: [{ id: 'b1', amount: 100, date: '2026-08-05T00:00:00.000Z' }],
    });
    expect(hasBalanceEntryInMonth(account, 8, 2026)).toBe(true);
    expect(hasBalanceEntryInMonth(account, 7, 2026)).toBe(false);
  });
});

describe('getAccountBalanceDiffs', () => {
  it('excluye cuentas archivadas y calcula la diferencia', () => {
    const accounts = [
      makeAccount({
        id: 'a1',
        balanceHistory: [
          { id: 'b1', amount: 100, date: '2026-07-26' },
          { id: 'b2', amount: 150, date: '2026-08-26' },
        ],
      }),
      makeAccount({ id: 'archived', archived: true }),
    ];
    const diffs = getAccountBalanceDiffs(accounts);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({ accountId: 'a1', current: 150, previous: 100, diff: 50 });
  });
});

describe('getDebtsNetImpact', () => {
  it('resta lo que debo y suma lo que me deben', () => {
    const debts = [
      makeDebt({ id: 'd1', direction: 'iOwe', totalAmount: 400, payments: [{ id: 'p1', amount: 100, date: '2026-08-01', kind: 'installment' }] }),
      makeDebt({ id: 'd2', direction: 'owedToMe', totalAmount: 250, payments: [] }),
    ];
    // outstanding iOwe = 300, owedToMe = 250 -> net = 250 - 300 = -50
    expect(getDebtsNetImpact(debts)).toBe(-50);
  });
});
