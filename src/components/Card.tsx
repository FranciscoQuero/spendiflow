import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  PressableProps,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';

interface CardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: ViewStyle | (ViewStyle | false | undefined)[];
  pressable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  pressable = false,
  onPress,
  ...props
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (pressable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          style,
          pressed && styles.pressed,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
