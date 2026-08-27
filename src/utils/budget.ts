// Presupuesto mensual: lógica pura de progreso, sin dependencias del store.

import { Transaction, Category, CategoryBudget } from '../types';

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

/**
 * Suma de gastos personales (`scope: 'personal'`) del mes/año dados para una
 * categoría. Con `subcategoryId` presente, solo cuenta esa subcategoría
 * concreta; sin él, cuenta toda la categoría (todas sus subcategorías
 * incluidas). Función pura, exportada para poder testearla sin pasar por el
 * store.
 */
export const computeCategorySpending = (
  transactions: Transaction[],
  month: number,
  year: number,
  categoryId: string,
  subcategoryId?: string
): number =>
  transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.scope === 'personal' &&
        t.month === month &&
        t.year === year &&
        t.categoryId === categoryId &&
        (subcategoryId === undefined || t.subcategoryId === subcategoryId)
    )
    .reduce((sum, t) => sum + t.amount, 0);

export interface BudgetLine {
  budget: CategoryBudget;
  categoryName: string;
  categoryNameEn: string;
  categoryColor: string;
  categoryIcon: string;
  /** Presente solo si el presupuesto es de una subcategoría concreta. */
  subcategoryName?: string;
  subcategoryNameEn?: string;
  spent: number;
  progress: BudgetProgress;
}

/**
 * Construye una línea de seguimiento por cada presupuesto de categoría:
 * lo gastado en el mes/año dados y su progreso (reutilizando
 * `computeBudgetProgress` con el día/días del mes recibidos, igual que hace
 * el presupuesto global). Los presupuestos que apunten a una categoría ya
 * borrada se descartan en vez de romper. Función pura, exportada para poder
 * testearla sin pasar por el store.
 */
export const computeBudgetLines = (
  budgets: CategoryBudget[],
  categories: Category[],
  transactions: Transaction[],
  month: number,
  year: number,
  dayOfMonth: number,
  daysInMonth: number
): BudgetLine[] =>
  budgets.reduce<BudgetLine[]>((lines, budget) => {
    const category = categories.find((c) => c.id === budget.categoryId);
    if (!category) return lines;

    const subcategory = budget.subcategoryId
      ? category.subcategories.find((s) => s.id === budget.subcategoryId)
      : undefined;

    const spent = computeCategorySpending(
      transactions,
      month,
      year,
      budget.categoryId,
      budget.subcategoryId
    );

    lines.push({
      budget,
      categoryName: category.name,
      categoryNameEn: category.nameEn,
      categoryColor: category.color,
      categoryIcon: category.icon,
      subcategoryName: subcategory?.name,
      subcategoryNameEn: subcategory?.nameEn,
      spent,
      progress: computeBudgetProgress(spent, budget.amount, dayOfMonth, daysInMonth),
    });
    return lines;
  }, []);

/**
 * Gasto personal del mes/año dados NO cubierto por ningún presupuesto de
 * categoría o subcategoría: la cifra clave para distinguir "me pasé del
 * global por un imprevisto" de "incumplí un presupuesto específico".
 *
 * Un gasto cuenta como cubierto si su categoría tiene presupuesto de
 * categoría, o su subcategoría tiene presupuesto de subcategoría (basta con
 * estar cubierto por uno de los dos). Los gastos sin categoría nunca pueden
 * tener presupuesto, así que siempre cuentan como sin presupuestar.
 *
 * OJO: si una categoría tiene presupuesto de categoría Y una de sus
 * subcategorías tiene además presupuesto propio, el gasto de esa
 * subcategoría queda cubierto por ambos presupuestos a la vez. Esta función
 * evita el doble conteo (cuenta el gasto una sola vez como "cubierto"), pero
 * las líneas de `computeBudgetLines` para esos dos presupuestos SÍ pueden
 * solaparse entre sí — no deben sumarse para reconstruir un total.
 */
export const computeUnbudgetedSpending = (
  budgets: CategoryBudget[],
  transactions: Transaction[],
  month: number,
  year: number
): number => {
  const budgetedCategoryIds = new Set(
    budgets.filter((b) => !b.subcategoryId).map((b) => b.categoryId)
  );
  const budgetedSubcategoryIds = new Set(
    budgets.filter((b) => b.subcategoryId).map((b) => b.subcategoryId as string)
  );

  return transactions
    .filter(
      (t) =>
        t.type === 'expense' && t.scope === 'personal' && t.month === month && t.year === year
    )
    .filter((t) => {
      if (!t.categoryId) return true;
      const categoryCovered = budgetedCategoryIds.has(t.categoryId);
      const subcategoryCovered = !!t.subcategoryId && budgetedSubcategoryIds.has(t.subcategoryId);
      return !categoryCovered && !subcategoryCovered;
    })
    .reduce((sum, t) => sum + t.amount, 0);
};
