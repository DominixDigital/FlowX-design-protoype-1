import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Users, User, Palette } from 'lucide-react';
import { useStore } from '../../store/store';
import type { Surface } from '../../data/types';
import { Wordmark, ProtoControls } from '../../components/chrome';
import { Seam } from '../../components/Seam';

const SURFACES: { surface: Surface; name: string; who: string; icon: JSX.Element; home: string; personas: { id: string; label: string; academy?: string }[] }[] = [
  {
    surface: 'web', name: 'Management Web', who: 'Owner, admin, head coach — configure, supervise, publish', icon: <LayoutDashboard size={22} />, home: '/web',
    personas: [{ id: 'p-rohan', label: 'Rohan Shah · head coach' }, { id: 'p-asha', label: 'Asha Mehta · owner' }],
  },
  {
    surface: 'coach', name: 'Coach Mobile', who: 'Coaches and assistants courtside — sessions, capture, offline', icon: <Smartphone size={22} />, home: '/coach',
    personas: [{ id: 'p-neha', label: 'Neha Rao · coach, U16 Elite' }, { id: 'p-rohan', label: 'Rohan Shah · head coach' }, { id: 'p-arjun', label: 'Arjun Patel · temporary assistant' }, { id: 'p-sanjay', label: 'Sanjay Menon · coach + parent', academy: 'ac-harbour' }],
  },
  {
    surface: 'parent', name: 'Parent App', who: 'Guardians — published progress, reports, schedule', icon: <Users size={22} />, home: '/parent',
    personas: [{ id: 'p-maya', label: 'Maya Singh · two children' }, { id: 'p-sanjay', label: 'Sanjay Menon · also a coach' }],
  },
  {
    surface: 'athlete', name: 'Athlete App', who: 'Athletes — focus, practice, feedback, progress', icon: <User size={22} />, home: '/athlete',
    personas: [{ id: 'p-tara', label: 'Tara Singh · direct login' }, { id: 'p-kabir', label: 'Kabir Singh · on a parent’s device' }],
  },
];

export function Launcher() {
  const { setPersona } = useStore();
  const nav = useNavigate();
  const go = (s: Surface, personId: string, academyId = 'ac-velocity', to = '') => {
    setPersona(s, { personId, academyId });
    nav(to || SURFACES.find((x) => x.surface === s)!.home);
  };

  return (
    <main className="launch" id="main" tabIndex={-1}>
      <div className="launch-inner">
        <header className="row between wrap gap-4" style={{ marginBottom: 56 }}>
          <Wordmark />
          <nav className="row gap-2">
            <Link to="/explore" className="btn btn-sm" style={{ background: 'transparent', color: 'var(--chalk-50)', borderColor: 'var(--ink-600)' }}>
              <Palette size={14} /> Visual exploration
            </Link>
          </nav>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 40, alignItems: 'end', marginBottom: 56 }} className="launch-hero">
          <div>
            <h1 className="display" style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}>
              Every session<br />becomes <span style={{ color: 'var(--lime-400)' }}>history.</span>
            </h1>
            <p style={{ marginTop: 20, maxWidth: '52ch', color: 'var(--slate-300)', fontSize: 'var(--fs-lg)' }}>
              FlowX runs an academy’s development loop: courtside capture, reassessment and the reports families read. Four apps, one record of every athlete.
            </p>
          </div>
          <div className="card" data-theme="floodlit" style={{ background: 'var(--ink-900)', borderColor: 'var(--ink-700)' }}>
            <div className="row gap-3" style={{ marginBottom: 10 }}>
              <Seam state="insight" size={34} />
              <div>
                <p className="strong">Try the signature loop</p>
                <p className="xs muted">About 3 minutes · touches all four apps</p>
              </div>
            </div>
            <ol className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6, color: 'var(--slate-300)' }}>
              <li>Coach: take attendance, then talk a note into <strong style={{ color: 'var(--chalk-50)' }}>Huddle</strong></li>
              <li>Coach: reassess Kabir with the evidence brief</li>
              <li>Web: approve, then draft and publish his report</li>
              <li>Parent: open the notification, ask Huddle to explain</li>
            </ol>
            <button className="btn btn-highlight btn-block" style={{ marginTop: 16 }} onClick={() => go('coach', 'p-neha', 'ac-velocity', '/coach/session/s-1005')}>
              Start courtside with Neha
            </button>
          </div>
        </section>

        <h2 className="h2" style={{ marginBottom: 16 }}>Open a surface</h2>
        <div className="launch-grid">
          {SURFACES.map((s) => (
            <div key={s.surface} className="surface-card">
              <span style={{ color: 'var(--lime-400)' }}>{s.icon}</span>
              <h3 className="display display-md">{s.name}</h3>
              <p className="small" style={{ color: 'var(--slate-300)' }}>{s.who}</p>
              <div className="persona-list" role="group" aria-label={`Sign in to ${s.name} as`}>
                {s.personas.map((p) => (
                  <button key={p.id} onClick={() => go(s.surface, p.id, p.academy)}>
                    <span className="grow">{p.label}</span>
                    <span aria-hidden>›</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="xs" style={{ marginTop: 24, color: 'var(--slate-400)', maxWidth: '72ch' }}>
          A prototype with fixture data for Velocity Cricket Academy. All four apps share one store, so work done in one shows up in the others.
          Huddle uses demo logic and no AI service is connected. Use “Prototype controls” to simulate offline, failures and conflicts.
        </p>
      </div>
      <ProtoControls />
      <style>{`@media (max-width: 900px){ .launch-hero{ grid-template-columns: 1fr !important; } }`}</style>
    </main>
  );
}
