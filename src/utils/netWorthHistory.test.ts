import { computeMonthlyNetWorthSeries } from './netWorthHistory';
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

const REFERENCE = new Date('2026-08-26T12:00:00.000Z');

describe('computeMonthlyNetWorthSeries', () => {
  it('devuelve serie vacía cuando no hay ningún BalanceEntry ni InvestmentValueEntry', () => {
    expect(computeMonthlyNetWorthSeries([], [], [], 12, REFERENCE)).toEqual([]);
    expect(
      computeMonthlyNetWorthSeries([makeAccount({ balanceHistory: [] })], [], [], 12, REFERENCE)
    ).toEqual([]);
  });

  it('arrastra el último saldo conocido en los meses sin entrada propia', () => {
    const accounts = [
      makeAccount({
        balanceHistory: [
          { id: 'b1', amount: 100, date: '2026-06-10' },
          { id: 'b2', amount: 300, date: '2026-08-10' },
        ],
      }),
    ];

    const result = computeMonthlyNetWorthSeries(accounts, [], [], 12, REFERENCE);

    expect(result).toEqual([
      { year: 2026, month: 6, value: 100 },
      { year: 2026, month: 7, value: 100 }, // arrastrado desde junio, sin entrada propia
      { year: 2026, month: 8, value: 300 },
    ]);
  });

  it('pondera una cuenta compartida por su ownershipShare', () => {
    const accounts = [
      makeAccount({
        ownershipShare: 0.5,
        balanceHistory: [{ id: 'b1', amount: 1000, date: '2026-08-01' }],
      }),
    ];

    const result = computeMonthlyNetWorthSeries(accounts, [], [], 12, REFERENCE);

    expect(result).toEqual([{ year: 2026, month: 8, value: 500 }]);
  });

  it('excluye las cuentas archivadas del cálculo', () => {
    const accounts = [
      makeAccount({
        id: 'active',
        balanceHistory: [{ id: 'b1', amount: 100, date: '2026-08-01' }],
      }),
      makeAccount({
        id: 'archived',
        archived: true,
        balanceHistory: [{ id: 'b1', amount: 9999, date: '2026-08-01' }],
      }),
    ];

    const result = computeMonthlyNetWorthSeries(accounts, [], [], 12, REFERENCE);

    expect(result).toEqual([{ year: 2026, month: 8, value: 100 }]);
  });

  it('suma el valor de las inversiones arrastrando el último valor conocido', () => {
    const accounts = [
      makeAccount({ balanceHistory: [{ id: 'b1', amount: 0, date: '2026-06-01' }] }),
    ];
    const investments = [
      makeInvestment({
        valueHistory: [
          { id: 'v1', value: 500, date: '2026-06-15' },
          { id: 'v2', value: 800, date: '2026-08-05' },
        ],
      }),
    ];

    const result = computeMonthlyNetWorthSeries(accounts, investments, [], 12, REFERENCE);

    expect(result).toEqual([
      { year: 2026, month: 6, value: 500 },
      { year: 2026, month: 7, value: 500 }, // arrastrado desde junio
      { year: 2026, month: 8, value: 800 },
    ]);
  });

  it('una deuda iOwe con pagos fechados reduce el pendiente mes a mes', () => {
    const accounts = [
      makeAccount({ balanceHistory: [{ id: 'b1', amount: 1000, date: '2026-06-01' }] }),
    ];
    const debts = [
      makeDebt({
        direction: 'iOwe',
        totalAmount: 900,
        payments: [
          { id: 'p1', amount: 300, date: '2026-06-15', kind: 'installment' },
          { id: 'p2', amount: 300, date: '2026-07-15', kind: 'installment' },
        ],
      }),
    ];

    const result = computeMonthlyNetWorthSeries(accounts, [], debts, 12, REFERENCE);

    expect(result).toEqual([
      { year: 2026, month: 6, value: 400 }, // 1000 - (900 - 300 pagado)
      { year: 2026, month: 7, value: 700 }, // 1000 - (900 - 600 pagado)
      { year: 2026, month: 8, value: 700 }, // sin nuevo pago, mismo pendiente
    ]);
  });

  it('una deuda owedToMe suma su pendiente en vez de restarlo', () => {
    const accounts = [
      makeAccount({ balanceHistory: [{ id: 'b1', amount: 1000, date: '2026-08-01' }] }),
    ];
    const debts = [
      makeDebt({
        direction: 'owedToMe',
        totalAmount: 500,
        payments: [{ id: 'p1', amount: 200, date: '2026-08-10', kind: 'installment' }],
      }),
    ];

    const result = computeMonthlyNetWorthSeries(accounts, [], debts, 12, REFERENCE);

    // 1000 (cuenta) + (500 - 200 cobrado) = 1300
    expect(result).toEqual([{ year: 2026, month: 8, value: 1300 }]);
  });

  it('limita la serie a los monthsBack meses más recientes (cap por defecto de 12)', () => {
    const accounts = [
      makeAccount({ balanceHistory: [{ id: 'b1', amount: 100, date: '2024-01-15' }] }),
    ];

    const result = computeMonthlyNetWorthSeries(accounts, [], [], 12, REFERENCE);

    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ year: 2025, month: 9, value: 100 });
    expect(result[result.length - 1]).toEqual({ year: 2026, month: 8, value: 100 });
  });

  it('respeta un monthsBack distinto del valor por defecto', () => {
    const accounts = [
      makeAccount({ balanceHistory: [{ id: 'b1', amount: 50, date: '2026-01-01' }] }),
    ];

    const result = computeMonthlyNetWorthSeries(accounts, [], [], 3, REFERENCE);

    expect(result).toHaveLength(3);
    expect(result.map((p) => `${p.year}-${p.month}`)).toEqual(['2026-6', '2026-7', '2026-8']);
  });
});
