import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { TransactionItem } from '../components/TransactionItem';
import { QuickActionButton } from '../components/QuickActionButton';
import { RecurrenceActions } from '../components/RecurrenceActions';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts, getMyShareBalance, getInvestmentValue } from '../hooks/useAccounts';
import { getDebtsNetImpact } from '../utils/monthClose';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme, hexToRgba } from '../theme/colors';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getUpcomingPlannedEvents } from '../utils/plannedEvents';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { RecurringRule, TransactionType } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MAX_VISIBLE_DUE = 3;

const getTypeMeta = (
  theme: Theme,
  type: TransactionType
): { color: string; sign: '' | '+' | '-' } => {
  switch (type) {
    case 'income':
      return { color: theme.income, sign: '+' };
    case 'transfer':
      return { color: theme.primary, sign: '' };
    case 'expense':
    default:
      return { color: theme.expense, sign: '-' };
  }
};

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation<NavigationProp>();
  const settings = useStore((state) => state.settings);
  const confirmRecurrence = useStore((state) => state.confirmRecurrence);
  const skipRecurrence = useStore((state) => state.skipRecurrence);
  const plannedEvents = useStore((state) => state.plannedEvents);
  const { getPeriodSummary, getRecentTransactions } = useTransactions();
  const { bankAccounts, investments, debts, getDueRecurrences, getNetWorth } = useAccounts();

  const summary = getPeriodSummary('month');
  const recentTransactions = getRecentTransactions(5);
  const dueRecurrences = getDueRecurrences();
  const visibleDueRecurrences = dueRecurrences.slice(0, MAX_VISIBLE_DUE);
  const extraDueCount = dueRecurrences.length - visibleDueRecurrences.length;
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const netWorth = getNetWorth();
  const accountsTotal = useMemo(
    () =>
      bankAccounts
        .filter((a) => !a.archived)
        .reduce((sum, a) => sum + getMyShareBalance(a), 0),
    [bankAccounts]
  );
  const investmentsTotal = useMemo(
    () => investments.reduce((sum, i) => sum + getInvestmentValue(i), 0),
    [investments]
  );
  const debtsNet = useMemo(() => getDebtsNetImpact(debts), [debts]);

  const upcomingPlannedEvents = useMemo(
    () => getUpcomingPlannedEvents(plannedEvents),
    [plannedEvents]
  );
  const visiblePlannedEvents = upcomingPlannedEvents.slice(0, MAX_VISIBLE_DUE);
  const extraPlannedEventsCount = upcomingPlannedEvents.length - visiblePlannedEvents.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Net Worth (secondary to the monthly summary above) */}
        <Card
          style={styles.netWorthCard}
          pressable
          onPress={() => navigation.navigate('MainTabs', { screen: 'Accounts' })}
        >
          <View style={styles.netWorthHeader}>
            <Text style={styles.netWorthLabel}>{t('home.netWorth')}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>
          <Text style={styles.netWorthValue}>
            {formatCurrency(netWorth, settings.currencySymbol, locale)}
          </Text>
          <Text style={styles.netWorthBreakdown}>
            {t('home.netWorthBreakdown', {
              accounts: formatCurrency(accountsTotal, settings.currencySymbol, locale),
              investments: formatCurrency(investmentsTotal, settings.currencySymbol, locale),
              debts:
                (debtsNet >= 0 ? '+' : '') +
                formatCurrency(debtsNet, settings.currencySymbol, locale),
            })}
          </Text>
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
              const meta = getTypeMeta(theme, rule.template.type);
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

        {/* Upcoming Planned Events */}
        {upcomingPlannedEvents.length > 0 && (
          <Card style={styles.upcomingCard}>
            <View style={styles.pendingHeader}>
              <Text style={styles.summaryTitle}>{t('home.upcomingEvents')}</Text>
              <Text
                style={styles.seeAll}
                onPress={() => navigation.navigate('PlannedEvents')}
              >
                {t('home.seeAll')}
              </Text>
            </View>

            {visiblePlannedEvents.map((event, index) => {
              const isOverdue = new Date(event.date).getTime() < Date.now();
              return (
                <React.Fragment key={event.id}>
                  <View style={styles.pendingRow}>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingName} numberOfLines={1}>
                        {event.name}
                      </Text>
                      <Text
                        style={[
                          styles.eventDate,
                          isOverdue && styles.eventDateOverdue,
                        ]}
                      >
                        {formatDate(event.date, locale)}
                      </Text>
                    </View>
                    {event.estimatedAmount != null && (
                      <Text style={styles.eventAmount}>
                        {formatCurrency(event.estimatedAmount, settings.currencySymbol, locale)}
                      </Text>
                    )}
                  </View>
                  {index < visiblePlannedEvents.length - 1 && (
                    <View style={styles.pendingDivider} />
                  )}
                </React.Fragment>
              );
            })}

            {extraPlannedEventsCount > 0 && (
              <Pressable
                style={styles.moreRow}
                onPress={() => navigation.navigate('PlannedEvents')}
              >
                <Text style={styles.moreText}>
                  {t('home.moreCount', { count: extraPlannedEventsCount })}
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
            color={theme.expense}
            onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
          />
          <View style={styles.actionSpacer} />
          <QuickActionButton
            icon="add-circle"
            label={t('home.addIncome')}
            color={theme.income}
            onPress={() => navigation.navigate('AddTransaction', { type: 'income' })}
          />
          <View style={styles.actionSpacer} />
          <QuickActionButton
            icon="wallet"
            label={t('home.addBalance')}
            color={theme.primary}
            onPress={() => navigation.navigate('AddBalance')}
          />
          <View style={styles.actionSpacer} />
          <QuickActionButton
            icon="repeat"
            label={t('recurring.title')}
            color={theme.categoryColors.suscripciones}
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

const makeStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    marginBottom: 24,
    backgroundColor: theme.surfaceTint,
    borderColor: hexToRgba(theme.primary, 0.14),
  },
  netWorthCard: {
    marginBottom: 24,
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netWorthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netWorthValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  netWorthBreakdown: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  pendingCard: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.warning,
  },
  upcomingCard: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  eventDate: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  eventDateOverdue: {
    color: theme.warning,
    fontWeight: '600',
  },
  eventAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    fontVariant: ['tabular-nums'],
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
    color: theme.text,
  },
  pendingAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  pendingDivider: {
    height: 1,
    backgroundColor: theme.border,
  },
  moreRow: {
    paddingTop: 8,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
    textAlign: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
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
    color: theme.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  expenseValue: {
    color: theme.expense,
  },
  incomeValue: {
    color: theme.income,
  },
  balanceContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: hexToRgba(theme.primary, 0.14),
  },
  balanceLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
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
    color: theme.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 52,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.textSecondary,
    paddingVertical: 24,
  },
});
