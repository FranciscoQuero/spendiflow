import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { RecurrenceActions } from '../components/RecurrenceActions';
import { TintedIcon } from '../components/TintedIcon';
import { Badge } from '../components/Badge';
import { useStore } from '../store/useStore';
import { getDueRecurrences } from '../hooks/useAccounts';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { formatCurrency, formatDate } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';
import { RecurringRule, TransactionType } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const getTypeMeta = (
  theme: Theme,
  type: TransactionType
): { icon: keyof typeof Ionicons.glyphMap; color: string; sign: '' | '+' | '-' } => {
  switch (type) {
    case 'income':
      return { icon: 'add-circle', color: theme.income, sign: '+' };
    case 'transfer':
      return { icon: 'swap-horizontal', color: theme.primary, sign: '' };
    case 'expense':
    default:
      return { icon: 'remove-circle', color: theme.expense, sign: '-' };
  }
};

export const RecurringListScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
    const meta = getTypeMeta(theme, item.template.type);

    return (
      <Card
        pressable
        onPress={() => navigation.navigate('AddRecurring', { ruleId: item.id })}
        onLongPress={() => handleDelete(item)}
        style={[styles.ruleCard, isDue && styles.ruleCardDue]}
      >
        <View style={styles.ruleHeader}>
          <TintedIcon name={meta.icon} color={meta.color} />
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
              trackColor={{ false: theme.border, true: theme.primaryLight }}
              thumbColor={item.active ? theme.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {isDue && (
          <View style={styles.dueRow}>
            <Badge icon="alert-circle" label={t('recurring.overdue')} color={theme.warning} />
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
      <TintedIcon name="repeat-outline" color={theme.textSecondary} size={96} iconSize={44} />
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
          <Ionicons name="arrow-back" size={24} color={theme.text} />
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
    borderColor: theme.warning,
  },
  ruleHeader: {
    flexDirection: 'row',
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
    color: theme.text,
  },
  ruleMeta: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  ruleRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ruleAmount: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  dueRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
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
    marginTop: 24,
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
    bottom: 90,
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
});
