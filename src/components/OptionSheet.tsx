import React, { useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';

export interface OptionSheetOption<T extends string> {
  value: T;
  label: string;
  /** Icono opcional delante de la etiqueta. */
  icon?: keyof typeof Ionicons.glyphMap;
}

interface OptionSheetProps<T extends string> {
  visible: boolean;
  onClose: () => void;
  /** Opciones a listar; se marca con un check la que coincide con `selectedValue`. */
  options: OptionSheetOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  /** Título opcional mostrado sobre la lista de opciones. */
  title?: string;
}

/**
 * Bottom sheet reutilizable: modal transparente anclado abajo, con fondo de
 * scrim, panel con radio superior y una lista de opciones (icono opcional +
 * etiqueta + check en la activa). Se cierra al tocar el scrim o al
 * seleccionar una opción.
 */
export function OptionSheet<T extends string>({
  visible,
  onClose,
  options,
  selectedValue,
  onSelect,
  title,
}: OptionSheetProps<T>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handleSelect = (value: T) => {
    Haptics.selectionAsync();
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Cerrar"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          {title && <Text style={styles.title}>{title}</Text>}
          {options.map((option, index) => {
            const selected = option.value === selectedValue;
            const isLast = index === options.length - 1;
            return (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.option,
                  isLast && styles.optionLast,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => handleSelect(option.value)}
              >
                {option.icon && (
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={selected ? theme.primary : theme.textSecondary}
                    style={styles.optionIcon}
                  />
                )}
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  optionLabelSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
});
