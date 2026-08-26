import React, { useMemo } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { Theme, hexToRgba } from '../theme/colors';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  /** Icono opcional delante de la etiqueta (para chips de filtro). */
  icon?: keyof typeof Ionicons.glyphMap;
  /**
   * 'solid' (por defecto): chip con borde y relleno sólido del color activo al
   * seleccionar, texto blanco. 'tinted': sin relleno cuando está inactivo,
   * fondo tintado al 14% del color activo + texto de ese color al seleccionar.
   */
  variant?: 'solid' | 'tinted';
  /** Chip compacto: sin borde, padding/tipografía reducidos. Para filas de filtros. */
  dense?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  color,
  icon,
  variant = 'solid',
  dense = false,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const activeColor = color ?? theme.primary;
  const isTinted = variant === 'tinted';

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        dense && styles.chipDense,
        isTinted && styles.chipTinted,
        selected &&
          (isTinted
            ? { backgroundColor: hexToRgba(activeColor, 0.14) }
            : { backgroundColor: activeColor, borderColor: activeColor }),
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={dense ? 13 : 15}
          color={selected ? activeColor : theme.textSecondary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          dense && styles.textDense,
          selected &&
            (isTinted ? { color: activeColor, fontWeight: '600' } : styles.textSelected),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipTinted: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  chipDense: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 0,
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  textDense: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  textSelected: {
    color: 'white',
    fontWeight: '600',
  },
});
