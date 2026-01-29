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
import { Card } from '../components/Card';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { parseNumber, getDateISO, formatCurrency } from '../utils/formatters';
import { t } from '../locales/i18n';

export const AddBalanceScreen: React.FC = () => {
  const navigation = useNavigation();
  const bankAccounts = useStore((state) => state.bankAccounts);
  const addBalanceEntry = useStore((state) => state.addBalanceEntry);
  const settings = useStore((state) => state.settings);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    bankAccounts[0]?.id || null
  );
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!selectedAccountId) {
      Alert.alert(t('common.error'), 'Please select an account');
      return;
    }

    const parsedAmount = parseNumber(amount);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid amount');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addBalanceEntry(selectedAccountId, {
      amount: parsedAmount,
      date: getDateISO(),
      note: note.trim() || undefined,
    });

    navigation.goBack();
  };

  const canSave = selectedAccountId && parseNumber(amount) > 0;

  if (bankAccounts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{t('accounts.updateBalance')}</Text>
          <View style={styles.closeButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>{t('accounts.noAccounts')}</Text>
          <Pressable
            style={styles.createButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to add account
            }}
          >
            <Text style={styles.createButtonText}>{t('accounts.addAccount')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('accounts.updateBalance')}</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Account Selection */}
        <Text style={styles.label}>Select Account</Text>
        {bankAccounts.map((account) => {
          const lastBalance = account.balanceHistory[account.balanceHistory.length - 1];
          return (
            <Card
              key={account.id}
              style={[
                styles.accountCard,
                selectedAccountId === account.id && styles.accountCardSelected,
              ]}
              pressable
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedAccountId(account.id);
              }}
            >
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountBank}>{account.bankName}</Text>
              </View>
              {lastBalance && (
                <Text style={styles.accountBalance}>
                  {formatCurrency(lastBalance.amount, settings.currencySymbol, locale)}
                </Text>
              )}
              {selectedAccountId === account.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </Card>
          );
        })}

        {/* Amount Input */}
        <Text style={[styles.label, { marginTop: 24 }]}>New Balance</Text>
        <AmountInput value={amount} onChangeText={setAmount} type="income" />

        {/* Note */}
        <Text style={styles.label}>{t('addTransaction.note')}</Text>
        <TextInput
          style={styles.textInput}
          value={note}
          onChangeText={setNote}
          placeholder={t('addTransaction.notePlaceholder')}
          placeholderTextColor={colors.textSecondary}
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
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  accountBank: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 12,
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
  footer: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
