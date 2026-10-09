import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../store/store';
import { Wordmark } from '../../components/chrome';
import { DitAvatar, DIT_STATES, type DitConcept, type DitForm, type DitState } from '../../companion/DitAvatar';
import { ScoreDiscs, ScoreSignal, ScoreStrata, DitChip, ScoreTrend } from '../../score/ScoreViz';
import { computeDitScore } from '../../score/ditScore';
import './explore-ditdit.css';

const SCALES = ['teal', 'lime', 'grey', 'taupe', 'char'] as const;
const SCALE_META: Record<(typeof SCALES)[number], { name: string; base: string; role: string; text: string }> = {
  teal: { name: 'Teal blue', base: '#36ABB4', role: 'Coach and academy web', text: 'Text on light from 700' },
  lime: { name: 'Electric lime', base: '#BEE501', role: 'Parent', text: 'Text on light from 800; fill with charcoal text' },
  grey: { name: 'Light grey', base: '#CCCCCC', role: 'Athlete', text: 'Text on light from 800; silver on charcoal' },
  taupe: { name: 'Warm taupe', base: '#7B7165', role: 'Shared secondary neutral', text: '500 passes on white (4.8:1)' },
  char: { name: 'Charcoal', base: '#2C2A2B', role: 'Shared foundation, companion, Dit Score', text: '14.3:1 on white' },
};
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const CONCEPTS: { id: DitConcept; name: string; line: string; notes: [string, string][] }[] = [
  {
    id: 'A', name: 'Living symbol', line: 'Two dots and nothing else. Motion does all the talking.',
    notes: [['Silhouette', '··: reads at 12px; the same as the wordmark’s i-dots'], ['Personality', 'Calm, premium, a bit mysterious'], ['Scalability', 'Excellent'], ['Risk', 'Little warmth for 7–10 year olds; emotion depends on motion alone']],
  },
  {
    id: 'B', name: 'Character companion', line: 'A soft capsule with a sweatband, dot eyes and a mouth.',
    notes: [['Silhouette', 'Capsule body, recognisable from 32px up'], ['Personality', 'Warm, cheeky, encouraging'], ['Scalability', 'Weak below 24px; the mouth disappears'], ['Risk', 'Can feel young to 16-year-olds, coaches and parents']],
  },
  {
    id: 'C', name: 'Hybrid (recommended)', line: 'The two dots live in a squircle face and can open into the two Dit Score discs.',
    notes: [['Silhouette', 'Dots at 16px, face at 28–48px, discs when immersive'], ['Personality', 'Friendly, sporty, adapts tone by role'], ['Scalability', 'One mark from nav icon to full-screen moment'], ['Why', 'Same dots as the logo and the score, so the brand is one idea']],
  },
];

function FormCycle() {
  const seq: { form: DitForm; state: DitState; label: string }[] = [
    { form: 'compact', state: 'idle', label: 'Compact' },
    { form: 'face', state: 'listening', label: 'Listening' },
    { form: 'face', state: 'thinking', label: 'Conversation' },
    { form: 'immersive', state: 'insight', label: 'Insight' },
    { form: 'face', state: 'explaining', label: 'Action' },
    { form: 'compact', state: 'idle', label: 'Compact' },
  ];
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(true);
  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setI((x) => (x + 1) % seq.length), 1600);
    return () => clearInterval(t);
  }, [play, seq.length]);
  return (
    <div className="xd-cycle">
      <div className="xd-cycle-stage" data-theme="floodlit" data-role="athlete">
        <DitAvatar form={seq[i].form} state={seq[i].state} size={seq[i].form === 'compact' ? 44 : 120} />
      </div>
      <ol className="xd-cycle-steps">
        {seq.map((s, k) => (
          <li key={k}><button aria-current={k === i ? 'step' : undefined} onClick={() => { setPlay(false); setI(k); }}>{s.label}</button></li>
        ))}
      </ol>
      <button className="btn btn-sm" onClick={() => setPlay((p) => !p)}>{play ? 'Pause' : 'Play'} sequence</button>
    </div>
  );
}

export function Explore() {
  const { db } = useStore();
  const nav = useNavigate();
  const { setPersona } = useStore();
  const tara = computeDitScore(db, 'a-tara');
  const open = (surface: 'athlete' | 'parent' | 'coach', personId: string, to: string) => { setPersona(surface, { personId, academyId: 'ac-velocity' }); nav(to); };

  return (
    <main className="xd" id="main" tabIndex={-1} data-theme="chalk" data-role="athlete">
      <header className="xd-head">
        <Wordmark />
        <div className="row gap-2">
          <Link to="/explore/v1" className="btn btn-sm">v1 directions (FlowX era)</Link>
          <Link to="/" className="btn btn-sm">All apps</Link>
        </div>
      </header>

      <section className="xd-intro">
        <p className="xd-kicker">Explorations · ditdit evolution</p>
        <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)' }}>Two dots, one idea</h1>
        <p className="xd-lede">
          In Morse code a “dit” is the short signal, so ditdit is two dots: ··. They become the i-dots in the wordmark, the companion’s eyes and the two discs of the Dit Score.
          The earlier system carries over: the three surface modes, Big Shoulders for numbers, Instrument Sans for reading. The approved five-colour palette replaces the old greens and blues.
        </p>
      </section>

      {/* 1 — Brand identity */}
      <section className="xd-sec" aria-labelledby="x1">
        <h2 id="x1" className="xd-h">1 · Brand identity</h2>
        <div className="xd-brand">
          <div className="xd-mark" data-theme="floodlit" data-role="athlete"><Wordmark size={88} /><p className="small" style={{ color: 'var(--text-muted)' }}>On charcoal: silver-led athlete identity</p></div>
          <div className="xd-mark" data-theme="chalk" data-role="parent" style={{ background: 'var(--role-50)' }}><Wordmark size={88} /><p className="small muted">On lime-tinted: parent</p></div>
          <div className="xd-mark" data-theme="chalk" data-role="coach" style={{ background: 'var(--role-50)' }}><Wordmark size={88} /><p className="small muted">On teal-tinted: coach</p></div>
        </div>
        <p className="small muted" style={{ maxWidth: '70ch' }}>
          Lowercase, tight, friendly; the first dot always takes the role colour and the second stays silver, so the mark adapts to each role without changing shape.
          Tone of voice: short, warm, specific. “Good session! Want to see what improved?” — never hype, never a verdict.
        </p>

        <h3 className="xd-h3">Approved palette and generated scales</h3>
        <div className="xd-scales">
          {SCALES.map((k) => (
            <div key={k} className="xd-scale">
              <div className="xd-scale-head"><strong>{SCALE_META[k].name}</strong> <code>{SCALE_META[k].base}</code><span className="xs muted">{SCALE_META[k].role}</span></div>
              <div className="xd-swatches">
                {STEPS.map((s) => (
                  <div key={s} className={`xd-sw${s === 500 ? ' is-base' : ''}`} style={{ background: `var(--${k}-${s})`, color: s >= 500 && k !== 'lime' && k !== 'grey' ? '#fff' : s >= 700 ? '#fff' : 'var(--char-500)' }}>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <p className="xs muted">{SCALE_META[k].text}</p>
            </div>
          ))}
        </div>

        <h3 className="xd-h3">One component, three role identities</h3>
        <div className="xd-roles">
          {(['athlete', 'parent', 'coach'] as const).map((r) => (
            <div key={r} className="xd-role" data-theme="chalk" data-role={r}>
              <p className="xs strong" style={{ color: 'var(--role-text)', textTransform: 'capitalize' }}>{r}</p>
              <div className="card stack gap-2">
                <span className="small strong">Next practice</span>
                <span className="mark small">Sway ladder</span>
                <div className="row gap-2"><button className="btn btn-primary btn-sm">Primary action</button><span className="badge badge-ok">Synced</span></div>
              </div>
              <div className="row gap-2"><DitAvatar form="face" size={36} /><DitChip db={db} athleteId="a-tara" /></div>
            </div>
          ))}
        </div>
        <p className="xs muted">Same markup in all three columns; only <code>data-role</code> changes. Components read <code>--role-*</code> and <code>--hl</code>, never a raw colour.</p>
      </section>

      {/* 2 — Companion concepts */}
      <section className="xd-sec" aria-labelledby="x2">
        <h2 id="x2" className="xd-h">2 · Three companion concepts</h2>
        <div className="xd-concepts" data-theme="floodlit" data-role="athlete">
          {CONCEPTS.map((c) => (
            <article key={c.id} className={`xd-concept${c.id === 'C' ? ' is-rec' : ''}`}>
              <header>
                <h3 className="h2">{c.id} · {c.name}</h3>
                <p className="small" style={{ color: 'var(--text-muted)' }}>{c.line}</p>
              </header>
              <div className="xd-states">
                {DIT_STATES.map((s) => (
                  <figure key={s.state}>
                    <DitAvatar concept={c.id} state={s.state} size={56} form={c.id === 'C' && s.state === 'insight' ? 'immersive' : 'face'} />
                    <figcaption>{s.label}</figcaption>
                  </figure>
                ))}
              </div>
              <dl className="xd-notes">{c.notes.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
              <div className="row gap-3" style={{ alignItems: 'center' }}>
                <span className="xs" style={{ color: 'var(--text-muted)' }}>Small sizes:</span>
                <DitAvatar concept={c.id} size={16} form={c.id === 'A' ? 'compact' : 'face'} still />
                <DitAvatar concept={c.id} size={24} form={c.id === 'A' ? 'compact' : 'face'} still />
                <DitAvatar concept={c.id} size={36} form={c.id === 'A' ? 'compact' : 'face'} still />
              </div>
            </article>
          ))}
        </div>
        <div className="xd-split">
          <div>
            <h3 className="xd-h3">Recommended: C, hybrid. Presence lifecycle</h3>
            <p className="small muted">Compact → Listening → Conversation → Insight → Action → Compact. Each step changes form or state, never both, so it’s always clear what dit is doing.
              Dismiss: minimise (−) returns to compact. Quiet mode (bell) stops suggestions; dit answers only when asked. Suggestions can be dismissed one by one.</p>
            <ul className="small" style={{ paddingLeft: 18 }}>
              <li><strong>Listening</strong>: dots pulse alternately, dit… dit. The mic is live and a transcript shows.</li>
              <li><strong>Thinking</strong>: eyes look across while records load (under 1s here).</li>
              <li><strong>Explaining</strong>: the right dot stretches into a dash (dit-dah) while text is on screen.</li>
              <li><strong>Celebrating</strong>: happy eyes and two small hops. Only for coach-confirmed milestones.</li>
              <li><strong>Unsure</strong>: a tilt and a smaller dot. Used when data is missing or the coach should answer.</li>
            </ul>
          </div>
          <FormCycle />
        </div>
      </section>

      {/* 3 — Conversational canvas */}
      <section className="xd-sec" aria-labelledby="x3">
        <h2 id="x3" className="xd-h">3 · Conversational canvas: conversation, context, interactive UI</h2>
        <div className="xd-story" data-theme="floodlit" data-role="athlete">
          {[
            { who: 'dit', s: 'explaining' as DitState, t: 'Good session! Your coach shared feedback. Want to see what went well?', ui: <div className="obj-choices"><span className="choice">Show me</span><span className="choice">What should I improve?</span></div> },
            { who: 'dit', s: 'celebrating' as DitState, t: 'Your coach spotted this going right:', ui: <p className="small">Clip at 0:19 · “This is the one: inside the line, eyes on the ball.”</p> },
            { who: 'dit', s: 'explaining' as DitState, t: 'This is the one your coach flagged.', ui: <div className="obj-choices"><span className="choice">Show me the mistake</span><span className="choice">Explain it simply</span><span className="choice">What should I practise?</span><span className="choice">Ask my coach</span></div> },
            { who: 'dit', s: 'explaining' as DitState, t: 'Your coach already set a drill for exactly this.', ui: <p className="small">Sway ladder · 2× a week → opens Practice</p> },
          ].map((step, k) => (
            <div key={k} className="xd-step">
              <span className="xd-step-n num">{k + 1}</span>
              <div className="obj-say"><DitAvatar state={step.s} form="compact" size={26} still /><p>{step.t}</p></div>
              {step.ui}
            </div>
          ))}
        </div>
        <p className="small muted">Questions become headlines and answers become objects (clips, discs, drivers, next steps, reply options). Earlier exchanges collapse to one line, so the canvas never turns into a transcript.</p>
        <button className="btn btn-primary" onClick={() => open('athlete', 'p-tara', '/athlete/session/s-0991')}>Try it live (Flow B) <ArrowRight size={14} /></button>
      </section>

      {/* 4 — Dit Score visualisations */}
      <section className="xd-sec" aria-labelledby="x4">
        <h2 id="x4" className="xd-h">4 · Three Dit Score visualisations</h2>
        <div className="xd-viz" data-theme="floodlit" data-role="athlete">
          <figure><ScoreDiscs state={tara} size={260} /><figcaption><strong>V1 · Two Dits (recommended hero)</strong><br />Development and commitment as two translucent discs. The score sits where they overlap. Recognisable without a logo.</figcaption></figure>
          <figure><div style={{ display: 'grid', placeItems: 'center', minHeight: 220 }}><ScoreSignal state={tara} /></div><figcaption><strong>V2 · Signal (compact)</strong><br />Each input is a Morse mark that grows from dit to dah. Self-reported inputs are outlined. Used for chips, cards and coach lists.</figcaption></figure>
          <figure><div style={{ minHeight: 220, width: '100%' }}><ScoreStrata state={tara} /></div><figcaption><strong>V3 · Strata</strong><br />Stacked frosted plates; thickness shows weight, fill shows value. Honest but heavy. Kept for the coach review view.</figcaption></figure>
        </div>
        <div className="xd-roles">
          {(['athlete', 'parent', 'coach'] as const).map((r) => (
            <div key={r} data-theme="floodlit" data-role={r} className="xd-role-score">
              <ScoreDiscs state={tara} size={200} />
              <span className="xs" style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{r} theme</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ maxWidth: 420 }}><p className="small strong" style={{ marginBottom: 8 }}>Trend · Tara</p><ScoreTrend db={db} athleteId="a-tara" /></div>
        <p className="small muted">All values here are computed from prototype records with an illustrative method. See docs/05-dit-score-model.md.</p>
      </section>

      {/* 5 & 6 — integration */}
      <section className="xd-sec" aria-labelledby="x5">
        <h2 id="x5" className="xd-h">5 · Athlete home integration · 6 · Score explanation</h2>
        <div className="xd-split">
          <div className="stack gap-3">
            <p className="small">The home screen is ordered by what an athlete wants to know: score (with change), last session, focus, practice, coach tip. The companion stays as a compact face at the bottom right.
              It offers one suggestion at a time and never covers the navigation. The Dit Score chip in the header is the only place the number repeats.</p>
            <p className="small">Score explanation is a conversation over real components: “Why did it change?” returns the driver list with sources and trust labels, the weekly trend, and next steps from the coach’s plan.</p>
            <div className="row gap-2 wrap">
              <button className="btn btn-primary" onClick={() => open('athlete', 'p-tara', '/athlete')}>Athlete home (live)</button>
              <button className="btn" onClick={() => open('athlete', 'p-tara', '/athlete/score')}>Score explanation (live)</button>
              <button className="btn" onClick={() => open('parent', 'p-maya', '/parent?child=a-kabir')}>Parent version</button>
            </div>
          </div>
          <div className="xd-wire" aria-label="Athlete home layout">
            <div className="w1">Hi, Tara <span>·· 87</span></div>
            <div className="w2">Dit Score hero · ▲ change · “Why did it change?”</div>
            <div className="w3">Last session → summary (Flow B)</div>
            <div className="w3">Focus · goal</div>
            <div className="w3">Next practice · week dots</div>
            <div className="w4">dit nudge (dismissable) <span>(··)</span></div>
            <div className="w5">Home · Practice · ·· · Feedback · Progress</div>
          </div>
        </div>
      </section>
    </main>
  );
}
