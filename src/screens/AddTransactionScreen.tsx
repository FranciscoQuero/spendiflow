import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
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
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { parseNumber, getDateISO, formatDateLong } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { TransactionScope } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'AddTransaction'>;

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const yesterdayOf = (base: Date): Date => {
  const d = new Date(base);
  d.setDate(d.getDate() - 1);
  return d;
};

export const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();

  const addTransaction = useStore((state) => state.addTransaction);
  const updateTransaction = useStore((state) => state.updateTransaction);
  const categories = useStore((state) => state.categories);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const transactions = useStore((state) => state.transactions);
  const settings = useStore((state) => state.settings);

  const editingId = route.params.transactionId;
  const existing = useMemo(
    () => (editingId ? transactions.find((tr) => tr.id === editingId) : undefined),
    [editingId, transactions]
  );
  const isEditing = !!existing;

  // El tipo lo determina la transacción existente (edición) o el parámetro de
  // navegación (creación); por defecto se abre como gasto.
  const type = existing?.type ?? route.params.type ?? 'expense';
  const isExpense = type === 'expense';
  const isTransfer = type === 'transfer';

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [concept, setConcept] = useState(existing?.concept ?? '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    existing?.categoryId ?? null
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(
    existing?.subcategoryId ?? null
  );
  const [accountId, setAccountId] = useState<string | null>(existing?.accountId ?? null);
  const [toAccountId, setToAccountId] = useState<string | null>(existing?.toAccountId ?? null);
  const [scope, setScope] = useState<TransactionScope>(existing?.scope ?? 'personal');
  const [date, setDate] = useState<Date>(existing ? new Date(existing.date) : new Date());
  const [note, setNote] = useState(existing?.note ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

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

  const screenTitle = useMemo(() => {
    if (isTransfer) {
      return isEditing ? t('addTransaction.editTransfer') : t('addTransaction.addTransfer');
    }
    if (isExpense) {
      return isEditing ? t('addTransaction.editExpense') : t('addTransaction.addExpense');
    }
    return isEditing ? t('addTransaction.editIncome') : t('addTransaction.addIncome');
  }, [isEditing, isExpense, isTransfer]);

  const today = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => yesterdayOf(today), [today]);

  const handleCategorySelect = (categoryId: string) => {
    Haptics.selectionAsync();
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    Haptics.selectionAsync();
    setSelectedSubcategoryId(subcategoryId);
  };

  const handleAccountSelect = (id: string | null) => {
    Haptics.selectionAsync();
    setAccountId(id);
  };

  const handleToAccountSelect = (id: string) => {
    Haptics.selectionAsync();
    setToAccountId(id);
  };

  const handleScopeSelect = (nextScope: TransactionScope) => {
    Haptics.selectionAsync();
    setScope(nextScope);
  };

  const handleQuickDate = (target: Date) => {
    Haptics.selectionAsync();
    setDate(target);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = () => {
    const parsedAmount = parseNumber(amount);

    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('addTransaction.errorAmount'));
      return;
    }

    if (isTransfer) {
      if (!accountId) {
        Alert.alert(t('common.error'), t('addTransaction.errorFromAccount'));
        return;
      }
      if (!toAccountId) {
        Alert.alert(t('common.error'), t('addTransaction.errorToAccount'));
        return;
      }
      if (accountId === toAccountId) {
        Alert.alert(t('common.error'), t('addTransaction.errorSameAccount'));
        return;
      }
    } else {
      if (!concept.trim()) {
        Alert.alert(t('common.error'), t('addTransaction.errorConcept'));
        return;
      }
      if (!selectedCategoryId) {
        Alert.alert(t('common.error'), t('addTransaction.errorCategory'));
        return;
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const finalConcept = concept.trim() || (isTransfer ? t('addTransaction.conceptPlaceholderTransfer') : '');

    const payload = {
      type,
      amount: parsedAmount,
      concept: finalConcept,
      categoryId: isTransfer ? undefined : selectedCategoryId || undefined,
      subcategoryId: isTransfer ? undefined : selectedSubcategoryId || undefined,
      accountId: accountId || undefined,
      toAccountId: isTransfer ? toAccountId || undefined : undefined,
      scope,
      date: getDateISO(date),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      note: note.trim() || undefined,
    };

    try {
      if (isEditing && editingId) {
        updateTransaction(editingId, payload);
      } else {
        addTransaction(payload);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), String(error));
    }
  };

  const canSave = isTransfer
    ? parseNumber(amount) > 0 && !!accountId && !!toAccountId && accountId !== toAccountId
    : parseNumber(amount) > 0 && !!concept.trim() && !!selectedCategoryId;

  const saveButtonStyle = isTransfer
    ? styles.transferButton
    : isExpense
    ? styles.expenseButton
    : styles.incomeButton;

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
          <Text style={styles.title}>{screenTitle}</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Input */}
          <AmountInput
            value={amount}
            onChangeText={setAmount}
            type={isTransfer ? 'transfer' : type === 'income' ? 'income' : 'expense'}
            autoFocus={!isEditing}
          />

          {/* Concept Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addTransaction.concept')}</Text>
            <TextInput
              style={styles.textInput}
              value={concept}
              onChangeText={setConcept}
              placeholder={
                isTransfer
                  ? t('addTransaction.conceptPlaceholderTransfer')
                  : t('addTransaction.conceptPlaceholder')
              }
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Date Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addTransaction.date')}</Text>
            <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.dateFieldText}>{formatDateLong(date.toISOString(), locale)}</Text>
            </Pressable>

            <View style={styles.chipContainer}>
              <Pressable
                style={[styles.quickDateChip, isSameDay(date, today) && styles.quickDateChipActive]}
                onPress={() => handleQuickDate(today)}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    isSameDay(date, today) && styles.quickDateTextActive,
                  ]}
                >
                  {t('common.today')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.quickDateChip,
                  isSameDay(date, yesterday) && styles.quickDateChipActive,
                ]}
                onPress={() => handleQuickDate(yesterday)}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    isSameDay(date, yesterday) && styles.quickDateTextActive,
                  ]}
                >
                  {t('common.yesterday')}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={handleDateChange}
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    style={styles.datePickerDone}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>{t('common.confirm')}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {isTransfer ? (
            <>
              {/* From Account */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('addTransaction.fromAccount')}</Text>
                <View style={styles.chipContainer}>
                  {activeAccounts.map((acc) => (
                    <Pressable
                      key={acc.id}
                      style={[
                        styles.accountChip,
                        accountId === acc.id && styles.accountChipSelected,
                      ]}
                      onPress={() => handleAccountSelect(acc.id)}
                    >
                      <Text
                        style={[
                          styles.accountChipText,
                          accountId === acc.id && styles.accountChipTextSelected,
                        ]}
                      >
                        {acc.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* To Account */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('addTransaction.toAccount')}</Text>
                <View style={styles.chipContainer}>
                  {activeAccounts.map((acc) => (
                    <Pressable
                      key={acc.id}
                      style={[
                        styles.accountChip,
                        toAccountId === acc.id && styles.accountChipSelected,
                      ]}
                      onPress={() => handleToAccountSelect(acc.id)}
                    >
                      <Text
                        style={[
                          styles.accountChipText,
                          toAccountId === acc.id && styles.accountChipTextSelected,
                        ]}
                      >
                        {acc.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Account Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('addTransaction.account')}</Text>
                <View style={styles.chipContainer}>
                  <Pressable
                    style={[
                      styles.accountChip,
                      accountId === null && styles.accountChipSelected,
                    ]}
                    onPress={() => handleAccountSelect(null)}
                  >
                    <Text
                      style={[
                        styles.accountChipText,
                        accountId === null && styles.accountChipTextSelected,
                      ]}
                    >
                      {t('addTransaction.noAccount')}
                    </Text>
                  </Pressable>
                  {activeAccounts.map((acc) => (
                    <Pressable
                      key={acc.id}
                      style={[
                        styles.accountChip,
                        accountId === acc.id && styles.accountChipSelected,
                      ]}
                      onPress={() => handleAccountSelect(acc.id)}
                    >
                      <Text
                        style={[
                          styles.accountChipText,
                          accountId === acc.id && styles.accountChipTextSelected,
                        ]}
                      >
                        {acc.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Scope Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('addTransaction.scope')}</Text>
                <View style={styles.segmentedControl}>
                  <Pressable
                    style={[
                      styles.segmentButton,
                      scope === 'personal' && styles.segmentButtonActive,
                    ]}
                    onPress={() => handleScopeSelect('personal')}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        scope === 'personal' && styles.segmentTextActive,
                      ]}
                    >
                      {t('addTransaction.scopePersonal')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.segmentButton,
                      scope === 'business' && styles.segmentButtonActive,
                    ]}
                    onPress={() => handleScopeSelect('business')}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        scope === 'business' && styles.segmentTextActive,
                      ]}
                    >
                      {t('addTransaction.scopeBusiness')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Category Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('addTransaction.category')}</Text>
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

              {/* Subcategory Selection */}
              {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('addTransaction.subcategory')}</Text>
                  <View style={styles.chipContainer}>
                    {selectedCategory.subcategories.map((sub) => (
                      <Pressable
                        key={sub.id}
                        style={[
                          styles.subChip,
                          selectedSubcategoryId === sub.id && {
                            backgroundColor: selectedCategory.color,
                            borderColor: selectedCategory.color,
                          },
                        ]}
                        onPress={() => handleSubcategorySelect(sub.id)}
                      >
                        <Text
                          style={[
                            styles.subChipText,
                            selectedSubcategoryId === sub.id && styles.subChipTextSelected,
                          ]}
                        >
                          {settings.language === 'es' ? sub.name : sub.nameEn}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Note Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addTransaction.note')}</Text>
            <TextInput
              style={[styles.textInput, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder={t('addTransaction.notePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, saveButtonStyle, !canSave && styles.disabledButton]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={styles.saveButtonText}>{t('addTransaction.save')}</Text>
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
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  subChipText: {
    fontSize: 14,
    color: colors.text,
  },
  subChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  dateFieldText: {
    fontSize: 16,
    color: colors.text,
  },
  quickDateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  quickDateChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickDateText: {
    fontSize: 14,
    color: colors.text,
  },
  quickDateTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  datePickerContainer: {
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  datePickerDone: {
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  datePickerDoneText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  accountChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  accountChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  accountChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    alignSelf: 'flex-start',
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: 'white',
    fontWeight: '600',
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
