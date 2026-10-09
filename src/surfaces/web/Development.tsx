import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Target, Dumbbell, ClipboardList, Flag, Archive, Trophy } from 'lucide-react';
import { useStore, uid } from '../../store/store';
import { areaById, athleteById, coachById, fmtDate, observationsFor } from '../../store/selectors';
import { Assumption, Banner, Button, ConfirmDialog, FlowCode, StatusBadge, StateBlock } from '../../components/ui';
import { Clip } from '../../components/art';
import { useHuddleContext } from '../../huddle/Huddle';
import { PageHead } from './parts';
import { useWeb } from './useWeb';
import { tone } from '../../huddle/engine';

/** MW08.01–07 · HC02.05 */
export function DevelopmentPage() {
  const { areaId } = useParams();
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const nav = useNavigate();
  const [closing, setClosing] = useState<'achieved' | 'closed' | null>(null);
  const activeAreas = db.areas.filter((a) => a.status === 'active' || a.status === 'reopened');
  const sel = areaById(db, areaId) ?? activeAreas[0];
  const athlete = athleteById(db, sel?.athleteId);
  useHuddleContext(sel && athlete ? {
    surface: 'web', title: `Development · ${athlete.name} · ${sel.title}`, athleteId: athlete.id,
    reassessmentId: db.reassessments.find((r) => r.areaId === sel.id && r.status !== 'approved')?.id,
    prompts: ['Summarise recent sessions', 'Compare the last two sessions', ...(db.reassessments.some((r) => r.areaId === sel.id && r.status !== 'approved') ? ['Brief me on the evidence'] : [])],
  } : { surface: 'web', title: 'Development', prompts: ['What can you help with?'] });

  const goals = sel ? db.goals.filter((g) => g.areaId === sel.id) : [];
  const obs = sel ? observationsFor(db, sel.athleteId).filter((o) => o.areaId === sel.id) : [];
  const vids = sel ? db.videos.filter((v) => v.areaId === sel.id) : [];
  const openReass = sel ? db.reassessments.find((r) => r.areaId === sel.id && r.status !== 'approved') : undefined;

  return (
    <>
      <PageHead title="Development" sub="Active areas across the academy" codes="MW08.01–08.07" />
      <div className="w-split" style={{ gridTemplateColumns: 'minmax(260px, 0.8fr) minmax(0, 1.6fr)' }}>
        <nav aria-label="Active development areas">
          <ul className="list card card-flush">
            {activeAreas.map((a) => {
              const ath = athleteById(db, a.athleteId)!;
              const isSel = a.id === sel?.id;
              return (
                <li key={a.id}>
                  <Link to={`/web/development/${a.id}`} className="list-row" aria-current={isSel ? 'page' : undefined} style={isSel ? { background: 'var(--surface-2)', boxShadow: 'inset 4px 0 0 var(--forest-700)' } : undefined}>
                    <span className="grow stack">
                      <span className="small strong">{ath.name}</span>
                      <span className="xs muted">{a.title}</span>
                    </span>
                    {a.priority === 'high' && <span className="badge badge-lime">High</span>}
                    {a.status === 'reopened' && <StatusBadge status="reopened" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {!sel || !athlete ? <StateBlock kind="empty" title="No active development areas" /> : (
          <article className="stack gap-6">
            <header>
              <Link to={`/web/athletes/${athlete.id}`} className="small strong">{athlete.name}</Link>
              <h2 className="display display-lg" style={{ marginTop: 4 }}>{sel.title}</h2>
              <p className="small muted">Opened {fmtDate(sel.openedAt)} by {coachById(db, sel.ownerId)?.name} · {sel.priority} priority <Assumption code="CM06.05" /></p>
            </header>

            <section>
              <h3 className="h3 row gap-2" style={{ marginBottom: 8 }}><Target size={18} /> Goals <FlowCode codes="MW08.02" /></h3>
              {goals.length === 0 && <p className="small muted">No goal yet.</p>}
              {goals.map((g) => (
                <div key={g.id} className="card stack gap-2" style={{ marginBottom: 8 }}>
                  <div className="row between"><span className="strong">{g.title}</span><StatusBadge status={g.status === 'achieved' ? 'achieved' : 'active'} /></div>
                  <p className="small muted">Target: {g.target}</p>
                  {g.nextAction && <p className="small">Next action: {g.nextAction}</p>}
                  {g.drill ? (
                    <div className="card card-sunk small"><Dumbbell size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> <strong>{g.drill.name}</strong> · {g.drill.frequency}<p className="muted" style={{ marginTop: 4 }}>{g.drill.instructions}</p><FlowCode codes="MW08.03" /></div>
                  ) : <p className="xs muted">No drill assigned.</p>}
                  <p className="xs muted">Athlete-reported practice: {db.practiceLogs.filter((p) => p.goalId === g.id).length} sessions (not verified)</p>
                </div>
              ))}
            </section>

            <section>
              <h3 className="h3" style={{ marginBottom: 8 }}>Coach observations <FlowCode codes="MW08.04" /></h3>
              {obs.length === 0 ? <p className="small muted">No observations linked yet.</p> : (
                <ul className="list card card-flush">
                  {obs.map((o) => (
                    <li key={o.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                      <span className="grow stack gap-1">
                        <span className="small">{o.text}</span>
                        <span className="xs muted">{fmtDate(o.createdAt)} · {coachById(db, o.authorId)?.name}{o.aiDrafted ? ' · AI-drafted, coach-confirmed' : ''} · reads as {tone(o.text)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="h3" style={{ marginBottom: 8 }}>Video evidence <FlowCode codes="MW08.05" /> <Assumption code="CM12.04" /></h3>
              {vids.length === 0 ? <p className="small muted">No linked clips.</p> : (
                <div className="w-grid w-grid-2">{vids.map((v) => <div key={v.id} className="stack gap-1"><Clip video={v} /><span className="xs muted">{v.comments.length} comments · {v.share}</span></div>)}</div>
              )}
            </section>

            <section className="card" style={{ borderColor: 'var(--line-strong)' }}>
              <h3 className="h3" style={{ marginBottom: 4 }}>Decide follow-up <FlowCode codes="MW08.06" /></h3>
              <p className="small muted" style={{ marginBottom: 12 }}>Pick what happens next. Each option creates its own record.</p>
              {openReass && <div style={{ marginBottom: 12 }}><Banner tone="info">A reassessment is already {openReass.status === 'submitted' ? 'waiting for approval' : `scheduled for ${fmtDate(openReass.due)}`}.</Banner></div>}
              <div className="row gap-2 wrap">
                <Link className="btn btn-primary" to={`/web/tasks?new=1&athlete=${athlete.id}&area=${sel.id}`}><ClipboardList size={16} /> Assign coach task</Link>
                <Button icon={<Flag size={16} />} disabled={!!openReass} onClick={() => {
                  const rid = uid('r');
                  update((d) => d.reassessments.push({ id: rid, athleteId: athlete.id, areaId: sel.id, assigneeId: sel.ownerId, due: '2026-10-23', status: 'pending', outcome: null, note: '', nextAction: '', milestoneId: null }));
                  audit(w.actorName, `Requested reassessment for ${athlete.name}: ${sel.title}`, rid);
                  toast({ tone: 'ok', text: `Reassessment scheduled for 23 Oct and assigned to ${coachById(db, sel.ownerId)?.name}.` });
                  nav(`/web/reassessments/${rid}`);
                }}>Request reassessment</Button>
                <Button variant="ghost" icon={<Trophy size={16} />} onClick={() => setClosing('achieved')}>Close as achieved</Button>
                <Button variant="ghost" icon={<Archive size={16} />} onClick={() => setClosing('closed')}>Close without achieving</Button>
              </div>
              <FlowCode codes="MW08.07 · HC02.06" />
            </section>
          </article>
        )}
      </div>
      <ConfirmDialog
        open={!!closing}
        title={closing === 'achieved' ? 'Close this area as achieved?' : 'Close this area?'}
        body={closing === 'achieved' ? 'Athletes and parents see it as achieved on their timelines. It can be reopened later, and its history is kept.' : 'It leaves the current focus. Observations, clips and goals stay in history. It can be reopened later.'}
        confirmLabel={closing === 'achieved' ? 'Close as achieved' : 'Close area'}
        onCancel={() => setClosing(null)}
        onConfirm={() => {
          if (!sel) return;
          update((d) => { const x = d.areas.find((y) => y.id === sel.id)!; x.status = closing!; d.goals.forEach((g) => { if (g.areaId === sel.id && closing === 'achieved') g.status = 'achieved'; }); });
          audit(w.actorName, `Closed area “${sel.title}” as ${closing}`, sel.id);
          toast({ tone: 'ok', text: `Area closed${closing === 'achieved' ? ' as achieved' : ''}.` });
          setClosing(null);
          nav('/web/development');
        }}
      />
    </>
  );
}
