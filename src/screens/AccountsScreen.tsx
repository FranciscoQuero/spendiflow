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
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { formatCurrency, formatDate } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AccountsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const bankAccounts = useStore((state) => state.bankAccounts);
  const investments = useStore((state) => state.investments);
  const debts = useStore((state) => state.debts);
  const settings = useStore((state) => state.settings);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const totalBankBalance = useMemo(() => {
    return bankAccounts.reduce((sum, account) => {
      const lastEntry = account.balanceHistory[account.balanceHistory.length - 1];
      return sum + (lastEntry?.amount || 0);
    }, 0);
  }, [bankAccounts]);

  const totalInvested = useMemo(() => {
    return investments.reduce((sum, inv) => {
      return sum + inv.contributions.reduce((s, c) => s + c.amount, 0);
    }, 0);
  }, [investments]);

  const totalDebt = useMemo(() => {
    return debts.reduce((sum, debt) => {
      const paid = debt.payments.reduce((s, p) => s + p.amount, 0);
      return sum + (debt.totalAmount - paid);
    }, 0);
  }, [debts]);

  const renderBankAccount = (account: typeof bankAccounts[0]) => {
    const lastEntry = account.balanceHistory[account.balanceHistory.length - 1];
    return (
      <Card
        key={account.id}
        style={styles.itemCard}
        pressable
        onPress={() => navigation.navigate('AccountDetail', { id: account.id })}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="wallet" size={20} color="white" />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{account.name}</Text>
            <Text style={styles.itemSubtitle}>{account.bankName}</Text>
          </View>
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.balanceLabel}>{t('accounts.balance')}</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(lastEntry?.amount || 0, settings.currencySymbol, locale)}
          </Text>
          {lastEntry && (
            <Text style={styles.lastUpdate}>
              {t('accounts.lastUpdate')}: {formatDate(lastEntry.date, locale)}
            </Text>
          )}
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
          <View style={[styles.iconCircle, { backgroundColor: colors.income }]}>
            <Ionicons name="trending-up" size={20} color="white" />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{investment.name}</Text>
            <Text style={styles.itemSubtitle}>{investment.type}</Text>
          </View>
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.balanceLabel}>{t('accounts.totalContributed')}</Text>
          <Text style={[styles.balanceValue, { color: colors.income }]}>
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

  const renderDebt = (debt: typeof debts[0]) => {
    const paid = debt.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = debt.totalAmount - paid;
    const progress = (paid / debt.totalAmount) * 100;

    return (
      <Card
        key={debt.id}
        style={styles.itemCard}
        pressable
        onPress={() => navigation.navigate('DebtDetail', { id: debt.id })}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.expense }]}>
            <Ionicons name="card" size={20} color="white" />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{debt.creditorName}</Text>
            <Text style={styles.itemSubtitle}>
              {formatCurrency(debt.totalAmount, settings.currencySymbol, locale)} {t('accounts.totalDebt').toLowerCase()}
            </Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              {t('accounts.paid')}: {formatCurrency(paid, settings.currencySymbol, locale)}
            </Text>
            <Text style={styles.progressText}>
              {t('accounts.remaining')}: {formatCurrency(remaining, settings.currencySymbol, locale)}
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
        <Ionicons name="add-circle" size={28} color={colors.primary} />
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
          <Text style={styles.title}>{t('accounts.title')}</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('accounts.totalBalance')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {formatCurrency(totalBankBalance, settings.currencySymbol, locale)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('accounts.investments')}</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              {formatCurrency(totalInvested, settings.currencySymbol, locale)}
            </Text>
          </Card>
        </View>

        {totalDebt > 0 && (
          <Card style={styles.debtSummaryCard}>
            <Text style={styles.summaryLabel}>{t('accounts.totalDebt')}</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              -{formatCurrency(totalDebt, settings.currencySymbol, locale)}
            </Text>
          </Card>
        )}

        {/* Bank Accounts Section */}
        <SectionHeader
          title={t('accounts.bankAccounts')}
          onAdd={() => navigation.navigate('AddAccount')}
        />
        {bankAccounts.length > 0 ? (
          bankAccounts.map(renderBankAccount)
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
        {debts.length > 0 ? (
          debts.map(renderDebt)
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('accounts.noDebts')}</Text>
          </Card>
        )}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
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
  debtSummaryCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
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
    color: colors.text,
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemFooter: {},
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  lastUpdate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.income,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyCard: {
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 16,
  },
});
