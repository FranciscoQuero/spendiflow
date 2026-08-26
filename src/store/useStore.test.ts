import { migrate } from './useStore';
import { Transaction, BankAccount, Debt } from '../types';

describe('migrate (persist v0/v1 -> v2)', () => {
  it('fills defaults on a realistic pre-v2 state', () => {
    const legacyState = {
      transactions: [
        {
          id: 't1',
          type: 'expense',
          amount: 42,
          concept: 'Cena',
          categoryId: 'comida',
          date: '2026-01-10T00:00:00.000Z',
          month: 1,
          year: 2026,
          createdAt: '2026-01-10T00:00:00.000Z',
        },
      ],
      bankAccounts: [
        {
          id: 'a1',
          name: 'Cuenta principal',
          bankName: 'BBVA',
          balanceHistory: [{ id: 'b1', amount: 1000, date: '2026-01-01' }],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      investments: [],
      debts: [
        {
          id: 'd1',
          creditorName: 'Banco',
          totalAmount: 5000,
          payments: [
            { id: 'p1', amount: 100, date: '2026-01-15' },
          ],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      settings: {
        language: 'es',
        currency: 'EUR',
        currencySymbol: '€',
        theme: 'system',
      },
    };

    const migrated = migrate(legacyState);

    const [transaction] = migrated.transactions as Transaction[];
    expect(transaction.scope).toBe('personal');

    const [account] = migrated.bankAccounts as BankAccount[];
    expect(account.role).toBe('personal');
    expect(account.ownershipShare).toBe(1);
    expect(account.archived).toBe(false);

    const [debt] = migrated.debts as Debt[];
    expect(debt.direction).toBe('iOwe');
    expect(debt.payments[0].kind).toBe('installment');

    expect(migrated.provisions).toEqual([]);
    expect(migrated.recurringRules).toEqual([]);
    expect(migrated.plannedEvents).toEqual([]);
  });

  it('is robust against undefined/empty persisted state', () => {
    const migrated = migrate(undefined);

    expect(migrated.transactions).toEqual([]);
    expect(migrated.bankAccounts).toEqual([]);
    expect(migrated.investments).toEqual([]);
    expect(migrated.debts).toEqual([]);
    expect(migrated.provisions).toEqual([]);
    expect(migrated.recurringRules).toEqual([]);
    expect(migrated.plannedEvents).toEqual([]);
    expect(migrated.categories.length).toBeGreaterThan(0);
    expect(migrated.settings.language).toBe('es');
  });

  it('is robust against a partial persisted state', () => {
    const migrated = migrate({ transactions: [{ id: 't1' }] });

    expect(migrated.transactions[0]).toMatchObject({ id: 't1', scope: 'personal' });
    expect(migrated.bankAccounts).toEqual([]);
    expect(migrated.settings.currencySymbol).toBe('€');
  });
});
