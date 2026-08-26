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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../components/Card';
import { AmountInput } from '../components/AmountInput';
import { FormScrollView } from '../components/FormScrollView';
import { useStore } from '../store/useStore';
import {
  getAccountBalance,
  getAvailableBalance,
  getProvisionBalance,
} from '../hooks/useAccounts';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { formatCurrency, formatDate, parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'AccountDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const roleLabel = (role: string): string => {
  switch (role) {
    case 'personal':
      return t('accounts.roleOptions.personal');
    case 'business':
      return t('accounts.roleOptions.business');
    case 'shared':
      return t('accounts.roleOptions.shared');
    case 'savings':
      return t('accounts.roleOptions.savings');
    default:
      return t('accounts.roleOptions.other');
  }
};

export const AccountDetailScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { id } = route.params;

  const bankAccounts = useStore((state) => state.bankAccounts);
  const provisions = useStore((state) => state.provisions);
  const deleteBankAccount = useStore((state) => state.deleteBankAccount);
  const updateBankAccount = useStore((state) => state.updateBankAccount);
  const addBalanceEntry = useStore((state) => state.addBalanceEntry);
  const settings = useStore((state) => state.settings);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [note, setNote] = useState('');

  const account = bankAccounts.find((a) => a.id === id);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const accountProvisions = useMemo(
    () => provisions.filter((p) => p.accountId === id && !p.archived),
    [provisions, id]
  );

  const sortedHistory = useMemo(() => {
    if (!account) return [];
    return [...account.balanceHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [account]);

  if (!account) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('accounts.accountNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentBalance = getAccountBalance(account);
  const availableBalance = getAvailableBalance(account, provisions);
  const hasFloorOrProvisions = (account.floor ?? 0) > 0 || accountProvisions.length > 0;

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      t('accounts.deleteAccountConfirm', { name: account.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteBankAccount(id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleArchiveToggle = () => {
    const willArchive = !account.archived;
    Alert.alert(
      willArchive ? t('accounts.archiveAccount') : t('accounts.unarchiveAccount'),
      willArchive
        ? t('accounts.archiveConfirm', { name: account.name })
        : t('accounts.unarchiveConfirm', { name: account.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updateBankAccount(id, { archived: willArchive });
            if (willArchive) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleAddBalance = () => {
    const parsedAmount = parseNumber(newBalance);
    if (parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterValidAmount'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addBalanceEntry(id, {
      amount: parsedAmount,
      date: getDateISO(),
      note: note.trim() || undefined,
    });

    setNewBalance('');
    setNote('');
    setShowAddModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{account.name}</Text>
        <Pressable
          onPress={() => navigation.navigate('AddAccount', { accountId: id })}
          style={styles.backButton}
        >
          <Ionicons name="create-outline" size={22} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Current Balance */}
        <Card style={styles.balanceCard}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel(account.role)}</Text>
          </View>
          <Text style={styles.bankName}>{account.bankName}</Text>
          <Text style={styles.balanceLabel}>{t('accounts.balance')}</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(currentBalance, settings.currencySymbol, locale)}
          </Text>

          {hasFloorOrProvisions && (
            <Text style={styles.availableText}>
              {t('accounts.available')}: {formatCurrency(availableBalance, settings.currencySymbol, locale)}
            </Text>
          )}

          <Pressable
            style={styles.updateButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.updateButtonText}>
              {t('accounts.updateBalance')}
            </Text>
          </Pressable>
        </Card>

        {/* Details */}
        <Card style={styles.detailsCard}>
          {account.floor !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('accounts.floor')}</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(account.floor, settings.currencySymbol, locale)}
              </Text>
            </View>
          )}
          {account.ownershipShare < 1 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('accounts.ownershipShare')}</Text>
              <Text style={styles.detailValue}>
                {Math.round(account.ownershipShare * 100)}%
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('accounts.available')}</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(availableBalance, settings.currencySymbol, locale)}
            </Text>
          </View>
        </Card>

        {/* Provisions / Huchas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('provisions.title')}</Text>
          <Pressable
            style={styles.sectionAddButton}
            onPress={() => navigation.navigate('AddProvision', { accountId: id })}
          >
            <Ionicons name="add-circle" size={26} color={theme.primary} />
          </Pressable>
        </View>
        <Card>
          {accountProvisions.length > 0 ? (
            accountProvisions.map((provision, index) => {
              const provisionBalance = getProvisionBalance(provision);
              const progress =
                provision.targetAmount && provision.targetAmount > 0
                  ? Math.min((provisionBalance / provision.targetAmount) * 100, 100)
                  : undefined;
              return (
                <View key={provision.id}>
                  <Pressable
                    style={styles.provisionRow}
                    onPress={() =>
                      navigation.navigate('ProvisionDetail', { provisionId: provision.id })
                    }
                  >
                    <View
                      style={[styles.provisionIcon, { backgroundColor: provision.color }]}
                    >
                      <Ionicons
                        name={provision.icon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color="white"
                      />
                    </View>
                    <View style={styles.provisionInfo}>
                      <Text style={styles.provisionName}>{provision.name}</Text>
                      {progress !== undefined && (
                        <View style={styles.miniProgressBar}>
                          <View
                            style={[
                              styles.miniProgressFill,
                              { width: `${progress}%`, backgroundColor: provision.color },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                    <Text style={styles.provisionBalance}>
                      {formatCurrency(provisionBalance, settings.currencySymbol, locale)}
                    </Text>
                  </Pressable>
                  {index < accountProvisions.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{t('provisions.noProvisions')}</Text>
          )}
        </Card>

        {/* Balance History */}
        <Text style={styles.sectionTitle}>{t('accounts.balanceHistory')}</Text>
        <Card>
          {sortedHistory.length > 0 ? (
            sortedHistory.map((entry, index) => (
              <View key={entry.id}>
                <View style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>
                      {formatDate(entry.date, locale)}
                    </Text>
                    {entry.note && (
                      <Text style={styles.historyNote}>{entry.note}</Text>
                    )}
                  </View>
                  <Text style={styles.historyAmount}>
                    {formatCurrency(entry.amount, settings.currencySymbol, locale)}
                  </Text>
                </View>
                {index < sortedHistory.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t('accounts.noBalanceHistory')}</Text>
          )}
        </Card>

        {/* Archive / Delete */}
        <View style={styles.footerActions}>
          <Pressable style={styles.footerButton} onPress={handleArchiveToggle}>
            <Ionicons
              name={account.archived ? 'archive' : 'archive-outline'}
              size={18}
              color={theme.textSecondary}
            />
            <Text style={styles.footerButtonText}>
              {account.archived ? t('accounts.unarchiveAccount') : t('accounts.archiveAccount')}
            </Text>
          </Pressable>
          <Pressable style={styles.footerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={theme.expense} />
            <Text style={[styles.footerButtonText, { color: theme.expense }]}>
              {t('common.delete')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Add Balance Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <FormScrollView>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Text style={styles.modalTitle}>{t('accounts.updateBalance')}</Text>
              <Pressable onPress={handleAddBalance}>
                <Text style={styles.saveText}>{t('common.save')}</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <AmountInput value={newBalance} onChangeText={setNewBalance} type="income" />
              <Text style={styles.inputLabel}>{t('addTransaction.note')}</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder={t('addTransaction.notePlaceholder')}
                placeholderTextColor={theme.textSecondary}
              />
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
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
    textTransform: 'uppercase',
  },
  bankName: {
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
    color: theme.primary,
    marginVertical: 8,
  },
  availableText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  updateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  detailsCard: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  sectionAddButton: {
    padding: 2,
  },
  provisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  provisionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  provisionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  provisionName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  provisionBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
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
    color: theme.primary,
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
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerButtonText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
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
