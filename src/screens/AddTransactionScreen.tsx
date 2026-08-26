import React, { useState, useMemo } from 'react';
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
import { AmountInput } from '../components/AmountInput';
import { CategoryChip } from '../components/CategoryChip';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'AddTransaction'>;

export const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  // 'transfer' aún no tiene UI propia aquí; por defecto se abre como gasto.
  const type = route.params.type ?? 'expense';

  const addTransaction = useStore((state) => state.addTransaction);
  const categories = useStore((state) => state.categories);
  const settings = useStore((state) => state.settings);

  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [date] = useState(new Date());
  const [note, setNote] = useState('');

  const isExpense = type === 'expense';
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const handleCategorySelect = (categoryId: string) => {
    Haptics.selectionAsync();
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    Haptics.selectionAsync();
    setSelectedSubcategoryId(subcategoryId);
  };

  const handleSave = () => {
    const parsedAmount = parseNumber(amount);

    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid amount');
      return;
    }

    if (!concept.trim()) {
      Alert.alert(t('common.error'), 'Please enter a description');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert(t('common.error'), 'Please select a category');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addTransaction({
      type,
      amount: parsedAmount,
      concept: concept.trim(),
      categoryId: selectedCategoryId || undefined,
      subcategoryId: selectedSubcategoryId || undefined,
      scope: 'personal',
      date: getDateISO(date),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      note: note.trim() || undefined,
    });

    navigation.goBack();
  };

  const canSave = parseNumber(amount) > 0 && concept.trim() && selectedCategoryId;

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
            {isExpense ? t('addTransaction.addExpense') : t('addTransaction.addIncome')}
          </Text>
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
            type={type === 'income' ? 'income' : 'expense'}
            autoFocus
          />

          {/* Concept Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addTransaction.concept')}</Text>
            <TextInput
              style={styles.textInput}
              value={concept}
              onChangeText={setConcept}
              placeholder={t('addTransaction.conceptPlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />
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
            style={[
              styles.saveButton,
              isExpense ? styles.expenseButton : styles.incomeButton,
              !canSave && styles.disabledButton,
            ]}
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
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
