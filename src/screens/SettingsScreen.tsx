import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { t, setLocale } from '../locales/i18n';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const resetAllData = useStore((state) => state.resetAllData);
  const categories = useStore((state) => state.categories);

  const [, forceUpdate] = useState({});

  const handleLanguageChange = (language: 'es' | 'en') => {
    updateSettings({ language });
    setLocale(language);
    forceUpdate({}); // Force re-render to update translations
  };

  const handleResetData = () => {
    Alert.alert(
      t('settings.deleteAllData'),
      t('settings.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            resetAllData();
            Alert.alert(t('common.success'), 'Data deleted');
          },
        },
      ]
    );
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    showChevron = true,
    danger = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    danger?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? colors.expense : colors.textSecondary}
        />
        <Text style={[styles.settingLabel, danger && styles.dangerText]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showChevron && onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        )}
      </View>
    </Pressable>
  );

  const LanguageOption = ({
    language,
    label,
  }: {
    language: 'es' | 'en';
    label: string;
  }) => (
    <Pressable
      style={[
        styles.languageOption,
        settings.language === language && styles.languageOptionActive,
      ]}
      onPress={() => handleLanguageChange(language)}
    >
      <Text
        style={[
          styles.languageText,
          settings.language === language && styles.languageTextActive,
        ]}
      >
        {label}
      </Text>
      {settings.language === language && (
        <Ionicons name="checkmark" size={20} color={colors.primary} />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        {/* Language Section */}
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <Card style={styles.card}>
          <LanguageOption language="es" label={t('settings.spanish')} />
          <View style={styles.divider} />
          <LanguageOption language="en" label={t('settings.english')} />
        </Card>

        {/* Categories Section */}
        <Text style={styles.sectionTitle}>{t('settings.categories')}</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="list"
            label={t('settings.expenseCategories')}
            value={`${expenseCategories.length}`}
            onPress={() => navigation.navigate('EditCategories', { type: 'expense' })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="list"
            label={t('settings.incomeCategories')}
            value={`${incomeCategories.length}`}
            onPress={() => navigation.navigate('EditCategories', { type: 'income' })}
          />
        </Card>

        {/* Data Section */}
        <Text style={styles.sectionTitle}>Data</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="download-outline"
            label={t('settings.exportData')}
            onPress={() => Alert.alert('Coming soon', 'Export feature coming soon')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="cloud-upload-outline"
            label={t('settings.importData')}
            onPress={() => Alert.alert('Coming soon', 'Import feature coming soon')}
          />
        </Card>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, styles.dangerSection]}>Danger Zone</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="trash-outline"
            label={t('settings.deleteAllData')}
            onPress={handleResetData}
            showChevron={false}
            danger
          />
        </Card>

        {/* About Section */}
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="information-circle-outline"
            label={t('app.name')}
            value="v1.0.0"
            showChevron={false}
          />
        </Card>

        <Text style={styles.footer}>{t('app.tagline')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerSection: {
    color: colors.expense,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  dangerText: {
    color: colors.expense,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 50,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  languageOptionActive: {
    backgroundColor: `${colors.primary}10`,
  },
  languageText: {
    fontSize: 16,
    color: colors.text,
  },
  languageTextActive: {
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 32,
    fontSize: 14,
  },
});
