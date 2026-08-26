import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Card } from '../components/Card';
import { AmountInput } from '../components/AmountInput';
import { FormScrollView } from '../components/FormScrollView';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { t, setLocale } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { AppSettings } from '../types';
import { formatCurrency, parseNumber } from '../utils/formatters';
import {
  validateBackup,
  writeBackupFile,
  shareBackupFile,
  pickAndReadBackupFile,
  summarizeBackup,
} from '../utils/backup';
import { formatReminderTime, syncDailyReminder } from '../utils/reminders';

const DEFAULT_REMINDER_HOUR = 21;
const DEFAULT_REMINDER_MINUTE = 30;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CURRENCY_OPTIONS: { currency: string; currencySymbol: string; label: string }[] = [
  { currency: 'EUR', currencySymbol: '€', label: 'EUR €' },
  { currency: 'USD', currencySymbol: '$', label: 'USD $' },
  { currency: 'GBP', currencySymbol: '£', label: 'GBP £' },
];

const THEME_OPTIONS: { value: AppSettings['theme']; labelKey: string }[] = [
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'dark', labelKey: 'settings.themeDark' },
  { value: 'system', labelKey: 'settings.themeSystem' },
];

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation<NavigationProp>();
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const resetAllData = useStore((state) => state.resetAllData);
  const categories = useStore((state) => state.categories);
  const bankAccounts = useStore((state) => state.bankAccounts);

  const activeAccounts = useMemo(
    () => bankAccounts.filter((a) => !a.archived),
    [bankAccounts]
  );

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';
  const [isSyncingReminder, setIsSyncingReminder] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

  const reminderEnabled = settings.dailyReminder?.enabled ?? false;
  const reminderHour = settings.dailyReminder?.hour ?? DEFAULT_REMINDER_HOUR;
  const reminderMinute = settings.dailyReminder?.minute ?? DEFAULT_REMINDER_MINUTE;

  const handleLanguageChange = (language: 'es' | 'en') => {
    updateSettings({ language });
    setLocale(language);
    // No hace falta forceUpdate: este componente ya está suscrito a
    // `state.settings` vía useStore, así que updateSettings provoca su
    // propio re-render (nueva referencia de `settings`).
  };

  const handleCurrencyChange = (currency: string, currencySymbol: string) => {
    updateSettings({ currency, currencySymbol });
  };

  const handleThemeChange = (themeSetting: AppSettings['theme']) => {
    updateSettings({ theme: themeSetting });
  };

  const openBudgetModal = () => {
    setBudgetInput(
      settings.monthlyBudget && settings.monthlyBudget > 0
        ? String(settings.monthlyBudget).replace('.', ',')
        : ''
    );
    setShowBudgetModal(true);
  };

  const closeBudgetModal = () => {
    setShowBudgetModal(false);
    setBudgetInput('');
  };

  const handleSaveBudget = () => {
    const trimmed = budgetInput.trim();
    if (trimmed === '') {
      updateSettings({ monthlyBudget: undefined });
      closeBudgetModal();
      return;
    }

    const parsed = parseNumber(trimmed);
    if (parsed <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }

    updateSettings({ monthlyBudget: parsed });
    closeBudgetModal();
  };

  const handleRemoveBudget = () => {
    updateSettings({ monthlyBudget: undefined });
    closeBudgetModal();
  };

  const handleDefaultAccountChange = (accountId: string | undefined) => {
    updateSettings({ defaultAccountId: accountId });
  };

  const handleReminderToggle = async (value: boolean) => {
    if (isSyncingReminder) return;
    Haptics.selectionAsync();

    const nextReminder: NonNullable<AppSettings['dailyReminder']> = {
      enabled: value,
      hour: settings.dailyReminder?.hour ?? DEFAULT_REMINDER_HOUR,
      minute: settings.dailyReminder?.minute ?? DEFAULT_REMINDER_MINUTE,
    };
    updateSettings({ dailyReminder: nextReminder });

    if (!value) {
      setShowReminderTimePicker(false);
      await syncDailyReminder(useStore.getState().settings);
      return;
    }

    setIsSyncingReminder(true);
    try {
      const result = await syncDailyReminder(useStore.getState().settings);
      if (result.status === 'permission-denied') {
        updateSettings({ dailyReminder: { ...nextReminder, enabled: false } });
        Alert.alert(
          t('settings.dailyReminderPermissionTitle'),
          t('settings.dailyReminderPermissionMessage')
        );
      }
    } finally {
      setIsSyncingReminder(false);
    }
  };

  const handleReminderTimeChange = async (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      setShowReminderTimePicker(false);
    }
    if (event.type === 'dismissed' || !selectedDate) return;

    const nextReminder: NonNullable<AppSettings['dailyReminder']> = {
      enabled: true,
      hour: selectedDate.getHours(),
      minute: selectedDate.getMinutes(),
    };
    updateSettings({ dailyReminder: nextReminder });
    await syncDailyReminder(useStore.getState().settings);
  };

  const handleResetData = () => {
    Alert.alert(
      t('settings.deleteAllData'),
      t('settings.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            resetAllData();
            Alert.alert(t('common.success'), t('settings.dataDeletedMessage'));
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const state = useStore.getState();
      const uri = writeBackupFile({
        transactions: state.transactions,
        categories: state.categories,
        bankAccounts: state.bankAccounts,
        investments: state.investments,
        debts: state.debts,
        provisions: state.provisions,
        recurringRules: state.recurringRules,
        plannedEvents: state.plannedEvents,
        settings: state.settings,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await shareBackupFile(uri);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message =
        error instanceof Error && error.message === 'sharingUnavailable'
          ? t('settings.exportSharingUnavailable')
          : t('settings.exportErrorMessage');
      Alert.alert(t('settings.exportErrorTitle'), message);
    } finally {
      setIsExporting(false);
    }
  };

  const applyImportedBackup = (parsed: unknown) => {
    const result = validateBackup(parsed);
    if (!result.ok) {
      Alert.alert(t('settings.importErrorTitle'), t('settings.importErrorInvalidFile'));
      return;
    }

    Alert.alert(
      t('settings.importConfirmTitle'),
      t('settings.importConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            const { data } = result.data;
            useStore.setState({
              transactions: data.transactions,
              categories: data.categories,
              bankAccounts: data.bankAccounts,
              investments: data.investments,
              debts: data.debts,
              provisions: data.provisions,
              recurringRules: data.recurringRules,
              plannedEvents: data.plannedEvents,
              settings: data.settings,
            });
            setLocale(data.settings.language);

            const summary = summarizeBackup(data);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              t('settings.importSuccessTitle'),
              t('settings.importSuccessMessage', summary)
            );
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    if (isImporting) return;
    setIsImporting(true);
    try {
      const parsed = await pickAndReadBackupFile();
      if (parsed === null) {
        // Usuario canceló la selección de archivo.
        return;
      }
      applyImportedBackup(parsed);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('settings.importErrorTitle'), t('settings.importErrorGeneric'));
    } finally {
      setIsImporting(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    showChevron = true,
    danger = false,
    loading = false,
    disabled = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    danger?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress || disabled}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? theme.expense : theme.textSecondary}
        />
        <Text style={[styles.settingLabel, danger && styles.dangerText]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.textSecondary} />
        ) : (
          <>
            {value && <Text style={styles.settingValue}>{value}</Text>}
            {showChevron && onPress && (
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            )}
          </>
        )}
      </View>
    </Pressable>
  );

  const LanguageOption = ({
    language,
    label,
  }: {
    language: 'es' | 'en';
    label: string;
  }) => (
    <Pressable
      style={[
        styles.languageOption,
        settings.language === language && styles.languageOptionActive,
      ]}
      onPress={() => handleLanguageChange(language)}
    >
      <Text
        style={[
          styles.languageText,
          settings.language === language && styles.languageTextActive,
        ]}
      >
        {label}
      </Text>
      {settings.language === language && (
        <Ionicons name="checkmark" size={20} color={theme.primary} />
      )}
    </Pressable>
  );

  const CurrencyOption = ({
    currency,
    currencySymbol,
    label,
  }: {
    currency: string;
    currencySymbol: string;
    label: string;
  }) => {
    const active = settings.currency === currency;
    return (
      <Pressable
        style={[styles.languageOption, active && styles.languageOptionActive]}
        onPress={() => handleCurrencyChange(currency, currencySymbol)}
      >
        <Text style={[styles.languageText, active && styles.languageTextActive]}>
          {label}
        </Text>
        {active && <Ionicons name="checkmark" size={20} color={theme.primary} />}
      </Pressable>
    );
  };

  const ThemeOption = ({
    value,
    label,
  }: {
    value: AppSettings['theme'];
    label: string;
  }) => {
    const active = settings.theme === value;
    return (
      <Pressable
        style={[styles.languageOption, active && styles.languageOptionActive]}
        onPress={() => handleThemeChange(value)}
      >
        <Text style={[styles.languageText, active && styles.languageTextActive]}>
          {label}
        </Text>
        {active && <Ionicons name="checkmark" size={20} color={theme.primary} />}
      </Pressable>
    );
  };

  const DefaultAccountOption = ({
    accountId,
    label,
  }: {
    accountId: string | undefined;
    label: string;
  }) => {
    const active = settings.defaultAccountId === accountId;
    return (
      <Pressable
        style={[styles.languageOption, active && styles.languageOptionActive]}
        onPress={() => handleDefaultAccountChange(accountId)}
      >
        <Text style={[styles.languageText, active && styles.languageTextActive]}>
          {label}
        </Text>
        {active && <Ionicons name="checkmark" size={20} color={theme.primary} />}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        {/* Language Section */}
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <Card style={styles.card}>
          <LanguageOption language="es" label={t('settings.spanish')} />
          <View style={styles.divider} />
          <LanguageOption language="en" label={t('settings.english')} />
        </Card>

        {/* Theme Section */}
        <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
        <Card style={styles.card}>
          {THEME_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <View style={styles.divider} />}
              <ThemeOption value={option.value} label={t(option.labelKey)} />
            </React.Fragment>
          ))}
        </Card>

        {/* Reminders Section */}
        <Text style={styles.sectionTitle}>{t('settings.reminders')}</Text>
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={theme.textSecondary}
              />
              <Text style={styles.settingLabel}>{t('settings.dailyReminder')}</Text>
            </View>
            {isSyncingReminder ? (
              <ActivityIndicator size="small" color={theme.textSecondary} />
            ) : (
              <Switch
                value={reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ false: theme.border, true: theme.primaryLight }}
                thumbColor={reminderEnabled ? theme.primary : '#f4f3f4'}
              />
            )}
          </View>
          {reminderEnabled && (
            <>
              <View style={styles.divider} />
              <Pressable
                style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
                onPress={() => setShowReminderTimePicker((prev) => !prev)}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="time-outline" size={22} color={theme.textSecondary} />
                  <Text style={styles.settingLabel}>{t('settings.dailyReminderTime')}</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>
                    {formatReminderTime(reminderHour, reminderMinute)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </View>
              </Pressable>
              {showReminderTimePicker && (
                <View
                  style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}
                >
                  <DateTimePicker
                    value={(() => {
                      const date = new Date();
                      date.setHours(reminderHour, reminderMinute, 0, 0);
                      return date;
                    })()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleReminderTimeChange}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable
                      style={styles.doneButton}
                      onPress={() => setShowReminderTimePicker(false)}
                    >
                      <Text style={styles.doneButtonText}>{t('recurring.done')}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </>
          )}
        </Card>

        {/* Currency Section */}
        <Text style={styles.sectionTitle}>{t('settings.currency')}</Text>
        <Card style={styles.card}>
          {CURRENCY_OPTIONS.map((option, index) => (
            <React.Fragment key={option.currency}>
              {index > 0 && <View style={styles.divider} />}
              <CurrencyOption
                currency={option.currency}
                currencySymbol={option.currencySymbol}
                label={option.label}
              />
            </React.Fragment>
          ))}
        </Card>

        {/* Budget Section */}
        <Text style={styles.sectionTitle}>{t('settings.budget')}</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="wallet-outline"
            label={t('settings.monthlyBudget')}
            value={
              settings.monthlyBudget && settings.monthlyBudget > 0
                ? formatCurrency(settings.monthlyBudget, settings.currencySymbol, locale)
                : t('settings.monthlyBudgetNotSet')
            }
            onPress={openBudgetModal}
          />
        </Card>

        {/* Default Account Section */}
        <Text style={styles.sectionTitle}>{t('settings.defaultAccount')}</Text>
        <Card style={styles.card}>
          <DefaultAccountOption accountId={undefined} label={t('settings.noDefaultAccount')} />
          {activeAccounts.map((account) => (
            <React.Fragment key={account.id}>
              <View style={styles.divider} />
              <DefaultAccountOption accountId={account.id} label={account.name} />
            </React.Fragment>
          ))}
        </Card>

        {/* Categories Section */}
        <Text style={styles.sectionTitle}>{t('settings.categories')}</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="list"
            label={t('settings.expenseCategories')}
            value={`${expenseCategories.length}`}
            onPress={() => navigation.navigate('EditCategories', { type: 'expense' })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="list"
            label={t('settings.incomeCategories')}
            value={`${incomeCategories.length}`}
            onPress={() => navigation.navigate('EditCategories', { type: 'income' })}
          />
        </Card>

        {/* Data Section */}
        <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="download-outline"
            label={isExporting ? t('settings.exportingData') : t('settings.exportData')}
            onPress={handleExport}
            loading={isExporting}
            disabled={isExporting}
            showChevron={false}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="cloud-upload-outline"
            label={isImporting ? t('settings.importingData') : t('settings.importData')}
            onPress={handleImport}
            loading={isImporting}
            disabled={isImporting}
            showChevron={false}
          />
        </Card>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, styles.dangerSection]}>{t('settings.dangerZone')}</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="trash-outline"
            label={t('settings.deleteAllData')}
            onPress={handleResetData}
            showChevron={false}
            danger
          />
        </Card>

        {/* About Section */}
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="information-circle-outline"
            label={t('app.name')}
            value={`v${appVersion}`}
            showChevron={false}
          />
        </Card>

        <Text style={styles.footer}>{t('app.tagline')}</Text>
      </ScrollView>

      <Modal visible={showBudgetModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <FormScrollView>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeBudgetModal}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Text style={styles.modalTitle}>{t('settings.monthlyBudget')}</Text>
              <Pressable onPress={handleSaveBudget}>
                <Text style={styles.saveText}>{t('common.save')}</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalHint}>{t('settings.monthlyBudgetHint')}</Text>
              <AmountInput value={budgetInput} onChangeText={setBudgetInput} type="transfer" autoFocus />
              {!!settings.monthlyBudget && settings.monthlyBudget > 0 && (
                <Pressable style={styles.removeBudgetButton} onPress={handleRemoveBudget}>
                  <Text style={styles.removeBudgetText}>
                    {t('settings.monthlyBudgetRemove')}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </FormScrollView>
        </SafeAreaView>
      </Modal>
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
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerSection: {
    color: theme.expense,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  pressed: {
    backgroundColor: theme.background,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.text,
  },
  dangerText: {
    color: theme.expense,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
    color: theme.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 50,
  },
  iosPickerContainer: {
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  doneButtonText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  languageOptionActive: {
    backgroundColor: `${theme.primary}10`,
  },
  languageText: {
    fontSize: 16,
    color: theme.text,
  },
  languageTextActive: {
    fontWeight: '600',
    color: theme.primary,
  },
  footer: {
    textAlign: 'center',
    color: theme.textSecondary,
    marginTop: 32,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  cancelText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  saveText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 32,
  },
  modalHint: {
    textAlign: 'center',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  removeBudgetButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  removeBudgetText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.expense,
  },
});
