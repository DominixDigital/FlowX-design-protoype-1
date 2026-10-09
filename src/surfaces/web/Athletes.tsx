import { useMemo, useState } from 'react';
import { Link, NavLink, useParams, useSearchParams } from 'react-router-dom';
import { UserPlus, Upload, Archive, RotateCcw, ArrowRightLeft, Pencil, AlertTriangle } from 'lucide-react';
import { useStore, uid } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import {
  ageOn, areaById, athleteById, attendanceFor, batchById, coachById, currentFocus, fmtDate, observationsFor, timelineFor,
} from '../../store/selectors';
import type { Athlete, AthleteStatus } from '../../data/types';
import { Avatar, Banner, Button, ConfirmDialog, Field, FlowCode, Metric, StatusBadge, StateBlock, Timeline } from '../../components/ui';
import { Clip, PitchArt } from '../../components/art';
import { useHuddleContext } from '../../huddle/Huddle';
import { Drawer, PageHead } from './parts';
import { useWeb } from './useWeb';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
function similarName(a: string, b: string) {
  const x = norm(a); const y = norm(b);
  if (x === y) return true;
  // one edit apart (Kapoor / Kapur) or same first name + same surname start
  const [fa, la = ''] = a.toLowerCase().split(' '); const [fb, lb = ''] = b.toLowerCase().split(' ');
  return fa === fb && la.slice(0, 3) === lb.slice(0, 3);
}

/** MW03.01–07 + MW07.01 */
export function AthletesPage() {
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? 'active') as AthleteStatus | 'all';
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirm, setConfirm] = useState<{ a: Athlete; action: 'archive' | 'reactivate' | 'transfer' } | null>(null);
  useHuddleContext({ surface: 'web', title: 'Athletes', prompts: ['What can you help with?'] });

  const list = db.athletes.filter((a) => (status === 'all' || a.status === status) && a.name.toLowerCase().includes(q.toLowerCase()));
  const counts = (s: AthleteStatus) => db.athletes.filter((a) => a.status === s).length;

  const doConfirm = () => {
    if (!confirm) return;
    const { a, action } = confirm;
    update((d) => {
      const x = d.athletes.find((y) => y.id === a.id)!;
      if (action === 'archive') x.status = 'archived';
      if (action === 'reactivate') x.status = 'active';
      if (action === 'transfer') { x.status = 'transferred'; x.batchId = null; }
    });
    audit(w.actorName, `${action} athlete ${a.name}`, a.id);
    toast({ tone: 'ok', text: action === 'archive' ? `${a.name} archived. History and shared reports are kept.` : action === 'reactivate' ? `${a.name} is active again.` : `${a.name} marked as transferred. Their history stays here.` });
    setConfirm(null);
  };

  return (
    <>
      <PageHead
        title="Athletes"
        codes="MW03.01–03.07 · MW07.01"
        actions={w.canManageOrg && <>
          <Button icon={<Upload size={16} />} onClick={() => setImporting(true)}>Import</Button>
          <Button variant="primary" icon={<UserPlus size={16} />} onClick={() => setAdding(true)}>Add athlete</Button>
        </>}
      />
      <div className="row gap-3 wrap" style={{ marginBottom: 16 }}>
        <div className="tabs" role="tablist" style={{ borderBottom: 0 }}>
          {(['active', 'duplicate_suspected', 'archived', 'transferred', 'all'] as const).map((s) => (
            <button key={s} role="tab" aria-selected={status === s} onClick={() => setParams({ status: s })} style={{ textTransform: 'capitalize' }}>
              {s === 'duplicate_suspected' ? 'Possible duplicates' : s} {s !== 'all' && <span className="muted">({counts(s)})</span>}
            </button>
          ))}
        </div>
        <label className="grow" style={{ maxWidth: 320, marginLeft: 'auto' }}>
          <span className="sr-only">Filter by name</span>
          <input className="input" placeholder="Filter by name" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      {list.length === 0 ? <StateBlock kind="empty" title="No athletes here" body={q ? `Nothing matches “${q}”.` : 'Try another filter.'} /> : (
        <div className="card card-flush" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Athlete</th><th>Batch</th><th>Primary coach</th><th>Current focus</th><th>Attendance</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {list.map((a) => {
                const att = attendanceFor(db, a.id);
                const { area } = currentFocus(db, a.id);
                return (
                  <tr key={a.id}>
                    <td><span className="row gap-2"><Avatar name={a.name} size="sm" muted={a.status !== 'active'} /><Link to={`/web/athletes/${a.id}`}>{a.name}</Link></span></td>
                    <td>{batchById(db, a.batchId)?.name ?? <span className="muted">—</span>}</td>
                    <td>{coachById(db, a.primaryCoachId)?.name ?? <span className="muted">Unassigned</span>}</td>
                    <td className="small" style={{ maxWidth: 260 }}>{area?.title ?? <span className="muted">—</span>}</td>
                    <td>{att.total ? `${att.present}/${att.total}` : '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {w.canManageOrg && a.status === 'active' && <Button size="sm" variant="ghost" icon={<Archive size={14} />} onClick={() => setConfirm({ a, action: 'archive' })}>Archive</Button>}
                      {w.canManageOrg && a.status === 'archived' && <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => setConfirm({ a, action: 'reactivate' })}>Reactivate</Button>}
                      {w.canManageOrg && a.status === 'duplicate_suspected' && <DuplicateActions a={a} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <AddAthlete open={adding} onClose={() => setAdding(false)} />
      <ImportAthletes open={importing} onClose={() => setImporting(false)} />
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'archive' ? `Archive ${confirm.a.name}?` : confirm?.action === 'reactivate' ? `Reactivate ${confirm?.a.name}?` : `Mark ${confirm?.a.name} as transferred?`}
        body={confirm?.action === 'archive' ? 'They leave rosters and coach apps. Their sessions, reports already shared with parents, and history stay intact. You can reactivate later.' : confirm?.action === 'reactivate' ? 'They return to active lists. Reassign a batch and primary coach next.' : 'Their history stays with this academy. Shared reports remain visible to guardians.'}
        confirmLabel={confirm?.action === 'archive' ? 'Archive' : confirm?.action === 'reactivate' ? 'Reactivate' : 'Mark transferred'}
        tone={confirm?.action === 'reactivate' ? 'primary' : 'danger'}
        onCancel={() => setConfirm(null)}
        onConfirm={doConfirm}
      />
    </>
  );
}

function DuplicateActions({ a }: { a: Athlete }) {
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const orig = athleteById(db, a.duplicateOf);
  return (
    <span className="row gap-1">
      <Button size="sm" onClick={() => {
        update((d) => { d.athletes = d.athletes.filter((x) => x.id !== a.id); });
        audit(w.actorName, `Merged duplicate ${a.name} into ${orig?.name}`, a.id);
        toast({ tone: 'ok', text: `Merged into ${orig?.name}.` });
      }}>Merge into {orig?.name.split(' ')[0]}</Button>
      <Button size="sm" variant="ghost" onClick={() => {
        update((d) => { const x = d.athletes.find((y) => y.id === a.id)!; x.status = 'active'; x.duplicateOf = undefined; });
        audit(w.actorName, `Confirmed ${a.name} is a different athlete`, a.id);
        toast({ tone: 'ok', text: `${a.name} kept as a separate athlete.` });
      }}>Not a duplicate</Button>
    </span>
  );
}

/** MW03.01 + MW03.03 */
function AddAthlete({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const [name, setName] = useState('');
  const [born, setBorn] = useState('');
  const [batchId, setBatchId] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const dupes = useMemo(() => (name.trim().length > 3 ? db.athletes.filter((a) => similarName(a.name, name) && (!born || a.born === born)) : []), [db.athletes, name, born]);
  const errors = {
    name: touched && name.trim().split(' ').length < 2 ? 'Enter first and last name.' : '',
    born: touched && !born ? 'Date of birth is needed for age groups and athlete access.' : touched && born > TODAY ? 'Date of birth can’t be in the future.' : '',
  };
  const reset = () => { setName(''); setBorn(''); setBatchId(''); setDiscipline(''); setTouched(false); };
  const save = (asDuplicate: boolean) => {
    setTouched(true);
    if (errors.name || errors.born || !name.trim() || !born) return;
    setSaving(true);
    setTimeout(() => {
      const id = uid('a');
      update((d) => d.athletes.push({ id, academyId: w.academy.id, name: name.trim(), born, batchId: batchId || null, primaryCoachId: null, supportingCoachIds: [], status: asDuplicate ? 'duplicate_suspected' : 'active', guardianIds: [], discipline: discipline.trim() || 'Not set', access: 'none', duplicateOf: asDuplicate ? dupes[0]?.id : undefined }));
      audit(w.actorName, `Added athlete ${name.trim()}${asDuplicate ? ' (flagged as possible duplicate)' : ''}`, id);
      toast({ tone: 'ok', text: `${name.trim()} added.${batchId ? '' : ' Assign a batch and coach next.'}` });
      setSaving(false);
      reset();
      onClose();
    }, 400);
  };
  return (
    <Drawer open={open} title="Add athlete" onClose={() => { reset(); onClose(); }}>
      <FlowCode codes="MW03.01 · MW03.03" />
      <form className="stack gap-4" onSubmit={(e) => { e.preventDefault(); save(false); }}>
        <Field id="aa-name" label="Full name" error={errors.name}><input id="aa-name" className="input" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={!!errors.name} /></Field>
        <Field id="aa-born" label="Date of birth" error={errors.born}><input id="aa-born" type="date" className="input" value={born} max={TODAY} onChange={(e) => setBorn(e.target.value)} aria-invalid={!!errors.born} /></Field>
        <Field id="aa-disc" label="Discipline" optional><input id="aa-disc" className="input" value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="e.g. Left-arm spin" /></Field>
        <Field id="aa-batch" label="Batch" optional>
          <select id="aa-batch" className="select" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">Assign later</option>
            {db.batches.filter((b) => b.status === 'active').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        {dupes.length > 0 && (
          <Banner tone="warn">
            <strong>Possible duplicate.</strong> {dupes.map((d) => `${d.name} (born ${fmtDate(d.born, { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.status.replace('_', ' ')})`).join('; ')} already exists.
            <div className="row gap-2" style={{ marginTop: 8 }}>
              <Link className="btn btn-sm" to={`/web/athletes/${dupes[0].id}`} onClick={onClose}>Open existing</Link>
              <Button size="sm" onClick={() => save(true)}>Add anyway and flag</Button>
            </div>
          </Banner>
        )}
        <Button type="submit" variant="primary" size="lg" pending={saving} disabled={dupes.length > 0}>Add athlete</Button>
        {dupes.length > 0 && <p className="xs muted">Adding is paused until you choose: open the existing record, or add and flag for review.</p>}
      </form>
    </Drawer>
  );
}

/** MW03.02 */
function ImportAthletes({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const [text, setText] = useState('Name, Date of birth, Discipline\nNaina Kulkarni, 2011-02-14, Opening batter\nRiya Kapoor, 2012-05-05, Leg-spin\nArnav Gupta, 2011-13-01, Seam');
  const rows = text.split('\n').slice(1).map((l) => l.split(',').map((x) => x.trim())).filter((r) => r[0]);
  const parsed = rows.map(([name, born, disc]) => {
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(born ?? '') && !Number.isNaN(new Date(born).getTime()) && Number(born.slice(5, 7)) <= 12;
    const dup = db.athletes.find((a) => similarName(a.name, name) && a.born === born);
    return { name, born, disc, issue: !validDate ? 'Invalid date (use YYYY-MM-DD)' : dup ? `Matches existing ${dup.name}` : '', dup: !!dup, ok: validDate && !dup };
  });
  const ok = parsed.filter((p) => p.ok);
  return (
    <Drawer open={open} title="Import athletes" onClose={onClose} width={640}>
      <FlowCode codes="MW03.02 · MW03.03" />
      <Field id="imp" label="Paste CSV rows" hint="First row is the header: Name, Date of birth, Discipline">
        <textarea id="imp" className="textarea" style={{ minHeight: 140, fontVariantNumeric: 'tabular-nums' }} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="card card-flush" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>Row</th><th>Name</th><th>Born</th><th>Result</th></tr></thead>
          <tbody>
            {parsed.map((p, i) => (
              <tr key={i}>
                <td>{i + 2}</td><td>{p.name}</td><td>{p.born}</td>
                <td>{p.ok ? <StatusBadge status="ready" label="Will import" /> : <span className="badge badge-warn"><AlertTriangle size={12} /> {p.issue}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted">{ok.length} of {parsed.length} rows will be imported. Rows with problems are skipped, and nothing is partly saved.</p>
      <Button variant="primary" disabled={!ok.length} onClick={() => {
        update((d) => ok.forEach((p) => d.athletes.push({ id: uid('a'), academyId: w.academy.id, name: p.name, born: p.born, batchId: null, primaryCoachId: null, supportingCoachIds: [], status: 'active', guardianIds: [], discipline: p.disc || 'Not set', access: 'none' })));
        audit(w.actorName, `Imported ${ok.length} athletes`);
        toast({ tone: 'ok', text: `${ok.length} athletes imported. ${parsed.length - ok.length} rows skipped.` });
        onClose();
      }}>Import {ok.length} athletes</Button>
    </Drawer>
  );
}

const TABS = [
  ['', 'Overview', 'MW07.02'], ['development', 'Development', 'MW07.03–04'], ['sessions', 'Sessions', 'MW07.05'], ['attendance', 'Attendance', 'MW07.06'],
  ['videos', 'Videos', 'MW07.07'], ['reassessments', 'Reassessments', 'MW07.08'], ['milestones', 'Milestones', 'MW07.09'],
  ['competitions', 'Competitions', 'MW07.10'], ['reports', 'Reports', 'MW07.11'],
] as const;

/** MW07.02–11 · HC01.01 / HC01.07 / HC02.05 */
export function Passport() {
  const { id, tab = '' } = useParams();
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const a = athleteById(db, id);
  const [editing, setEditing] = useState(false);
  const [transfer, setTransfer] = useState(false);
  useHuddleContext(a ? {
    surface: 'web', title: `Passport · ${a.name}`, athleteId: a.id,
    prompts: ['Summarise recent sessions', 'Compare the last two sessions', 'Draft a report comment'],
  } : null);
  if (!a) return <StateBlock kind="archived" title="Athlete not found" body="This record may have been merged or removed." action={<Link className="btn btn-sm" to="/web/athletes">Back to athletes</Link>} />;

  const { area, goal } = currentFocus(db, a.id);
  const att = attendanceFor(db, a.id);
  const obs = observationsFor(db, a.id);
  const tl = timelineFor(db, a.id, 'internal');

  return (
    <>
      <header className="clip" data-theme="matchday" style={{ aspectRatio: 'auto', borderRadius: 'var(--r-lg)', padding: '28px 28px 22px', marginBottom: 24, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 24, alignItems: 'end' }}>
        <PitchArt tone="court" />
        <div>
          <p className="small" style={{ color: 'var(--court-300)' }}>{a.discipline} · {ageOn(a.born)} · {batchById(db, a.batchId)?.name ?? 'No batch'} · Primary coach {coachById(db, a.primaryCoachId)?.name ?? '—'}</p>
          <h1 className="display" style={{ fontSize: 'clamp(2.75rem, 6vw, 5rem)', color: '#fff' }}>{a.name}</h1>
          {area && <p style={{ color: '#fff', marginTop: 8 }}>Current focus: <span style={{ background: 'var(--lime-400)', color: 'var(--ink-950)', padding: '1px 6px', borderRadius: 4, fontWeight: 650 }}>{area.title}</span></p>}
        </div>
        <div className="row gap-2 wrap" style={{ justifyContent: 'flex-end' }}>
          {a.status !== 'active' && <StatusBadge status={a.status} />}
          {w.canManageOrg && <Button size="sm" icon={<Pencil size={14} />} onClick={() => setEditing(true)}>Edit profile</Button>}
          {w.canManageOrg && a.status === 'active' && <Button size="sm" icon={<ArrowRightLeft size={14} />} onClick={() => setTransfer(true)}>Transfer</Button>}
        </div>
      </header>
      {a.status === 'archived' && <div style={{ marginBottom: 16 }}><Banner tone="warn">Archived athlete. The record is read-only, and its history and shared reports are preserved. <FlowCode codes="XS05.S01" /></Banner></div>}

      <nav className="tabs" aria-label="Passport sections" style={{ marginBottom: 24 }}>
        {TABS.map(([slug, label]) => (
          <NavLink key={slug} to={`/web/athletes/${a.id}${slug ? `/${slug}` : ''}`} end>{label}</NavLink>
        ))}
      </nav>

      {tab === '' && (
        <div className="w-split">
          <section>
            <div className="section-head"><h2 className="h2">Updated history</h2><FlowCode codes="HC01.07" /></div>
            <p className="small muted" style={{ marginBottom: 12 }}>Everything recorded on web and mobile, newest first. Notes from today’s session appear here as soon as they sync.</p>
            <Timeline items={tl.slice(0, 12)} />
          </section>
          <aside className="stack gap-4">
            <div className="w-grid w-grid-2" style={{ gap: 8 }}>
              <Metric label="Attendance" value={att.total ? `${att.present}/${att.total}` : '—'} basis="recorded sessions" />
              <Metric label="Notes" value={obs.length} basis={`${obs.filter((o) => o.aiDrafted).length} AI-drafted, coach-confirmed`} />
            </div>
            {goal && (
              <div className="card stack gap-2">
                <p className="xs strong muted">Active goal</p>
                <p className="strong">{goal.title}</p>
                <p className="small muted">Target: {goal.target}</p>
                {goal.drill && <p className="small">Drill: {goal.drill.name} · {goal.drill.frequency}</p>}
                <div className="row gap-2" style={{ marginTop: 6 }}>
                  <Link className="btn btn-sm btn-primary" to={`/web/tasks?new=1&athlete=${a.id}&area=${area?.id ?? ''}`}>Create task</Link>
                  <Link className="btn btn-sm" to={`/web/development/${area?.id}`}>Review development</Link>
                </div>
                <FlowCode codes="HC01.02 · MW08" />
              </div>
            )}
            <div className="card stack gap-2">
              <p className="xs strong muted">Guardians</p>
              {a.guardianIds.length ? a.guardianIds.map((g) => <p key={g} className="small">{db.people.find((p) => p.id === g)?.name}</p>) : <p className="small muted">No guardian linked. Invite one from Staff → Parent links.</p>}
              <p className="xs muted">Athlete app access: {a.access === 'direct' ? 'own login' : a.access === 'parent_device' ? 'through a parent’s device' : 'none'}</p>
            </div>
          </aside>
        </div>
      )}

      {tab === 'development' && (
        <div className="stack gap-4">
          {db.areas.filter((x) => x.athleteId === a.id).map((x) => (
            <Link key={x.id} to={`/web/development/${x.id}`} className="card card-link row gap-3">
              <span className="grow stack"><span className="strong">{x.title}</span><span className="xs muted">Opened {fmtDate(x.openedAt)} · {coachById(db, x.ownerId)?.name} · {x.priority} priority · {db.goals.filter((g) => g.areaId === x.id).length} goal(s)</span></span>
              <StatusBadge status={x.status} />
            </Link>
          ))}
          {db.areas.every((x) => x.athleteId !== a.id) && <StateBlock kind="empty" title="No development areas yet" />}
        </div>
      )}

      {(tab === 'sessions' || tab === 'attendance') && (
        <div className="card card-flush" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Date</th><th>Session</th><th>Batch</th><th>Attendance</th>{tab === 'sessions' && <th>Notes</th>}</tr></thead>
            <tbody>
              {db.sessions.filter((s) => s.attendance[a.id]).sort((x, y) => y.date.localeCompare(x.date)).map((s) => (
                <tr key={s.id}>
                  <td>{fmtDate(s.date, { day: 'numeric', month: 'short' })}</td>
                  <td>{s.title}</td>
                  <td>{batchById(db, s.batchId)?.name}</td>
                  <td>{s.attendance[a.id] === 'unmarked' ? <span className="muted">{s.status === 'scheduled' ? 'Upcoming' : 'Unmarked'}</span> : <StatusBadge status={s.attendance[a.id] === 'present' ? 'active' : 'failed'} label={s.attendance[a.id] === 'present' ? 'Present' : 'Absent'} />}</td>
                  {tab === 'sessions' && <td className="small">{obs.filter((o) => o.sessionId === s.id).length || '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'videos' && (
        <div className="w-grid w-grid-3">
          {db.videos.filter((v) => v.athleteId === a.id).map((v) => (
            <div key={v.id} className="stack gap-2">
              <Clip video={v} />
              <div className="row gap-2 wrap"><StatusBadge status={v.share} /><span className="xs muted">{v.comments.length} comments · {areaById(db, v.areaId)?.title ?? 'No area'}</span></div>
            </div>
          ))}
          {!db.videos.some((v) => v.athleteId === a.id) && <StateBlock kind="empty" title="No videos" body="Clips captured on Coach Mobile appear here once they upload." />}
        </div>
      )}

      {tab === 'reassessments' && (
        <ul className="list card card-flush">
          {db.reassessments.filter((r) => r.athleteId === a.id).map((r) => (
            <li key={r.id}><Link to={`/web/reassessments/${r.id}`} className="list-row"><span className="grow stack"><span className="small strong">{areaById(db, r.areaId)?.title}</span><span className="xs muted">Due {fmtDate(r.due)} · {coachById(db, r.assigneeId)?.name}{r.outcome ? ` · ${r.outcome.replace(/_/g, ' ')}` : ''}</span></span><StatusBadge status={r.status} /></Link></li>
          ))}
        </ul>
      )}
      {tab === 'milestones' && <Timeline items={tl.filter((i) => i.kind === 'milestone')} empty="No milestones yet" />}
      {tab === 'competitions' && (
        <ul className="list card card-flush">
          {db.competitions.filter((c) => c.athleteIds.includes(a.id)).map((c) => (
            <li key={c.id} className="list-row"><span className="grow stack"><span className="small strong">{c.name}</span><span className="xs muted">{fmtDate(c.date)} · {c.venue}{c.update ? ` · ${c.update}` : ''}{c.change ? ` · ${c.change}` : ''}</span></span><span className="badge badge-outline">{c.status}</span></li>
          ))}
        </ul>
      )}
      {tab === 'reports' && (
        <ul className="list card card-flush">
          {db.reports.filter((r) => r.athleteId === a.id).map((r) => (
            <li key={r.id}><Link to={`/web/reports/${r.id}`} className="list-row"><span className="grow stack"><span className="small strong">{r.period}</span><span className="xs muted">Version {r.version}{r.publishedAt ? ` · published ${fmtDate(r.publishedAt)}` : ''}</span></span><StatusBadge status={r.status} /></Link></li>
          ))}
          {!db.reports.some((r) => r.athleteId === a.id) && <li className="list-row small muted">No reports yet.</li>}
        </ul>
      )}

      <EditProfile open={editing} athlete={a} onClose={() => setEditing(false)} />
      <ConfirmDialog
        open={transfer}
        title={`${a.name} is moving academy`}
        body="They leave this academy’s rosters. Their history stays here. Shared reports stay visible to guardians. Whether the history follows them is an open product decision."
        confirmLabel="Record transfer"
        tone="danger"
        onCancel={() => setTransfer(false)}
        onConfirm={() => {
          update((d) => { const x = d.athletes.find((y) => y.id === a.id)!; x.status = 'transferred'; x.batchId = null; });
          audit(w.actorName, `Recorded transfer for ${a.name}`, a.id);
          toast({ tone: 'ok', text: 'Transfer recorded.' });
          setTransfer(false);
        }}
      />
    </>
  );
}

/** MW03.04 with stale-edit protection (XS04.S05) */
function EditProfile({ open, athlete, onClose }: { open: boolean; athlete: Athlete; onClose: () => void }) {
  const { update, audit, toast } = useStore();
  const w = useWeb();
  const [name, setName] = useState(athlete.name);
  const [disc, setDisc] = useState(athlete.discipline);
  return (
    <Drawer open={open} title="Edit athlete profile" onClose={onClose}>
      <FlowCode codes="MW03.04" />
      <Field id="ep-name" label="Full name" error={name.trim().split(' ').length < 2 ? 'Enter first and last name.' : ''}><input id="ep-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field id="ep-disc" label="Discipline"><input id="ep-disc" className="input" value={disc} onChange={(e) => setDisc(e.target.value)} /></Field>
      <Button variant="primary" disabled={name.trim().split(' ').length < 2} onClick={() => {
        update((d) => { const x = d.athletes.find((y) => y.id === athlete.id)!; x.name = name.trim(); x.discipline = disc.trim(); });
        audit(w.actorName, `Edited profile of ${athlete.name}`, athlete.id);
        toast({ tone: 'ok', text: 'Profile saved.' });
        onClose();
      }}>Save profile</Button>
    </Drawer>
  );
}
