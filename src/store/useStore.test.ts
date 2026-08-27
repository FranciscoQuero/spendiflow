import { migrate, useStore } from './useStore';
import { Transaction, BankAccount, Debt, Investment } from '../types';

describe('migrate (persist v0/v1/v2 -> v3)', () => {
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

  it('seeds valueHistory from currentValue/lastUpdated on a pre-v3 investment', () => {
    const legacyState = {
      investments: [
        {
          id: 'i1',
          name: 'Fondo indexado',
          type: 'fund',
          contributions: [],
          currentValue: 1200,
          lastUpdated: '2026-06-15T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    const migrated = migrate(legacyState);
    const [investment] = migrated.investments as Investment[];

    expect(investment.valueHistory).toHaveLength(1);
    expect(investment.valueHistory[0]).toMatchObject({
      value: 1200,
      date: '2026-06-15T00:00:00.000Z',
    });
    expect(investment.currentValue).toBe(1200);
  });

  it('falls back to createdAt for the seeded entry date when lastUpdated is missing', () => {
    const legacyState = {
      investments: [
        {
          id: 'i1',
          name: 'Fondo',
          type: 'fund',
          contributions: [],
          currentValue: 800,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ],
    };

    const migrated = migrate(legacyState);
    const [investment] = migrated.investments as Investment[];

    expect(investment.valueHistory[0]).toMatchObject({
      value: 800,
      date: '2026-02-01T00:00:00.000Z',
    });
  });

  it('gives an investment with no currentValue an empty valueHistory', () => {
    const legacyState = {
      investments: [
        {
          id: 'i1',
          name: 'Cripto',
          type: 'crypto',
          contributions: [],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    const migrated = migrate(legacyState);
    const [investment] = migrated.investments as Investment[];
    expect(investment.valueHistory).toEqual([]);
  });

  it('is robust against undefined/empty persisted state, chained from v0', () => {
    const migrated = migrate(undefined);
    expect(migrated.investments).toEqual([]);
  });
});

describe('migrate (dailyReminder, non-destructive)', () => {
  it('leaves dailyReminder undefined when it was never set', () => {
    const migrated = migrate({ settings: { language: 'es' } });
    expect(migrated.settings.dailyReminder).toBeUndefined();
  });

  it('carries forward a valid dailyReminder untouched', () => {
    const legacyState = {
      settings: { language: 'es', dailyReminder: { enabled: true, hour: 21, minute: 30 } },
    };
    const migrated = migrate(legacyState);
    expect(migrated.settings.dailyReminder).toEqual({ enabled: true, hour: 21, minute: 30 });
  });

  it('discards a dailyReminder with an out-of-range or malformed shape', () => {
    const migrated = migrate({
      settings: { language: 'es', dailyReminder: { enabled: true, hour: 25, minute: 0 } },
    });
    expect(migrated.settings.dailyReminder).toBeUndefined();

    const migratedMissingField = migrate({
      settings: { language: 'es', dailyReminder: { enabled: true, hour: 21 } },
    });
    expect(migratedMissingField.settings.dailyReminder).toBeUndefined();
  });
});

describe('addInvestmentValueEntry', () => {
  beforeEach(() => {
    useStore.getState().resetAllData();
  });

  it('appends an entry and updates the currentValue/lastUpdated cache from the latest entry by date', () => {
    const investmentId = useStore.getState().addInvestment({ name: 'Fondo', type: 'fund' });

    useStore.getState().addInvestmentValueEntry(investmentId, {
      value: 1000,
      date: '2026-07-01T00:00:00.000Z',
    });
    useStore.getState().addInvestmentValueEntry(investmentId, {
      value: 1100,
      date: '2026-08-01T00:00:00.000Z',
    });

    const investment = useStore.getState().investments.find((i) => i.id === investmentId);
    expect(investment?.valueHistory).toHaveLength(2);
    expect(investment?.currentValue).toBe(1100);
    expect(investment?.lastUpdated).toBe('2026-08-01T00:00:00.000Z');
  });

  it('replaces the same-day entry instead of duplicating it', () => {
    const investmentId = useStore.getState().addInvestment({ name: 'Fondo', type: 'fund' });

    useStore.getState().addInvestmentValueEntry(investmentId, {
      value: 1000,
      date: '2026-08-26T09:00:00.000Z',
    });
    useStore.getState().addInvestmentValueEntry(investmentId, {
      value: 1050,
      date: '2026-08-26T18:00:00.000Z',
    });

    const investment = useStore.getState().investments.find((i) => i.id === investmentId);
    expect(investment?.valueHistory).toHaveLength(1);
    expect(investment?.valueHistory[0].value).toBe(1050);
    expect(investment?.currentValue).toBe(1050);
  });
});

describe('deleteInvestmentValueEntry', () => {
  beforeEach(() => {
    useStore.getState().resetAllData();
  });

  it('removes the entry and recomputes the currentValue/lastUpdated cache', () => {
    const investmentId = useStore.getState().addInvestment({ name: 'Fondo', type: 'fund' });

    useStore.getState().addInvestmentValueEntry(investmentId, {
      value: 1000,
      date: '2026-07-01T00:00:00.000Z',
    });
    useStore.getState().addInvestmentValueEntry(investmentId, {
      value: 1100,
      date: '2026-08-01T00:00:00.000Z',
    });

    const entryToDelete = useStore
      .getState()
      .investments.find((i) => i.id === investmentId)!
      .valueHistory.find((e) => e.value === 1100)!;

    useStore.getState().deleteInvestmentValueEntry(investmentId, entryToDelete.id);

    const investment = useStore.getState().investments.find((i) => i.id === investmentId);
    expect(investment?.valueHistory).toHaveLength(1);
    expect(investment?.currentValue).toBe(1000);
    expect(investment?.lastUpdated).toBe('2026-07-01T00:00:00.000Z');
  });

  it('clears the cache when the last remaining entry is deleted', () => {
    const investmentId = useStore.getState().addInvestment({ name: 'Fondo', type: 'fund' });

    useStore.getState().addInvestmentValueEntry(investmentId, {
      value: 1000,
      date: '2026-07-01T00:00:00.000Z',
    });

    const [entry] = useStore
      .getState()
      .investments.find((i) => i.id === investmentId)!.valueHistory;

    useStore.getState().deleteInvestmentValueEntry(investmentId, entry.id);

    const investment = useStore.getState().investments.find((i) => i.id === investmentId);
    expect(investment?.valueHistory).toEqual([]);
    expect(investment?.currentValue).toBeUndefined();
    expect(investment?.lastUpdated).toBeUndefined();
  });
});

describe('updateSubcategory', () => {
  beforeEach(() => {
    useStore.getState().resetAllData();
  });

  it('renames the subcategory in place, keeping its id and categoryId', () => {
    const categoryId = useStore.getState().addCategory({
      name: 'Ocio',
      nameEn: 'Leisure',
      color: '#000000',
      icon: 'game-controller',
      type: 'expense',
    });
    useStore.getState().addSubcategory(categoryId, 'Cine', 'Movies');

    const subcategoryId = useStore
      .getState()
      .categories.find((c) => c.id === categoryId)!.subcategories[0].id;

    useStore.getState().updateSubcategory(categoryId, subcategoryId, {
      name: 'Cine y teatro',
      nameEn: 'Movies and theatre',
    });

    const subcategory = useStore
      .getState()
      .categories.find((c) => c.id === categoryId)!.subcategories[0];

    expect(subcategory.id).toBe(subcategoryId);
    expect(subcategory.categoryId).toBe(categoryId);
    expect(subcategory.name).toBe('Cine y teatro');
    expect(subcategory.nameEn).toBe('Movies and theatre');
  });

  it('supports a partial update, leaving the other name untouched', () => {
    const categoryId = useStore.getState().addCategory({
      name: 'Ocio',
      nameEn: 'Leisure',
      color: '#000000',
      icon: 'game-controller',
      type: 'expense',
    });
    useStore.getState().addSubcategory(categoryId, 'Cine', 'Movies');

    const subcategoryId = useStore
      .getState()
      .categories.find((c) => c.id === categoryId)!.subcategories[0].id;

    useStore.getState().updateSubcategory(categoryId, subcategoryId, { name: 'Cine ES' });

    const subcategory = useStore
      .getState()
      .categories.find((c) => c.id === categoryId)!.subcategories[0];

    expect(subcategory.name).toBe('Cine ES');
    expect(subcategory.nameEn).toBe('Movies');
  });

  it('does not affect subcategories of other categories', () => {
    const categoryId = useStore.getState().addCategory({
      name: 'Ocio',
      nameEn: 'Leisure',
      color: '#000000',
      icon: 'game-controller',
      type: 'expense',
    });
    const otherCategoryId = useStore.getState().addCategory({
      name: 'Casa',
      nameEn: 'Housing',
      color: '#111111',
      icon: 'home',
      type: 'expense',
    });
    useStore.getState().addSubcategory(categoryId, 'Cine', 'Movies');
    useStore.getState().addSubcategory(otherCategoryId, 'Luz', 'Electricity');

    const subcategoryId = useStore
      .getState()
      .categories.find((c) => c.id === categoryId)!.subcategories[0].id;

    useStore.getState().updateSubcategory(categoryId, subcategoryId, { name: 'Cine ES' });

    const otherSubcategory = useStore
      .getState()
      .categories.find((c) => c.id === otherCategoryId)!.subcategories[0];
    expect(otherSubcategory.name).toBe('Luz');
  });
});
