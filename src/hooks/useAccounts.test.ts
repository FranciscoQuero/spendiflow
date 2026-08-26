import {
  getAccountBalance,
  getAvailableBalance,
  getNetWorth,
} from './useAccounts';
import { BankAccount, Debt, Investment, Provision } from '../types';

const makeAccount = (overrides: Partial<BankAccount> = {}): BankAccount => ({
  id: 'acc-1',
  name: 'Cuenta',
  bankName: 'Banco',
  role: 'personal',
  ownershipShare: 1,
  archived: false,
  balanceHistory: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('getAccountBalance', () => {
  it('returns the entry with the latest date, not the last one in the array', () => {
    const account = makeAccount({
      balanceHistory: [
        { id: 'b1', amount: 100, date: '2026-03-01' },
        { id: 'b2', amount: 50, date: '2026-01-01' }, // inserted out of chronological order
        { id: 'b3', amount: 200, date: '2026-02-01' },
      ],
    });

    expect(getAccountBalance(account)).toBe(100);
  });

  it('returns 0 when there is no balance history', () => {
    expect(getAccountBalance(makeAccount())).toBe(0);
  });
});

describe('getAvailableBalance', () => {
  it('subtracts the floor and the provisioned total from the balance', () => {
    const account = makeAccount({
      floor: 200,
      balanceHistory: [{ id: 'b1', amount: 1000, date: '2026-01-01' }],
    });
    const provisions: Provision[] = [
      {
        id: 'prov-1',
        accountId: 'acc-1',
        name: 'Vacaciones',
        icon: 'airplane',
        color: '#000',
        entries: [
          { id: 'e1', amount: 300, date: '2026-01-01' },
          { id: 'e2', amount: -50, date: '2026-01-15' },
        ],
        archived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        // archived provisions must not count towards the provisioned total
        id: 'prov-2',
        accountId: 'acc-1',
        name: 'Vieja',
        icon: 'archive',
        color: '#000',
        entries: [{ id: 'e3', amount: 999, date: '2026-01-01' }],
        archived: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    // 1000 - floor(200) - provisioned(300 - 50 = 250) = 550
    expect(getAvailableBalance(account, provisions)).toBe(550);
  });

  it('treats a missing floor as 0', () => {
    const account = makeAccount({
      balanceHistory: [{ id: 'b1', amount: 500, date: '2026-01-01' }],
    });
    expect(getAvailableBalance(account, [])).toBe(500);
  });
});

describe('getNetWorth', () => {
  it('weighs accounts by ownershipShare, adds investments, and nets debts in both directions', () => {
    const accounts: BankAccount[] = [
      makeAccount({
        id: 'acc-1',
        ownershipShare: 0.5,
        balanceHistory: [{ id: 'b1', amount: 1000, date: '2026-01-01' }],
      }),
      makeAccount({
        id: 'acc-2',
        archived: true, // must be excluded entirely
        balanceHistory: [{ id: 'b2', amount: 99999, date: '2026-01-01' }],
      }),
    ];

    const investments: Investment[] = [
      {
        id: 'inv-1',
        name: 'Fondo',
        type: 'fund',
        contributions: [],
        currentValue: 300,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const debts: Debt[] = [
      {
        id: 'debt-1',
        creditorName: 'Banco',
        totalAmount: 1000,
        payments: [{ id: 'p1', amount: 200, date: '2026-01-01', kind: 'installment' }],
        direction: 'iOwe', // outstanding 800
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'debt-2',
        creditorName: 'Amigo',
        totalAmount: 400,
        payments: [{ id: 'p2', amount: 100, date: '2026-01-01', kind: 'installment' }],
        direction: 'owedToMe', // outstanding 300
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    // accounts: 1000 * 0.5 = 500 (archived account excluded)
    // + investments: 300
    // - iOwe outstanding: 800
    // + owedToMe outstanding: 300
    // = 500 + 300 - 800 + 300 = 300
    expect(getNetWorth(accounts, investments, debts)).toBe(300);
  });
});
