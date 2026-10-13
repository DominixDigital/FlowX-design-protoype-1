import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ArrowUp, Bell, BellOff, Check, ChevronDown, ChevronUp, CircleDot, FlaskConical, Mic, Minus, Square, Triangle, X } from 'lucide-react-native';
import { nowISO, uid, useStore } from 'ditcore/store/store';
import { athleteById, areaById, fmtTime, sessionById } from 'ditcore/store/selectors';
import {
  interpretVoiceNote, SAMPLE_VOICE_NOTES, ROLE_GREETING, route, COMPANION_INTRO, introLine, athleteFriendly,
  type CompanionCtx, type CompanionObject,
} from 'ditcore/companion/engine';
import { askGemini } from 'ditcore/companion/gemini';
import { computeDitScore } from 'ditcore/score/ditScore';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { fonts, fs, radius, raw, sheetFrame, space } from '../theme/tokens';
import { Button, Card, Chip, Input, Row, Stack, Txt } from '../ui';
import { DitAvatar, type DitState } from '../ui/Dit';
import { ScoreDiscs, ScoreTrend } from '../ui/score';
import { Clip } from '../ui/art';
import { goToPath } from '../navigation/ref';

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
  voiceDraft?: { athleteId: string | null; areaId: string | null; text: string };
}

type Seam = 'idle' | 'thinking' | 'insight';
type Surface = 'athlete' | 'parent' | 'coach' | 'web';

interface CompanionState {
  ctx: CompanionCtx | null;
  actions: CompanionActions;
  open: boolean;
  plays: Play[];
  seam: Seam;
  setCtx: (ctx: CompanionCtx | null, actions?: CompanionActions) => void;
  openCompanion: (opts?: { ask?: string }) => void;
  close: () => void;
  hideFab: number;
  setHideFab: (delta: 1 | -1) => void;
  ask: (q: string, via?: Play['via']) => void;
  voiceNote: (text: string) => void;
}

const Ctx = createContext<CompanionState | null>(null);

export function CompanionProvider({ children }: { children: ReactNode }) {
  const { db } = useStore();
  const [ctx, setCtxState] = useState<CompanionCtx | null>(null);
  const [actions, setActions] = useState<CompanionActions>({});
  const [open, setOpen] = useState(false);
  const [plays, setPlays] = useState<Play[]>([]);
  const [hideFab, setHideFabState] = useState(0);
  const setHideFab = useCallback((d: 1 | -1) => setHideFabState((n) => Math.max(0, n + d)), []);
  const dbRef = useRef(db);
  dbRef.current = db;
  const ctxKey = useRef('');

  const setCtx = useCallback((c: CompanionCtx | null, a: CompanionActions = {}) => {
    const key = JSON.stringify(c);
    setActions(a);
    if (key === ctxKey.current) return;
    ctxKey.current = key;
    setCtxState((prev) => {
      if (prev && c && prev.surface !== c.surface) setOpen(false);
      return c;
    });
    setPlays([]); // new screen context: fresh canvas
  }, []);

  const run = useCallback((q: string, via: Play['via'], produce: () => Partial<Play> & { then?: () => Promise<CompanionObject[] | null> }) => {
    const id = uid('play');
    setPlays((p) => [...p, { id, ask: q, via, status: 'thinking', objects: [] }]);
    setTimeout(() => {
      const { then, ...out } = produce();
      if (!then) { setPlays((p) => p.map((x) => (x.id === id ? { ...x, status: 'done', ...out } : x))); return; }
      // Rules had no answer: try the model; keep "thinking" until it replies, fall back to the rule answer on any failure.
      then().then((ai) => setPlays((p) => p.map((x) => (x.id === id ? { ...x, status: 'done', ...out, objects: ai ?? out.objects ?? [] } : x))));
    }, 350);
  }, []);

  const ask = useCallback((q: string, via: Play['via'] = 'text') => {
    if (!ctx) return;
    run(q, via, () => {
      const r = route(dbRef.current, ctx, q, via);
      if (!r.useModel) return { objects: r.objects };
      return {
        objects: r.objects,
        then: async () => {
          const g = await askGemini(dbRef.current, ctx, q);
          if (g.ok) return g.objects;
          if (g.reason === 'rate' && !r.matched) return [{ type: 'notice', tone: 'info', text: 'The AI service is busy right now. Showing what dit can do without it.' } as CompanionObject, ...r.objects.slice(1)];
          return null;
        },
      };
    });
  }, [ctx, run]);

  const voiceNote = useCallback((text: string) => {
    if (!ctx) return;
    run(`“${text.length > 64 ? `${text.slice(0, 64)}…` : text}”`, 'voice', () => {
      const d = dbRef.current;
      const roster = ctx.sessionId ? Object.keys(sessionById(d, ctx.sessionId)?.attendance ?? {}) : ctx.athleteId ? [ctx.athleteId] : [];
      const r = interpretVoiceNote(d, text, roster.length ? roster : d.athletes.filter((a) => a.status === 'active').map((a) => a.id), ctx.athleteId);
      return { objects: [r.object], voiceDraft: { athleteId: r.athleteId, areaId: r.areaId, text: r.text } };
    });
  }, [ctx, run]);

  const seam: Seam = plays.some((p) => p.status === 'thinking') ? 'thinking' : ctx?.reassessmentId || ctx?.reportId || ctx?.videoId ? 'insight' : 'idle';
  const value = useMemo<CompanionState>(() => ({
    ctx, actions, open, plays, seam, setCtx, ask, voiceNote, hideFab, setHideFab,
    openCompanion: (opts) => { setOpen(true); if (opts?.ask) setTimeout(() => ask(opts.ask!, 'prompt'), 0); },
    close: () => setOpen(false),
  }), [ctx, actions, open, plays, seam, setCtx, ask, voiceNote, hideFab, setHideFab]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompanion() {
  const h = useContext(Ctx);
  if (!h) throw new Error('useCompanion outside provider');
  return h;
}

/** Hide the floating face while a screen has dense controls on the right edge; use <DitInline /> in its header instead. */
export function useHideFab() {
  const { setHideFab } = useCompanion();
  useEffect(() => { setHideFab(1); return () => setHideFab(-1); }, [setHideFab]);
}

/** Screens declare what dit can see. Call from a screen; context follows focus. */
export function useCompanionContext(ctx: CompanionCtx | null, actions?: CompanionActions) {
  const { setCtx } = useCompanion();
  const key = JSON.stringify(ctx);
  const actRef = useRef(actions);
  actRef.current = actions;
  useEffect(() => { setCtx(ctx, actRef.current); }, [key, setCtx]);
}

/** Per-person preferences (intro seen, quiet mode, dismissed nudges). */
export function useCompanionPrefs(surface: Surface) {
  const { db, personas, update } = useStore();
  const key = `${surface}:${personas[surface].personId}`;
  const prefs = db.companionPrefs[key] ?? { introSeen: false, quiet: false, dismissedNudges: [] };
  const set = (patch: Partial<typeof prefs>) => update((d) => { d.companionPrefs[key] = { ...prefs, ...patch }; });
  return { prefs, set };
}

/* ───────── Presence ───────── */

/** Floating face, bottom right above the tab bar. */
export function DitFab({ bottom = 84 }: { bottom?: number }) {
  const { openCompanion, seam, ctx, hideFab } = useCompanion();
  const state: DitState = seam === 'thinking' ? 'thinking' : seam === 'insight' ? 'insight' : 'idle';
  if (!ctx || hideFab > 0) return null;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={`Ask dit${seam === 'insight' ? ', something relevant is ready for this screen' : ''}`}
      onPress={() => openCompanion()}
      style={{ position: 'absolute', right: 16, bottom, width: 56, height: 56, borderRadius: 28, backgroundColor: raw.char[500], alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
    >
      <DitAvatar state={state} size={40} form="face" />
    </Pressable>
  );
}

/** Small face for a screen header, used where the floating one is hidden. */
export function DitInline() {
  const { openCompanion, seam, ctx } = useCompanion();
  if (!ctx) return null;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Ask dit" onPress={() => openCompanion()} hitSlop={6} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: raw.char[500], alignItems: 'center', justifyContent: 'center' }}>
      <DitAvatar state={seam === 'thinking' ? 'thinking' : seam === 'insight' ? 'insight' : 'idle'} size={28} form="face" />
    </Pressable>
  );
}

/** A proactive suggestion. Dismissable; silenced by quiet mode. */
export function CompanionNudge({ id, surface, text, ask, cta = 'Show me' }: { id: string; surface: Surface; text: string; ask: string; cta?: string }) {
  const { openCompanion } = useCompanion();
  const { prefs, set } = useCompanionPrefs(surface);
  if (prefs.quiet || prefs.dismissedNudges.includes(id)) return null;
  return (
    <ThemeProvider role={surface === 'parent' ? 'parent' : surface === 'athlete' ? 'athlete' : 'coach'} mode="floodlit">
      <Nudge text={text} cta={cta} onAsk={() => openCompanion({ ask })} onDismiss={() => set({ dismissedNudges: [...prefs.dismissedNudges, id] })} />
    </ThemeProvider>
  );
}
function Nudge({ text, cta, onAsk, onDismiss }: { text: string; cta: string; onAsk: () => void; onDismiss: () => void }) {
  const t = useTheme();
  return (
    <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.line }}>
      <DitAvatar state="insight" size={34} form="face" />
      <Txt variant="small" style={{ flex: 1 }}>{text}</Txt>
      <Button size="sm" variant="highlight" onPress={onAsk}>{cta}</Button>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss suggestion" onPress={onDismiss} hitSlop={10}><X size={16} color={t.textMuted} /></Pressable>
    </View>
  );
}

/* ───────── Canvas ───────── */

const moodOf = (p?: Play): DitState => {
  if (!p || p.status !== 'done') return 'idle';
  const say = [...p.objects].reverse().find((o) => o.type === 'say') as Extract<CompanionObject, { type: 'say' }> | undefined;
  if (say?.mood) return say.mood;
  if (p.objects.some((o) => o.type === 'notice')) return 'uncertain';
  return 'explaining';
};

/** The conversation canvas as a bottom sheet. Plays, not a transcript. */
export function CompanionCanvas() {
  const h = useCompanion();
  const { ctx, open, plays, close } = h;
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);
  const { prefs, set } = useCompanionPrefs(ctx?.surface ?? 'coach');

  useEffect(() => { setExpanded(null); setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60); }, [plays.length]);
  if (!ctx) return null;

  const submit = () => { if (!text.trim()) return; h.ask(text.trim()); setText(''); };
  const latest = plays[plays.length - 1];
  const canVoice = ctx.surface === 'coach';
  const role = ctx.surface === 'parent' ? 'parent' : ctx.surface === 'athlete' ? 'athlete' : 'coach';

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <ThemeProvider role={role} mode="floodlit">
        <CanvasBody>
          <Pressable accessibilityLabel="Close dit" style={{ flex: 1 }} onPress={close} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ ...sheetFrame, backgroundColor: raw.char[700], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '100%', paddingBottom: insets.bottom + 8, borderWidth: 1, borderColor: raw.char[400] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: space[4], paddingBottom: space[2] }}>
                <DitAvatar state={h.seam === 'thinking' ? 'thinking' : moodOf(latest)} size={40} form="face" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: raw.grey[50], fontFamily: fonts.display, fontSize: 26, lineHeight: 26 }}>dit</Text>
                  <Text numberOfLines={1} style={{ color: raw.grey[600], fontFamily: fonts.body, fontSize: 12 }}>Looking at: {ctx.title}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={prefs.quiet ? 'Quiet mode on. Turn off' : 'Turn on quiet mode'} onPress={() => set({ quiet: !prefs.quiet })} hitSlop={10}>
                  {prefs.quiet ? <BellOff size={20} color={raw.grey[500]} /> : <Bell size={20} color={raw.grey[500]} />}
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Minimise dit" onPress={close} hitSlop={10}><Minus size={22} color={raw.grey[500]} /></Pressable>
              </View>

              <ScrollView ref={scroll} style={{ maxHeight: 440 }} contentContainerStyle={{ padding: space[4], paddingTop: 0, gap: space[4] }} keyboardShouldPersistTaps="handled">
                <View style={{ flexDirection: 'row', gap: 8, padding: 10, borderRadius: radius.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: raw.char[300] }}>
                  <FlaskConical size={14} color={raw.grey[600]} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, color: raw.grey[600], fontFamily: fonts.body, fontSize: 12, lineHeight: 17 }}>Most answers are demo logic over the records in this prototype. Open questions can be answered by an AI model (Gemini) and are labelled. dit follows your coach’s approved information, and you confirm anything it would change.</Text>
                </View>

                {plays.length === 0 && (
                  <View style={{ gap: 4 }}>
                    <Text style={{ color: raw.grey[600], fontFamily: fonts.bodySemi, fontSize: 12 }}>{ROLE_GREETING[ctx.surface === 'athlete' ? 'athlete' : ctx.surface === 'parent' ? 'parent' : 'coach']}</Text>
                    <Text style={{ color: raw.grey[50], fontFamily: fonts.display, fontSize: 32, lineHeight: 32 }}>{introLine(ctx)}</Text>
                  </View>
                )}

                {plays.map((p, i) => {
                  const isLatest = i === plays.length - 1;
                  if (!isLatest && expanded !== p.id) {
                    return (
                      <Pressable key={p.id} accessibilityRole="button" accessibilityState={{ expanded: false }} onPress={() => setExpanded(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: raw.char[400] }}>
                        <Minus size={14} color={raw.grey[600]} />
                        <Text numberOfLines={1} style={{ flex: 1, color: raw.grey[500], fontFamily: fonts.body, fontSize: 14 }}>{p.ask}</Text>
                        <Text style={{ color: raw.grey[600], fontFamily: fonts.body, fontSize: 12 }}>{p.objects.length} item{p.objects.length === 1 ? '' : 's'}</Text>
                        <ChevronDown size={14} color={raw.grey[600]} />
                      </Pressable>
                    );
                  }
                  return (
                    <View key={p.id} accessibilityLiveRegion="polite" style={{ gap: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: raw.char[400], paddingTop: i === 0 ? 0 : 12 }}>
                      <View>
                        <Text style={{ color: raw.grey[600], fontFamily: fonts.bodySemi, fontSize: 12 }}>{p.via === 'voice' ? 'Your voice note' : p.via === 'prompt' ? 'You chose' : 'You asked'}</Text>
                        <Text style={{ color: raw.grey[50], fontFamily: fonts.display, fontSize: 30, lineHeight: 30 }}>{p.ask}</Text>
                      </View>
                      {p.status === 'thinking' ? (
                        <Row gap={2}><DitAvatar state="thinking" size={22} form="compact" /><Txt variant="small" muted>Reading the records…</Txt></Row>
                      ) : (
                        <View style={{ gap: 12 }}>
                          {p.objects.map((o, j) => <ObjectView key={j} o={o} />)}
                          {p.voiceDraft && <ObservationDraft play={p} />}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={{ paddingHorizontal: space[4], gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: raw.char[400] }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
                  {ctx.prompts.map((pr) => <Chip key={pr} onPress={() => h.ask(pr, 'prompt')}>{pr}</Chip>)}
                  {canVoice && <Chip onPress={() => h.voiceNote(SAMPLE_VOICE_NOTES.coach)}>Sample voice note (demo)</Chip>}
                </ScrollView>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                  <TextInput
                    accessibilityLabel="Ask dit" value={text} onChangeText={setText} onSubmitEditing={submit} returnKeyType="send" blurOnSubmit
                    placeholder={canVoice ? 'Ask dit, or type a note' : 'Ask dit'} placeholderTextColor={raw.grey[700]}
                    style={{ flex: 1, minHeight: 48, borderRadius: radius.sm, borderWidth: 1.5, borderColor: raw.char[300], paddingHorizontal: 14, color: raw.grey[50], fontFamily: fonts.body, fontSize: fs.md, backgroundColor: raw.char[600] }}
                  />
                  {canVoice && (
                    <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Voice input arrives with the native speech module" style={{ width: 48, height: 48, borderRadius: radius.sm, borderWidth: 1.5, borderColor: raw.char[400], alignItems: 'center', justifyContent: 'center', opacity: 0.45 }}>
                      <Mic size={18} color={raw.grey[500]} />
                    </Pressable>
                  )}
                  <Pressable accessibilityRole="button" accessibilityLabel="Send" accessibilityState={{ disabled: !text.trim() }} onPress={submit} style={{ width: 48, height: 48, borderRadius: radius.sm, backgroundColor: text.trim() ? t_hl(role) : raw.char[400], alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUp size={18} color={raw.char[500]} />
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </CanvasBody>
      </ThemeProvider>
    </Modal>
  );
}
const t_hl = (r: 'coach' | 'parent' | 'athlete') => (r === 'coach' ? raw.teal[500] : r === 'parent' ? raw.lime[500] : raw.grey[500]);
const CanvasBody = ({ children }: { children: ReactNode }) => <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>{children}</View>;

/* ───────── Objects ───────── */

function Obj({ children, tint }: { children: ReactNode; tint?: boolean }) {
  const t = useTheme();
  return <View style={{ gap: 8, padding: space[4], borderRadius: radius.md, borderWidth: 1, borderColor: tint ? t.hl : t.line, backgroundColor: t.surface }}>{children}</View>;
}
function ObjTitle({ children, tag }: { children: ReactNode; tag?: string }) {
  const t = useTheme();
  return (
    <Row between>
      <Txt variant="small" strong style={{ flex: 1 }}>{children}</Txt>
      {tag ? <Text style={{ color: t.hl, fontFamily: fonts.bodySemi, fontSize: 11 }}>{tag}</Text> : null}
    </Row>
  );
}
function Bullets({ items }: { items: string[] }) {
  return <View style={{ gap: 4 }}>{items.map((x) => <Txt key={x} variant="small">•  {x}</Txt>)}</View>;
}
function Basis({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 }}>
        {open ? <ChevronUp size={14} color={raw.grey[600]} /> : <ChevronDown size={14} color={raw.grey[600]} />}
        <Txt variant="xs" muted>Based on {items.length} record{items.length === 1 ? '' : 's'}</Txt>
      </Pressable>
      {open && <View style={{ gap: 2, paddingLeft: 18 }}>{items.map((b) => <Txt key={b} variant="xs" muted>{b}</Txt>)}</View>}
    </View>
  );
}

function ToneMark({ tone }: { tone?: 'positive' | 'concern' | 'neutral' }) {
  const t = useTheme();
  return tone === 'positive' ? <CircleDot size={14} color={t.hl} accessibilityLabel="reads as progress" />
    : tone === 'concern' ? <Triangle size={14} color={t.warn} accessibilityLabel="reads as concern" />
      : <Square size={14} color={t.textMuted} accessibilityLabel="neutral" />;
}

function ObjectView({ o }: { o: CompanionObject }) {
  const h = useCompanion();
  const { db } = useStore();
  const t = useTheme();
  switch (o.type) {
    case 'facts':
      return (
        <Obj>
          <ObjTitle tag="Recorded">{o.heading}</ObjTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {o.items.map((f) => (
              <View key={f.label} style={{ minWidth: 100, flexGrow: 1, gap: 2 }}>
                <Text style={{ color: t.text, fontFamily: fonts.display, fontSize: 34, lineHeight: 34 }}>{f.value}</Text>
                <Txt variant="small" strong>{f.label}</Txt>
                <Txt variant="xs" muted>{f.basis}</Txt>
              </View>
            ))}
          </View>
        </Obj>
      );
    case 'evidence':
      return (
        <Obj>
          <ObjTitle tag={`${o.items.length} linked`}>{o.heading}</ObjTitle>
          {o.items.length === 0 ? <Txt variant="small" muted>Nothing linked yet.</Txt> : o.items.map((e) => (
            <View key={e.ref.id} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ marginTop: 3 }}><ToneMark tone={e.tone} /></View>
              <View style={{ flex: 1 }}><Txt variant="small">{e.text}</Txt><Txt variant="xs" muted>{e.date} · {e.ref.label}</Txt></View>
            </View>
          ))}
        </Obj>
      );
    case 'suggestion':
      return <Obj tint><ObjTitle tag="Suggestion">{' '}</ObjTitle><Txt strong>{o.text}</Txt><Basis items={o.why} /></Obj>;
    case 'compare':
      return (
        <Obj>
          <ObjTitle>{o.heading}</ObjTitle>
          <Row center={false} gap={4}>
            {[o.left, o.right].map((side) => (
              <View key={side.label} style={{ flex: 1, gap: 4 }}><Txt variant="xs" muted>{side.label}</Txt>{side.items.map((x) => <Txt key={x} variant="small">• {x}</Txt>)}</View>
            ))}
          </Row>
        </Obj>
      );
    case 'explainer': return <Explainer o={o} />;
    case 'draft': return <DraftView o={o} useText={h.actions.useText} />;
    case 'moment':
      return (
        <Obj>
          <View style={{ aspectRatio: 16 / 9, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: raw.char[500], justifyContent: 'flex-end', padding: 8 }}>
            <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: 20 }}>{fmtTime(o.t)}</Text>
          </View>
          <Txt variant="xs" muted>Coach’s comment on {o.videoTitle}</Txt>
          <Txt strong>“{o.coachText}”</Txt>
          <Obj tint><ObjTitle tag="Practice cue · suggestion">{' '}</ObjTitle><Txt variant="small">{o.cue}</Txt>{o.drill ? <Txt variant="xs" muted>Your assigned drill: {o.drill}</Txt> : null}</Obj>
        </Obj>
      );
    case 'capabilities': return <Obj><ObjTitle>{o.heading}</ObjTitle><Bullets items={o.items} /></Obj>;
    case 'ai':
      return (
        <Obj>
          <ObjTitle tag={`AI-generated · ${o.model}`}>Answer</ObjTitle>
          <Txt variant="small">{o.text}</Txt>
          {o.points.length > 0 && <Bullets items={o.points} />}
          {o.basis.length > 0 && <Basis items={o.basis} />}
          <Txt variant="xs" muted>Written by an AI model from the records on this screen. Your coach is the source of truth.</Txt>
        </Obj>
      );
    case 'notice':
      return <View style={{ padding: space[4], borderRadius: radius.md, borderWidth: 1, borderColor: o.tone === 'warn' ? t.warn : t.line }}><Txt variant="small">{o.text}</Txt></View>;
    case 'interpretation':
      return (
        <Obj>
          <ObjTitle tag="Interpretation">{o.heading}</ObjTitle>
          {o.fields.map((f) => (
            <View key={f.label} style={{ gap: 2 }}>
              <Txt variant="xs" muted>{f.label}</Txt>
              <Row gap={2}><Txt variant="small" style={{ flexShrink: 1 }}>{f.value}</Txt>{f.confidence ? <Text style={{ color: f.confidence === 'clear' ? t.ok : t.warn, fontFamily: fonts.bodySemi, fontSize: 11 }}>{f.confidence === 'clear' ? '✓ Clear' : 'Check'}</Text> : null}</Row>
            </View>
          ))}
          <Basis items={o.basis.map((b) => b.label)} />
        </Obj>
      );
    case 'say':
      return (
        <Row gap={3} center={false}>
          <DitAvatar state={o.mood ?? 'explaining'} size={26} form="compact" still />
          <Txt style={{ flex: 1 }}>{o.text}</Txt>
        </Row>
      );
    case 'choices': return <Choices options={o.options} />;
    case 'score':
      return (
        <Obj>
          <View style={{ alignItems: 'center' }}><ScoreDiscs state={computeDitScore(db, o.athleteId)} size={250} /></View>
          <Txt variant="xs" muted style={{ textAlign: 'center' }}>Illustrative prototype score · method not yet validated</Txt>
        </Obj>
      );
    case 'trend': return <Obj><ObjTitle>Week by week</ObjTitle><ScoreTrend db={db} athleteId={o.athleteId} /></Obj>;
    case 'drivers':
      return (
        <Obj>
          <ObjTitle tag="Illustrative weights">{o.heading}</ObjTitle>
          {o.items.length === 0 && <Txt variant="small" muted>Nothing changed underneath.</Txt>}
          {o.items.map((d) => (
            <View key={d.label} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 18, color: d.impact >= 0 ? t.ok : t.warn }}>{d.impact >= 0 ? '▲' : '▼'}</Text>
              <View style={{ flex: 1 }}>
                <Txt variant="small">{d.label}: {d.from ?? '—'} → {d.to ?? '—'}</Txt>
                <Txt variant="xs" muted>{d.source}{d.trust === 'self_reported' ? ' · self-reported' : d.trust === 'coach_approved' ? ' · coach-confirmed' : ''}</Txt>
              </View>
            </View>
          ))}
        </Obj>
      );
    case 'nextsteps':
      return (
        <Obj tint>
          <ObjTitle>{o.heading}</ObjTitle>
          {o.items.map((it) => (
            <View key={it.text} style={{ flexDirection: 'row', gap: 10 }}>
              <ArrowRight size={14} color={t.hl} style={{ marginTop: 4 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="small">{it.text}</Txt><Txt variant="xs" muted>{it.source}</Txt>
                {it.to ? <Button size="sm" onPress={() => { h.close(); goToPath(it.to!); }}>Open</Button> : null}
              </View>
            </View>
          ))}
        </Obj>
      );
    case 'clip': {
      const v = db.videos.find((x) => x.id === o.videoId);
      if (!v) return null;
      return <Obj><Clip video={v} compact /><Txt strong>Coach at {fmtTime(o.t)}: “{o.text}”</Txt><Txt variant="xs" muted>No media in the prototype.</Txt></Obj>;
    }
    case 'proposal': return null;
  }
}

function Explainer({ o }: { o: Extract<CompanionObject, { type: 'explainer' }> }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Obj>
      <ObjTitle tag="From the published report">{o.heading}</ObjTitle>
      {o.sections.map((s, i) => (
        <View key={s.q}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="small" strong style={{ flex: 1 }}>{s.q}</Txt>{open === i ? <ChevronUp size={16} color={raw.grey[600]} /> : <ChevronDown size={16} color={raw.grey[600]} />}
          </Pressable>
          {open === i && <Txt variant="small" muted>{s.a}</Txt>}
        </View>
      ))}
    </Obj>
  );
}

function DraftView({ o, useText }: { o: Extract<CompanionObject, { type: 'draft' }>; useText?: CompanionActions['useText'] }) {
  const [text, setText] = useState(o.text);
  const [used, setUsed] = useState(false);
  return (
    <Obj tint>
      <ObjTitle tag="Draft · edit freely">{o.heading}</ObjTitle>
      <Input accessibilityLabel="Draft text" multiline value={text} onChangeText={setText} />
      {useText ? (
        <Button variant="highlight" size="sm" disabled={used || !text.trim()} icon={<Check size={14} color={raw.char[500]} />} onPress={() => { useText.run(text); setUsed(true); }}>
          {used ? 'Inserted. Review before approving' : useText.label}
        </Button>
      ) : <Txt variant="xs" muted>Open the report composer to use this draft.</Txt>}
      <Basis items={o.basis.map((b) => b.label)} />
    </Obj>
  );
}

/** Choose-from-a-list field used inside dit's proposals (a native Picker would add a dependency). */
function Pick<T extends string>({ label, value, onChange, options, none }: { label: string; value: T | ''; onChange: (v: T | '') => void; options: { v: T; label: string }[]; none?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="small" strong>{label}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {none != null && <Chip selected={value === ''} onPress={() => onChange('')}>{none}</Chip>}
        {options.map((op) => <Chip key={op.v} selected={value === op.v} onPress={() => onChange(op.v)}>{op.label}</Chip>)}
      </View>
    </View>
  );
}

/** CM05: editable proposal. Nothing is saved until the coach confirms. */
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

  if (state === 'discarded') return <Txt variant="xs" muted>Draft discarded. Nothing was saved.</Txt>;
  if (state === 'saved') {
    return (
      <>
        <Obj tint><Txt variant="small">✓ Saved to {athleteById(db, athleteId)?.name}’s record{areaId ? ` under “${areaById(db, areaId)?.title}”` : ' as unstructured'}. Marked “AI-drafted, coach-confirmed”. Coaches only so far.</Txt></Obj>
        <ShareWithAthlete athleteId={athleteId} sessionId={ctx.sessionId ?? null} note={text} coachId={coachId} />
      </>
    );
  }
  const save = async () => {
    if (!athleteId || !text.trim()) return;
    setState('saving');
    const id = uid('o');
    const res = await command({
      kind: 'observation', label: `Observation · ${athleteById(db, athleteId)?.name}`, refId: id,
      apply: (x) => { x.observations.push({ id, athleteId, sessionId: ctx.sessionId ?? null, areaId: areaId || null, text: text.trim(), source: 'voice', aiDrafted: true, authorId: coachId, createdAt: nowISO(), sync: 'queued', status: 'saved' }); },
      setSync: (x, s) => { const o = x.observations.find((y) => y.id === id); if (o) o.sync = s; },
    });
    setState('saved');
    toast({ tone: res === 'failed' ? 'err' : res === 'queued' ? 'warn' : 'ok', text: res === 'queued' ? 'Observation saved on this device. It will sync when you’re back online.' : res === 'failed' ? 'Saved on this device, but the upload failed. Retry from the sync queue.' : 'Observation saved.' });
  };
  return (
    <Obj tint>
      <ObjTitle>Confirm before saving</ObjTitle>
      <Pick label="Athlete" value={athleteId} onChange={(v) => { setAthleteId(v); setAreaId(''); }} options={roster.map((id) => ({ v: id, label: athleteById(db, id)?.name ?? id }))} />
      <View style={{ gap: 6 }}><Txt variant="small" strong>Note</Txt><Input accessibilityLabel="Note" multiline value={text} onChangeText={setText} /></View>
      {athleteId ? <Pick label="Development area" value={areaId} onChange={setAreaId} none="Leave unstructured" options={areas.map((a) => ({ v: a.id, label: a.title }))} /> : null}
      <Row gap={2} wrap>
        <Button variant="highlight" onPress={save} pending={state === 'saving'} disabled={!athleteId || !text.trim()} icon={<Check size={16} color={raw.char[500]} />}>Save observation</Button>
        <Button variant="ghost" onPress={() => setState('discarded')}>Discard</Button>
      </Row>
      {!athleteId && <Txt variant="xs" color="#f2c14e">Choose an athlete to save. dit didn’t hear a name it could match.</Txt>}
    </Obj>
  );
}

/** Reply options: the conversation moves forward by choosing, not only typing. */
function Choices({ options }: { options: { label: string; ask?: string; to?: string; action?: 'ask_coach' }[] }) {
  const h = useCompanion();
  const { db, update, toast } = useStore();
  const [asked, setAsked] = useState(false);
  if (!options.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="menu">
      {options.map((op) => (
        <Chip key={op.label} onPress={() => {
          if (op.action === 'ask_coach' && asked) return;
          if (op.ask) h.ask(op.ask, 'prompt');
          else if (op.to) { h.close(); goToPath(op.to); }
          else if (op.action === 'ask_coach' && h.ctx?.athleteId) {
            const a = athleteById(db, h.ctx.athleteId);
            const coach = db.coaches.find((c) => c.id === a?.primaryCoachId);
            if (!coach) { toast({ tone: 'warn', text: 'No coach is assigned yet, so the question can’t be sent.' }); return; }
            update((d) => d.notifications.push({ id: uid('n'), personId: coach.personId, kind: 'question', title: `${a!.name.split(' ')[0]} has a question`, body: `About: ${h.ctx!.title}`, route: `/coach/athlete/${a!.id}`, target: { type: 'question', id: a!.id }, createdAt: nowISO(), read: false }));
            setAsked(true);
            toast({ tone: 'ok', text: `Sent to ${coach.name}. They’ll answer in your Feedback.` });
          }
        }}>{op.action === 'ask_coach' && asked ? 'Sent to your coach' : op.label}</Chip>
      ))}
    </View>
  );
}

/** Flow E: the coach approves an athlete-friendly version before anything reaches the athlete. */
function ShareWithAthlete({ athleteId, sessionId, note, coachId }: { athleteId: string; sessionId: string | null; note: string; coachId: string }) {
  const { db, update, toast, audit } = useStore();
  const a = athleteById(db, athleteId)!;
  const [mode, setMode] = useState<'ask' | 'draft' | 'sent' | 'kept'>('ask');
  const [draft, setDraft] = useState(() => athleteFriendly(note, a.name));
  const athletePerson = db.people.find((p) => p.athleteId === athleteId);
  if (mode === 'kept') return <Txt variant="xs" muted>Kept for coaches only.</Txt>;
  if (mode === 'sent') return <Obj><Txt variant="small">✓ Sent to {a.name.split(' ')[0]}. dit can explain it to them, using only your approved words.</Txt></Obj>;
  if (mode === 'ask') return <Row gap={2} wrap><Chip onPress={() => setMode('draft')}>Share an athlete-friendly version</Chip><Chip onPress={() => setMode('kept')}>Keep it for coaches</Chip></Row>;
  return (
    <Obj tint>
      <ObjTitle tag="Draft · you approve">For {a.name.split(' ')[0]}</ObjTitle>
      <Input accessibilityLabel="Athlete-friendly feedback" multiline value={draft} onChangeText={setDraft} />
      <Txt variant="xs" muted>Rewritten for the athlete from your note. Check the wording: the athlete sees exactly this.{a.access === 'none' ? ' This athlete has no app access yet, so it will wait in their feedback.' : ''}</Txt>
      <Row gap={2} wrap>
        <Button variant="highlight" size="sm" disabled={draft.trim().length < 10} icon={<Check size={14} color={raw.char[500]} />} onPress={() => {
          const fid = uid('f');
          update((d) => {
            d.feedback.push({ id: fid, athleteId, sessionId, coachId, text: draft.trim(), videoId: null, status: 'published', publishedAt: nowISO(), aiDrafted: true });
            if (athletePerson) d.notifications.push({ id: uid('n'), personId: athletePerson.id, kind: 'feedback', title: 'New feedback from your coach', body: draft.trim().slice(0, 70), route: `/athlete/feedback/${fid}`, target: { type: 'feedback', id: fid }, createdAt: nowISO(), read: false });
          });
          audit(db.coaches.find((c) => c.id === coachId)?.name ?? 'Coach', `Approved athlete feedback for ${a.name} (drafted with dit)`, fid);
          toast({ tone: 'ok', text: `Feedback sent to ${a.name.split(' ')[0]}.` });
          setMode('sent');
        }}>Approve and send</Button>
        <Button variant="ghost" size="sm" onPress={() => setMode('kept')}>Don’t send</Button>
      </Row>
    </Obj>
  );
}

/* ───────── Intro (Flow A) ───────── */

export function CompanionIntro({ surface }: { surface: Surface }) {
  const { prefs, set } = useCompanionPrefs(surface);
  const { openCompanion, ctx } = useCompanion();
  const insets = useSafeAreaInsets();
  if (prefs.introSeen || !ctx) return null;
  const c = COMPANION_INTRO[surface];
  const role = surface === 'parent' ? 'parent' : surface === 'athlete' ? 'athlete' : 'coach';
  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={() => set({ introSeen: true })}>
      <ThemeProvider role={role} mode="floodlit">
        <CanvasBody>
          <View style={{ ...sheetFrame, backgroundColor: raw.char[700], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space[5], paddingBottom: insets.bottom + space[5], gap: space[4], borderWidth: 1, borderColor: raw.char[400] }}>
            <View style={{ alignItems: 'center' }}><DitAvatar state="idle" form="immersive" size={110} /></View>
            <Text accessibilityRole="header" style={{ color: raw.grey[50], fontFamily: fonts.bodyBold, fontSize: fs.xl }}>{c.hi}</Text>
            <Bullets items={c.does} />
            <Txt variant="small" muted>{c.doesnt}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {c.try.map((x) => <Chip key={x} onPress={() => { set({ introSeen: true }); openCompanion({ ask: x }); }}>{x}</Chip>)}
            </View>
            <Row gap={2} wrap>
              <Button variant="ghost" onPress={() => set({ introSeen: true })}>Not now</Button>
              <Button variant="ghost" onPress={() => set({ introSeen: true, quiet: true })}>Only when I ask</Button>
            </Row>
            <Txt variant="xs" muted>You can find dit at the bottom right on every screen. Quiet mode turns off suggestions.</Txt>
          </View>
        </CanvasBody>
      </ThemeProvider>
    </Modal>
  );
}

export { Card, Stack };
