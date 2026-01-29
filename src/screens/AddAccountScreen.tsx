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
import { parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';

export const AddAccountScreen: React.FC = () => {
  const navigation = useNavigation();
  const addBankAccount = useStore((state) => state.addBankAccount);
  const addBalanceEntry = useStore((state) => state.addBalanceEntry);

  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  const handleSave = () => {
    try {
      if (!name.trim()) {
        Alert.alert(t('common.error'), 'Please enter an account name');
        return;
      }

      if (!bankName.trim()) {
        Alert.alert(t('common.error'), 'Please enter a bank name');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Create the account
      addBankAccount({
        name: name.trim(),
        bankName: bankName.trim(),
      });

      // Get the last added account to add initial balance
      const accounts = useStore.getState().bankAccounts;
      const newAccount = accounts[accounts.length - 1];

      const balance = parseNumber(initialBalance);
      if (newAccount && balance > 0) {
        addBalanceEntry(newAccount.id, {
          amount: balance,
          date: getDateISO(),
          note: 'Initial balance',
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error adding account:', error);
      Alert.alert(t('common.error'), 'Error creating account: ' + String(error));
    }
  };

  const canSave = name.trim() && bankName.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('accounts.addAccount')}</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Account Name */}
        <Text style={styles.label}>Account Name</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Main Checking"
          placeholderTextColor={colors.textSecondary}
          autoFocus
        />

        {/* Bank Name */}
        <Text style={styles.label}>Bank Name</Text>
        <TextInput
          style={styles.textInput}
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g., BBVA, Santander"
          placeholderTextColor={colors.textSecondary}
        />

        {/* Initial Balance */}
        <Text style={styles.label}>Initial Balance (optional)</Text>
        <AmountInput value={initialBalance} onChangeText={setInitialBalance} type="income" />
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
});
