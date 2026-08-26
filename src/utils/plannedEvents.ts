import { PlannedEvent } from '../types';

export interface GroupedPlannedEvents {
  /** Fecha pasada y sin marcar como hecho. Orden ascendente (más antiguo primero). */
  overdue: PlannedEvent[];
  /** Fecha de hoy o futura y sin marcar como hecho. Orden ascendente. */
  upcoming: PlannedEvent[];
  /** Marcados como hechos, sin importar la fecha. Más reciente primero. */
  completed: PlannedEvent[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Agrupa los eventos planificados del calendario financiero en tres bloques:
 * vencidos (pendientes con fecha ya pasada), próximos (pendientes con fecha
 * de hoy o futura) y completados. Función pura para poder testearla sin
 * pasar por el store.
 */
export const groupPlannedEvents = (
  events: PlannedEvent[],
  referenceDate: Date = new Date()
): GroupedPlannedEvents => {
  const refTime = referenceDate.getTime();
  const pending = events.filter((e) => !e.done);
  const done = events.filter((e) => e.done);

  const overdue = pending
    .filter((e) => new Date(e.date).getTime() < refTime)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcoming = pending
    .filter((e) => new Date(e.date).getTime() >= refTime)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completed = [...done].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return { overdue, upcoming, completed };
};

/**
 * Eventos a destacar en la Home: vencidos (siempre) y próximos dentro de una
 * ventana de `windowDays` días, ordenados por fecha ascendente con los
 * vencidos primero. Pensada para alimentar la card "Próximos vencimientos".
 */
export const getUpcomingPlannedEvents = (
  events: PlannedEvent[],
  referenceDate: Date = new Date(),
  windowDays: number = 30
): PlannedEvent[] => {
  const { overdue, upcoming } = groupPlannedEvents(events, referenceDate);
  const windowEnd = referenceDate.getTime() + windowDays * DAY_MS;
  const upcomingInWindow = upcoming.filter(
    (e) => new Date(e.date).getTime() <= windowEnd
  );
  return [...overdue, ...upcomingInWindow];
};
