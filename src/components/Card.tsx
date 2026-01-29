import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  PressableProps,
} from 'react-native';
import { colors } from '../theme/colors';

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
