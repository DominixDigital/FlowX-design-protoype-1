// Huddle demo engine.
// No language model is connected. Everything here is deterministic logic over records that
// already exist in the store; nothing is measured or invented. The UI labels every output
// as "Demo logic" and labels interpretations as "Suggestion".

import type { DB } from '../store/store';
import type { ID, Report } from '../data/types';
import {
  areaById, athleteById, attendanceFor, currentFocus, fmtDate, fmtTime, observationsFor, sessionById,
} from '../store/selectors';

export type Ref = { kind: 'observation' | 'session' | 'video' | 'goal' | 'attendance' | 'practice' | 'milestone' | 'task' | 'report'; id: string; label: string };

export type HuddleObject =
  | { type: 'interpretation'; heading: string; fields: { label: string; value: string; confidence?: 'clear' | 'check' }[]; basis: Ref[] }
  | { type: 'evidence'; heading: string; items: { date: string; text: string; ref: Ref; tone?: 'positive' | 'concern' | 'neutral' }[] }
  | { type: 'facts'; heading: string; items: { label: string; value: string; basis: string }[] }
  | { type: 'suggestion'; text: string; why: string[] }
  | { type: 'compare'; heading: string; left: { label: string; items: string[] }; right: { label: string; items: string[] } }
  | { type: 'explainer'; heading: string; sections: { q: string; a: string }[] }
  | { type: 'draft'; heading: string; text: string; basis: Ref[] }
  | { type: 'moment'; videoTitle: string; t: number; coachText: string; cue: string; drill?: string }
  | { type: 'proposal'; id: string; heading: string; lines: string[]; confirmLabel: string; editable?: { label: string; value: string } }
  | { type: 'capabilities'; heading: string; items: string[] }
  | { type: 'notice'; tone: 'info' | 'warn'; text: string };

export interface HuddleCtx {
  surface: 'web' | 'coach' | 'parent' | 'athlete';
  title: string;
  athleteId?: ID;
  sessionId?: ID;
  reassessmentId?: ID;
  reportId?: ID;
  videoId?: ID;
  /** Prompt chips relevant to this screen */
  prompts: string[];
}

const POSITIVE = ['better', 'clean', 'still', 'good', 'well', 'confidence', 'confident', 'louder', 'improv', 'swayed', 'level'];
const CONCERN = ['falls', 'drop', 'stuck', 'missed', 'snatch', 'no-ball', 'turned', 'stretch', 'late', 'early', 'drifts'];

export function tone(text: string): 'positive' | 'concern' | 'neutral' {
  const t = text.toLowerCase();
  const p = POSITIVE.filter((w) => t.includes(w)).length;
  const c = CONCERN.filter((w) => t.includes(w)).length;
  return p > c ? 'positive' : c > p ? 'concern' : 'neutral';
}

const words = (s: string) => s.toLowerCase().match(/[a-z]{4,}/g) ?? [];

/** CM05.03 → CM05.05: turn a spoken note into a structured observation draft. */
export function interpretVoiceNote(db: DB, raw: string, rosterIds: ID[], focusAthleteId?: ID) {
  const text = raw.trim().replace(/\s+/g, ' ');
  const lower = text.toLowerCase();
  const roster = rosterIds.map((id) => athleteById(db, id)!).filter(Boolean);
  const named = roster.filter((a) => lower.includes(a.name.split(' ')[0].toLowerCase()));
  const athlete = named.length === 1 ? named[0] : focusAthleteId ? athleteById(db, focusAthleteId) : undefined;
  const athleteConfidence: 'clear' | 'check' = named.length === 1 ? 'clear' : 'check';

  let area: ReturnType<typeof areaById>;
  let overlap = 0;
  if (athlete) {
    const tokens = new Set(words(text));
    for (const a of db.areas.filter((x) => x.athleteId === athlete.id && (x.status === 'active' || x.status === 'reopened'))) {
      const goalText = db.goals.filter((g) => g.areaId === a.id).map((g) => `${g.title} ${g.target}`).join(' ');
      const n = words(`${a.title} ${goalText}`).filter((w) => tokens.has(w)).length;
      if (n > overlap) { overlap = n; area = a; }
    }
  }
  // Remove the athlete's name prefix ("Kabir, ...") from the note body.
  let body = text;
  if (athlete) body = body.replace(new RegExp(`^${athlete.name.split(' ')[0]}[,:\\s-]*`, 'i'), '');
  body = body.charAt(0).toUpperCase() + body.slice(1);
  if (!/[.!?]$/.test(body)) body += '.';

  return {
    athleteId: athlete?.id ?? null,
    areaId: area?.id ?? null,
    text: body,
    tone: tone(body),
    object: {
      type: 'interpretation',
      heading: 'Draft observation',
      fields: [
        { label: 'Athlete', value: athlete?.name ?? 'Not recognised — choose one', confidence: athlete ? athleteConfidence : 'check' },
        { label: 'Note', value: body },
        { label: 'Development area', value: area ? area.title : 'Leave unstructured', confidence: area ? (overlap >= 2 ? 'clear' : 'check') : undefined },
        { label: 'Reads as', value: tone(body) === 'positive' ? 'Progress' : tone(body) === 'concern' ? 'Concern' : 'Neutral', confidence: 'check' },
      ],
      basis: [
        ...(athlete ? [{ kind: 'session' as const, id: 'roster', label: named.length === 1 ? `Name “${athlete.name.split(' ')[0]}” heard; on today’s roster` : 'Athlete open on screen' }] : []),
        ...(area ? [{ kind: 'goal' as const, id: area.id, label: `${overlap} shared ${overlap === 1 ? 'word' : 'words'} with “${area.title}”` }] : []),
      ],
    } satisfies HuddleObject,
  };
}

/** CM12.02–04 / MW10.03: everything recorded since the area was opened or last reassessed. */
export function evidenceBrief(db: DB, reassessmentId: ID): HuddleObject[] {
  const r = db.reassessments.find((x) => x.id === reassessmentId);
  if (!r) return [{ type: 'notice', tone: 'warn', text: 'This reassessment no longer exists or was reassigned.' }];
  const area = areaById(db, r.areaId)!;
  const goal = db.goals.find((g) => g.areaId === area.id && g.status === 'active');
  const obs = observationsFor(db, r.athleteId).filter((o) => o.areaId === area.id);
  const att = attendanceFor(db, r.athleteId);
  const vids = db.videos.filter((v) => v.areaId === area.id);
  const practice = goal ? db.practiceLogs.filter((p) => p.goalId === goal.id) : [];
  const pos = obs.filter((o) => tone(o.text) === 'positive').length;
  const con = obs.filter((o) => tone(o.text) === 'concern').length;

  const out: HuddleObject[] = [
    {
      type: 'facts',
      heading: `Recorded since ${fmtDate(area.openedAt)}`,
      items: [
        { label: 'Notes on this area', value: String(obs.length), basis: 'Saved observations linked to the area' },
        { label: 'Sessions attended', value: `${att.present}/${att.total}`, basis: 'Completed sessions with attendance' },
        { label: 'Linked clips', value: String(vids.length), basis: vids.length ? vids.map((v) => v.title).join(', ') : 'None linked' },
        { label: 'Practice logged', value: String(practice.length), basis: 'Athlete-reported, not verified' },
      ],
    },
    {
      type: 'evidence',
      heading: 'Notes, newest first',
      items: obs.map((o) => ({
        date: fmtDate(o.createdAt), text: o.text, tone: tone(o.text),
        ref: { kind: 'observation', id: o.id, label: sessionById(db, o.sessionId)?.title ?? 'Unlinked' },
      })),
    },
  ];
  if (obs.length) {
    out.push({
      type: 'suggestion',
      text: pos > con ? 'Notes lean towards improvement.' : con > pos ? 'Notes still lean towards concern.' : 'Notes are mixed.',
      why: [`${pos} note${pos === 1 ? '' : 's'} read as progress, ${con} as concern (word matching, not judgement)`, goal ? `Target to judge against: “${goal.target}”` : 'No active goal target'],
    });
  } else {
    out.push({ type: 'notice', tone: 'info', text: 'No notes are linked to this area yet. Record one before choosing a status.' });
  }
  return out;
}

/** MW11.02–03: parent-safe draft from family-visible records only (XS02.S04). */
export function draftReportComment(db: DB, athleteId: ID): HuddleObject {
  const a = athleteById(db, athleteId)!;
  const first = a.name.split(' ')[0];
  const { area, goal } = currentFocus(db, athleteId);
  const att = attendanceFor(db, athleteId);
  const ms = db.milestones.filter((m) => m.athleteId === athleteId && m.visibleToFamily).sort((x, y) => y.date.localeCompare(x.date))[0];
  const parts = [
    ms ? `${first} reached a milestone this period: ${ms.title.charAt(0).toLowerCase() + ms.title.slice(1)}.` : '',
    area ? `Our current focus is ${area.title.toLowerCase()}${goal ? ` — the aim is ${goal.title.charAt(0).toLowerCase() + goal.title.slice(1)}` : ''}.` : '',
    att.total ? `${first} attended ${att.present} of ${att.total} recorded sessions.` : '',
    goal?.drill ? `At home, ${goal.drill.frequency.toLowerCase()} on the “${goal.drill.name}” drill will help most.` : '',
  ].filter(Boolean);
  return {
    type: 'draft',
    heading: 'Draft coach comment',
    text: parts.join(' '),
    basis: [
      ...(ms ? [{ kind: 'milestone' as const, id: ms.id, label: `Milestone, ${fmtDate(ms.date)}` }] : []),
      ...(area ? [{ kind: 'goal' as const, id: area.id, label: 'Current development area' }] : []),
      { kind: 'attendance', id: athleteId, label: `Attendance ${att.present}/${att.total}` },
    ],
  };
}

const GLOSSARY: Record<string, string> = {
  'front-foot drive': 'an attacking shot played by stepping forward towards the ball',
  'short ball': 'a delivery that bounces short and rises towards the body',
  'running between wickets': 'judging and calling runs with the batting partner',
  'run-up': 'the approach a bowler takes before delivering the ball',
  'glovework': 'how a wicketkeeper catches the ball',
  'head position': 'where the head is when bat meets ball — still and over the ball is ideal',
  'calling': 'shouting clearly to a partner whether to run',
};

/** PA04.03–04 / PA03.03: plain-language explanation of what a parent is already allowed to read. */
export function explainReport(db: DB, report: Report): HuddleObject {
  const a = athleteById(db, report.athleteId)!;
  const first = a.name.split(' ')[0];
  const text = `${report.focusSummary} ${report.comment}`.toLowerCase();
  const terms = Object.entries(GLOSSARY).filter(([k]) => text.includes(k));
  const sections = [
    { q: `What is ${first} working on?`, a: report.focusSummary },
    ...terms.map(([k, v]) => ({ q: `What does “${k}” mean?`, a: `It is ${v}.` })),
    { q: 'What happens next?', a: `The coach will check progress at the next reassessment and share any milestone with you. Nothing in this report needs action from you.` },
  ];
  if (report.status === 'corrected' && report.correctionNote) sections.unshift({ q: 'Why does it say corrected?', a: `The academy fixed a mistake after publishing: ${report.correctionNote} The rest is unchanged.` });
  return { type: 'explainer', heading: 'In plain words', sections };
}

/** AT04.04: expand a published timestamp comment into a practice cue. */
export function explainMoment(db: DB, videoId: ID, t: number): HuddleObject {
  const v = db.videos.find((x) => x.id === videoId)!;
  const c = v.comments.filter((x) => x.shared).reduce((best, x) => (Math.abs(x.t - t) < Math.abs(best.t - t) ? x : best));
  const goal = db.goals.find((g) => g.id === v.goalId);
  const isPositive = tone(c.text) === 'positive';
  return {
    type: 'moment',
    videoTitle: v.title,
    t: c.t,
    coachText: c.text,
    cue: isPositive
      ? `This is the version your coach wants to see. Watch it 3 times before you practise, then copy just one thing: ${goal ? goal.title.toLowerCase() : 'the position you see here'}.`
      : `Your coach spotted something to fix here. Pause at ${fmtTime(c.t)}, then compare with a clip where it went right. Practise slowly first.`,
    drill: goal?.drill?.name,
  };
}

/** CM04 / MW07: "What happened in recent sessions?" */
export function recentSummary(db: DB, athleteId: ID): HuddleObject[] {
  const obs = observationsFor(db, athleteId).slice(0, 4);
  const att = attendanceFor(db, athleteId);
  const { area, goal } = currentFocus(db, athleteId);
  const sorted = att.sessions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  return [
    {
      type: 'facts',
      heading: 'Last four sessions',
      items: sorted.map((s) => ({ label: fmtDate(s.date), value: s.attendance[athleteId] === 'present' ? 'Present' : 'Absent', basis: s.title })),
    },
    {
      type: 'evidence',
      heading: 'Latest notes',
      items: obs.map((o) => ({ date: fmtDate(o.createdAt), text: o.text, tone: tone(o.text), ref: { kind: 'observation', id: o.id, label: areaById(db, o.areaId)?.title ?? 'Unstructured' } })),
    },
    ...(area ? [{ type: 'suggestion' as const, text: goal?.nextAction ? `Next action on record: ${goal.nextAction}.` : 'No next action is set for the current goal.', why: [`Current focus: ${area.title}`] }] : []),
  ];
}

/** Compare the two most recent sessions' notes for an athlete. */
export function compareSessions(db: DB, athleteId: ID): HuddleObject {
  const bySession = new Map<string, string[]>();
  for (const o of observationsFor(db, athleteId)) {
    if (!o.sessionId) continue;
    bySession.set(o.sessionId, [...(bySession.get(o.sessionId) ?? []), o.text]);
  }
  const ids = [...bySession.keys()].sort((a, b) => (sessionById(db, b)?.date ?? '').localeCompare(sessionById(db, a)?.date ?? '')).slice(0, 2);
  if (ids.length < 2) return { type: 'notice', tone: 'info', text: 'Only one session has notes so far, so there is nothing to compare yet.' };
  const [newer, older] = ids.map((id) => sessionById(db, id)!);
  return {
    type: 'compare',
    heading: 'Notes side by side',
    left: { label: `${older.title} · ${fmtDate(older.date)}`, items: bySession.get(older.id)! },
    right: { label: `${newer.title} · ${fmtDate(newer.date)}`, items: bySession.get(newer.id)! },
  };
}

export function capabilities(ctx: HuddleCtx): HuddleObject {
  const byRole: Record<HuddleCtx['surface'], string[]> = {
    coach: ['Turn a voice note into a draft observation', 'Summarise an athlete’s recent sessions', 'Compare notes from two sessions', 'Brief you on evidence before a reassessment'],
    web: ['Summarise an athlete’s recent sessions', 'Draft a parent-friendly report comment', 'Brief you on reassessment evidence', 'Compare notes from two sessions'],
    parent: ['Explain a report in plain words', 'Explain a cricket term in a report'],
    athlete: ['Explain a coach’s comment on your clip', 'Turn feedback into a practice cue'],
  };
  return { type: 'capabilities', heading: 'Huddle can help with', items: byRole[ctx.surface] };
}

/** Free-text router: picks the object type that fits the intent. */
export function answer(db: DB, ctx: HuddleCtx, q: string): HuddleObject[] {
  const s = q.toLowerCase();
  const athleteId = ctx.athleteId;
  if (/explain|mean|plain/.test(s) && ctx.reportId) {
    const r = db.reports.find((x) => x.id === ctx.reportId);
    return r ? [explainReport(db, r)] : [{ type: 'notice', tone: 'warn', text: 'This report is no longer available.' }];
  }
  if (/moment|clip|explain|why/.test(s) && ctx.videoId) {
    const v = db.videos.find((x) => x.id === ctx.videoId);
    const first = v?.comments.find((c) => c.shared);
    return first ? [explainMoment(db, v!.id, first.t)] : [{ type: 'notice', tone: 'info', text: 'This clip has no shared coach comments yet.' }];
  }
  if (/evidence|reassess|brief|ready/.test(s) && ctx.reassessmentId) return evidenceBrief(db, ctx.reassessmentId);
  if (/draft|comment|report/.test(s) && athleteId && ctx.surface === 'web') return [draftReportComment(db, athleteId)];
  if (/compare|versus|vs\b/.test(s) && athleteId) return [compareSessions(db, athleteId)];
  if (/summar|recent|happen|last|catch/.test(s) && athleteId) return recentSummary(db, athleteId);
  if (/next/.test(s) && athleteId) {
    const { goal } = currentFocus(db, athleteId);
    return [{ type: 'suggestion', text: goal?.nextAction ? `On record: ${goal.nextAction}.` : 'No next action is recorded yet.', why: ['Read from the active goal; Huddle does not set it'] }];
  }
  return [
    { type: 'notice', tone: 'info', text: athleteId ? 'Huddle could not match that to something it can do here.' : 'Open an athlete, report or clip first. Huddle works with what is on screen.' },
    capabilities(ctx),
  ];
}

export const SAMPLE_VOICE_NOTES: Record<string, string> = {
  coach: 'Kabir, head stayed still on the drive this time, eyes level over the front knee on most throwdowns. Still reaches for the wide one.',
};
