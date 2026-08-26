import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AmountInput } from '../components/AmountInput';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { parseNumber, getDateISO } from '../utils/formatters';
import { t } from '../locales/i18n';

const investmentTypes = [
  { id: 'stocks', name: 'Acciones', nameEn: 'Stocks' },
  { id: 'crypto', name: 'Cripto', nameEn: 'Crypto' },
  { id: 'fund', name: 'Fondo de inversión', nameEn: 'Investment Fund' },
  { id: 'etf', name: 'ETF', nameEn: 'ETF' },
  { id: 'pension', name: 'Plan de pensiones', nameEn: 'Pension' },
  { id: 'other', name: 'Otro', nameEn: 'Other' },
];

export const AddInvestmentScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation();
  const addInvestment = useStore((state) => state.addInvestment);
  const addContribution = useStore((state) => state.addContribution);
  const settings = useStore((state) => state.settings);

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [initialContribution, setInitialContribution] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('accounts.pleaseEnterInvestmentName'));
      return;
    }

    if (!selectedType) {
      Alert.alert(t('common.error'), t('accounts.pleaseSelectType'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newInvestmentId = addInvestment({
      name: name.trim(),
      type: selectedType,
    });

    // Add initial contribution if provided
    if (parseNumber(initialContribution) > 0) {
      addContribution(newInvestmentId, {
        amount: parseNumber(initialContribution),
        date: getDateISO(),
        note: t('accounts.initialContributionNote'),
      });
    }

    navigation.goBack();
  };

  const canSave = name.trim() && selectedType;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>{t('accounts.addInvestment')}</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Investment Name */}
        <Text style={styles.label}>{t('accounts.investmentName')}</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder={t('accounts.investmentNamePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          autoFocus
        />

        {/* Type Selection */}
        <Text style={styles.label}>{t('accounts.type')}</Text>
        <View style={styles.typeContainer}>
          {investmentTypes.map((type) => (
            <Pressable
              key={type.id}
              style={[
                styles.typeChip,
                selectedType === type.id && styles.typeChipSelected,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedType(type.id);
              }}
            >
              <Text
                style={[
                  styles.typeText,
                  selectedType === type.id && styles.typeTextSelected,
                ]}
              >
                {settings.language === 'es' ? type.name : type.nameEn}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Initial Contribution */}
        <Text style={styles.label}>{t('accounts.initialContribution')}</Text>
        <AmountInput
          value={initialContribution}
          onChangeText={setInitialContribution}
          type="income"
        />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, !canSave && styles.disabledButton]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </Pressable>
      </View>
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    marginTop: 16,
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
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    marginBottom: 8,
  },
  typeChipSelected: {
    backgroundColor: theme.income,
    borderColor: theme.income,
  },
  typeText: {
    fontSize: 14,
    color: theme.text,
  },
  typeTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  saveButton: {
    backgroundColor: theme.income,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
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
