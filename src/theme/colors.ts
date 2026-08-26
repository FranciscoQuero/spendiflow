// Spendiflow Color Theme

export const colors = {
  // Primary Colors
  primary: '#3B82F6', // Blue
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',

  // Semantic Colors (used as-is in dark mode, where they already read well
  // against the dark surfaces)
  income: '#10B981', // Green for income
  incomeLight: '#34D399',
  incomeDark: '#059669',

  expense: '#EF4444', // Red for expenses
  expenseLight: '#F87171',
  expenseDark: '#DC2626',

  // Deeper, less saturated income/expense used on light backgrounds: the
  // vivid defaults above read a little harsh on white/near-white surfaces.
  incomeMuted: '#0D9668',
  expenseMuted: '#DC2626',

  // Neutral Colors. Light background carries a faint cool tint instead of
  // flat gray so cards (pure white) have something to sit on top of.
  background: '#F4F5FA',
  backgroundDark: '#111827',

  card: '#FFFFFF',
  cardDark: '#1F2937',

  text: '#111827',
  textDark: '#F9FAFB',

  // Darkened slightly from the original #6B7280 for a stronger AA contrast
  // ratio against white cards while staying clearly secondary to `text`.
  textSecondary: '#5C6470',
  textSecondaryDark: '#9CA3AF',

  // Hairline border, tuned to pair with the new tinted background.
  border: '#E4E7F0',
  borderDark: '#374151',

  // Soft primary-tinted surface reserved for the app's "hero" card (the
  // Home monthly summary), so it reads as elevated over neutral cards.
  surfaceTint: '#EAF1FE',
  surfaceTintDark: '#17233C',

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
  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
} as const;

interface CategoryColorsShape {
  casa: string;
  comida: string;
  suscripciones: string;
  ocio: string;
  otros: string;
  viajes: string;
}

interface ThemeShape {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
  /** Fondo tintado del primario, reservado para la card "héroe" (resumen del mes en Inicio). */
  surfaceTint: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  income: string;
  incomeLight: string;
  incomeDark: string;
  expense: string;
  expenseLight: string;
  expenseDark: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  categoryColors: CategoryColorsShape;
}

export const lightTheme: ThemeShape = {
  // Neutral / surface colors (vary between light and dark)
  background: colors.background,
  card: colors.card,
  text: colors.text,
  textSecondary: colors.textSecondary,
  border: colors.border,
  shadow: colors.shadow,
  surfaceTint: colors.surfaceTint,

  // Accent / semantic colors. income/expense use the deeper "muted" tones
  // here: the vivid defaults read as too neon against white cards.
  primary: colors.primary,
  primaryLight: colors.primaryLight,
  primaryDark: colors.primaryDark,
  income: colors.incomeMuted,
  incomeLight: colors.incomeLight,
  incomeDark: colors.incomeDark,
  expense: colors.expenseMuted,
  expenseLight: colors.expenseLight,
  expenseDark: colors.expenseDark,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  categoryColors: colors.categoryColors,
};

export const darkTheme: ThemeShape = {
  // Neutral / surface colors: dark backgrounds, light text, softer shadow
  background: colors.backgroundDark,
  card: colors.cardDark,
  text: colors.textDark,
  textSecondary: colors.textSecondaryDark,
  border: colors.borderDark,
  shadow: colors.shadowDark,
  surfaceTint: colors.surfaceTintDark,

  // Accent / semantic colors: same vivid accents as before, unchanged —
  // they already carry enough contrast against the dark surfaces above.
  primary: colors.primary,
  primaryLight: colors.primaryLight,
  primaryDark: colors.primaryDark,
  income: colors.income,
  incomeLight: colors.incomeLight,
  incomeDark: colors.incomeDark,
  expense: colors.expense,
  expenseLight: colors.expenseLight,
  expenseDark: colors.expenseDark,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  categoryColors: colors.categoryColors,
};

export type Theme = ThemeShape;

/** Convierte un color hexadecimal ('#RRGGBB') a una cadena rgba() con la opacidad dada. */
export const hexToRgba = (hex: string, opacity: number): string => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
