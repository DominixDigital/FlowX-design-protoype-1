import { useState } from 'react';
import { UserPlus, Archive, RotateCcw, Check } from 'lucide-react';
import { useStore, uid } from '../../store/store';
import { coachById, fmtDate } from '../../store/selectors';
import type { Coach } from '../../data/types';
import { Assumption, Avatar, Banner, Button, ConfirmDialog, Field, FlowCode, StatusBadge } from '../../components/ui';
import { useHuddleContext } from '../../huddle/Huddle';
import { Drawer, PageHead } from './parts';
import { useWeb } from './useWeb';

const ROLE_LABEL = { head_coach: 'Head coach', coach: 'Coach', assistant: 'Assistant coach' } as const;

/** MW02.01–08 · MW05.05 · XS01.07 */
export function StaffPage() {
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const [inviting, setInviting] = useState(false);
  const [view, setView] = useState<Coach | null>(null);
  const [deactivate, setDeactivate] = useState<Coach | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  useHuddleContext({ surface: 'web', title: 'Staff', prompts: ['What can you help with?'] });
  const staff = db.coaches.filter((c) => c.academyId === w.academy.id);
  const holdings = (c: Coach) => ({
    athletes: db.athletes.filter((a) => a.primaryCoachId === c.id && a.status === 'active'),
    tasks: db.tasks.filter((t) => t.assigneeId === c.id && ['open', 'in_progress', 'blocked'].includes(t.status)),
    reass: db.reassessments.filter((r) => r.assigneeId === c.id && r.status !== 'approved'),
    batches: db.batches.filter((b) => b.coachIds.includes(c.id) || b.assistantIds.includes(c.id)),
  });

  return (
    <>
      <PageHead title="Staff" codes="MW02.01–02.08" actions={w.canManageOrg && <Button variant="primary" icon={<UserPlus size={16} />} onClick={() => setInviting(true)}>Invite staff</Button>} />
      <div className="card card-flush" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>Name</th><th>Role</th><th>Batches</th><th>Athletes</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {staff.map((c) => {
              const h = holdings(c);
              return (
                <tr key={c.id}>
                  <td><button className="row gap-2" style={{ background: 'none', border: 0, padding: 0, fontWeight: 620 }} onClick={() => setView(c)}><Avatar name={c.name} size="sm" muted={c.status !== 'active'} /> {c.name}</button></td>
                  <td>
                    {w.canManageOrg && c.status !== 'inactive' ? (
                      <select aria-label={`Role for ${c.name}`} className="select" style={{ minHeight: 34, padding: '2px 8px' }} value={c.role} onChange={(e) => {
                        const role = e.target.value as Coach['role'];
                        update((d) => { d.coaches.find((x) => x.id === c.id)!.role = role; const m = d.people.find((p) => p.id === c.personId)?.memberships.find((m) => m.academyId === c.academyId); if (m) m.role = role; });
                        audit(w.actorName, `Changed ${c.name}’s role to ${ROLE_LABEL[role]}`, c.id);
                        toast({ tone: 'ok', text: `${c.name} is now ${ROLE_LABEL[role]}. If they’re signed in, their app updates on the next action.` });
                      }}>
                        {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    ) : ROLE_LABEL[c.role]}
                    {c.tempAccessUntil && <div className="xs muted">Temporary until {fmtDate(c.tempAccessUntil)}</div>}
                  </td>
                  <td className="small">{h.batches.map((b) => b.name).join(', ') || '—'}</td>
                  <td>{h.athletes.length}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {w.canManageOrg && c.status === 'active' && <Button size="sm" variant="ghost" icon={<Archive size={14} />} onClick={() => setDeactivate(c)}>Deactivate</Button>}
                    {w.canManageOrg && c.status === 'inactive' && <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => {
                      update((d) => { d.coaches.find((x) => x.id === c.id)!.status = 'active'; });
                      audit(w.actorName, `Reactivated ${c.name}`, c.id);
                      toast({ tone: 'ok', text: `${c.name} reactivated. Reassign batches and athletes as needed.` });
                    }}>Reactivate</Button>}
                    {c.status === 'invited' && <Button size="sm" variant="ghost" icon={<Check size={14} />} onClick={() => {
                      update((d) => { d.coaches.find((x) => x.id === c.id)!.status = 'active'; });
                      audit(c.name, 'Accepted invitation', c.id);
                      toast({ tone: 'ok', text: `${c.name} accepted (simulated).` });
                    }}>Simulate acceptance</Button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="xs muted" style={{ marginTop: 8 }}>Inactive coaches keep their name on past sessions, notes and reports. <FlowCode codes="XS05.S02" /></p>

      <InviteStaff open={inviting} onClose={() => setInviting(false)} />

      <Drawer open={!!view} title={view ? `${view.name}’s assignments` : ''} onClose={() => setView(null)}>
        <FlowCode codes="MW02.08" />
        {view && (() => {
          const h = holdings(view);
          return (
            <div className="stack gap-3">
              <p className="small"><strong>Batches:</strong> {h.batches.map((b) => b.name).join(', ') || 'None'}</p>
              <p className="small"><strong>Primary athletes:</strong> {h.athletes.map((a) => a.name).join(', ') || 'None'}</p>
              <p className="small"><strong>Open tasks:</strong> {h.tasks.map((t) => t.title).join('; ') || 'None'}</p>
              <p className="small"><strong>Reassessments:</strong> {h.reass.length}</p>
            </div>
          );
        })()}
      </Drawer>

      <ConfirmDialog
        open={!!deactivate}
        title={`Deactivate ${deactivate?.name}?`}
        tone="danger"
        confirmLabel="Deactivate and reassign"
        body="They lose access straight away, including any screen they have open. Their past work stays attributed to them."
        onCancel={() => setDeactivate(null)}
        onConfirm={() => {
          if (!deactivate) return;
          const h = holdings(deactivate);
          if ((h.athletes.length || h.tasks.length || h.reass.length) && !reassignTo) return;
          update((d) => {
            d.coaches.find((x) => x.id === deactivate.id)!.status = 'inactive';
            d.athletes.forEach((a) => { if (a.primaryCoachId === deactivate.id) a.primaryCoachId = reassignTo; });
            d.tasks.forEach((t) => { if (t.assigneeId === deactivate.id && ['open', 'in_progress', 'blocked'].includes(t.status)) { t.assigneeId = reassignTo; t.version += 1; } });
            d.reassessments.forEach((r) => { if (r.assigneeId === deactivate.id && r.status !== 'approved') r.assigneeId = reassignTo; });
            d.batches.forEach((b) => { b.coachIds = b.coachIds.map((x) => (x === deactivate.id ? reassignTo : x)); b.assistantIds = b.assistantIds.filter((x) => x !== deactivate.id); });
          });
          audit(w.actorName, `Deactivated ${deactivate.name}; work moved to ${coachById(db, reassignTo)?.name ?? 'nobody'}`, deactivate.id);
          toast({ tone: 'ok', text: `${deactivate.name} deactivated. Open work moved to ${coachById(db, reassignTo)?.name ?? '—'}.` });
          setDeactivate(null); setReassignTo('');
        }}
      >
        {deactivate && (() => {
          const h = holdings(deactivate);
          const any = h.athletes.length + h.tasks.length + h.reass.length;
          return any ? (
            <>
              <Banner tone="warn">{h.athletes.length} athletes, {h.tasks.length} open tasks and {h.reass.length} reassessments need a new owner. <FlowCode codes="MW05.05" /></Banner>
              <Field id="re-to" label="Move their open work to" error={!reassignTo ? 'Choose a coach.' : ''}>
                <select id="re-to" className="select" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                  <option value="">Choose…</option>{staff.filter((c) => c.status === 'active' && c.id !== deactivate.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </>
          ) : <p className="small muted">No open work to reassign.</p>;
        })()}
      </ConfirmDialog>
    </>
  );
}

function InviteStaff({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Coach['role']>('coach');
  const [until, setUntil] = useState('');
  const [touched, setTouched] = useState(false);
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const err = {
    name: touched && name.trim().split(' ').length < 2 ? 'Enter first and last name.' : '',
    email: touched && !emailOk ? 'Enter a valid email address, like name@example.com.' : '',
    until: touched && role === 'assistant' && until && until < '2026-10-09' ? 'Expiry must be in the future.' : '',
  };
  const hasHead = db.coaches.some((c) => c.academyId === w.academy.id && c.role === 'head_coach' && c.status === 'active');
  return (
    <Drawer open={open} title="Invite staff" onClose={onClose}>
      <FlowCode codes="MW02.01–02.04" />
      <form className="stack gap-4" onSubmit={(e) => {
        e.preventDefault(); setTouched(true);
        if (err.name || err.email || err.until || !name.trim() || !emailOk) return;
        const id = uid('c');
        update((d) => d.coaches.push({ id, personId: uid('p'), academyId: w.academy.id, name: name.trim(), role, status: 'invited', tempAccessUntil: role === 'assistant' && until ? until : undefined }));
        audit(w.actorName, `Invited ${name.trim()} as ${ROLE_LABEL[role]}`, id);
        toast({ tone: 'ok', text: `Invitation sent to ${email} (simulated).` });
        setName(''); setEmail(''); setTouched(false); onClose();
      }}>
        <Field id="in-name" label="Full name" error={err.name}><input id="in-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field id="in-email" label="Email" error={err.email}><input id="in-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} /></Field>
        <Field id="in-role" label="Role">
          <select id="in-role" className="select" value={role} onChange={(e) => setRole(e.target.value as Coach['role'])}>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        {role === 'head_coach' && hasHead && <Banner tone="info">This academy already has a head coach. Both will be able to approve reports.</Banner>}
        {role === 'assistant' && (
          <>
            <Field id="in-until" label="Temporary access until" optional error={err.until}><input id="in-until" type="date" className="input" value={until} onChange={(e) => setUntil(e.target.value)} /></Field>
            <Assumption code="XS01.07" />
          </>
        )}
        <Button type="submit" variant="primary" size="lg">Send invitation</Button>
      </form>
    </Drawer>
  );
}
