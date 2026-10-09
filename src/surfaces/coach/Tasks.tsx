import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ClipboardList, Play, Check, Ban, MessageSquarePlus, NotebookPen, Video as VideoIcon, ArrowRightLeft, Send } from 'lucide-react';
import { useStore, uid, nowISO } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { areaById, athleteById, coachById, fmtDate, daysUntil, observationsFor } from '../../store/selectors';
import { Banner, Button, ConfirmDialog, Field, FlowCode, StatusBadge, StateBlock, Assumption } from '../../components/ui';
import { useHuddleContext } from '../../huddle/Huddle';
import { CoachHeader, CoachGate, NotFound } from './parts';
import { useCoach } from './useCoach';

export function TaskList() {
  const { db } = useStore();
  const c = useCoach();
  useHuddleContext({ surface: 'coach', title: 'Tasks', prompts: ['What can you help with?'] });
  const mine = db.tasks.filter((t) => t.assigneeId === c.coach?.id);
  const active = mine.filter((t) => ['open', 'in_progress', 'blocked'].includes(t.status));
  const done = mine.filter((t) => ['completed', 'cancelled'].includes(t.status));
  const handovers = db.handovers.filter((h) => h.toId === c.coach?.id || h.fromId === c.coach?.id);
  return (
    <>
      <CoachHeader title="Tasks" />
      <CoachGate>
        <h1 className="display display-lg m-section">Tasks</h1>
        <FlowCode codes="CM08.01 · CM09" />
        <section className="m-section">
          <h2 className="h3" style={{ marginBottom: 8 }}>Assigned to you</h2>
          {active.length === 0 ? <StateBlock kind="empty" title="No open tasks" body="When a head coach delegates work to you, it lands here and you get a notification." /> : (
            <ul className="list card card-flush">
              {active.map((t) => (
                <li key={t.id}>
                  <Link to={`/coach/tasks/${t.id}`} className="list-row">
                    <ClipboardList size={18} aria-hidden />
                    <span className="grow stack"><span className="small strong">{t.title}</span><span className="xs muted">{athleteById(db, t.athleteId)?.name} · from {coachById(db, t.createdById)?.name} · due {daysUntil(t.due) === 0 ? 'today' : fmtDate(t.due)}</span></span>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="m-section">
          <div className="section-head"><h2 className="h3">Handovers</h2><Link to="/coach/handover/new" className="small strong">+ Start handover</Link></div>
          {handovers.length === 0 ? <StateBlock kind="empty" title="No handovers" /> : (
            <ul className="list card card-flush">
              {handovers.map((h) => (
                <li key={h.id}>
                  <Link to={`/coach/handover/${h.id}`} className="list-row">
                    <ArrowRightLeft size={18} aria-hidden />
                    <span className="grow stack"><span className="small strong">{athleteById(db, h.athleteId)?.name}</span><span className="xs muted">{h.fromId === c.coach?.id ? `To ${coachById(db, h.toId)?.name}` : `From ${coachById(db, h.fromId)?.name}`}</span></span>
                    <span className="badge badge-outline">{h.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        {done.length > 0 && (
          <section className="m-section">
            <h2 className="h3" style={{ marginBottom: 8 }}>Done</h2>
            <ul className="list card card-flush">
              {done.map((t) => (
                <li key={t.id}><Link to={`/coach/tasks/${t.id}`} className="list-row"><span className="grow small">{t.title}</span><StatusBadge status={t.status} /></Link></li>
              ))}
            </ul>
          </section>
        )}
      </CoachGate>
    </>
  );
}

/** CM08.02–09 with commit-time revalidation (XS04.S03, XS07.S08). */
export function TaskDetail() {
  const { id } = useParams();
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const task = db.tasks.find((t) => t.id === id);
  const openedVersion = useRef(task?.version);
  const [blockOpen, setBlockOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [follow, setFollow] = useState('');
  const [stale, setStale] = useState(false);

  useHuddleContext(task ? {
    surface: 'coach', title: `Task · ${task.title}`, athleteId: task.athleteId,
    prompts: ['Summarise recent sessions', 'What’s the next action?'],
  } : null);
  if (!task) return <><CoachHeader back="/coach/tasks" /><NotFound what="task" back="/coach/tasks" /></>;

  const athlete = athleteById(db, task.athleteId)!;
  const mineToAct = task.assigneeId === c.coach?.id;
  const evidence = observationsFor(db, task.athleteId).filter((o) => task.evidenceObservationIds.includes(o.id));
  const vids = db.videos.filter((v) => task.evidenceVideoIds.includes(v.id));
  const terminal = task.status === 'cancelled' || task.status === 'completed';

  /** Revalidate object state at commit time, not only at load. */
  const commit = (fn: () => void) => {
    const current = db.tasks.find((t) => t.id === task.id)!;
    if (current.version !== openedVersion.current) {
      setStale(true);
      return;
    }
    fn();
    openedVersion.current = (openedVersion.current ?? 0) + 1;
  };

  const setStatus = (status: typeof task.status, extra: Partial<typeof task> = {}, msg = '') =>
    commit(() => {
      update((d) => { const t = d.tasks.find((x) => x.id === task.id)!; Object.assign(t, { status, ...extra }); t.version += 1; });
      audit(c.person.name, `${msg || status} · ${task.title}`, task.id);
      if (msg) toast({ tone: 'ok', text: msg });
    });

  return (
    <>
      <CoachHeader back="/coach/tasks" backLabel="Tasks" />
      <CoachGate>
        <section className="m-section">
          <div className="row gap-2"><StatusBadge status={task.status} /><span className="xs muted">Due {fmtDate(task.due)}</span></div>
          <h1 className="display display-lg" style={{ marginTop: 6 }}>{task.title}</h1>
          <Link to={`/coach/athlete/${athlete.id}`} className="small strong">{athlete.name}</Link>
          {task.areaId && <span className="small muted"> · {areaById(db, task.areaId)?.title}</span>}
        </section>

        {task.status === 'cancelled' && <div className="m-section"><StateBlock kind="archived" title="This task was cancelled" body={`${coachById(db, task.createdById)?.name} cancelled it. Your notes and clips stay on ${athlete.name}’s record.`} /></div>}
        {stale && (
          <div className="m-section">
            <Banner tone="warn" action={<Button size="sm" onClick={() => { openedVersion.current = db.tasks.find((t) => t.id === task.id)!.version; setStale(false); }}>Reload task</Button>}>
              This task changed on the server since you opened it. Nothing was saved. Review the latest version, then try again.
            </Banner>
          </div>
        )}
        {!mineToAct && !terminal && <div className="m-section"><Banner tone="warn">This task is assigned to {coachById(db, task.assigneeId)?.name}. You can view it but not act on it.</Banner></div>}

        <section className="m-section card" style={{ borderLeft: '4px solid var(--forest-700)' }}>
          <p className="xs strong muted">Instruction from {coachById(db, task.createdById)?.name} <FlowCode codes="CM08.03" /></p>
          <p style={{ marginTop: 6 }}>{task.instruction}</p>
        </section>

        {task.status === 'blocked' && task.blockedReason && <div className="m-section"><Banner tone="err"><strong>Blocked:</strong> {task.blockedReason}</Banner></div>}
        {task.followUp && <div className="m-section"><Banner tone="info"><strong>Follow-up requested:</strong> {task.followUp}</Banner></div>}

        <section className="m-section">
          <h2 className="h3" style={{ marginBottom: 8 }}>Evidence</h2>
          {evidence.length + vids.length === 0 && <p className="small muted">No notes or clips attached yet.</p>}
          <ul className="list">
            {evidence.map((o) => <li key={o.id} className="small" style={{ padding: '8px 0' }}>“{o.text}” <span className="xs muted">· {fmtDate(o.createdAt)}</span></li>)}
            {vids.map((v) => <li key={v.id} className="small" style={{ padding: '8px 0' }}><Link to={`/coach/video/${v.id}`}>{v.title}</Link> <StatusBadge status={v.upload === 'uploaded' ? v.processing : v.upload} /></li>)}
          </ul>
          {mineToAct && !terminal && (
            <div className="row gap-2" style={{ marginTop: 8 }}>
              <Link className="btn btn-sm grow" to={`/coach/capture?mode=note&athlete=${athlete.id}&task=${task.id}`}><NotebookPen size={14} /> Add note</Link>
              <Link className="btn btn-sm grow" to={`/coach/capture?mode=video&athlete=${athlete.id}&task=${task.id}`}><VideoIcon size={14} /> Attach video</Link>
            </div>
          )}
        </section>

        {mineToAct && (
          <section className="m-section stack gap-2">
            {task.status === 'open' && <Button variant="primary" size="lg" block icon={<Play size={16} />} onClick={() => setStatus('in_progress', {}, 'Task started')}>Start work</Button>}
            {(task.status === 'in_progress' || task.status === 'blocked') && (
              <Button variant="primary" size="lg" block icon={<Check size={16} />} onClick={() => setCompleteOpen(true)}>Mark completed</Button>
            )}
            {(task.status === 'open' || task.status === 'in_progress') && <Button block icon={<Ban size={16} />} onClick={() => setBlockOpen(true)}>Mark blocked</Button>}
            {task.status === 'completed' && <Button block icon={<MessageSquarePlus size={16} />} onClick={() => setFollowOpen(true)}>Request follow-up</Button>}
            <FlowCode codes="CM08.04 · 08.07 · 08.08 · 08.09" />
          </section>
        )}

        <ConfirmDialog
          open={completeOpen}
          title="Mark this task completed?"
          body={evidence.length + vids.length === 0 ? 'No evidence is attached. The head coach may ask for more.' : `${evidence.length + vids.length} item(s) of evidence attached. ${coachById(db, task.createdById)?.name} will be notified.`}
          confirmLabel="Mark completed"
          onCancel={() => setCompleteOpen(false)}
          onConfirm={() => { setCompleteOpen(false); setStatus('completed', { blockedReason: undefined }, 'Task completed. The head coach has been notified.'); }}
        />
        <ConfirmDialog
          open={blockOpen}
          title="What’s blocking this?"
          confirmLabel="Mark blocked"
          tone="danger"
          onCancel={() => setBlockOpen(false)}
          onConfirm={() => { if (!reason.trim()) return; setBlockOpen(false); setStatus('blocked', { blockedReason: reason.trim() }, 'Marked blocked. The head coach can reassign or reschedule.'); }}
        >
          <div className="field"><label htmlFor="blk">Reason</label><input id="blk" className="input" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={!reason.trim()} /></div>
        </ConfirmDialog>
        <ConfirmDialog
          open={followOpen}
          title="Request a follow-up"
          confirmLabel="Send request"
          onCancel={() => setFollowOpen(false)}
          onConfirm={() => { if (!follow.trim()) return; setFollowOpen(false); setStatus('completed', { followUp: follow.trim() }, 'Follow-up requested.'); }}
        >
          <div className="field"><label htmlFor="fu">What should happen next?</label><textarea id="fu" className="textarea" value={follow} onChange={(e) => setFollow(e.target.value)} /></div>
        </ConfirmDialog>
      </CoachGate>
    </>
  );
}

/** CM09.01–04 */
export function HandoverNew() {
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [athleteId, setAthleteId] = useState(params.get('athlete') ?? '');
  const [summary, setSummary] = useState('');
  const [next, setNext] = useState('');
  const [to, setTo] = useState('');
  const [touched, setTouched] = useState(false);
  useHuddleContext({
    surface: 'coach', title: athleteId ? `Handover · ${athleteById(db, athleteId)?.name}` : 'New handover', athleteId: athleteId || undefined,
    prompts: athleteId ? ['Summarise recent sessions'] : ['What can you help with?'],
  }, { useText: { label: 'Use as summary', run: (t) => setSummary(t) } });

  const recipients = db.coaches.filter((x) => x.academyId === c.academy.id && x.status === 'active' && x.id !== c.coach?.id);
  const athletes = db.athletes.filter((a) => a.status === 'active' && c.inScope(a.id));
  const valid = athleteId && summary.trim() && to;

  const send = () => {
    setTouched(true);
    if (!valid) return;
    const hid = uid('h');
    update((d) => {
      d.handovers.push({ id: hid, athleteId, fromId: c.coach!.id, toId: to, summary: summary.trim(), nextAction: next.trim(), status: 'sent', createdAt: nowISO() });
      const toPerson = d.coaches.find((x) => x.id === to)?.personId;
      if (toPerson) d.notifications.push({ id: uid('n'), personId: toPerson, kind: 'handover', title: `Handover from ${c.person.name}`, body: `${athleteById(d, athleteId)?.name} — ${summary.trim().slice(0, 60)}`, route: `/coach/handover/${hid}`, target: { type: 'handover', id: hid }, createdAt: nowISO(), read: false });
    });
    audit(c.person.name, `Handed over ${athleteById(db, athleteId)?.name} to ${coachById(db, to)?.name}`, hid);
    toast({ tone: 'ok', text: `Handover sent to ${coachById(db, to)?.name}.` });
    nav('/coach/tasks');
  };

  return (
    <>
      <CoachHeader back="/coach/tasks" backLabel="Tasks" />
      <CoachGate>
        <h1 className="display display-lg m-section">Start a handover</h1>
        <FlowCode codes="CM09.01–09.04" />
        <form className="m-section stack gap-4" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <Field id="ho-a" label="Athlete" error={touched && !athleteId ? 'Choose an athlete.' : ''}>
            <select id="ho-a" className="select" value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
              <option value="">Choose…</option>
              {athletes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field id="ho-s" label="Summary" hint="What the next coach needs to know. Huddle can draft this from recent notes." error={touched && !summary.trim() ? 'Add a summary.' : ''}>
            <textarea id="ho-s" className="textarea" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </Field>
          <Field id="ho-n" label="Required next action" optional>
            <input id="ho-n" className="input" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <Field id="ho-t" label="Recipient" error={touched && !to ? 'Choose who receives it.' : ''}>
            <select id="ho-t" className="select" value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Choose…</option>
              {recipients.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.role.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Button type="submit" variant="primary" size="lg" block icon={<Send size={16} />}>Send handover</Button>
        </form>
      </CoachGate>
    </>
  );
}

/** CM09.05–06 */
export function HandoverDetail() {
  const { id } = useParams();
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigate();
  const h = db.handovers.find((x) => x.id === id);
  useHuddleContext(h ? { surface: 'coach', title: `Handover · ${athleteById(db, h.athleteId)?.name}`, athleteId: h.athleteId, prompts: ['Summarise recent sessions'] } : null);
  // CM09.05: opening marks it read for the sender
  useEffect(() => {
    if (h && h.toId === c.coach?.id && h.status === 'sent') update((d) => { const x = d.handovers.find((y) => y.id === h.id); if (x) x.status = 'opened'; });
  }, [h, c.coach?.id, update]);
  if (!h) return <><CoachHeader back="/coach/tasks" /><NotFound what="handover" back="/coach/tasks" /></>;
  const isRecipient = h.toId === c.coach?.id;

  const convert = () => {
    const tid = uid('t');
    update((d) => {
      d.tasks.push({ id: tid, athleteId: h.athleteId, areaId: null, title: h.nextAction || 'Follow up on handover', instruction: h.summary, assigneeId: c.coach!.id, createdById: h.fromId, status: 'open', due: TODAY, evidenceObservationIds: [], evidenceVideoIds: [], createdAt: nowISO(), version: 1 });
      const x = d.handovers.find((y) => y.id === h.id)!; x.status = 'converted';
    });
    audit(c.person.name, `Converted handover to task`, tid);
    toast({ tone: 'ok', text: 'Follow-up task created.' });
    nav(`/coach/tasks/${tid}`);
  };

  return (
    <>
      <CoachHeader back="/coach/tasks" backLabel="Tasks" />
      <CoachGate>
        <section className="m-section">
          <span className="badge badge-outline">{h.status}</span>
          <h1 className="display display-lg" style={{ marginTop: 6 }}>Handover: {athleteById(db, h.athleteId)?.name}</h1>
          <p className="small muted">From {coachById(db, h.fromId)?.name} to {coachById(db, h.toId)?.name} · {fmtDate(h.createdAt)}</p>
        </section>
        <section className="m-section card"><p className="xs strong muted">Summary</p><p style={{ marginTop: 4 }}>{h.summary}</p></section>
        {h.nextAction && <section className="m-section"><Banner tone="ok"><strong>Required next action:</strong> {h.nextAction}</Banner></section>}
        <Assumption code="XS01.07" />
        {isRecipient && h.status !== 'converted' && (
          <div className="m-section"><Button variant="primary" size="lg" block onClick={convert}>Convert to follow-up task</Button><FlowCode codes="CM09.06" /></div>
        )}
      </CoachGate>
    </>
  );
}
