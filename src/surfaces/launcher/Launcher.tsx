import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Users, User, Palette } from 'lucide-react';
import { useStore } from '../../store/store';
import type { Surface } from '../../data/types';
import { Wordmark, ProtoControls } from '../../components/chrome';
import { DitAvatar } from '../../companion/DitAvatar';
import { ScoreDiscs } from '../../score/ScoreViz';
import { computeDitScore } from '../../score/ditScore';

const SURFACES: { surface: Surface; role: 'coach' | 'parent' | 'athlete'; name: string; who: string; icon: JSX.Element; home: string; personas: { id: string; label: string; academy?: string }[] }[] = [
  {
    surface: 'athlete', role: 'athlete', name: 'Athlete', who: 'Focus, practice, feedback, Dit Score', icon: <User size={22} />, home: '/athlete',
    personas: [{ id: 'p-tara', label: 'Tara Singh · 13, own login' }, { id: 'p-kabir', label: 'Kabir Singh · 15, parent’s device' }],
  },
  {
    surface: 'parent', role: 'parent', name: 'Parent', who: 'Published progress, reports, schedule, explanations', icon: <Users size={22} />, home: '/parent',
    personas: [{ id: 'p-maya', label: 'Maya Singh · two children' }, { id: 'p-sanjay', label: 'Sanjay Menon · also a coach' }],
  },
  {
    surface: 'coach', role: 'coach', name: 'Coach mobile', who: 'Courtside sessions, voice notes, reassessment, offline', icon: <Smartphone size={22} />, home: '/coach',
    personas: [{ id: 'p-neha', label: 'Neha Rao · coach, U16 Elite' }, { id: 'p-rohan', label: 'Rohan Shah · head coach' }, { id: 'p-arjun', label: 'Arjun Patel · temporary assistant' }, { id: 'p-sanjay', label: 'Sanjay Menon · coach + parent', academy: 'ac-harbour' }],
  },
  {
    surface: 'web', role: 'coach', name: 'Academy web', who: 'Head coach and admin: oversight, reports, governance', icon: <LayoutDashboard size={22} />, home: '/web',
    personas: [{ id: 'p-rohan', label: 'Rohan Shah · head coach' }, { id: 'p-asha', label: 'Asha Mehta · owner' }],
  },
];

export function Launcher() {
  const { setPersona, db } = useStore();
  const nav = useNavigate();
  const go = (s: Surface, personId: string, academyId = 'ac-velocity', to = '') => {
    setPersona(s, { personId, academyId });
    nav(to || SURFACES.find((x) => x.surface === s)!.home);
  };
  const tara = computeDitScore(db, 'a-tara');

  return (
    <main className="launch" id="main" tabIndex={-1} data-theme="floodlit" data-role="athlete">
      <div className="launch-inner">
        <header className="row between wrap gap-4" style={{ marginBottom: 40 }}>
          <Wordmark size={34} />
          <nav className="row gap-2">
            <Link to="/explore" className="btn btn-sm" style={{ background: 'transparent', color: 'var(--grey-50)', borderColor: 'var(--char-300)' }}>
              <Palette size={14} /> Brand, companion and score explorations
            </Link>
          </nav>
        </header>

        <section className="launch-hero">
          <div>
            <h1 className="display" style={{ fontSize: 'clamp(2.75rem, 7vw, 5.75rem)' }}>What’s your<br />Dit Score?</h1>
            <p style={{ marginTop: 20, maxWidth: '50ch', color: 'var(--grey-500)', fontSize: 'var(--fs-lg)' }}>
              ditdit turns everyday coaching into a development story athletes understand. Coaches stay the source of truth, ditdit keeps the record, and dit, the companion, explains it.
            </p>
            <div className="row gap-3 wrap" style={{ marginTop: 28 }}>
              <button className="btn btn-highlight btn-lg" onClick={() => go('athlete', 'p-tara', 'ac-velocity', '/athlete?intro=1&milestone=1')}>Open Tara’s ditdit</button>
              <button className="btn btn-lg" style={{ background: 'transparent', color: 'var(--grey-50)', borderColor: 'var(--char-300)' }} onClick={() => go('coach', 'p-neha', 'ac-velocity', '/coach/athlete/a-kabir?session=s-1005')}>Coach: talk a note</button>
            </div>
          </div>
          <div className="launch-score" aria-label="Example Dit Score">
            <ScoreDiscs state={tara} size={300} />
            <div className="row gap-2" style={{ justifyContent: 'center' }}>
              <DitAvatar state="insight" form="face" size={36} />
              <p className="small" style={{ color: 'var(--grey-500)', maxWidth: '30ch' }}>“Your score went up since last week. Want to see why?”</p>
            </div>
            <p className="xs" style={{ color: 'var(--grey-600)', textAlign: 'center' }}>Tara’s illustrative score, calculated from prototype records</p>
          </div>
        </section>

        <h2 className="h2" style={{ margin: '56px 0 16px' }}>Open an app</h2>
        <div className="launch-grid">
          {SURFACES.map((s) => (
            <div key={s.surface} className="surface-card" data-role={s.role}>
              <span className="role-swatch" aria-hidden />
              <span style={{ color: 'var(--hl)' }}>{s.icon}</span>
              <h3 className="h2">{s.name}</h3>
              <p className="small surface-who" style={{ color: 'var(--grey-500)' }}>{s.who}</p>
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

        <section className="launch-flows">
          <h2 className="h2" style={{ marginBottom: 12 }}>New companion and score journeys</h2>
          <ol className="flows-list">
            <li><button onClick={() => go('athlete', 'p-tara', 'ac-velocity', '/athlete?intro=1')}><b>A</b> Meet dit for the first time</button></li>
            <li><button onClick={() => go('athlete', 'p-tara', 'ac-velocity', '/athlete/session/s-0991')}><b>B</b> Explain my mistake</button></li>
            <li><button onClick={() => go('athlete', 'p-tara', 'ac-velocity', '/athlete/score')}><b>C</b> Understand my Dit Score</button></li>
            <li><button onClick={() => go('athlete', 'p-tara', 'ac-velocity', '/athlete?milestone=1')}><b>D</b> Celebrate a milestone</button></li>
            <li><button onClick={() => go('coach', 'p-neha', 'ac-velocity', '/coach/athlete/a-kabir?session=s-1005')}><b>E</b> Coach note → approved feedback</button></li>
            <li><button onClick={() => go('parent', 'p-maya', 'ac-velocity', '/parent?child=a-kabir')}><b>F</b> Parent: explain it simply</button></li>
            <li><button onClick={() => go('athlete', 'p-kabir', 'ac-velocity', '/athlete/score/compare')}><b>G</b> Squad progress comparison</button></li>
          </ol>
        </section>

        <p className="xs" style={{ marginTop: 32, color: 'var(--grey-600)', maxWidth: '72ch' }}>
          A prototype with fixture data for Velocity Cricket Academy. All four apps share one store. dit uses demo logic, not an AI model. The Dit Score uses an illustrative method that still has to be validated with coaches and sports experts.
          Prototype controls (bottom-left) simulate offline, failures and conflicts.
        </p>
      </div>
      <ProtoControls />
    </main>
  );
}
