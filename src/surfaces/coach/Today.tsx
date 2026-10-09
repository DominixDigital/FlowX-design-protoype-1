import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Flag, ClipboardList, ArrowRightLeft, Bell, PlayCircle } from 'lucide-react';
import { useStore } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { athleteById, areaById, batchById, fmtDate, locationName, relDay, daysUntil } from '../../store/selectors';
import { StatusBadge, Banner, StateBlock, FlowCode } from '../../components/ui';
import { useHuddleContext } from '../../huddle/Huddle';
import { CoachHeader, CoachGate } from './parts';
import { useCoach } from './useCoach';

export function Today() {
  const { db } = useStore();
  const c = useCoach();
  useHuddleContext({ surface: 'coach', title: `Today’s work · ${c.academy.name}`, prompts: ['What can you help with?'] });

  const mySessions = db.sessions
    .filter((s) => s.date === TODAY && s.status !== 'cancelled')
    .filter((s) => {
      if (!c.coach) return false;
      if (c.role === 'head_coach') return true;
      const b = batchById(db, s.batchId);
      return s.coachId === c.coach.id || b?.assistantIds.includes(c.coach.id);
    })
    .filter((s) => batchById(db, s.batchId)?.academyId === c.academy.id)
    .sort((a, b) => a.start.localeCompare(b.start));
  const inProgress = db.sessions.find((s) => s.status === 'in_progress' && s.coachId === c.coach?.id);
  const reassess = db.reassessments.filter((r) => r.assigneeId === c.coach?.id && (r.status === 'pending' || r.status === 'in_progress'));
  const tasks = db.tasks.filter((t) => t.assigneeId === c.coach?.id && ['open', 'in_progress', 'blocked'].includes(t.status));
  const handovers = db.handovers.filter((h) => h.toId === c.coach?.id && h.status !== 'converted');
  const unread = db.notifications.filter((n) => n.personId === c.person.id && !n.read);

  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${TODAY}T12:00`));

  return (
    <>
      <CoachHeader
        title={
          <Link to="/coach/context" className="row gap-2" style={{ textDecoration: 'none' }} aria-label={`Academy and role: ${c.academy.name}, ${c.role ?? 'none'}. Change`}>
            <span className="avatar avatar-sm">{c.person.name.split(' ').map((x) => x[0]).join('')}</span>
            <span className="stack" style={{ lineHeight: 1.15 }}>
              <span className="small strong">{c.academy.name}</span>
              <span className="xs muted" style={{ textTransform: 'capitalize' }}>{c.role?.replace('_', ' ')}{c.membership?.expiresOn ? ` · access until ${fmtDate(c.membership.expiresOn)}` : ''}</span>
            </span>
          </Link>
        }
      />
      <CoachGate>
        <section className="m-section">
          <p className="small muted">{day}</p>
          <h1 className="display display-xl" style={{ marginTop: 4 }}>
            {mySessions.length ? <>{mySessions.length} session{mySessions.length > 1 ? 's' : ''}<br />today</> : 'No sessions today'}
          </h1>
          <FlowCode codes="CM01.04 · CM02.01" />
        </section>

        {inProgress && (
          <div className="m-section">
            <Banner tone="warn" action={<Link className="btn btn-sm" to={`/coach/session/${inProgress.id}`}>Resume</Link>}>
              <strong>{inProgress.title}</strong> is still in progress. Pick up where you left off. <FlowCode codes="CM01.05" />
            </Banner>
          </div>
        )}

        <section className="m-section stack gap-3" aria-label="Today’s sessions">
          {mySessions.length === 0 && (
            <StateBlock kind="empty" title="Nothing scheduled" body="When the academy schedules a session for your batches, it appears here. You can still capture notes from the + button." />
          )}
          {mySessions.map((s) => {
            const batch = batchById(db, s.batchId)!;
            const n = Object.keys(s.attendance).length;
            const marked = Object.values(s.attendance).filter((m) => m !== 'unmarked').length;
            return (
              <Link key={s.id} to={`/coach/session/${s.id}`} className="card card-link" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="row" style={{ alignItems: 'stretch' }}>
                  <div style={{ width: 84, padding: '14px 0 14px 16px', borderRight: '1px solid var(--line)' }}>
                    <div className="num" style={{ fontSize: '2rem' }}>{s.start}</div>
                    <div className="xs muted">to {s.end}</div>
                  </div>
                  <div className="grow stack gap-1" style={{ padding: '14px 16px' }}>
                    <div className="row between gap-2">
                      <span className="xs strong" style={{ color: 'var(--forest-600)' }}>{batch.name}</span>
                      <StatusBadge status={s.status === 'in_progress' ? 'in_progress' : s.status} label={s.status === 'in_progress' ? 'Live' : undefined} />
                    </div>
                    <span className="strong">{s.title}</span>
                    <span className="xs muted row gap-1"><MapPin size={12} /> {locationName(db, s.locationId)} · {marked}/{n} marked</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {(reassess.length > 0 || tasks.length > 0 || handovers.length > 0) && (
          <section className="m-section">
            <h2 className="h3" style={{ marginBottom: 8 }}>Needs you</h2>
            <ul className="list card card-flush">
              {reassess.map((r) => (
                <li key={r.id}>
                  <Link to={`/coach/reassess/${r.id}`} className="list-row">
                    <Flag size={18} color="var(--forest-600)" aria-hidden />
                    <span className="grow stack">
                      <span className="small strong">Reassess {athleteById(db, r.athleteId)?.name}</span>
                      <span className="xs muted">{areaById(db, r.areaId)?.title}</span>
                    </span>
                    <span className="badge badge-lime">{relDay(r.due)}</span>
                  </Link>
                </li>
              ))}
              {tasks.map((t) => (
                <li key={t.id}>
                  <Link to={`/coach/tasks/${t.id}`} className="list-row">
                    <ClipboardList size={18} color="var(--forest-600)" aria-hidden />
                    <span className="grow stack">
                      <span className="small strong">{t.title}</span>
                      <span className="xs muted">{athleteById(db, t.athleteId)?.name} · due {daysUntil(t.due) === 0 ? 'today' : fmtDate(t.due)}</span>
                    </span>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
              {handovers.map((h) => (
                <li key={h.id}>
                  <Link to={`/coach/handover/${h.id}`} className="list-row">
                    <ArrowRightLeft size={18} color="var(--forest-600)" aria-hidden />
                    <span className="grow stack">
                      <span className="small strong">Handover: {athleteById(db, h.athleteId)?.name}</span>
                      <span className="xs muted">From {db.coaches.find((x) => x.id === h.fromId)?.name}</span>
                    </span>
                    <ChevronRight size={16} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {unread.length > 0 && (
          <section className="m-section">
            <h2 className="h3" style={{ marginBottom: 8 }}>Notifications</h2>
            <ul className="list card card-flush">
              {unread.map((n) => (
                <li key={n.id}>
                  <Link to={n.route} className="list-row">
                    <Bell size={18} aria-hidden />
                    <span className="grow stack"><span className="small strong">{n.title}</span><span className="xs muted">{n.body}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="m-section">
          <Link to="/coach/sessions" className="row gap-2 small strong" style={{ textDecoration: 'none' }}>
            <PlayCircle size={16} /> All sessions and history
          </Link>
        </section>
      </CoachGate>
    </>
  );
}
