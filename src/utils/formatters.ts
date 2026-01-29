// Utility functions for formatting

export const formatCurrency = (
  amount: number,
  currency: string = '€',
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + currency;
};

export const formatDate = (
  dateString: string,
  locale: string = 'es-ES',
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  }
): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, options);
};

export const formatDateLong = (
  dateString: string,
  locale: string = 'es-ES'
): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatRelativeDate = (
  dateString: string,
  todayLabel: string = 'Hoy',
  yesterdayLabel: string = 'Ayer'
): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return todayLabel;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return yesterdayLabel;
  }
  return formatDate(dateString);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getMonthName = (
  month: number,
  locale: string = 'es-ES',
  format: 'long' | 'short' = 'long'
): string => {
  const date = new Date(2024, month - 1, 1);
  return date.toLocaleDateString(locale, { month: format });
};

export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1;
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

export const getDateISO = (date: Date = new Date()): string => {
  return date.toISOString();
};

export const parseNumber = (value: string): number => {
  // Handle European format (comma as decimal separator)
  const normalized = value.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};
