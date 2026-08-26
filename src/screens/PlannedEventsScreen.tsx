import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Modal,
  TextInput,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Chip } from '../components/Chip';
import { FormScrollView } from '../components/FormScrollView';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { formatCurrency, formatDateLong, getDateISO, parseNumber } from '../utils/formatters';
import { groupPlannedEvents } from '../utils/plannedEvents';
import { t } from '../locales/i18n';
import { PlannedEvent } from '../types';

interface Section {
  key: 'overdue' | 'upcoming' | 'completed';
  title: string;
  data: PlannedEvent[];
}

const ROW_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

export const PlannedEventsScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation();
  const plannedEvents = useStore((state) => state.plannedEvents);
  const bankAccounts = useStore((state) => state.bankAccounts);
  const addPlannedEvent = useStore((state) => state.addPlannedEvent);
  const updatePlannedEvent = useStore((state) => state.updatePlannedEvent);
  const deletePlannedEvent = useStore((state) => state.deletePlannedEvent);
  const settings = useStore((state) => state.settings);
  const locale = settings.language === 'es' ? 'es-ES' : 'en-US';

  const [showCompleted, setShowCompleted] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState<string>(getDateISO());
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const activeAccounts = useMemo(
    () => bankAccounts.filter((a) => !a.archived),
    [bankAccounts]
  );

  const accountName = (id?: string): string | undefined =>
    id ? bankAccounts.find((a) => a.id === id)?.name : undefined;

  const grouped = useMemo(() => groupPlannedEvents(plannedEvents), [plannedEvents]);

  const sections: Section[] = useMemo(() => {
    const result: Section[] = [];
    if (grouped.overdue.length > 0) {
      result.push({
        key: 'overdue',
        title: t('plannedEvents.overdueSection'),
        data: grouped.overdue,
      });
    }
    if (grouped.upcoming.length > 0) {
      result.push({
        key: 'upcoming',
        title: t('plannedEvents.upcomingSection'),
        data: grouped.upcoming,
      });
    }
    if (grouped.completed.length > 0) {
      result.push({
        key: 'completed',
        title: `${t('plannedEvents.completedSection')} (${grouped.completed.length})`,
        data: showCompleted ? grouped.completed : [],
      });
    }
    return result;
  }, [grouped, showCompleted]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDate(getDateISO());
    setEstimatedAmount('');
    setAccountId(null);
    setNote('');
    setShowDatePicker(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (event: PlannedEvent) => {
    Haptics.selectionAsync();
    setEditingId(event.id);
    setName(event.name);
    setDate(event.date);
    setEstimatedAmount(event.estimatedAmount != null ? String(event.estimatedAmount) : '');
    setAccountId(event.accountId ?? null);
    setNote(event.note ?? '');
    setShowDatePicker(false);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      setDate(getDateISO(selectedDate));
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(t('common.error'), t('plannedEvents.errors.name'));
      return;
    }

    const parsedAmount = parseNumber(estimatedAmount);
    const finalAmount = estimatedAmount.trim().length > 0 && parsedAmount > 0 ? parsedAmount : undefined;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const payload = {
      name: trimmedName,
      date,
      estimatedAmount: finalAmount,
      accountId: accountId ?? undefined,
      note: note.trim() || undefined,
    };

    if (editingId) {
      updatePlannedEvent(editingId, payload);
    } else {
      addPlannedEvent({ ...payload, done: false });
    }

    closeModal();
  };

  const handleToggleDone = (event: PlannedEvent) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePlannedEvent(event.id, { done: !event.done });
  };

  const handleDelete = (event: PlannedEvent) => {
    Alert.alert(t('common.delete'), t('plannedEvents.deleteConfirm', { name: event.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deletePlannedEvent(event.id);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: PlannedEvent }) => {
    const overdueRow = !item.done && new Date(item.date).getTime() < Date.now();
    const relatedAccountName = accountName(item.accountId);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          overdueRow && styles.rowOverdue,
          item.done && styles.rowCompleted,
          pressed && styles.rowPressed,
        ]}
        onPress={() => openEditModal(item)}
        onLongPress={() => handleDelete(item)}
      >
        <Pressable
          hitSlop={8}
          style={styles.checkbox}
          onPress={() => handleToggleDone(item)}
        >
          <Ionicons
            name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
            size={26}
            color={item.done ? theme.income : theme.textSecondary}
          />
        </Pressable>

        <View style={styles.rowInfo}>
          <Text
            style={[styles.rowName, item.done && styles.rowTextCompleted]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={[styles.rowMeta, item.done && styles.rowTextCompleted]} numberOfLines={1}>
            {new Date(item.date).toLocaleDateString(locale, ROW_DATE_OPTIONS)}
            {relatedAccountName ? ` · ${relatedAccountName}` : ''}
          </Text>
          {item.note && (
            <Text style={styles.rowNote} numberOfLines={1}>
              {item.note}
            </Text>
          )}
        </View>

        {item.estimatedAmount != null && (
          <Text style={[styles.rowAmount, overdueRow && styles.rowAmountOverdue]}>
            {formatCurrency(item.estimatedAmount, settings.currencySymbol, locale)}
          </Text>
        )}
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => {
    if (section.key === 'completed') {
      return (
        <Pressable
          style={styles.sectionHeader}
          onPress={() => {
            Haptics.selectionAsync();
            setShowCompleted((prev) => !prev);
          }}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Ionicons
            name={showCompleted ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.textSecondary}
          />
        </Pressable>
      );
    }
    return (
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            section.key === 'overdue' && styles.sectionTitleOverdue,
          ]}
        >
          {section.title}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={theme.textSecondary} />
      <Text style={styles.emptyTitle}>{t('plannedEvents.emptyTitle')}</Text>
      <Text style={styles.emptyDescription}>{t('plannedEvents.emptyDescription')}</Text>
      <Pressable style={styles.emptyButton} onPress={openCreateModal}>
        <Text style={styles.emptyButtonText}>{t('plannedEvents.createButton')}</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('plannedEvents.title')}</Text>
        <View style={styles.backButton} />
      </View>

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={plannedEvents.length === 0 ? renderEmpty : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

      {plannedEvents.length > 0 && (
        <Pressable style={styles.fab} onPress={openCreateModal}>
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      )}

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <FormScrollView style={styles.modalKeyboard}>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeModal}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Text style={styles.modalTitle}>
                {editingId ? t('plannedEvents.editTitle') : t('plannedEvents.addTitle')}
              </Text>
              <Pressable onPress={handleSave}>
                <Text style={styles.saveText}>{t('common.save')}</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('plannedEvents.name')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('plannedEvents.namePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              {/* Date */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('plannedEvents.date')}</Text>
                <Pressable
                  style={styles.dateInput}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowDatePicker((prev) => !prev);
                  }}
                >
                  <Text style={styles.dateText}>{formatDateLong(date, locale)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                </Pressable>
                {showDatePicker && (
                  <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
                    <DateTimePicker
                      value={new Date(date)}
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

              {/* Estimated amount */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('plannedEvents.estimatedAmount')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={estimatedAmount}
                  onChangeText={setEstimatedAmount}
                  placeholder="0,00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Account */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('plannedEvents.account')}</Text>
                <View style={styles.chipContainer}>
                  <Chip
                    label={t('plannedEvents.noAccount')}
                    selected={accountId === null}
                    onPress={() => setAccountId(null)}
                  />
                  {activeAccounts.map((account) => (
                    <Chip
                      key={account.id}
                      label={account.name}
                      selected={accountId === account.id}
                      onPress={() => setAccountId(account.id)}
                    />
                  ))}
                </View>
              </View>

              {/* Note */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('plannedEvents.note')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('plannedEvents.notePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
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
  listContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleOverdue: {
    color: theme.warning,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rowOverdue: {
    borderWidth: 1.5,
    borderColor: theme.warning,
  },
  rowCompleted: {
    opacity: 0.55,
  },
  rowPressed: {
    opacity: 0.85,
  },
  checkbox: {
    marginRight: 12,
  },
  rowInfo: {
    flex: 1,
    marginRight: 8,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  rowMeta: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  rowNote: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  rowTextCompleted: {
    textDecorationLine: 'line-through',
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  rowAmountOverdue: {
    color: theme.warning,
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
    bottom: 30,
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
  modalKeyboard: {
    flex: 1,
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
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dateText: {
    fontSize: 16,
    color: theme.text,
  },
  iosPickerContainer: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  doneButtonText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
