import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Trophy, ClipboardList, FileText } from 'lucide-react';
import { useStore, uid, nowISO } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { areaById, athleteById, attendanceFor, coachById, fmtDate, observationsFor, daysUntil } from '../../store/selectors';
import type { ReassessmentOutcome } from '../../data/types';
import { AssumptionNote, Banner, Button, Field, FlowCode, StatusBadge, StateBlock } from '../../components/ui';
import { Clip } from '../../components/art';
import { Seam } from '../../components/Seam';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { PageHead } from './parts';
import { useWeb } from './useWeb';

const OUTCOME_LABEL: Record<ReassessmentOutcome, string> = { needs_more_work: 'Needs more work', improving: 'Improving', on_track: 'On track', achieved: 'Achieved' };

/** MW10.01–07 · HC02.06 */
export function ReassessmentsPage() {
  const { rid } = useParams();
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const h = useCompanion();
  const nav = useNavigate();
  const [tab, setTab] = useState<'pending' | 'submitted' | 'approved'>('submitted');
  const list = db.reassessments.filter((r) => (tab === 'pending' ? r.status === 'pending' || r.status === 'in_progress' : r.status === tab));
  const sel = db.reassessments.find((r) => r.id === rid) ?? list[0];
  const athlete = athleteById(db, sel?.athleteId);
  const area = areaById(db, sel?.areaId);
  const [assignee, setAssignee] = useState('');
  const [due, setDue] = useState('');
  const [outcome, setOutcome] = useState<ReassessmentOutcome | ''>('');
  const [next, setNext] = useState('');
  const [nextTo, setNextTo] = useState('');
  const [milestone, setMilestone] = useState<string | null>(null);
  // Reset the decision form when a different reassessment is selected.
  useEffect(() => { setMilestone(null); setOutcome(''); setNext(''); setNextTo(''); setAssignee(''); setDue(''); }, [sel?.id]);

  useCompanionContext(sel && athlete ? {
    surface: 'web', title: `Reassessment · ${athlete.name}`, athleteId: athlete.id, reassessmentId: sel.id,
    prompts: ['Brief me on the evidence', 'Compare the last two sessions'],
  } : { surface: 'web', title: 'Reassessments', prompts: ['What can you help with?'] });

  const obs = sel ? observationsFor(db, sel.athleteId).filter((o) => o.areaId === sel.areaId) : [];
  const vids = sel ? db.videos.filter((v) => v.areaId === sel.areaId) : [];
  const att = sel ? attendanceFor(db, sel.athleteId) : null;

  return (
    <>
      <PageHead title="Reassessments" codes="MW10.01–10.07" />
      <div className="tabs" role="tablist" style={{ marginBottom: 16 }}>
        {(['submitted', 'pending', 'approved'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); nav('/web/reassessments'); }}>
            {t === 'submitted' ? 'Awaiting approval' : t === 'pending' ? 'Scheduled' : 'Approved'} <span className="muted">({db.reassessments.filter((r) => (t === 'pending' ? r.status === 'pending' || r.status === 'in_progress' : r.status === t)).length})</span>
          </button>
        ))}
      </div>
      <div className="w-split" style={{ gridTemplateColumns: 'minmax(260px, .8fr) minmax(0, 1.6fr)' }}>
        <ul className="list card card-flush" aria-label="Reassessments">
          {list.length === 0 && <li className="list-row small muted">Nothing here.</li>}
          {list.map((r) => (
            <li key={r.id}>
              <Link to={`/web/reassessments/${r.id}`} className="list-row" aria-current={r.id === sel?.id ? 'page' : undefined} style={r.id === sel?.id ? { background: 'var(--surface-2)', boxShadow: 'inset 4px 0 0 var(--role-700)' } : undefined}>
                <span className="grow stack"><span className="small strong">{athleteById(db, r.athleteId)?.name}</span><span className="xs muted">{areaById(db, r.areaId)?.title} · {coachById(db, r.assigneeId)?.name}</span></span>
                <span className="xs muted">{daysUntil(r.due) < 0 && r.status === 'pending' ? 'Overdue' : fmtDate(r.due)}</span>
              </Link>
            </li>
          ))}
        </ul>

        {!sel || !athlete || !area ? <StateBlock kind="empty" title="Select a reassessment" /> : (
          <article className="stack gap-6">
            <header>
              <div className="row gap-2"><StatusBadge status={sel.status} /><span className="xs muted">Due {fmtDate(sel.due)} · {coachById(db, sel.assigneeId)?.name}</span></div>
              <h2 className="display display-lg" style={{ marginTop: 6 }}>{athlete.name}</h2>
              <p className="small muted">{area.title}</p>
            </header>

            {sel.status === 'pending' && w.canCoach && (
              <section className="card stack gap-3">
                <h3 className="h3">Assign <FlowCode codes="MW10.02" /></h3>
                <div className="row gap-2 wrap">
                  <select aria-label="Coach" className="select" style={{ maxWidth: 240 }} value={assignee || sel.assigneeId} onChange={(e) => setAssignee(e.target.value)}>
                    {db.coaches.filter((c) => c.status === 'active' && c.academyId === w.academy.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input aria-label="Due date" type="date" className="input" style={{ maxWidth: 180 }} min={TODAY} value={due || sel.due} onChange={(e) => setDue(e.target.value)} />
                  <Button onClick={() => {
                    const to = assignee || sel.assigneeId; const d2 = due || sel.due;
                    const coach = db.coaches.find((c) => c.id === to)!;
                    update((d) => {
                      const x = d.reassessments.find((y) => y.id === sel.id)!; x.assigneeId = to; x.due = d2;
                      d.notifications.push({ id: uid('n'), personId: coach.personId, kind: 'reassessment', title: 'Reassessment assigned to you', body: `${athlete.name} — due ${fmtDate(d2)}`, route: `/coach/reassess/${sel.id}`, target: { type: 'reassessment', id: sel.id }, createdAt: nowISO(), read: false });
                    });
                    audit(w.actorName, `Assigned reassessment of ${athlete.name} to ${coach.name}, due ${d2}`, sel.id);
                    toast({ tone: 'ok', text: `Assigned to ${coach.name}. They’ll see it on Coach Mobile.` });
                  }}>Save assignment</Button>
                </div>
              </section>
            )}

            <section>
              <div className="section-head">
                <h3 className="h3">Evidence <FlowCode codes="MW10.03" /></h3>
                <button className="seam-btn" onClick={() => h.openCompanion({ ask: 'Brief me on the evidence' })}><Seam state="insight" size={20} /> Evidence brief</button>
              </div>
              <div className="w-grid w-grid-3" style={{ gap: 8, marginBottom: 12 }}>
                <div className="metric"><span className="metric-label">Notes on area</span><span className="num">{obs.length}</span><span className="metric-basis">since {fmtDate(area.openedAt)}</span></div>
                <div className="metric"><span className="metric-label">Attendance</span><span className="num">{att?.total ? `${att.present}/${att.total}` : '—'}</span><span className="metric-basis">recorded sessions</span></div>
                <div className="metric"><span className="metric-label">Clips</span><span className="num">{vids.length}</span><span className="metric-basis">linked to area</span></div>
              </div>
              <ul className="list card card-flush">
                {obs.map((o) => <li key={o.id} className="list-row small" style={{ alignItems: 'flex-start' }}><span className="xs muted" style={{ width: 56, flex: 'none' }}>{fmtDate(o.createdAt)}</span><span>{o.text}</span></li>)}
                {!obs.length && <li className="list-row small muted">No notes linked yet.</li>}
              </ul>
              {vids[0] && <div style={{ marginTop: 12, maxWidth: 420 }}><Clip video={vids[0]} /></div>}
            </section>

            {(sel.status === 'submitted' || sel.status === 'approved') && (
              <section className="card stack gap-3" style={{ borderColor: 'var(--line-strong)' }}>
                <h3 className="h3">Submitted by {coachById(db, sel.assigneeId)?.name} <FlowCode codes="MW10.04" /></h3>
                <p className="small"><strong>Outcome:</strong> {sel.outcome ? OUTCOME_LABEL[sel.outcome] : '—'}</p>
                <p className="small">“{sel.note}”</p>
                {sel.nextAction && <p className="small"><strong>Proposed next action:</strong> {sel.nextAction}</p>}
                {sel.proposedMilestone && <p className="small"><strong>Proposed milestone:</strong> {sel.proposedMilestone}</p>}
                <AssumptionNote code="MW10.04" />
              </section>
            )}

            {sel.status === 'submitted' && (
              w.canApprove ? (
                <section className="card stack gap-4">
                  <h3 className="h3">Decide <FlowCode codes="MW10.05–10.07" /></h3>
                  <Field id="ro" label="Status">
                    <select id="ro" className="select" value={outcome || sel.outcome || ''} onChange={(e) => setOutcome(e.target.value as ReassessmentOutcome)}>
                      {Object.entries(OUTCOME_LABEL).map(([k, v]) => <option key={k} value={k}>{v}{k === sel.outcome ? ' (as submitted)' : ''}</option>)}
                    </select>
                  </Field>
                  <Field id="rn" label="Next action as a task" optional hint="Creates a coach task linked to this area.">
                    <div className="row gap-2">
                      <input id="rn" className="input" value={next} onChange={(e) => setNext(e.target.value)} placeholder={sel.nextAction || 'e.g. Live bowling at 70% pace'} />
                      <select aria-label="Assign next action to" className="select" style={{ maxWidth: 180 }} value={nextTo} onChange={(e) => setNextTo(e.target.value)}>
                        <option value="">Coach…</option>
                        {db.coaches.filter((c) => c.status === 'active' && c.academyId === w.academy.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </Field>
                  <Field id="rm" label="Mark a milestone" optional hint={sel.proposedMilestone ? 'Proposed by the coach. Edit or clear it before approving.' : 'Shown to the family in the next report.'}>
                    <input id="rm" className="input" value={milestone ?? sel.proposedMilestone ?? ''} onChange={(e) => setMilestone(e.target.value)} />
                  </Field>
                  <div className="row gap-2">
                    <Button variant="primary" icon={<Check size={16} />} onClick={() => {
                      const finalOutcome = (outcome || sel.outcome) as ReassessmentOutcome;
                      const msTitle = (milestone ?? sel.proposedMilestone ?? '').trim();
                      const mid = msTitle ? uid('m') : null;
                      update((d) => {
                        const x = d.reassessments.find((y) => y.id === sel.id)!; x.status = 'approved'; x.outcome = finalOutcome; if (mid) x.milestoneId = mid;
                        if (finalOutcome === 'achieved') { const a = d.areas.find((y) => y.id === sel.areaId)!; a.status = 'achieved'; }
                        if (mid) d.milestones.push({ id: mid, athleteId: sel.athleteId, areaId: sel.areaId, title: msTitle, date: TODAY, visibleToFamily: true });
                        if (next.trim() && nextTo) {
                          const tid = uid('t');
                          d.tasks.push({ id: tid, athleteId: sel.athleteId, areaId: sel.areaId, title: next.trim(), instruction: `Follow-up from reassessment: ${sel.note}`, assigneeId: nextTo, createdById: w.coach?.id ?? 'c-rohan', status: 'open', due: '2026-10-16', evidenceObservationIds: [], evidenceVideoIds: [], createdAt: nowISO(), version: 1 });
                        }
                      });
                      audit(w.actorName, `Approved reassessment of ${athlete.name}: ${finalOutcome}${mid ? ' + milestone' : ''}`, sel.id);
                      toast({ tone: 'ok', text: `Approved${mid ? ' with a milestone' : ''}. Ready to report to the family.`, action: { label: 'Start report', run: () => nav(`/web/reports?athlete=${athlete.id}`) } });
                    }}>Approve</Button>
                  </div>
                </section>
              ) : <Banner tone="info">Only the head coach approves reassessments.</Banner>
            )}

            {sel.status === 'approved' && (
              <section className="row gap-2 wrap">
                <Link className="btn btn-primary" to={`/web/reports?athlete=${athlete.id}`}><FileText size={16} /> Start parent report</Link>
                <Link className="btn" to={`/web/tasks?new=1&athlete=${athlete.id}&area=${area.id}`}><ClipboardList size={16} /> Follow-up task</Link>
                {sel.milestoneId && <span className="badge badge-lime"><Trophy size={12} /> Milestone recorded</span>}
              </section>
            )}
          </article>
        )}
      </div>
    </>
  );
}
