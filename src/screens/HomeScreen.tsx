import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../components/Card';
import { TransactionItem } from '../components/TransactionItem';
import { QuickActionButton } from '../components/QuickActionButton';
import { RecurrenceActions } from '../components/RecurrenceActions';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { RecurringRule, TransactionType } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MAX_VISIBLE_DUE = 3;

const getTypeMeta = (
  type: TransactionType
): { color: string; sign: '' | '+' | '-' } => {
  switch (type) {
    case 'income':
      return { color: colors.income, sign: '+' };
    case 'transfer':
      return { color: colors.primary, sign: '' };
    case 'expense':
    default:
      return { color: colors.expense, sign: '-' };
  }
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const settings = useStore((state) => state.settings);
  const confirmRecurrence = useStore((state) => state.confirmRecurrence);
  const skipRecurrence = useStore((state) => state.skipRecurrence);
  const { getPeriodSummary, getRecentTransactions } = useTransactions();
  const { getDueRecurrences } = useAccounts();

  const summary = getPeriodSummary('month');
  const recentTransactions = getRecentTransactions(5);
  const dueRecurrences = getDueRecurrences();
  const visibleDueRecurrences = dueRecurrences.slice(0, MAX_VISIBLE_DUE);
  const extraDueCount = dueRecurrences.length - visibleDueRecurrences.length;
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

        {/* Pending Recurrences */}
        {dueRecurrences.length > 0 && (
          <Card style={styles.pendingCard}>
            <View style={styles.pendingHeader}>
              <Text style={styles.summaryTitle}>{t('home.pendingRecurrences')}</Text>
              <Text
                style={styles.seeAll}
                onPress={() => navigation.navigate('RecurringList')}
              >
                {t('home.seeAll')}
              </Text>
            </View>

            {visibleDueRecurrences.map((rule: RecurringRule, index) => {
              const meta = getTypeMeta(rule.template.type);
              return (
                <React.Fragment key={rule.id}>
                  <View style={styles.pendingRow}>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingName} numberOfLines={1}>
                        {rule.name}
                      </Text>
                      <Text style={[styles.pendingAmount, { color: meta.color }]}>
                        {meta.sign}
                        {formatCurrency(rule.template.amount, settings.currencySymbol, locale)}
                      </Text>
                    </View>
                    <RecurrenceActions
                      compact
                      onConfirm={() => confirmRecurrence(rule.id)}
                      onSkip={() => skipRecurrence(rule.id)}
                    />
                  </View>
                  {index < visibleDueRecurrences.length - 1 && (
                    <View style={styles.pendingDivider} />
                  )}
                </React.Fragment>
              );
            })}

            {extraDueCount > 0 && (
              <Pressable
                style={styles.moreRow}
                onPress={() => navigation.navigate('RecurringList')}
              >
                <Text style={styles.moreText}>
                  {t('home.moreCount', { count: extraDueCount })}
                </Text>
              </Pressable>
            )}
          </Card>
        )}

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
          <View style={styles.actionSpacer} />
          <QuickActionButton
            icon="repeat"
            label={t('recurring.title')}
            color={colors.categoryColors.suscripciones}
            onPress={() => navigation.navigate('RecurringList')}
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
  pendingCard: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pendingAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  pendingDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  moreRow: {
    paddingTop: 8,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
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
