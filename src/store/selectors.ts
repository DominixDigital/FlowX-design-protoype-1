import { TODAY } from '../data/fixtures';
import type { ID } from '../data/types';
import type { DB } from './store';

export const athleteById = (db: DB, id: ID | null | undefined) => db.athletes.find((a) => a.id === id);
export const coachById = (db: DB, id: ID | null | undefined) => db.coaches.find((c) => c.id === id);
export const personById = (db: DB, id: ID | null | undefined) => db.people.find((p) => p.id === id);
export const batchById = (db: DB, id: ID | null | undefined) => db.batches.find((b) => b.id === id);
export const areaById = (db: DB, id: ID | null | undefined) => db.areas.find((a) => a.id === id);
export const sessionById = (db: DB, id: ID | null | undefined) => db.sessions.find((s) => s.id === id);
export const locationName = (db: DB, id: ID) =>
  db.academies.flatMap((a) => a.locations).find((l) => l.id === id)?.name ?? 'Unknown location';

export const goalsForArea = (db: DB, areaId: ID) => db.goals.filter((g) => g.areaId === areaId);

/** The athlete's current focus: the highest-priority active development area and its active goal. */
export function currentFocus(db: DB, athleteId: ID) {
  const order = { high: 0, normal: 1, low: 2 } as const;
  const area = db.areas
    .filter((a) => a.athleteId === athleteId && (a.status === 'active' || a.status === 'reopened'))
    .sort((a, b) => order[a.priority] - order[b.priority])[0];
  const goal = area ? db.goals.find((g) => g.areaId === area.id && g.status === 'active') : undefined;
  return { area, goal };
}

/** Attendance computed from recorded sessions only — never invented. */
export function attendanceFor(db: DB, athleteId: ID) {
  const relevant = db.sessions.filter((s) => s.status === 'completed' && s.attendance[athleteId] && s.attendance[athleteId] !== 'unmarked');
  const present = relevant.filter((s) => s.attendance[athleteId] === 'present').length;
  return { present, total: relevant.length, rate: relevant.length ? Math.round((present / relevant.length) * 100) : null, sessions: relevant };
}

export const observationsFor = (db: DB, athleteId: ID) =>
  db.observations.filter((o) => o.athleteId === athleteId && o.status === 'saved').sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const lastSessionFor = (db: DB, athleteId: ID) =>
  db.sessions
    .filter((s) => s.status === 'completed' && s.attendance[athleteId] === 'present')
    .sort((a, b) => b.date.localeCompare(a.date))[0];

export const daysBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);

export const daysUntil = (date: string) => daysBetween(TODAY, date.slice(0, 10));

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat('en-GB', opts).format(new Date(iso.length === 10 ? `${iso}T12:00` : iso));
}

export function relDay(iso: string) {
  const d = daysUntil(iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d < 0) return `${-d} days ago`;
  return `In ${d} days`;
}

export const fmtTime = (secs: number) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

export const initials = (name: string) =>
  name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export function ageOn(born: string, on = TODAY) {
  const b = new Date(born);
  const o = new Date(on);
  let age = o.getFullYear() - b.getFullYear();
  if (o.getMonth() < b.getMonth() || (o.getMonth() === b.getMonth() && o.getDate() < b.getDate())) age -= 1;
  return age;
}

/** Shared timeline used by the passport, coach context, parent and athlete progress — filtered by audience (XS02). */
export type TimelineItem = {
  id: string;
  date: string;
  kind: 'observation' | 'milestone' | 'reassessment' | 'video' | 'area' | 'report' | 'session';
  title: string;
  detail?: string;
  audience: 'internal' | 'family';
};

export function timelineFor(db: DB, athleteId: ID, audience: 'internal' | 'family'): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const o of observationsFor(db, athleteId))
    items.push({ id: o.id, date: o.createdAt, kind: 'observation', title: 'Coach observation', detail: o.text, audience: 'internal' });
  for (const m of db.milestones.filter((m) => m.athleteId === athleteId))
    items.push({ id: m.id, date: m.date, kind: 'milestone', title: m.title, audience: m.visibleToFamily ? 'family' : 'internal' });
  for (const r of db.reassessments.filter((r) => r.athleteId === athleteId && (r.status === 'approved' || r.status === 'submitted')))
    items.push({ id: r.id, date: r.submittedAt ?? r.due, kind: 'reassessment', title: `Reassessed: ${areaById(db, r.areaId)?.title ?? ''}`, detail: r.note, audience: r.status === 'approved' ? 'family' : 'internal' });
  for (const a of db.areas.filter((a) => a.athleteId === athleteId)) {
    items.push({ id: a.id, date: a.openedAt, kind: 'area', title: `New focus: ${a.title}`, audience: 'family' });
  }
  for (const v of db.videos.filter((v) => v.athleteId === athleteId))
    items.push({ id: v.id, date: v.capturedAt, kind: 'video', title: v.title, audience: v.share === 'shared' ? 'family' : 'internal' });
  for (const r of db.reports.filter((r) => r.athleteId === athleteId && r.publishedAt))
    items.push({ id: r.id, date: r.publishedAt!, kind: 'report', title: `${r.period} report published`, audience: 'family' });
  return items
    .filter((i) => audience === 'internal' || i.audience === 'family')
    .sort((a, b) => b.date.localeCompare(a.date));
}
