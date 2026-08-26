import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { RecurrenceActions } from '../components/RecurrenceActions';
import { useStore } from '../store/useStore';
import { getDueRecurrences } from '../hooks/useAccounts';
import { colors } from '../theme/colors';
import { formatCurrency, formatDate } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { RecurringRule, TransactionType } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const getTypeMeta = (
  type: TransactionType
): { icon: keyof typeof Ionicons.glyphMap; color: string; sign: '' | '+' | '-' } => {
  switch (type) {
    case 'income':
      return { icon: 'add-circle', color: colors.income, sign: '+' };
    case 'transfer':
      return { icon: 'swap-horizontal', color: colors.primary, sign: '' };
    case 'expense':
    default:
      return { icon: 'remove-circle', color: colors.expense, sign: '-' };
  }
};

export const RecurringListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const recurringRules = useStore((state) => state.recurringRules);
  const updateRecurringRule = useStore((state) => state.updateRecurringRule);
  const deleteRecurringRule = useStore((state) => state.deleteRecurringRule);
  const confirmRecurrence = useStore((state) => state.confirmRecurrence);
  const skipRecurrence = useStore((state) => state.skipRecurrence);
  const settings = useStore((state) => state.settings);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const dueRuleIds = useMemo(() => {
    const due = getDueRecurrences(recurringRules, new Date().toISOString());
    return new Set(due.map((r) => r.id));
  }, [recurringRules]);

  const sortedRules = useMemo(() => {
    return [...recurringRules].sort((a, b) => {
      const aDue = dueRuleIds.has(a.id);
      const bDue = dueRuleIds.has(b.id);
      if (aDue !== bDue) return aDue ? -1 : 1;
      return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
    });
  }, [recurringRules, dueRuleIds]);

  const handleToggleActive = (ruleId: string, value: boolean) => {
    Haptics.selectionAsync();
    updateRecurringRule(ruleId, { active: value });
  };

  const handleDelete = (rule: RecurringRule) => {
    Alert.alert(t('common.delete'), t('recurring.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteRecurringRule(rule.id);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: RecurringRule }) => {
    const isDue = dueRuleIds.has(item.id);
    const meta = getTypeMeta(item.template.type);

    return (
      <Card
        pressable
        onPress={() => navigation.navigate('AddRecurring', { ruleId: item.id })}
        onLongPress={() => handleDelete(item)}
        style={[styles.ruleCard, isDue && styles.ruleCardDue]}
      >
        <View style={styles.ruleHeader}>
          <View style={[styles.iconCircle, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon} size={20} color="white" />
          </View>
          <View style={styles.ruleInfo}>
            <Text style={styles.ruleName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.ruleMeta} numberOfLines={1}>
              {t(`recurring.frequency.${item.frequency}`)} · {formatDate(item.nextDueDate, locale)}
            </Text>
          </View>
          <View style={styles.ruleRight}>
            <Text style={[styles.ruleAmount, { color: meta.color }]}>
              {meta.sign}
              {formatCurrency(item.template.amount, settings.currencySymbol, locale)}
            </Text>
            <Switch
              value={item.active}
              onValueChange={(value) => handleToggleActive(item.id, value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={item.active ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {isDue && (
          <View style={styles.dueRow}>
            <View style={styles.dueBadge}>
              <Ionicons name="alert-circle" size={14} color={colors.warning} />
              <Text style={styles.dueBadgeText}>{t('recurring.overdue')}</Text>
            </View>
            <RecurrenceActions
              onConfirm={() => confirmRecurrence(item.id)}
              onSkip={() => skipRecurrence(item.id)}
            />
          </View>
        )}
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="repeat-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>{t('recurring.emptyTitle')}</Text>
      <Text style={styles.emptyDescription}>{t('recurring.emptyDescription')}</Text>
      <Pressable
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddRecurring', undefined)}
      >
        <Text style={styles.emptyButtonText}>{t('recurring.createButton')}</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('recurring.title')}</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={sortedRules}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {recurringRules.length > 0 && (
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate('AddRecurring', undefined)}
        >
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      )}
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  ruleCard: {},
  ruleCardDue: {
    borderWidth: 1.5,
    borderColor: colors.warning,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ruleMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ruleRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ruleAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  dueRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
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
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
