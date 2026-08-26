import {
  computeInvestmentReturn,
  getTotalContributed,
  hasInvestmentValue,
  getInvestmentDisplayValue,
} from './investments';
import { Investment } from '../types';

const makeInvestment = (overrides: Partial<Investment> = {}): Investment => ({
  id: 'i1',
  name: 'Fondo',
  type: 'fund',
  contributions: [],
  valueHistory: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('computeInvestmentReturn', () => {
  it('calcula beneficio positivo (fondo con 50.000 € aportados que hoy vale 65.000 €)', () => {
    expect(computeInvestmentReturn(50000, 65000)).toEqual({ gain: 15000, percent: 30 });
  });

  it('calcula beneficio negativo', () => {
    expect(computeInvestmentReturn(1000, 800)).toEqual({ gain: -200, percent: -20 });
  });

  it('devuelve percent null cuando lo aportado es 0 (evita +∞%)', () => {
    const result = computeInvestmentReturn(0, 500);
    expect(result.percent).toBeNull();
    expect(result.gain).toBe(500);
  });

  it('devuelve gain y percent null cuando no hay ningún valor registrado', () => {
    expect(computeInvestmentReturn(50000, undefined)).toEqual({ gain: null, percent: null });
  });

  it('sin ganancia ni pérdida (valor = aportado)', () => {
    expect(computeInvestmentReturn(1000, 1000)).toEqual({ gain: 0, percent: 0 });
  });
});

describe('getTotalContributed', () => {
  it('suma todas las aportaciones', () => {
    const investment = makeInvestment({
      contributions: [
        { id: 'c1', amount: 50000, date: '2020-01-01' },
        { id: 'c2', amount: 1000, date: '2021-01-01' },
      ],
    });
    expect(getTotalContributed(investment)).toBe(51000);
  });

  it('devuelve 0 sin aportaciones', () => {
    expect(getTotalContributed(makeInvestment())).toBe(0);
  });
});

describe('hasInvestmentValue', () => {
  it('false cuando no hay valueHistory ni currentValue', () => {
    expect(hasInvestmentValue(makeInvestment())).toBe(false);
  });

  it('true cuando hay valueHistory', () => {
    const investment = makeInvestment({
      valueHistory: [{ id: 'v1', value: 65000, date: '2026-01-01' }],
    });
    expect(hasInvestmentValue(investment)).toBe(true);
  });

  it('true cuando hay currentValue en caché', () => {
    expect(hasInvestmentValue(makeInvestment({ currentValue: 65000 }))).toBe(true);
  });
});

describe('getInvestmentDisplayValue', () => {
  it('usa el valor actual cuando existe', () => {
    const investment = makeInvestment({
      contributions: [{ id: 'c1', amount: 50000, date: '2020-01-01' }],
      valueHistory: [{ id: 'v1', value: 65000, date: '2026-01-01' }],
    });
    expect(getInvestmentDisplayValue(investment)).toBe(65000);
  });

  it('cae en lo aportado cuando no hay valor registrado', () => {
    const investment = makeInvestment({
      contributions: [{ id: 'c1', amount: 50000, date: '2020-01-01' }],
    });
    expect(getInvestmentDisplayValue(investment)).toBe(50000);
  });
});
