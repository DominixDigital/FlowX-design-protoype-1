import { CloudOff, Wifi, RefreshCw, AlertTriangle, Check, Smartphone, Server } from 'lucide-react';
import { useStore } from '../../store/store';
import { athleteById } from '../../store/selectors';
import { Banner, Button, FlowCode, StatusBadge, StateBlock } from '../../components/ui';
import { useHuddleContext } from '../../huddle/Huddle';
import { CoachHeader } from './parts';

/** CM14.01–09 · XS04 · XS07.S01/S02/S05/S09 */
export function SyncQueue() {
  const { db, sim, setSim, retry, resolveConflict } = useStore();
  useHuddleContext({ surface: 'coach', title: 'Sync queue', prompts: ['What can you help with?'] });
  const queue = db.queue;
  const uploads = db.videos.filter((v) => v.upload !== 'uploaded' || v.processing === 'processing');
  const conflicts = queue.filter((q) => q.status === 'conflict');
  const rest = queue.filter((q) => q.status !== 'conflict');
  const clear = queue.length === 0 && uploads.length === 0;

  return (
    <>
      <CoachHeader back="/coach" backLabel="Today" title="Sync" />
      <section className="m-section">
        <h1 className="display display-lg">{!sim.online ? 'Working offline' : clear ? 'All synced' : 'Syncing'}</h1>
        <FlowCode codes="CM14.01–14.09" />
      </section>

      <section className="m-section">
        {sim.online ? (
          <Banner tone={clear ? 'ok' : 'info'} action={<Button size="sm" onClick={() => setSim({ online: false })}>Go offline</Button>}>
            <Wifi size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Connected. {clear ? 'Everything you captured is on the server.' : 'Changes are sending in order.'}
          </Banner>
        ) : (
          <Banner tone="warn" action={<Button size="sm" variant="primary" onClick={() => setSim({ online: true })}>Reconnect</Button>}>
            <CloudOff size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> No connection. Today’s sessions and rosters are cached. Attendance, notes and clips save here and sync when you reconnect.
          </Banner>
        )}
        <p className="xs muted" style={{ marginTop: 6 }}>Connection is simulated. Use the switch here or the prototype controls.</p>
      </section>

      {conflicts.map((q) => {
        const name = athleteById(db, q.conflict?.field)?.name ?? q.conflict?.field;
        return (
          <section key={q.id} className="m-section card" style={{ borderColor: 'var(--err)', borderWidth: 1.5 }} aria-labelledby={`cf-${q.id}`}>
            <h2 id={`cf-${q.id}`} className="h3 row gap-2"><AlertTriangle size={18} color="var(--err)" /> Choose which version to keep</h2>
            <p className="small muted" style={{ marginTop: 4 }}>{q.label}: <strong>{name}</strong> was changed on the server while you were offline. Nothing is overwritten until you choose. <FlowCode codes="CM14.08 · XS04.S01" /></p>
            <div className="w-grid w-grid-2" style={{ marginTop: 12, gap: 8 }}>
              <div className="card card-sunk stack gap-1">
                <span className="xs strong row gap-1"><Smartphone size={12} /> Your change</span>
                <span className="num" style={{ fontSize: '1.8rem', textTransform: 'capitalize' }}>{q.conflict?.mine}</span>
                <span className="xs muted">This device, just now</span>
              </div>
              <div className="card card-sunk stack gap-1">
                <span className="xs strong row gap-1"><Server size={12} /> Server version</span>
                <span className="num" style={{ fontSize: '1.8rem', textTransform: 'capitalize' }}>{q.conflict?.theirs}</span>
                <span className="xs muted">{q.conflict?.theirsBy}</span>
              </div>
            </div>
            <div className="row gap-2" style={{ marginTop: 12 }}>
              <Button variant="primary" className="grow" onClick={() => resolveConflict(q.id, 'mine')}>Keep mine</Button>
              <Button className="grow" onClick={() => resolveConflict(q.id, 'theirs')}>Keep server</Button>
            </div>
          </section>
        );
      })}

      <section className="m-section">
        <h2 className="h3" style={{ marginBottom: 8 }}>Queue</h2>
        {rest.length === 0 && uploads.length === 0 && conflicts.length === 0 && (
          <StateBlock kind="empty" title="Nothing waiting" body="Anything you capture while offline shows here until it reaches the server." />
        )}
        <ul className="list card card-flush">
          {rest.map((q) => (
            <li key={q.id} className="list-row" style={{ alignItems: 'flex-start' }}>
              <span className="grow stack gap-1">
                <span className="small strong">{q.label}</span>
                {q.error && <span className="xs" style={{ color: 'var(--err)' }}>{q.error}</span>}
                <span className="xs muted">Attempts: {q.attempts} · key {q.idempotencyKey.slice(-6)}</span>
              </span>
              <StatusBadge status={q.status} />
              {q.status === 'failed' && sim.online && <Button size="sm" icon={<RefreshCw size={12} />} onClick={() => retry(q.id)}>Retry</Button>}
            </li>
          ))}
          {uploads.map((v) => (
            <li key={v.id} className="list-row">
              <span className="grow stack gap-1">
                <span className="small strong">Clip · {v.title}</span>
                {v.upload === 'uploading' && <span className="progress"><span style={{ width: `${v.progress}%` }} /></span>}
              </span>
              <StatusBadge status={v.upload === 'uploaded' ? v.processing : v.upload} />
            </li>
          ))}
        </ul>
        {rest.some((q) => q.status === 'failed') && (
          <p className="xs muted" style={{ marginTop: 6 }}>Retry is safe. Each item carries the same key, so the server never saves it twice. <FlowCode codes="XS07.S01 · XS07.S04" /></p>
        )}
      </section>

      {clear && sim.online && (
        <section className="m-section"><Banner tone="ok"><Check size={14} style={{ display: 'inline' }} /> Sync complete. <FlowCode codes="CM14.09" /></Banner></section>
      )}
    </>
  );
}
