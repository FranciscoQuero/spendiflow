import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { t } from '../locales/i18n';

interface RecurrenceActionsProps {
  onConfirm: () => void;
  onSkip: () => void;
  compact?: boolean;
}

/** Botones "Confirmar" / "Omitir" para una recurrencia vencida, con haptics. */
export const RecurrenceActions: React.FC<RecurrenceActionsProps> = ({
  onConfirm,
  onSkip,
  compact = false,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, styles.skipButton, compact && styles.compactButton]}
        onPress={handleSkip}
        hitSlop={8}
      >
        <Text style={styles.skipText}>{t('recurring.skip')}</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.confirmButton, compact && styles.compactButton]}
        onPress={handleConfirm}
        hitSlop={8}
      >
        <Text style={styles.confirmText}>{t('recurring.confirm')}</Text>
      </Pressable>
    </View>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  compactButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipButton: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  confirmButton: {
    backgroundColor: theme.income,
  },
  skipText: {
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  confirmText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
});
