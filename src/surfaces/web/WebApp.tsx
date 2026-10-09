import { NavLink, Route, Routes, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Users, Target, ClipboardList, Flag, FileText, Layers, UserCog, Building2, Search } from 'lucide-react';
import { useStore } from '../../store/store';
import { Wordmark, ProtoControls } from '../../components/chrome';
import { CompanionCanvas, CompanionIntro, SeamButton } from '../../companion/Companion';
import { Overview } from './Overview';
import { AthletesPage, Passport } from './Athletes';
import { DevelopmentPage } from './Development';
import { TasksPage } from './Tasks';
import { ReassessmentsPage } from './Reassessments';
import { ReportsPage, ReportComposer } from './Reports';
import { BatchesPage } from './Batches';
import { StaffPage } from './Staff';
import { AcademyPage } from './Academy';
import { useWeb } from './useWeb';

export function WebApp() {
  const { db, setPersona } = useStore();
  const w = useWeb();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const counts = {
    reass: db.reassessments.filter((r) => r.status === 'submitted').length,
    tasks: db.tasks.filter((t) => t.status === 'blocked' || (t.status === 'completed' && !!t.followUp)).length,
    reports: db.reports.filter((r) => r.status === 'draft' || r.status === 'approved').length,
  };
  const matches = q.trim() ? db.athletes.filter((a) => a.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];

  const items = [
    { to: '/web', label: 'Overview', icon: <LayoutDashboard size={18} />, end: true },
    { to: '/web/athletes', label: 'Athletes', icon: <Users size={18} /> },
    { to: '/web/development', label: 'Development', icon: <Target size={18} /> },
    { to: '/web/tasks', label: 'Tasks', icon: <ClipboardList size={18} />, count: counts.tasks },
    { to: '/web/reassessments', label: 'Reassessments', icon: <Flag size={18} />, count: counts.reass },
    { to: '/web/reports', label: 'Reports', icon: <FileText size={18} />, count: counts.reports },
    { to: '/web/batches', label: 'Batches', icon: <Layers size={18} /> },
    { to: '/web/staff', label: 'Staff', icon: <UserCog size={18} /> },
    { to: '/web/academy', label: 'Academy', icon: <Building2 size={18} /> },
  ];

  return (
    <div className="w-shell" data-theme="chalk" data-role="coach">
      <aside className="w-side" aria-label="Management navigation">
        <div style={{ padding: '0 12px' }}><Wordmark /></div>
        <nav>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}>
              {i.icon}
              <span>{i.label}</span>
              {!!i.count && <span className="count" aria-label={`${i.count} need attention`}>{i.count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot" style={{ marginTop: 'auto', padding: '0 12px' }}>
          <Link to="/" className="xs" style={{ color: 'rgba(245,246,240,.7)' }}>← All surfaces</Link>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <header className="w-top">
          <div className="ctx-switch">
            <Building2 size={16} aria-hidden />
            <span className="strong">{w.academy.name}</span>
          </div>
          <label className="ctx-switch">
            <span className="sr-only">Signed in as</span>
            <select value={w.person.id} onChange={(e) => setPersona('web', { personId: e.target.value, academyId: 'ac-velocity' })} aria-label="Signed in as">
              <option value="p-rohan">Rohan Shah · Head coach</option>
              <option value="p-asha">Asha Mehta · Owner</option>
            </select>
          </label>
          <div className="grow" style={{ position: 'relative', maxWidth: 360 }}>
            <label htmlFor="web-search" className="sr-only">Search athletes</label>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} aria-hidden />
            <input
              id="web-search"
              className="input"
              style={{ paddingLeft: 36, minHeight: 42 }}
              placeholder="Search athletes"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) { nav(`/web/athletes/${matches[0].id}`); setQ(''); } }}
              role="combobox"
              aria-expanded={matches.length > 0}
              aria-controls="search-results"
              autoComplete="off"
            />
            {q.trim() && (
              <ul id="search-results" role="listbox" className="list card card-flush" style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 20, boxShadow: 'var(--shadow)' }}>
                {matches.length === 0 && <li className="list-row small muted">No athlete matches “{q}”. <FlowCodeInline /></li>}
                {matches.map((a) => (
                  <li key={a.id} role="option" aria-selected="false">
                    <Link to={`/web/athletes/${a.id}`} className="list-row" onClick={() => setQ('')}>
                      <span className="grow small strong">{a.name}</span>
                      <span className="xs muted">{a.status === 'active' ? db.batches.find((b) => b.id === a.batchId)?.name : a.status.replace('_', ' ')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ marginLeft: 'auto' }}><SeamButton /></div>
        </header>
        <main className="w-main" id="main" tabIndex={-1}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="athletes" element={<AthletesPage />} />
            <Route path="athletes/:id" element={<Passport />} />
            <Route path="athletes/:id/:tab" element={<Passport />} />
            <Route path="development" element={<DevelopmentPage />} />
            <Route path="development/:areaId" element={<DevelopmentPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:taskId" element={<TasksPage />} />
            <Route path="reassessments" element={<ReassessmentsPage />} />
            <Route path="reassessments/:rid" element={<ReassessmentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/:reportId" element={<ReportComposer />} />
            <Route path="batches" element={<BatchesPage />} />
            <Route path="batches/:batchId" element={<BatchesPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="academy" element={<AcademyPage />} />
          </Routes>
        </main>
      </div>
      <CompanionCanvas variant="panel" />
      <CompanionIntro surface="web" fixed />
      <ProtoControls />
    </div>
  );
}

const FlowCodeInline = () => <span className="flow-code">MW07.01</span>;
