import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera, Film, Mic, RotateCcw, Upload } from 'lucide-react-native';
import { nowISO, uid, useStore } from 'ditcore/store/store';
import { TODAY } from 'ditcore/data/fixtures';
import { athleteById, fmtTime } from 'ditcore/store/selectors';
import type { Video } from 'ditcore/data/types';
import { useCoach } from 'ditcore/surfaces/coach/useCoach';
import { ThemeScope, useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, ChoiceGroup, Chip, Display, Field, Input, Row, Stack, StatusBadge, Txt } from '../../ui';
import { Clip } from '../../ui/art';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { raw } from '../../theme/tokens';
import { CoachGate, CoachPage } from './parts';

/**
 * Simulated media server: advances upload → processing → ready in the background.
 * A prototype stand-in; there is no real upload. Mounted once while the coach app is open.
 */
export function UploadSimulator() {
  const { db, update, sim } = useStore();
  const ref = useRef({ db, sim });
  ref.current = { db, sim };
  useEffect(() => {
    const timer = setInterval(() => {
      const { db: d0, sim: s } = ref.current;
      const busy = d0.videos.some((v) => v.upload === 'uploading' || (v.upload === 'queued' && s.online) || v.processing === 'processing');
      if (!busy) return;
      update((d) => {
        for (const v of d.videos) {
          if (v.upload === 'queued' && s.online) v.upload = 'uploading';
          else if (v.upload === 'uploading') {
            if (!s.online) { v.upload = 'queued'; continue; }
            v.progress = Math.min(100, v.progress + (s.slow ? 4 : 14));
            if (v.progress >= 100) { v.upload = 'uploaded'; v.processing = 'processing'; }
          } else if (v.processing === 'processing' && v.upload === 'uploaded') {
            if (Math.random() < 0.35) v.processing = 'ready';
          }
        }
      });
    }, 500);
    return () => clearInterval(timer);
  }, [update]);
  return null;
}

export function Capture() {
  const params = (useRoute<any>().params ?? {}) as { mode?: string; athlete?: string; session?: string; task?: string };
  const [mode, setMode] = useState<'note' | 'video'>(params.mode === 'video' ? 'video' : 'note');
  const h = useCompanion();
  const t = useTheme();
  return (
    <CoachPage back title="Capture">
      <CoachGate>
        <Display size={44}>Capture</Display>
        <Row gap={2}>
          {(['note', 'video'] as const).map((m) => <View key={m} style={{ flex: 1 }}><Chip selected={mode === m} onPress={() => setMode(m)}>{m === 'note' ? 'Observation' : 'Video'}</Chip></View>)}
        </Row>
        {mode === 'note' ? (
          <>
            <ThemeScope mode="floodlit" style={{ borderRadius: 12, borderWidth: 1, borderColor: raw.char[400] }}>
              <Pressable accessibilityRole="button" onPress={() => h.openCompanion()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.hl, alignItems: 'center', justifyContent: 'center' }}><Mic size={18} color={raw.char[700]} /></View>
                <View style={{ flex: 1 }}><Txt strong color={raw.grey[50]}>Ask dit to draft it</Txt><Txt variant="xs" muted>Type or use the sample voice note. You check the draft, then save.</Txt></View>
              </Pressable>
            </ThemeScope>
            <NoteComposer params={params} />
          </>
        ) : <VideoCapture params={params} />}
      </CoachGate>
    </CoachPage>
  );
}

type Params = { athlete?: string; session?: string; task?: string };

/** CM05: a typed observation, with an idempotency key so retries never duplicate (CM08.05 when opened from a task). */
function NoteComposer({ params }: { params: Params }) {
  const { db, command, toast, sim } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const taskId = params.task;
  const recent = db.sessions.filter((s) => s.date <= TODAY && s.status !== 'cancelled').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const [athleteId, setAthleteId] = useState(params.athlete ?? '');
  const [sessionId, setSessionId] = useState(params.session ?? recent.find((s) => s.date === TODAY)?.id ?? '');
  const [areaId, setAreaId] = useState('');
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const idem = useRef(uid('idem'));

  useCompanionContext(athleteId ? {
    surface: 'coach', title: `Note · ${athleteById(db, athleteId)?.name}`, athleteId, sessionId: sessionId || undefined,
    prompts: ['Summarise recent sessions', 'What’s the next action?'],
  } : { surface: 'coach', title: 'New observation', prompts: ['What can you help with?'] });

  const areas = db.areas.filter((a) => a.athleteId === athleteId && (a.status === 'active' || a.status === 'reopened'));
  const athletes = db.athletes.filter((a) => a.status === 'active' && c.inScope(a.id));
  const errors = { athlete: touched && !athleteId ? 'Choose who this is about.' : undefined, text: touched && !text.trim() ? 'Write the observation.' : undefined };

  const save = async (status: 'saved' | 'draft') => {
    setTouched(true);
    if (!athleteId || !text.trim()) return;
    setSaving(true);
    const id = uid('o');
    const res = await command({
      kind: 'observation', idempotencyKey: idem.current, label: `Observation · ${athleteById(db, athleteId)?.name}`, refId: id,
      apply: (d) => {
        if (d.observations.some((o) => o.id === id)) return;
        d.observations.push({ id, athleteId, sessionId: sessionId || null, areaId: areaId || null, text: text.trim(), source: 'typed', aiDrafted: false, authorId: c.coach!.id, createdAt: nowISO(), sync: 'queued', status });
        if (taskId) { const x = d.tasks.find((y) => y.id === taskId); if (x) x.evidenceObservationIds.push(id); }
      },
      setSync: (d, s) => { const o = d.observations.find((x) => x.id === id); if (o) o.sync = s; },
    });
    setSaving(false);
    if (res === 'failed' || res === 'uncertain') toast({ tone: 'err', text: res === 'uncertain' ? 'No confirmation from the server. Your note is kept: retry from the queue is safe.' : 'The note didn’t sync. It’s kept on this device.', action: { label: 'Open queue', run: () => nav.navigate('Sync') } });
    else toast({ tone: res === 'queued' ? 'warn' : 'ok', text: res === 'queued' ? 'Saved offline. It will sync when you reconnect.' : status === 'draft' ? 'Draft kept. Resolve it at session wrap-up.' : 'Observation saved.' });
    nav.goBack();
  };

  return (
    <Stack gap={4}>
      {!sim.online ? <Banner tone="info">Offline: this note saves on the device and syncs later.</Banner> : null}
      <Field label="Athlete" error={errors.athlete}><ChoiceGroup label="Athlete" value={athleteId} onChange={(v) => { setAthleteId(v); setAreaId(''); }} options={athletes.map((a) => ({ v: a.id, label: a.name }))} /></Field>
      <Field label="Observation" error={errors.text}><Input multiline value={text} onChangeText={setText} placeholder="What did you see?" /></Field>
      <Field label="Session" optional><ChoiceGroup label="Session" value={sessionId} onChange={setSessionId} none="Not linked" options={recent.map((s) => ({ v: s.id, label: `${s.title} · ${s.date === TODAY ? 'today' : s.date}` }))} /></Field>
      {athleteId ? <Field label="Development area" optional><ChoiceGroup label="Development area" value={areaId} onChange={setAreaId} none="Leave unstructured" options={areas.map((a) => ({ v: a.id, label: a.title }))} /></Field> : null}
      <Txt variant="xs" muted>Assumption CM05.05: a note with no development area is kept as unstructured.</Txt>
      <Button variant="primary" size="lg" block pending={saving} onPress={() => save('saved')}>Save observation</Button>
      <Button variant="ghost" block disabled={saving} onPress={() => save('draft')}>Keep as draft</Button>
    </Stack>
  );
}

/** CM10: capture → review → attach → upload. The camera and file picker need a native module, so this build uses the demo clip. */
function VideoCapture({ params }: { params: Params }) {
  const { db, update, sim, setSim, toast } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const t = useTheme();
  const taskId = params.task;
  const [step, setStep] = useState<'source' | 'review' | 'attach' | 'upload'>('source');
  const [athleteId, setAthleteId] = useState(params.athlete ?? '');
  const [areaId, setAreaId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [comment, setComment] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const demo = { name: 'demo.mp4', duration: 38 };
  useCompanionContext({ surface: 'coach', title: 'Video capture', athleteId: athleteId || undefined, prompts: ['What can you help with?'] });

  const areas = db.areas.filter((a) => a.athleteId === athleteId && a.status !== 'closed');
  const goals = db.goals.filter((g) => g.areaId === areaId);
  const video = db.videos.find((v) => v.id === videoId);
  const demoVideo: Video = { id: 'demo', athleteId: '', areaId: null, goalId: null, sessionId: null, title: 'Demo clip', duration: demo.duration, capturedAt: '', upload: 'uploaded', progress: 100, processing: 'ready', share: 'private', comments: [], tint: '#1b5a3f' };

  const startUpload = () => {
    setTouched(true);
    if (!athleteId) return;
    const id = uid('v');
    const willFail = sim.failNextSave;
    if (willFail) setSim({ failNextSave: false });
    update((d) => {
      const v: Video = {
        id, athleteId, areaId: areaId || null, goalId: goalId || null, sessionId: params.session ?? d.sessions.find((s) => s.date === TODAY && s.status === 'in_progress')?.id ?? null,
        title: 'Demo clip — throwdowns', duration: demo.duration, capturedAt: nowISO(),
        upload: willFail ? 'failed' : sim.online ? 'uploading' : 'queued', progress: 0, processing: 'pending', share: 'private',
        comments: comment.trim() ? [{ id: uid('vc'), t: 0, text: comment.trim(), shared: false }] : [], tint: '#1b5a3f',
      };
      d.videos.push(v);
      if (taskId) { const x = d.tasks.find((y) => y.id === taskId); if (x) x.evidenceVideoIds.push(id); }
    });
    setVideoId(id);
    setStep('upload');
  };

  if (step === 'source') {
    const Src = ({ Icon, title, sub, onPress, disabled, dashed }: { Icon: typeof Camera; title: string; sub: string; onPress?: () => void; disabled?: boolean; dashed?: boolean }) => (
      <Card onPress={disabled ? undefined : onPress} style={{ padding: 20, opacity: disabled ? 0.55 : 1, borderStyle: dashed ? 'dashed' : 'solid' }} label={title}>
        <Row gap={3}><Icon size={28} color={t.roleText} /><View style={{ flex: 1 }}><Txt strong>{title}</Txt><Txt variant="xs" muted>{sub}</Txt></View></Row>
      </Card>
    );
    return (
      <Stack gap={3}>
        <Src Icon={Camera} title="Record a clip" sub="Needs the native camera module, added with the video review build." disabled />
        <Src Icon={Upload} title="Upload an existing clip" sub="Needs the native media picker, added with the video review build." disabled />
        <Src Icon={Film} dashed title="Use a demo clip" sub="For trying the flow without a real video" onPress={() => setStep('review')} />
        {!sim.online ? <Banner tone="info">Offline: clips are kept on the device and queued for upload.</Banner> : null}
      </Stack>
    );
  }
  if (step === 'review') {
    return (
      <Stack gap={3}>
        <Clip video={demoVideo} />
        <Txt variant="small" muted>Demo clip (no real media) · {fmtTime(demo.duration)}</Txt>
        <Row gap={2}>
          <View style={{ flex: 1 }}><Button block icon={<RotateCcw size={14} color={t.text} />} onPress={() => setStep('source')}>Retake</Button></View>
          <View style={{ flex: 1 }}><Button block variant="primary" onPress={() => setStep('attach')}>Use clip</Button></View>
        </Row>
      </Stack>
    );
  }
  if (step === 'attach') {
    return (
      <Stack gap={4}>
        <Field label="Athlete" error={touched && !athleteId ? 'A clip must be linked to an athlete.' : undefined}><ChoiceGroup label="Athlete" value={athleteId} onChange={(v) => { setAthleteId(v); setAreaId(''); setGoalId(''); }} options={db.athletes.filter((a) => a.status === 'active' && c.inScope(a.id)).map((a) => ({ v: a.id, label: a.name }))} /></Field>
        {athleteId ? <Field label="Development area" optional><ChoiceGroup label="Development area" value={areaId} onChange={(v) => { setAreaId(v); setGoalId(''); }} none="None" options={areas.map((a) => ({ v: a.id, label: a.title }))} /></Field> : null}
        {areaId ? <Field label="Goal" optional><ChoiceGroup label="Goal" value={goalId} onChange={setGoalId} none="None" options={goals.map((g) => ({ v: g.id, label: g.title }))} /></Field> : null}
        <Field label="Comment" optional hint="Coaches only, until you share it"><Input value={comment} onChangeText={setComment} /></Field>
        <Button variant="primary" size="lg" block icon={<Upload size={16} color={t.accentInk} />} onPress={startUpload}>{sim.online ? 'Upload' : 'Queue for upload'}</Button>
      </Stack>
    );
  }
  if (step === 'upload' && video) {
    return (
      <Stack gap={3}>
        <Clip video={video} />
        <Row gap={2} wrap><StatusBadge status={video.upload} /><StatusBadge status={video.upload === 'uploaded' ? video.processing : 'pending'} label={video.upload === 'uploaded' ? undefined : 'Processing after upload'} /></Row>
        <Txt variant="xs" muted>Simulated media server: the prototype has no real upload, so progress is simulated.</Txt>
        {video.upload === 'failed' ? <Banner tone="err" action={<Button size="sm" onPress={() => update((d) => { const v = d.videos.find((x) => x.id === video.id)!; v.upload = sim.online ? 'uploading' : 'queued'; v.progress = 0; })}>Retry</Button>}>Upload failed. The clip and its links are kept on this device.</Banner> : null}
        {video.upload === 'uploading' || video.upload === 'queued' ? <Button block onPress={() => { toast({ tone: 'info', text: 'Uploading in the background. Check progress in the sync queue.' }); nav.goBack(); }}>Continue in background</Button> : null}
        {video.upload === 'uploaded' ? <Button variant="primary" block onPress={() => nav.navigate('VideoReview', { id: video.id })}>Review clip</Button> : null}
      </Stack>
    );
  }
  return null;
}

/** Placeholder: timestamped review with the skeleton overlay is the next build. */
export function VideoReview() {
  const { id } = useRoute<any>().params;
  const { db } = useStore();
  const v = db.videos.find((x) => x.id === id);
  useCompanionContext(v ? { surface: 'coach', title: `Clip · ${v.title}`, athleteId: v.athleteId, prompts: ['Summarise recent sessions'] } : null);
  return (
    <CoachPage back>
      <CoachGate>
        {!v ? <Banner tone="warn">This clip is no longer available.</Banner> : (
          <Stack gap={3}>
            <Display size={32}>{v.title}</Display>
            <Clip video={v} />
            <Banner tone="info">Timestamped comments with the skeleton overlay arrive with the video review build. Nothing is shared with the athlete from here yet.</Banner>
          </Stack>
        )}
      </CoachGate>
    </CoachPage>
  );
}
