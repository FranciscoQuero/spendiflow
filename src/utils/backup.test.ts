import { validateBackup, BACKUP_APP_ID, BACKUP_SCHEMA_VERSION, summarizeBackup } from './backup';

const validV2Backup = {
  app: 'spendiflow',
  schemaVersion: 2,
  exportedAt: '2026-01-10T00:00:00.000Z',
  data: {
    transactions: [
      {
        id: 't1',
        type: 'expense',
        amount: 42,
        concept: 'Cena',
        categoryId: 'comida',
        scope: 'personal',
        date: '2026-01-10T00:00:00.000Z',
        month: 1,
        year: 2026,
        createdAt: '2026-01-10T00:00:00.000Z',
      },
    ],
    categories: [
      { id: 'comida', name: 'Comida', nameEn: 'Food', color: '#000', icon: 'restaurant', type: 'expense', subcategories: [] },
    ],
    bankAccounts: [
      {
        id: 'a1',
        name: 'Cuenta principal',
        bankName: 'BBVA',
        role: 'personal',
        ownershipShare: 1,
        archived: false,
        balanceHistory: [],
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    investments: [],
    debts: [],
    provisions: [],
    recurringRules: [],
    plannedEvents: [],
    settings: { language: 'es', currency: 'EUR', currencySymbol: '€', theme: 'system' },
  },
};

describe('validateBackup', () => {
  it('accepts a valid v2 backup', () => {
    const result = validateBackup(validV2Backup);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.app).toBe(BACKUP_APP_ID);
    expect(result.data.schemaVersion).toBe(2);
    expect(result.data.data.transactions).toHaveLength(1);
    expect(result.data.data.bankAccounts).toHaveLength(1);

    const summary = summarizeBackup(result.data.data);
    expect(summary.transactions).toBe(1);
    expect(summary.bankAccounts).toBe(1);
    expect(summary.debts).toBe(0);
  });

  it('rejects arbitrary JSON that is not a Spendiflow backup', () => {
    const result = validateBackup({ foo: 'bar', baz: 42 });
    expect(result.ok).toBe(false);
  });

  it('rejects non-object / primitive input', () => {
    expect(validateBackup(null).ok).toBe(false);
    expect(validateBackup(undefined).ok).toBe(false);
    expect(validateBackup('a plain string').ok).toBe(false);
    expect(validateBackup(42).ok).toBe(false);
    expect(validateBackup([1, 2, 3]).ok).toBe(false);
  });

  it('rejects a backup with the wrong app envelope', () => {
    const result = validateBackup({ ...validV2Backup, app: 'some-other-app' });
    expect(result.ok).toBe(false);
  });

  it('rejects a backup missing the data envelope', () => {
    const result = validateBackup({ app: 'spendiflow', schemaVersion: 2 });
    expect(result.ok).toBe(false);
  });

  it('rejects a future schemaVersion', () => {
    const result = validateBackup({
      ...validV2Backup,
      schemaVersion: BACKUP_SCHEMA_VERSION + 1,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a backup whose collections are not arrays', () => {
    const result = validateBackup({
      ...validV2Backup,
      data: { ...validV2Backup.data, transactions: 'not-an-array' },
    });
    expect(result.ok).toBe(false);
  });

  it('accepts a backup with missing collections and fills defaults', () => {
    const result = validateBackup({
      app: 'spendiflow',
      schemaVersion: 2,
      exportedAt: '2026-01-10T00:00:00.000Z',
      data: {},
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.data.transactions).toEqual([]);
    expect(result.data.data.bankAccounts).toEqual([]);
    expect(result.data.data.investments).toEqual([]);
    expect(result.data.data.debts).toEqual([]);
    expect(result.data.data.provisions).toEqual([]);
    expect(result.data.data.recurringRules).toEqual([]);
    expect(result.data.data.plannedEvents).toEqual([]);
    expect(result.data.data.categories.length).toBeGreaterThan(0);
    expect(result.data.data.settings.language).toBe('es');
    expect(result.data.data.settings.currencySymbol).toBe('€');
  });

  it('accepts an older schemaVersion and migrates it', () => {
    const result = validateBackup({
      app: 'spendiflow',
      schemaVersion: 1,
      exportedAt: '2025-01-10T00:00:00.000Z',
      data: {
        transactions: [{ id: 't1', type: 'expense', amount: 10 }],
        bankAccounts: [{ id: 'a1', name: 'Cuenta', bankName: 'BBVA', balanceHistory: [] }],
        debts: [{ id: 'd1', creditorName: 'Banco', totalAmount: 100, payments: [{ id: 'p1', amount: 10 }] }],
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.data.transactions[0].scope).toBe('personal');
    expect(result.data.data.bankAccounts[0].role).toBe('personal');
    expect(result.data.data.debts[0].direction).toBe('iOwe');
    expect(result.data.data.debts[0].payments[0].kind).toBe('installment');
  });
});
