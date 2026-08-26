import { ChartPeriod } from '../types';

export interface PeriodRange {
  /** Instante de inicio del período, hora local (00:00:00.000). */
  start: Date;
  /** Instante de fin del período, hora local (23:59:59.999), inclusive. */
  end: Date;
}

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/** Lunes (00:00, hora local) de la semana ISO (lunes-domingo) que contiene `date`. */
const startOfWeek = (date: Date): Date => {
  const day = startOfDay(date);
  const weekday = day.getDay(); // 0 (dom) .. 6 (sáb)
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  return addDays(day, diffToMonday);
};

const capitalize = (value: string): string =>
  value.length > 0 ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

/**
 * Rango [start, end] (ambos inclusive, hora local) del período de la
 * granularidad dada que contiene `refDate`:
 * - `week`: semana natural lunes-domingo.
 * - `month`: mes natural (usa día 0 del mes siguiente para obtener el
 *   último día real del mes de referencia, evitando dar por hecho 30/31).
 * - `quarter`: trimestre natural (ene-mar, abr-jun, jul-sep, oct-dic).
 * - `year`: año natural.
 *
 * Función pura: no depende del reloj del sistema ni de i18n.
 */
export const getPeriodRange = (period: ChartPeriod, refDate: Date): PeriodRange => {
  switch (period) {
    case 'week': {
      const start = startOfWeek(refDate);
      return { start, end: endOfDay(addDays(start, 6)) };
    }
    case 'month': {
      const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'quarter': {
      const quarterStartMonth = Math.floor(refDate.getMonth() / 3) * 3;
      const start = new Date(refDate.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
      const end = new Date(refDate.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'year': {
      const start = new Date(refDate.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(refDate.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }
};

/**
 * Ancla del período adyacente (`delta` = ±1, ±2...) a `refDate` para la
 * granularidad dada. Siempre devuelve el INICIO del período resultante en
 * lugar de desplazar el día de `refDate` directamente: sumar meses a un día
 * que no existe en el mes destino (p. ej. 31 de enero + 1 mes) desbordaría
 * al mes siguiente si se hiciera con `setMonth` sobre el día 31. Anclar al
 * inicio del período evita ese desbordamiento por construcción.
 */
export const shiftPeriod = (period: ChartPeriod, refDate: Date, delta: number): Date => {
  const { start } = getPeriodRange(period, refDate);
  switch (period) {
    case 'week':
      return addDays(start, delta * 7);
    case 'month':
      return new Date(start.getFullYear(), start.getMonth() + delta, 1);
    case 'quarter':
      return new Date(start.getFullYear(), start.getMonth() + delta * 3, 1);
    case 'year':
      return new Date(start.getFullYear() + delta, 0, 1);
  }
};

/**
 * Etiqueta legible del período de la granularidad dada que contiene
 * `refDate`, en el `locale` indicado ('es-ES', 'en-US'...):
 * - `week`: "23–29 ago" (o "31 ago – 6 sept" / "28 dic 2026 – 3 ene 2027" si
 *   la semana cruza mes o año).
 * - `month`: "Agosto 2026".
 * - `quarter`: "T3 2026" (es) / "Q3 2026" (en).
 * - `year`: "2026".
 */
export const formatPeriodLabel = (period: ChartPeriod, refDate: Date, locale: string): string => {
  const isSpanish = locale.toLowerCase().startsWith('es');

  switch (period) {
    case 'week': {
      const { start, end } = getPeriodRange('week', refDate);
      const startDay = start.getDate();
      const endDay = end.getDate();
      const startMonth = start.toLocaleDateString(locale, { month: 'short' });
      const endMonth = end.toLocaleDateString(locale, { month: 'short' });
      const sameYear = start.getFullYear() === end.getFullYear();
      const sameMonth = sameYear && start.getMonth() === end.getMonth();

      if (sameMonth) {
        return `${startDay}–${endDay} ${endMonth}`;
      }
      if (sameYear) {
        return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
      }
      return `${startDay} ${startMonth} ${start.getFullYear()} – ${endDay} ${endMonth} ${end.getFullYear()}`;
    }
    case 'month': {
      const monthName = refDate.toLocaleDateString(locale, { month: 'long' });
      return `${capitalize(monthName)} ${refDate.getFullYear()}`;
    }
    case 'quarter': {
      const quarterNumber = Math.floor(refDate.getMonth() / 3) + 1;
      const prefix = isSpanish ? 'T' : 'Q';
      return `${prefix}${quarterNumber} ${refDate.getFullYear()}`;
    }
    case 'year':
      return `${refDate.getFullYear()}`;
  }
};
