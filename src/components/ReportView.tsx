import { Trophy, CalendarCheck, Medal, FileClock, Ban } from 'lucide-react';
import type { Report } from '../data/types';
import type { DB } from '../store/store';
import { athleteById, attendanceFor, fmtDate } from '../store/selectors';
import { Clip, PitchArt } from './art';
import { StatusBadge } from './ui';

/** The parent-facing report. One component, used by the web preview (MW11.08) and the Parent App (PA04.03),
 *  so what the coach approves is exactly what the parent reads. */
export function ReportView({ db, report, onPlayVideo }: { db: DB; report: Report; onPlayVideo?: () => void }) {
  const a = athleteById(db, report.athleteId)!;
  const first = a.name.split(' ')[0];
  const att = attendanceFor(db, a.id);
  const ms = report.milestoneId ? db.milestones.find((m) => m.id === report.milestoneId) : undefined;
  const comp = report.competitionId ? db.competitions.find((c) => c.id === report.competitionId) : undefined;
  const vid = report.videoId ? db.videos.find((v) => v.id === report.videoId) : undefined;

  if (report.status === 'withdrawn') {
    return (
      <div className="state state-warn">
        <span className="state-icon"><Ban size={20} /></span>
        <h3 className="h3">This report was withdrawn</h3>
        <p className="small muted">The academy withdrew {first}’s {report.period} report. If you have questions, contact the head coach.</p>
      </div>
    );
  }

  return (
    <article className="stack gap-4" aria-label={`${first}’s ${report.period} report`}>
      <header className="clip" data-theme="matchday" style={{ aspectRatio: 'auto', minHeight: 190, borderRadius: 'var(--r-lg)', padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <PitchArt tone="court" />
        <p className="xs" style={{ color: 'var(--court-300)', fontWeight: 650 }}>Progress report · {report.period}</p>
        <h2 className="display" style={{ fontSize: '2.75rem', color: '#fff' }}>{a.name}</h2>
      </header>

      {report.status === 'corrected' && (
        <div className="banner banner-warn" role="status">
          <FileClock size={16} />
          <span><strong>Corrected · version {report.version}.</strong> {report.correctionNote}</span>
        </div>
      )}

      <section>
        <p className="xs strong muted">Current focus</p>
        <p className="display display-md" style={{ marginTop: 4 }}><span className="mark">{report.focusSummary || 'Not set'}</span></p>
      </section>

      {report.comment && (
        <section className="card" style={{ borderLeft: '4px solid var(--forest-700)' }}>
          <p className="xs strong muted">From the coach</p>
          <p style={{ marginTop: 6 }}>{report.comment}</p>
        </section>
      )}

      <div className="w-grid w-grid-2" style={{ gap: 8 }}>
        {report.includes.attendance && (
          <div className="metric">
            <span className="metric-label row gap-1"><CalendarCheck size={14} /> Attendance</span>
            <span className="num">{att.total ? `${att.present}/${att.total}` : '—'}</span>
            <span className="metric-basis">recorded sessions this period</span>
          </div>
        )}
        {report.includes.milestone && ms && (
          <div className="metric" style={{ background: 'var(--lime-400)', borderColor: 'var(--lime-400)', color: 'var(--ink-950)' }}>
            <span className="metric-label row gap-1"><Trophy size={14} /> Milestone</span>
            <span className="small strong">{ms.title}</span>
            <span className="metric-basis" style={{ color: 'var(--ink-700)' }}>{fmtDate(ms.date, { day: 'numeric', month: 'long' })}</span>
          </div>
        )}
      </div>

      {report.includes.competition && comp && (
        <section className="card row gap-3" style={{ alignItems: 'flex-start' }}>
          <Medal size={20} color="var(--court-600)" />
          <div className="grow">
            <p className="small strong">{comp.name}</p>
            <p className="xs muted">{fmtDate(comp.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {comp.venue}</p>
            {comp.update && <p className="small" style={{ marginTop: 4 }}>{comp.update}</p>}
            {comp.change && <p className="small" style={{ marginTop: 4, color: 'var(--warn)' }}>Changed: {comp.change}</p>}
          </div>
          <StatusBadge status={comp.status === 'completed' ? 'completed' : comp.status === 'changed' ? 'corrected' : 'scheduled'} label={comp.status === 'changed' ? 'Changed' : comp.status === 'completed' ? 'Played' : 'Upcoming'} />
        </section>
      )}

      {report.includes.video && vid && (
        <section className="stack gap-2">
          <p className="xs strong muted">Shared clip</p>
          {vid.share === 'withdrawn' ? <p className="small muted">This clip was withdrawn by the coach.</p> : <Clip video={vid} onPlay={onPlayVideo} />}
        </section>
      )}

      <p className="xs muted">Published {report.publishedAt ? fmtDate(report.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' }) : '— not yet published'} · approved by the head coach</p>
    </article>
  );
}
