import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Mic, NotebookPen, Video as VideoIcon, Plus, Flag, Target, Dumbbell, Pencil, RotateCcw, Trophy, ChevronRight } from 'lucide-react';
import { useStore, uid } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import {
  areaById, athleteById, attendanceFor, batchById, currentFocus, daysUntil, fmtDate, lastSessionFor, observationsFor, ageOn,
} from '../../store/selectors';
import { Avatar, Banner, Button, ConfirmDialog, Field, FlowCode, StatusBadge, StateBlock, Assumption, AssumptionNote } from '../../components/ui';
import { Clip } from '../../components/art';
import { DitChip } from '../../score/ScoreViz';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { CoachHeader, CoachGate, NotFound } from './parts';
import { useCoach } from './useCoach';
import type { DevArea } from '../../data/types';

export function AthletesList() {
  const { db } = useStore();
  const c = useCoach();
  const [q, setQ] = useState('');
  useCompanionContext({ surface: 'coach', title: 'Athletes', prompts: ['What can you help with?'] });
  const list = db.athletes
    .filter((a) => a.status === 'active' && a.academyId === c.academy.id && c.inScope(a.id))
    .filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  const byBatch = new Map<string, typeof list>();
  for (const a of list) byBatch.set(a.batchId ?? 'none', [...(byBatch.get(a.batchId ?? 'none') ?? []), a]);
  return (
    <>
      <CoachHeader title="Athletes" />
      <CoachGate>
        <h1 className="display display-lg m-section">Athletes</h1>
        {c.scopeAthleteIds !== 'all' && <p className="xs muted" style={{ marginTop: 4 }}>Temporary access: you see only athletes you hold work for. <Assumption code="XS01.07" /></p>}
        <div className="field m-section">
          <label htmlFor="ath-q" className="sr-only">Search athletes</label>
          <input id="ath-q" className="input" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {list.length === 0 && <div className="m-section"><StateBlock kind="empty" title={q ? `No athlete matches “${q}”` : 'No athletes assigned to you'} /></div>}
        {[...byBatch.entries()].map(([bid, as]) => (
          <section key={bid} className="m-section">
            <h2 className="small strong muted" style={{ marginBottom: 6 }}>{batchById(db, bid)?.name ?? 'No batch'}</h2>
            <ul className="list card card-flush">
              {as.map((a) => {
                const { area } = currentFocus(db, a.id);
                return (
                  <li key={a.id}>
                    <Link to={`/coach/athlete/${a.id}`} className="list-row">
                      <Avatar name={a.name} size="sm" />
                      <span className="grow stack" style={{ minWidth: 0 }}>
                        <span className="small strong">{a.name}</span>
                        <span className="xs muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{area ? area.title : 'No active focus'}</span>
                      </span>
                      <ChevronRight size={16} aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </CoachGate>
    </>
  );
}

export function AthleteContext() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const sessionId = params.get('session') ?? undefined;
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const h = useCompanion();
  const a = athleteById(db, id);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useCompanionContext(a ? {
    surface: 'coach',
    title: `${a.name}${sessionId ? ` · ${db.sessions.find((s) => s.id === sessionId)?.title}` : ''}`,
    athleteId: a.id,
    sessionId,
    prompts: ['Summarise recent sessions', 'Compare the last two sessions', 'What’s the next action?'],
  } : null);

  if (!a) return <><CoachHeader back="/coach/athletes" /><NotFound what="athlete" back="/coach/athletes" /></>;
  if (!c.inScope(a.id)) {
    return (
      <>
        <CoachHeader back="/coach/athletes" />
        <div className="m-section"><StateBlock kind="permission" title="Outside your temporary access" body="You can only open athletes you hold a task or handover for. Ask the head coach for wider access." /></div>
      </>
    );
  }

  const { area, goal } = currentFocus(db, a.id);
  const att = attendanceFor(db, a.id);
  const last = lastSessionFor(db, a.id);
  const reass = db.reassessments.find((r) => r.athleteId === a.id && r.status !== 'approved');
  const vids = db.videos.filter((v) => v.athleteId === a.id && (!area || v.areaId === area.id));
  const obs = observationsFor(db, a.id).slice(0, 4);
  const areas = db.areas.filter((x) => x.athleteId === a.id);
  const back = sessionId ? `/coach/session/${sessionId}` : '/coach/athletes';
  const presentToday = sessionId ? db.sessions.find((s) => s.id === sessionId)?.attendance[a.id] : undefined;

  return (
    <>
      <CoachHeader back={back} backLabel={sessionId ? 'Session' : 'Athletes'} />
      <CoachGate>
        <section className="m-section row gap-3">
          <Avatar name={a.name} size="lg" />
          <div className="grow">
            <h1 className="display display-lg">{a.name}</h1>
            <p className="small muted">{a.discipline} · {ageOn(a.born)} · {batchById(db, a.batchId)?.name}</p>
          </div>
          <Link to={`/coach/athlete/${a.id}/score`} aria-label="Review Dit Score inputs"><DitChip db={db} athleteId={a.id} /></Link>
          {presentToday && presentToday !== 'unmarked' && <StatusBadge status={presentToday === 'present' ? 'active' : 'failed'} label={presentToday === 'present' ? 'Present' : 'Absent'} />}
        </section>

        <section className="m-section card" style={{ borderColor: 'var(--line-strong)', borderWidth: 1.5 }} aria-labelledby="focus-h">
          <div className="row between">
            <h2 id="focus-h" className="small strong muted">Current focus <FlowCode codes="CM04.02" /></h2>
            {area && <StatusBadge status={area.status} />}
          </div>
          {area ? (
            <>
              <p className="display display-md" style={{ marginTop: 8 }}><span className="mark">{area.title}</span></p>
              {goal && (
                <div className="stack gap-2" style={{ marginTop: 12 }}>
                  <p className="small"><Target size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {goal.title}</p>
                  <p className="xs muted">Target: {goal.target}</p>
                  {goal.nextAction && (
                    <div className="banner banner-ok" style={{ marginTop: 4 }}>
                      <Flag size={14} /> <span><strong>Next action:</strong> {goal.nextAction} <FlowCode codes="CM04.04" /></span>
                    </div>
                  )}
                  {goal.drill && <p className="xs"><Dumbbell size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> {goal.drill.name} · {goal.drill.frequency}</p>}
                  <Link to={`/coach/goal/${goal.id}`} className="small strong">Edit goal, drill or next action</Link>
                </div>
              )}
              {!goal && <Link to={`/coach/goal/new?area=${area.id}`} className="btn btn-sm" style={{ marginTop: 10 }}><Plus size={14} /> Add a goal</Link>}
            </>
          ) : (
            <StateBlock kind="empty" title="No active focus" body="Spot something worth working on? Create a development area." action={<Link className="btn btn-sm" to={`/coach/athlete/${a.id}/area/new`}>New development area</Link>} />
          )}
        </section>

        <section className="m-section" aria-label="Quick capture">
          <div className="row gap-2">
            <Button variant="primary" className="grow" icon={<Mic size={16} />} onClick={() => h.openCompanion({ voice: true })}>Talk a note</Button>
            <Link className="btn grow" to={`/coach/capture?mode=note&athlete=${a.id}${sessionId ? `&session=${sessionId}` : ''}`}><NotebookPen size={16} /> Type</Link>
            <Link className="btn btn-icon" to={`/coach/capture?mode=video&athlete=${a.id}${sessionId ? `&session=${sessionId}` : ''}`} aria-label="Record video"><VideoIcon size={18} /></Link>
          </div>
          <p className="xs muted" style={{ marginTop: 6 }}>Voice notes become a draft you confirm. <Assumption code="CM05.03" /></p>
        </section>

        <section className="m-section w-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="metric">
            <span className="metric-label">Attendance</span>
            <span className="num">{att.total ? `${att.present}/${att.total}` : '—'}</span>
            <span className="metric-basis">recorded sessions</span>
          </div>
          <Link to={reass ? `/coach/reassess/${reass.id}` : '#'} className="metric card-link" style={reass && daysUntil(reass.due) <= 3 ? { background: 'var(--hl)', borderColor: 'var(--hl)' } : undefined}>
            <span className="metric-label">Reassessment</span>
            <span className="num">{reass ? (daysUntil(reass.due) < 0 ? 'Late' : `${daysUntil(reass.due)}d`) : '—'}</span>
            <span className="metric-basis" style={{ color: 'inherit' }}>{reass ? `${reass.status === 'submitted' ? 'Submitted' : 'Due'} ${fmtDate(reass.due)}` : 'None scheduled'} <FlowCode codes="CM04.05" /></span>
          </Link>
        </section>

        {last && (
          <section className="m-section">
            <h2 className="small strong muted" style={{ marginBottom: 6 }}>Last session <FlowCode codes="CM04.03" /></h2>
            <Link to={`/coach/session/${last.id}`} className="card card-link row gap-3">
              <span className="num" style={{ fontSize: '1.6rem' }}>{fmtDate(last.date)}</span>
              <span className="grow small">{last.title}</span>
              <ChevronRight size={16} />
            </Link>
          </section>
        )}

        {vids.length > 0 && (
          <section className="m-section">
            <h2 className="small strong muted" style={{ marginBottom: 6 }}>Relevant video <FlowCode codes="CM04.06" /></h2>
            <Link to={`/coach/video/${vids[0].id}`} style={{ display: 'block' }} aria-label={`Open ${vids[0].title}`}><Clip video={vids[0]} /></Link>
          </section>
        )}

        <section className="m-section">
          <div className="section-head"><h2 className="small strong muted">Recent notes</h2><FlowCode codes="CM05.07" /></div>
          {obs.length === 0 && <StateBlock kind="empty" title="No notes yet" body="Talk or type the first one above." />}
          <ul className="list card card-flush">
            {obs.map((o) => (
              <li key={o.id} style={{ padding: '12px 16px' }}>
                {editing === o.id ? (
                  <div className="stack gap-2">
                    <label htmlFor={`edit-${o.id}`} className="sr-only">Correct note</label>
                    <textarea id={`edit-${o.id}`} className="textarea" value={editText} onChange={(e) => setEditText(e.target.value)} />
                    <div className="row gap-2">
                      <Button size="sm" variant="primary" disabled={!editText.trim()} onClick={() => {
                        update((d) => { const x = d.observations.find((y) => y.id === o.id)!; x.correctedFrom = x.text; x.text = editText.trim(); });
                        audit(c.person.name, `Corrected an observation on ${a.name}`, o.id);
                        setEditing(null);
                        toast({ tone: 'ok', text: 'Note corrected. The original stays in the audit history.' });
                      }}>Save correction</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="stack gap-1">
                    <div className="row between gap-2">
                      <span className="xs muted">{fmtDate(o.createdAt)} · {areaById(db, o.areaId)?.title ?? 'Unstructured'}</span>
                      <span className="row gap-1">
                        {o.aiDrafted && <span className="badge badge-outline" title="Drafted from voice by dit, confirmed by the coach">AI-drafted</span>}
                        {o.sync !== 'synced' && <StatusBadge status={o.sync} />}
                      </span>
                    </div>
                    <p className="small">{o.text}</p>
                    {o.correctedFrom && <p className="xs muted">Corrected · was: “{o.correctedFrom}”</p>}
                    {o.authorId === c.coach?.id && (
                      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginLeft: -8 }} onClick={() => { setEditing(o.id); setEditText(o.text); }}>
                        <Pencil size={12} /> Correct
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="m-section">
          <div className="section-head">
            <h2 className="small strong muted">Development areas <FlowCode codes="CM06" /></h2>
            <Link to={`/coach/athlete/${a.id}/area/new`} className="small strong">+ New</Link>
          </div>
          <ul className="list card card-flush">
            {areas.map((x) => (
              <li key={x.id} className="list-row">
                <span className="grow stack"><span className="small strong">{x.title}</span><span className="xs muted">Since {fmtDate(x.openedAt)} · {x.priority} priority</span></span>
                <StatusBadge status={x.status} />
              </li>
            ))}
          </ul>
        </section>
      </CoachGate>
    </>
  );
}

/** CM06.01–06: identify → check existing → create or reopen → prioritise; cancel safely. */
export function NewArea() {
  const { id } = useParams();
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigate();
  const a = athleteById(db, id);
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<DevArea['priority']>('normal');
  const [touched, setTouched] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState<DevArea | null>(null);
  useCompanionContext(a ? { surface: 'coach', title: `New development area · ${a.name}`, athleteId: a.id, prompts: ['Summarise recent sessions'] } : null);
  if (!a) return <NotFound what="athlete" back="/coach/athletes" />;

  const existing = db.areas.filter((x) => x.athleteId === a.id);
  const words = issue.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const similar = existing.filter((x) => words.some((w) => x.title.toLowerCase().includes(w)));
  const highTaken = existing.find((x) => x.priority === 'high' && (x.status === 'active' || x.status === 'reopened'));
  const error = touched && issue.trim().length < 5 ? 'Describe the issue in a few words (at least 5 characters).' : '';

  const create = () => {
    setTouched(true);
    if (issue.trim().length < 5) return;
    const nid = uid('da');
    update((d) => {
      if (priority === 'high' && highTaken) { const h = d.areas.find((x) => x.id === highTaken.id)!; h.priority = 'normal'; }
      d.areas.push({ id: nid, athleteId: a.id, title: issue.trim(), status: 'active', priority, openedAt: TODAY, ownerId: c.coach!.id });
    });
    audit(c.person.name, `Created development area “${issue.trim()}” for ${a.name}`, nid);
    toast({ tone: 'ok', text: 'Development area created. Add a goal next.' });
    nav(`/coach/goal/new?area=${nid}`);
  };

  return (
    <>
      <CoachHeader back={`/coach/athlete/${a.id}`} backLabel={a.name.split(' ')[0]} />
      <CoachGate>
        <h1 className="display display-lg m-section">New development area</h1>
        <FlowCode codes="CM06.01–06.06" />
        <div className="m-section stack gap-4">
          <Field id="issue" label="What did you notice?" hint="Name the skill or issue, not the drill." error={error}>
            <input id="issue" className="input" value={issue} onChange={(e) => setIssue(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={!!error} placeholder="e.g. Back-foot defence against pace" />
          </Field>

          {issue.trim().length >= 4 && (
            <div>
              <p className="small strong" style={{ marginBottom: 6 }}>Check existing areas first <FlowCode codes="CM06.02" /></p>
              {existing.length === 0 ? <p className="xs muted">No areas yet for {a.name}.</p> : (
                <ul className="list card card-flush">
                  {(similar.length ? similar : existing).map((x) => (
                    <li key={x.id} className="list-row">
                      <span className="grow stack"><span className="small strong">{x.title}</span><span className="xs muted">{similar.includes(x) ? 'Looks similar' : 'Existing'}</span></span>
                      <StatusBadge status={x.status} />
                      {(x.status === 'achieved' || x.status === 'closed') && (
                        <Button size="sm" icon={<RotateCcw size={12} />} onClick={() => setConfirmReopen(x)}>Reopen</Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label" style={{ marginBottom: 6 }}>Priority <Assumption code="CM06.05" /></legend>
            <div className="seg" role="group">
              {(['high', 'normal', 'low'] as const).map((p) => (
                <button key={p} type="button" aria-pressed={priority === p} onClick={() => setPriority(p)} style={{ textTransform: 'capitalize' }}>{p}</button>
              ))}
            </div>
            {priority === 'high' && highTaken && <span className="hint">“{highTaken.title}” is currently high. It will move to normal.</span>}
          </fieldset>

          <Button variant="primary" size="lg" block onClick={create}>Create area</Button>
          <Button variant="ghost" block onClick={() => (issue.trim() ? setConfirmCancel(true) : nav(-1))}>Cancel</Button>
        </div>
        <ConfirmDialog open={confirmCancel} title="Discard this area?" body="Nothing has been saved yet." confirmLabel="Discard" tone="danger" onCancel={() => setConfirmCancel(false)} onConfirm={() => nav(`/coach/athlete/${a.id}`)} />
        <ConfirmDialog
          open={!!confirmReopen}
          title={`Reopen “${confirmReopen?.title}”?`}
          body="Its history, goals and milestones stay attached. The athlete and parents will see it as a current focus again."
          confirmLabel="Reopen area"
          onCancel={() => setConfirmReopen(null)}
          onConfirm={() => {
            const x = confirmReopen!;
            update((d) => { const r = d.areas.find((y) => y.id === x.id)!; r.status = 'reopened'; });
            audit(c.person.name, `Reopened “${x.title}” for ${a.name}`, x.id);
            setConfirmReopen(null);
            toast({ tone: 'ok', text: 'Area reopened.' });
            nav(`/coach/athlete/${a.id}`);
          }}
        />
      </CoachGate>
    </>
  );
}

/** CM07.01–07: create/edit goal, next action, drill, frequency, replace drill, mark achieved. */
export function GoalEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigate();
  const isNew = id === 'new';
  const existing = isNew ? undefined : db.goals.find((g) => g.id === id);
  const areaId = existing?.areaId ?? params.get('area') ?? '';
  const area = areaById(db, areaId);
  const athlete = athleteById(db, area?.athleteId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [target, setTarget] = useState(existing?.target ?? '');
  const [next, setNext] = useState(existing?.nextAction ?? '');
  const [drillName, setDrillName] = useState(existing?.drill?.name ?? '');
  const [drillHow, setDrillHow] = useState(existing?.drill?.instructions ?? '');
  const [freq, setFreq] = useState(existing?.drill?.frequency ?? '2× a week');
  const [touched, setTouched] = useState(false);
  const [confirmAchieved, setConfirmAchieved] = useState(false);
  const [replacing, setReplacing] = useState(false);
  useCompanionContext(athlete ? { surface: 'coach', title: `Goal · ${athlete.name}`, athleteId: athlete.id, prompts: ['Summarise recent sessions'] } : null);

  if (!area || !athlete || (!isNew && !existing)) return <NotFound what="goal" back="/coach/athletes" />;
  const errors = { title: touched && !title.trim() ? 'Give the goal a short title.' : '', target: touched && !target.trim() ? 'Say how you’ll know it’s achieved.' : '' };

  const save = () => {
    setTouched(true);
    if (!title.trim() || !target.trim()) return;
    const drill = drillName.trim() ? { name: drillName.trim(), instructions: drillHow.trim(), frequency: freq } : null;
    const gid = existing?.id ?? uid('g');
    update((d) => {
      const g = d.goals.find((x) => x.id === gid);
      if (g) Object.assign(g, { title: title.trim(), target: target.trim(), nextAction: next.trim(), drill });
      else d.goals.push({ id: gid, areaId: area.id, title: title.trim(), target: target.trim(), nextAction: next.trim(), drill, status: 'active' });
    });
    if (replacing && existing?.drill) audit(c.person.name, `Replaced drill “${existing.drill.name}” with “${drillName}” for ${athlete.name}`, gid);
    audit(c.person.name, `${isNew ? 'Created' : 'Updated'} goal “${title.trim()}” for ${athlete.name}`, gid);
    toast({ tone: 'ok', text: isNew ? 'Goal created. The athlete sees the drill in their Practice tab.' : 'Goal updated.' });
    nav(`/coach/athlete/${athlete.id}`);
  };

  return (
    <>
      <CoachHeader back={`/coach/athlete/${athlete.id}`} backLabel={athlete.name.split(' ')[0]} />
      <CoachGate>
        <p className="small muted m-section">{area.title}</p>
        <h1 className="display display-lg">{isNew ? 'New goal' : 'Edit goal'}</h1>
        <FlowCode codes="CM07.01–07.07" />
        {existing?.status === 'achieved' && <div className="m-section"><Banner tone="ok"><Trophy size={14} style={{ display: 'inline' }} /> Achieved. Edits are kept in the audit history.</Banner></div>}
        <form className="m-section stack gap-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Field id="g-title" label="Goal" error={errors.title}>
            <input id="g-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} />
          </Field>
          <Field id="g-target" label="How you’ll know it’s achieved" error={errors.target}>
            <input id="g-target" className="input" value={target} onChange={(e) => setTarget(e.target.value)} aria-invalid={!!errors.target} />
          </Field>
          <Field id="g-next" label="Next action" optional hint="Shown to coaches as the next thing to do.">
            <input id="g-next" className="input" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <AssumptionNote code="CM07.03" />
          <div className="card card-sunk stack gap-3">
            <div className="row between">
              <p className="small strong"><Dumbbell size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Practice drill <span className="muted" style={{ fontWeight: 400 }}>(athlete sees this)</span></p>
              {existing?.drill && !replacing && <Button size="sm" onClick={() => { setReplacing(true); setDrillName(''); setDrillHow(''); }}>Replace drill</Button>}
            </div>
            {replacing && <p className="xs muted">Replacing “{existing?.drill?.name}”. The old drill stays in history. <FlowCode codes="CM07.06" /></p>}
            <Field id="d-name" label="Drill name" optional>
              <input id="d-name" className="input" value={drillName} onChange={(e) => setDrillName(e.target.value)} />
            </Field>
            <Field id="d-how" label="Instructions" optional>
              <textarea id="d-how" className="textarea" value={drillHow} onChange={(e) => setDrillHow(e.target.value)} />
            </Field>
            <Field id="d-freq" label="Frequency">
              <select id="d-freq" className="select" value={freq} onChange={(e) => setFreq(e.target.value)} disabled={!drillName.trim()}>
                {['Every session', '3× a week', '2× a week', 'Once a week'].map((f) => <option key={f}>{f}</option>)}
              </select>
            </Field>
          </div>
          <Button type="submit" variant="primary" size="lg" block>{isNew ? 'Create goal' : 'Save goal'}</Button>
          {existing && existing.status === 'active' && (
            <Button variant="ghost" block icon={<Trophy size={16} />} onClick={() => setConfirmAchieved(true)}>Mark goal achieved</Button>
          )}
        </form>
        <ConfirmDialog
          open={confirmAchieved}
          title="Mark this goal achieved?"
          body="The goal moves to history. To mark a milestone or close the whole area, complete a reassessment."
          confirmLabel="Mark achieved"
          onCancel={() => setConfirmAchieved(false)}
          onConfirm={() => {
            update((d) => { const g = d.goals.find((x) => x.id === existing!.id)!; g.status = 'achieved'; });
            audit(c.person.name, `Marked goal achieved: ${existing!.title}`, existing!.id);
            setConfirmAchieved(false);
            toast({ tone: 'ok', text: 'Goal achieved.' });
            nav(`/coach/athlete/${athlete.id}`);
          }}
        />
      </CoachGate>
    </>
  );
}

