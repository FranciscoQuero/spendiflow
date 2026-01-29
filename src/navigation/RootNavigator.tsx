import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import {
  AddTransactionScreen,
  AddBalanceScreen,
  AddAccountScreen,
  AddInvestmentScreen,
  AddDebtScreen,
  TransactionDetailScreen,
  EditCategoriesScreen,
  AccountDetailScreen,
  InvestmentDetailScreen,
  DebtDetailScreen,
} from '../screens';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <Stack.Screen name="AddBalance" component={AddBalanceScreen} />
        <Stack.Screen name="AddAccount" component={AddAccountScreen} />
        <Stack.Screen name="AddInvestment" component={AddInvestmentScreen} />
        <Stack.Screen name="AddDebt" component={AddDebtScreen} />
      </Stack.Group>
      <Stack.Group screenOptions={{ presentation: 'card' }}>
        <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        <Stack.Screen name="EditCategories" component={EditCategoriesScreen} />
        <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
        <Stack.Screen name="InvestmentDetail" component={InvestmentDetailScreen} />
        <Stack.Screen name="DebtDetail" component={DebtDetailScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
};
