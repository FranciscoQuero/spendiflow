import React, { useMemo } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { Category } from '../types';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { useStore } from '../store/useStore';

interface CategoryChipProps {
  category: Category;
  selected?: boolean;
  onPress?: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  selected = false,
  onPress,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const settings = useStore((state) => state.settings);
  const name = settings.language === 'es' ? category.name : category.nameEn;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: category.color },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          selected && styles.selectedText,
          !selected && { color: category.color },
        ]}
      >
        {name}
      </Text>
    </Pressable>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.border,
    marginRight: 8,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: 'white',
  },
});
