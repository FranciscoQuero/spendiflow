import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { FormScrollView } from '../components/FormScrollView';
import { Badge } from '../components/Badge';
import { useStore } from '../store/useStore';
import { useTransactions } from '../hooks/useTransactions';
import { getAccountBalance, getNetWorth } from '../hooks/useAccounts';
import {
  computePreviousNetWorth,
  getAccountBalanceDiffs,
  hasBalanceEntryInMonth,
} from '../utils/monthClose';
import { computeImpliedBalance, computeDiscrepancy } from '../utils/reconciliation';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import {
  formatCurrency,
  formatDate,
  parseNumber,
  getDateISO,
  getMonthName,
  getCurrentMonth,
  getCurrentYear,
} from '../utils/formatters';
import { investmentTypeI18nKey } from '../utils/investmentTypes';
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation();

  const bankAccounts = useStore((state) => state.bankAccounts);
  const investments = useStore((state) => state.investments);
  const debts = useStore((state) => state.debts);
  const transactions = useStore((state) => state.transactions);
  const addBalanceEntry = useStore((state) => state.addBalanceEntry);
  const addInvestmentValueEntry = useStore((state) => state.addInvestmentValueEntry);
  const addTransaction = useStore((state) => state.addTransaction);
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

  /**
   * Crea una transacción de ajuste para eliminar el descuadre detectado
   * entre el saldo declarado y el saldo implícito: gasto si falta dinero
   * (descuadre negativo), ingreso si sobra (descuadre positivo). Sin
   * categoría asignada; al añadirse a `transactions`, el descuadre se
   * recalcula automáticamente y desaparece.
   */
  const handleCreateAdjustment = (accountId: string, discrepancy: number) => {
    const amount = Math.abs(discrepancy);
    if (amount === 0) return;

    const today = getDateISO();
    const todayDate = new Date(today);

    addTransaction({
      type: discrepancy < 0 ? 'expense' : 'income',
      amount,
      concept: t('monthClose.reconciliationAdjustmentConcept'),
      accountId,
      scope: 'personal',
      date: today,
      month: todayDate.getMonth() + 1,
      year: todayDate.getFullYear(),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSave = () => {
    const today = getDateISO();
    const month = getCurrentMonth();
    const year = getCurrentYear();

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
        addInvestmentValueEntry(investment.id, { value: parsed, date: today });
      }
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('summary');
  };

  // ---- Summary phase derived data (computed from post-save store state) ----
  const netWorth = useMemo(
    () => getNetWorth(bankAccounts, investments, debts),
    [bankAccounts, investments, debts]
  );
  const previousNetWorth = useMemo(
    () => computePreviousNetWorth(bankAccounts, investments, debts),
    [bankAccounts, investments, debts]
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

    const implied = computeImpliedBalance(account, transactions, lastEntry?.date, getDateISO());
    const discrepancy = computeDiscrepancy(parsedInput, implied);
    const showDiscrepancy = discrepancy !== null && Math.abs(discrepancy) >= 0.01;

    return (
      <Card key={account.id} style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>{account.name}</Text>
            <Text style={styles.rowSubtitle}>{account.bankName}</Text>
          </View>
          <Badge
            label={isModified ? t('monthClose.modifiedBadge') : t('monthClose.unchangedBadge')}
            color={isModified ? theme.primary : theme.textSecondary}
          />
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
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>
        {showDiscrepancy && discrepancy !== null && (
          <View style={styles.reconciliationRow}>
            <Text style={styles.reconciliationText}>
              {t('monthClose.reconciliationText', {
                amount: formatCurrency(Math.abs(discrepancy), settings.currencySymbol, locale),
              })}
            </Text>
            <Pressable onPress={() => handleCreateAdjustment(account.id, discrepancy)}>
              <Text style={styles.reconciliationLink}>{t('monthClose.createAdjustment')}</Text>
            </Pressable>
          </View>
        )}
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
            <Text style={styles.rowSubtitle}>{t(investmentTypeI18nKey(investment.type))}</Text>
          </View>
          <Badge
            label={isModified ? t('monthClose.modifiedBadge') : t('monthClose.unchangedBadge')}
            color={isModified ? theme.primary : theme.textSecondary}
          />
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
              placeholderTextColor={theme.textSecondary}
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
            { color: isOwedToMe ? theme.income : theme.expense },
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
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {phase === 'entry' ? headerTitle : t('monthClose.summaryTitle')}
        </Text>
        <View style={styles.backButton} />
      </View>

      {phase === 'entry' ? (
        <FormScrollView>
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
        </FormScrollView>
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
                      { color: variation >= 0 ? theme.income : theme.expense },
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
                  { color: monthSummary.netBalance >= 0 ? theme.income : theme.expense },
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
                          personalSummary.netBalance >= 0 ? theme.income : theme.expense,
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
                          businessSummary.netBalance >= 0 ? theme.income : theme.expense,
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
                            : { color: diff.diff >= 0 ? theme.income : theme.expense },
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

const makeStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    color: theme.text,
    marginHorizontal: 4,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
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
    color: theme.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  lastDeclaredText: {
    fontSize: 12,
    color: theme.textSecondary,
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
    color: theme.textSecondary,
  },
  inlineInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 130,
  },
  inlineCurrency: {
    fontSize: 15,
    color: theme.textSecondary,
    marginRight: 4,
  },
  inlineInput: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
    textAlign: 'right',
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  reconciliationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  reconciliationText: {
    flex: 1,
    fontSize: 12,
    color: theme.expense,
    marginRight: 8,
  },
  reconciliationLink: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  emptyCard: {
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.textSecondary,
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
    color: theme.text,
  },
  debtDirection: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  debtAmount: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  debtsNote: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  saveButton: {
    backgroundColor: theme.primary,
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
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.primary,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  variationBlock: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    alignItems: 'center',
    width: '100%',
  },
  variationLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  variationValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  firstCloseExplainer: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  flowCard: {
    marginBottom: 16,
  },
  sectionTitleInCard: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  flowHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  flowValue: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 12,
    fontVariant: ['tabular-nums'],
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  scopeItem: {
    flex: 1,
    alignItems: 'center',
  },
  scopeLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  scopeValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
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
    color: theme.text,
    fontWeight: '500',
  },
  breakdownBalance: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    minWidth: 80,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  breakdownDiff: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  breakdownDiffNeutral: {
    color: theme.textSecondary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
  },
});
