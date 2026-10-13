import type { DB } from '../store/store';
import { ageOn, athleteById, attendanceFor, currentFocus } from '../store/selectors';
import { computeDitScore } from '../score/ditScore';
import type { CompanionCtx, CompanionObject } from './engine';

const FLAG = 'ditdit-gemini';

export const geminiEnabled = () => {
  try { return localStorage.getItem(FLAG) !== 'off'; } catch { return true; }
};
export const setGeminiEnabled = (on: boolean) => {
  try { localStorage.setItem(FLAG, on ? 'on' : 'off'); } catch { /* storage unavailable */ }
};

/**
 * The only data Gemini ever sees: short facts read from records this role may already see.
 * No other athletes, no unpublished feedback for athletes and parents, no ids or contact details.
 */
export function groundingFacts(db: DB, ctx: CompanionCtx): string[] {
  const facts: string[] = [`The user is on the ${ctx.surface} app, on the screen "${ctx.title}".`];
  const id = ctx.athleteId;
  const a = id ? athleteById(db, id) : undefined;
  if (!id || !a) return facts;
  const first = a.name.split(' ')[0];
  const { area, goal } = currentFocus(db, id);
  if (area) facts.push(`${first}'s current focus area is "${area.title}".`);
  if (goal) facts.push(`Active goal: ${goal.title}. Target: ${goal.target}. Next action: ${goal.nextAction}.`);
  const att = attendanceFor(db, id);
  if (att.total) facts.push(`${first} attended ${att.present} of the last ${att.total} recorded sessions.`);
  const fb = db.feedback.filter((f) => f.athleteId === id && f.status === 'published').slice(-3);
  for (const f of fb) facts.push(`Coach feedback (published ${f.publishedAt.slice(0, 10)}): ${f.text}`);
  if (ctx.surface === 'parent') {
    for (const r of db.reports.filter((x) => x.athleteId === id && (x.status === 'published' || x.status === 'corrected')).slice(-2)) facts.push(`Published report for ${r.period}: ${r.comment}`);
  }
  const prefs = db.scorePrefs[id];
  const parentMaySee = ageOn(a.born) < 16 || !prefs || prefs.visibility === 'family' || prefs.visibility === 'squad';
  const score = computeDitScore(db, id);
  if (ctx.surface === 'parent' && !parentMaySee) return facts;
  if (score.kind === 'scored' || score.kind === 'building') {
    facts.push(`Dit Score status: ${score.kind}. This is an illustrative, unvalidated score built from attendance, coach-confirmed progress, practice logs and milestones.`);
    if (score.kind === 'scored') facts.push(`Current Dit Score: ${score.value}.`);
  }
  return facts;
}

export type GeminiResult =
  | { ok: true; objects: CompanionObject[] }
  | { ok: false; reason: 'off' | 'not_configured' | 'rate' | 'unavailable' };

export async function askGemini(db: DB, ctx: CompanionCtx, question: string): Promise<GeminiResult> {
  if (!geminiEnabled()) return { ok: false, reason: 'off' };
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, audience: ctx.surface === 'web' ? 'coach' : ctx.surface, facts: groundingFacts(db, ctx) }),
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) return { ok: false, reason: 'unavailable' }; // no function (local dev)
    const data = (await res.json()) as { ok: boolean; reason?: string; model?: string; answer?: string; points?: string[]; used?: string[] };
    if (!data.ok || !data.answer) {
      if (data.reason === 'not_configured') return { ok: false, reason: 'not_configured' };
      if (data.reason === 'quota' || data.reason === 'slow_down' || data.reason === 'daily_cap') return { ok: false, reason: 'rate' };
      return { ok: false, reason: 'unavailable' };
    }
    return { ok: true, objects: [{ type: 'ai', text: data.answer, points: data.points ?? [], basis: data.used ?? [], model: data.model ?? 'Gemini' }] };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
