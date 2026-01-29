// Spendiflow Color Theme

export const colors = {
  // Primary Colors
  primary: '#3B82F6', // Blue
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',

  // Semantic Colors
  income: '#10B981', // Green for income
  incomeLight: '#34D399',
  incomeDark: '#059669',

  expense: '#EF4444', // Red for expenses
  expenseLight: '#F87171',
  expenseDark: '#DC2626',

  // Neutral Colors
  background: '#F9FAFB',
  backgroundDark: '#111827',

  card: '#FFFFFF',
  cardDark: '#1F2937',

  text: '#111827',
  textDark: '#F9FAFB',

  textSecondary: '#6B7280',
  textSecondaryDark: '#9CA3AF',

  border: '#E5E7EB',
  borderDark: '#374151',

  // Category Colors (matching Excel)
  categoryColors: {
    casa: '#3B82F6',      // Blue - CASA (38.9%)
    comida: '#F97316',    // Orange - COMIDA (20.6%)
    suscripciones: '#8B5CF6', // Purple - SUSCRIPCIONES
    ocio: '#EAB308',      // Yellow - OCIO (12.3%)
    otros: '#6B7280',     // Gray - OTROS (19.0%)
    viajes: '#10B981',    // Green - VIAJES (7.6%)
  },

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
} as const;

export const lightTheme = {
  background: colors.background,
  card: colors.card,
  text: colors.text,
  textSecondary: colors.textSecondary,
  border: colors.border,
  primary: colors.primary,
  income: colors.income,
  expense: colors.expense,
};

export const darkTheme = {
  background: colors.backgroundDark,
  card: colors.cardDark,
  text: colors.textDark,
  textSecondary: colors.textSecondaryDark,
  border: colors.borderDark,
  primary: colors.primary,
  income: colors.income,
  expense: colors.expense,
};

export type Theme = typeof lightTheme;
