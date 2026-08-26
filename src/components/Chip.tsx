import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

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
  color = colors.primary,
}) => {
  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: color, borderColor: color },
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  textSelected: {
    color: 'white',
    fontWeight: '600',
  },
});
