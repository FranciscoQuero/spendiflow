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
import { getProvisionBalance } from '../hooks/useAccounts';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { formatCurrency, formatDate, parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'ProvisionDetail'>;

export const ProvisionDetailScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { provisionId } = route.params;

  const provisions = useStore((state) => state.provisions);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const updateProvision = useStore((state) => state.updateProvision);
  const deleteProvision = useStore((state) => state.deleteProvision);
  const addProvisionEntry = useStore((state) => state.addProvisionEntry);
  const settings = useStore((state) => state.settings);

  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const provision = provisions.find((p) => p.id === provisionId);
  const account = provision ? bankAccounts.find((a) => a.id === provision.accountId) : undefined;
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const balance = useMemo(() => (provision ? getProvisionBalance(provision) : 0), [provision]);

  if (!provision) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('provisions.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress =
    provision.targetAmount && provision.targetAmount > 0
      ? Math.min((balance / provision.targetAmount) * 100, 100)
      : undefined;

  const closeModals = () => {
    setShowContributeModal(false);
    setShowWithdrawModal(false);
    setAmount('');
    setNote('');
  };

  const handleContribute = () => {
    const parsedAmount = parseNumber(amount);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addProvisionEntry(provisionId, {
      amount: parsedAmount,
      date: getDateISO(),
      note: note.trim() || undefined,
    });
    closeModals();
  };

  const handleWithdraw = () => {
    const parsedAmount = parseNumber(amount);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }

    if (parsedAmount > balance) {
      Alert.alert(t('common.error'), t('provisions.withdrawExceeds'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addProvisionEntry(provisionId, {
      amount: -parsedAmount,
      date: getDateISO(),
      note: note.trim() || undefined,
    });
    closeModals();
  };

  const handleArchiveToggle = () => {
    const willArchive = !provision.archived;
    Alert.alert(
      willArchive ? t('provisions.archive') : t('provisions.unarchive'),
      willArchive
        ? t('provisions.archiveConfirm', { name: provision.name })
        : t('provisions.unarchiveConfirm', { name: provision.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updateProvision(provisionId, { archived: willArchive });
            if (willArchive) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      t('provisions.deleteConfirm', { name: provision.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteProvision(provisionId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{provision.name}</Text>
        <Pressable onPress={handleDelete} style={styles.backButton}>
          <Ionicons name="trash-outline" size={24} color={theme.expense} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <View style={[styles.iconCircle, { backgroundColor: provision.color }]}>
            <Ionicons
              name={provision.icon as keyof typeof Ionicons.glyphMap}
              size={28}
              color="white"
            />
          </View>
          {account && <Text style={styles.accountName}>{account.name}</Text>}
          <Text style={styles.balanceLabel}>{t('provisions.balance')}</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(balance, settings.currencySymbol, locale)}
          </Text>

          {provision.targetAmount !== undefined && progress !== undefined && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress}%`, backgroundColor: provision.color },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {formatCurrency(balance, settings.currencySymbol, locale)} {t('provisions.of')}{' '}
                {formatCurrency(provision.targetAmount, settings.currencySymbol, locale)} (
                {progress.toFixed(0)}%)
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.income }]}
              onPress={() => setShowContributeModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.buttonText}>{t('provisions.contribute')}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.expense }]}
              onPress={() => setShowWithdrawModal(true)}
            >
              <Ionicons name="remove" size={20} color="white" />
              <Text style={styles.buttonText}>{t('provisions.withdraw')}</Text>
            </Pressable>
          </View>

          <View style={styles.secondaryActions}>
            <Pressable style={styles.secondaryButton} onPress={handleArchiveToggle}>
              <Ionicons
                name={provision.archived ? 'archive' : 'archive-outline'}
                size={18}
                color={theme.textSecondary}
              />
              <Text style={styles.secondaryButtonText}>
                {provision.archived ? t('provisions.unarchive') : t('provisions.archive')}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* History */}
        <Text style={styles.sectionTitle}>{t('provisions.history')}</Text>
        <Card>
          {provision.entries.length > 0 ? (
            [...provision.entries].reverse().map((entry, index) => (
              <View key={entry.id}>
                <View style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>{formatDate(entry.date, locale)}</Text>
                    {entry.note && <Text style={styles.historyNote}>{entry.note}</Text>}
                  </View>
                  <Text
                    style={[
                      styles.historyAmount,
                      { color: entry.amount >= 0 ? theme.income : theme.expense },
                    ]}
                  >
                    {entry.amount >= 0 ? '+' : ''}
                    {formatCurrency(entry.amount, settings.currencySymbol, locale)}
                  </Text>
                </View>
                {index < provision.entries.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t('provisions.noEntries')}</Text>
          )}
        </Card>
      </ScrollView>

      {/* Contribute Modal */}
      <Modal visible={showContributeModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={closeModals}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{t('provisions.contribute')}</Text>
            <Pressable onPress={handleContribute}>
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <AmountInput value={amount} onChangeText={setAmount} type="income" />
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

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={closeModals}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{t('provisions.withdraw')}</Text>
            <Pressable onPress={handleWithdraw}>
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalHint}>
              {t('provisions.balance')}: {formatCurrency(balance, settings.currencySymbol, locale)}
            </Text>
            <AmountInput value={amount} onChangeText={setAmount} type="expense" />
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
  balanceCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  accountName: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.text,
    marginVertical: 8,
  },
  progressSection: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: theme.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
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
  secondaryActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
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
  modalHint: {
    textAlign: 'center',
    color: theme.textSecondary,
    marginBottom: 8,
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
