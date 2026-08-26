import { advanceDate } from './recurrence';

describe('advanceDate', () => {
  it('advances a normal month keeping the day', () => {
    const result = advanceDate('2026-03-15T10:00:00.000Z', 'monthly');
    expect(result).toBe('2026-04-15T10:00:00.000Z');
  });

  it('clamps to end of month when the target month is shorter (31 Jan -> Feb)', () => {
    const result = advanceDate('2026-01-31T00:00:00.000Z', 'monthly');
    // 2026 is not a leap year, so February has 28 days.
    expect(result).toBe('2026-02-28T00:00:00.000Z');
  });

  it('clamps to end of month on a leap year (31 Jan 2028 -> 29 Feb)', () => {
    const result = advanceDate('2028-01-31T00:00:00.000Z', 'monthly');
    expect(result).toBe('2028-02-29T00:00:00.000Z');
  });

  it('advances a quarter, clamping when needed (31 Jan -> 30 Apr)', () => {
    const result = advanceDate('2026-01-31T00:00:00.000Z', 'quarterly');
    expect(result).toBe('2026-04-30T00:00:00.000Z');
  });

  it('advances a year, preserving the day when possible', () => {
    const result = advanceDate('2026-06-10T00:00:00.000Z', 'yearly');
    expect(result).toBe('2027-06-10T00:00:00.000Z');
  });

  it('clamps a yearly advance from a leap day (29 Feb 2028 -> 28 Feb 2029)', () => {
    const result = advanceDate('2028-02-29T00:00:00.000Z', 'yearly');
    expect(result).toBe('2029-02-28T00:00:00.000Z');
  });

  it('advances a week by exactly 7 days', () => {
    const result = advanceDate('2026-08-26T12:00:00.000Z', 'weekly');
    expect(result).toBe('2026-09-02T12:00:00.000Z');
  });

  it('rolls over to the next year when advancing a month from December', () => {
    const result = advanceDate('2026-12-15T00:00:00.000Z', 'monthly');
    expect(result).toBe('2027-01-15T00:00:00.000Z');
  });

  it('throws on an invalid date', () => {
    expect(() => advanceDate('not-a-date', 'monthly')).toThrow();
  });
});
