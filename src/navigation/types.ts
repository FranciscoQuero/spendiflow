import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Transactions: undefined;
  Charts: undefined;
  Accounts: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  AddTransaction: { type: 'expense' | 'income' };
  AddBalance: undefined;
  AddAccount: undefined;
  AddInvestment: undefined;
  AddDebt: undefined;
  TransactionDetail: { id: string };
  AccountDetail: { id: string };
  InvestmentDetail: { id: string };
  DebtDetail: { id: string };
  EditCategories: { type: 'expense' | 'income' };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
