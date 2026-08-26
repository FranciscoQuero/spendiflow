import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Category } from '../types';
import { colors } from '../theme/colors';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { useStore } from '../store/useStore';
import { t } from '../locales/i18n';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
}

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  casa: 'home',
  comida: 'restaurant',
  suscripciones: 'repeat',
  ocio: 'game-controller',
  otros: 'ellipsis-horizontal',
  viajes: 'airplane',
  salario: 'briefcase',
  bonus: 'gift',
  'otros-ingresos': 'cash',
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
  onLongPress,
}) => {
  const categories = useStore((state) => state.categories);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const settings = useStore((state) => state.settings);

  const category = categories.find((c) => c.id === transaction.categoryId);
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const getCategoryName = (cat: Category | undefined) => {
    if (!transaction.categoryId) return t('transactions.noCategory');
    if (!cat) return t('transactions.noCategory');
    return settings.language === 'es' ? cat.name : cat.nameEn;
  };

  const getAccountName = (accountId: string | undefined) => {
    if (!accountId) return null;
    const account = bankAccounts.find((a) => a.id === accountId);
    return account ? account.name : t('transactions.unknownAccount');
  };

  if (isTransfer) {
    const fromName = getAccountName(transaction.accountId) ?? t('transactions.unknownAccount');
    const toName = getAccountName(transaction.toAccountId) ?? t('transactions.unknownAccount');

    return (
      <Pressable
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.textSecondary }]}>
          <Ionicons name="swap-horizontal" size={20} color="white" />
        </View>

        <View style={styles.content}>
          <Text style={styles.concept} numberOfLines={1}>
            {t('transactions.fromTo', { from: fromName, to: toName })}
          </Text>
          <Text style={styles.category}>
            {formatRelativeDate(transaction.date, t('common.today'), t('common.yesterday'))}
          </Text>
        </View>

        <Text style={[styles.amount, styles.neutral]}>
          {formatCurrency(transaction.amount, settings.currencySymbol, locale)}
        </Text>
      </Pressable>
    );
  }

  const accountName = getAccountName(transaction.accountId);
  const isBusiness = transaction.scope === 'business';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: category?.color || colors.textSecondary },
        ]}
      >
        <Ionicons
          name={(transaction.categoryId && categoryIcons[transaction.categoryId]) || 'receipt'}
          size={20}
          color="white"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.conceptRow}>
          <Text style={styles.concept} numberOfLines={1}>
            {transaction.concept}
          </Text>
          {isBusiness && (
            <View style={styles.businessBadge}>
              <Text style={styles.businessBadgeText}>{t('transactions.business')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.category} numberOfLines={1}>
          {getCategoryName(category)} • {formatRelativeDate(
            transaction.date,
            t('common.today'),
            t('common.yesterday')
          )}
          {accountName ? ` • ${accountName}` : ''}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          isExpense ? styles.expense : styles.income,
        ]}
      >
        {isExpense ? '-' : '+'}
        {formatCurrency(transaction.amount, settings.currencySymbol, locale)}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  conceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  concept: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flexShrink: 1,
  },
  businessBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  businessBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
  },
  category: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expense: {
    color: colors.expense,
  },
  income: {
    color: colors.income,
  },
  neutral: {
    color: colors.textSecondary,
  },
});
