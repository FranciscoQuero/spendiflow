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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AmountInput } from '../components/AmountInput';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { parseNumber } from '../utils/formatters';
import { t } from '../locales/i18n';

export const AddDebtScreen: React.FC = () => {
  const navigation = useNavigation();
  const addDebt = useStore((state) => state.addDebt);

  const [creditorName, setCreditorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!creditorName.trim()) {
      Alert.alert(t('common.error'), 'Please enter a creditor name');
      return;
    }

    const parsedAmount = parseNumber(totalAmount);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid amount');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addDebt({
      creditorName: creditorName.trim(),
      totalAmount: parsedAmount,
      interestRate: parseNumber(interestRate) || undefined,
      note: note.trim() || undefined,
      direction: 'iOwe',
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
        <Text style={styles.title}>{t('accounts.addDebt')}</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Creditor Name */}
        <Text style={styles.label}>Creditor Name</Text>
        <TextInput
          style={styles.textInput}
          value={creditorName}
          onChangeText={setCreditorName}
          placeholder="e.g., Bank Loan, Credit Card"
          placeholderTextColor={colors.textSecondary}
          autoFocus
        />

        {/* Total Amount */}
        <Text style={styles.label}>Total Amount</Text>
        <AmountInput value={totalAmount} onChangeText={setTotalAmount} type="expense" />

        {/* Interest Rate */}
        <Text style={styles.label}>Interest Rate % (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={interestRate}
          onChangeText={setInterestRate}
          placeholder="e.g., 5.5"
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
