import { RecurrenceFrequency } from '../types';

const daysInMonth = (year: number, monthIndex0: number): number => {
  // Día 0 del mes siguiente = último día del mes `monthIndex0` (ambos en UTC, 0-indexado)
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
};

/**
 * Avanza una fecha ISO según la frecuencia indicada.
 * Para 'monthly' | 'quarterly' | 'yearly' conserva el día del mes original,
 * haciendo clamp a fin de mes cuando el mes destino tiene menos días
 * (ej. 31 ene + 1 mes = 28/29 feb).
 */
export const advanceDate = (iso: string, frequency: RecurrenceFrequency): string => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date passed to advanceDate: ${iso}`);
  }

  if (frequency === 'weekly') {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + 7);
    return result.toISOString();
  }

  const monthsToAdd = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : 12;

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonthTotal = month + monthsToAdd;
  const targetYear = year + Math.floor(targetMonthTotal / 12);
  const targetMonth = ((targetMonthTotal % 12) + 12) % 12;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));

  const result = new Date(date);
  result.setUTCFullYear(targetYear, targetMonth, targetDay);
  return result.toISOString();
};
