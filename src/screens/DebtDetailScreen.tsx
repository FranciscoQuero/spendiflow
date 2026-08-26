import React, { useState, useMemo } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { AmountInput } from '../components/AmountInput';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { formatCurrency, formatDate, parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { PaymentKind } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'DebtDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DebtDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { id } = route.params;

  const debts = useStore((state) => state.debts);
  const deleteDebt = useStore((state) => state.deleteDebt);
  const addPayment = useStore((state) => state.addPayment);
  const settings = useStore((state) => state.settings);

  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentKind, setPaymentKind] = useState<PaymentKind>('installment');
  const [note, setNote] = useState('');

  const debt = debts.find((d) => d.id === id);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const totalPaid = useMemo(() => {
    if (!debt) return 0;
    return debt.payments.reduce((sum, p) => sum + p.amount, 0);
  }, [debt]);

  const totalInstallments = useMemo(() => {
    if (!debt) return 0;
    return debt.payments
      .filter((p) => p.kind === 'installment')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [debt]);

  const totalExtra = useMemo(() => {
    if (!debt) return 0;
    return debt.payments
      .filter((p) => p.kind === 'extra')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [debt]);

  if (!debt) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('debts.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isIOwe = debt.direction === 'iOwe';
  const remaining = Math.max(debt.totalAmount - totalPaid, 0);
  const progressPercent = debt.totalAmount > 0 ? (totalPaid / debt.totalAmount) * 100 : 0;

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      t('debts.deleteConfirm', { name: debt.creditorName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteDebt(id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('AddDebt', { debtId: id });
  };

  const handleAddPayment = () => {
    const parsedAmount = parseNumber(paymentAmount);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }

    if (parsedAmount > remaining) {
      Alert.alert(t('common.error'), t('debts.paymentExceedsRemaining'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPayment(id, {
      amount: parsedAmount,
      date: getDateISO(),
      note: note.trim() || undefined,
      kind: paymentKind,
    });

    setPaymentAmount('');
    setNote('');
    setPaymentKind('installment');
    setShowAddModal(false);

    // Check if debt is fully paid off
    if (parsedAmount >= remaining) {
      Alert.alert(
        t('common.success'),
        isIOwe ? t('debts.congratsPay') : t('debts.congratsCollect')
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{debt.creditorName}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleEdit} style={styles.backButton}>
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.backButton}>
            <Ionicons name="trash-outline" size={24} color={colors.expense} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          {/* Progress Circle */}
          <View style={styles.progressCircleContainer}>
            <View
              style={[
                styles.progressCircle,
                { borderColor: isIOwe ? colors.income : colors.primary },
              ]}
            >
              <Text style={styles.progressPercent}>{progressPercent.toFixed(0)}%</Text>
              <Text style={styles.progressLabel}>{t('accounts.paid')}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('debts.totalAmount')}</Text>
              <Text style={[styles.statValue, { color: colors.expense }]}>
                {formatCurrency(debt.totalAmount, settings.currencySymbol, locale)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('accounts.paid')}</Text>
              <Text style={[styles.statValue, { color: colors.income }]}>
                {formatCurrency(totalPaid, settings.currencySymbol, locale)}
              </Text>
            </View>
          </View>

          {/* Breakdown: installments vs extra */}
          {(totalInstallments > 0 || totalExtra > 0) && (
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>{t('debts.totalInstallments')}</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(totalInstallments, settings.currencySymbol, locale)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>{t('debts.totalExtra')}</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(totalExtra, settings.currencySymbol, locale)}
                </Text>
              </View>
            </View>
          )}

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: isIOwe ? colors.income : colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Remaining */}
          <View style={styles.remainingContainer}>
            <Text style={styles.remainingLabel}>
              {isIOwe ? t('debts.pendingToPay') : t('debts.pendingToCollect')}
            </Text>
            <Text style={styles.remainingValue}>
              {formatCurrency(remaining, settings.currencySymbol, locale)}
            </Text>
          </View>

          {debt.monthlyPayment !== undefined && (
            <Text style={styles.metaText}>
              {t('debts.monthlyPayment')}:{' '}
              {formatCurrency(debt.monthlyPayment, settings.currencySymbol, locale)}
            </Text>
          )}

          {remaining > 0 && (
            <Pressable
              style={[
                styles.paymentButton,
                { backgroundColor: isIOwe ? colors.income : colors.primary },
              ]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="card" size={20} color="white" />
              <Text style={styles.paymentButtonText}>
                {isIOwe ? t('debts.addPayment') : t('debts.registerCollection')}
              </Text>
            </Pressable>
          )}

          {debt.interestRate !== undefined && (
            <Text style={styles.interestRate}>
              {t('debts.interestRate')}: {debt.interestRate}%
            </Text>
          )}
        </Card>

        {/* Payment History */}
        <Text style={styles.sectionTitle}>
          {isIOwe ? t('debts.paymentHistory') : t('debts.collectionHistory')}
        </Text>
        <Card>
          {debt.payments.length > 0 ? (
            [...debt.payments].reverse().map((payment, index) => (
              <View key={payment.id}>
                <View style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>
                      {formatDate(payment.date, locale)}
                    </Text>
                    <Text style={styles.historyKind}>
                      {payment.kind === 'installment'
                        ? t('debts.installment')
                        : t('debts.extra')}
                    </Text>
                    {payment.note && (
                      <Text style={styles.historyNote}>{payment.note}</Text>
                    )}
                  </View>
                  <Text style={styles.historyAmount}>
                    -{formatCurrency(payment.amount, settings.currencySymbol, locale)}
                  </Text>
                </View>
                {index < debt.payments.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              {isIOwe ? t('debts.noPayments') : t('debts.noCollections')}
            </Text>
          )}
        </Card>

        {debt.note && (
          <>
            <Text style={styles.sectionTitle}>{t('debts.notes')}</Text>
            <Card>
              <Text style={styles.noteText}>{debt.note}</Text>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Add Payment Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {isIOwe ? t('debts.addPayment') : t('debts.registerCollection')}
            </Text>
            <Pressable onPress={handleAddPayment}>
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalHint}>
              {(isIOwe ? t('debts.pendingToPay') : t('debts.pendingToCollect'))}:{' '}
              {formatCurrency(remaining, settings.currencySymbol, locale)}
            </Text>
            <AmountInput
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              type="expense"
            />

            <Text style={styles.inputLabel}>{t('debts.paymentKind')}</Text>
            <View style={styles.kindRow}>
              <Pressable
                style={[
                  styles.kindChip,
                  paymentKind === 'installment' && styles.kindChipSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPaymentKind('installment');
                }}
              >
                <Text
                  style={[
                    styles.kindChipText,
                    paymentKind === 'installment' && styles.kindChipTextSelected,
                  ]}
                >
                  {t('debts.installment')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.kindChip,
                  paymentKind === 'extra' && styles.kindChipSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPaymentKind('extra');
                }}
              >
                <Text
                  style={[
                    styles.kindChipText,
                    paymentKind === 'extra' && styles.kindChipTextSelected,
                  ]}
                >
                  {t('debts.extra')}
                </Text>
              </Pressable>
            </View>

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
  headerActions: {
    flexDirection: 'row',
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
    paddingBottom: 40,
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
  summaryCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  progressCircleContainer: {
    marginBottom: 20,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  remainingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  remainingLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  remainingValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.expense,
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  paymentButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  interestRate: {
    marginTop: 16,
    fontSize: 13,
    color: colors.textSecondary,
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
  historyKind: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  historyNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.income,
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
  noteText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
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
  modalHint: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: 8,
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
  kindRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kindChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  kindChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  kindChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  kindChipTextSelected: {
    color: 'white',
  },
});
