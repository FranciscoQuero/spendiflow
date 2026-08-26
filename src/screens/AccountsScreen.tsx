import React, { useMemo, useState } from 'react';
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
import { TintedIcon } from '../components/TintedIcon';
import { Badge } from '../components/Badge';
import { useStore } from '../store/useStore';
import {
  getAccountBalance,
  getAvailableBalance,
  getMyShareBalance,
  getProvisionBalance,
} from '../hooks/useAccounts';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { formatCurrency, formatDate } from '../utils/formatters';
import { investmentTypeI18nKey } from '../utils/investmentTypes';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { BankAccount, Debt, Provision } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const roleLabel = (role: string): string => {
  switch (role) {
    case 'personal':
      return t('accounts.roleOptions.personal');
    case 'business':
      return t('accounts.roleOptions.business');
    case 'shared':
      return t('accounts.roleOptions.shared');
    case 'savings':
      return t('accounts.roleOptions.savings');
    default:
      return t('accounts.roleOptions.other');
  }
};

export const AccountsScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation<NavigationProp>();
  const bankAccounts = useStore((state) => state.bankAccounts);
  const provisions = useStore((state) => state.provisions);
  const investments = useStore((state) => state.investments);
  const debts = useStore((state) => state.debts);
  const settings = useStore((state) => state.settings);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const [showArchived, setShowArchived] = useState(false);

  const activeAccounts = useMemo(
    () => bankAccounts.filter((a) => !a.archived),
    [bankAccounts]
  );
  const archivedAccounts = useMemo(
    () => bankAccounts.filter((a) => a.archived),
    [bankAccounts]
  );

  const totalBankBalance = useMemo(() => {
    return activeAccounts.reduce((sum, account) => sum + getMyShareBalance(account), 0);
  }, [activeAccounts]);

  const totalInvested = useMemo(() => {
    return investments.reduce((sum, inv) => {
      return sum + inv.contributions.reduce((s, c) => s + c.amount, 0);
    }, 0);
  }, [investments]);

  const iOweDebts = useMemo(() => debts.filter((d) => d.direction === 'iOwe'), [debts]);
  const owedToMeDebts = useMemo(
    () => debts.filter((d) => d.direction === 'owedToMe'),
    [debts]
  );

  const totalDebt = useMemo(() => {
    return iOweDebts.reduce((sum, debt) => {
      const paid = debt.payments.reduce((s, p) => s + p.amount, 0);
      return sum + Math.max(debt.totalAmount - paid, 0);
    }, 0);
  }, [iOweDebts]);

  const totalOwedToMe = useMemo(() => {
    return owedToMeDebts.reduce((sum, debt) => {
      const paid = debt.payments.reduce((s, p) => s + p.amount, 0);
      return sum + Math.max(debt.totalAmount - paid, 0);
    }, 0);
  }, [owedToMeDebts]);

  const provisionsByAccount = (accountId: string): Provision[] =>
    provisions.filter((p) => p.accountId === accountId && !p.archived);

  const renderBankAccount = (account: BankAccount) => {
    const balance = getAccountBalance(account);
    const available = getAvailableBalance(account, provisions);
    const myShare = getMyShareBalance(account);
    const accountProvisions = provisionsByAccount(account.id);
    const lastEntry = [...account.balanceHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    const hasFloorOrProvisions = (account.floor ?? 0) > 0 || accountProvisions.length > 0;

    return (
      <Card
        key={account.id}
        style={styles.itemCard}
        pressable
        onPress={() => navigation.navigate('AccountDetail', { id: account.id })}
      >
        <View style={styles.itemHeader}>
          <TintedIcon name="wallet" color={theme.primary} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{account.name}</Text>
            <Text style={styles.itemSubtitle}>{account.bankName}</Text>
          </View>
          <Badge label={roleLabel(account.role)} color={theme.primary} />
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.balanceLabel}>{t('accounts.balance')}</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(balance, settings.currencySymbol, locale)}
          </Text>
          {hasFloorOrProvisions && (
            <Text style={styles.secondaryText}>
              {t('accounts.available')}: {formatCurrency(available, settings.currencySymbol, locale)}
            </Text>
          )}
          {account.ownershipShare < 1 && (
            <Text style={styles.secondaryText}>
              {t('accounts.myShare')}: {formatCurrency(myShare, settings.currencySymbol, locale)}
            </Text>
          )}
          {lastEntry && (
            <Text style={styles.lastUpdate}>
              {t('accounts.lastUpdate')}: {formatDate(lastEntry.date, locale)}
            </Text>
          )}
        </View>

        {/* Provision chips */}
        <View style={styles.provisionChipRow}>
          {accountProvisions.map((provision) => (
            <Pressable
              key={provision.id}
              style={[styles.provisionChip, { borderColor: provision.color }]}
              onPress={() =>
                navigation.navigate('ProvisionDetail', { provisionId: provision.id })
              }
            >
              <Ionicons
                name={provision.icon as keyof typeof Ionicons.glyphMap}
                size={12}
                color={provision.color}
              />
              <Text style={styles.provisionChipText} numberOfLines={1}>
                {provision.name}
              </Text>
              <Text style={[styles.provisionChipBalance, { color: provision.color }]}>
                {formatCurrency(getProvisionBalance(provision), settings.currencySymbol, locale)}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.provisionAddChip}
            onPress={() => navigation.navigate('AddProvision', { accountId: account.id })}
          >
            <Ionicons name="add" size={14} color={theme.primary} />
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderInvestment = (investment: typeof investments[0]) => {
    const totalContributed = investment.contributions.reduce((s, c) => s + c.amount, 0);
    return (
      <Card
        key={investment.id}
        style={styles.itemCard}
        pressable
        onPress={() => navigation.navigate('InvestmentDetail', { id: investment.id })}
      >
        <View style={styles.itemHeader}>
          <TintedIcon name="trending-up" color={theme.income} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{investment.name}</Text>
            <Text style={styles.itemSubtitle}>{t(investmentTypeI18nKey(investment.type))}</Text>
          </View>
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.balanceLabel}>{t('accounts.totalContributed')}</Text>
          <Text style={[styles.balanceValue, { color: theme.income }]}>
            {formatCurrency(totalContributed, settings.currencySymbol, locale)}
          </Text>
          {investment.currentValue && (
            <Text style={styles.lastUpdate}>
              {t('accounts.currentValue')}: {formatCurrency(investment.currentValue, settings.currencySymbol, locale)}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const renderDebt = (debt: Debt, variant: 'iOwe' | 'owedToMe') => {
    const paid = debt.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(debt.totalAmount - paid, 0);
    const progress = debt.totalAmount > 0 ? (paid / debt.totalAmount) * 100 : 0;
    const accentColor = variant === 'iOwe' ? theme.expense : theme.income;

    return (
      <Card
        key={debt.id}
        style={styles.itemCard}
        pressable
        onPress={() => navigation.navigate('DebtDetail', { id: debt.id })}
      >
        <View style={styles.itemHeader}>
          <TintedIcon name="card" color={accentColor} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{debt.creditorName}</Text>
            <Text style={styles.itemSubtitle}>
              {formatCurrency(debt.totalAmount, settings.currencySymbol, locale)} {t('accounts.totalDebt').toLowerCase()}
            </Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: accentColor },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              {t('accounts.paid')}: {formatCurrency(paid, settings.currencySymbol, locale)}
            </Text>
            <Text
              style={[
                styles.progressText,
                variant === 'owedToMe' && { color: theme.income, fontWeight: '600' },
              ]}
            >
              {variant === 'iOwe' ? t('accounts.remaining') : t('debts.pendingToCollect')}:{' '}
              {variant === 'owedToMe' ? '+' : ''}
              {formatCurrency(remaining, settings.currencySymbol, locale)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const SectionHeader = ({
    title,
    onAdd,
  }: {
    title: string;
    onAdd: () => void;
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable style={styles.addButton} onPress={onAdd}>
        <Ionicons name="add-circle" size={28} color={theme.primary} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('accounts.title')}</Text>
            <Pressable
              style={styles.monthCloseButton}
              onPress={() => navigation.navigate('MonthClose')}
            >
              <Ionicons name="checkmark-done-circle-outline" size={18} color={theme.primary} />
              <Text style={styles.monthCloseButtonText}>{t('monthClose.entryPoint')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('accounts.totalBalance')}</Text>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>
              {formatCurrency(totalBankBalance, settings.currencySymbol, locale)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('accounts.investments')}</Text>
            <Text style={[styles.summaryValue, { color: theme.income }]}>
              {formatCurrency(totalInvested, settings.currencySymbol, locale)}
            </Text>
          </Card>
        </View>

        <View style={styles.summaryRow}>
          {totalDebt > 0 && (
            <Card style={[styles.summaryCard, !(totalOwedToMe > 0) && styles.fullWidthCard]}>
              <Text style={styles.summaryLabel}>{t('accounts.totalDebt')}</Text>
              <Text style={[styles.summaryValue, { color: theme.expense }]}>
                -{formatCurrency(totalDebt, settings.currencySymbol, locale)}
              </Text>
            </Card>
          )}
          {totalOwedToMe > 0 && (
            <Card style={[styles.summaryCard, !(totalDebt > 0) && styles.fullWidthCard]}>
              <Text style={styles.summaryLabel}>{t('accounts.owedToMe')}</Text>
              <Text style={[styles.summaryValue, { color: theme.income }]}>
                +{formatCurrency(totalOwedToMe, settings.currencySymbol, locale)}
              </Text>
            </Card>
          )}
        </View>

        {/* Bank Accounts Section */}
        <SectionHeader
          title={t('accounts.bankAccounts')}
          onAdd={() => navigation.navigate('AddAccount')}
        />
        {activeAccounts.length > 0 ? (
          activeAccounts.map(renderBankAccount)
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('accounts.noAccounts')}</Text>
          </Card>
        )}

        {/* Investments Section */}
        <SectionHeader
          title={t('accounts.investments')}
          onAdd={() => navigation.navigate('AddInvestment')}
        />
        {investments.length > 0 ? (
          investments.map(renderInvestment)
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('accounts.noInvestments')}</Text>
          </Card>
        )}

        {/* Debts Section */}
        <SectionHeader
          title={t('accounts.debts')}
          onAdd={() => navigation.navigate('AddDebt')}
        />
        {iOweDebts.length > 0 ? (
          iOweDebts.map((debt) => renderDebt(debt, 'iOwe'))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('accounts.noDebts')}</Text>
          </Card>
        )}

        {owedToMeDebts.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>{t('accounts.owedToMe')}</Text>
            {owedToMeDebts.map((debt) => renderDebt(debt, 'owedToMe'))}
          </>
        )}

        {/* Archived Accounts */}
        {archivedAccounts.length > 0 && (
          <View style={styles.archivedSection}>
            <Pressable
              style={styles.archivedHeader}
              onPress={() => setShowArchived((prev) => !prev)}
            >
              <Text style={styles.sectionTitle}>
                {t('accounts.archivedSection')} ({archivedAccounts.length})
              </Text>
              <Ionicons
                name={showArchived ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
            {showArchived && archivedAccounts.map(renderBankAccount)}
          </View>
        )}
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
  header: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  monthCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  monthCloseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  fullWidthCard: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.income,
    marginTop: 4,
    marginBottom: 8,
  },
  addButton: {
    padding: 4,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  itemSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  itemFooter: {},
  balanceLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.primary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  secondaryText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  lastUpdate: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  provisionChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  provisionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: 160,
  },
  provisionChipText: {
    fontSize: 11,
    color: theme.text,
    fontWeight: '500',
    maxWidth: 70,
  },
  provisionChipBalance: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  provisionAddChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  emptyCard: {
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.textSecondary,
    paddingVertical: 16,
  },
  archivedSection: {
    marginTop: 16,
  },
  archivedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
});
