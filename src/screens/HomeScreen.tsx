import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../components/Card';
import { TransactionItem } from '../components/TransactionItem';
import { QuickActionButton } from '../components/QuickActionButton';
import { useTransactions } from '../hooks/useTransactions';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const settings = useStore((state) => state.settings);
  const { getPeriodSummary, getRecentTransactions } = useTransactions();

  const summary = getPeriodSummary('month');
  const recentTransactions = getRecentTransactions(5);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('home.welcome')}</Text>
          <Text style={styles.appName}>{t('app.name')}</Text>
        </View>

        {/* Monthly Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('home.monthlySummary')}</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('home.totalExpenses')}</Text>
              <Text style={[styles.summaryValue, styles.expenseValue]}>
                {formatCurrency(summary.totalExpenses, settings.currencySymbol, locale)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('home.totalIncome')}</Text>
              <Text style={[styles.summaryValue, styles.incomeValue]}>
                {formatCurrency(summary.totalIncome, settings.currencySymbol, locale)}
              </Text>
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>{t('home.netBalance')}</Text>
            <Text
              style={[
                styles.balanceValue,
                summary.netBalance >= 0 ? styles.incomeValue : styles.expenseValue,
              ]}
            >
              {summary.netBalance >= 0 ? '+' : ''}
              {formatCurrency(summary.netBalance, settings.currencySymbol, locale)}
            </Text>
          </View>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="remove-circle"
            label={t('home.addExpense')}
            color={colors.expense}
            onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
          />
          <View style={styles.actionSpacer} />
          <QuickActionButton
            icon="add-circle"
            label={t('home.addIncome')}
            color={colors.income}
            onPress={() => navigation.navigate('AddTransaction', { type: 'income' })}
          />
          <View style={styles.actionSpacer} />
          <QuickActionButton
            icon="wallet"
            label={t('home.addBalance')}
            color={colors.primary}
            onPress={() => navigation.navigate('AddBalance')}
          />
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>{t('home.recentTransactions')}</Text>
          <Text
            style={styles.seeAll}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Transactions' })}
          >
            {t('home.seeAll')}
          </Text>
        </View>

        <Card>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <React.Fragment key={transaction.id}>
                <TransactionItem
                  transaction={transaction}
                  onPress={() =>
                    navigation.navigate('TransactionDetail', { id: transaction.id })
                  }
                />
                {index < recentTransactions.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))
          ) : (
            <Text style={styles.emptyText}>{t('home.noTransactions')}</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  expenseValue: {
    color: colors.expense,
  },
  incomeValue: {
    color: colors.income,
  },
  balanceContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionSpacer: {
    width: 12,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 24,
  },
});
