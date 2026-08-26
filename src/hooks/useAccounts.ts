import { useStore } from '../store/useStore';
import { BankAccount, Provision, Investment, Debt, RecurringRule } from '../types';

// ---- Pure, testable selector functions ----

/** Último saldo declarado por fecha (no por posición en el array). */
export const getAccountBalance = (account: BankAccount): number => {
  if (account.balanceHistory.length === 0) return 0;
  const sorted = [...account.balanceHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return sorted[sorted.length - 1].amount;
};

export const getProvisionBalance = (provision: Provision): number =>
  provision.entries.reduce((sum, entry) => sum + entry.amount, 0);

export const getAccountProvisionedTotal = (
  accountId: string,
  provisions: Provision[]
): number =>
  provisions
    .filter((p) => p.accountId === accountId && !p.archived)
    .reduce((sum, p) => sum + getProvisionBalance(p), 0);

/** Lo que de verdad se puede gastar/mover: saldo menos suelo menos provisionado. */
export const getAvailableBalance = (
  account: BankAccount,
  provisions: Provision[]
): number => {
  const balance = getAccountBalance(account);
  const floor = account.floor ?? 0;
  const provisioned = getAccountProvisionedTotal(account.id, provisions);
  return balance - floor - provisioned;
};

export const getMyShareBalance = (account: BankAccount): number =>
  getAccountBalance(account) * account.ownershipShare;

const outstandingDebt = (debt: Debt): number =>
  Math.max(debt.totalAmount - debt.payments.reduce((sum, p) => sum + p.amount, 0), 0);

export const getNetWorth = (
  accounts: BankAccount[],
  investments: Investment[],
  debts: Debt[]
): number => {
  const accountsTotal = accounts
    .filter((a) => !a.archived)
    .reduce((sum, a) => sum + getMyShareBalance(a), 0);

  const investmentsTotal = investments.reduce((sum, i) => sum + (i.currentValue ?? 0), 0);

  const iOweTotal = debts
    .filter((d) => d.direction === 'iOwe')
    .reduce((sum, d) => sum + outstandingDebt(d), 0);

  const owedToMeTotal = debts
    .filter((d) => d.direction === 'owedToMe')
    .reduce((sum, d) => sum + outstandingDebt(d), 0);

  return accountsTotal + investmentsTotal - iOweTotal + owedToMeTotal;
};

export const getDueRecurrences = (
  rules: RecurringRule[],
  asOfDate: string
): RecurringRule[] => {
  const asOfTime = new Date(asOfDate).getTime();
  return rules.filter((r) => r.active && new Date(r.nextDueDate).getTime() <= asOfTime);
};

// ---- Hook: connects the pure selectors to the store ----

export const useAccounts = () => {
  const bankAccounts = useStore((state) => state.bankAccounts);
  const provisions = useStore((state) => state.provisions);
  const investments = useStore((state) => state.investments);
  const debts = useStore((state) => state.debts);
  const recurringRules = useStore((state) => state.recurringRules);

  return {
    bankAccounts,
    provisions,
    investments,
    debts,
    recurringRules,
    getAccountBalance,
    getProvisionBalance,
    getAccountProvisionedTotal: (accountId: string) =>
      getAccountProvisionedTotal(accountId, provisions),
    getAvailableBalance: (account: BankAccount) => getAvailableBalance(account, provisions),
    getMyShareBalance,
    getNetWorth: () => getNetWorth(bankAccounts, investments, debts),
    getDueRecurrences: (asOfDate: string = new Date().toISOString()) =>
      getDueRecurrences(recurringRules, asOfDate),
  };
};
