import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Target, Trophy, Check } from 'lucide-react';
import { useStore, uid, nowISO } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { areaById, athleteById, fmtDate, observationsFor, daysUntil } from '../../store/selectors';
import type { ReassessmentOutcome } from '../../data/types';
import { Assumption, AssumptionNote, Banner, Button, Field, FlowCode, StatusBadge } from '../../components/ui';
import { Clip } from '../../components/art';
import { Seam } from '../../components/Seam';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { CoachHeader, CoachGate, NotFound } from './parts';
import { useCoach } from './useCoach';

const OUTCOMES: { v: ReassessmentOutcome; label: string; desc: string }[] = [
  { v: 'needs_more_work', label: 'Needs more work', desc: 'Keep the area and goal as they are' },
  { v: 'improving', label: 'Improving', desc: 'Moving the right way; keep going' },
  { v: 'on_track', label: 'On track', desc: 'Close to the target' },
  { v: 'achieved', label: 'Achieved', desc: 'Target met: the area closes as achieved' },
];

function Step({ n, title, codes, children, optional }: { n: number; title: string; codes: string; children: ReactNode; optional?: boolean }) {
  return (
    <li className="card" style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12 }}>
      <span className="num" style={{ fontSize: '1.6rem', color: 'var(--role-600)' }} aria-hidden>{n}</span>
      <div className="stack gap-2">
        <h2 className="small strong">{title} {optional && <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>} <FlowCode codes={codes} /></h2>
        {children}
      </div>
    </li>
  );
}

export function Reassess() {
  const { id } = useParams();
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const h = useCompanion();
  const r = db.reassessments.find((x) => x.id === id);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState(r?.note ?? '');
  const [outcome, setOutcome] = useState<ReassessmentOutcome | null>(r?.outcome ?? null);
  const [next, setNext] = useState(r?.nextAction ?? '');
  const [milestone, setMilestone] = useState('');
  const [touched, setTouched] = useState(false);

  useCompanionContext(r ? {
    surface: 'coach', title: `Reassessment · ${athleteById(db, r.athleteId)?.name}`, athleteId: r.athleteId, reassessmentId: r.id,
    prompts: ['Brief me on the evidence', 'Compare the last two sessions'],
  } : null, { useText: { label: 'Use as reassessment note', run: (t) => setNote(t) } });

  if (!r) return <><CoachHeader back="/coach" /><NotFound what="reassessment" back="/coach" /></>;
  const athlete = athleteById(db, r.athleteId)!;
  const area = areaById(db, r.areaId)!;
  const goal = db.goals.find((g) => g.areaId === area.id && g.status === 'active') ?? db.goals.find((g) => g.areaId === area.id);
  const notes = observationsFor(db, r.athleteId).filter((o) => o.areaId === area.id);
  const vids = db.videos.filter((v) => v.areaId === area.id && v.upload === 'uploaded');
  const done = r.status === 'submitted' || r.status === 'approved';
  const isHead = c.role === 'head_coach';
  const notMine = r.assigneeId !== c.coach?.id && !isHead;

  const errors = { note: touched && !note.trim() ? 'Record what you saw before choosing a status.' : '', outcome: touched && !outcome ? 'Choose a status.' : '' };

  const complete = () => {
    setTouched(true);
    if (!note.trim() || !outcome) return;
    // Head coaches create the milestone directly; a coach's milestone is a proposal until approval.
    const mid = isHead && milestone.trim() ? uid('m') : null;
    update((d) => {
      const x = d.reassessments.find((y) => y.id === r.id)!;
      Object.assign(x, { note: note.trim(), outcome, nextAction: next.trim(), status: isHead ? 'approved' : 'submitted', submittedAt: nowISO(), milestoneId: mid, proposedMilestone: !isHead && milestone.trim() ? milestone.trim() : undefined });
      if (mid) d.milestones.push({ id: mid, athleteId: r.athleteId, areaId: area.id, title: milestone.trim(), date: TODAY, visibleToFamily: true });
      if (isHead && outcome === 'achieved') { const a = d.areas.find((y) => y.id === area.id)!; a.status = 'achieved'; }
      if (next.trim() && goal) { const g = d.goals.find((y) => y.id === goal.id)!; g.nextAction = next.trim(); }
      if (!isHead) d.notifications.push({ id: uid('n'), personId: 'p-rohan', kind: 'reassessment', title: `Reassessment submitted: ${athlete.name}`, body: `${c.person.name} · ${OUTCOMES.find((o) => o.v === outcome)?.label}`, route: `/web/reassessments/${r.id}`, target: { type: 'reassessment', id: r.id }, createdAt: nowISO(), read: false });
    });
    audit(c.person.name, `${isHead ? 'Completed' : 'Submitted'} reassessment for ${athlete.name}: ${outcome}`, r.id);
    toast({ tone: 'ok', text: isHead ? 'Reassessment complete and approved.' : 'Submitted. Rohan Shah will review it on the web.' });
  };


  return (
    <>
      <CoachHeader back={`/coach/athlete/${athlete.id}`} backLabel={athlete.name.split(' ')[0]} />
      <CoachGate>
        <section className="m-section">
          <div className="row gap-2"><StatusBadge status={r.status} /><span className="xs muted">Due {fmtDate(r.due)} · {daysUntil(r.due) >= 0 ? `${daysUntil(r.due)} days` : 'overdue'}</span></div>
          <h1 className="display display-lg" style={{ marginTop: 6 }}>Reassess {athlete.name.split(' ')[0]}</h1>
          <p className="small muted">{area.title}</p>
        </section>

        {notMine && <div className="m-section"><Banner tone="warn">This reassessment is assigned to another coach. You can read it but not complete it.</Banner></div>}
        {done && (
          <div className="m-section">
            <Banner tone="ok">
              {r.status === 'approved' ? 'Completed and approved.' : 'Submitted. Waiting for head coach approval on the web.'} Outcome: <strong>{OUTCOMES.find((o) => o.v === r.outcome)?.label}</strong>.
            </Banner>
            <Link to={`/coach/athlete/${athlete.id}`} className="btn btn-block" style={{ marginTop: 12 }}>Back to {athlete.name.split(' ')[0]}</Link>
          </div>
        )}

        {!done && !notMine && (
          <>
            <button
              className="card card-link m-section row gap-3"
              data-theme="floodlit"
              style={{ background: 'var(--char-700)', borderColor: 'var(--char-400)', color: 'var(--grey-50)' }}
              onClick={() => h.openCompanion({ ask: 'Brief me on the evidence' })}
            >
              <span style={{ color: 'var(--hl)' }}><Seam state="insight" size={34} /></span>
              <span className="grow stack">
                <span className="strong">Evidence brief ready</span>
                <span className="xs" style={{ color: 'var(--grey-600)' }}>{notes.length} notes, {vids.length} clip{vids.length === 1 ? '' : 's'} and attendance since {fmtDate(area.openedAt)}. You decide the status.</span>
              </span>
            </button>

            <ol className="m-section stack gap-3" style={{ listStyle: 'none', padding: 0 }}>
              <Step n={1} title="Review the goal" codes="CM12.02">
                {goal ? (
                  <>
                    <p className="small"><Target size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {goal.title}</p>
                    <p className="xs muted">Target: {goal.target}</p>
                  </>
                ) : <p className="small muted">No goal set for this area.</p>}
                <label className="check-row small"><input type="checkbox" checked={!!reviewed.goal} onChange={(e) => setReviewed({ ...reviewed, goal: e.target.checked })} /> Reviewed</label>
              </Step>
              <Step n={2} title={`Review notes (${notes.length})`} codes="CM12.03">
                <ul className="list">
                  {notes.slice(0, 3).map((o) => <li key={o.id} className="small" style={{ padding: '6px 0' }}>“{o.text}” <span className="xs muted">{fmtDate(o.createdAt)}</span></li>)}
                </ul>
                {notes.length === 0 && <p className="small muted">No notes linked to this area.</p>}
                <label className="check-row small"><input type="checkbox" checked={!!reviewed.notes} onChange={(e) => setReviewed({ ...reviewed, notes: e.target.checked })} /> Reviewed</label>
              </Step>
              {vids.length > 0 && (
                <Step n={3} title="Review video" codes="CM12.04" optional>
                  <Link to={`/coach/video/${vids[0].id}`} aria-label={`Open ${vids[0].title}`}><Clip video={vids[0]} /></Link>
                  <Assumption code="CM12.04" />
                </Step>
              )}
              <Step n={vids.length ? 4 : 3} title="Record your reassessment note" codes="CM12.05">
                <Field id="ra-note" label="What you saw today" error={errors.note}>
                  <textarea id="ra-note" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={!!errors.note} />
                </Field>
              </Step>
              <Step n={vids.length ? 5 : 4} title="Choose status" codes="CM12.06">
                <fieldset style={{ border: 0, padding: 0, margin: 0 }} aria-invalid={!!errors.outcome}>
                  <legend className="sr-only">Status</legend>
                  <div className="stack gap-2">
                    {OUTCOMES.map((o) => (
                      <label key={o.v} className="card card-link row gap-3" style={{ padding: 12, borderColor: outcome === o.v ? 'var(--line-strong)' : undefined, background: outcome === o.v && o.v === 'achieved' ? 'var(--hl)' : undefined }}>
                        <input type="radio" name="outcome" checked={outcome === o.v} onChange={() => setOutcome(o.v)} style={{ accentColor: 'var(--role-700)', width: 18, height: 18 }} />
                        <span className="grow stack"><span className="small strong">{o.label}</span><span className="xs muted" style={{ color: outcome === o.v && o.v === 'achieved' ? 'var(--char-400)' : undefined }}>{o.desc}</span></span>
                      </label>
                    ))}
                  </div>
                  {errors.outcome && <p className="xs" style={{ color: 'var(--err)', marginTop: 6 }}>{errors.outcome}</p>}
                  <p className="xs muted" style={{ marginTop: 6 }}>Status words are a prototype assumption. The vocabulary is an open decision.</p>
                </fieldset>
              </Step>
              <Step n={vids.length ? 6 : 5} title="Set next action" codes="CM12.07" optional>
                <input aria-label="Next action" className="input" value={next} onChange={(e) => setNext(e.target.value)} placeholder={goal?.nextAction || 'e.g. Move to live bowling at 70%'} />
              </Step>
              <Step n={vids.length ? 7 : 6} title="Add a milestone" codes="CM12.08" optional>
                <input aria-label="Milestone" className="input" value={milestone} onChange={(e) => setMilestone(e.target.value)} placeholder="e.g. Still head on 8/10 drives" />
                {milestone && <p className="xs muted"><Trophy size={12} style={{ display: 'inline' }} /> {isHead ? 'Families see milestones once the report is published.' : 'Proposed: the head coach confirms it when approving.'}</p>}
              </Step>
            </ol>
            <div className="m-section stack gap-2">
              <Button variant="primary" size="lg" block icon={<Check size={16} />} onClick={complete}>{isHead ? 'Complete reassessment' : 'Submit for approval'}</Button>
              <AssumptionNote code="MW10.04" />
              <FlowCode codes="CM12.09" />
            </div>
          </>
        )}
      </CoachGate>
    </>
  );
}
