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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AmountInput } from '../components/AmountInput';
import { FormScrollView } from '../components/FormScrollView';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { AccountRole } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'AddAccount'>;

const ROLE_OPTIONS: AccountRole[] = ['personal', 'business', 'shared', 'savings', 'other'];

const roleLabel = (role: AccountRole): string => {
  switch (role) {
    case 'personal':
      return t('accounts.roleOptions.personal');
    case 'business':
      return t('accounts.roleOptions.business');
    case 'shared':
      return t('accounts.roleOptions.shared');
    case 'savings':
      return t('accounts.roleOptions.savings');
    case 'other':
    default:
      return t('accounts.roleOptions.other');
  }
};

export const AddAccountScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const accountId = route.params?.accountId;

  const bankAccounts = useStore((state) => state.bankAccounts);
  const addBankAccount = useStore((state) => state.addBankAccount);
  const updateBankAccount = useStore((state) => state.updateBankAccount);
  const addBalanceEntry = useStore((state) => state.addBalanceEntry);

  const existingAccount = accountId
    ? bankAccounts.find((a) => a.id === accountId)
    : undefined;
  const isEditMode = !!existingAccount;

  const [name, setName] = useState(existingAccount?.name ?? '');
  const [bankName, setBankName] = useState(existingAccount?.bankName ?? '');
  const [initialBalance, setInitialBalance] = useState('');
  const [role, setRole] = useState<AccountRole>(existingAccount?.role ?? 'personal');
  const [floor, setFloor] = useState(
    existingAccount?.floor !== undefined ? String(existingAccount.floor) : ''
  );
  const [ownershipPercent, setOwnershipPercent] = useState(
    existingAccount ? String(Math.round(existingAccount.ownershipShare * 100)) : '100'
  );
  // Solo auto-sugerimos el 50% en cuentas nuevas mientras el usuario no lo haya tocado.
  const [ownershipTouched, setOwnershipTouched] = useState(isEditMode);

  const handleSelectRole = (nextRole: AccountRole) => {
    Haptics.selectionAsync();
    setRole(nextRole);
    if (!ownershipTouched) {
      setOwnershipPercent(nextRole === 'shared' ? '50' : '100');
    }
  };

  const handleChangeOwnership = (value: string) => {
    setOwnershipTouched(true);
    setOwnershipPercent(value.replace(/[^0-9]/g, ''));
  };

  const handleSave = () => {
    try {
      if (!name.trim()) {
        Alert.alert(t('common.error'), t('accounts.pleaseEnterAccountName'));
        return;
      }

      if (!bankName.trim()) {
        Alert.alert(t('common.error'), t('accounts.pleaseEnterBankName'));
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const parsedFloor = floor.trim() ? parseNumber(floor) : undefined;
      const parsedOwnership = Math.min(
        100,
        Math.max(0, ownershipPercent.trim() ? parseInt(ownershipPercent, 10) : 100)
      );
      const ownershipShare = parsedOwnership / 100;

      if (isEditMode && accountId) {
        updateBankAccount(accountId, {
          name: name.trim(),
          bankName: bankName.trim(),
          role,
          floor: parsedFloor,
          ownershipShare,
        });
        navigation.goBack();
        return;
      }

      const newAccountId = addBankAccount({
        name: name.trim(),
        bankName: bankName.trim(),
        role,
        floor: parsedFloor,
        ownershipShare,
        archived: false,
      });

      const balance = parseNumber(initialBalance);
      if (balance > 0) {
        addBalanceEntry(newAccountId, {
          amount: balance,
          date: getDateISO(),
          note: t('accounts.initialBalanceNote'),
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving account:', error);
      Alert.alert(t('common.error'), String(error));
    }
  };

  const canSave = name.trim() && bankName.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>
          {isEditMode ? t('accounts.editAccount') : t('accounts.addAccount')}
        </Text>
        <View style={styles.closeButton} />
      </View>

      <FormScrollView>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Account Name */}
          <Text style={styles.label}>{t('accounts.accountName')}</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder={t('accounts.accountNamePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            autoFocus={!isEditMode}
          />

          {/* Bank Name */}
          <Text style={styles.label}>{t('accounts.bankName')}</Text>
          <TextInput
            style={styles.textInput}
            value={bankName}
            onChangeText={setBankName}
            placeholder={t('accounts.bankNamePlaceholder')}
            placeholderTextColor={theme.textSecondary}
          />

          {/* Role */}
          <Text style={styles.label}>{t('accounts.role')}</Text>
          <View style={styles.chipRow}>
            {ROLE_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={[styles.chip, role === option && styles.chipSelected]}
                onPress={() => handleSelectRole(option)}
              >
                <Text
                  style={[styles.chipText, role === option && styles.chipTextSelected]}
                >
                  {roleLabel(option)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Floor */}
          <Text style={styles.label}>{t('accounts.floor')}</Text>
          <Text style={styles.hint}>{t('accounts.floorHint')}</Text>
          <TextInput
            style={styles.textInput}
            value={floor}
            onChangeText={setFloor}
            placeholder={t('accounts.floorPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
          />

          {/* Ownership Share */}
          <Text style={styles.label}>{t('accounts.ownershipShare')}</Text>
          <View style={styles.percentRow}>
            <TextInput
              style={[styles.textInput, styles.percentInput]}
              value={ownershipPercent}
              onChangeText={handleChangeOwnership}
              placeholder={t('accounts.ownershipSharePlaceholder')}
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.percentSign}>%</Text>
          </View>

          {/* Initial Balance (only when creating) */}
          {!isEditMode && (
            <>
              <Text style={styles.label}>{t('accounts.initialBalance')}</Text>
              <AmountInput value={initialBalance} onChangeText={setInitialBalance} type="income" />
            </>
          )}
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
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 8,
    marginTop: -4,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  chipTextSelected: {
    color: 'white',
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentInput: {
    flex: 1,
  },
  percentSign: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textSecondary,
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
});
