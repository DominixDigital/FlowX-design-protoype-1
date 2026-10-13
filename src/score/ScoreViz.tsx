import { useId, useState } from 'react';
import type { DB } from '../store/store';
import type { ID } from '../data/types';
import { fmtDate } from '../store/selectors';
import { computeDitScore, scoreHistory, personalBest, type ScoreState, type DimensionResult } from './ditScore';

/* Three explored score visualisations. All take the same ScoreState.
   V1 Two Dits (signature, recommended hero) · V2 Signal (compact, cards) · V3 Strata (layered breakdown). */

const dev = (s: Extract<ScoreState, { kind: 'scored' }>) => avg(s.dims.filter((d) => d.def.key === 'coach_progress' || d.def.key === 'milestones'));
const com = (s: Extract<ScoreState, { kind: 'scored' }>) => avg(s.dims.filter((d) => d.def.key === 'consistency' || d.def.key === 'practice'));
function avg(ds: DimensionResult[]) {
  const v = ds.filter((d) => d.value !== null);
  return v.length ? Math.round(v.reduce((n, d) => n + d.value!, 0) / v.length) : 0;
}

/** V1 — Two Dits. The two dots of the brand become two translucent discs:
 *  Development (left) and Commitment (right). Their overlap is where the score lives. */
export function ScoreDiscs({ state, size = 280, celebrate = false }: { state: ScoreState; size?: number; celebrate?: boolean }) {
  const uid = useId().replace(/:/g, '');
  if (state.kind !== 'scored') return <ScoreEmpty state={state} size={size} />;
  const d = dev(state); const c = com(state);
  const rl = 52 + d * 0.28; const rr = 52 + c * 0.28;
  const cx = 140; const gap = 34 - (state.value / 100) * 14;
  return (
    <figure className={`score-discs${celebrate ? ' is-celebrating' : ''}`} style={{ width: size, maxWidth: '100%', margin: 0 }} aria-label={`Dit Score ${state.value}. Development ${d}, commitment ${c}.`}>
      <svg viewBox="0 0 280 222" width="100%" aria-hidden>
        <defs>
          <radialGradient id={`${uid}l`} cx="35%" cy="35%"><stop offset="0" style={{ stopColor: 'var(--disc-l-hi)' }} /><stop offset="1" style={{ stopColor: 'var(--disc-l)' }} /></radialGradient>
          <radialGradient id={`${uid}r`} cx="65%" cy="35%"><stop offset="0" style={{ stopColor: 'var(--disc-r-hi)' }} /><stop offset="1" style={{ stopColor: 'var(--disc-r)' }} /></radialGradient>
        </defs>
        <circle className="sd-disc sd-l" cx={cx - gap} cy="104" r={rl} fill={`url(#${uid}l)`} />
        <circle className="sd-disc sd-r" cx={cx + gap} cy="104" r={rr} fill={`url(#${uid}r)`} />
        <circle className="sd-dot" cx={cx - gap - rl * 0.62} cy="104" r="5" />
        <circle className="sd-dot" cx={cx + gap + rr * 0.62} cy="104" r="5" />
        <text className="sd-label" x={cx - gap - 10} y="212" textAnchor="end">Development {d}</text>
        <text className="sd-label" x={cx + gap + 10} y="212" textAnchor="start">Commitment {c}</text>
      </svg>
      <div className="sd-number">
        <span className="sd-kicker">Dit Score</span>
        <span className="sd-value">{state.value}</span>
      </div>
    </figure>
  );
}

function ScoreEmpty({ state, size }: { state: ScoreState; size: number }) {
  const msg = state.kind === 'building' ? 'Building' : state.kind === 'paused' ? 'Paused' : 'Off';
  return (
    <figure className="score-discs is-empty" style={{ width: size, maxWidth: '100%', margin: 0 }} aria-label={`Dit Score ${msg.toLowerCase()}`}>
      <svg viewBox="0 0 280 220" width="100%" aria-hidden>
        <circle className="sd-disc sd-ghost" cx="116" cy="104" r="62" />
        <circle className="sd-disc sd-ghost" cx="164" cy="104" r="62" />
      </svg>
      <div className="sd-number"><span className="sd-kicker">Dit Score</span><span className="sd-value" style={{ fontSize: '2.4rem' }}>{msg}</span></div>
    </figure>
  );
}

/** V2 — Signal. Each input becomes a Morse mark: a dit when low, stretching into a dah as it grows. */
export function ScoreSignal({ state, showValue = true }: { state: ScoreState; showValue?: boolean }) {
  const dims = state.kind === 'scored' || state.kind === 'building' ? state.dims.filter((d) => d.def.weight !== null) : [];
  return (
    <div className="score-signal" aria-label={state.kind === 'scored' ? `Dit Score ${state.value}` : 'Dit Score not available'}>
      {showValue && <span className="ss-value num">{state.kind === 'scored' ? state.value : '··'}</span>}
      <span className="ss-marks" aria-hidden>
        {dims.map((d) => (
          <span key={d.def.key} className={`ss-mark${d.def.trust === 'self_reported' ? ' is-self' : ''}`} style={{ width: 8 + ((d.value ?? 0) / 100) * 28 }} title={`${d.def.athleteLabel}: ${d.value ?? '—'}`} />
        ))}
      </span>
    </div>
  );
}

/** V3 — Strata. Inputs as stacked translucent plates; thickness = weight, fill = value. */
export function ScoreStrata({ state }: { state: ScoreState }) {
  if (state.kind !== 'scored') return <ScoreEmpty state={state} size={240} />;
  const dims = state.dims.filter((d) => d.def.weight !== null);
  return (
    <figure className="score-strata" style={{ margin: 0 }} aria-label={`Dit Score ${state.value}`}>
      <div className="st-value num">{state.value}</div>
      <div className="st-plates">
        {dims.map((d, i) => (
          <div key={d.def.key} className="st-plate" style={{ height: 10 + d.def.weight! * 60, transform: `translateX(${i * 10}px)`, zIndex: dims.length - i }}>
            <span className="st-fill" style={{ width: `${d.value ?? 0}%` }} />
            <span className="st-label">{d.def.athleteLabel}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Compact chip for profiles, cards and headers. */
export function DitChip({ db, athleteId, onClick }: { db: DB; athleteId: ID; onClick?: () => void }) {
  const s = computeDitScore(db, athleteId);
  const label = s.kind === 'scored' ? String(s.value) : s.kind === 'building' ? 'Building' : s.kind === 'paused' ? 'Paused' : 'Off';
  const El = onClick ? 'button' : 'span';
  return (
    <El className="dit-chip" onClick={onClick} aria-label={`Dit Score ${label}`}>
      <span className="dc-dots" aria-hidden><i /><i /></span>
      <span className="dc-value">{label}</span>
    </El>
  );
}

/** Single-series trend with personal best marker and hover/focus readout. */
export function ScoreTrend({ db, athleteId, height = 120 }: { db: DB; athleteId: ID; height?: number }) {
  const h = scoreHistory(db, athleteId);
  const pts = h.filter((p) => p.value !== null) as { date: string; value: number }[];
  const pb = personalBest(db, athleteId);
  const [hover, setHover] = useState<number | null>(null);
  const W = 320; const H = height; const pad = { l: 28, r: 12, t: 12, b: 22 };
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, h.length - 1);
  const y = (v: number) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  if (pts.length < 2) return <p className="small muted">The trend appears once there are two weeks with enough data.</p>;
  const line = h.map((p, i) => (p.value === null ? null : `${x(i)},${y(p.value)}`)).filter(Boolean).join(' ');
  return (
    <figure className="score-trend" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Dit Score by week: ${pts.map((p) => `${fmtDate(p.date)} ${p.value}`).join(', ')}`}>
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="st-grid" />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" className="st-axis">{v}</text>
          </g>
        ))}
        {pb !== null && <line x1={pad.l} x2={W - pad.r} y1={y(pb)} y2={y(pb)} className="st-pb" />}
        <polyline points={line} className="st-line" />
        {h.map((p, i) => (
          <g key={p.date}>
            <text x={x(i)} y={H - 6} textAnchor="middle" className="st-axis">{fmtDate(p.date)}</text>
            {p.value !== null && (
              <>
                <circle cx={x(i)} cy={y(p.value)} r={hover === i ? 6 : 4.5} className="st-pt" aria-hidden />
                <circle
                  cx={x(i)} cy={y(p.value)} r={16} className="st-hit" tabIndex={0} role="img"
                  aria-label={`Week of ${fmtDate(p.date)}: ${p.value}`}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                />
              </>
            )}
            {p.value === null && <circle cx={x(i)} cy={H - pad.b} r="2.5" className="st-none" />}
          </g>
        ))}
        {hover !== null && h[hover].value !== null && (
          <g>
            <rect x={Math.min(x(hover) - 34, W - 80)} y={y(h[hover].value!) - 34} width="68" height="24" rx="6" className="st-tip" />
            <text x={Math.min(x(hover), W - 46)} y={y(h[hover].value!) - 18} textAnchor="middle" className="st-tip-t">{h[hover].value} · {fmtDate(h[hover].date)}</text>
          </g>
        )}
      </svg>
      <figcaption className="xs muted">Weekly, recalculated from the records available at each date. Hollow ticks: not enough data that week.{pb !== null ? ` Dashed: personal best (${pb}).` : ''}</figcaption>
    </figure>
  );
}

/** Inputs as horizontal bars, single hue; text in text tokens; trust shown in words. */
export function ScoreBreakdown({ state, audience = 'athlete' }: { state: ScoreState; audience?: 'athlete' | 'parent' | 'coach' }) {
  if (state.kind !== 'scored' && state.kind !== 'building') return null;
  return (
    <ul className="score-breakdown">
      {state.dims.map((d) => {
        const label = audience === 'athlete' ? d.def.athleteLabel : audience === 'parent' ? d.def.parentLabel : d.def.label;
        const na = d.def.weight === null;
        return (
          <li key={d.def.key} className={na ? 'is-na' : ''}>
            <div className="sb-row">
              <span className="small strong">{label}</span>
              <span className="small num" style={{ fontSize: '1.2rem' }}>{na ? '—' : d.value ?? '—'}</span>
            </div>
            <div className="sb-track" aria-hidden>{!na && <span style={{ width: `${d.value ?? 0}%` }} />}</div>
            <p className="xs muted">
              {na ? `Not measured yet. ${d.def.needs}.` : d.evidence[0]}
              {d.def.trust === 'self_reported' && ' · self-reported, counts for less'}
              {d.def.trust === 'coach_approved' && ' · coach-confirmed'}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export { computeDitScore };
