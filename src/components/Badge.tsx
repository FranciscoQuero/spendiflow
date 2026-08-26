import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { Theme, hexToRgba } from '../theme/colors';

interface BadgeProps {
  label: string;
  /** Color de acento; el fondo es este color tintado y el texto/icono usan el color sólido. */
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

/**
 * Etiqueta de estado compacta (rol de cuenta, "Negocio", vencido...) con
 * una única anatomía compartida en toda la app: mismo radio, padding y
 * tamaño de fuente, fondo tintado del color de acento recibido.
 */
export const Badge: React.FC<BadgeProps> = ({ label, color, icon, style }) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const accent = color ?? theme.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: hexToRgba(accent, 0.14) }, style]}>
      {icon && <Ionicons name={icon} size={12} color={accent} />}
      <Text style={[styles.text, { color: accent }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const makeStyles = (_theme: Theme) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
