import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hexToRgba } from '../theme/colors';

interface TintedIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size?: number;
  iconSize?: number;
  /** Opacidad del fondo tintado (0-1). */
  tintOpacity?: number;
  style?: ViewStyle;
}

/**
 * Icono de identidad (categoría, cuenta, hucha...) dentro de un círculo con
 * fondo tintado del color recibido en baja opacidad, en vez del círculo
 * sólido + icono blanco usado antes. Patrón único para filas de listas en
 * toda la app: transacciones, cuentas, inversiones, deudas, recurrencias.
 */
export const TintedIcon: React.FC<TintedIconProps> = ({
  name,
  color,
  size = 40,
  iconSize,
  tintOpacity = 0.14,
  style,
}) => {
  const resolvedIconSize = iconSize ?? Math.round(size * 0.5);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hexToRgba(color, tintOpacity),
        },
        style,
      ]}
    >
      <Ionicons name={name} size={resolvedIconSize} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
