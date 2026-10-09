import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, X, UserPlus, MapPin, Clock, Users, Play, Square, AlertTriangle, CloudOff, Search, History } from 'lucide-react';
import { useStore } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { athleteById, batchById, fmtDate, locationName } from '../../store/selectors';
import type { AttendanceMark, Session } from '../../data/types';
import { Avatar, Banner, Button, ConfirmDialog, FlowCode, StatusBadge, StateBlock, Assumption, AssumptionNote } from '../../components/ui';
import { useHuddleContext } from '../../huddle/Huddle';
import { CoachHeader, CoachGate, NotFound } from './parts';
import { useCoach } from './useCoach';

export function Sessions() {
  const { db } = useStore();
  const c = useCoach();
  useHuddleContext({ surface: 'coach', title: 'Sessions', prompts: ['What can you help with?'] });
  const mine = db.sessions.filter((s) => c.role === 'head_coach' || s.coachId === c.coach?.id || batchById(db, s.batchId)?.assistantIds.includes(c.coach?.id ?? ''));
  const upcoming = mine.filter((s) => s.date >= TODAY && s.status !== 'completed' && s.status !== 'cancelled').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const history = mine.filter((s) => s.status === 'completed' || s.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date));
  const row = (s: Session) => (
    <li key={s.id}>
      <Link to={`/coach/session/${s.id}`} className="list-row">
        <span className="stack" style={{ width: 52 }}>
          <span className="num" style={{ fontSize: '1.4rem' }}>{fmtDate(s.date, { day: 'numeric' })}</span>
          <span className="xs muted">{fmtDate(s.date, { month: 'short' })}</span>
        </span>
        <span className="grow stack">
          <span className="small strong">{s.title}</span>
          <span className="xs muted">{batchById(db, s.batchId)?.name} · {s.start}</span>
        </span>
        <StatusBadge status={s.status} />
      </Link>
    </li>
  );
  return (
    <>
      <CoachHeader title="Sessions" />
      <CoachGate>
        <h1 className="display display-lg m-section">Sessions</h1>
        <FlowCode codes="CM02.01 · CM13.05" />
        <section className="m-section">
          <h2 className="h3" style={{ marginBottom: 8 }}>Coming up</h2>
          {upcoming.length ? <ul className="list card card-flush">{upcoming.map(row)}</ul> : <StateBlock kind="empty" title="No upcoming sessions" />}
        </section>
        <section className="m-section">
          <h2 className="h3 row gap-2" style={{ marginBottom: 8 }}><History size={16} /> History</h2>
          {history.length ? <ul className="list card card-flush">{history.map(row)}</ul> : <StateBlock kind="empty" title="No past sessions yet" />}
        </section>
      </CoachGate>
    </>
  );
}

export function SessionDetail() {
  const { id } = useParams();
  const { db, update, command, sim, toast, audit } = useStore();
  const c = useCoach();
  const nav = useNavigate();
  const session = db.sessions.find((s) => s.id === id);
  const [draft, setDraft] = useState<Record<string, AttendanceMark> | null>(null);
  const [saving, setSaving] = useState(false);
  const [notListed, setNotListed] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [q, setQ] = useState('');

  useHuddleContext(session ? {
    surface: 'coach', title: `${session.title} · ${batchById(db, session.batchId)?.name}`, sessionId: session.id,
    prompts: ['What can you help with?'],
  } : null);

  const marks = draft ?? session?.attendance ?? {};
  const roster = useMemo(() => Object.keys(marks), [marks]);
  if (!session) return <><CoachHeader back="/coach" /><NotFound what="session" back="/coach" /></>;

  const batch = batchById(db, session.batchId)!;
  const isPast = session.status === 'completed';
  const unmarked = roster.filter((a) => marks[a] === 'unmarked').length;
  const present = roster.filter((a) => marks[a] === 'present').length;
  const dirty = draft !== null;
  const hasSaved = Object.values(session.attendance).some((m) => m !== 'unmarked');

  const mark = (aid: string, m: AttendanceMark) => setDraft({ ...marks, [aid]: m });

  const start = () => {
    update((d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.status = 'in_progress'; });
    audit(c.person.name, `Started session ${session.title}`, session.id);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const changed = Object.keys(draft).filter((k) => draft[k] !== session.attendance[k]);
    const correcting = hasSaved;
    const res = await command({
      kind: 'attendance',
      label: `Attendance · ${session.title}`,
      refId: session.id,
      apply: (d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.attendance = { ...draft }; },
      setSync: (d, st) => { const s = d.sessions.find((x) => x.id === session.id); if (s) s.attendanceSync = st; },
      conflict: { field: 'a-kabir', mine: draft['a-kabir'] ?? 'present', theirs: 'absent', theirsBy: 'Rohan Shah (web), 2 min ago' },
    });
    setSaving(false);
    setDraft(null);
    if (correcting) audit(c.person.name, `Corrected attendance for ${changed.length} athlete(s) in ${session.title}`, session.id);
    toast(
      res === 'queued' ? { tone: 'warn', text: 'Attendance saved on this device. It will sync when you reconnect.' }
        : res === 'failed' ? { tone: 'err', text: 'Attendance didn’t reach the server. It’s kept here — open the sync queue to retry or resolve.', action: { label: 'Open queue', run: () => nav('/coach/sync') } }
          : res === 'conflict' ? { tone: 'err', text: 'Someone changed this attendance on the web. Choose which version to keep.', action: { label: 'Resolve', run: () => nav('/coach/sync') } }
          : res === 'uncertain' ? { tone: 'warn', text: 'No confirmation from the server. Retry is safe — it won’t double-count.', action: { label: 'Open queue', run: () => nav('/coach/sync') } }
            : { tone: 'ok', text: correcting ? 'Attendance corrected.' : `Attendance saved: ${present} present.` },
    );
  };

  const others = db.athletes.filter((a) => !roster.includes(a.id) && a.status === 'active' && a.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <CoachHeader back="/coach" backLabel="Today" />
      <CoachGate>
        <section className="m-section">
          <div className="row gap-2 wrap">
            <span className="xs strong" style={{ color: 'var(--forest-600)' }}>{batch.name}</span>
            <StatusBadge status={session.status} label={session.status === 'in_progress' ? 'Live' : undefined} />
            {session.attendanceSync !== 'synced' && <StatusBadge status={session.attendanceSync} />}
          </div>
          <h1 className="display display-lg" style={{ marginTop: 6 }}>{session.title}</h1>
          <div className="stack gap-1 small muted" style={{ marginTop: 10 }}>
            <span className="row gap-2"><Clock size={14} /> {fmtDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {session.start}–{session.end}</span>
            <span className="row gap-2"><MapPin size={14} /> {locationName(db, session.locationId)}</span>
            <span className="row gap-2"><Users size={14} /> {roster.length} athletes</span>
          </div>
          <details className="card card-sunk" style={{ marginTop: 12 }}>
            <summary className="small strong" style={{ cursor: 'pointer' }}>Session plan <FlowCode codes="CM02.03" /></summary>
            <p className="small" style={{ marginTop: 8 }}>{session.plan}</p>
          </details>
        </section>

        {session.status === 'scheduled' && (
          <div className="m-section">
            <Button variant="primary" size="lg" block onClick={start} icon={<Play size={18} />}>Start session</Button>
            <p className="xs muted" style={{ marginTop: 6 }}>You can take attendance before or after starting. <FlowCode codes="CM02.04" /></p>
          </div>
        )}
        {session.status === 'cancelled' && <div className="m-section"><Banner tone="warn">This session was cancelled. Its record is kept for history.</Banner></div>}

        {!sim.online && <div className="m-section"><Banner tone="info"><CloudOff size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> You’re offline. This session is cached, so attendance and notes save here and sync later. <FlowCode codes="CM14.02–04" /></Banner></div>}

        <section className="m-section" aria-labelledby="att-h">
          <div className="section-head">
            <h2 id="att-h" className="h3">Attendance</h2>
            <span className="small muted">{present} present · {unmarked} unmarked</span>
          </div>
          {isPast && hasSaved && !dirty && <p className="xs muted" style={{ marginBottom: 8 }}>Correcting past attendance is logged in the audit history. <FlowCode codes="CM03.06" /></p>}
          <div className="row gap-2" style={{ marginBottom: 10 }}>
            <Button size="sm" onClick={() => setDraft(Object.fromEntries(roster.map((a) => [a, marks[a] === 'unmarked' ? 'present' : marks[a]])))} disabled={!unmarked}>
              Mark the rest present
            </Button>
            <Button size="sm" variant="ghost" icon={<UserPlus size={14} />} onClick={() => setNotListed(true)}>Not listed?</Button>
          </div>
          <ul className="list card card-flush">
            {roster.map((aid) => {
              const a = athleteById(db, aid)!;
              const walkIn = session.walkIns.includes(aid);
              return (
                <li key={aid}>
                  <div className="list-row" style={{ paddingRight: 10 }}>
                    <Avatar name={a.name} size="sm" />
                    <Link to={`/coach/athlete/${aid}?session=${session.id}`} className="grow stack" style={{ textDecoration: 'none', minWidth: 0 }}>
                      <span className="small strong">{a.name}</span>
                      <span className="xs muted">{walkIn ? 'Walk-in · pending admin review' : a.discipline}</span>
                    </Link>
                    <div className="seg" role="group" aria-label={`Attendance for ${a.name}`}>
                      <button className="is-present" aria-pressed={marks[aid] === 'present'} onClick={() => mark(aid, 'present')} aria-label={`${a.name} present`}><Check size={14} /></button>
                      <button className="is-absent" aria-pressed={marks[aid] === 'absent'} onClick={() => mark(aid, 'absent')} aria-label={`${a.name} absent`}><X size={14} /></button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {(dirty || session.attendanceSync === 'failed') && (
            <div style={{ position: 'sticky', bottom: 88, marginTop: 12, zIndex: 3 }}>
              <Button variant="primary" size="lg" block pending={saving} onClick={save} disabled={!dirty}>
                {hasSaved ? 'Save corrections' : 'Save attendance'}{unmarked ? ` (${unmarked} unmarked)` : ''}
              </Button>
            </div>
          )}
          {session.attendanceSync === 'conflict' && (
            <div style={{ marginTop: 12 }}>
              <Banner tone="err" action={<Link className="btn btn-sm" to="/coach/sync">Resolve</Link>}>
                <AlertTriangle size={14} style={{ display: 'inline' }} /> Someone changed this attendance on the web while you were editing.
              </Banner>
            </div>
          )}
        </section>

        {session.status === 'in_progress' && (
          <div className="m-section">
            <Button block size="lg" icon={<Square size={16} />} onClick={() => setConfirmEnd(true)}>End session</Button>
          </div>
        )}
        {session.status === 'completed' && (
          <div className="m-section"><Link className="btn btn-block" to={`/coach/session/${session.id}/wrap`}>Session summary</Link></div>
        )}

        <ConfirmDialog
          open={confirmEnd}
          title="End this session?"
          body="Next you’ll check draft notes and uploads before the session is marked complete."
          confirmLabel="End and review"
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => { setConfirmEnd(false); nav(`/coach/session/${session.id}/wrap`); }}
        />

        {notListed && (
          <>
            <div className="scrim" onClick={() => setNotListed(false)} aria-hidden />
            <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="nl-h">
              <div className="sheet-grip" />
              <div className="sheet-body stack gap-3">
                <h2 id="nl-h" className="h2">Athlete not on the roster</h2>
                <Assumption code="CM03.04" />
                <AssumptionNote code="CM03.04" />
                <div className="field">
                  <label htmlFor="nl-q">Search the academy</label>
                  <div className="row gap-2"><Search size={16} aria-hidden /><input id="nl-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name" /></div>
                </div>
                <ul className="list card card-flush" style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {others.length === 0 && <li className="list-row small muted">No matching athlete. Ask an admin to add them first (MW03.01).</li>}
                  {others.map((a) => (
                    <li key={a.id}>
                      <button className="list-row" onClick={() => {
                        update((d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.attendance[a.id] = 'present'; s.walkIns.push(a.id); });
                        audit(c.person.name, `Added walk-in ${a.name} to ${session.title} (pending review)`, session.id);
                        toast({ tone: 'info', text: `${a.name} added as a walk-in and marked present. An admin will review.` });
                        setNotListed(false);
                      }}>
                        <Avatar name={a.name} size="sm" />
                        <span className="grow stack"><span className="small strong">{a.name}</span><span className="xs muted">{batchById(db, a.batchId)?.name ?? 'No batch'}</span></span>
                        <UserPlus size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
                <Button onClick={() => setNotListed(false)}>Close</Button>
              </div>
            </div>
          </>
        )}
      </CoachGate>
    </>
  );
}

export function WrapUp() {
  const { id } = useParams();
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const session = db.sessions.find((s) => s.id === id);
  useHuddleContext(session ? { surface: 'coach', title: `Wrap-up · ${session.title}`, sessionId: session.id, prompts: ['What can you help with?'] } : null);
  if (!session) return <><CoachHeader back="/coach" /><NotFound what="session" back="/coach" /></>;

  const drafts = db.observations.filter((o) => o.sessionId === session.id && o.status === 'draft');
  const uploads = db.videos.filter((v) => v.sessionId === session.id && v.upload !== 'uploaded');
  const unsyncedAttendance = session.attendanceSync !== 'synced';
  const unmarked = Object.values(session.attendance).filter((m) => m === 'unmarked').length;
  const notes = db.observations.filter((o) => o.sessionId === session.id && o.status === 'saved');
  const done = session.status === 'completed';
  const blockers = drafts.length + (unmarked ? 1 : 0);

  const complete = () => {
    update((d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.status = 'completed'; });
    audit(c.person.name, `Completed session ${session.title}`, session.id);
    toast({ tone: 'ok', text: uploads.length ? 'Session complete. Uploads will continue in the background.' : 'Session complete.' });
  };

  const Item = ({ ok, label, detail, action }: { ok: boolean; label: string; detail: string; action?: React.ReactNode }) => (
    <li className="list-row" style={{ alignItems: 'flex-start' }}>
      <span className="state-icon" style={{ width: 28, height: 28, background: ok ? 'var(--ok-bg)' : 'var(--warn-bg)', color: ok ? 'var(--ok)' : 'var(--warn)' }} aria-hidden>
        {ok ? <Check size={14} /> : <AlertTriangle size={14} />}
      </span>
      <span className="grow stack gap-1"><span className="small strong">{label}</span><span className="xs muted">{detail}</span>{action}</span>
    </li>
  );

  return (
    <>
      <CoachHeader back={`/coach/session/${session.id}`} backLabel="Session" />
      <CoachGate>
        <section className="m-section">
          <p className="small muted">{session.title}</p>
          <h1 className="display display-lg">{done ? 'Session complete' : 'Wrap up'}</h1>
          <FlowCode codes="CM13.01–04" />
        </section>
        <ul className="list card card-flush m-section">
          <Item ok={!unmarked && !unsyncedAttendance} label="Attendance" detail={unmarked ? `${unmarked} athletes still unmarked` : unsyncedAttendance ? `Saved on device · ${session.attendanceSync}` : 'Saved and synced'}
            action={unmarked ? <Link className="small strong" to={`/coach/session/${session.id}`}>Finish attendance</Link> : undefined} />
          <Item ok={drafts.length === 0} label="Draft notes" detail={drafts.length ? `${drafts.length} unsaved draft(s)` : `${notes.length} notes saved this session`}
            action={drafts.length ? (
              <span className="row gap-2"><Button size="sm" onClick={() => update((d) => d.observations.forEach((o) => { if (o.sessionId === session.id && o.status === 'draft') o.status = 'saved'; }))}>Save all</Button>
                <Button size="sm" variant="ghost" onClick={() => update((d) => { d.observations = d.observations.filter((o) => !(o.sessionId === session.id && o.status === 'draft')); })}>Discard</Button></span>
            ) : undefined} />
          <Item ok={uploads.length === 0} label="Uploads" detail={uploads.length ? `${uploads.length} clip(s) ${uploads.map((u) => u.upload).join(', ')} — they can finish in the background` : 'Nothing waiting'}
            action={uploads.length ? <Link className="small strong" to="/coach/sync">View queue</Link> : undefined} />
        </ul>

        {!done ? (
          <div className="m-section stack gap-2">
            <Button variant="primary" size="lg" block disabled={blockers > 0} onClick={complete}>Complete session</Button>
            {blockers > 0 && <p className="xs muted">Resolve attendance and draft notes first. Uploads can finish later.</p>}
            <Button variant="danger" block onClick={() => setCancelOpen(true)}>Cancel session</Button>
          </div>
        ) : (
          <div className="m-section stack gap-2">
            <Banner tone="ok">Saved to every athlete’s history. Head coaches see it on the web now. <FlowCode codes="HC01.06–07" /></Banner>
            <Link to="/coach/sessions" className="btn btn-block">View session history</Link>
            <p className="xs muted">Need to fix something later? Open the session from history. Edits to past sessions are logged. <FlowCode codes="CM13.05–06" /></p>
          </div>
        )}
        <ConfirmDialog
          open={cancelOpen}
          title="Cancel this session?"
          body="Athletes and parents will see it as cancelled. Attendance and notes already taken are kept in history."
          confirmLabel="Cancel session"
          tone="danger"
          onCancel={() => setCancelOpen(false)}
          onConfirm={() => {
            if (!reason.trim()) return;
            update((d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.status = 'cancelled'; });
            audit(c.person.name, `Cancelled ${session.title}: ${reason}`, session.id);
            setCancelOpen(false);
            nav('/coach');
            toast({ tone: 'info', text: 'Session cancelled.' });
          }}
        >
          <div className="field">
            <label htmlFor="cancel-reason">Reason</label>
            <input id="cancel-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={!reason.trim()} placeholder="e.g. Rain, ground waterlogged" />
            {!reason.trim() && <span className="hint">A reason is required (CM13.07).</span>}
          </div>
        </ConfirmDialog>
      </CoachGate>
    </>
  );
}

