import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TransactionItem } from '../components/TransactionItem';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { Transaction } from '../types';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterType = 'all' | 'expenses' | 'incomes' | 'transfers';

export const TransactionsScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
    } else if (filter === 'transfers') {
      filtered = filtered.filter((t) => t.type === 'transfer');
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
      <Ionicons name="receipt-outline" size={64} color={theme.textSecondary} />
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          <FilterButton type="all" label={t('transactions.all')} />
          <FilterButton type="expenses" label={t('transactions.expenses')} />
          <FilterButton type="incomes" label={t('transactions.incomes')} />
          <FilterButton type="transfers" label={t('transactions.transfers')} />
        </ScrollView>

        {/* Transaction List */}
        <FlatList
          style={styles.list}
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
          <Pressable
            style={[styles.fab, styles.fabTransfer]}
            onPress={() => navigation.navigate('AddTransaction', { type: 'transfer' })}
          >
            <Ionicons name="swap-horizontal" size={22} color="white" />
          </Pressable>
        </View>
      </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: theme.border,
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
    color: theme.textSecondary,
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
    backgroundColor: theme.expense,
  },
  fabIncome: {
    backgroundColor: theme.income,
  },
  fabTransfer: {
    backgroundColor: theme.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
