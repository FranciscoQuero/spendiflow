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
  const settings = useStore((state) => state.settings);

  const category = categories.find((c) => c.id === transaction.categoryId);
  const isExpense = transaction.type === 'expense';
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const getCategoryName = (cat: Category | undefined) => {
    if (!cat) return transaction.categoryId;
    return settings.language === 'es' ? cat.name : cat.nameEn;
  };

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
        <Text style={styles.concept} numberOfLines={1}>
          {transaction.concept}
        </Text>
        <Text style={styles.category}>
          {getCategoryName(category)} • {formatRelativeDate(
            transaction.date,
            t('common.today'),
            t('common.yesterday')
          )}
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
  concept: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
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
});
