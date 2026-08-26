import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { AmountInput } from '../components/AmountInput';
import { CategoryChip } from '../components/CategoryChip';
import { SegmentedControl } from '../components/SegmentedControl';
import { Chip } from '../components/Chip';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { parseNumber, getDateISO, formatDateLong } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { RecurrenceFrequency, TransactionScope, TransactionType } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'AddRecurring'>;

const FREQUENCIES: RecurrenceFrequency[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

export const AddRecurringScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const ruleId = route.params?.ruleId;
  const isEditing = !!ruleId;

  const recurringRules = useStore((state) => state.recurringRules);
  const addRecurringRule = useStore((state) => state.addRecurringRule);
  const updateRecurringRule = useStore((state) => state.updateRecurringRule);
  const categories = useStore((state) => state.categories);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const settings = useStore((state) => state.settings);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const existingRule = useMemo(
    () => recurringRules.find((r) => r.id === ruleId),
    [recurringRules, ruleId]
  );

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [scope, setScope] = useState<TransactionScope>('personal');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState<string>(getDateISO());
  const [active, setActive] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (existingRule && !initializedRef.current) {
      initializedRef.current = true;
      setName(existingRule.name);
      setType(existingRule.template.type);
      setAmount(String(existingRule.template.amount));
      setConcept(existingRule.template.concept);
      setScope(existingRule.template.scope);
      setSelectedCategoryId(existingRule.template.categoryId ?? null);
      setSelectedSubcategoryId(existingRule.template.subcategoryId ?? null);
      if (existingRule.template.type === 'transfer') {
        setFromAccountId(existingRule.template.accountId ?? null);
        setToAccountId(existingRule.template.toAccountId ?? null);
      } else {
        setSelectedAccountId(existingRule.template.accountId ?? null);
      }
      setFrequency(existingRule.frequency);
      setNextDueDate(existingRule.nextDueDate);
      setActive(existingRule.active);
    }
  }, [existingRule]);

  const isTransfer = type === 'transfer';
  const isExpense = type === 'expense';

  const activeAccounts = useMemo(
    () => bankAccounts.filter((a) => !a.archived),
    [bankAccounts]
  );

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedAccountId(null);
    setFromAccountId(null);
    setToAccountId(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    Haptics.selectionAsync();
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    Haptics.selectionAsync();
    setSelectedSubcategoryId(subcategoryId);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      setNextDueDate(getDateISO(selectedDate));
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const parsedAmount = parseNumber(amount);

    if (!trimmedName) {
      Alert.alert(t('common.error'), t('recurring.errors.name'));
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('recurring.errors.amount'));
      return;
    }

    if (isTransfer) {
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
        Alert.alert(t('common.error'), t('recurring.errors.accounts'));
        return;
      }
    } else if (!selectedCategoryId) {
      Alert.alert(t('common.error'), t('recurring.errors.category'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const template = {
      type,
      amount: parsedAmount,
      concept: concept.trim() || trimmedName,
      categoryId: !isTransfer ? selectedCategoryId ?? undefined : undefined,
      subcategoryId: !isTransfer ? selectedSubcategoryId ?? undefined : undefined,
      accountId: isTransfer ? fromAccountId ?? undefined : selectedAccountId ?? undefined,
      toAccountId: isTransfer ? toAccountId ?? undefined : undefined,
      scope: isTransfer ? ('personal' as TransactionScope) : scope,
    };

    if (isEditing && ruleId) {
      updateRecurringRule(ruleId, {
        name: trimmedName,
        template,
        frequency,
        nextDueDate,
        active,
      });
    } else {
      addRecurringRule({
        name: trimmedName,
        template,
        frequency,
        nextDueDate,
        active,
      });
    }

    navigation.goBack();
  };

  const canSave =
    name.trim().length > 0 &&
    parseNumber(amount) > 0 &&
    (isTransfer
      ? !!fromAccountId && !!toAccountId && fromAccountId !== toAccountId
      : !!selectedCategoryId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>
            {isEditing ? t('recurring.editTitle') : t('recurring.addTitle')}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('recurring.name')}</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder={t('recurring.namePlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Type */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('recurring.type')}</Text>
            <SegmentedControl
              value={type}
              onChange={handleTypeChange}
              options={[
                { value: 'expense', label: t('recurring.typeExpense') },
                { value: 'income', label: t('recurring.typeIncome') },
                { value: 'transfer', label: t('recurring.typeTransfer') },
              ]}
            />
          </View>

          {/* Amount */}
          <AmountInput
            value={amount}
            onChangeText={setAmount}
            type={type === 'income' ? 'income' : 'expense'}
          />

          {/* Concept */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('recurring.concept')}</Text>
            <TextInput
              style={styles.textInput}
              value={concept}
              onChangeText={setConcept}
              placeholder={t('recurring.conceptPlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {!isTransfer && (
            <>
              {/* Scope */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('recurring.scope')}</Text>
                <SegmentedControl
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: 'personal', label: t('recurring.scopePersonal') },
                    { value: 'business', label: t('recurring.scopeBusiness') },
                  ]}
                />
              </View>

              {/* Category */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('recurring.category')}</Text>
                <View style={styles.chipContainer}>
                  {filteredCategories.map((category) => (
                    <CategoryChip
                      key={category.id}
                      category={category}
                      selected={selectedCategoryId === category.id}
                      onPress={() => handleCategorySelect(category.id)}
                    />
                  ))}
                </View>
              </View>

              {/* Subcategory */}
              {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('recurring.subcategory')}</Text>
                  <View style={styles.chipContainer}>
                    {selectedCategory.subcategories.map((sub) => (
                      <Chip
                        key={sub.id}
                        label={settings.language === 'es' ? sub.name : sub.nameEn}
                        selected={selectedSubcategoryId === sub.id}
                        onPress={() => handleSubcategorySelect(sub.id)}
                        color={selectedCategory.color}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Account */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('recurring.account')}</Text>
                <View style={styles.chipContainer}>
                  <Chip
                    label={t('recurring.noAccount')}
                    selected={selectedAccountId === null}
                    onPress={() => setSelectedAccountId(null)}
                  />
                  {activeAccounts.map((account) => (
                    <Chip
                      key={account.id}
                      label={account.name}
                      selected={selectedAccountId === account.id}
                      onPress={() => setSelectedAccountId(account.id)}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          {isTransfer && (
            <>
              {activeAccounts.length < 2 && (
                <Text style={styles.warningText}>{t('recurring.needTwoAccounts')}</Text>
              )}

              {/* From Account */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('recurring.fromAccount')}</Text>
                <View style={styles.chipContainer}>
                  {activeAccounts
                    .filter((account) => account.id !== toAccountId)
                    .map((account) => (
                      <Chip
                        key={account.id}
                        label={account.name}
                        selected={fromAccountId === account.id}
                        onPress={() => setFromAccountId(account.id)}
                      />
                    ))}
                </View>
              </View>

              {/* To Account */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('recurring.toAccount')}</Text>
                <View style={styles.chipContainer}>
                  {activeAccounts
                    .filter((account) => account.id !== fromAccountId)
                    .map((account) => (
                      <Chip
                        key={account.id}
                        label={account.name}
                        selected={toAccountId === account.id}
                        onPress={() => setToAccountId(account.id)}
                      />
                    ))}
                </View>
              </View>
            </>
          )}

          {/* Frequency */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('recurring.frequency.label')}</Text>
            <View style={styles.chipContainer}>
              {FREQUENCIES.map((freq) => (
                <Chip
                  key={freq}
                  label={t(`recurring.frequency.${freq}`)}
                  selected={frequency === freq}
                  onPress={() => setFrequency(freq)}
                />
              ))}
            </View>
          </View>

          {/* Next due date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('recurring.nextDueDate')}</Text>
            <Pressable
              style={styles.dateInput}
              onPress={() => {
                Haptics.selectionAsync();
                setShowDatePicker((prev) => !prev);
              }}
            >
              <Text style={styles.dateText}>{formatDateLong(nextDueDate, locale)}</Text>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            </Pressable>
            {showDatePicker && (
              <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
                <DateTimePicker
                  value={new Date(nextDueDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    style={styles.doneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.doneButtonText}>{t('recurring.done')}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Active */}
          <View style={[styles.inputContainer, styles.activeRow]}>
            <Text style={styles.label}>{t('recurring.active')}</Text>
            <Switch
              value={active}
              onValueChange={(value) => {
                Haptics.selectionAsync();
                setActive(value);
              }}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={active ? colors.primary : '#f4f3f4'}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.saveButton,
              isExpense
                ? styles.expenseButton
                : isTransfer
                  ? styles.transferButton
                  : styles.incomeButton,
              !canSave && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
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
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    marginBottom: 16,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  iosPickerContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  expenseButton: {
    backgroundColor: colors.expense,
  },
  incomeButton: {
    backgroundColor: colors.income,
  },
  transferButton: {
    backgroundColor: colors.primary,
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
