import React from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { formatCurrency, formatDateLong } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'TransactionDetail'>;

export const TransactionDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { id } = route.params;

  const transactions = useStore((state) => state.transactions);
  const categories = useStore((state) => state.categories);
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
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpense = transaction.type === 'expense';

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

  const getCategoryName = () => {
    if (!category) return transaction.categoryId || '';
    return settings.language === 'es' ? category.name : category.nameEn;
  };

  const getSubcategoryName = () => {
    if (!subcategory) return null;
    return settings.language === 'es' ? subcategory.name : subcategory.nameEn;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isExpense ? t('transactions.expense') : t('transactions.income')}
        </Text>
        <Pressable onPress={handleDelete} style={styles.backButton}>
          <Ionicons name="trash-outline" size={24} color={colors.expense} />
        </Pressable>
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
              isExpense ? styles.expenseText : styles.incomeText,
            ]}
          >
            {isExpense ? '-' : '+'}
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
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={[styles.detailValue, color && { color }]}>{value}</Text>
  </View>
);

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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
    color: colors.textSecondary,
    fontSize: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  amount: {
    fontSize: 40,
    fontWeight: '700',
  },
  expenseText: {
    color: colors.expense,
  },
  incomeText: {
    color: colors.income,
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
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
});
