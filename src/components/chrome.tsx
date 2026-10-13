import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Check, CloudOff, AlertTriangle, RefreshCw, SlidersHorizontal, X, ChevronLeft } from 'lucide-react';
import { useStore } from '../store/store';
import type { Surface } from '../data/types';
import { geminiEnabled, setGeminiEnabled } from '../companion/gemini';

/** ditdit wordmark: the tittles of the two i's are the brand's two dots (Morse "dit dit"). */
export function Wordmark({ to = '/', size = 26 }: { to?: string; size?: number }) {
  return (
    <Link to={to} className="wordmark" aria-label="ditdit home" style={{ fontSize: size }}>
      <span aria-hidden>d<span className="wm-i">ı<i /></span>td<span className="wm-i">ı<i /></span>t</span>
    </Link>
  );
}

/** Always-visible sync state on mobile (CM14, build brief interaction requirements). */
export function SyncPill({ to }: { to: string }) {
  const { db, sim } = useStore();
  const conflicts = db.queue.filter((q) => q.status === 'conflict').length;
  const failed = db.queue.filter((q) => q.status === 'failed').length;
  const pending = db.queue.filter((q) => q.status === 'queued' || q.status === 'sending').length;
  let state = 'ok';
  let label: ReactNode = <><Check size={12} /> Synced</>;
  if (!sim.online) { state = 'offline'; label = <><CloudOff size={12} /> Offline{pending ? ` · ${pending} queued` : ''}</>; }
  else if (conflicts) { state = 'conflict'; label = <><AlertTriangle size={12} /> {conflicts} conflict{conflicts > 1 ? 's' : ''}</>; }
  else if (failed) { state = 'failed'; label = <><AlertTriangle size={12} /> {failed} failed</>; }
  else if (pending) { state = 'pending'; label = <><RefreshCw size={12} /> Syncing {pending}</>; }
  return (
    <Link to={to} className="sync-pill" data-state={state} aria-label={`Sync status: ${typeof label === 'string' ? label : state}. Open sync queue`}>
      {label}
    </Link>
  );
}

export function BackLink({ to, label = 'Back' }: { to: string; label?: string }) {
  return (
    <Link to={to} className="m-back">
      <ChevronLeft size={18} aria-hidden /> {label}
    </Link>
  );
}

export interface PersonaOption { personId: string; label: string; sub: string }

/** Device frame for mobile surfaces with prototype context beside it. */
export function PhoneStage({
  surface, title, personas, journeys, children,
}: {
  surface: Surface;
  title: string;
  personas: PersonaOption[];
  journeys: { label: string; to: string; codes: string }[];
  children: ReactNode;
}) {
  const { personas: current, setPersona, db } = useStore();
  const person = db.people.find((p) => p.id === current[surface].personId);
  return (
    <div className="stage">
      <aside className="stage-info" aria-label="Prototype context">
        <Wordmark />
        <div>
          <p className="display display-lg">{title}</p>
          <p className="small" style={{ color: 'var(--grey-600)', marginTop: 8 }}>Phone surface · shared data with every other ditdit app</p>
        </div>
        <div className="field">
          <label htmlFor={`persona-${surface}`} style={{ color: 'var(--grey-50)' }}>Signed in as</label>
          <select
            id={`persona-${surface}`}
            className="select"
            value={current[surface].personId}
            onChange={(e) => {
              const p = db.people.find((x) => x.id === e.target.value)!;
              const m = p.memberships.find((x) => x.status === 'active') ?? p.memberships[0];
              setPersona(surface, { personId: p.id, academyId: m.academyId });
            }}
          >
            {personas.map((p) => <option key={p.personId} value={p.personId}>{p.label} — {p.sub}</option>)}
          </select>
          {person && person.memberships.length > 1 && <span className="xs" style={{ color: 'var(--grey-600)' }}>This person has {person.memberships.length} roles across academies.</span>}
        </div>
        <nav aria-label="Journeys">
          <p className="small strong" style={{ marginBottom: 8 }}>Jump to a journey</p>
          <ul className="list" style={{ borderTop: '1px solid var(--char-400)' }}>
            {journeys.map((j) => (
              <li key={j.to} style={{ borderColor: 'var(--char-400)' }}>
                <Link to={j.to} className="list-row" style={{ minHeight: 44, padding: '8px 0', color: 'var(--grey-50)' }}>
                  <span className="grow small">{j.label}</span>
                  <span className="flow-code" style={{ color: 'var(--grey-600)' }}>{j.codes}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link to="/" className="small">← All surfaces</Link>
      </aside>
      <div className="phone">
        <div className="phone-screen">
          <div className="phone-notch" aria-hidden />
          {children}
        </div>
      </div>
      <ProtoControls />
    </div>
  );
}

export function StatusBar() {
  return (
    <div className="m-status" aria-hidden>
      <span>16:12</span>
      <span>5G ▮▮▮</span>
    </div>
  );
}

export function MobileNav({ items }: { items: { to: string; label: string; icon: ReactNode; capture?: boolean; end?: boolean }[] }) {
  return (
    <nav className="m-nav" aria-label="Main">
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          className={i.capture ? 'capture' : undefined}
          aria-label={i.capture ? i.label : undefined}
        >
          {i.icon}
          {!i.capture && <span>{i.label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

/** Prototype controls: trigger offline, failures, uncertain responses, conflicts and reset. */
export function ProtoControls() {
  const { sim, setSim, reset, db, update, toast } = useStore();
  const [open, setOpen] = useState(false);
  const [gem, setGem] = useState(geminiEnabled);
  return (
    <>
      <button className="proto-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="proto-panel" aria-label="Prototype controls">
        <SlidersHorizontal size={14} aria-hidden /> <span>Prototype controls</span>
      </button>
      {open && (
        <div className="proto-panel" id="proto-panel" role="region" aria-label="Prototype controls" data-theme="chalk">
          <div className="row between" style={{ marginBottom: 8 }}>
            <strong>Prototype controls</strong>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button>
          </div>
          <p className="xs muted" style={{ marginBottom: 8 }}>These simulate network and server conditions so every recovery path can be tried. They are not part of the product.</p>
          <label className="switch">Network online <input type="checkbox" checked={sim.online} onChange={(e) => setSim({ online: e.target.checked })} /></label>
          <label className="switch">Slow network <input type="checkbox" checked={sim.slow} onChange={(e) => setSim({ slow: e.target.checked })} /></label>
          <label className="switch">Fail the next save <input type="checkbox" checked={sim.failNextSave} onChange={(e) => setSim({ failNextSave: e.target.checked })} /></label>
          <label className="switch">Lose the next confirmation <input type="checkbox" checked={sim.uncertainNext} onChange={(e) => setSim({ uncertainNext: e.target.checked })} /></label>
          <label className="switch">Gemini for open questions <input type="checkbox" checked={gem} onChange={(e) => { setGem(e.target.checked); setGeminiEnabled(e.target.checked); }} /></label>
          <label className="switch">Conflict on next attendance sync <input type="checkbox" checked={sim.conflictOnSync} onChange={(e) => setSim({ conflictOnSync: e.target.checked })} /></label>
          <hr className="divider" style={{ margin: '8px 0' }} />
          <p className="xs strong" style={{ margin: '8px 0 4px' }}>Server-side events</p>
          <div className="stack gap-2">
            <button className="btn btn-sm" onClick={() => {
              update((d) => { const t = d.tasks.find((x) => x.id === 't-101'); if (t) { t.status = 'cancelled'; t.version += 1; } });
              toast({ tone: 'info', text: 'Server: task t-101 was cancelled by the head coach.' });
            }}>Cancel Kabir’s throwdown task (XS07.S08)</button>
            <button className="btn btn-sm" onClick={() => {
              update((d) => { const m = d.people.find((p) => p.id === 'p-arjun')?.memberships[0]; if (m) m.status = m.status === 'active' ? 'removed' : 'active'; });
              toast({ tone: 'info', text: `Server: Arjun Patel’s access ${db.people.find((p) => p.id === 'p-arjun')?.memberships[0].status === 'active' ? 'removed' : 'restored'}.` });
            }}>Toggle Arjun’s academy access (XS01.06)</button>
            <button className="btn btn-sm" onClick={() => {
              update((d) => { const f = d.feedback.find((x) => x.id === 'f-1'); if (f) f.status = f.status === 'published' ? 'withdrawn' : 'published'; });
              toast({ tone: 'info', text: 'Server: Tara’s 0:19 feedback toggled withdrawn/published.' });
            }}>Withdraw / restore Tara’s feedback (AT04.06)</button>
            <button className="btn btn-sm" onClick={() => {
              update((d) => { const c = d.competitions.find((x) => x.id === 'comp-1'); if (c) { c.status = 'changed'; c.date = '2026-10-19'; c.change = 'Moved from 18 Oct to 19 Oct (rain forecast).'; } });
              toast({ tone: 'info', text: 'Server: U16 Cup round 2 moved by a day.' });
            }}>Move the U16 Cup fixture (PA05.05)</button>
            <button className="btn btn-sm" onClick={() => {
              update((d) => { const t = d.athletes.find((x) => x.id === 'a-tara'); if (t) t.guardianIds = t.guardianIds.includes('p-maya') ? t.guardianIds.filter((g) => g !== 'p-maya') : [...t.guardianIds, 'p-maya']; });
              toast({ tone: 'info', text: 'Server: Maya’s guardian link to Tara toggled.' });
            }}>Remove / restore Maya as Tara’s guardian (PA01.06)</button>
          </div>
          <hr className="divider" style={{ margin: '12px 0' }} />
          <button className="btn btn-sm btn-danger" onClick={() => { reset(); toast({ tone: 'ok', text: 'Demo data reset.' }); }}>Reset all demo data</button>
        </div>
      )}
    </>
  );
}
