// Dit Score — PROTOTYPE information model.
//
// The concept, the candidate dimensions and the data each one needs are defined here.
// The weights and mappings below are ILLUSTRATIVE ONLY: they make the prototype navigable
// and must be replaced by a methodology validated with coaches and sports experts
// (see docs/05-dit-score-model.md). The UI labels every score "Illustrative".
//
// Principles enforced in code:
// - Only recorded or coach-approved data feeds the score; nothing is invented.
// - Self-reported data is weighted low and flagged.
// - Dimensions without data are shown as "not measured yet", never imputed.
// - Too little verified data → no score at all ("building your score").
// - Scores from different sports are never compared.

import type { DB } from '../store/store';
import type { ID, ReassessmentOutcome } from '../data/types';
import { TODAY } from '../data/fixtures';
import { ageOn, athleteById, daysBetween } from '../store/selectors';

export type DimensionKey = 'coach_progress' | 'consistency' | 'practice' | 'milestones' | 'skill' | 'performance';

export interface DimensionDef {
  key: DimensionKey;
  label: string;
  athleteLabel: string;
  parentLabel: string;
  question: string;
  source: string;
  trust: 'coach_approved' | 'recorded' | 'self_reported' | 'unavailable';
  /** Illustrative weight; null = not part of the prototype calculation */
  weight: number | null;
  needs?: string;
}

export const DIMENSIONS: DimensionDef[] = [
  {
    key: 'coach_progress', label: 'Coach-validated progress', athleteLabel: 'Progress your coach confirmed', parentLabel: 'Progress confirmed by the coach',
    question: 'Is the athlete moving forward on the things the coach is working on?',
    source: 'Approved reassessment outcomes and areas closed as achieved', trust: 'coach_approved', weight: 0.45,
  },
  {
    key: 'consistency', label: 'Training consistency', athleteLabel: 'Turning up', parentLabel: 'Coming to sessions',
    question: 'Does the athlete attend the sessions they are expected at?',
    source: 'Attendance recorded by coaches over the last 8 completed sessions', trust: 'recorded', weight: 0.3,
  },
  {
    key: 'practice', label: 'Practice commitment', athleteLabel: 'Practice at home', parentLabel: 'Practice between sessions',
    question: 'Is the athlete doing the drills their coach assigned?',
    source: 'Practice the athlete marks as done, against the assigned frequency (last 14 days)', trust: 'self_reported', weight: 0.1,
  },
  {
    key: 'milestones', label: 'Milestones', athleteLabel: 'Milestones', parentLabel: 'Milestones',
    question: 'Has the athlete reached coach-recognised milestones recently?',
    source: 'Milestones a coach recorded in the last 90 days', trust: 'coach_approved', weight: 0.15,
  },
  {
    key: 'skill', label: 'Skill development (measured)', athleteLabel: 'Skill tests', parentLabel: 'Skill tests',
    question: 'How do measured skills change over time?',
    source: 'Not available: needs a validated, sport-specific skills rubric', trust: 'unavailable', weight: null,
    needs: 'Sports experts to define skill tests per sport and age group',
  },
  {
    key: 'performance', label: 'Performance outcomes (measured)', athleteLabel: 'Match performance', parentLabel: 'Match performance',
    question: 'How does the athlete perform in matches?',
    source: 'Not available: no match statistics are captured in ditdit today', trust: 'unavailable', weight: null,
    needs: 'Match data capture and a fair way to weigh it by role and level',
  },
];

const OUTCOME_VALUE: Record<ReassessmentOutcome, number> = { needs_more_work: 40, improving: 65, on_track: 80, achieved: 100 };

export interface DimensionResult {
  def: DimensionDef;
  value: number | null;
  evidence: string[];
  count: number;
}

export type ScoreState =
  | { kind: 'scored'; value: number; dims: DimensionResult[]; asOf: string; coverage: number }
  | { kind: 'building'; dims: DimensionResult[]; asOf: string; missing: string[] }
  | { kind: 'paused'; note?: string; asOf: string }
  | { kind: 'disabled'; asOf: string };

const within = (date: string, asOf: string, days: number) => {
  const d = daysBetween(date.slice(0, 10), asOf);
  return d >= 0 && d <= days;
};

export function computeDitScore(db: DB, athleteId: ID, asOf: string = TODAY): ScoreState {
  if (!db.scoreSettings.enabled) return { kind: 'disabled', asOf };
  const review = db.scoreReviews.find((r) => r.athleteId === athleteId);
  if (review?.paused && asOf === TODAY) return { kind: 'paused', note: review.note, asOf };

  // Coach-validated progress: approved reassessments + areas achieved
  const approved = db.reassessments.filter((r) => r.athleteId === athleteId && r.status === 'approved' && r.outcome && (r.submittedAt ?? r.due).slice(0, 10) <= asOf);
  const achievedMs = db.milestones.filter((m) => m.athleteId === athleteId && m.date <= asOf && m.areaId);
  const activeAreas = db.areas.filter((a) => a.athleteId === athleteId && a.openedAt <= asOf && (a.status === 'active' || a.status === 'reopened'));
  const progressInputs = approved.map((r) => OUTCOME_VALUE[r.outcome!]);
  const coachProgress: DimensionResult = {
    def: DIMENSIONS[0],
    value: progressInputs.length ? Math.round(progressInputs.reduce((a, b) => a + b, 0) / progressInputs.length) : null,
    count: progressInputs.length,
    evidence: [
      ...approved.map((r) => `Reassessment ${r.outcome!.replace(/_/g, ' ')} (${(r.submittedAt ?? r.due).slice(0, 10)})`),
      ...(activeAreas.length ? [`${activeAreas.length} area${activeAreas.length > 1 ? 's' : ''} in progress — not judged until reassessed`] : []),
    ],
  };

  // Consistency: last 8 completed sessions with a mark
  const sess = db.sessions
    .filter((s) => s.status === 'completed' && s.date <= asOf && s.attendance[athleteId] && s.attendance[athleteId] !== 'unmarked')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  const present = sess.filter((s) => s.attendance[athleteId] === 'present').length;
  const consistency: DimensionResult = {
    def: DIMENSIONS[1], value: sess.length ? Math.round((present / sess.length) * 100) : null, count: sess.length,
    evidence: [`Present at ${present} of the last ${sess.length} recorded sessions`],
  };

  // Practice: self-reported logs vs assigned frequency, 14 days
  const goals = db.goals.filter((g) => g.drill && db.areas.some((a) => a.id === g.areaId && a.athleteId === athleteId));
  const expected = goals.reduce((n, g) => n + (g.drill!.frequency.startsWith('3') ? 6 : g.drill!.frequency.startsWith('2') ? 4 : g.drill!.frequency.startsWith('Once') ? 2 : 8), 0);
  const logs = db.practiceLogs.filter((p) => p.athleteId === athleteId && within(p.date, asOf, 14)).length;
  const practice: DimensionResult = {
    def: DIMENSIONS[2], value: expected ? Math.min(100, Math.round((logs / expected) * 100)) : null, count: logs,
    evidence: expected ? [`${logs} of ${expected} assigned practices marked done in 14 days (self-reported)`] : ['No drill assigned yet'],
  };

  // Milestones: last 90 days; 1 = 70, 2 = 85, 3+ = 100 (illustrative)
  const ms = db.milestones.filter((m) => m.athleteId === athleteId && within(m.date, asOf, 90));
  const milestones: DimensionResult = {
    def: DIMENSIONS[3], value: ms.length ? Math.min(100, 55 + ms.length * 15) : 0, count: ms.length,
    evidence: ms.length ? ms.map((m) => `${m.title} (${m.date})`) : ['No milestones in the last 90 days'],
  };

  const unavailable: DimensionResult[] = DIMENSIONS.slice(4).map((def) => ({ def, value: null, count: 0, evidence: [def.source] }));
  const dims = [coachProgress, consistency, practice, milestones, ...unavailable];

  // Eligibility (illustrative): ≥ 4 recorded sessions and at least one coach-validated signal.
  const missing: string[] = [];
  if (sess.length < 4) missing.push(`${4 - sess.length} more recorded session${4 - sess.length === 1 ? '' : 's'}`);
  if (!approved.length && !achievedMs.length && !ms.length) missing.push('one coach-confirmed result (a reassessment or a milestone)');
  if (missing.length) return { kind: 'building', dims, asOf, missing };

  const scored = dims.filter((d) => d.def.weight !== null && d.value !== null);
  const wsum = scored.reduce((n, d) => n + d.def.weight!, 0);
  const value = Math.round(scored.reduce((n, d) => n + d.value! * d.def.weight!, 0) / wsum);
  const coverage = Math.round((wsum / DIMENSIONS.filter((d) => d.weight !== null).reduce((n, d) => n + d.weight!, 0)) * 100);
  return { kind: 'scored', value, dims, asOf, coverage };
}

/** Weekly history recomputed from records dated on or before each cut-off. Nothing is stored or invented. */
export function scoreHistory(db: DB, athleteId: ID) {
  const cutoffs = ['2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05', TODAY];
  return cutoffs.map((d) => {
    const s = computeDitScore(db, athleteId, d);
    return { date: d, value: s.kind === 'scored' ? s.value : null };
  });
}

export function scoreChange(db: DB, athleteId: ID) {
  const h = scoreHistory(db, athleteId).filter((x) => x.value !== null) as { date: string; value: number }[];
  if (h.length < 2) return null;
  const prev = h[h.length - 2];
  const now = h[h.length - 1];
  const before = computeDitScore(db, athleteId, prev.date);
  const after = computeDitScore(db, athleteId, now.date);
  const drivers =
    before.kind === 'scored' && after.kind === 'scored'
      ? after.dims
          .map((d, i) => ({ def: d.def, from: before.dims[i].value, to: d.value }))
          .filter((x) => x.def.weight !== null && x.from !== x.to)
          .map((x) => ({ ...x, impact: Math.round((((x.to ?? 0) - (x.from ?? 0)) * x.def.weight!) / 1) / 1 }))
          .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      : [];
  return { from: prev.value, to: now.value, delta: now.value - prev.value, since: prev.date, drivers };
}

export function personalBest(db: DB, athleteId: ID) {
  const vals = scoreHistory(db, athleteId).map((h) => h.value).filter((v): v is number => v !== null);
  return vals.length ? Math.max(...vals) : null;
}

/* ───────── Comparison (Flow G) ───────── */

export type ComparisonState =
  | { kind: 'not_offered'; reason: string }
  | { kind: 'opt_in_needed' }
  | { kind: 'ok'; mode: 'bands' | 'positions'; cohortSize: number; selfImprovement: number; band: string; position?: number; rows: { you: boolean; label: string; improvement: number }[] };

/** Squad comparison ranks IMPROVEMENT over 4 weeks, never the absolute score, and only within one sport. */
export function squadComparison(db: DB, athleteId: ID): ComparisonState {
  const a = athleteById(db, athleteId)!;
  const st = db.scoreSettings;
  const age = ageOn(a.born);
  if (!a.batchId || !st.comparisonBatchIds.includes(a.batchId)) return { kind: 'not_offered', reason: 'Your coach hasn’t turned on squad comparison for your group.' };
  if (age < st.comparisonMinAge) return { kind: 'not_offered', reason: `Squad comparison starts at age ${st.comparisonMinAge}. Your own progress is what counts.` };
  const prefs = db.scorePrefs[athleteId];
  if (!prefs?.comparisonOptIn) return { kind: 'opt_in_needed' };

  const cohort = db.athletes.filter((x) => x.batchId === a.batchId && x.status === 'active' && (x.id === athleteId || db.scorePrefs[x.id]?.comparisonOptIn !== false));
  const rows = cohort
    .map((x) => {
      const h = scoreHistory(db, x.id).filter((p) => p.value !== null) as { value: number }[];
      const improvement = h.length >= 2 ? h[h.length - 1].value - h[0].value : 0;
      return { you: x.id === athleteId, improvement, label: x.id === athleteId ? 'You' : 'Teammate' };
    })
    .sort((p, q) => q.improvement - p.improvement);
  const pos = rows.findIndex((r) => r.you) + 1;
  const frac = pos / rows.length;
  const band = frac <= 1 / 3 ? 'Top third for progress' : frac <= 2 / 3 ? 'Middle third for progress' : 'Building momentum';
  const self = rows.find((r) => r.you)!.improvement;
  return age >= st.rankPositionsMinAge
    ? { kind: 'ok', mode: 'positions', cohortSize: rows.length, selfImprovement: self, band, position: pos, rows }
    : { kind: 'ok', mode: 'bands', cohortSize: rows.length, selfImprovement: self, band, rows };
}
