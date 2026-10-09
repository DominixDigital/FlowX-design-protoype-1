import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Archive, UserPlus, ArrowRightLeft } from 'lucide-react';
import { useStore, uid } from '../../store/store';
import { athleteById, batchById, coachById, currentFocus } from '../../store/selectors';
import { Avatar, Banner, Button, ConfirmDialog, Field, FlowCode, StatusBadge, StateBlock } from '../../components/ui';
import { useHuddleContext } from '../../huddle/Huddle';
import { Drawer, PageHead } from './parts';
import { useWeb } from './useWeb';

/** MW04.01–07 · MW05.01–05 */
export function BatchesPage() {
  const { batchId } = useParams();
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const nav = useNavigate();
  const sel = batchById(db, batchId) ?? db.batches.find((b) => b.status === 'active');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [rename, setRename] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const [realloc, setRealloc] = useState<{ athleteId: string; coachId: string } | null>(null);
  useHuddleContext({ surface: 'web', title: sel ? `Batch · ${sel.name}` : 'Batches', prompts: ['What can you help with?'] });

  const roster = sel ? db.athletes.filter((a) => a.batchId === sel.id && a.status === 'active') : [];
  const coaches = db.coaches.filter((c) => c.academyId === w.academy.id && c.status === 'active');
  const unbatched = db.athletes.filter((a) => a.status === 'active' && a.batchId !== sel?.id);
  const nameTaken = (n: string) => db.batches.some((b) => b.name.toLowerCase() === n.trim().toLowerCase() && b.id !== sel?.id);

  const setPrimary = (athleteId: string, coachId: string) => {
    const a = athleteById(db, athleteId)!;
    const activeDev = db.areas.some((x) => x.athleteId === athleteId && (x.status === 'active' || x.status === 'reopened'));
    if (activeDev && a.primaryCoachId && a.primaryCoachId !== coachId) { setRealloc({ athleteId, coachId }); return; }
    applyPrimary(athleteId, coachId, false);
  };
  const applyPrimary = (athleteId: string, coachId: string, handover: boolean) => {
    const a = athleteById(db, athleteId)!;
    const from = a.primaryCoachId;
    update((d) => {
      const x = d.athletes.find((y) => y.id === athleteId)!; x.primaryCoachId = coachId || null;
      if (handover && from && coachId) d.handovers.push({ id: uid('h'), athleteId, fromId: from, toId: coachId, summary: `Primary coach changed by ${w.actorName}. Active development continues.`, nextAction: currentFocus(d, athleteId).goal?.nextAction ?? '', status: 'sent', createdAt: new Date().toISOString().slice(0, 16) });
      d.areas.forEach((ar) => { if (handover && ar.athleteId === athleteId && ar.status === 'active') ar.ownerId = coachId; });
    });
    audit(w.actorName, `Primary coach for ${a.name}: ${coachById(db, from)?.name ?? 'none'} → ${coachById(db, coachId)?.name ?? 'none'}`, athleteId);
    toast({ tone: 'ok', text: `${a.name}’s primary coach is now ${coachById(db, coachId)?.name ?? 'unassigned'}.${handover ? ' A handover was sent.' : ''}` });
  };

  return (
    <>
      <PageHead title="Batches" codes="MW04 · MW05" actions={w.canManageOrg && <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>Create batch</Button>} />
      <div className="w-split" style={{ gridTemplateColumns: 'minmax(220px, .6fr) minmax(0, 1.6fr)' }}>
        <ul className="list card card-flush">
          {db.batches.map((b) => (
            <li key={b.id}>
              <Link to={`/web/batches/${b.id}`} className="list-row" aria-current={b.id === sel?.id ? 'page' : undefined} style={b.id === sel?.id ? { background: 'var(--surface-2)', boxShadow: 'inset 4px 0 0 var(--forest-700)' } : undefined}>
                <span className="grow stack"><span className="small strong">{b.name}</span><span className="xs muted">{db.athletes.filter((a) => a.batchId === b.id && a.status === 'active').length} athletes</span></span>
                {b.status === 'archived' && <StatusBadge status="archived" />}
              </Link>
            </li>
          ))}
        </ul>

        {!sel ? <StateBlock kind="empty" title="No batches yet" body="Create one to group athletes and assign coaches." /> : (
          <article className="stack gap-6">
            <header className="row between wrap gap-3">
              <div>
                <h2 className="display display-lg">{sel.name}</h2>
                <p className="small muted">Coach {sel.coachIds.map((c) => coachById(db, c)?.name).join(', ') || '—'} · Assistant {sel.assistantIds.map((c) => coachById(db, c)?.name).join(', ') || '—'}</p>
              </div>
              {w.canManageOrg && sel.status === 'active' && (
                <div className="row gap-2">
                  <Button size="sm" icon={<Pencil size={14} />} onClick={() => { setRename(sel.name); setRenaming(true); }}>Rename</Button>
                  <Button size="sm" variant="danger" icon={<Archive size={14} />} onClick={() => setArchiving(true)}>Archive</Button>
                </div>
              )}
            </header>
            {sel.status === 'archived' && <Banner tone="warn">Archived batch. Past sessions and attendance still show in each athlete’s history. <FlowCode codes="MW04.06 · XS05.S03" /></Banner>}

            {sel.status === 'active' && w.canManageOrg && (
              <section className="card w-grid w-grid-2">
                <Field id="b-coach" label="Coach" hint="MW04.03">
                  <select id="b-coach" className="select" value={sel.coachIds[0] ?? ''} onChange={(e) => {
                    update((d) => { d.batches.find((x) => x.id === sel.id)!.coachIds = e.target.value ? [e.target.value] : []; });
                    audit(w.actorName, `Assigned ${coachById(db, e.target.value)?.name} to ${sel.name}`, sel.id);
                    toast({ tone: 'ok', text: 'Coach assigned. They see this batch’s sessions on Coach Mobile.' });
                  }}>
                    <option value="">None</option>{coaches.filter((c) => c.role !== 'assistant').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field id="b-asst" label="Assistant" hint="MW04.04">
                  <select id="b-asst" className="select" value={sel.assistantIds[0] ?? ''} onChange={(e) => {
                    update((d) => { d.batches.find((x) => x.id === sel.id)!.assistantIds = e.target.value ? [e.target.value] : []; });
                    audit(w.actorName, `Assigned assistant ${coachById(db, e.target.value)?.name} to ${sel.name}`, sel.id);
                    toast({ tone: 'ok', text: 'Assistant assigned.' });
                  }}>
                    <option value="">None</option>{coaches.map((c) => <option key={c.id} value={c.id}>{c.name}{c.tempAccessUntil ? ' (temporary)' : ''}</option>)}
                  </select>
                </Field>
              </section>
            )}

            <section>
              <div className="section-head">
                <h3 className="h3">Roster and coach allocation <FlowCode codes="MW04.02 · MW05.01–05.04" /></h3>
                {w.canManageOrg && sel.status === 'active' && <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setAdding(true)}>Add athletes</Button>}
              </div>
              {roster.length === 0 ? <StateBlock kind="empty" title="No athletes in this batch" /> : (
                <div className="card card-flush" style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead><tr><th>Athlete</th><th>Primary coach</th><th>Supporting</th><th><span className="sr-only">Actions</span></th></tr></thead>
                    <tbody>
                      {roster.map((a) => (
                        <tr key={a.id}>
                          <td><span className="row gap-2"><Avatar name={a.name} size="sm" /><Link to={`/web/athletes/${a.id}`}>{a.name}</Link></span></td>
                          <td>
                            <select aria-label={`Primary coach for ${a.name}`} className="select" style={{ minHeight: 36, padding: '4px 8px' }} value={a.primaryCoachId ?? ''} disabled={!w.canManageOrg} onChange={(e) => setPrimary(a.id, e.target.value)}>
                              <option value="">Unassigned</option>{coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>
                          <td className="small">
                            {a.supportingCoachIds.map((c) => coachById(db, c)?.name).join(', ') || '—'}
                            {w.canManageOrg && (
                              <select aria-label={`Add supporting coach for ${a.name}`} className="select" style={{ minHeight: 32, padding: '2px 6px', marginTop: 4, fontSize: 12 }} value="" onChange={(e) => {
                                if (!e.target.value) return;
                                update((d) => { const x = d.athletes.find((y) => y.id === a.id)!; if (!x.supportingCoachIds.includes(e.target.value)) x.supportingCoachIds.push(e.target.value); });
                                toast({ tone: 'ok', text: `${coachById(db, e.target.value)?.name} added as supporting coach.` });
                              }}>
                                <option value="">+ Supporting… (MW05.03)</option>{coaches.filter((c) => c.id !== a.primaryCoachId && !a.supportingCoachIds.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            )}
                          </td>
                          <td>{w.canManageOrg && <Button size="sm" variant="ghost" icon={<ArrowRightLeft size={14} />} onClick={() => setMoving(a.id)}>Move</Button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </article>
        )}
      </div>

      <Drawer open={creating} title="Create batch" onClose={() => setCreating(false)}>
        <FlowCode codes="MW04.01" />
        <Field id="nb" label="Batch name" error={newName && nameTaken(newName) ? 'A batch with this name already exists.' : ''}><input id="nb" className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. U12 Development" /></Field>
        <Button variant="primary" disabled={!newName.trim() || nameTaken(newName)} onClick={() => {
          const id = uid('b');
          update((d) => d.batches.push({ id, academyId: w.academy.id, name: newName.trim(), coachIds: [], assistantIds: [], status: 'active' }));
          audit(w.actorName, `Created batch ${newName.trim()}`, id);
          toast({ tone: 'ok', text: 'Batch created. Add athletes and a coach next.' });
          setNewName(''); setCreating(false); nav(`/web/batches/${id}`);
        }}>Create batch</Button>
      </Drawer>

      <Drawer open={adding} title={`Add athletes to ${sel?.name}`} onClose={() => setAdding(false)}>
        <p className="small muted">Athletes already in another batch will be moved.</p>
        <ul className="list card card-flush">
          {unbatched.map((a) => (
            <li key={a.id} className="list-row">
              <span className="grow stack"><span className="small strong">{a.name}</span><span className="xs muted">{batchById(db, a.batchId)?.name ?? 'No batch'}</span></span>
              <Button size="sm" onClick={() => {
                update((d) => { d.athletes.find((y) => y.id === a.id)!.batchId = sel!.id; });
                audit(w.actorName, `Added ${a.name} to ${sel!.name}`, a.id);
                toast({ tone: 'ok', text: `${a.name} added to ${sel!.name}.` });
              }}>Add</Button>
            </li>
          ))}
        </ul>
      </Drawer>

      <ConfirmDialog open={renaming} title="Rename batch" confirmLabel="Rename" onCancel={() => setRenaming(false)} onConfirm={() => {
        if (!rename.trim() || nameTaken(rename)) return;
        update((d) => { d.batches.find((x) => x.id === sel!.id)!.name = rename.trim(); });
        audit(w.actorName, `Renamed batch ${sel!.name} → ${rename.trim()}`, sel!.id);
        toast({ tone: 'ok', text: 'Batch renamed. History shows the new name.' });
        setRenaming(false);
      }}>
        <Field id="rn-b" label="New name" error={nameTaken(rename) ? 'That name is taken.' : ''}><input id="rn-b" className="input" value={rename} onChange={(e) => setRename(e.target.value)} /></Field>
      </ConfirmDialog>

      <ConfirmDialog open={archiving} title={`Archive ${sel?.name}?`} tone="danger" confirmLabel="Archive batch"
        body={`${roster.length} athletes will be left without a batch, and upcoming sessions stop appearing. Past sessions and attendance stay in each athlete’s history.`}
        onCancel={() => setArchiving(false)} onConfirm={() => {
          update((d) => { d.batches.find((x) => x.id === sel!.id)!.status = 'archived'; d.athletes.forEach((a) => { if (a.batchId === sel!.id) a.batchId = null; }); });
          audit(w.actorName, `Archived batch ${sel!.name}`, sel!.id);
          toast({ tone: 'ok', text: 'Batch archived.' });
          setArchiving(false);
        }} />

      <ConfirmDialog open={!!moving} title={`Move ${athleteById(db, moving)?.name}`} confirmLabel="Move athlete"
        body="Their history, development areas and coach stay the same. Only the batch changes." onCancel={() => setMoving(null)} onConfirm={() => {
          if (!moveTo) return;
          update((d) => { d.athletes.find((y) => y.id === moving)!.batchId = moveTo; });
          audit(w.actorName, `Moved ${athleteById(db, moving)?.name} to ${batchById(db, moveTo)?.name}`, moving!);
          toast({ tone: 'ok', text: `Moved to ${batchById(db, moveTo)?.name}.` });
          setMoving(null); setMoveTo('');
        }}>
        <Field id="mv" label="New batch">
          <select id="mv" className="select" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            <option value="">Choose…</option>{db.batches.filter((b) => b.status === 'active' && b.id !== sel?.id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <FlowCode codes="MW04.05" />
      </ConfirmDialog>

      <ConfirmDialog open={!!realloc} title="Change coach during active development?"
        body={`${athleteById(db, realloc?.athleteId)?.name} has active development work with ${coachById(db, athleteById(db, realloc?.athleteId)?.primaryCoachId)?.name}. Moving it to ${coachById(db, realloc?.coachId)?.name} sends a handover so goals and next actions carry over.`}
        confirmLabel="Change and send handover" onCancel={() => setRealloc(null)} onConfirm={() => { applyPrimary(realloc!.athleteId, realloc!.coachId, true); setRealloc(null); }}>
        <FlowCode codes="MW05.04 · CM09" />
      </ConfirmDialog>
    </>
  );
}
