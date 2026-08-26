import React, { useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { parseNumber } from '../utils/formatters';
import { t } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'AddProvision'>;

const ICON_OPTIONS = [
  'cash',
  'briefcase',
  'airplane',
  'car',
  'home',
  'gift',
  'school',
  'medkit',
  'paw',
  'umbrella',
  'construct',
  'ellipsis-horizontal',
] as const;

const COLOR_OPTIONS = [
  colors.categoryColors.casa,
  colors.categoryColors.comida,
  colors.categoryColors.suscripciones,
  colors.categoryColors.ocio,
  colors.categoryColors.otros,
  colors.categoryColors.viajes,
  colors.primary,
  colors.income,
  colors.expense,
  colors.warning,
];

export const AddProvisionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const preselectedAccountId = route.params?.accountId;

  const bankAccounts = useStore((state) => state.bankAccounts);
  const addProvision = useStore((state) => state.addProvision);

  const activeAccounts = bankAccounts.filter((a) => !a.archived);

  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>(
    preselectedAccountId ?? activeAccounts[0]?.id
  );
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);
  const [targetAmount, setTargetAmount] = useState('');

  const preselectedAccount = preselectedAccountId
    ? bankAccounts.find((a) => a.id === preselectedAccountId)
    : undefined;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('provisions.pleaseEnterName'));
      return;
    }
    if (!accountId) {
      Alert.alert(t('common.error'), t('provisions.pleaseSelectAccount'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addProvision({
      accountId,
      name: name.trim(),
      icon,
      color,
      targetAmount: targetAmount.trim() ? parseNumber(targetAmount) : undefined,
      archived: false,
    });

    navigation.goBack();
  };

  const canSave = name.trim() && accountId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('provisions.addProvision')}</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Text style={styles.label}>{t('provisions.name')}</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder={t('provisions.namePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          autoFocus
        />

        {/* Account */}
        <Text style={styles.label}>{t('provisions.account')}</Text>
        {preselectedAccount ? (
          <View style={[styles.chip, styles.chipSelected, styles.chipFixed]}>
            <Text style={[styles.chipText, styles.chipTextSelected]}>
              {preselectedAccount.name}
            </Text>
          </View>
        ) : (
          <View style={styles.chipRow}>
            {activeAccounts.map((account) => (
              <Pressable
                key={account.id}
                style={[styles.chip, accountId === account.id && styles.chipSelected]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setAccountId(account.id);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    accountId === account.id && styles.chipTextSelected,
                  ]}
                >
                  {account.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Icon */}
        <Text style={styles.label}>{t('provisions.icon')}</Text>
        <View style={styles.iconGrid}>
          {ICON_OPTIONS.map((iconName) => (
            <Pressable
              key={iconName}
              style={[
                styles.iconSwatch,
                icon === iconName && { borderColor: color, backgroundColor: color + '22' },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setIcon(iconName);
              }}
            >
              <Ionicons
                name={iconName as keyof typeof Ionicons.glyphMap}
                size={22}
                color={icon === iconName ? color : colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>

        {/* Color */}
        <Text style={styles.label}>{t('provisions.color')}</Text>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((colorOption) => (
            <Pressable
              key={colorOption}
              style={[
                styles.colorSwatch,
                { backgroundColor: colorOption },
                color === colorOption && styles.colorSwatchSelected,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setColor(colorOption);
              }}
            >
              {color === colorOption && (
                <Ionicons name="checkmark" size={18} color="white" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Target Amount */}
        <Text style={styles.label}>{t('provisions.target')}</Text>
        <TextInput
          style={styles.textInput}
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder={t('provisions.targetPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
        />
      </ScrollView>

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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipFixed: {
    alignSelf: 'flex-start',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: 'white',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconSwatch: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: colors.text,
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
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
