import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TransactionItem } from '../components/TransactionItem';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { Transaction } from '../types';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterType = 'all' | 'expenses' | 'incomes';

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const transactions = useStore((state) => state.transactions);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filter === 'expenses') {
      filtered = filtered.filter((t) => t.type === 'expense');
    } else if (filter === 'incomes') {
      filtered = filtered.filter((t) => t.type === 'income');
    }

    // Sort by date descending
    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filter]);

  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      t('common.delete'),
      t('transactions.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteTransaction(transaction.id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TransactionItem
      transaction={item}
      onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
      onLongPress={() => handleDelete(item)}
    />
  );

  const renderSeparator = () => <View style={styles.separator} />;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyText}>{t('transactions.noTransactions')}</Text>
    </View>
  );

  const FilterButton = ({
    type,
    label,
  }: {
    type: FilterType;
    label: string;
  }) => (
    <Pressable
      style={[styles.filterButton, filter === type && styles.filterButtonActive]}
      onPress={() => setFilter(type)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === type && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('transactions.title')}</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <FilterButton type="all" label={t('transactions.all')} />
          <FilterButton type="expenses" label={t('transactions.expenses')} />
          <FilterButton type="incomes" label={t('transactions.incomes')} />
        </View>

        {/* Transaction List */}
        <FlatList
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* FAB */}
        <View style={styles.fabContainer}>
          <Pressable
            style={[styles.fab, styles.fabIncome]}
            onPress={() => navigation.navigate('AddTransaction', { type: 'income' })}
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
          <Pressable
            style={[styles.fab, styles.fabExpense]}
            onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
          >
            <Ionicons name="remove" size={24} color="white" />
          </Pressable>
        </View>
      </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabExpense: {
    backgroundColor: colors.expense,
  },
  fabIncome: {
    backgroundColor: colors.income,
  },
});
