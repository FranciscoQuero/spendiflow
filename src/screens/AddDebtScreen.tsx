import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AmountInput } from '../components/AmountInput';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { parseNumber } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { DebtDirection } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'AddDebt'>;

export const AddDebtScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const debtId = route.params?.debtId;

  const debts = useStore((state) => state.debts);
  const addDebt = useStore((state) => state.addDebt);
  const updateDebt = useStore((state) => state.updateDebt);

  const existingDebt = debtId ? debts.find((d) => d.id === debtId) : undefined;
  const isEditMode = !!existingDebt;

  const [direction, setDirection] = useState<DebtDirection>(
    existingDebt?.direction ?? 'iOwe'
  );
  const [creditorName, setCreditorName] = useState(existingDebt?.creditorName ?? '');
  const [totalAmount, setTotalAmount] = useState(
    existingDebt ? String(existingDebt.totalAmount) : ''
  );
  const [interestRate, setInterestRate] = useState(
    existingDebt?.interestRate !== undefined ? String(existingDebt.interestRate) : ''
  );
  const [monthlyPayment, setMonthlyPayment] = useState(
    existingDebt?.monthlyPayment !== undefined ? String(existingDebt.monthlyPayment) : ''
  );
  const [note, setNote] = useState(existingDebt?.note ?? '');

  const isIOwe = direction === 'iOwe';

  const handleSave = () => {
    if (!creditorName.trim()) {
      Alert.alert(
        t('common.error'),
        isIOwe ? t('debts.pleaseEnterCreditorName') : t('debts.pleaseEnterDebtorName')
      );
      return;
    }

    const parsedAmount = parseNumber(totalAmount);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const parsedInterestRate = interestRate.trim() ? parseNumber(interestRate) : undefined;
    const parsedMonthlyPayment = monthlyPayment.trim()
      ? parseNumber(monthlyPayment)
      : undefined;

    if (isEditMode && debtId) {
      updateDebt(debtId, {
        creditorName: creditorName.trim(),
        totalAmount: parsedAmount,
        interestRate: parsedInterestRate,
        monthlyPayment: parsedMonthlyPayment,
        note: note.trim() || undefined,
        direction,
      });
      navigation.goBack();
      return;
    }

    addDebt({
      creditorName: creditorName.trim(),
      totalAmount: parsedAmount,
      interestRate: parsedInterestRate,
      monthlyPayment: parsedMonthlyPayment,
      note: note.trim() || undefined,
      direction,
    });

    navigation.goBack();
  };

  const canSave = creditorName.trim() && parseNumber(totalAmount) > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>
          {isEditMode ? t('debts.editDebt') : t('accounts.addDebt')}
        </Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Direction */}
        <Text style={styles.label}>{t('debts.direction')}</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, isIOwe && styles.chipSelectedExpense]}
            onPress={() => {
              Haptics.selectionAsync();
              setDirection('iOwe');
            }}
          >
            <Text style={[styles.chipText, isIOwe && styles.chipTextSelected]}>
              {t('debts.iOwe')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, !isIOwe && styles.chipSelectedIncome]}
            onPress={() => {
              Haptics.selectionAsync();
              setDirection('owedToMe');
            }}
          >
            <Text style={[styles.chipText, !isIOwe && styles.chipTextSelected]}>
              {t('debts.owedToMe')}
            </Text>
          </Pressable>
        </View>

        {/* Creditor / Debtor Name */}
        <Text style={styles.label}>
          {isIOwe ? t('debts.creditorName') : t('debts.debtorName')}
        </Text>
        <TextInput
          style={styles.textInput}
          value={creditorName}
          onChangeText={setCreditorName}
          placeholder={
            isIOwe ? t('debts.creditorNamePlaceholder') : t('debts.debtorNamePlaceholder')
          }
          placeholderTextColor={colors.textSecondary}
          autoFocus={!isEditMode}
        />

        {/* Total Amount */}
        <Text style={styles.label}>{t('debts.totalAmount')}</Text>
        <AmountInput value={totalAmount} onChangeText={setTotalAmount} type="expense" />

        {/* Monthly Payment */}
        <Text style={styles.label}>{t('debts.monthlyPayment')}</Text>
        <TextInput
          style={styles.textInput}
          value={monthlyPayment}
          onChangeText={setMonthlyPayment}
          placeholder={t('debts.monthlyPaymentPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
        />

        {/* Interest Rate */}
        <Text style={styles.label}>{t('debts.interestRate')}</Text>
        <TextInput
          style={styles.textInput}
          value={interestRate}
          onChangeText={setInterestRate}
          placeholder={t('debts.interestRatePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
        />

        {/* Note */}
        <Text style={styles.label}>{t('addTransaction.note')}</Text>
        <TextInput
          style={[styles.textInput, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder={t('addTransaction.notePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
        />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, !canSave && styles.disabledButton]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </Pressable>
      </View>
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipSelectedExpense: {
    backgroundColor: colors.expense,
    borderColor: colors.expense,
  },
  chipSelectedIncome: {
    backgroundColor: colors.income,
    borderColor: colors.income,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: 'white',
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.expense,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
