import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { AmountInput } from '../components/AmountInput';
import { useStore } from '../store/useStore';
import { getInvestmentValue } from '../hooks/useAccounts';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { formatCurrency, formatDate, parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'InvestmentDetail'>;

const investmentTypeLabel = (type: string): string => {
  switch (type) {
    case 'stocks':
      return t('accounts.investmentTypes.stocks');
    case 'crypto':
      return t('accounts.investmentTypes.crypto');
    case 'fund':
      return t('accounts.investmentTypes.fund');
    case 'etf':
      return t('accounts.investmentTypes.etf');
    case 'pension':
      return t('accounts.investmentTypes.pension');
    case 'other':
      return t('accounts.investmentTypes.other');
    default:
      return type;
  }
};

export const InvestmentDetailScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { id } = route.params;

  const investments = useStore((state) => state.investments);
  const deleteInvestment = useStore((state) => state.deleteInvestment);
  const addContribution = useStore((state) => state.addContribution);
  const addInvestmentValueEntry = useStore((state) => state.addInvestmentValueEntry);
  const deleteInvestmentValueEntry = useStore((state) => state.deleteInvestmentValueEntry);
  const settings = useStore((state) => state.settings);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [note, setNote] = useState('');
  const [valueNote, setValueNote] = useState('');

  const investment = investments.find((i) => i.id === id);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const totalContributed = useMemo(() => {
    if (!investment) return 0;
    return investment.contributions.reduce((sum, c) => sum + c.amount, 0);
  }, [investment]);

  const sortedValueHistory = useMemo(() => {
    if (!investment) return [];
    return [...investment.valueHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [investment]);

  const hasValue = !!investment && investment.currentValue !== undefined;
  const currentValue = investment ? getInvestmentValue(investment) : 0;

  if (!investment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('accounts.investmentNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      t('accounts.deleteInvestmentConfirm', { name: investment.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteInvestment(id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAddContribution = () => {
    const parsedAmount = parseNumber(newAmount);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addContribution(id, {
      amount: parsedAmount,
      date: getDateISO(),
      note: note.trim() || undefined,
    });

    setNewAmount('');
    setNote('');
    setShowAddModal(false);
  };

  const handleUpdateValue = () => {
    const parsedAmount = parseNumber(newAmount);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addInvestmentValueEntry(id, {
      value: parsedAmount,
      date: getDateISO(),
      note: valueNote.trim() || undefined,
    });

    setNewAmount('');
    setValueNote('');
    setShowValueModal(false);
  };

  const handleDeleteValueEntry = (entryId: string) => {
    Alert.alert(t('common.delete'), t('accounts.deleteValueEntryConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteInvestmentValueEntry(id, entryId),
      },
    ]);
  };

  const returnPercent =
    hasValue && totalContributed > 0
      ? ((currentValue - totalContributed) / totalContributed) * 100
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{investment.name}</Text>
        <Pressable onPress={handleDelete} style={styles.backButton}>
          <Ionicons name="trash-outline" size={24} color={theme.expense} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.investmentType}>{investmentTypeLabel(investment.type)}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('accounts.totalContributed')}</Text>
              <Text style={[styles.statValue, { color: theme.income }]}>
                {formatCurrency(totalContributed, settings.currencySymbol, locale)}
              </Text>
            </View>
            {hasValue && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('accounts.currentValue')}</Text>
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {formatCurrency(currentValue, settings.currencySymbol, locale)}
                </Text>
              </View>
            )}
          </View>

          {hasValue && (
            <View style={styles.returnContainer}>
              <Text style={styles.returnLabel}>{t('accounts.return')}</Text>
              <Text
                style={[
                  styles.returnValue,
                  returnPercent >= 0 ? styles.positiveReturn : styles.negativeReturn,
                ]}
              >
                {returnPercent >= 0 ? '+' : ''}
                {returnPercent.toFixed(2)}%
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.income }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.buttonText}>{t('accounts.addContribution')}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowValueModal(true)}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>{t('accounts.updateValue')}</Text>
            </Pressable>
          </View>
        </Card>

        {/* Contribution History */}
        <Text style={styles.sectionTitle}>{t('accounts.contributions')}</Text>
        <Card>
          {investment.contributions.length > 0 ? (
            [...investment.contributions].reverse().map((contribution, index) => (
              <View key={contribution.id}>
                <View style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>
                      {formatDate(contribution.date, locale)}
                    </Text>
                    {contribution.note && (
                      <Text style={styles.historyNote}>{contribution.note}</Text>
                    )}
                  </View>
                  <Text style={styles.historyAmount}>
                    +{formatCurrency(contribution.amount, settings.currencySymbol, locale)}
                  </Text>
                </View>
                {index < investment.contributions.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t('accounts.noContributions')}</Text>
          )}
        </Card>

        {/* Value History */}
        <Text style={styles.sectionTitle}>{t('accounts.valueHistory')}</Text>
        <Card>
          {sortedValueHistory.length > 0 ? (
            sortedValueHistory.map((entry, index) => {
              const previousEntry = sortedValueHistory[index + 1];
              const diff = previousEntry ? entry.value - previousEntry.value : undefined;
              return (
                <View key={entry.id}>
                  <View style={styles.historyRow}>
                    <View style={styles.valueHistoryInfo}>
                      <Text style={styles.historyDate}>{formatDate(entry.date, locale)}</Text>
                      {entry.note && <Text style={styles.historyNote}>{entry.note}</Text>}
                    </View>
                    <View style={styles.valueHistoryRight}>
                      <Text style={[styles.historyAmount, { color: theme.text }]}>
                        {formatCurrency(entry.value, settings.currencySymbol, locale)}
                      </Text>
                      {diff !== undefined && (
                        <Text
                          style={[
                            styles.valueHistoryDiff,
                            { color: diff >= 0 ? theme.income : theme.expense },
                          ]}
                        >
                          {diff >= 0 ? '+' : ''}
                          {formatCurrency(diff, settings.currencySymbol, locale)}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleDeleteValueEntry(entry.id)}
                      style={styles.valueHistoryDeleteButton}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                  {index < sortedValueHistory.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{t('accounts.noValueHistory')}</Text>
          )}
        </Card>
      </ScrollView>

      {/* Add Contribution Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{t('accounts.addContribution')}</Text>
            <Pressable onPress={handleAddContribution}>
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <AmountInput value={newAmount} onChangeText={setNewAmount} type="income" />
            <Text style={styles.inputLabel}>{t('addTransaction.note')}</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder={t('addTransaction.notePlaceholder')}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Update Value Modal */}
      <Modal visible={showValueModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowValueModal(false)}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{t('accounts.updateCurrentValue')}</Text>
            <Pressable onPress={handleUpdateValue}>
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <AmountInput value={newAmount} onChangeText={setNewAmount} type="income" />
            <Text style={styles.inputLabel}>{t('addTransaction.note')}</Text>
            <TextInput
              style={styles.input}
              value={valueNote}
              onChangeText={setValueNote}
              placeholder={t('addTransaction.notePlaceholder')}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
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
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  summaryCard: {
    marginBottom: 24,
  },
  investmentType: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  returnContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  returnLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  returnValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  positiveReturn: {
    color: theme.income,
  },
  negativeReturn: {
    color: theme.expense,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyDate: {
    fontSize: 15,
    color: theme.text,
  },
  historyNote: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.income,
  },
  valueHistoryInfo: {
    flex: 1,
    marginRight: 8,
  },
  valueHistoryRight: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  valueHistoryDiff: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  valueHistoryDeleteButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.textSecondary,
    paddingVertical: 24,
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
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
});
