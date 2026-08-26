import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { formatCurrency, formatDateLong } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'TransactionDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TransactionDetailScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { id } = route.params;

  const transactions = useStore((state) => state.transactions);
  const categories = useStore((state) => state.categories);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const settings = useStore((state) => state.settings);

  const transaction = transactions.find((t) => t.id === id);
  const category = categories.find((c) => c.id === transaction?.categoryId);
  const subcategory = category?.subcategories.find(
    (s) => s.id === transaction?.subcategoryId
  );

  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  if (!transaction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('transactions.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      t('transactions.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('AddTransaction', { transactionId: id });
  };

  const getCategoryName = () => {
    if (!transaction.categoryId) return t('transactions.noCategory');
    if (!category) return t('transactions.noCategory');
    return settings.language === 'es' ? category.name : category.nameEn;
  };

  const getSubcategoryName = () => {
    if (!subcategory) return null;
    return settings.language === 'es' ? subcategory.name : subcategory.nameEn;
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return null;
    const account = bankAccounts.find((a) => a.id === accountId);
    return account ? account.name : t('transactions.unknownAccount');
  };

  const accountName = getAccountName(transaction.accountId);
  const fromAccountName = getAccountName(transaction.accountId) ?? t('transactions.unknownAccount');
  const toAccountName = getAccountName(transaction.toAccountId) ?? t('transactions.unknownAccount');
  const scopeLabel =
    transaction.scope === 'business'
      ? t('addTransaction.scopeBusiness')
      : t('addTransaction.scopePersonal');

  const headerTitle = isTransfer
    ? t('transactions.transfer')
    : isExpense
    ? t('transactions.expense')
    : t('transactions.income');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleEdit} style={styles.backButton}>
            <Ionicons name="pencil-outline" size={22} color={theme.text} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.backButton}>
            <Ionicons name="trash-outline" size={22} color={theme.expense} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              isTransfer ? styles.neutralText : isExpense ? styles.expenseText : styles.incomeText,
            ]}
          >
            {isTransfer ? '' : isExpense ? '-' : '+'}
            {formatCurrency(transaction.amount, settings.currencySymbol, locale)}
          </Text>
        </View>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <DetailRow
            icon="document-text"
            label={t('addTransaction.concept')}
            value={transaction.concept}
          />

          {isTransfer ? (
            <>
              <View style={styles.divider} />
              <DetailRow
                icon="swap-horizontal"
                label={t('transfers.title')}
                value={t('transactions.fromTo', { from: fromAccountName, to: toAccountName })}
              />
            </>
          ) : (
            <>
              <View style={styles.divider} />
              <DetailRow
                icon="folder"
                label={t('addTransaction.category')}
                value={getCategoryName()}
                color={category?.color}
              />
              {subcategory && (
                <>
                  <View style={styles.divider} />
                  <DetailRow
                    icon="pricetag"
                    label={t('addTransaction.subcategory')}
                    value={getSubcategoryName() || ''}
                  />
                </>
              )}
              <View style={styles.divider} />
              <DetailRow
                icon="wallet"
                label={t('addTransaction.account')}
                value={accountName || t('addTransaction.noAccount')}
              />
              <View style={styles.divider} />
              <DetailRow
                icon="briefcase-outline"
                label={t('addTransaction.scope')}
                value={scopeLabel}
              />
            </>
          )}

          <View style={styles.divider} />
          <DetailRow
            icon="calendar"
            label={t('addTransaction.date')}
            value={formatDateLong(transaction.date, locale)}
          />
          {transaction.note && (
            <>
              <View style={styles.divider} />
              <DetailRow
                icon="chatbubble"
                label={t('addTransaction.note')}
                value={transaction.note}
              />
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={20} color={theme.textSecondary} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, color && { color }]}>{value}</Text>
    </View>
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
  headerActions: {
    flexDirection: 'row',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  amount: {
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  expenseText: {
    color: theme.expense,
  },
  incomeText: {
    color: theme.income,
  },
  neutralText: {
    color: theme.textSecondary,
  },
  detailsCard: {
    padding: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 48,
  },
});
