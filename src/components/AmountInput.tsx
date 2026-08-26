import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Theme } from '../theme/colors';
import { useStore } from '../store/useStore';

interface AmountInputProps {
  value: string;
  onChangeText: (value: string) => void;
  type?: 'expense' | 'income' | 'transfer';
  autoFocus?: boolean;
}

export interface AmountInputHandle {
  focus: () => void;
}

export const AmountInput = forwardRef<AmountInputHandle, AmountInputProps>(
  ({ value, onChangeText, type = 'expense', autoFocus = false }, ref) => {
    const theme = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);

    const settings = useStore((state) => state.settings);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    useEffect(() => {
      if (!autoFocus) return;
      // En Android el teclado a veces no se abre si se enfoca justo al montar
      // la pantalla (todavía en transición de navegación); un pequeño delay
      // lo hace fiable en ambas plataformas.
      const delay = Platform.OS === 'android' ? 150 : 0;
      const timer = setTimeout(() => inputRef.current?.focus(), delay);
      return () => clearTimeout(timer);
    }, [autoFocus]);

    const colorStyle =
      type === 'income'
        ? styles.incomeText
        : type === 'transfer'
        ? styles.transferText
        : styles.expenseText;

    const handleChange = (text: string) => {
      // Allow only numbers, comma, and dot
      const cleaned = text.replace(/[^0-9.,]/g, '');
      // Replace comma with dot for consistency
      const normalized = cleaned.replace(',', '.');
      // Prevent multiple dots
      const parts = normalized.split('.');
      if (parts.length > 2) {
        return;
      }
      // Limit decimal places to 2
      if (parts[1] && parts[1].length > 2) {
        return;
      }
      onChangeText(cleaned);
    };

    return (
      <View style={styles.container}>
        <Text
          style={[styles.currency, isFocused && styles.currencyFocused, colorStyle]}
        >
          {settings.currencySymbol}
        </Text>
        <TextInput
          ref={inputRef}
          style={[styles.input, colorStyle]}
          value={value}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0,00"
          placeholderTextColor={theme.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={
            type === 'income' ? theme.income : type === 'transfer' ? theme.primary : theme.expense
          }
        />
      </View>
    );
  }
);

AmountInput.displayName = 'AmountInput';

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  currency: {
    fontSize: 36,
    fontWeight: '300',
    marginRight: 8,
    color: theme.textSecondary,
  },
  currencyFocused: {
    opacity: 1,
  },
  input: {
    fontSize: 48,
    fontWeight: '800',
    minWidth: 100,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  expenseText: {
    color: theme.expense,
  },
  incomeText: {
    color: theme.income,
  },
  transferText: {
    color: theme.primary,
  },
});
