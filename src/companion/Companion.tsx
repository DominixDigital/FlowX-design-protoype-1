import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, Check, ChevronDown, CircleDot, Mic, MicOff, Square, Triangle, X, FlaskConical, Minus, BellOff, Bell, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore, uid, nowISO } from '../store/store';
import { athleteById, areaById, fmtTime, sessionById } from '../store/selectors';
import { DitAvatar, type DitState } from './DitAvatar';
import { ScoreDiscs, ScoreTrend, computeDitScore } from '../score/ScoreViz';
import { Clip } from '../components/art';
import type { SeamState } from '../components/Seam';
import { Button } from '../components/ui';
import {
  answer, capabilities, evidenceBrief, draftReportComment, explainReport, explainMoment, recentSummary, compareSessions,
  interpretVoiceNote, SAMPLE_VOICE_NOTES, ditdit, ROLE_GREETING, tone, isUnmatched, type CompanionCtx, type CompanionObject,
} from './engine';
import { useSpeech } from './useSpeech';
import { askGemini } from './gemini';

export interface CompanionActions {
  /** Insert drafted text into the host form (e.g. report comment, reassessment note) */
  useText?: { label: string; run: (text: string) => void };
}

interface Play {
  id: string;
  ask: string;
  via: 'voice' | 'text' | 'prompt';
  status: 'thinking' | 'done';
  objects: CompanionObject[];
  voiceDraft?: { athleteId: string | null; areaId: string | null; text: string; saved?: boolean };
}

interface CompanionState {
  ctx: CompanionCtx | null;
  actions: CompanionActions;
  open: boolean;
  plays: Play[];
  seam: SeamState;
  setCtx: (ctx: CompanionCtx | null, actions?: CompanionActions) => void;
  openCompanion: (opts?: { ask?: string; voice?: boolean }) => void;
  close: () => void;
  ask: (q: string, via?: Play['via']) => void;
  voiceNote: (text: string) => void;
  startVoice: boolean;
  clearStartVoice: () => void;
}

const Ctx = createContext<CompanionState | null>(null);

export function CompanionProvider({ children }: { children: ReactNode }) {
  const { db } = useStore();
  const [ctx, setCtxState] = useState<CompanionCtx | null>(null);
  const [actions, setActions] = useState<CompanionActions>({});
  const [open, setOpen] = useState(false);
  const [plays, setPlays] = useState<Play[]>([]);
  const [startVoice, setStartVoice] = useState(false);
  const dbRef = useRef(db);
  dbRef.current = db;
  const ctxKey = useRef('');

  const setCtx = useCallback((c: CompanionCtx | null, a: CompanionActions = {}) => {
    const key = JSON.stringify(c);
    setActions(a);
    if (key === ctxKey.current) return;
    ctxKey.current = key;
    setCtxState((prev) => {
      // Switching apps (surface) minimises dit so it never covers another app's screen.
      if (prev && c && prev.surface !== c.surface) setOpen(false);
      return c;
    });
    setPlays([]); // new screen context → fresh canvas
  }, []);

  const run = useCallback((q: string, via: Play['via'], produce: () => Partial<Play> & { then?: () => Promise<CompanionObject[] | null> }) => {
    const id = uid('play');
    setPlays((p) => [...p, { id, ask: q, via, status: 'thinking', objects: [] }]);
    // A short, honest "working" beat: demo logic is local and instant.
    setTimeout(() => {
      const { then, ...out } = produce();
      if (!then) { setPlays((p) => p.map((x) => (x.id === id ? { ...x, status: 'done', ...out } : x))); return; }
      // Rule router had no answer: try Gemini; keep dit "thinking" until it replies, fall back to the rule-based notice on any failure.
      then().then((ai) => setPlays((p) => p.map((x) => (x.id === id ? { ...x, status: 'done', ...out, objects: ai ?? out.objects ?? [] } : x))));
    }, 650);
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
        const dd = ditdit(d, ctx, q);
        if (dd) return { objects: dd };
        const fallback = answer(d, ctx, q);
        if (!isUnmatched(fallback)) return { objects: fallback };
        return {
          objects: fallback,
          then: async () => {
            const r = await askGemini(dbRef.current, ctx, q);
            if (r.ok) return r.objects;
            if (r.reason === 'rate') return [{ type: 'notice', tone: 'info', text: 'The AI service is busy right now. Showing what dit can do without it.' } as CompanionObject, ...fallback.slice(1)];
            return null;
          },
        };
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

  const value = useMemo<CompanionState>(
    () => ({
      ctx, actions, open, plays, seam, setCtx, ask, voiceNote, startVoice,
      clearStartVoice: () => setStartVoice(false),
      openCompanion: (opts) => {
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

export function useCompanion() {
  const h = useContext(Ctx);
  if (!h) throw new Error('useCompanion outside provider');
  return h;
}

/** Screens declare what Companion can see. Context follows the screen, role and selected entity. */
export function useCompanionContext(ctx: CompanionCtx | null, actions?: CompanionActions) {
  const { setCtx } = useCompanion();
  const key = JSON.stringify(ctx);
  const actRef = useRef(actions);
  actRef.current = actions;
  useEffect(() => {
    setCtx(ctx, actRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setCtx]);
}

/* ───────────────────────── Launcher ───────────────────────── */

/** Per-person companion preferences (intro seen, quiet mode, dismissed nudges). */
export function useCompanionPrefs(surface: 'athlete' | 'parent' | 'coach' | 'web') {
  const { db, personas, update } = useStore();
  const key = `${surface}:${personas[surface].personId}`;
  const prefs = db.companionPrefs[key] ?? { introSeen: false, quiet: false, dismissedNudges: [] };
  const set = (patch: Partial<typeof prefs>) => update((d) => { d.companionPrefs[key] = { ...prefs, ...patch }; });
  return { prefs, set };
}

/** Compact presence: the face, never an orb. Shows "insight" when the screen has something relevant. */
export function SeamButton({ variant = 'inline' }: { variant?: 'inline' | 'fab' }) {
  const { openCompanion, seam, ctx } = useCompanion();
  const state: DitState = seam === 'thinking' ? 'thinking' : seam === 'insight' ? 'insight' : 'idle';
  return (
    <button
      className={`seam-btn ${variant === 'fab' ? 'seam-fab' : ''}`}
      onClick={() => openCompanion()}
      aria-label={`Ask dit${seam === 'insight' ? ' — something relevant is ready for this screen' : ''}`}
      disabled={!ctx}
      title={ctx ? `dit · ${ctx.title}` : 'dit'}
    >
      <DitAvatar state={state} size={variant === 'fab' ? 40 : 28} form="face" />
      {variant === 'inline' && <span>Ask dit</span>}
    </button>
  );
}

/** A proactive suggestion anchored to the companion. Dismissable; silenced by quiet mode. */
export function CompanionNudge({ id, surface, text, ask, cta = 'Show me' }: { id: string; surface: 'athlete' | 'parent' | 'coach' | 'web'; text: string; ask: string; cta?: string }) {
  const { openCompanion } = useCompanion();
  const { prefs, set } = useCompanionPrefs(surface);
  if (prefs.quiet || prefs.dismissedNudges.includes(id)) return null;
  return (
    <div className="dit-nudge" role="status">
      <DitAvatar state="insight" size={34} form="face" />
      <p className="grow small">{text}</p>
      <div className="row gap-1">
        <button className="btn btn-sm btn-highlight" onClick={() => openCompanion({ ask })}>{cta}</button>
        <button className="btn btn-sm btn-ghost btn-icon" aria-label="Dismiss suggestion" onClick={() => set({ dismissedNudges: [...prefs.dismissedNudges, id] })}><X size={14} /></button>
      </div>
    </div>
  );
}

function QuietToggle() {
  const { ctx } = useCompanion();
  const surface = ctx?.surface ?? 'coach';
  const { prefs, set } = useCompanionPrefs(surface);
  return (
    <button className="btn btn-ghost btn-icon btn-sm" aria-pressed={prefs.quiet} onClick={() => set({ quiet: !prefs.quiet })}
      title={prefs.quiet ? 'Quiet mode is on: dit only answers when asked' : 'Turn on quiet mode: no suggestions'}
      aria-label={prefs.quiet ? 'Quiet mode on. Turn off' : 'Turn on quiet mode'}>
      {prefs.quiet ? <BellOff size={16} /> : <Bell size={16} />}
    </button>
  );
}

/* ───────────────────────── Canvas ───────────────────────── */

export function CompanionCanvas({ variant }: { variant: 'sheet' | 'panel' }) {
  const h = useCompanion();
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
        className={`companion ${variant === 'sheet' ? 'companion-sheet' : 'companion-panel'}`}
        data-theme="floodlit"
        role="dialog"
        aria-modal={variant === 'sheet'}
        aria-label="dit, your ditdit companion"
      >
        <header className="companion-head">
          <DitAvatar state={listening ? 'listening' : h.seam === 'thinking' ? 'thinking' : moodOf(latest)} size={40} form="face" />
          <div className="grow stack" style={{ gap: 4, minWidth: 0 }}>
            <span className="companion-name">dit</span>
            <span className="companion-context" title={ctx.title}>Looking at: {ctx.title}</span>
          </div>
          <QuietToggle />
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close} aria-label="Minimise dit">
            <Minus size={18} />
          </button>
        </header>

        <div className="companion-scroll" ref={scrollRef}>
          <div className="companion-demo">
            <FlaskConical size={14} aria-hidden style={{ flex: 'none', marginTop: 1 }} />
            <span>Demo logic: no AI service is connected. dit reads only records shown in this prototype, follows your coach’s approved information, and you confirm anything it would change.</span>
          </div>

          {plays.length === 0 && (
            <div className="play" style={{ borderTop: 0 }}>
              <p className="play-ask"><small>{ROLE_GREETING[ctx.surface === 'athlete' ? 'athlete' : ctx.surface === 'parent' ? 'parent' : 'coach']}</small>{intro(ctx)}</p>
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
                  <small>{p.via === 'voice' ? <><Mic size={12} aria-hidden /> Your voice note</> : p.via === 'prompt' ? 'You chose' : 'You asked'}</small>
                  {p.ask}
                </h3>
                {p.status === 'thinking' ? (
                  <div className="thinking-line" role="status"><DitAvatar state="thinking" size={22} form="compact" /> Reading the records…</div>
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
                <label htmlFor="companion-input" className="sr-only">Ask dit</label>
                <textarea
                  id="companion-input"
                  ref={inputRef}
                  className="dock-input"
                  rows={1}
                  placeholder={canVoice ? 'Ask dit, or tap the mic' : 'Ask dit'}
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

function moodOf(p?: Play): DitState {
  if (!p || p.status !== 'done') return 'idle';
  const say = [...p.objects].reverse().find((o) => o.type === 'say') as Extract<CompanionObject, { type: 'say' }> | undefined;
  if (say?.mood) return say.mood;
  if (p.objects.some((o) => o.type === 'notice')) return 'uncertain';
  return 'explaining';
}

function intro(ctx: CompanionCtx) {
  if (ctx.surface === 'athlete') return ctx.sessionId ? 'Want to go through your session?' : 'What do you want to know?';
  if (ctx.surface === 'parent') return 'Anything you’d like explained?';
  if (ctx.reassessmentId) return 'Want the evidence before you decide?';
  if (ctx.reportId) return 'Anything in this report unclear?';
  if (ctx.videoId) return 'Want the coach’s point unpacked?';
  if (ctx.surface === 'coach') return 'Talk a note, or ask about this athlete.';
  return 'What do you need from these records?';
}

/* ───────────────────────── Objects ───────────────────────── */

const toneMark = (t?: 'positive' | 'concern' | 'neutral') =>
  t === 'positive' ? <CircleDot className="ev-mark" color="var(--hl)" aria-label="reads as progress" />
    : t === 'concern' ? <Triangle className="ev-mark" color="var(--warn)" aria-label="reads as concern" />
      : <Square className="ev-mark" color="var(--text-muted)" aria-label="neutral" />;

function Basis({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <details className="obj-foot">
      <summary>Based on {items.length} record{items.length === 1 ? '' : 's'}</summary>
      <ul>{items.map((b) => <li key={b}>{b}</li>)}</ul>
    </details>
  );
}

function ObjectView({ o }: { o: CompanionObject }) {
  const h = useCompanion();
  const { db } = useStore();
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
          <p style={{ color: 'var(--grey-50)', fontWeight: 600 }}>{o.text}</p>
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
              <rect width="400" height="225" style={{ fill: "var(--char-500)" }} />
              <path d="M170 40 L230 40 L300 225 L100 225 Z" fill="rgba(255,255,255,0.06)" />
              <path d="M118 190 L282 190" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
            </svg>
            <span className="moment-time">{fmtTime(o.t)}</span>
          </div>
          <p className="xs muted" style={{ marginTop: 10 }}>Coach’s comment on {o.videoTitle}</p>
          <p style={{ color: 'var(--grey-50)', fontWeight: 600 }}>“{o.coachText}”</p>
          <div className="obj suggestion" style={{ marginTop: 12 }}>
            <div className="obj-title" style={{ justifyContent: 'flex-start' }}><span className="tag-suggestion">Practice cue · suggestion</span></div>
            <p className="small" style={{ color: 'var(--grey-50)' }}>{o.cue}</p>
            {o.drill && <p className="xs muted" style={{ marginTop: 6 }}>Your assigned drill: {o.drill}</p>}
          </div>
        </div>
      );
    case 'capabilities':
      return (
        <div className="obj">
          <div className="obj-title">{o.heading}</div>
          <ul className="small" style={{ margin: 0, paddingLeft: 18, color: 'var(--grey-50)', display: 'grid', gap: 4 }}>
            {o.items.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      );
    case 'ai':
      return (
        <div className="obj">
          <div className="obj-title">Answer<span className="tag-suggestion">AI-generated · {o.model}</span></div>
          <p className="small" style={{ color: 'var(--grey-50)' }}>{o.text}</p>
          {o.points.length > 0 && <ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--grey-50)', display: 'grid', gap: 4 }}>{o.points.map((x) => <li key={x}>{x}</li>)}</ul>}
          {o.basis.length > 0 && <Basis items={o.basis} />}
          <p className="xs muted" style={{ marginTop: 8 }}>Written by an AI model from the records on this screen. Your coach is the source of truth.</p>
        </div>
      );
    case 'notice':
      return <div className="obj" style={{ borderColor: o.tone === "warn" ? "var(--warn)" : "var(--line)" }}><p className="small">{o.text}</p></div>;
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
    case 'say':
      return (
        <div className="obj-say">
          <DitAvatar state={o.mood ?? 'explaining'} size={26} form="compact" still />
          <p>{o.text}</p>
        </div>
      );
    case 'choices':
      return <Choices options={o.options} />;
    case 'score': {
      const st = computeDitScore(db, o.athleteId);
      return (
        <div className="obj obj-score">
          <ScoreDiscs state={st} size={250} />
          <p className="xs muted" style={{ textAlign: 'center' }}>Illustrative prototype score · method not yet validated</p>
        </div>
      );
    }
    case 'trend':
      return <div className="obj"><div className="obj-title">Week by week</div><ScoreTrend db={db} athleteId={o.athleteId} /></div>;
    case 'drivers':
      return (
        <div className="obj">
          <div className="obj-title">{o.heading}<span className="xs muted">Illustrative weights</span></div>
          {o.items.length === 0 && <p className="small muted">Nothing changed underneath.</p>}
          <ul className="evidence">
            {o.items.map((d) => (
              <li key={d.label}>
                <span className="num" style={{ fontSize: '1.1rem', color: d.impact >= 0 ? 'var(--ok)' : 'var(--warn)' }}>{d.impact >= 0 ? '▲' : '▼'}</span>
                <div>
                  <div className="ev-text">{d.label}: {d.from ?? '—'} → {d.to ?? '—'}</div>
                  <div className="ev-meta">{d.source}{d.trust === 'self_reported' ? ' · self-reported' : d.trust === 'coach_approved' ? ' · coach-confirmed' : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'nextsteps':
      return (
        <div className="obj suggestion">
          <div className="obj-title" style={{ justifyContent: 'flex-start' }}><span className="tag-suggestion">{o.heading}</span></div>
          <ul className="evidence">
            {o.items.map((it) => (
              <li key={it.text}>
                <ArrowRight size={14} className="ev-mark" />
                <div><div className="ev-text">{it.text}</div><div className="ev-meta">{it.source}</div>{it.to && <NavBtn to={it.to}>Open</NavBtn>}</div>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'clip': {
      const v = db.videos.find((x) => x.id === o.videoId);
      if (!v) return null;
      return (
        <div className="obj">
          <div style={{ position: 'relative' }}>
            <Clip video={v} compact />
            <span className="moment-time">{fmtTime(o.t)}</span>
            <span className="badge" style={{ position: 'absolute', right: 10, top: 10, background: 'rgba(0,0,0,.45)', color: '#fff' }}><Play size={11} /> no media in prototype</span>
          </div>
          <p style={{ marginTop: 10, fontWeight: 600 }}>Coach at {fmtTime(o.t)}: “{o.text}”</p>
        </div>
      );
    }
    case 'proposal':
      return null;
  }
}

function DraftView({ o, useText }: { o: Extract<CompanionObject, { type: 'draft' }>; useText?: CompanionActions['useText'] }) {
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
  const h = useCompanion();
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
      <>
        <div className="obj" style={{ borderColor: 'var(--hl)' }}>
          <p className="small" style={{ color: 'var(--grey-50)' }}>
            <Check size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Saved to {athleteById(db, athleteId)?.name}’s record
            {areaId ? ` under “${areaById(db, areaId)?.title}”` : ' as unstructured'}. Marked “AI-drafted, coach-confirmed”. Coaches only so far.
          </p>
        </div>
        <ShareWithAthlete athleteId={athleteId} sessionId={ctx.sessionId ?? null} note={text} coachId={coachId} />
      </>
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
          <label htmlFor={`va-${play.id}`} style={{ color: 'var(--grey-50)' }}>Athlete</label>
          <select id={`va-${play.id}`} className="select" value={athleteId} onChange={(e) => { setAthleteId(e.target.value); setAreaId(''); }} aria-invalid={!athleteId}>
            <option value="">Choose athlete…</option>
            {roster.map((id) => <option key={id} value={id}>{athleteById(db, id)?.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`vt-${play.id}`} style={{ color: 'var(--grey-50)' }}>Note</label>
          <textarea id={`vt-${play.id}`} className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`vd-${play.id}`} style={{ color: 'var(--grey-50)' }}>Development area</label>
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
      {!athleteId && <p className="xs" style={{ color: "var(--warn)", marginTop: 8 }}>Choose an athlete to save — dit didn’t hear a name it could match.</p>}
    </div>
  );
}

function NavBtn({ to, children }: { to: string; children: ReactNode }) {
  const nav = useNavigate();
  const { close } = useCompanion();
  return <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => { close(); nav(to); }}>{children}</button>;
}

/** Reply options: conversation moves forward by choosing, not only typing. */
function Choices({ options }: { options: { label: string; ask?: string; to?: string; action?: 'ask_coach' }[] }) {
  const h = useCompanion();
  const nav = useNavigate();
  const { db, update, toast } = useStore();
  const [asked, setAsked] = useState(false);
  if (!options.length) return null;
  return (
    <div className="obj-choices" role="group" aria-label="Reply options">
      {options.map((op) => (
        <button key={op.label} className="choice" disabled={op.action === 'ask_coach' && asked} onClick={() => {
          if (op.ask) h.ask(op.ask, 'prompt');
          else if (op.to) { h.close(); nav(op.to); }
          else if (op.action === 'ask_coach' && h.ctx?.athleteId) {
            const a = athleteById(db, h.ctx.athleteId);
            const coach = db.coaches.find((c) => c.id === a?.primaryCoachId);
            if (!coach) { toast({ tone: 'warn', text: 'No coach is assigned yet, so the question can’t be sent.' }); return; }
            update((d) => d.notifications.push({ id: uid('n'), personId: coach.personId, kind: 'question', title: `${a!.name.split(' ')[0]} has a question`, body: `About: ${h.ctx!.title}`, route: `/coach/athlete/${a!.id}`, target: { type: 'question', id: a!.id }, createdAt: nowISO(), read: false }));
            setAsked(true);
            toast({ tone: 'ok', text: `Sent to ${coach.name}. They’ll answer in your Feedback.` });
          }
        }}>
          {op.action === 'ask_coach' && asked ? 'Sent to your coach' : op.label}
        </button>
      ))}
    </div>
  );
}

const INTRO: Record<'athlete' | 'parent' | 'coach' | 'web', { hi: string; does: string[]; doesnt: string; try: string[] }> = {
  athlete: {
    hi: 'Hi, I’m dit.',
    does: ['Walk you through your sessions and feedback', 'Explain your Dit Score and what moved it', 'Turn your coach’s comments into practice tips'],
    doesnt: 'I don’t replace your coach. I only use what your coach has approved, and I’ll say when I’m not sure.',
    try: ['What’s my Dit Score?', 'How was my session?'],
  },
  parent: {
    hi: 'Hello, I’m dit.',
    does: ['Explain reports and cricket terms in plain words', 'Help you read the Dit Score and what the coach is prioritising'],
    doesnt: 'I only explain what the academy has shared with you. Coaching decisions stay with the coach.',
    try: ['What does the Dit Score mean?', 'Explain this report in plain words'],
  },
  coach: {
    hi: 'dit — your assistant on the sideline.',
    does: ['Turn voice notes into observations you approve', 'Summarise athletes and brief you before reassessments', 'Draft athlete-friendly feedback for you to sign off'],
    doesnt: 'Nothing is saved or shared until you approve it. You stay the source of truth.',
    try: ['Summarise recent sessions', 'What can you help with?'],
  },
  web: {
    hi: 'dit — summaries and drafts, on request.',
    does: ['Brief you on reassessment evidence', 'Draft parent-friendly report comments', 'Summarise an athlete’s history'],
    doesnt: 'dit works inside your permissions and never publishes anything for you.',
    try: ['What can you help with?'],
  },
};

/** Flow A — first interaction: purpose, limits, a first question, and an easy way out. */
export function CompanionIntro({ surface, fixed = false }: { surface: 'athlete' | 'parent' | 'coach' | 'web'; fixed?: boolean }) {
  const { prefs, set } = useCompanionPrefs(surface);
  const { openCompanion, ctx } = useCompanion();
  if (prefs.introSeen || !ctx) return null;
  const c = INTRO[surface];
  return (
    <>
      <div className="scrim" style={fixed ? { position: 'fixed' } : undefined} aria-hidden />
      <section className="sheet dit-intro" data-theme="floodlit" role="dialog" aria-modal="true" aria-labelledby="dit-intro-h" style={fixed ? { position: 'fixed', maxWidth: 480, margin: '0 auto' } : undefined}>
        <div className="sheet-grip" />
        <div className="sheet-body stack gap-4">
          <div className="dit-intro-hero"><DitAvatar state="idle" form="immersive" size={120} /></div>
          <h2 id="dit-intro-h" className="h2">{c.hi}</h2>
          <ul className="stack gap-2" style={{ margin: 0, paddingLeft: 18 }}>{c.does.map((d) => <li key={d} className="small">{d}</li>)}</ul>
          <p className="small muted">{c.doesnt}</p>
          <div className="obj-choices">
            {c.try.map((t) => <button key={t} className="choice" onClick={() => { set({ introSeen: true }); openCompanion({ ask: t }); }}>{t}</button>)}
          </div>
          <div className="row gap-2 wrap">
            <Button variant="ghost" onClick={() => set({ introSeen: true })}>Not now</Button>
            <Button variant="ghost" onClick={() => set({ introSeen: true, quiet: true })}>Only when I ask</Button>
          </div>
          <p className="xs muted">You can find dit at the bottom right on every screen. Quiet mode turns off suggestions.</p>
        </div>
      </section>
    </>
  );
}

/** Turns an internal coach note into a second-person draft for the athlete. Template logic, labelled as a draft. */
export function athleteFriendly(note: string, name: string) {
  const first = name.split(' ')[0];
  let t = note
    .replace(new RegExp(`\\b${first}\\b[,:]?\\s*`, 'gi'), '')
    .replace(/\b[Hh]e's\b|\b[Ss]he's\b/g, 'you’re')
    .replace(/\b[Hh]e\b|\b[Ss]he\b/g, 'you')
    .replace(/\b[Hh]is\b|\b[Hh]er\b/g, 'your')
    .replace(/\b[Hh]im\b/g, 'you')
    .replace(/\byou reaches\b/g, 'you reach').replace(/\byou falls\b/g, 'you fall').replace(/\byou plays\b/g, 'you play').replace(/\byou gets\b/g, 'you get')
    .replace(/\bStill\b/g, 'You still')
    .trim();
  t = t.charAt(0).toUpperCase() + t.slice(1);
  const lead = tone(note) === 'concern' ? 'One thing to work on: ' : 'Nice work today. ';
  return `${lead}${t}`;
}

/** Flow E — coach approves an athlete-friendly version before anything reaches the athlete. */
function ShareWithAthlete({ athleteId, sessionId, note, coachId }: { athleteId: string; sessionId: string | null; note: string; coachId: string }) {
  const { db, update, toast, audit } = useStore();
  const a = athleteById(db, athleteId)!;
  const [mode, setMode] = useState<'ask' | 'draft' | 'sent' | 'kept'>('ask');
  const [draft, setDraft] = useState(() => athleteFriendly(note, a.name));
  const athletePerson = db.people.find((p) => p.athleteId === athleteId);
  if (mode === 'kept') return <p className="xs muted">Kept for coaches only.</p>;
  if (mode === 'sent') return <div className="obj"><p className="small"><Check size={14} style={{ display: 'inline' }} /> Sent to {a.name.split(' ')[0]}. dit can explain it to them, using only your approved words.</p></div>;
  if (mode === 'ask') {
    return (
      <div className="obj-choices">
        <button className="choice" onClick={() => setMode('draft')}>Share an athlete-friendly version</button>
        <button className="choice" onClick={() => setMode('kept')}>Keep it for coaches</button>
      </div>
    );
  }
  return (
    <div className="obj proposal">
      <div className="obj-title">For {a.name.split(' ')[0]}<span className="tag-suggestion">Draft · you approve</span></div>
      <label className="sr-only" htmlFor="af-draft">Athlete-friendly feedback</label>
      <textarea id="af-draft" className="draft-text" value={draft} onChange={(e) => setDraft(e.target.value)} />
      <p className="xs muted" style={{ marginTop: 6 }}>Rewritten for the athlete from your note. Check the wording: the athlete sees exactly this.{a.access === 'none' ? ' This athlete has no app access yet, so it will wait in their feedback.' : ''}</p>
      <div className="proposal-actions">
        <Button variant="highlight" size="sm" disabled={draft.trim().length < 10} icon={<Check size={14} />} onClick={() => {
          const fid = uid('f');
          update((d) => {
            d.feedback.push({ id: fid, athleteId, sessionId, coachId, text: draft.trim(), videoId: null, status: 'published', publishedAt: nowISO(), aiDrafted: true });
            if (athletePerson) d.notifications.push({ id: uid('n'), personId: athletePerson.id, kind: 'feedback', title: 'New feedback from your coach', body: draft.trim().slice(0, 70), route: `/athlete/feedback/${fid}`, target: { type: 'feedback', id: fid }, createdAt: nowISO(), read: false });
          });
          audit(db.coaches.find((c) => c.id === coachId)?.name ?? 'Coach', `Approved athlete feedback for ${a.name} (drafted with dit)`, fid);
          toast({ tone: 'ok', text: `Feedback sent to ${a.name.split(' ')[0]}.` });
          setMode('sent');
        }}>Approve and send</Button>
        <Button variant="ghost" size="sm" onClick={() => setMode('kept')}>Don’t send</Button>
      </div>
    </div>
  );
}
