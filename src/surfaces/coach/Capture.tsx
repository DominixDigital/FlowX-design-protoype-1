import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Camera, Upload, Film, RotateCcw, Trash2, Pause, Play, Pencil, Share2, Lock, Eye, AlertTriangle, Mic } from 'lucide-react';
import { useStore, uid, nowISO } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { areaById, athleteById, fmtTime } from '../../store/selectors';
import type { Video } from '../../data/types';
import { Assumption, AssumptionNote, Banner, Button, ConfirmDialog, Field, FlowCode, StatusBadge, StateBlock } from '../../components/ui';
import { Clip } from '../../components/art';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { CoachHeader, CoachGate, NotFound } from './parts';
import { useCoach } from './useCoach';

/** In-memory object URLs for clips picked on this device (never uploaded anywhere). */
export const localMedia = new Map<string, string>();

/** Simulated media server: advances upload → processing → ready in the background (CM10.10).
 *  Clearly a prototype stand-in; there is no real upload. */
export function UploadSimulator() {
  const { db, update, sim } = useStore();
  const ref = useRef({ db, sim });
  ref.current = { db, sim };
  useEffect(() => {
    const t = setInterval(() => {
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
    return () => clearInterval(t);
  }, [update]);
  return null;
}

export function Capture() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'video' ? 'video' : 'note';
  const h = useCompanion();
  return (
    <>
      <CoachHeader title="Capture" back={params.get('athlete') ? `/coach/athlete/${params.get('athlete')}` : undefined} />
      <CoachGate>
        <h1 className="display display-lg m-section">Capture</h1>
        <div className="seg m-section" role="tablist" aria-label="Capture type" style={{ width: '100%' }}>
          {(['note', 'video'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} aria-pressed={mode === m} style={{ flex: 1 }}
              onClick={() => { const p = new URLSearchParams(params); p.set('mode', m); setParams(p, { replace: true }); }}>
              {m === 'note' ? 'Observation' : 'Video'}
            </button>
          ))}
        </div>
        {mode === 'note' ? (
          <>
            <button className="card card-link row gap-3 m-section" data-theme="floodlit" style={{ background: 'var(--char-700)', color: 'var(--grey-50)', borderColor: 'var(--char-400)' }} onClick={() => h.openCompanion({ voice: true })}>
              <span className="mic" aria-hidden style={{ background: 'var(--hl)', color: 'var(--char-700)', border: 0 }}><Mic size={18} /></span>
              <span className="grow stack"><span className="strong">Talk it instead</span><span className="xs" style={{ color: 'var(--grey-600)' }}>dit drafts the note. You check it, then save.</span></span>
            </button>
            <NoteComposer />
          </>
        ) : <VideoCapture />}
      </CoachGate>
    </>
  );
}

/** CM05.01–06 (typed) + CM08.05 when opened from a task. */
function NoteComposer() {
  const [params] = useSearchParams();
  const { db, command, toast, sim } = useStore();
  const c = useCoach();
  const nav = useNavigate();
  const taskId = params.get('task');
  const todaySessions = db.sessions.filter((s) => s.date <= TODAY && s.status !== 'cancelled').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const [athleteId, setAthleteId] = useState(params.get('athlete') ?? '');
  const [sessionId, setSessionId] = useState(params.get('session') ?? todaySessions.find((s) => s.date === TODAY)?.id ?? '');
  const [areaId, setAreaId] = useState('');
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const idem = useRef(uid('idem')); // one key per composed note: retries never duplicate

  useCompanionContext(athleteId ? {
    surface: 'coach', title: `Note · ${athleteById(db, athleteId)?.name}`, athleteId, sessionId: sessionId || undefined,
    prompts: ['Summarise recent sessions', 'What’s the next action?'],
  } : { surface: 'coach', title: 'New observation', prompts: ['What can you help with?'] });

  const areas = db.areas.filter((a) => a.athleteId === athleteId && (a.status === 'active' || a.status === 'reopened'));
  const athletes = db.athletes.filter((a) => a.status === 'active' && c.inScope(a.id));
  const errors = { athlete: touched && !athleteId ? 'Choose who this is about.' : '', text: touched && !text.trim() ? 'Write the observation.' : '' };

  const save = async (status: 'saved' | 'draft') => {
    setTouched(true);
    if (!athleteId || !text.trim()) return;
    setSaving(true);
    const id = uid('o');
    const res = await command({
      kind: 'observation',
      idempotencyKey: idem.current,
      label: `Observation · ${athleteById(db, athleteId)?.name}`,
      refId: id,
      apply: (d) => {
        if (d.observations.some((o) => o.id === id)) return;
        d.observations.push({ id, athleteId, sessionId: sessionId || null, areaId: areaId || null, text: text.trim(), source: 'typed', aiDrafted: false, authorId: c.coach!.id, createdAt: nowISO(), sync: 'queued', status });
        if (taskId) { const t = d.tasks.find((x) => x.id === taskId); if (t) t.evidenceObservationIds.push(id); }
      },
      setSync: (d, s) => { const o = d.observations.find((x) => x.id === id); if (o) o.sync = s; },
    });
    setSaving(false);
    if (res === 'failed' || res === 'uncertain') {
      toast({ tone: 'err', text: res === 'uncertain' ? 'No confirmation from the server. Your note is kept — retry from the queue is safe.' : 'The note didn’t sync. It’s kept on this device.', action: { label: 'Open queue', run: () => nav('/coach/sync') } });
    } else {
      toast({ tone: res === 'queued' ? 'warn' : 'ok', text: res === 'queued' ? 'Saved offline. It will sync when you reconnect.' : status === 'draft' ? 'Draft kept. Resolve it at session wrap-up.' : 'Observation saved.' });
    }
    if (taskId) nav(`/coach/tasks/${taskId}`);
    else nav(`/coach/athlete/${athleteId}${sessionId ? `?session=${sessionId}` : ''}`);
  };

  return (
    <form className="m-section stack gap-4" onSubmit={(e) => { e.preventDefault(); save('saved'); }}>
      <FlowCode codes="CM05.01–05.06" />
      {!sim.online && <Banner tone="info">Offline: this note saves on the device and syncs later. <FlowCode codes="CM14.04" /></Banner>}
      <Field id="n-a" label="Athlete" error={errors.athlete}>
        <select id="n-a" className="select" value={athleteId} onChange={(e) => { setAthleteId(e.target.value); setAreaId(''); }} aria-invalid={!!errors.athlete}>
          <option value="">Choose…</option>
          {athletes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field id="n-t" label="Observation" error={errors.text}>
        <textarea id="n-t" className="textarea" value={text} onChange={(e) => setText(e.target.value)} aria-invalid={!!errors.text} placeholder="What did you see?" />
      </Field>
      <Field id="n-s" label="Session" optional>
        <select id="n-s" className="select" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
          <option value="">Not linked to a session</option>
          {todaySessions.map((s) => <option key={s.id} value={s.id}>{s.title} · {s.date === TODAY ? 'today' : s.date}</option>)}
        </select>
      </Field>
      <Field id="n-d" label="Development area" optional>
        <select id="n-d" className="select" value={areaId} onChange={(e) => setAreaId(e.target.value)} disabled={!athleteId}>
          <option value="">Leave unstructured</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </Field>
      <AssumptionNote code="CM05.05" />
      <Button type="submit" variant="primary" size="lg" block pending={saving}>Save observation</Button>
      <Button variant="ghost" block onClick={() => save('draft')} disabled={saving}>Keep as draft</Button>
    </form>
  );
}

/** CM10.01–12: capture → review → attach → upload (+ background, failure, remove wrong link). */
function VideoCapture() {
  const [params] = useSearchParams();
  const { db, update, sim, setSim, toast } = useStore();
  const c = useCoach();
  const nav = useNavigate();
  const taskId = params.get('task');
  const [step, setStep] = useState<'source' | 'review' | 'attach' | 'upload'>('source');
  const [file, setFile] = useState<{ url: string | null; name: string; duration: number; demo: boolean } | null>(null);
  const [athleteId, setAthleteId] = useState(params.get('athlete') ?? '');
  const [areaId, setAreaId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [comment, setComment] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const recRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);

  useCompanionContext({ surface: 'coach', title: 'Video capture', athleteId: athleteId || undefined, prompts: ['What can you help with?'] });

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) { toast({ tone: 'err', text: 'That file isn’t a video. Choose a video clip.' }); return; }
    const url = URL.createObjectURL(f);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => setFile({ url, name: f.name, duration: Math.round(v.duration) || 30, demo: false });
    v.onerror = () => setFile({ url, name: f.name, duration: 30, demo: false });
    v.src = url;
    setStep('review');
  };

  const areas = db.areas.filter((a) => a.athleteId === athleteId && a.status !== 'closed');
  const goals = db.goals.filter((g) => g.areaId === areaId);
  const video = db.videos.find((v) => v.id === videoId);

  const startUpload = () => {
    setTouched(true);
    if (!athleteId) return;
    const id = uid('v');
    const willFail = sim.failNextSave;
    if (willFail) setSim({ failNextSave: false });
    if (file?.url) localMedia.set(id, file.url);
    update((d) => {
      const v: Video = {
        id, athleteId, areaId: areaId || null, goalId: goalId || null, sessionId: params.get('session') ?? d.sessions.find((s) => s.date === TODAY && s.status === 'in_progress')?.id ?? null,
        title: file?.demo ? 'Demo clip — throwdowns' : (file?.name ?? 'Clip').replace(/\.[^.]+$/, ''), duration: file?.duration ?? 30, capturedAt: nowISO(),
        upload: willFail ? 'failed' : sim.online ? 'uploading' : 'queued', progress: 0, processing: 'pending', share: 'private',
        comments: comment.trim() ? [{ id: uid('vc'), t: 0, text: comment.trim(), shared: false }] : [], tint: '#1b5a3f',
      };
      d.videos.push(v);
      if (taskId) { const t = d.tasks.find((x) => x.id === taskId); if (t) t.evidenceVideoIds.push(id); }
    });
    setVideoId(id);
    setStep('upload');
  };

  if (step === 'source') {
    return (
      <div className="m-section stack gap-3">
        <FlowCode codes="CM10.01 · CM10.04" />
        <input ref={recRef} type="file" accept="video/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <input ref={pickRef} type="file" accept="video/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <button className="card card-link row gap-3" style={{ padding: 20 }} onClick={() => recRef.current?.click()}>
          <Camera size={28} color="var(--role-600)" /><span className="grow stack"><span className="strong">Record a clip</span><span className="xs muted">Opens the phone camera. On a desktop it opens a file picker.</span></span>
        </button>
        <button className="card card-link row gap-3" style={{ padding: 20 }} onClick={() => pickRef.current?.click()}>
          <Upload size={28} color="var(--role-600)" /><span className="grow stack"><span className="strong">Upload an existing clip</span><span className="xs muted">From the camera roll or files</span></span>
        </button>
        <button className="card card-link row gap-3" style={{ padding: 20, borderStyle: 'dashed' }} onClick={() => { setFile({ url: null, name: 'demo.mp4', duration: 38, demo: true }); setStep('review'); }}>
          <Film size={28} color="var(--taupe-600)" /><span className="grow stack"><span className="strong">Use a demo clip</span><span className="xs muted">For trying the flow without a real video</span></span>
        </button>
        {!sim.online && <Banner tone="info">Offline: clips are kept on the device and queued for upload. <FlowCode codes="CM14.05–06" /></Banner>}
      </div>
    );
  }

  if (step === 'review' && file) {
    return (
      <div className="m-section stack gap-3">
        <FlowCode codes="CM10.03" />
        {file.url ? <video src={file.url} controls playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} /> : (
          <Clip video={{ id: 'demo', athleteId: '', areaId: null, goalId: null, sessionId: null, title: 'Demo clip', duration: file.duration, capturedAt: '', upload: 'uploaded', progress: 100, processing: 'ready', share: 'private', comments: [], tint: '#1b5a3f' }} />
        )}
        <p className="small muted">{file.demo ? 'Demo clip (no real media)' : file.name} · {fmtTime(file.duration)}</p>
        <div className="row gap-2">
          <Button className="grow" icon={<RotateCcw size={14} />} onClick={() => { setFile(null); setStep('source'); }}>Retake</Button>
          <Button className="grow" variant="primary" onClick={() => setStep('attach')}>Use clip</Button>
        </div>
      </div>
    );
  }

  if (step === 'attach') {
    return (
      <form className="m-section stack gap-4" onSubmit={(e) => { e.preventDefault(); startUpload(); }}>
        <FlowCode codes="CM10.05–10.09" />
        <Field id="v-a" label="Athlete" error={touched && !athleteId ? 'A clip must be linked to an athlete.' : ''}>
          <select id="v-a" className="select" value={athleteId} onChange={(e) => { setAthleteId(e.target.value); setAreaId(''); setGoalId(''); }}>
            <option value="">Choose…</option>
            {db.athletes.filter((a) => a.status === 'active' && c.inScope(a.id)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field id="v-d" label="Development area" optional>
          <select id="v-d" className="select" value={areaId} onChange={(e) => { setAreaId(e.target.value); setGoalId(''); }} disabled={!athleteId}>
            <option value="">None</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </Field>
        <Field id="v-g" label="Goal" optional>
          <select id="v-g" className="select" value={goalId} onChange={(e) => setGoalId(e.target.value)} disabled={!areaId}>
            <option value="">None</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </Field>
        <Assumption code="CM10.07" />
        <Field id="v-c" label="Comment" optional hint="Coaches only, until you share it">
          <input id="v-c" className="input" value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary" size="lg" block icon={<Upload size={16} />}>{sim.online ? 'Upload' : 'Queue for upload'}</Button>
      </form>
    );
  }

  if (step === 'upload' && video) {
    return (
      <div className="m-section stack gap-3">
        <FlowCode codes="CM10.09–10.11" />
        <Clip video={video} />
        <div className="row gap-2 wrap"><StatusBadge status={video.upload} /><StatusBadge status={video.upload === 'uploaded' ? video.processing : 'pending'} label={video.upload === 'uploaded' ? undefined : 'Processing after upload'} /></div>
        <p className="xs muted">Simulated media server: the prototype has no real upload, so progress is simulated.</p>
        {video.upload === 'failed' && (
          <Banner tone="err" action={<Button size="sm" onClick={() => update((d) => { const v = d.videos.find((x) => x.id === video.id)!; v.upload = sim.online ? 'uploading' : 'queued'; v.progress = 0; })}>Retry</Button>}>
            Upload failed. The clip and its links are kept on this device.
          </Banner>
        )}
        {(video.upload === 'uploading' || video.upload === 'queued') && (
          <Button block onClick={() => { toast({ tone: 'info', text: 'Uploading in the background. Check progress in the sync queue.' }); nav(taskId ? `/coach/tasks/${taskId}` : `/coach/athlete/${athleteId}`); }}>
            Continue in background
          </Button>
        )}
        {video.upload === 'uploaded' && <Link className="btn btn-primary btn-block" to={`/coach/video/${video.id}`}>Review and comment</Link>}
      </div>
    );
  }
  return null;
}

/** CM11.01–06 + CM10.12 */
export function VideoReview() {
  const { id } = useParams();
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const v = db.videos.find((x) => x.id === id);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [relink, setRelink] = useState(false);
  const [relinkTo, setRelinkTo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const mediaRef = useRef<HTMLVideoElement>(null);
  const url = id ? localMedia.get(id) : undefined;

  useCompanionContext(v ? { surface: 'coach', title: `Clip · ${v.title}`, athleteId: v.athleteId, prompts: ['Summarise recent sessions'] } : null);

  useEffect(() => {
    if (!playing || url || !v) return;
    const iv = setInterval(() => setT((x) => (x + 0.25 >= v.duration ? (setPlaying(false), v.duration) : x + 0.25)), 250);
    return () => clearInterval(iv);
  }, [playing, url, v]);

  if (!v) return <><CoachHeader back="/coach" /><NotFound what="clip" back="/coach" /></>;
  const athlete = athleteById(db, v.athleteId);
  const ready = v.upload === 'uploaded' && v.processing === 'ready';
  const comments = [...v.comments].sort((a, b) => a.t - b.t);

  const seek = (x: number) => { setT(x); if (mediaRef.current) mediaRef.current.currentTime = x; };
  const addComment = () => {
    if (!text.trim()) return;
    update((d) => {
      const vid = d.videos.find((x) => x.id === v.id)!;
      if (editing) { const cm = vid.comments.find((x) => x.id === editing)!; cm.text = text.trim(); }
      else vid.comments.push({ id: uid('vc'), t: Math.round(t), text: text.trim(), shared: false });
    });
    toast({ tone: 'ok', text: editing ? 'Comment updated.' : `Comment added at ${fmtTime(t)}.` });
    setText(''); setEditing(null);
  };

  return (
    <>
      <CoachHeader back={athlete ? `/coach/athlete/${athlete.id}` : '/coach'} backLabel={athlete?.name.split(' ')[0]} />
      <CoachGate>
        <section className="m-section">
          <div className="row gap-2 wrap"><StatusBadge status={v.share} />{!ready && <StatusBadge status={v.upload !== 'uploaded' ? v.upload : v.processing} />}</div>
          <h1 className="h2" style={{ marginTop: 6 }}>{v.title}</h1>
          <p className="small muted">{athlete?.name} · {areaById(db, v.areaId)?.title ?? 'No development area'}</p>
        </section>
        <section className="m-section stack gap-2">
          {url ? (
            <video ref={mediaRef} src={url} controls playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} />
          ) : <Clip video={v} compact />}
          {ready && (
            <>
              {!url && <p className="xs muted">No media in the prototype. Use the timeline to move to a moment.</p>}
              <div className="row gap-2">
                {!url && <Button size="sm" className="btn-icon" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={16} /> : <Play size={16} />}</Button>}
                <div className="scrubber grow">
                  <div className="scrubber-track" />
                  <div className="scrubber-fill" style={{ width: `${(t / v.duration) * 100}%` }} />
                  {comments.map((cm) => (
                    <button key={cm.id} className="scrubber-pin" data-private={!cm.shared} style={{ left: `${(cm.t / v.duration) * 100}%` }} onClick={() => seek(cm.t)} aria-label={`Comment at ${fmtTime(cm.t)}`} />
                  ))}
                  <label className="sr-only" htmlFor="scrub">Position</label>
                  <input id="scrub" type="range" min={0} max={v.duration} step={0.5} value={t} onChange={(e) => { setPlaying(false); seek(Number(e.target.value)); }} />
                </div>
                <span className="num" style={{ fontSize: '1.2rem', minWidth: 44, textAlign: 'right' }}>{fmtTime(t)}</span>
              </div>
            </>
          )}
          {v.processing === 'failed' && <StateBlock kind="error" title="Processing failed" body="The server couldn’t process this clip. Re-upload the original from the device it was recorded on." />}
        </section>

        {ready && (
          <>
            <section className="m-section">
              <form className="stack gap-2" onSubmit={(e) => { e.preventDefault(); addComment(); }}>
                <label htmlFor="vc-text" className="small strong">{editing ? 'Edit comment' : `Comment at ${fmtTime(t)}`} <FlowCode codes={editing ? 'CM11.04' : 'CM11.02–03'} /></label>
                <div className="row gap-2">
                  <input id="vc-text" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="What should they notice here?" onFocus={() => setPlaying(false)} />
                  <Button type="submit" variant="primary" disabled={!text.trim()}>{editing ? 'Save' : 'Add'}</Button>
                </div>
              </form>
            </section>
            <section className="m-section">
              <div className="section-head"><h2 className="h3">Comments</h2><span className="xs muted">{comments.length} · CM11.05</span></div>
              {comments.length === 0 && <p className="small muted">No comments yet. Pause at a moment and add one.</p>}
              <ul className="list card card-flush">
                {comments.map((cm) => (
                  <li key={cm.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                    <button className="badge badge-lime" style={{ border: 0, cursor: 'pointer' }} onClick={() => seek(cm.t)} aria-label={`Go to ${fmtTime(cm.t)}`}>{fmtTime(cm.t)}</button>
                    <span className="grow small">{cm.text}</span>
                    <span title={cm.shared ? 'Shared with athlete' : 'Coaches only'} aria-label={cm.shared ? 'Shared with athlete' : 'Coaches only'}>{cm.shared ? <Eye size={14} /> : <Lock size={14} color="var(--text-muted)" />}</span>
                    <button className="btn btn-ghost btn-icon btn-sm" aria-label="Edit comment" onClick={() => { setEditing(cm.id); setText(cm.text); seek(cm.t); }}><Pencil size={14} /></button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="m-section stack gap-2">
              <Button variant="primary" block icon={<Share2 size={16} />} disabled={!comments.length} onClick={() => { setSelected(comments.filter((x) => x.shared).map((x) => x.id)); setShareOpen(true); }}>
                Share selected feedback
              </Button>
              {v.share === 'shared' && (
                <Button variant="ghost" block onClick={() => {
                  update((d) => { d.videos.find((x) => x.id === v.id)!.share = 'withdrawn'; d.feedback.forEach((f) => { if (f.videoId === v.id) f.status = 'withdrawn'; }); });
                  audit(c.person.name, `Withdrew shared clip ${v.title}`, v.id);
                  toast({ tone: 'info', text: 'Clip withdrawn. The athlete sees that it was withdrawn.' });
                }}>Withdraw from athlete</Button>
              )}
              <Button variant="ghost" block icon={<Trash2 size={14} />} onClick={() => setRelink(true)}>Linked to the wrong athlete?</Button>
            </section>
          </>
        )}

        <ConfirmDialog
          open={shareOpen}
          title={`Share with ${athlete?.name.split(' ')[0]}`}
          body="Only the comments you tick are shared. The athlete and their parents can see shared clips."
          confirmLabel={`Share ${selected.length} comment${selected.length === 1 ? '' : 's'}`}
          onCancel={() => setShareOpen(false)}
          onConfirm={() => {
            if (!selected.length) return;
            update((d) => {
              const vid = d.videos.find((x) => x.id === v.id)!;
              vid.comments.forEach((cm) => { cm.shared = selected.includes(cm.id); });
              vid.share = 'shared';
              const fid = uid('f');
              d.feedback.push({ id: fid, athleteId: v.athleteId, coachId: c.coach!.id, text: message.trim() || `New clip: ${v.title}`, videoId: v.id, status: 'published', publishedAt: nowISO() });
              const ap = d.people.find((p) => p.athleteId === v.athleteId);
              if (ap) d.notifications.push({ id: uid('n'), personId: ap.id, kind: 'video', title: `${c.person.name} shared a clip`, body: v.title, route: `/athlete/feedback/${fid}`, target: { type: 'feedback', id: fid }, createdAt: nowISO(), read: false });
            });
            audit(c.person.name, `Shared ${selected.length} comment(s) on ${v.title}`, v.id);
            setShareOpen(false);
            toast({ tone: 'ok', text: 'Shared. The athlete has been notified.' });
          }}
        >
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="small strong">Comments to share <FlowCode codes="CM11.06" /></legend>
            {comments.map((cm) => (
              <label key={cm.id} className="check-row">
                <input type="checkbox" checked={selected.includes(cm.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, cm.id] : s.filter((x) => x !== cm.id)))} />
                <span className="small"><strong>{fmtTime(cm.t)}</strong> {cm.text}</span>
              </label>
            ))}
          </fieldset>
          <div className="field"><label htmlFor="sh-msg">Message <span className="muted">(optional)</span></label><input id="sh-msg" className="input" value={message} onChange={(e) => setMessage(e.target.value)} /></div>
          {!selected.length && <p className="xs" style={{ color: 'var(--err)' }}><AlertTriangle size={12} style={{ display: 'inline' }} /> Tick at least one comment.</p>}
        </ConfirmDialog>

        <ConfirmDialog
          open={relink}
          title="Move this clip to another athlete"
          body={`It is currently linked to ${athlete?.name}. Any sharing is withdrawn when you move it. The change is logged.`}
          confirmLabel="Move clip"
          tone="danger"
          onCancel={() => setRelink(false)}
          onConfirm={() => {
            if (!relinkTo) return;
            update((d) => { const vid = d.videos.find((x) => x.id === v.id)!; vid.athleteId = relinkTo; vid.areaId = null; vid.goalId = null; if (vid.share === 'shared') vid.share = 'withdrawn'; });
            audit(c.person.name, `Moved clip ${v.title} from ${athlete?.name} to ${athleteById(db, relinkTo)?.name}`, v.id);
            setRelink(false);
            toast({ tone: 'ok', text: 'Clip moved.' });
          }}
        >
          <div className="field">
            <label htmlFor="relink">Correct athlete <FlowCode codes="CM10.12" /></label>
            <select id="relink" className="select" value={relinkTo} onChange={(e) => setRelinkTo(e.target.value)}>
              <option value="">Choose…</option>
              {db.athletes.filter((a) => a.status === 'active' && a.id !== v.athleteId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </ConfirmDialog>
      </CoachGate>
    </>
  );
}

