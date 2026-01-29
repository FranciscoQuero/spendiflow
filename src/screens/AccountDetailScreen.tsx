import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { AmountInput } from '../components/AmountInput';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { formatCurrency, formatDate, parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'AccountDetail'>;

export const AccountDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { id } = route.params;

  const bankAccounts = useStore((state) => state.bankAccounts);
  const deleteBankAccount = useStore((state) => state.deleteBankAccount);
  const addBalanceEntry = useStore((state) => state.addBalanceEntry);
  const settings = useStore((state) => state.settings);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [note, setNote] = useState('');

  const account = bankAccounts.find((a) => a.id === id);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  if (!account) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Account not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentBalance = account.balanceHistory[account.balanceHistory.length - 1]?.amount || 0;

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      `Delete "${account.name}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteBankAccount(id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAddBalance = () => {
    const parsedAmount = parseNumber(newBalance);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid amount');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addBalanceEntry(id, {
      amount: parsedAmount,
      date: getDateISO(),
      note: note.trim() || undefined,
    });

    setNewBalance('');
    setNote('');
    setShowAddModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{account.name}</Text>
        <Pressable onPress={handleDelete} style={styles.backButton}>
          <Ionicons name="trash-outline" size={24} color={colors.expense} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Current Balance */}
        <Card style={styles.balanceCard}>
          <Text style={styles.bankName}>{account.bankName}</Text>
          <Text style={styles.balanceLabel}>{t('accounts.balance')}</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(currentBalance, settings.currencySymbol, locale)}
          </Text>
          <Pressable
            style={styles.updateButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.updateButtonText}>
              {t('accounts.updateBalance')}
            </Text>
          </Pressable>
        </Card>

        {/* Balance History */}
        <Text style={styles.sectionTitle}>Balance History</Text>
        <Card>
          {account.balanceHistory.length > 0 ? (
            [...account.balanceHistory].reverse().map((entry, index) => (
              <View key={entry.id}>
                <View style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>
                      {formatDate(entry.date, locale)}
                    </Text>
                    {entry.note && (
                      <Text style={styles.historyNote}>{entry.note}</Text>
                    )}
                  </View>
                  <Text style={styles.historyAmount}>
                    {formatCurrency(entry.amount, settings.currencySymbol, locale)}
                  </Text>
                </View>
                {index < account.balanceHistory.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No balance history</Text>
          )}
        </Card>
      </ScrollView>

      {/* Add Balance Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{t('accounts.updateBalance')}</Text>
            <Pressable onPress={handleAddBalance}>
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <AmountInput value={newBalance} onChangeText={setNewBalance} type="income" />
            <Text style={styles.inputLabel}>{t('addTransaction.note')}</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder={t('addTransaction.notePlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

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
  balanceCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bankName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginVertical: 8,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  updateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyDate: {
    fontSize: 15,
    color: colors.text,
  },
  historyNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
