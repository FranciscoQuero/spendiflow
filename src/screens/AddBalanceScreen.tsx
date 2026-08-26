import React, { useState, useMemo } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AmountInput } from '../components/AmountInput';
import { Card } from '../components/Card';
import { FormScrollView } from '../components/FormScrollView';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { parseNumber, getDateISO, formatCurrency } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AddBalanceScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation<NavigationProp>();
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
      Alert.alert(t('common.error'), t('accounts.pleaseSelectAccount'));
      return;
    }

    const parsedAmount = parseNumber(amount);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
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
            <Ionicons name="close" size={28} color={theme.text} />
          </Pressable>
          <Text style={styles.title}>{t('accounts.updateBalance')}</Text>
          <View style={styles.closeButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color={theme.textSecondary} />
          <Text style={styles.emptyText}>{t('accounts.noAccounts')}</Text>
          <Pressable
            style={styles.createButton}
            onPress={() => navigation.navigate('AddAccount')}
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
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>{t('accounts.updateBalance')}</Text>
        <View style={styles.closeButton} />
      </View>

      <FormScrollView>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Account Selection */}
        <Text style={styles.label}>{t('accounts.selectAccount')}</Text>
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
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </Card>
          );
        })}

        {/* Amount Input */}
        <Text style={[styles.label, { marginTop: 24 }]}>{t('accounts.newBalance')}</Text>
        <AmountInput value={amount} onChangeText={setAmount} type="income" />

        {/* Note */}
        <Text style={styles.label}>{t('addTransaction.note')}</Text>
        <TextInput
          style={styles.textInput}
          value={note}
          onChangeText={setNote}
          placeholder={t('addTransaction.notePlaceholder')}
          placeholderTextColor={theme.textSecondary}
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
      </FormScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    color: theme.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
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
    borderColor: theme.primary,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  accountBank: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginRight: 12,
  },
  textInput: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  saveButton: {
    backgroundColor: theme.primary,
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
    color: theme.textSecondary,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 24,
    backgroundColor: theme.primary,
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
