import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { AmountInput } from '../components/AmountInput';
import { FormScrollView } from '../components/FormScrollView';
import { TintedIcon } from '../components/TintedIcon';
import { OptionSheet, OptionSheetOption } from '../components/OptionSheet';
import { useStore } from '../store/useStore';
import { useTransactions } from '../hooks/useTransactions';
import {
  computeBudgetProgress,
  computeBudgetLines,
  computeUnbudgetedSpending,
  BudgetLine,
} from '../utils/budget';
import { useTheme } from '../theme/useTheme';
import { Theme, hexToRgba } from '../theme/colors';
import { formatCurrency, parseNumber } from '../utils/formatters';
import { t } from '../locales/i18n';

/** Valor centinela del OptionSheet de subcategoría para "toda la categoría" (subcategoryId undefined). */
const ALL_SUBCATEGORIES = '__all__';

export const BudgetsScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const navigation = useNavigation();

  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const categories = useStore((state) => state.categories);
  const categoryBudgets = useStore((state) => state.categoryBudgets);
  const addCategoryBudget = useStore((state) => state.addCategoryBudget);
  const deleteCategoryBudget = useStore((state) => state.deleteCategoryBudget);
  const { transactions, getPeriodSummary } = useTransactions();

  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';
  const isEs = settings.language === 'es';
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const remainingDays = Math.max(daysInMonth - dayOfMonth, 0);

  const budgetSpent = getPeriodSummary('month', undefined, 'personal').totalExpenses;
  const hasGlobalBudget = !!settings.monthlyBudget && settings.monthlyBudget > 0;
  const globalProgress = useMemo(
    () => computeBudgetProgress(budgetSpent, settings.monthlyBudget, dayOfMonth, daysInMonth),
    [budgetSpent, settings.monthlyBudget, dayOfMonth, daysInMonth]
  );
  const globalColor =
    globalProgress.pace === 'over'
      ? theme.error
      : globalProgress.pace === 'ahead'
      ? theme.warning
      : theme.primary;

  const budgetedTotal = useMemo(
    () => categoryBudgets.reduce((sum, b) => sum + b.amount, 0),
    [categoryBudgets]
  );

  const budgetLines = useMemo(
    () => computeBudgetLines(categoryBudgets, categories, transactions, month, year, dayOfMonth, daysInMonth),
    [categoryBudgets, categories, transactions, month, year, dayOfMonth, daysInMonth]
  );

  const sortedLines = useMemo(() => {
    const paceOrder: Record<string, number> = { over: 0, ahead: 1, onTrack: 2 };
    return [...budgetLines].sort((a, b) => paceOrder[a.progress.pace] - paceOrder[b.progress.pace]);
  }, [budgetLines]);

  const unbudgeted = useMemo(
    () => computeUnbudgetedSpending(categoryBudgets, transactions, month, year),
    [categoryBudgets, transactions, month, year]
  );

  // Global budget modal
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalInput, setGlobalInput] = useState('');

  const openGlobalModal = () => {
    setGlobalInput(
      settings.monthlyBudget && settings.monthlyBudget > 0
        ? String(settings.monthlyBudget).replace('.', ',')
        : ''
    );
    setShowGlobalModal(true);
  };
  const closeGlobalModal = () => {
    setShowGlobalModal(false);
    setGlobalInput('');
  };
  const handleSaveGlobal = () => {
    const trimmed = globalInput.trim();
    if (trimmed === '') {
      updateSettings({ monthlyBudget: undefined });
      closeGlobalModal();
      return;
    }
    const parsed = parseNumber(trimmed);
    if (parsed <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }
    updateSettings({ monthlyBudget: parsed });
    closeGlobalModal();
  };
  const handleRemoveGlobal = () => {
    updateSettings({ monthlyBudget: undefined });
    closeGlobalModal();
  };

  // Add/edit category budget flow: categoría -> subcategoría (si tiene) -> importe.
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [pendingSubcategoryId, setPendingSubcategoryId] = useState<string | undefined>(undefined);
  const [amountInput, setAmountInput] = useState('');

  const pendingCategory = expenseCategories.find((c) => c.id === pendingCategoryId);

  const categoryOptions: OptionSheetOption<string>[] = expenseCategories.map((c) => ({
    value: c.id,
    label: isEs ? c.name : c.nameEn,
    icon: c.icon as keyof typeof Ionicons.glyphMap,
  }));

  const subcategoryOptions: OptionSheetOption<string>[] = pendingCategory
    ? [
        { value: ALL_SUBCATEGORIES, label: t('budgets.wholeCategory') },
        ...pendingCategory.subcategories.map((s) => ({
          value: s.id,
          label: isEs ? s.name : s.nameEn,
        })),
      ]
    : [];

  const openAmountModal = (categoryId: string, subcategoryId: string | undefined) => {
    const existing = categoryBudgets.find(
      (b) => b.categoryId === categoryId && b.subcategoryId === subcategoryId
    );
    setPendingCategoryId(categoryId);
    setPendingSubcategoryId(subcategoryId);
    setAmountInput(existing ? String(existing.amount).replace('.', ',') : '');
    setShowAmountModal(true);
  };

  const startAddFlow = () => {
    setPendingCategoryId(null);
    setPendingSubcategoryId(undefined);
    setShowCategoryPicker(true);
  };

  const handleSelectCategory = (categoryId: string) => {
    const category = expenseCategories.find((c) => c.id === categoryId);
    if (category && category.subcategories.length > 0) {
      setPendingCategoryId(categoryId);
      setShowSubcategoryPicker(true);
    } else {
      openAmountModal(categoryId, undefined);
    }
  };

  const handleSelectSubcategory = (value: string) => {
    if (!pendingCategoryId) return;
    const subcategoryId = value === ALL_SUBCATEGORIES ? undefined : value;
    openAmountModal(pendingCategoryId, subcategoryId);
  };

  const openEditBudget = (line: BudgetLine) => {
    openAmountModal(line.budget.categoryId, line.budget.subcategoryId);
  };

  const closeAmountModal = () => {
    setShowAmountModal(false);
    setAmountInput('');
    setPendingCategoryId(null);
    setPendingSubcategoryId(undefined);
  };

  const handleSaveBudgetAmount = () => {
    if (!pendingCategoryId) return;
    const parsed = parseNumber(amountInput.trim());
    if (parsed <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCategoryBudget({
      categoryId: pendingCategoryId,
      subcategoryId: pendingSubcategoryId,
      amount: parsed,
    });
    closeAmountModal();
  };

  const lineDisplayName = (line: BudgetLine): string => {
    const categoryName = isEs ? line.categoryName : line.categoryNameEn;
    if (!line.subcategoryName) return categoryName;
    const subcategoryName = isEs ? line.subcategoryName : line.subcategoryNameEn;
    return `${categoryName} · ${subcategoryName}`;
  };

  const handleDeleteBudget = (line: BudgetLine) => {
    Alert.alert(
      t('common.delete'),
      t('budgets.deleteConfirm', { name: lineDisplayName(line) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteCategoryBudget(line.budget.id);
          },
        },
      ]
    );
  };

  const amountModalTitle = pendingCategory
    ? (() => {
        const categoryName = isEs ? pendingCategory.name : pendingCategory.nameEn;
        const subcategory = pendingCategory.subcategories.find((s) => s.id === pendingSubcategoryId);
        const subcategoryName = subcategory ? (isEs ? subcategory.name : subcategory.nameEn) : undefined;
        return subcategoryName ? `${categoryName} · ${subcategoryName}` : categoryName;
      })()
    : t('budgets.amountTitle');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('budgets.title')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Global budget */}
        <Card pressable onPress={openGlobalModal} style={styles.globalCard}>
          <View style={styles.globalHeader}>
            <Text style={styles.globalLabel}>{t('budgets.globalBudget')}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>

          {hasGlobalBudget ? (
            <>
              <Text style={styles.budgetSpentLine}>
                {t('home.budgetSpentOf', {
                  spent: formatCurrency(budgetSpent, settings.currencySymbol, locale),
                  budget: formatCurrency(
                    settings.monthlyBudget as number,
                    settings.currencySymbol,
                    locale
                  ),
                })}
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.min(globalProgress.ratio, 1) * 100}%`, backgroundColor: globalColor },
                  ]}
                />
              </View>
              <Text style={styles.budgetHint}>
                {globalProgress.pace === 'over'
                  ? t('home.budgetOverBy', {
                      amount: formatCurrency(
                        Math.abs(globalProgress.remaining),
                        settings.currencySymbol,
                        locale
                      ),
                    })
                  : t('home.budgetRemaining', {
                      amount: formatCurrency(
                        globalProgress.remaining,
                        settings.currencySymbol,
                        locale
                      ),
                      days: remainingDays,
                    })}
              </Text>
            </>
          ) : (
            <Text style={styles.globalNotSetHint}>{t('budgets.globalNotSetHint')}</Text>
          )}

          {hasGlobalBudget && budgetedTotal > 0 && (
            <Text style={styles.coverageLine}>
              {t('budgets.allocatedOfGlobal', {
                allocated: formatCurrency(budgetedTotal, settings.currencySymbol, locale),
                global: formatCurrency(
                  settings.monthlyBudget as number,
                  settings.currencySymbol,
                  locale
                ),
              })}
            </Text>
          )}
        </Card>

        {/* Unbudgeted spending: la cifra estrella para distinguir imprevistos de incumplimientos */}
        <View style={styles.unbudgetedCard}>
          <Ionicons name="alert-circle" size={22} color={theme.warning} />
          <View style={styles.unbudgetedTextGroup}>
            <Text style={styles.unbudgetedLabel}>{t('budgets.unbudgetedLabel')}</Text>
            <Text style={styles.unbudgetedAmount}>
              {formatCurrency(unbudgeted, settings.currencySymbol, locale)}
            </Text>
            <Text style={styles.unbudgetedHint}>{t('budgets.unbudgetedHint')}</Text>
          </View>
        </View>

        {/* Per-category budgets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('budgets.categoryBudgets')}</Text>
        </View>

        {sortedLines.length > 0 ? (
          sortedLines.map((line) => {
            const paceColor =
              line.progress.pace === 'over'
                ? theme.error
                : line.progress.pace === 'ahead'
                ? theme.warning
                : theme.primary;

            return (
              <Card
                key={line.budget.id}
                pressable
                onPress={() => openEditBudget(line)}
                onLongPress={() => handleDeleteBudget(line)}
                style={styles.budgetCard}
              >
                <View style={styles.budgetRow}>
                  <TintedIcon
                    name={line.categoryIcon as keyof typeof Ionicons.glyphMap}
                    color={line.categoryColor}
                  />
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetName} numberOfLines={1}>
                      {lineDisplayName(line)}
                    </Text>
                    <Text style={styles.budgetMeta}>
                      {t('home.budgetSpentOf', {
                        spent: formatCurrency(line.spent, settings.currencySymbol, locale),
                        budget: formatCurrency(line.budget.amount, settings.currencySymbol, locale),
                      })}
                    </Text>
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => handleDeleteBudget(line)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
                  </Pressable>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.min(line.progress.ratio, 1) * 100}%`, backgroundColor: paceColor },
                    ]}
                  />
                </View>
              </Card>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <TintedIcon name="pie-chart-outline" color={theme.textSecondary} size={80} iconSize={36} />
            <Text style={styles.emptyTitle}>{t('budgets.emptyTitle')}</Text>
            <Text style={styles.emptyDescription}>{t('budgets.emptyDescription')}</Text>
            <Pressable style={styles.emptyButton} onPress={startAddFlow}>
              <Text style={styles.emptyButtonText}>{t('budgets.createButton')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {sortedLines.length > 0 && (
        <Pressable style={styles.fab} onPress={startAddFlow}>
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      )}

      {/* Global budget modal */}
      <Modal visible={showGlobalModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <FormScrollView>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeGlobalModal}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Text style={styles.modalTitle}>{t('budgets.globalBudget')}</Text>
              <Pressable onPress={handleSaveGlobal}>
                <Text style={styles.saveText}>{t('common.save')}</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalHint}>{t('settings.monthlyBudgetHint')}</Text>
              <AmountInput value={globalInput} onChangeText={setGlobalInput} type="transfer" autoFocus />
              {hasGlobalBudget && (
                <Pressable style={styles.removeButton} onPress={handleRemoveGlobal}>
                  <Text style={styles.removeButtonText}>{t('settings.monthlyBudgetRemove')}</Text>
                </Pressable>
              )}
            </ScrollView>
          </FormScrollView>
        </SafeAreaView>
      </Modal>

      {/* Amount modal (add/edit) */}
      <Modal visible={showAmountModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <FormScrollView>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeAmountModal}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {amountModalTitle}
              </Text>
              <Pressable onPress={handleSaveBudgetAmount}>
                <Text style={styles.saveText}>{t('common.save')}</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalHint}>{t('budgets.amountHint')}</Text>
              <AmountInput value={amountInput} onChangeText={setAmountInput} type="expense" autoFocus />
            </ScrollView>
          </FormScrollView>
        </SafeAreaView>
      </Modal>

      <OptionSheet
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        options={categoryOptions}
        selectedValue={pendingCategoryId ?? ''}
        onSelect={handleSelectCategory}
        title={t('budgets.selectCategory')}
      />

      <OptionSheet
        visible={showSubcategoryPicker}
        onClose={() => setShowSubcategoryPicker(false)}
        options={subcategoryOptions}
        selectedValue={pendingSubcategoryId ?? ALL_SUBCATEGORIES}
        onSelect={handleSelectSubcategory}
        title={t('budgets.selectSubcategory')}
      />
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  globalCard: {
    marginBottom: 16,
    backgroundColor: theme.surfaceTint,
    borderColor: hexToRgba(theme.primary, 0.14),
  },
  globalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  globalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  globalNotSetHint: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  budgetSpentLine: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: hexToRgba(theme.text, 0.08),
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 6,
  },
  coverageLine: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: hexToRgba(theme.primary, 0.14),
  },
  unbudgetedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: hexToRgba(theme.warning, 0.1),
    borderWidth: 1,
    borderColor: hexToRgba(theme.warning, 0.35),
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  unbudgetedTextGroup: {
    flex: 1,
  },
  unbudgetedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  unbudgetedAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.warning,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  unbudgetedHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  budgetCard: {
    marginBottom: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  budgetName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  budgetMeta: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    flexShrink: 1,
    marginHorizontal: 12,
    textAlign: 'center',
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
  removeButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  removeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.expense,
  },
});
