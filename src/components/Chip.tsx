import React, { useMemo } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  color,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const activeColor = color ?? theme.primary;

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: activeColor, borderColor: activeColor },
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  textSelected: {
    color: 'white',
    fontWeight: '600',
  },
});
