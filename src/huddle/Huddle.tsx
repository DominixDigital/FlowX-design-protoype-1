import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, Check, ChevronDown, CircleDot, Mic, MicOff, Square, Triangle, X, FlaskConical, Minus } from 'lucide-react';
import { useStore, uid, nowISO } from '../store/store';
import { athleteById, areaById, fmtTime, sessionById } from '../store/selectors';
import { Seam, type SeamState } from '../components/Seam';
import { Button } from '../components/ui';
import {
  answer, capabilities, evidenceBrief, draftReportComment, explainReport, explainMoment, recentSummary, compareSessions,
  interpretVoiceNote, SAMPLE_VOICE_NOTES, type HuddleCtx, type HuddleObject,
} from './engine';
import { useSpeech } from './useSpeech';

export interface HuddleActions {
  /** Insert drafted text into the host form (e.g. report comment, reassessment note) */
  useText?: { label: string; run: (text: string) => void };
}

interface Play {
  id: string;
  ask: string;
  via: 'voice' | 'text' | 'prompt';
  status: 'thinking' | 'done';
  objects: HuddleObject[];
  voiceDraft?: { athleteId: string | null; areaId: string | null; text: string; saved?: boolean };
}

interface HuddleState {
  ctx: HuddleCtx | null;
  actions: HuddleActions;
  open: boolean;
  plays: Play[];
  seam: SeamState;
  setCtx: (ctx: HuddleCtx | null, actions?: HuddleActions) => void;
  openHuddle: (opts?: { ask?: string; voice?: boolean }) => void;
  close: () => void;
  ask: (q: string, via?: Play['via']) => void;
  voiceNote: (text: string) => void;
  startVoice: boolean;
  clearStartVoice: () => void;
}

const Ctx = createContext<HuddleState | null>(null);

export function HuddleProvider({ children }: { children: ReactNode }) {
  const { db } = useStore();
  const [ctx, setCtxState] = useState<HuddleCtx | null>(null);
  const [actions, setActions] = useState<HuddleActions>({});
  const [open, setOpen] = useState(false);
  const [plays, setPlays] = useState<Play[]>([]);
  const [startVoice, setStartVoice] = useState(false);
  const dbRef = useRef(db);
  dbRef.current = db;
  const ctxKey = useRef('');

  const setCtx = useCallback((c: HuddleCtx | null, a: HuddleActions = {}) => {
    const key = JSON.stringify(c);
    setActions(a);
    if (key === ctxKey.current) return;
    ctxKey.current = key;
    setCtxState(c);
    setPlays([]); // new screen context → fresh canvas
  }, []);

  const run = useCallback((q: string, via: Play['via'], produce: () => Partial<Play>) => {
    const id = uid('play');
    setPlays((p) => [...p, { id, ask: q, via, status: 'thinking', objects: [] }]);
    // A short, honest "working" beat: demo logic is local and instant.
    setTimeout(() => setPlays((p) => p.map((x) => (x.id === id ? { ...x, status: 'done', ...produce() } : x))), 650);
  }, []);

  const ask = useCallback(
    (q: string, via: Play['via'] = 'text') => {
      if (!ctx) return;
      run(q, via, () => {
        const d = dbRef.current;
        const s = q.toLowerCase();
        // Prompt chips map straight to known objects; free text goes through the router.
        if (s.startsWith('brief me') && ctx.reassessmentId) return { objects: evidenceBrief(d, ctx.reassessmentId) };
        if (s.startsWith('draft') && ctx.athleteId) return { objects: [draftReportComment(d, ctx.athleteId)] };
        if (s.startsWith('explain this report') && ctx.reportId) {
          const r = d.reports.find((x) => x.id === ctx.reportId);
          return { objects: r ? [explainReport(d, r)] : [] };
        }
        if (s.startsWith('explain') && ctx.videoId) {
          const v = d.videos.find((x) => x.id === ctx.videoId);
          const c = v?.comments.find((x) => x.shared);
          return { objects: c ? [explainMoment(d, v!.id, c.t)] : [] };
        }
        if (s.startsWith('summarise') && ctx.athleteId) return { objects: recentSummary(d, ctx.athleteId) };
        if (s.startsWith('compare') && ctx.athleteId) return { objects: [compareSessions(d, ctx.athleteId)] };
        if (s.startsWith('what can')) return { objects: [capabilities(ctx)] };
        return { objects: answer(d, ctx, q) };
      });
    },
    [ctx, run],
  );

  const voiceNote = useCallback(
    (text: string) => {
      if (!ctx) return;
      run(`“${text.length > 64 ? `${text.slice(0, 64)}…` : text}”`, 'voice', () => {
        const d = dbRef.current;
        const roster = ctx.sessionId ? Object.keys(sessionById(d, ctx.sessionId)?.attendance ?? {}) : ctx.athleteId ? [ctx.athleteId] : [];
        const r = interpretVoiceNote(d, text, roster.length ? roster : d.athletes.filter((a) => a.status === 'active').map((a) => a.id), ctx.athleteId);
        return { objects: [r.object], voiceDraft: { athleteId: r.athleteId, areaId: r.areaId, text: r.text } };
      });
    },
    [ctx, run],
  );

  const seam: SeamState = plays.some((p) => p.status === 'thinking') ? 'thinking' : ctx?.reassessmentId || ctx?.reportId || ctx?.videoId ? 'insight' : 'idle';

  const value = useMemo<HuddleState>(
    () => ({
      ctx, actions, open, plays, seam, setCtx, ask, voiceNote, startVoice,
      clearStartVoice: () => setStartVoice(false),
      openHuddle: (opts) => {
        setOpen(true);
        if (opts?.voice) setStartVoice(true);
        if (opts?.ask) setTimeout(() => ask(opts.ask!, 'prompt'), 0);
      },
      close: () => setOpen(false),
    }),
    [ctx, actions, open, plays, seam, setCtx, ask, voiceNote, startVoice],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHuddle() {
  const h = useContext(Ctx);
  if (!h) throw new Error('useHuddle outside provider');
  return h;
}

/** Screens declare what Huddle can see. Context follows the screen, role and selected entity. */
export function useHuddleContext(ctx: HuddleCtx | null, actions?: HuddleActions) {
  const { setCtx } = useHuddle();
  const key = JSON.stringify(ctx);
  const actRef = useRef(actions);
  actRef.current = actions;
  useEffect(() => {
    setCtx(ctx, actRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setCtx]);
}

/* ───────────────────────── Launcher ───────────────────────── */

export function SeamButton({ variant = 'inline' }: { variant?: 'inline' | 'fab' }) {
  const { openHuddle, seam, ctx } = useHuddle();
  return (
    <button
      className={`seam-btn ${variant === 'fab' ? 'seam-fab' : ''}`}
      onClick={() => openHuddle()}
      aria-label={`Open Huddle${seam === 'insight' ? ' — an insight is available for this screen' : ''}`}
      disabled={!ctx}
      title={ctx ? `Huddle · ${ctx.title}` : 'Huddle'}
    >
      <Seam state={seam} size={variant === 'fab' ? 30 : 22} />
      {variant === 'inline' && <span>Huddle</span>}
    </button>
  );
}

/* ───────────────────────── Canvas ───────────────────────── */

export function HuddleCanvas({ variant }: { variant: 'sheet' | 'panel' }) {
  const h = useHuddle();
  const { ctx, open, plays, close } = h;
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeech((t) => {
    h.voiceNote(t);
    speech.setState('idle');
  });

  useEffect(() => {
    if (open && h.startVoice) {
      h.clearStartVoice();
      if (speech.supported) speech.start();
    }
  }, [open, h, speech]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    setExpanded(null);
  }, [plays.length]);

  if (!open || !ctx) return null;

  const submit = () => {
    if (!text.trim()) return;
    h.ask(text.trim());
    setText('');
  };

  const latest = plays[plays.length - 1];
  const listening = speech.state === 'listening';
  const canVoice = ctx.surface === 'coach';

  return (
    <>
      {variant === 'sheet' && <div className="scrim" onClick={close} aria-hidden />}
      <section
        className={`huddle ${variant === 'sheet' ? 'huddle-sheet' : 'huddle-panel'}`}
        data-theme="floodlit"
        role="dialog"
        aria-modal={variant === 'sheet'}
        aria-label="Huddle assistant"
      >
        <header className="huddle-head">
          <Seam state={listening ? 'listening' : h.seam === 'thinking' ? 'thinking' : latest?.status === 'done' ? 'done' : 'idle'} size={30} />
          <div className="grow stack" style={{ gap: 4 }}>
            <span className="display" style={{ fontSize: '1.6rem' }}>Huddle</span>
            <span className="huddle-context" title={ctx.title}>Looking at: {ctx.title}</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close} aria-label="Close Huddle">
            <X size={18} />
          </button>
        </header>

        <div className="huddle-scroll" ref={scrollRef}>
          <div className="huddle-demo">
            <FlaskConical size={14} aria-hidden style={{ flex: 'none', marginTop: 1 }} />
            <span>Demo logic: no AI service is connected. Huddle reads only records shown in this prototype, and you confirm anything it would change.</span>
          </div>

          {plays.length === 0 && (
            <div className="play" style={{ borderTop: 0 }}>
              <p className="play-ask"><small>Ask about what’s on screen</small>{intro(ctx)}</p>
            </div>
          )}

          {plays.map((p, i) => {
            const isLatest = i === plays.length - 1;
            if (!isLatest && expanded !== p.id) {
              return (
                <button key={p.id} className="play-collapsed" onClick={() => setExpanded(p.id)} aria-expanded="false">
                  <Minus size={14} aria-hidden />
                  <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.ask}</span>
                  <span className="xs">{p.objects.length} item{p.objects.length === 1 ? '' : 's'}</span>
                  <ChevronDown size={14} aria-hidden />
                </button>
              );
            }
            return (
              <article key={p.id} className="play" aria-busy={p.status === 'thinking'}>
                <h3 className="play-ask">
                  <small>{p.via === 'voice' ? <><Mic size={12} aria-hidden /> Your voice note</> : 'You asked'}</small>
                  {p.ask}
                </h3>
                {p.status === 'thinking' ? (
                  <div className="thinking-line" role="status"><Seam state="thinking" size={20} /> Reading the records…</div>
                ) : (
                  <div className="play-objects">
                    {p.objects.map((o, j) => <ObjectView key={j} o={o} />)}
                    {p.voiceDraft && <ObservationDraft play={p} />}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="dock">
          {listening || speech.state === 'error' ? (
            <div className="listening" role="status" aria-live="polite">
              {listening ? (
                <>
                  <div className="row gap-3">
                    <div className="wave" aria-hidden>{Array.from({ length: 14 }, (_, k) => <span key={k} />)}</div>
                    <span className="small strong">Listening — speak your note</span>
                  </div>
                  <p className="live-transcript">{speech.transcript || <span className="muted">Live transcript appears here so you can catch mistakes.</span>}</p>
                  <div className="row gap-2">
                    <Button variant="highlight" size="sm" icon={<Square size={12} fill="currentColor" />} onClick={speech.stop}>Stop and interpret</Button>
                    <Button size="sm" variant="ghost" onClick={() => { speech.setTranscript(''); speech.setState('idle'); }}>Discard</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="small" style={{ color: 'var(--err)' }}>{speech.error}</p>
                  {speech.transcript && <p className="live-transcript">{speech.transcript}</p>}
                  <div className="row gap-2">
                    {speech.transcript && <Button size="sm" variant="highlight" onClick={() => { h.voiceNote(speech.transcript); speech.setState('idle'); }}>Use what was heard</Button>}
                    <Button size="sm" onClick={() => { setText(speech.transcript); speech.setState('idle'); inputRef.current?.focus(); }}>Type instead</Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="dock-prompts" role="group" aria-label="Suggested prompts">
                {ctx.prompts.map((pr) => (
                  <button key={pr} onClick={() => h.ask(pr, 'prompt')}>{pr}</button>
                ))}
                {canVoice && SAMPLE_VOICE_NOTES.coach && (
                  <button onClick={() => h.voiceNote(SAMPLE_VOICE_NOTES.coach)} title="Plays a scripted voice note for demo purposes">
                    Sample voice note (demo)
                  </button>
                )}
              </div>
              <form className="dock-row" onSubmit={(e) => { e.preventDefault(); submit(); }}>
                <label htmlFor="huddle-input" className="sr-only">Ask Huddle</label>
                <textarea
                  id="huddle-input"
                  ref={inputRef}
                  className="dock-input"
                  rows={1}
                  placeholder={canVoice ? 'Ask, or tap the mic' : 'Ask about this screen'}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                />
                {canVoice && (
                  <button
                    type="button"
                    className="mic"
                    aria-pressed={listening}
                    onClick={() => (listening ? speech.stop() : speech.start())}
                    disabled={!speech.supported}
                    aria-label={speech.supported ? 'Record a voice note' : 'Voice input is not available in this browser'}
                    title={speech.supported ? 'Record a voice note' : 'Voice input is not available in this browser — type instead'}
                  >
                    {speech.supported ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                )}
                <button type="submit" className="mic send" aria-label="Send" disabled={!text.trim()}>
                  <ArrowUp size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function intro(ctx: HuddleCtx) {
  if (ctx.reassessmentId) return 'Want the evidence before you decide?';
  if (ctx.reportId) return 'Anything in this report unclear?';
  if (ctx.videoId) return 'Want the coach’s point unpacked?';
  if (ctx.surface === 'coach') return 'Talk a note, or ask about this athlete.';
  return 'What do you need from these records?';
}

/* ───────────────────────── Objects ───────────────────────── */

const toneMark = (t?: 'positive' | 'concern' | 'neutral') =>
  t === 'positive' ? <CircleDot className="ev-mark" color="#d7ff3c" aria-label="reads as progress" />
    : t === 'concern' ? <Triangle className="ev-mark" color="#f2c14e" aria-label="reads as concern" />
      : <Square className="ev-mark" color="#919c95" aria-label="neutral" />;

function Basis({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <details className="obj-foot">
      <summary>Based on {items.length} record{items.length === 1 ? '' : 's'}</summary>
      <ul>{items.map((b) => <li key={b}>{b}</li>)}</ul>
    </details>
  );
}

function ObjectView({ o }: { o: HuddleObject }) {
  const h = useHuddle();
  switch (o.type) {
    case 'facts':
      return (
        <div className="obj">
          <div className="obj-title">{o.heading}<span className="xs muted">Recorded</span></div>
          <div className="facts">
            {o.items.map((f) => (
              <div className="fact" key={f.label}>
                <span className="num">{f.value}</span>
                <span className="fact-label">{f.label}</span>
                <span className="fact-basis">{f.basis}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'evidence':
      return (
        <div className="obj">
          <div className="obj-title">{o.heading}<span className="xs muted">{o.items.length} linked</span></div>
          {o.items.length === 0 ? <p className="small muted">Nothing linked yet.</p> : (
            <ul className="evidence">
              {o.items.map((e) => (
                <li key={e.ref.id}>
                  {toneMark(e.tone)}
                  <div>
                    <div className="ev-text">{e.text}</div>
                    <div className="ev-meta">{e.date} · {e.ref.label}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case 'suggestion':
      return (
        <div className="obj suggestion">
          <div className="obj-title" style={{ justifyContent: 'flex-start' }}><span className="tag-suggestion">Suggestion</span></div>
          <p style={{ color: 'var(--chalk-50)', fontWeight: 600 }}>{o.text}</p>
          <Basis items={o.why} />
        </div>
      );
    case 'compare':
      return (
        <div className="obj">
          <div className="obj-title">{o.heading}</div>
          <div className="compare">
            <div><div className="xs muted">{o.left.label}</div><ul>{o.left.items.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><div className="xs muted">{o.right.label}</div><ul>{o.right.items.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>
        </div>
      );
    case 'explainer':
      return (
        <div className="obj explainer">
          <div className="obj-title">{o.heading}<span className="xs muted">From the published report</span></div>
          {o.sections.map((s, i) => (
            <details key={s.q} open={i === 0}>
              <summary>{s.q}</summary>
              <p>{s.a}</p>
            </details>
          ))}
        </div>
      );
    case 'draft':
      return <DraftView o={o} useText={h.actions.useText} />;
    case 'moment':
      return (
        <div className="obj">
          <div className="moment-frame">
            <svg viewBox="0 0 400 225" width="100%" height="100%" aria-hidden style={{ position: 'absolute', inset: 0 }}>
              <rect width="400" height="225" fill="#0f3324" />
              <path d="M170 40 L230 40 L300 225 L100 225 Z" fill="rgba(255,255,255,0.06)" />
              <path d="M118 190 L282 190" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
            </svg>
            <span className="moment-time">{fmtTime(o.t)}</span>
          </div>
          <p className="xs muted" style={{ marginTop: 10 }}>Coach’s comment on {o.videoTitle}</p>
          <p style={{ color: 'var(--chalk-50)', fontWeight: 600 }}>“{o.coachText}”</p>
          <div className="obj suggestion" style={{ marginTop: 12 }}>
            <div className="obj-title" style={{ justifyContent: 'flex-start' }}><span className="tag-suggestion">Practice cue · suggestion</span></div>
            <p className="small" style={{ color: 'var(--chalk-50)' }}>{o.cue}</p>
            {o.drill && <p className="xs muted" style={{ marginTop: 6 }}>Your assigned drill: {o.drill}</p>}
          </div>
        </div>
      );
    case 'capabilities':
      return (
        <div className="obj">
          <div className="obj-title">{o.heading}</div>
          <ul className="small" style={{ margin: 0, paddingLeft: 18, color: 'var(--chalk-50)', display: 'grid', gap: 4 }}>
            {o.items.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      );
    case 'notice':
      return <div className="obj" style={{ borderColor: o.tone === 'warn' ? '#f2c14e' : 'var(--line)' }}><p className="small">{o.text}</p></div>;
    case 'interpretation':
      return (
        <div className="obj">
          <div className="obj-title">{o.heading}<span className="tag-suggestion">Interpretation</span></div>
          <dl className="field-rows" style={{ margin: 0 }}>
            {o.fields.map((f) => (
              <div className="field-row" key={f.label}>
                <dt>{f.label}</dt>
                <dd>
                  <span>{f.value}</span>
                  {f.confidence && (
                    <span className={`conf conf-${f.confidence}`}>
                      {f.confidence === 'clear' ? <><Check size={10} /> Clear</> : 'Check'}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <Basis items={o.basis.map((b) => b.label)} />
        </div>
      );
    case 'proposal':
      return null;
  }
}

function DraftView({ o, useText }: { o: Extract<HuddleObject, { type: 'draft' }>; useText?: HuddleActions['useText'] }) {
  const [text, setText] = useState(o.text);
  const [used, setUsed] = useState(false);
  return (
    <div className="obj proposal">
      <div className="obj-title">{o.heading}<span className="tag-suggestion">Draft · edit freely</span></div>
      <label className="sr-only" htmlFor="draft-text">Draft text</label>
      <textarea id="draft-text" className="draft-text" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="proposal-actions">
        {useText ? (
          <Button variant="highlight" size="sm" disabled={used || !text.trim()} onClick={() => { useText.run(text); setUsed(true); }} icon={<Check size={14} />}>
            {used ? 'Inserted — review before approving' : useText.label}
          </Button>
        ) : <span className="xs muted">Open the report composer to use this draft.</span>}
      </div>
      <Basis items={o.basis.map((b) => b.label)} />
    </div>
  );
}

/** CM05: editable proposal — nothing is saved until the coach confirms. */
function ObservationDraft({ play }: { play: Play }) {
  const { db, command, toast, personas } = useStore();
  const h = useHuddle();
  const ctx = h.ctx!;
  const d = play.voiceDraft!;
  const [athleteId, setAthleteId] = useState(d.athleteId ?? '');
  const [areaId, setAreaId] = useState(d.areaId ?? '');
  const [text, setText] = useState(d.text);
  const [state, setState] = useState<'editing' | 'saving' | 'saved' | 'discarded'>('editing');
  const roster = ctx.sessionId ? Object.keys(sessionById(db, ctx.sessionId)?.attendance ?? {}) : db.athletes.filter((a) => a.status === 'active').map((a) => a.id);
  const areas = db.areas.filter((a) => a.athleteId === athleteId && (a.status === 'active' || a.status === 'reopened'));
  const coachId = db.people.find((p) => p.id === personas.coach.personId)?.coachId ?? 'c-neha';

  if (state === 'discarded') return <p className="xs muted">Draft discarded. Nothing was saved.</p>;
  if (state === 'saved') {
    return (
      <div className="obj" style={{ borderColor: 'var(--lime-400)' }}>
        <p className="small" style={{ color: 'var(--chalk-50)' }}>
          <Check size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Saved to {athleteById(db, athleteId)?.name}’s record
          {areaId ? ` under “${areaById(db, areaId)?.title}”` : ' as unstructured'}. Marked “AI-drafted, coach-confirmed”.
        </p>
      </div>
    );
  }

  const save = async () => {
    if (!athleteId || !text.trim()) return;
    setState('saving');
    const id = uid('o');
    const res = await command({
      kind: 'observation',
      label: `Observation · ${athleteById(db, athleteId)?.name}`,
      refId: id,
      apply: (x) => {
        x.observations.push({
          id, athleteId, sessionId: ctx.sessionId ?? null, areaId: areaId || null, text: text.trim(), source: 'voice', aiDrafted: true,
          authorId: coachId, createdAt: nowISO(), sync: 'queued', status: 'saved',
        });
      },
      setSync: (x, s) => { const o = x.observations.find((y) => y.id === id); if (o) o.sync = s; },
    });
    setState('saved');
    toast({ tone: res === 'failed' ? 'err' : res === 'queued' ? 'warn' : 'ok', text: res === 'queued' ? 'Observation saved on this device. It will sync when you’re back online.' : res === 'failed' ? 'Saved on this device, but the upload failed. Retry from the sync queue.' : 'Observation saved.' });
  };

  return (
    <div className="obj proposal">
      <div className="obj-title">Confirm before saving<span className="xs muted">CM05.03 → CM05.05</span></div>
      <div className="stack gap-3">
        <div className="field">
          <label htmlFor={`va-${play.id}`} style={{ color: 'var(--chalk-50)' }}>Athlete</label>
          <select id={`va-${play.id}`} className="select" value={athleteId} onChange={(e) => { setAthleteId(e.target.value); setAreaId(''); }} aria-invalid={!athleteId}>
            <option value="">Choose athlete…</option>
            {roster.map((id) => <option key={id} value={id}>{athleteById(db, id)?.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`vt-${play.id}`} style={{ color: 'var(--chalk-50)' }}>Note</label>
          <textarea id={`vt-${play.id}`} className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`vd-${play.id}`} style={{ color: 'var(--chalk-50)' }}>Development area</label>
          <select id={`vd-${play.id}`} className="select" value={areaId} onChange={(e) => setAreaId(e.target.value)} disabled={!athleteId}>
            <option value="">Leave unstructured (CM05.06)</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </div>
      </div>
      <div className="proposal-actions">
        <Button variant="highlight" onClick={save} pending={state === 'saving'} disabled={!athleteId || !text.trim()} icon={<Check size={16} />}>
          Save observation
        </Button>
        <Button variant="ghost" onClick={() => setState('discarded')}>Discard</Button>
      </div>
      {!athleteId && <p className="xs" style={{ color: '#f2c14e', marginTop: 8 }}>Choose an athlete to save — Huddle didn’t hear a name it could match.</p>}
    </div>
  );
}
