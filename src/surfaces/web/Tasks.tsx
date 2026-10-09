import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, CheckSquare, LayoutGrid, List } from 'lucide-react';
import { useStore, uid, nowISO } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { areaById, athleteById, coachById, fmtDate, observationsFor } from '../../store/selectors';
import type { Task, TaskStatus } from '../../data/types';
import { Banner, Button, ConfirmDialog, Field, FlowCode, StatusBadge, StateBlock } from '../../components/ui';
import { useCompanionContext } from '../../companion/Companion';
import { Drawer, PageHead } from './parts';
import { useWeb } from './useWeb';

const COLS: { status: TaskStatus; label: string }[] = [
  { status: 'open', label: 'Open' }, { status: 'in_progress', label: 'In progress' }, { status: 'blocked', label: 'Blocked' }, { status: 'completed', label: 'Completed' },
];

/** MW09.01–08 · HC01.02 · HC02.03 */
export function TasksPage() {
  const { taskId } = useParams();
  const [params, setParams] = useSearchParams();
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const nav = useNavigate();
  const [view, setView] = useState<'board' | 'review'>('board');
  const [selected, setSelected] = useState<string[]>([]);
  const creating = params.get('new') === '1';
  const task = db.tasks.find((t) => t.id === taskId);
  useCompanionContext(task ? { surface: 'web', title: `Task · ${task.title}`, athleteId: task.athleteId, prompts: ['Summarise recent sessions'] } : { surface: 'web', title: 'Coach tasks', prompts: ['What can you help with?'] });

  const reviewable = db.tasks.filter((t) => t.status === 'completed' || t.status === 'blocked');

  return (
    <>
      <PageHead
        title="Coach tasks"
        codes="MW09.01–09.08"
        actions={<>
          <div className="seg" role="group" aria-label="View">
            <button aria-pressed={view === 'board'} onClick={() => setView('board')}><LayoutGrid size={14} /> Board</button>
            <button aria-pressed={view === 'review'} onClick={() => setView('review')}><List size={14} /> Bulk review</button>
          </div>
          {w.canCoach && <Button variant="primary" icon={<Plus size={16} />} onClick={() => setParams({ new: '1' })}>Create task</Button>}
        </>}
      />
      {!w.canCoach && <div style={{ marginBottom: 16 }}><Banner tone="info">Owners can view tasks. Only head coaches create and reassign coaching work.</Banner></div>}

      {view === 'board' ? (
        <div className="kanban">
          {COLS.map((col) => {
            const items = db.tasks.filter((t) => t.status === col.status);
            return (
              <section key={col.status} className="kanban-col" aria-label={col.label}>
                <h3><StatusBadge status={col.status} label={col.label} /> <span className="muted xs">{items.length}</span></h3>
                {items.length === 0 && <p className="xs muted" style={{ padding: 8 }}>None</p>}
                {items.map((t) => (
                  <Link key={t.id} to={`/web/tasks/${t.id}`} className="card card-link stack gap-1" style={{ padding: 12 }}>
                    <span className="small strong">{t.title}</span>
                    <span className="xs muted">{athleteById(db, t.athleteId)?.name} · {coachById(db, t.assigneeId)?.name}</span>
                    <span className="xs muted">Due {fmtDate(t.due)}{t.followUp ? ' · follow-up requested' : ''}</span>
                    {t.status === 'blocked' && <span className="xs" style={{ color: 'var(--err)' }}>{t.blockedReason}</span>}
                  </Link>
                ))}
              </section>
            );
          })}
        </div>
      ) : (
        <section>
          {reviewable.length === 0 ? <StateBlock kind="empty" title="Nothing to review" /> : (
            <>
              <div className="row gap-2" style={{ marginBottom: 12 }}>
                <span className="small muted">{selected.length} selected</span>
                <Button size="sm" disabled={!selected.length} icon={<CheckSquare size={14} />} onClick={() => {
                  update((d) => d.tasks.forEach((t) => { if (selected.includes(t.id) && t.status === 'completed') { t.followUp = undefined; t.version += 1; } }));
                  audit(w.actorName, `Bulk-reviewed ${selected.length} tasks`);
                  toast({ tone: 'ok', text: `${selected.length} task(s) marked reviewed.` });
                  setSelected([]);
                }}>Mark reviewed</Button>
              </div>
              <div className="card card-flush" style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead><tr>
                    <th><input type="checkbox" aria-label="Select all" checked={selected.length === reviewable.length} onChange={(e) => setSelected(e.target.checked ? reviewable.map((t) => t.id) : [])} /></th>
                    <th>Task</th><th>Athlete</th><th>Coach</th><th>Evidence</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {reviewable.map((t) => (
                      <tr key={t.id}>
                        <td><input type="checkbox" aria-label={`Select ${t.title}`} checked={selected.includes(t.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, t.id] : s.filter((x) => x !== t.id)))} /></td>
                        <td><Link to={`/web/tasks/${t.id}`}>{t.title}</Link></td>
                        <td>{athleteById(db, t.athleteId)?.name}</td>
                        <td>{coachById(db, t.assigneeId)?.name}</td>
                        <td>{t.evidenceObservationIds.length + t.evidenceVideoIds.length}</td>
                        <td><StatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      <CreateTask open={creating} onClose={() => setParams({})} />
      {task && <TaskPanel task={task} onClose={() => nav('/web/tasks')} />}
      {taskId && !task && <Drawer open title="Task not found" onClose={() => nav('/web/tasks')}><StateBlock kind="archived" title="This task no longer exists" /></Drawer>}
    </>
  );
}

function CreateTask({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [params] = useSearchParams();
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const [athleteId, setAthleteId] = useState(params.get('athlete') ?? '');
  const [areaId, setAreaId] = useState(params.get('area') ?? '');
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [instruction, setInstruction] = useState('');
  const [due, setDue] = useState(TODAY);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setAthleteId(params.get('athlete') ?? ''); setAreaId(params.get('area') ?? ''); } }, [open, params]);

  const assignees = db.coaches.filter((c) => c.academyId === w.academy.id && c.status === 'active');
  const areas = db.areas.filter((a) => a.athleteId === athleteId && (a.status === 'active' || a.status === 'reopened'));
  const err = {
    athlete: touched && !athleteId ? 'Choose an athlete.' : '',
    title: touched && !title.trim() ? 'Give the task a title.' : '',
    assignee: touched && !assignee ? 'Choose who does it.' : '',
    instruction: touched && instruction.trim().length < 10 ? 'Add an instruction the coach can act on (10+ characters).' : '',
    due: touched && due < TODAY ? 'Due date can’t be in the past.' : '',
  };
  const valid = athleteId && title.trim() && assignee && instruction.trim().length >= 10 && due >= TODAY;

  const save = () => {
    setTouched(true);
    if (!valid || saving) return;
    setSaving(true);
    setTimeout(() => {
      const id = uid('t');
      const coach = db.coaches.find((c) => c.id === assignee)!;
      update((d) => {
        const t: Task = { id, athleteId, areaId: areaId || null, title: title.trim(), instruction: instruction.trim(), assigneeId: assignee, createdById: w.coach?.id ?? 'c-rohan', status: 'open', due, evidenceObservationIds: [], evidenceVideoIds: [], createdAt: nowISO(), version: 1 };
        d.tasks.push(t);
        d.notifications.push({ id: uid('n'), personId: coach.personId, kind: 'task', title: `New task from ${w.person.name}`, body: `${title.trim()} — due ${fmtDate(due)}`, route: `/coach/tasks/${id}`, target: { type: 'task', id }, createdAt: nowISO(), read: false });
      });
      audit(w.actorName, `Created task “${title.trim()}” for ${coach.name}`, id);
      toast({ tone: 'ok', text: `Task sent to ${coach.name}. It appears in their Coach Mobile now.` });
      setSaving(false);
      setTitle(''); setInstruction(''); setAssignee(''); setTouched(false);
      onClose();
    }, 350);
  };

  return (
    <Drawer open={open} title="Create coach task" onClose={onClose}>
      <FlowCode codes="MW09.01–09.03 · HC01.02" />
      <form className="stack gap-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field id="ct-a" label="Athlete" error={err.athlete}>
          <select id="ct-a" className="select" value={athleteId} onChange={(e) => { setAthleteId(e.target.value); setAreaId(''); }}>
            <option value="">Choose…</option>
            {db.athletes.filter((a) => a.status === 'active').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field id="ct-d" label="Development area" optional>
          <select id="ct-d" className="select" value={areaId} onChange={(e) => setAreaId(e.target.value)} disabled={!athleteId}>
            <option value="">None</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </Field>
        <Field id="ct-t" label="Task" error={err.title}><input id="ct-t" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Head-position throwdowns" /></Field>
        <Field id="ct-c" label="Assign to" error={err.assignee}>
          <select id="ct-c" className="select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Choose…</option>
            {assignees.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.role.replace('_', ' ')}{c.tempAccessUntil ? ` (until ${fmtDate(c.tempAccessUntil)})` : ''}</option>)}
          </select>
        </Field>
        <Field id="ct-i" label="Instruction" hint="What to do, and what evidence to bring back." error={err.instruction}><textarea id="ct-i" className="textarea" value={instruction} onChange={(e) => setInstruction(e.target.value)} /></Field>
        <Field id="ct-due" label="Due" error={err.due}><input id="ct-due" type="date" className="input" value={due} min={TODAY} onChange={(e) => setDue(e.target.value)} /></Field>
        <Button type="submit" variant="primary" size="lg" pending={saving}>Create and notify</Button>
      </form>
    </Drawer>
  );
}

function TaskPanel({ task, onClose }: { task: Task; onClose: () => void }) {
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const [reassignTo, setReassignTo] = useState('');
  const [follow, setFollow] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const obs = observationsFor(db, task.athleteId).filter((o) => task.evidenceObservationIds.includes(o.id));
  const vids = db.videos.filter((v) => task.evidenceVideoIds.includes(v.id));
  const active = !['completed', 'cancelled'].includes(task.status);
  const notify = (personId: string, title: string, body: string) => update((d) => d.notifications.push({ id: uid('n'), personId, kind: 'assignment', title, body, route: `/coach/tasks/${task.id}`, target: { type: 'task', id: task.id }, createdAt: nowISO(), read: false }));

  return (
    <Drawer open title={task.title} onClose={onClose}>
      <div className="row gap-2"><StatusBadge status={task.status} /><span className="xs muted">Due {fmtDate(task.due)} · v{task.version}</span></div>
      <p className="small"><Link to={`/web/athletes/${task.athleteId}`}>{athleteById(db, task.athleteId)?.name}</Link>{task.areaId ? ` · ${areaById(db, task.areaId)?.title}` : ''}</p>
      <div className="card card-sunk"><p className="xs strong muted">Instruction</p><p className="small" style={{ marginTop: 4 }}>{task.instruction}</p></div>
      <p className="small">Assigned to <strong>{coachById(db, task.assigneeId)?.name}</strong> by {coachById(db, task.createdById)?.name} <FlowCode codes="MW09.04" /></p>
      {task.blockedReason && task.status === 'blocked' && <Banner tone="err"><strong>Blocked:</strong> {task.blockedReason}</Banner>}
      {task.followUp && <Banner tone="info"><strong>Follow-up:</strong> {task.followUp}</Banner>}
      <section>
        <p className="small strong" style={{ marginBottom: 6 }}>Evidence ({obs.length + vids.length})</p>
        {obs.map((o) => <p key={o.id} className="small" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}>“{o.text}”</p>)}
        {vids.map((v) => <p key={v.id} className="small" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}>Clip: {v.title} <StatusBadge status={v.upload === 'uploaded' ? v.processing : v.upload} /></p>)}
        {!obs.length && !vids.length && <p className="xs muted">No evidence yet.</p>}
      </section>
      {w.canCoach && active && (
        <>
          <hr className="divider" />
          <Field id="tp-r" label="Reassign to" hint="The new coach gets a notification. The previous coach keeps their evidence on the record.">
            <div className="row gap-2">
              <select id="tp-r" className="select" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                <option value="">Choose…</option>
                {db.coaches.filter((c) => c.status === 'active' && c.id !== task.assigneeId && c.academyId === w.academy.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button disabled={!reassignTo} onClick={() => {
                const to = db.coaches.find((c) => c.id === reassignTo)!;
                update((d) => { const t = d.tasks.find((x) => x.id === task.id)!; t.assigneeId = to.id; t.version += 1; if (t.status === 'blocked') t.status = 'open'; });
                notify(to.personId, `Task reassigned to you`, task.title);
                audit(w.actorName, `Reassigned “${task.title}” to ${to.name}`, task.id);
                toast({ tone: 'ok', text: `Reassigned to ${to.name}.` });
                setReassignTo('');
              }}>Reassign</Button>
            </div>
          </Field>
          <FlowCode codes="MW09.05 · XS03.06" />
          <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel task</Button>
        </>
      )}
      {w.canCoach && task.status === 'completed' && (
        <>
          <hr className="divider" />
          <Field id="tp-f" label="Request follow-up" hint="Reopens the task with your note."><textarea id="tp-f" className="textarea" value={follow} onChange={(e) => setFollow(e.target.value)} /></Field>
          <Button disabled={!follow.trim()} onClick={() => {
            update((d) => { const t = d.tasks.find((x) => x.id === task.id)!; t.status = 'open'; t.followUp = follow.trim(); t.version += 1; });
            notify(coachById(db, task.assigneeId)!.personId, 'Follow-up requested', task.title);
            audit(w.actorName, `Requested follow-up on “${task.title}”`, task.id);
            toast({ tone: 'ok', text: 'Follow-up requested.' });
            setFollow('');
          }}>Send follow-up</Button>
          <FlowCode codes="MW09.06" />
          <Link className="btn" to={`/web/reassessments?new=${task.areaId ?? ''}`}>Trigger reassessment</Link>
        </>
      )}
      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this task?"
        body="The coach sees it as cancelled. If they have it open on mobile, their next save is blocked with an explanation. Evidence already captured stays on the athlete’s record."
        confirmLabel="Cancel task"
        tone="danger"
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          update((d) => { const t = d.tasks.find((x) => x.id === task.id)!; t.status = 'cancelled'; t.version += 1; });
          audit(w.actorName, `Cancelled “${task.title}”`, task.id);
          toast({ tone: 'ok', text: 'Task cancelled.' });
          setCancelOpen(false);
        }}
      />
    </Drawer>
  );
}
