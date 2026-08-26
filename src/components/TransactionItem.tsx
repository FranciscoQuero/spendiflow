import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Category } from '../types';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { useStore } from '../store/useStore';
import { t } from '../locales/i18n';
import { TintedIcon } from './TintedIcon';
import { Badge } from './Badge';

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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
        <TintedIcon name="swap-horizontal" color={theme.textSecondary} />

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
      <TintedIcon
        name={(transaction.categoryId && categoryIcons[transaction.categoryId]) || 'receipt'}
        color={category?.color || theme.textSecondary}
      />

      <View style={styles.content}>
        <View style={styles.conceptRow}>
          <Text style={styles.concept} numberOfLines={1}>
            {transaction.concept}
          </Text>
          {isBusiness && <Badge label={t('transactions.business')} color={theme.primary} />}
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

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
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
    color: theme.text,
    flexShrink: 1,
  },
  category: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  expense: {
    color: theme.expense,
  },
  income: {
    color: theme.income,
  },
  neutral: {
    color: theme.textSecondary,
  },
});
