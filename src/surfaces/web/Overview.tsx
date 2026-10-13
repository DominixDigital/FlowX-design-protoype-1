import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Flag, Ban, CalendarX, Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { useStore } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { areaById, athleteById, attendanceFor, coachById, fmtDate, daysUntil, relDay } from '../../store/selectors';
import { Avatar, FlowCode, Metric, StatusBadge, StateBlock } from '../../components/ui';
import { useCompanionContext } from '../../companion/Companion';
import { PageHead } from './parts';
import { useWeb } from './useWeb';

/** MW06.01–07 */
export function Overview() {
  const { db } = useStore();
  const w = useWeb();
  useCompanionContext({ surface: 'web', title: `Overview · ${w.academy.name}`, prompts: ['What can you help with?'] });

  const active = db.athletes.filter((a) => a.status === 'active');
  const coaches = db.coaches.filter((c) => c.academyId === w.academy.id && c.status === 'active');
  const pendingR = db.reassessments.filter((r) => r.status !== 'approved');
  const openTasks = db.tasks.filter((t) => ['open', 'in_progress', 'blocked'].includes(t.status));

  // MW06.04 — every reason is a recorded fact, shown alongside the athlete.
  const attention: { id: string; athleteId: string; reason: string; icon: ReactNode; to: string }[] = [];
  for (const r of db.reassessments.filter((r) => r.status === 'pending' && daysUntil(r.due) <= 3))
    attention.push({ id: r.id, athleteId: r.athleteId, reason: `Reassessment ${daysUntil(r.due) < 0 ? 'overdue' : `due ${relDay(r.due).toLowerCase()}`}`, icon: <Flag size={16} />, to: `/web/reassessments/${r.id}` });
  for (const t of db.tasks.filter((t) => t.status === 'blocked'))
    attention.push({ id: t.id, athleteId: t.athleteId, reason: `Task blocked: ${t.blockedReason}`, icon: <Ban size={16} />, to: `/web/tasks/${t.id}` });
  for (const a of active) {
    const att = attendanceFor(db, a.id);
    if (att.total >= 3 && att.rate !== null && att.rate < 75) attention.push({ id: `att-${a.id}`, athleteId: a.id, reason: `Attended ${att.present} of last ${att.total} sessions`, icon: <CalendarX size={16} />, to: `/web/athletes/${a.id}/attendance` });
  }
  for (const a of db.athletes.filter((x) => x.status === 'duplicate_suspected'))
    attention.push({ id: `dup-${a.id}`, athleteId: a.id, reason: `Possible duplicate of ${athleteById(db, a.duplicateOf)?.name}`, icon: <Copy size={16} />, to: '/web/athletes?status=duplicate_suspected' });

  const todaySessions = db.sessions.filter((s) => s.date === TODAY);
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${TODAY}T12:00`));

  return (
    <>
      <PageHead title={`Good afternoon, ${w.person.name.split(' ')[0]}`} sub={day} codes="MW06.01" />

      <section className="w-grid w-grid-4" aria-label="Academy overview">
        <Link to="/web/athletes" className="card-link" style={{ textDecoration: 'none' }}><Metric label="Active athletes" value={active.length} basis={`${db.batches.filter((b) => b.status === 'active').length} active batches`} code="MW06.02" /></Link>
        <Link to="/web/staff" className="card-link" style={{ textDecoration: 'none' }}><Metric label="Coaching staff" value={coaches.length} basis="active coaches and assistants" code="MW06.03" /></Link>
        <Link to="/web/reassessments" className="card-link" style={{ textDecoration: 'none' }}><Metric label="Reassessments open" value={pendingR.length} basis={`${pendingR.filter((r) => r.status === 'submitted').length} waiting for your approval`} code="MW06.05" accent={pendingR.some((r) => r.status === 'submitted')} /></Link>
        <Link to="/web/tasks" className="card-link" style={{ textDecoration: 'none' }}><Metric label="Open coach tasks" value={openTasks.length} basis={`${openTasks.filter((t) => t.status === 'blocked').length} blocked`} code="MW06.06" /></Link>
      </section>

      <div className="w-split" style={{ marginTop: 32 }}>
        <section aria-labelledby="att-h">
          <div className="section-head">
            <h2 id="att-h" className="h3 row gap-2"><AlertTriangle size={18} color="var(--warn)" aria-hidden /> Needs attention</h2>
            <FlowCode codes="MW06.04" />
          </div>
          {attention.length === 0 ? <StateBlock kind="empty" title="Nothing needs attention" body="Overdue reassessments, blocked tasks, low attendance and possible duplicates show up here." /> : (
            <ul className="list card card-flush">
              {attention.map((x) => {
                const a = athleteById(db, x.athleteId)!;
                return (
                  <li key={x.id}>
                    <Link to={x.to} className="list-row">
                      <Avatar name={a.name} size="sm" muted={a.status !== 'active'} />
                      <span className="grow stack"><span className="small strong">{a.name}</span><span className="xs muted row gap-1">{x.icon} {x.reason}</span></span>
                      <ChevronRight size={16} aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="section-head" style={{ marginTop: 32 }}>
            <h2 className="h3">Coaches</h2>
            <FlowCode codes="MW06.03" />
          </div>
          <div className="card card-flush scroll-shadow" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Coach</th><th title="Primary athletes">Athletes</th><th>Open tasks</th><th>Reassessments</th><th>Status</th></tr></thead>
              <tbody>
                {db.coaches.filter((c) => c.academyId === w.academy.id).map((c) => (
                  <tr key={c.id}>
                    <td><span className="row gap-2"><Avatar name={c.name} size="sm" muted={c.status !== 'active'} /> <span className="strong">{c.name}</span></span></td>
                    <td>{db.athletes.filter((a) => a.primaryCoachId === c.id && a.status === 'active').length}</td>
                    <td>{db.tasks.filter((t) => t.assigneeId === c.id && ['open', 'in_progress', 'blocked'].includes(t.status)).length}</td>
                    <td>{db.reassessments.filter((r) => r.assigneeId === c.id && r.status !== 'approved').length}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="stack gap-6">
          <section>
            <div className="section-head"><h2 className="h3">Today</h2><span className="xs muted">{todaySessions.length} sessions</span></div>
            <ul className="list card card-flush">
              {todaySessions.map((s) => {
                const marked = Object.values(s.attendance).filter((m) => m !== 'unmarked').length;
                return (
                  <li key={s.id} className="list-row">
                    <span className="num" style={{ fontSize: '1.4rem', width: 56 }}>{s.start}</span>
                    <span className="grow stack"><span className="small strong">{s.title}</span><span className="xs muted">{coachById(db, s.coachId)?.name} · {marked}/{Object.keys(s.attendance).length} marked</span></span>
                    <StatusBadge status={s.status} label={s.status === 'in_progress' ? 'Live' : undefined} />
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <div className="section-head"><h2 className="h3">Pending reassessments</h2><FlowCode codes="MW06.05" /></div>
            <ul className="list card card-flush">
              {pendingR.map((r) => (
                <li key={r.id}>
                  <Link to={`/web/reassessments/${r.id}`} className="list-row">
                    <span className="grow stack"><span className="small strong">{athleteById(db, r.athleteId)?.name}</span><span className="xs muted">{areaById(db, r.areaId)?.title}</span></span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <div className="section-head"><h2 className="h3">Parent reports</h2><FlowCode codes="MW06.07" /></div>
            <ul className="list card card-flush">
              {db.reports.map((r) => (
                <li key={r.id}>
                  <Link to={`/web/reports/${r.id}`} className="list-row">
                    <span className="grow stack"><span className="small strong">{athleteById(db, r.athleteId)?.name}</span><span className="xs muted">{r.period}{r.publishedAt ? ` · published ${fmtDate(r.publishedAt)}` : ''}</span></span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/web/reports" className="small strong" style={{ display: 'inline-block', marginTop: 8 }}>Start a report</Link>
          </section>
        </aside>
      </div>
    </>
  );
}
