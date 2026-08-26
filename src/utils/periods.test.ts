import { getPeriodRange, shiftPeriod, formatPeriodLabel } from './periods';

describe('getPeriodRange', () => {
  it('returns the Monday-Sunday range for a week that stays within one month', () => {
    // 2026-08-31 es lunes; la semana completa (lun-dom) no cruza de mes.
    const { start, end } = getPeriodRange('week', new Date(2026, 7, 20)); // jueves 20 ago 2026
    expect(start).toEqual(new Date(2026, 7, 17, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 7, 23, 23, 59, 59, 999));
  });

  it('returns a week range that crosses a month boundary', () => {
    // Semana del 2026-09-02 (miércoles): lunes 31 ago - domingo 6 sep.
    const { start, end } = getPeriodRange('week', new Date(2026, 8, 2));
    expect(start).toEqual(new Date(2026, 7, 31, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 8, 6, 23, 59, 59, 999));
  });

  it('returns a week range that crosses a year boundary', () => {
    // Semana del 2026-12-30 (miércoles): lunes 28 dic 2026 - domingo 3 ene 2027.
    const { start, end } = getPeriodRange('week', new Date(2026, 11, 30));
    expect(start).toEqual(new Date(2026, 11, 28, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2027, 0, 3, 23, 59, 59, 999));
  });

  it('anchors a week on itself when refDate falls on a Sunday', () => {
    // 2026-08-23 es domingo: la semana debe seguir siendo 17-23 ago.
    const { start, end } = getPeriodRange('week', new Date(2026, 7, 23));
    expect(start).toEqual(new Date(2026, 7, 17, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 7, 23, 23, 59, 59, 999));
  });

  it('returns the natural month range, clamping the end to the real last day', () => {
    const feb2026 = getPeriodRange('month', new Date(2026, 1, 10)); // febrero no bisiesto: 28 días
    expect(feb2026.start).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
    expect(feb2026.end).toEqual(new Date(2026, 1, 28, 23, 59, 59, 999));

    const feb2024 = getPeriodRange('month', new Date(2024, 1, 10)); // 2024 es bisiesto: 29 días
    expect(feb2024.end).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));
  });

  it('returns the natural quarter range', () => {
    const q3 = getPeriodRange('quarter', new Date(2026, 7, 15)); // agosto -> T3 (jul-sep)
    expect(q3.start).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0));
    expect(q3.end).toEqual(new Date(2026, 8, 30, 23, 59, 59, 999));

    const q1 = getPeriodRange('quarter', new Date(2026, 0, 5)); // enero -> T1 (ene-mar)
    expect(q1.start).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
    expect(q1.end).toEqual(new Date(2026, 2, 31, 23, 59, 59, 999));
  });

  it('returns the natural year range', () => {
    const { start, end } = getPeriodRange('year', new Date(2026, 5, 1));
    expect(start).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
  });
});

describe('shiftPeriod', () => {
  it('moves a week anchor forward and backward by 7 days', () => {
    const anchor = new Date(2026, 7, 20); // dentro de la semana 17-23 ago
    expect(shiftPeriod('week', anchor, 1)).toEqual(new Date(2026, 7, 24, 0, 0, 0, 0));
    expect(shiftPeriod('week', anchor, -1)).toEqual(new Date(2026, 7, 10, 0, 0, 0, 0));
  });

  it('clamps correctly when shifting a month anchored on a day that does not exist in the target month', () => {
    // 31 de enero + 1 mes: sumar directamente con setMonth desbordaría a marzo
    // (el día 31 no existe en febrero). shiftPeriod ancla al día 1 del mes destino.
    const jan31 = new Date(2026, 0, 31);
    expect(shiftPeriod('month', jan31, 1)).toEqual(new Date(2026, 1, 1));
    expect(shiftPeriod('month', jan31, -1)).toEqual(new Date(2025, 11, 1));
  });

  it('moves a quarter anchor forward and backward by 3 months, wrapping the year', () => {
    const q4 = new Date(2026, 10, 15); // T4 2026
    expect(shiftPeriod('quarter', q4, 1)).toEqual(new Date(2027, 0, 1));
    expect(shiftPeriod('quarter', q4, -1)).toEqual(new Date(2026, 6, 1));
  });

  it('moves a year anchor forward and backward by 1 year', () => {
    const anchor = new Date(2026, 5, 1);
    expect(shiftPeriod('year', anchor, 1)).toEqual(new Date(2027, 0, 1));
    expect(shiftPeriod('year', anchor, -1)).toEqual(new Date(2025, 0, 1));
  });
});

describe('formatPeriodLabel', () => {
  it('formats a week that stays within one month', () => {
    expect(formatPeriodLabel('week', new Date(2026, 7, 20), 'es-ES')).toBe('17–23 ago');
  });

  it('formats a week that crosses a month boundary', () => {
    // El CLDR de es-ES abrevia septiembre como "sept" (no "sep").
    expect(formatPeriodLabel('week', new Date(2026, 8, 2), 'es-ES')).toBe('31 ago – 6 sept');
  });

  it('formats a week that crosses a year boundary, including both years', () => {
    expect(formatPeriodLabel('week', new Date(2026, 11, 30), 'es-ES')).toBe(
      '28 dic 2026 – 3 ene 2027'
    );
  });

  it('formats the month label in Spanish and English', () => {
    expect(formatPeriodLabel('month', new Date(2026, 7, 1), 'es-ES')).toBe('Agosto 2026');
    expect(formatPeriodLabel('month', new Date(2026, 7, 1), 'en-US')).toBe('August 2026');
  });

  it('formats the quarter label with the locale-specific prefix', () => {
    expect(formatPeriodLabel('quarter', new Date(2026, 7, 1), 'es-ES')).toBe('T3 2026');
    expect(formatPeriodLabel('quarter', new Date(2026, 7, 1), 'en-US')).toBe('Q3 2026');
  });

  it('formats the year label the same regardless of locale', () => {
    expect(formatPeriodLabel('year', new Date(2026, 7, 1), 'es-ES')).toBe('2026');
    expect(formatPeriodLabel('year', new Date(2026, 7, 1), 'en-US')).toBe('2026');
  });
});
