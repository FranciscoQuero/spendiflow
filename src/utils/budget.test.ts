import { computeBudgetProgress } from './budget';

describe('computeBudgetProgress', () => {
  it('al ritmo: % gastado igual al % del mes transcurrido', () => {
    // Día 15 de 30 (50% del mes) con la mitad del presupuesto gastada.
    const result = computeBudgetProgress(500, 1000, 15, 30);
    expect(result.ratio).toBeCloseTo(0.5);
    expect(result.pace).toBe('onTrack');
    expect(result.remaining).toBe(500);
  });

  it('al ritmo: % gastado por debajo del % del mes transcurrido', () => {
    const result = computeBudgetProgress(300, 1000, 20, 30);
    expect(result.pace).toBe('onTrack');
  });

  it('pasado de ritmo: % gastado supera el % del mes transcurrido pero no llega al 100%', () => {
    // Día 10 de 30 (~33% del mes) con el 80% del presupuesto ya gastado.
    const result = computeBudgetProgress(800, 1000, 10, 30);
    expect(result.ratio).toBeCloseTo(0.8);
    expect(result.pace).toBe('ahead');
    expect(result.remaining).toBe(200);
  });

  it('superado: el gasto llega o supera el presupuesto', () => {
    const result = computeBudgetProgress(1200, 1000, 25, 30);
    expect(result.ratio).toBeCloseTo(1.2);
    expect(result.pace).toBe('over');
    expect(result.remaining).toBe(-200);
  });

  it('superado exactamente al 100%', () => {
    const result = computeBudgetProgress(1000, 1000, 25, 30);
    expect(result.pace).toBe('over');
    expect(result.remaining).toBe(0);
  });

  it('mes recién empezado sin gasto: sigue al ritmo', () => {
    const result = computeBudgetProgress(0, 1000, 1, 31);
    expect(result.ratio).toBe(0);
    expect(result.pace).toBe('onTrack');
    expect(result.remaining).toBe(1000);
  });

  it('mes recién empezado con algo de gasto: puede ir pasado de ritmo', () => {
    // Día 1 de 31 (~3.2% del mes) con el 10% del presupuesto ya gastado.
    const result = computeBudgetProgress(100, 1000, 1, 31);
    expect(result.pace).toBe('ahead');
  });

  it('presupuesto undefined: progreso neutro, no lanza', () => {
    const result = computeBudgetProgress(500, undefined, 15, 30);
    expect(result).toEqual({ ratio: 0, pace: 'onTrack', remaining: 0 });
  });

  it('presupuesto 0: progreso neutro, no lanza', () => {
    const result = computeBudgetProgress(500, 0, 15, 30);
    expect(result).toEqual({ ratio: 0, pace: 'onTrack', remaining: 0 });
  });

  it('presupuesto negativo: progreso neutro, no lanza', () => {
    const result = computeBudgetProgress(500, -100, 15, 30);
    expect(result).toEqual({ ratio: 0, pace: 'onTrack', remaining: 0 });
  });
});
