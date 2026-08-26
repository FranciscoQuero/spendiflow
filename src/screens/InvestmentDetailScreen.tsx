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
import { colors } from '../theme/colors';
import { formatCurrency, formatDate, parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'InvestmentDetail'>;

export const InvestmentDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { id } = route.params;

  const investments = useStore((state) => state.investments);
  const deleteInvestment = useStore((state) => state.deleteInvestment);
  const addContribution = useStore((state) => state.addContribution);
  const updateInvestment = useStore((state) => state.updateInvestment);
  const settings = useStore((state) => state.settings);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [note, setNote] = useState('');

  const investment = investments.find((i) => i.id === id);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const totalContributed = useMemo(() => {
    if (!investment) return 0;
    return investment.contributions.reduce((sum, c) => sum + c.amount, 0);
  }, [investment]);

  if (!investment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Investment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      `Delete "${investment.name}"?`,
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
      Alert.alert(t('common.error'), 'Please enter a valid amount');
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
      Alert.alert(t('common.error'), 'Please enter a valid amount');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateInvestment(id, {
      currentValue: parsedAmount,
      lastUpdated: getDateISO(),
    });

    setNewAmount('');
    setShowValueModal(false);
  };

  const returnPercent =
    investment.currentValue && totalContributed > 0
      ? ((investment.currentValue - totalContributed) / totalContributed) * 100
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{investment.name}</Text>
        <Pressable onPress={handleDelete} style={styles.backButton}>
          <Ionicons name="trash-outline" size={24} color={colors.expense} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.investmentType}>{investment.type}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('accounts.totalContributed')}</Text>
              <Text style={[styles.statValue, { color: colors.income }]}>
                {formatCurrency(totalContributed, settings.currencySymbol, locale)}
              </Text>
            </View>
            {investment.currentValue && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('accounts.currentValue')}</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {formatCurrency(investment.currentValue, settings.currencySymbol, locale)}
                </Text>
              </View>
            )}
          </View>

          {investment.currentValue && (
            <View style={styles.returnContainer}>
              <Text style={styles.returnLabel}>Return</Text>
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
              style={[styles.actionButton, { backgroundColor: colors.income }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.buttonText}>Add Contribution</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowValueModal(true)}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>Update Value</Text>
            </Pressable>
          </View>
        </Card>

        {/* Contribution History */}
        <Text style={styles.sectionTitle}>Contributions</Text>
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
            <Text style={styles.emptyText}>No contributions yet</Text>
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
            <Text style={styles.modalTitle}>Add Contribution</Text>
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
              placeholderTextColor={colors.textSecondary}
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
            <Text style={styles.modalTitle}>Update Current Value</Text>
            <Pressable onPress={handleUpdateValue}>
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <AmountInput value={newAmount} onChangeText={setNewAmount} type="income" />
          </View>
        </SafeAreaView>
      </Modal>
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
    color: colors.textSecondary,
    fontSize: 16,
  },
  summaryCard: {
    marginBottom: 24,
  },
  investmentType: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
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
    borderTopColor: colors.border,
  },
  returnLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  returnValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  positiveReturn: {
    color: colors.income,
  },
  negativeReturn: {
    color: colors.expense,
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
    color: colors.text,
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
    color: colors.text,
  },
  historyNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.income,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
