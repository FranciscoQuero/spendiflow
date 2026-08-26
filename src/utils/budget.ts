// Presupuesto mensual: lógica pura de progreso, sin dependencias del store.

export type BudgetPace = 'onTrack' | 'ahead' | 'over';

export interface BudgetProgress {
  /** Gastado / presupuesto. Puede superar 1 si el presupuesto está superado. */
  ratio: number;
  /**
   * 'onTrack': el % gastado va igual o por debajo del % del mes transcurrido.
   * 'ahead': el % gastado supera el % del mes transcurrido, pero no llega al 100%.
   * 'over': el presupuesto ya está superado (ratio >= 1).
   */
  pace: BudgetPace;
  /** Presupuesto - gastado. Negativo si el presupuesto está superado. */
  remaining: number;
}

/**
 * Calcula el progreso del presupuesto mensual a partir de lo gastado en el
 * mes en curso. Función pura, exportada para poder testearla sin pasar por
 * el store ni por componentes.
 *
 * Sin presupuesto configurado (undefined o <= 0) devuelve un progreso neutro
 * ({ ratio: 0, pace: 'onTrack', remaining: 0 }): la decisión de si mostrar
 * algo en pantalla la toma el componente comprobando `settings.monthlyBudget`.
 */
export const computeBudgetProgress = (
  spent: number,
  budget: number | undefined,
  dayOfMonth: number,
  daysInMonth: number
): BudgetProgress => {
  if (!budget || budget <= 0) {
    return { ratio: 0, pace: 'onTrack', remaining: 0 };
  }

  const ratio = spent / budget;
  const remaining = budget - spent;
  const elapsedRatio = daysInMonth > 0 ? Math.min(dayOfMonth / daysInMonth, 1) : 1;

  let pace: BudgetPace;
  if (ratio >= 1) {
    pace = 'over';
  } else if (ratio > elapsedRatio) {
    pace = 'ahead';
  } else {
    pace = 'onTrack';
  }

  return { ratio, pace, remaining };
};
