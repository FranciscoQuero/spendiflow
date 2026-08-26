import { NavigatorScreenParams } from '@react-navigation/native';
import { TransactionType } from '../types';

export type TabParamList = {
  Home: undefined;
  Transactions: undefined;
  Charts: undefined;
  Accounts: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  AddTransaction: {
    type?: TransactionType;
    transactionId?: string;
    /** Precarga los campos de esta transacción (fecha = hoy) sin entrar en modo edición. */
    duplicateFromId?: string;
  };
  AddBalance: undefined;
  AddAccount: { accountId?: string } | undefined;
  AddInvestment: undefined;
  AddDebt: { debtId?: string } | undefined;
  TransactionDetail: { id: string };
  AccountDetail: { id: string };
  InvestmentDetail: { id: string };
  DebtDetail: { id: string };
  EditCategories: { type: 'expense' | 'income' };
  RecurringList: undefined;
  AddRecurring: { ruleId?: string } | undefined;
  ProvisionDetail: { provisionId: string };
  AddProvision: { accountId?: string } | undefined;
  MonthClose: undefined;
  PlannedEvents: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
