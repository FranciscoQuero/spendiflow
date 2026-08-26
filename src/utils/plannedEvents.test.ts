import { groupPlannedEvents, getUpcomingPlannedEvents } from './plannedEvents';
import { PlannedEvent } from '../types';

const makeEvent = (overrides: Partial<PlannedEvent>): PlannedEvent => ({
  id: overrides.id ?? Math.random().toString(36),
  name: overrides.name ?? 'Evento',
  date: overrides.date ?? '2026-08-26T00:00:00.000Z',
  done: overrides.done ?? false,
  createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const REFERENCE = new Date('2026-08-26T12:00:00.000Z');

describe('groupPlannedEvents', () => {
  it('separates pending events into overdue and upcoming based on the reference date', () => {
    const past = makeEvent({ id: 'past', date: '2026-08-01T00:00:00.000Z' });
    const today = makeEvent({ id: 'today', date: '2026-08-26T18:00:00.000Z' });
    const future = makeEvent({ id: 'future', date: '2026-09-10T00:00:00.000Z' });

    const result = groupPlannedEvents([past, today, future], REFERENCE);

    expect(result.overdue.map((e) => e.id)).toEqual(['past']);
    expect(result.upcoming.map((e) => e.id)).toEqual(['today', 'future']);
    expect(result.completed).toEqual([]);
  });

  it('puts done events in completed regardless of date, and excludes them from overdue/upcoming', () => {
    const doneInPast = makeEvent({
      id: 'done-past',
      date: '2026-01-01T00:00:00.000Z',
      done: true,
    });
    const doneInFuture = makeEvent({
      id: 'done-future',
      date: '2026-12-01T00:00:00.000Z',
      done: true,
    });

    const result = groupPlannedEvents([doneInPast, doneInFuture], REFERENCE);

    expect(result.overdue).toEqual([]);
    expect(result.upcoming).toEqual([]);
    // Most recent date first
    expect(result.completed.map((e) => e.id)).toEqual(['done-future', 'done-past']);
  });

  it('sorts overdue and upcoming ascending by date', () => {
    const a = makeEvent({ id: 'a', date: '2026-08-20T00:00:00.000Z' });
    const b = makeEvent({ id: 'b', date: '2026-08-10T00:00:00.000Z' });
    const c = makeEvent({ id: 'c', date: '2026-09-15T00:00:00.000Z' });
    const d = makeEvent({ id: 'd', date: '2026-09-01T00:00:00.000Z' });

    const result = groupPlannedEvents([a, b, c, d], REFERENCE);

    expect(result.overdue.map((e) => e.id)).toEqual(['b', 'a']);
    expect(result.upcoming.map((e) => e.id)).toEqual(['d', 'c']);
  });

  it('returns empty groups for an empty input', () => {
    const result = groupPlannedEvents([], REFERENCE);
    expect(result).toEqual({ overdue: [], upcoming: [], completed: [] });
  });
});

describe('getUpcomingPlannedEvents', () => {
  it('always includes overdue events regardless of the window', () => {
    const overdue = makeEvent({ id: 'overdue', date: '2020-01-01T00:00:00.000Z' });
    const result = getUpcomingPlannedEvents([overdue], REFERENCE, 30);
    expect(result.map((e) => e.id)).toEqual(['overdue']);
  });

  it('includes upcoming events within the window and excludes those beyond it', () => {
    const within = makeEvent({ id: 'within', date: '2026-09-10T00:00:00.000Z' }); // +15d
    const beyond = makeEvent({ id: 'beyond', date: '2026-12-01T00:00:00.000Z' });

    const result = getUpcomingPlannedEvents([within, beyond], REFERENCE, 30);

    expect(result.map((e) => e.id)).toEqual(['within']);
  });

  it('orders overdue before upcoming, each ascending by date', () => {
    const overdue = makeEvent({ id: 'overdue', date: '2026-08-01T00:00:00.000Z' });
    const soon = makeEvent({ id: 'soon', date: '2026-08-27T00:00:00.000Z' });
    const later = makeEvent({ id: 'later', date: '2026-09-05T00:00:00.000Z' });

    const result = getUpcomingPlannedEvents([later, overdue, soon], REFERENCE, 30);

    expect(result.map((e) => e.id)).toEqual(['overdue', 'soon', 'later']);
  });

  it('excludes completed events', () => {
    const done = makeEvent({ id: 'done', date: '2026-08-27T00:00:00.000Z', done: true });
    const result = getUpcomingPlannedEvents([done], REFERENCE, 30);
    expect(result).toEqual([]);
  });

  it('respects the default 30-day window', () => {
    const day29 = makeEvent({ id: 'day29', date: '2026-09-24T12:00:00.000Z' });
    const day31 = makeEvent({ id: 'day31', date: '2026-09-27T00:00:00.000Z' });

    const result = getUpcomingPlannedEvents([day29, day31], REFERENCE);

    expect(result.map((e) => e.id)).toEqual(['day29']);
  });
});
