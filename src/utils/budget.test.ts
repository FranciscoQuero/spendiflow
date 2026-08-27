import {
  computeBudgetProgress,
  computeCategorySpending,
  computeBudgetLines,
  computeUnbudgetedSpending,
} from './budget';
import { Transaction, Category, CategoryBudget } from '../types';

const category = (overrides: Partial<Category> = {}): Category => ({
  id: 'comida',
  name: 'Comida',
  nameEn: 'Food',
  color: '#F97316',
  icon: 'restaurant',
  type: 'expense',
  subcategories: [
    { id: 'super', name: 'Supermercado', nameEn: 'Groceries', categoryId: 'comida' },
    { id: 'comer-fuera', name: 'Comer fuera', nameEn: 'Eating out', categoryId: 'comida' },
  ],
  ...overrides,
});

const otrosCategory: Category = {
  id: 'otros',
  name: 'Otros',
  nameEn: 'Other',
  color: '#6B7280',
  icon: 'ellipsis-horizontal',
  type: 'expense',
  subcategories: [],
};

let txCounter = 0;
const tx = (overrides: Partial<Transaction> = {}): Transaction => {
  txCounter += 1;
  return {
    id: `tx-${txCounter}`,
    type: 'expense',
    amount: 100,
    concept: 'test',
    scope: 'personal',
    date: '2026-03-15T00:00:00.000Z',
    month: 3,
    year: 2026,
    createdAt: '2026-03-15T00:00:00.000Z',
    ...overrides,
  };
};

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

describe('computeCategorySpending', () => {
  it('sin subcategoryId: agrega todas las subcategorías de la categoría', () => {
    const transactions = [
      tx({ categoryId: 'comida', subcategoryId: 'super', amount: 60 }),
      tx({ categoryId: 'comida', subcategoryId: 'comer-fuera', amount: 40 }),
      tx({ categoryId: 'otros', amount: 999 }),
    ];
    expect(computeCategorySpending(transactions, 3, 2026, 'comida')).toBe(100);
  });

  it('con subcategoryId: solo esa subcategoría concreta', () => {
    const transactions = [
      tx({ categoryId: 'comida', subcategoryId: 'super', amount: 60 }),
      tx({ categoryId: 'comida', subcategoryId: 'comer-fuera', amount: 40 }),
    ];
    expect(computeCategorySpending(transactions, 3, 2026, 'comida', 'super')).toBe(60);
  });

  it('excluye scope business', () => {
    const transactions = [
      tx({ categoryId: 'comida', scope: 'business', amount: 500 }),
      tx({ categoryId: 'comida', scope: 'personal', amount: 30 }),
    ];
    expect(computeCategorySpending(transactions, 3, 2026, 'comida')).toBe(30);
  });

  it('excluye transferencias e ingresos', () => {
    const transactions = [
      tx({ type: 'transfer', categoryId: 'comida', amount: 500 }),
      tx({ type: 'income', categoryId: 'comida', amount: 500 }),
      tx({ type: 'expense', categoryId: 'comida', amount: 25 }),
    ];
    expect(computeCategorySpending(transactions, 3, 2026, 'comida')).toBe(25);
  });

  it('mes sin gastos: devuelve 0', () => {
    expect(computeCategorySpending([], 3, 2026, 'comida')).toBe(0);
  });
});

describe('computeBudgetLines', () => {
  const categories = [category(), otrosCategory];

  it('presupuesto de categoría (agregando subcategorías) y de subcategoría', () => {
    const budgets: CategoryBudget[] = [
      { id: 'b1', categoryId: 'otros', amount: 200, createdAt: '2026-01-01' },
      { id: 'b2', categoryId: 'comida', subcategoryId: 'super', amount: 150, createdAt: '2026-01-01' },
    ];
    const transactions = [
      tx({ categoryId: 'otros', amount: 50 }),
      tx({ categoryId: 'comida', subcategoryId: 'super', amount: 80 }),
      tx({ categoryId: 'comida', subcategoryId: 'comer-fuera', amount: 999 }),
    ];

    const lines = computeBudgetLines(budgets, categories, transactions, 3, 2026, 15, 30);

    expect(lines).toHaveLength(2);
    const otrosLine = lines.find((l) => l.budget.id === 'b1');
    expect(otrosLine?.spent).toBe(50);
    expect(otrosLine?.subcategoryName).toBeUndefined();

    const superLine = lines.find((l) => l.budget.id === 'b2');
    expect(superLine?.spent).toBe(80);
    expect(superLine?.subcategoryName).toBe('Supermercado');
    expect(superLine?.progress.pace).toBeDefined();
  });

  it('descarta presupuestos de categorías ya borradas', () => {
    const budgets: CategoryBudget[] = [
      { id: 'b1', categoryId: 'inexistente', amount: 100, createdAt: '2026-01-01' },
    ];
    expect(computeBudgetLines(budgets, categories, [], 3, 2026, 1, 30)).toEqual([]);
  });
});

describe('computeUnbudgetedSpending', () => {
  it('cuenta el gasto de categorías/subcategorías sin ningún presupuesto', () => {
    const budgets: CategoryBudget[] = [
      { id: 'b1', categoryId: 'comida', subcategoryId: 'super', amount: 100, createdAt: '2026-01-01' },
    ];
    const transactions = [
      tx({ categoryId: 'comida', subcategoryId: 'super', amount: 50 }), // cubierto
      tx({ categoryId: 'comida', subcategoryId: 'comer-fuera', amount: 30 }), // sin presupuestar
      tx({ categoryId: 'otros', amount: 20 }), // sin presupuestar
      tx({ categoryId: undefined, amount: 10 }), // sin categoría: nunca presupuestable
    ];
    expect(computeUnbudgetedSpending(budgets, transactions, 3, 2026)).toBe(60);
  });

  it('cobertura mixta (presupuesto de categoría Y de una de sus subcategorías) sin doble conteo', () => {
    const budgets: CategoryBudget[] = [
      { id: 'b1', categoryId: 'comida', amount: 300, createdAt: '2026-01-01' },
      { id: 'b2', categoryId: 'comida', subcategoryId: 'super', amount: 100, createdAt: '2026-01-01' },
    ];
    const transactions = [
      tx({ categoryId: 'comida', subcategoryId: 'super', amount: 50 }),
      tx({ categoryId: 'comida', subcategoryId: 'comer-fuera', amount: 30 }),
    ];
    // Ambos gastos están cubiertos (por el presupuesto de categoría, el de
    // 'super' además por el suyo propio): unbudgeted debe ser 0, sin sumar
    // el gasto de 'super' dos veces.
    expect(computeUnbudgetedSpending(budgets, transactions, 3, 2026)).toBe(0);
  });

  it('mes sin gastos: devuelve 0', () => {
    expect(computeUnbudgetedSpending([], [], 3, 2026)).toBe(0);
  });

  it('excluye scope business y transferencias', () => {
    const transactions = [
      tx({ categoryId: 'otros', scope: 'business', amount: 500 }),
      tx({ type: 'transfer', categoryId: 'otros', amount: 500 }),
      tx({ categoryId: 'otros', amount: 15 }),
    ];
    expect(computeUnbudgetedSpending([], transactions, 3, 2026)).toBe(15);
  });
});
