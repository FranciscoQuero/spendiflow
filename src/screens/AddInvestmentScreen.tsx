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
import { FormScrollView } from '../components/FormScrollView';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { parseNumber, getDateISO } from '../utils/formatters';
import { INVESTMENT_TYPES, investmentTypeI18nKey } from '../utils/investmentTypes';
import { t } from '../locales/i18n';

export const AddInvestmentScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation();
  const addInvestment = useStore((state) => state.addInvestment);
  const addContribution = useStore((state) => state.addContribution);
  const addInvestmentValueEntry = useStore((state) => state.addInvestmentValueEntry);

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  // Ambos campos son independientes: quien da de alta una inversión que ya
  // existía puede rellenar solo uno, ambos o ninguno.
  const [totalContributed, setTotalContributed] = useState('');
  const [currentValue, setCurrentValue] = useState('');

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

    // Total aportado hasta hoy: se registra como una única aportación
    // histórica, no como si empezaras de cero.
    if (parseNumber(totalContributed) > 0) {
      addContribution(newInvestmentId, {
        amount: parseNumber(totalContributed),
        date: getDateISO(),
        note: t('accounts.previousContributionsNote'),
      });
    }

    // Valor actual: independiente de lo aportado, para no forzar un
    // beneficio de 0% cuando la inversión ya tenía recorrido.
    if (parseNumber(currentValue) > 0) {
      addInvestmentValueEntry(newInvestmentId, {
        value: parseNumber(currentValue),
        date: getDateISO(),
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

      <FormScrollView>
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
          {INVESTMENT_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[
                styles.typeChip,
                selectedType === type && styles.typeChipSelected,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedType(type);
              }}
            >
              <Text
                style={[
                  styles.typeText,
                  selectedType === type && styles.typeTextSelected,
                ]}
              >
                {t(investmentTypeI18nKey(type))}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Total Contributed To Date */}
        <Text style={styles.label}>{t('accounts.totalContributedToDate')}</Text>
        <Text style={styles.hint}>{t('accounts.totalContributedToDateHelp')}</Text>
        <AmountInput
          value={totalContributed}
          onChangeText={setTotalContributed}
          type="income"
        />

        {/* Current Value */}
        <Text style={styles.label}>{t('accounts.currentValue')}</Text>
        <Text style={styles.hint}>{t('accounts.currentValueHelp')}</Text>
        <AmountInput
          value={currentValue}
          onChangeText={setCurrentValue}
          type="transfer"
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
      </FormScrollView>
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
    paddingBottom: 32,
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
  hint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 8,
    marginTop: -4,
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
