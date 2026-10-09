import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Lock, Users, User, Home, ShieldCheck, Info, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/store';
import { coachById, currentFocus, fmtDate } from '../../store/selectors';
import type { ScoreVisibility } from '../../data/types';
import { Banner, FlowCode, StateBlock } from '../../components/ui';
import { DitAvatar } from '../../companion/DitAvatar';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { ScoreDiscs, ScoreTrend, ScoreBreakdown } from '../../score/ScoreViz';
import { computeDitScore, scoreChange, personalBest, squadComparison } from '../../score/ditScore';
import { Top, useAthlete } from './AthleteApp';

/** Flow C — Understanding my Dit Score */
export function ScorePage() {
  const { db, update, toast } = useStore();
  const { a, first, age } = useAthlete();
  const { openCompanion } = useCompanion();
  const st = computeDitScore(db, a.id);
  const ch = scoreChange(db, a.id);
  const pb = personalBest(db, a.id);
  const review = db.scoreReviews.find((r) => r.athleteId === a.id);
  const prefs = db.scorePrefs[a.id] ?? { visibility: 'family' as ScoreVisibility, comparisonOptIn: false, seenMilestoneIds: [], shareRequests: [] };
  const { area, goal } = currentFocus(db, a.id);
  const ms = db.milestones.filter((m) => m.athleteId === a.id && m.visibleToFamily).sort((x, y) => y.date.localeCompare(x.date));
  const approved = db.reassessments.filter((r) => r.athleteId === a.id && r.status === 'approved');
  useCompanionContext({ surface: 'athlete', title: `${first} · Dit Score`, athleteId: a.id, prompts: ['Why did my Dit Score change?', 'How can I improve my Dit Score?', 'What counts towards the Dit Score?'] });

  const setVis = (v: ScoreVisibility) => {
    update((d) => { const p = d.scorePrefs[a.id] ?? (d.scorePrefs[a.id] = { ...prefs }); p.visibility = v; });
    toast({ tone: 'ok', text: 'Sharing updated.' });
  };
  const visOptions: { v: ScoreVisibility; label: string; icon: JSX.Element; note: string }[] = [
    { v: 'coaches', label: 'Me and my coaches', icon: <User size={16} />, note: 'Coaches always see it: they check the data behind it.' },
    { v: 'family', label: '+ my family', icon: <Home size={16} />, note: 'Your linked parents or guardians.' },
    { v: 'squad', label: '+ my squad', icon: <Users size={16} />, note: 'Teammates in your batch, inside ditdit only.' },
  ];

  return (
    <>
      <Top back="/athlete" />
      <section className="m-section">
        <h1 className="display display-lg">Dit Score</h1>
        <FlowCode codes="Flow C" />
      </section>

      <section className="m-section score-hero" data-theme="floodlit" data-role="athlete" aria-label="Your Dit Score">
        {st.kind === 'paused' ? (
          <StateBlock kind="permission" title="Paused by your coach" body="Your coach is checking the data behind your score. Nothing you did is wrong; it comes back once they’re done." />
        ) : st.kind === 'disabled' ? (
          <StateBlock kind="empty" title="Dit Scores are off at your academy" />
        ) : (
          <>
            <div style={{ display: 'grid', placeItems: 'center' }}><ScoreDiscs state={st} size={290} /></div>
            {st.kind === 'scored' && (
              <div className="score-meta">
                <span>{ch ? `${ch.delta >= 0 ? '▲' : '▼'} ${Math.abs(ch.delta)} since ${fmtDate(ch.since)}` : 'First week with enough data'}</span>
                {pb !== null && <span>Best {pb}</span>}
                <span>{review && !review.paused ? `Inputs checked by ${coachById(db, review.reviewedById)?.name.split(' ')[0]} ${fmtDate(review.at)}` : 'Not yet checked by a coach'}</span>
              </div>
            )}
            {st.kind === 'building' && (
              <div className="obj-say">
                <DitAvatar state="uncertain" form="compact" size={26} still />
                <p>I won’t guess a score. Still needed: {st.missing.join(' and ')}.</p>
              </div>
            )}
            <div className="obj-choices" style={{ justifyContent: 'center' }}>
              <button className="choice" onClick={() => openCompanion({ ask: 'Why did my Dit Score change?' })}>Why did it change?</button>
              <button className="choice" onClick={() => openCompanion({ ask: 'How can I improve my Dit Score?' })}>How can I improve?</button>
              <button className="choice" onClick={() => openCompanion({ ask: 'What counts towards the Dit Score?' })}>What counts?</button>
            </div>
            <p className="xs" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Illustrative prototype. The real method will be set with coaches and sports experts.</p>
          </>
        )}
      </section>

      {st.kind === 'scored' && (
        <section className="m-section card">
          <h2 className="small strong" style={{ marginBottom: 8 }}>Week by week</h2>
          <ScoreTrend db={db} athleteId={a.id} />
        </section>
      )}

      {(st.kind === 'scored' || st.kind === 'building') && (
        <section className="m-section card">
          <h2 className="small strong" style={{ marginBottom: 12 }}>What it’s made of</h2>
          <ScoreBreakdown state={st} audience="athlete" />
        </section>
      )}

      <section className="m-section card stack gap-2">
        <h2 className="small strong">What to focus on next</h2>
        <p className="xs muted">From your coach’s plan. dit doesn’t add training of its own.</p>
        {area ? <p className="small"><strong>{area.title}</strong>{goal ? ` — ${goal.title}` : ''}</p> : <p className="small muted">Your coach hasn’t set a focus yet.</p>}
        {goal?.drill && <Link to="/athlete/practice" className="btn btn-sm" style={{ alignSelf: 'flex-start' }}>Practice: {goal.drill.name}</Link>}
      </section>

      {approved.length > 0 && (
        <section className="m-section card stack gap-2">
          <h2 className="small strong row gap-1"><ShieldCheck size={14} /> Confirmed by your coaches</h2>
          {approved.map((r) => (
            <p key={r.id} className="small"><strong>{db.areas.find((x) => x.id === r.areaId)?.title}:</strong> {r.outcome?.replace(/_/g, ' ')} · {fmtDate(r.submittedAt ?? r.due)}</p>
          ))}
        </section>
      )}

      {ms.length > 0 && (
        <section className="m-section">
          <h2 className="small strong muted" style={{ marginBottom: 8 }}>Milestones</h2>
          <div className="stack gap-2">
            {ms.map((m) => (
              <div key={m.id} className="card row gap-3"><Trophy size={18} /><span className="grow small strong">{m.title}</span><span className="xs muted">{fmtDate(m.date)}</span></div>
            ))}
          </div>
        </section>
      )}

      <Link to="/athlete/score/compare" className="m-section card card-link row gap-3">
        <Users size={18} />
        <span className="grow stack"><span className="small strong">Compare progress</span><span className="xs muted">Me vs me, and squad progress where your coach allows it</span></span>
        <ChevronRight size={16} />
      </Link>

      <section className="m-section card stack gap-3" aria-labelledby="vis-h">
        <h2 id="vis-h" className="small strong row gap-1"><Lock size={14} /> Who can see my Dit Score</h2>
        <div role="radiogroup" aria-labelledby="vis-h" className="stack gap-2">
          {visOptions.map((o) => {
            const locked = o.v === 'coaches' && age < 16;
            return (
              <label key={o.v} className="card card-link row gap-3" style={{ padding: 12, opacity: locked ? 0.6 : 1, borderColor: prefs.visibility === o.v ? 'var(--line-strong)' : undefined }}>
                <input type="radio" name="vis" checked={prefs.visibility === o.v} disabled={locked} onChange={() => setVis(o.v)} style={{ width: 18, height: 18, accentColor: 'var(--char-500)' }} />
                {o.icon}
                <span className="grow stack"><span className="small strong">{o.label}</span><span className="xs muted">{locked ? 'Under 16, your family can always see it.' : o.note}</span></span>
              </label>
            );
          })}
        </div>
        <p className="xs muted">A Dit Score shows how your development is going. It doesn’t measure talent and it’s never compared across sports. Assumption DS-07.</p>
      </section>
    </>
  );
}

/** Flow G — score comparison with age-appropriate presentation. */
export function ComparePage() {
  const { db, update, toast } = useStore();
  const { a, first } = useAthlete();
  const [tab, setTab] = useState<'me' | 'squad' | 'academy'>('me');
  const cmp = squadComparison(db, a.id);
  const pb = personalBest(db, a.id);
  const st = computeDitScore(db, a.id);
  useCompanionContext({ surface: 'athlete', title: `${first} · Compare`, athleteId: a.id, prompts: ['Why did my Dit Score change?'] });

  return (
    <>
      <Top back="/athlete/score" />
      <section className="m-section"><h1 className="display display-lg">Compare</h1><FlowCode codes="Flow G" /></section>
      <div className="seg m-section" role="tablist" style={{ width: '100%' }}>
        {(['me', 'squad', 'academy'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} aria-pressed={tab === t} style={{ flex: 1 }} onClick={() => setTab(t)}>
            {t === 'me' ? 'Me vs me' : t === 'squad' ? 'Squad progress' : 'Academy'}
          </button>
        ))}
      </div>

      {tab === 'me' && (
        <section className="m-section stack gap-3">
          <div className="card stack gap-2">
            <p className="small"><strong>Now:</strong> {st.kind === 'scored' ? st.value : '—'} · <strong>Personal best:</strong> {pb ?? '—'}</p>
            <ScoreTrend db={db} athleteId={a.id} />
          </div>
          <p className="small muted">The comparison that matters most is with yourself a few weeks ago.</p>
        </section>
      )}

      {tab === 'squad' && (
        <section className="m-section stack gap-3">
          {cmp.kind === 'not_offered' && <StateBlock kind="permission" title="Not available for you" body={cmp.reason} />}
          {cmp.kind === 'opt_in_needed' && (
            <div className="card stack gap-3">
              <p className="small"><strong>Squad progress</strong> compares how much each person improved over the last four weeks. It doesn’t compare scores.</p>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                <li>Teammates are never named. You only see where you sit.</li>
                <li>Under 16 you see a band (top, middle or building), not a position.</li>
                <li>You can switch it off any time.</li>
              </ul>
              <button className="btn btn-primary" onClick={() => { update((d) => { const p = d.scorePrefs[a.id] ?? (d.scorePrefs[a.id] = { visibility: 'family', comparisonOptIn: false, seenMilestoneIds: [], shareRequests: [] }); p.comparisonOptIn = true; }); toast({ tone: 'ok', text: 'Squad progress turned on.' }); }}>Turn on squad progress</button>
            </div>
          )}
          {cmp.kind === 'ok' && (
            <>
              <div className="card stack gap-2" data-theme="floodlit" data-role="athlete">
                <p className="xs strong" style={{ color: 'var(--text-muted)' }}>Progress over 4 weeks · {cmp.cohortSize} in your squad</p>
                <p className="display" style={{ fontSize: '2.2rem' }}>{cmp.mode === 'positions' ? `#${cmp.position} for progress` : cmp.band}</p>
                <p className="small">You moved {cmp.selfImprovement >= 0 ? '+' : ''}{cmp.selfImprovement} points.</p>
              </div>
              <ol className="list card card-flush" aria-label="Squad progress, anonymised">
                {cmp.rows.map((r, i) => (
                  <li key={i} className="list-row" style={r.you ? { background: 'var(--surface-sunk)' } : undefined}>
                    {cmp.mode === 'positions' && <span className="num" style={{ width: 28 }}>{i + 1}</span>}
                    <span className="grow small strong">{r.you ? 'You' : 'Teammate'}</span>
                    <span className="sb-track" style={{ width: 110, margin: 0 }} aria-hidden><span style={{ width: `${Math.max(4, Math.min(100, 50 + r.improvement * 2))}%` }} /></span>
                  </li>
                ))}
              </ol>
              <p className="xs muted">Ranked by improvement, not by score. Squad comparison is allowed by your coach for this batch only.</p>
              <button className="btn btn-ghost btn-sm" onClick={() => update((d) => { const p = d.scorePrefs[a.id]; if (p) p.comparisonOptIn = false; })}>Turn off squad progress</button>
            </>
          )}
        </section>
      )}

      {tab === 'academy' && (
        <section className="m-section stack gap-3">
          <StateBlock kind="empty" title="Not available yet" body="Comparing across age groups needs a validated way to make scores fair between them. ditdit won’t rank across groups or sports until that exists." />
          <Banner tone="info"><Info size={14} style={{ display: 'inline' }} /> Academy achievements, such as squad milestones, will show here instead of rankings.</Banner>
        </section>
      )}
    </>
  );
}
