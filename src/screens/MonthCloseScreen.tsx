import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { useStore } from '../store/useStore';
import { useTransactions } from '../hooks/useTransactions';
import { getAccountBalance, getNetWorth } from '../hooks/useAccounts';
import {
  computePreviousNetWorth,
  getAccountBalanceDiffs,
  hasBalanceEntryInMonth,
  snapshotInvestments,
  PreviousInvestmentSnapshot,
} from '../utils/monthClose';
import { colors } from '../theme/colors';
import {
  formatCurrency,
  formatDate,
  parseNumber,
  getDateISO,
  getMonthName,
  getCurrentMonth,
  getCurrentYear,
} from '../utils/formatters';
import { t } from '../locales/i18n';
import { Debt } from '../types';

/** Solo permite dígitos, coma y punto, con un máximo de 2 decimales (mismo criterio que AmountInput). */
const sanitizeAmountInput = (text: string): string => {
  const cleaned = text.replace(/[^0-9.,]/g, '');
  const normalized = cleaned.replace(',', '.');
  const parts = normalized.split('.');
  if (parts.length > 2) return text.slice(0, -1);
  if (parts[1] && parts[1].length > 2) return text.slice(0, -1);
  return cleaned;
};

const formatInputValue = (n: number): string => n.toFixed(2);

export const MonthCloseScreen: React.FC = () => {
  const navigation = useNavigation();

  const bankAccounts = useStore((state) => state.bankAccounts);
  const investments = useStore((state) => state.investments);
  const debts = useStore((state) => state.debts);
  const addBalanceEntry = useStore((state) => state.addBalanceEntry);
  const updateInvestment = useStore((state) => state.updateInvestment);
  const settings = useStore((state) => state.settings);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const { getPeriodSummary } = useTransactions();

  const activeAccounts = useMemo(
    () => bankAccounts.filter((a) => !a.archived),
    [bankAccounts]
  );

  const [phase, setPhase] = useState<'entry' | 'summary'>('entry');

  const [accountInputs, setAccountInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(activeAccounts.map((a) => [a.id, formatInputValue(getAccountBalance(a))]))
  );
  const [investmentInputs, setInvestmentInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(investments.map((i) => [i.id, formatInputValue(i.currentValue ?? 0)]))
  );
  const [initialAccountBalances] = useState<Record<string, number>>(() =>
    Object.fromEntries(activeAccounts.map((a) => [a.id, getAccountBalance(a)]))
  );
  const [initialInvestmentValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(investments.map((i) => [i.id, i.currentValue ?? 0]))
  );
  const [investmentSnapshotAtSave, setInvestmentSnapshotAtSave] = useState<
    PreviousInvestmentSnapshot[]
  >([]);

  const monthName = getMonthName(getCurrentMonth(), locale, 'long').toLowerCase();
  const headerTitle = t('monthClose.header', { month: monthName, year: getCurrentYear() });

  const iOweDebts = useMemo(() => debts.filter((d) => d.direction === 'iOwe'), [debts]);
  const owedToMeDebts = useMemo(() => debts.filter((d) => d.direction === 'owedToMe'), [debts]);

  const outstandingOf = (debt: Debt): number =>
    Math.max(debt.totalAmount - debt.payments.reduce((sum, p) => sum + p.amount, 0), 0);

  const handleAccountInputChange = (accountId: string, text: string) => {
    setAccountInputs((prev) => ({ ...prev, [accountId]: sanitizeAmountInput(text) }));
  };

  const handleInvestmentInputChange = (investmentId: string, text: string) => {
    setInvestmentInputs((prev) => ({ ...prev, [investmentId]: sanitizeAmountInput(text) }));
  };

  const handleSave = () => {
    const today = getDateISO();
    const month = getCurrentMonth();
    const year = getCurrentYear();
    const snapshot = snapshotInvestments(investments);

    activeAccounts.forEach((account) => {
      const parsed = parseNumber(accountInputs[account.id] ?? '');
      const original = initialAccountBalances[account.id] ?? 0;
      const changed = parsed !== original;
      const declaredThisMonth = hasBalanceEntryInMonth(account, month, year);
      if (changed || !declaredThisMonth) {
        addBalanceEntry(account.id, { amount: parsed, date: today });
      }
    });

    investments.forEach((investment) => {
      const parsed = parseNumber(investmentInputs[investment.id] ?? '');
      const original = initialInvestmentValues[investment.id] ?? 0;
      if (parsed !== original) {
        updateInvestment(investment.id, { currentValue: parsed, lastUpdated: today });
      }
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInvestmentSnapshotAtSave(snapshot);
    setPhase('summary');
  };

  // ---- Summary phase derived data (computed from post-save store state) ----
  const netWorth = useMemo(
    () => getNetWorth(bankAccounts, investments, debts),
    [bankAccounts, investments, debts]
  );
  const previousNetWorth = useMemo(
    () => computePreviousNetWorth(bankAccounts, investmentSnapshotAtSave, debts),
    [bankAccounts, investmentSnapshotAtSave, debts]
  );
  const variation =
    previousNetWorth !== undefined ? netWorth - previousNetWorth : undefined;

  const monthSummary = useMemo(() => getPeriodSummary('month'), [getPeriodSummary]);
  const personalSummary = useMemo(
    () => getPeriodSummary('month', undefined, 'personal'),
    [getPeriodSummary]
  );
  const businessSummary = useMemo(
    () => getPeriodSummary('month', undefined, 'business'),
    [getPeriodSummary]
  );

  const accountDiffs = useMemo(() => getAccountBalanceDiffs(bankAccounts), [bankAccounts]);

  const renderAccountRow = (account: (typeof activeAccounts)[number]) => {
    const inputValue = accountInputs[account.id] ?? '';
    const parsedInput = parseNumber(inputValue);
    const original = initialAccountBalances[account.id] ?? 0;
    const isModified = parsedInput !== original;
    const lastEntry = [...account.balanceHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    return (
      <Card key={account.id} style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>{account.name}</Text>
            <Text style={styles.rowSubtitle}>{account.bankName}</Text>
          </View>
          <View style={[styles.statusBadge, isModified && styles.statusBadgeModified]}>
            <Text
              style={[styles.statusBadgeText, isModified && styles.statusBadgeTextModified]}
            >
              {isModified ? t('monthClose.modifiedBadge') : t('monthClose.unchangedBadge')}
            </Text>
          </View>
        </View>
        <Text style={styles.lastDeclaredText}>
          {lastEntry
            ? `${t('monthClose.lastDeclared')}: ${formatCurrency(
                lastEntry.amount,
                settings.currencySymbol,
                locale
              )} (${t('monthClose.onDate', { date: formatDate(lastEntry.date, locale) })})`
            : t('monthClose.noPreviousBalance')}
        </Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>{t('monthClose.newBalanceLabel')}</Text>
          <View style={styles.inlineInputWrapper}>
            <Text style={styles.inlineCurrency}>{settings.currencySymbol}</Text>
            <TextInput
              style={styles.inlineInput}
              keyboardType="decimal-pad"
              value={inputValue}
              onChangeText={(text) => handleAccountInputChange(account.id, text)}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </Card>
    );
  };

  const renderInvestmentRow = (investment: (typeof investments)[number]) => {
    const inputValue = investmentInputs[investment.id] ?? '';
    const parsedInput = parseNumber(inputValue);
    const original = initialInvestmentValues[investment.id] ?? 0;
    const isModified = parsedInput !== original;

    return (
      <Card key={investment.id} style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>{investment.name}</Text>
            <Text style={styles.rowSubtitle}>{investment.type}</Text>
          </View>
          <View style={[styles.statusBadge, isModified && styles.statusBadgeModified]}>
            <Text
              style={[styles.statusBadgeText, isModified && styles.statusBadgeTextModified]}
            >
              {isModified ? t('monthClose.modifiedBadge') : t('monthClose.unchangedBadge')}
            </Text>
          </View>
        </View>
        <Text style={styles.lastDeclaredText}>
          {investment.currentValue !== undefined
            ? `${t('monthClose.lastValue')}: ${formatCurrency(
                investment.currentValue,
                settings.currencySymbol,
                locale
              )}${
                investment.lastUpdated
                  ? ` (${t('monthClose.onDate', {
                      date: formatDate(investment.lastUpdated, locale),
                    })})`
                  : ''
              }`
            : t('monthClose.noPreviousValue')}
        </Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>{t('monthClose.newValueLabel')}</Text>
          <View style={styles.inlineInputWrapper}>
            <Text style={styles.inlineCurrency}>{settings.currencySymbol}</Text>
            <TextInput
              style={styles.inlineInput}
              keyboardType="decimal-pad"
              value={inputValue}
              onChangeText={(text) => handleInvestmentInputChange(investment.id, text)}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </Card>
    );
  };

  const renderDebtRow = (debt: Debt) => {
    const remaining = outstandingOf(debt);
    const isOwedToMe = debt.direction === 'owedToMe';
    return (
      <View key={debt.id} style={styles.debtRow}>
        <View style={styles.debtInfo}>
          <Text style={styles.debtName} numberOfLines={1}>
            {debt.creditorName}
          </Text>
          <Text style={styles.debtDirection}>
            {isOwedToMe ? t('monthClose.debtOwedToMe') : t('monthClose.debtIOwe')}
          </Text>
        </View>
        <Text
          style={[
            styles.debtAmount,
            { color: isOwedToMe ? colors.income : colors.expense },
          ]}
        >
          {isOwedToMe ? '+' : '-'}
          {formatCurrency(remaining, settings.currencySymbol, locale)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {phase === 'entry' ? headerTitle : t('monthClose.summaryTitle')}
        </Text>
        <View style={styles.backButton} />
      </View>

      {phase === 'entry' ? (
        <>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>{t('monthClose.subtitle')}</Text>

            <Text style={styles.sectionTitle}>{t('monthClose.accountsSection')}</Text>
            {activeAccounts.length > 0 ? (
              activeAccounts.map(renderAccountRow)
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t('monthClose.noAccounts')}</Text>
              </Card>
            )}

            <Text style={styles.sectionTitle}>{t('monthClose.investmentsSection')}</Text>
            {investments.length > 0 ? (
              investments.map(renderInvestmentRow)
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t('monthClose.noInvestments')}</Text>
              </Card>
            )}

            <Text style={styles.sectionTitle}>{t('monthClose.debtsSection')}</Text>
            <Card style={styles.debtsCard}>
              {debts.length > 0 ? (
                <>
                  {iOweDebts.map(renderDebtRow)}
                  {owedToMeDebts.map(renderDebtRow)}
                </>
              ) : (
                <Text style={styles.emptyText}>{t('monthClose.noDebts')}</Text>
              )}
              <Text style={styles.debtsNote}>{t('monthClose.debtsReadOnlyNote')}</Text>
            </Card>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{t('monthClose.saveButton')}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Card style={styles.netWorthCard}>
              <Text style={styles.netWorthLabel}>{t('monthClose.netWorth')}</Text>
              <Text style={styles.netWorthValue}>
                {formatCurrency(netWorth, settings.currencySymbol, locale)}
              </Text>

              <View style={styles.variationBlock}>
                <Text style={styles.variationLabel}>{t('monthClose.vsLastClose')}</Text>
                {variation !== undefined ? (
                  <Text
                    style={[
                      styles.variationValue,
                      { color: variation >= 0 ? colors.income : colors.expense },
                    ]}
                  >
                    {variation >= 0 ? '+' : ''}
                    {formatCurrency(variation, settings.currencySymbol, locale)}
                  </Text>
                ) : (
                  <>
                    <Text style={styles.variationValue}>—</Text>
                    <Text style={styles.firstCloseExplainer}>
                      {t('monthClose.firstCloseExplainer')}
                    </Text>
                  </>
                )}
              </View>
            </Card>

            <Card style={styles.flowCard}>
              <Text style={styles.sectionTitleInCard}>{t('monthClose.flowSavings')}</Text>
              <Text style={styles.flowHint}>{t('monthClose.flowSavingsHint')}</Text>
              <Text
                style={[
                  styles.flowValue,
                  { color: monthSummary.netBalance >= 0 ? colors.income : colors.expense },
                ]}
              >
                {monthSummary.netBalance >= 0 ? '+' : ''}
                {formatCurrency(monthSummary.netBalance, settings.currencySymbol, locale)}
              </Text>
              <View style={styles.scopeRow}>
                <View style={styles.scopeItem}>
                  <Text style={styles.scopeLabel}>{t('monthClose.personalScope')}</Text>
                  <Text
                    style={[
                      styles.scopeValue,
                      {
                        color:
                          personalSummary.netBalance >= 0 ? colors.income : colors.expense,
                      },
                    ]}
                  >
                    {personalSummary.netBalance >= 0 ? '+' : ''}
                    {formatCurrency(personalSummary.netBalance, settings.currencySymbol, locale)}
                  </Text>
                </View>
                <View style={styles.scopeItem}>
                  <Text style={styles.scopeLabel}>{t('monthClose.businessScope')}</Text>
                  <Text
                    style={[
                      styles.scopeValue,
                      {
                        color:
                          businessSummary.netBalance >= 0 ? colors.income : colors.expense,
                      },
                    ]}
                  >
                    {businessSummary.netBalance >= 0 ? '+' : ''}
                    {formatCurrency(businessSummary.netBalance, settings.currencySymbol, locale)}
                  </Text>
                </View>
              </View>
            </Card>

            <Text style={styles.sectionTitle}>{t('monthClose.accountsBreakdown')}</Text>
            <Card style={styles.breakdownCard}>
              {accountDiffs.map((diff, index) => {
                const account = bankAccounts.find((a) => a.id === diff.accountId);
                if (!account) return null;
                return (
                  <View key={diff.accountId}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownName} numberOfLines={1}>
                        {account.name}
                      </Text>
                      <Text style={styles.breakdownBalance}>
                        {formatCurrency(diff.current, settings.currencySymbol, locale)}
                      </Text>
                      <Text
                        style={[
                          styles.breakdownDiff,
                          diff.diff === undefined
                            ? styles.breakdownDiffNeutral
                            : { color: diff.diff >= 0 ? colors.income : colors.expense },
                        ]}
                      >
                        {diff.diff === undefined
                          ? t('monthClose.noPreviousDiff')
                          : `${diff.diff >= 0 ? '+' : ''}${formatCurrency(
                              diff.diff,
                              settings.currencySymbol,
                              locale
                            )}`}
                      </Text>
                    </View>
                    {index < accountDiffs.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </Card>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.saveButton} onPress={() => navigation.goBack()}>
              <Text style={styles.saveButtonText}>{t('monthClose.doneButton')}</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 4,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 12,
  },
  rowCard: {
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rowInfo: {
    flex: 1,
    marginRight: 8,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeModified: {
    backgroundColor: colors.primaryLight + '33',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  statusBadgeTextModified: {
    color: colors.primary,
  },
  lastDeclaredText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  inlineInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 130,
  },
  inlineCurrency: {
    fontSize: 15,
    color: colors.textSecondary,
    marginRight: 4,
  },
  inlineInput: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    padding: 0,
  },
  emptyCard: {
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 16,
  },
  debtsCard: {
    marginBottom: 12,
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  debtInfo: {
    flex: 1,
    marginRight: 8,
  },
  debtName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  debtDirection: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  debtAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  debtsNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  netWorthCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 24,
  },
  netWorthLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  variationBlock: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    width: '100%',
  },
  variationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  variationValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  firstCloseExplainer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  flowCard: {
    marginBottom: 16,
  },
  sectionTitleInCard: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  flowHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  flowValue: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 12,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scopeItem: {
    flex: 1,
    alignItems: 'center',
  },
  scopeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  scopeValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  breakdownCard: {
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  breakdownName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  breakdownBalance: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    minWidth: 80,
    textAlign: 'right',
  },
  breakdownDiff: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
  },
  breakdownDiffNeutral: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
