import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { useStore } from '../store/useStore';

interface AmountInputProps {
  value: string;
  onChangeText: (value: string) => void;
  type?: 'expense' | 'income' | 'transfer';
  autoFocus?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChangeText,
  type = 'expense',
  autoFocus = false,
}) => {
  const settings = useStore((state) => state.settings);
  const [isFocused, setIsFocused] = useState(false);
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
        style={[styles.input, colorStyle]}
        value={value}
        onChangeText={handleChange}
        keyboardType="decimal-pad"
        placeholder="0,00"
        placeholderTextColor={colors.textSecondary}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        selectionColor={
          type === 'income' ? colors.income : type === 'transfer' ? colors.primary : colors.expense
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: colors.textSecondary,
  },
  currencyFocused: {
    opacity: 1,
  },
  input: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  expenseText: {
    color: colors.expense,
  },
  incomeText: {
    color: colors.income,
  },
  transferText: {
    color: colors.primary,
  },
});
