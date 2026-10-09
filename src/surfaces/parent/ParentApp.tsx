import { createContext, useContext, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Home, TrendingUp, FileText, CalendarDays, Bell, ChevronRight, Trophy, Medal, CalendarCheck, Ban, MessageSquareQuote } from 'lucide-react';
import { useStore } from '../../store/store';
import { athleteById, attendanceFor, currentFocus, fmtDate, timelineFor, relDay, batchById } from '../../store/selectors';
import { PhoneStage, StatusBar, MobileNav, BackLink } from '../../components/chrome';
import { Avatar, Banner, Button, Field, FlowCode, StateBlock, Timeline, Assumption, StatusBadge } from '../../components/ui';
import { ReportView } from '../../components/ReportView';
import { HuddleCanvas, SeamButton, useHuddleContext } from '../../huddle/Huddle';

const ChildCtx = createContext<{ childId: string; setChildId: (id: string) => void }>({ childId: '', setChildId: () => {} });

function useParent() {
  const { db, personas } = useStore();
  const person = db.people.find((p) => p.id === personas.parent.personId)!;
  const childIds = (person.childIds ?? []).filter((id) => athleteById(db, id)?.guardianIds.includes(person.id));
  const revoked = (person.childIds ?? []).filter((id) => !childIds.includes(id));
  return { person, childIds, revoked, isAlsoCoach: person.memberships.some((m) => ['coach', 'head_coach', 'assistant'].includes(m.role)) };
}

export function ParentApp() {
  const p = useParent();
  const [childId, setChildId] = useState(p.childIds[0] ?? '');
  const active = p.childIds.includes(childId) ? childId : p.childIds[0] ?? '';
  return (
    <PhoneStage
      surface="parent"
      title="Parent App"
      personas={[{ personId: 'p-maya', label: 'Maya Singh', sub: 'guardian of Kabir and Tara' }, { personId: 'p-sanjay', label: 'Sanjay Menon', sub: 'guardian of Ishaan, also a coach' }]}
      journeys={[
        { label: 'Invitation and account', to: '/parent/onboarding', codes: 'PA01.01–03' },
        { label: 'Home overview', to: '/parent', codes: 'PA02' },
        { label: 'Corrected report (deep link)', to: '/parent/report/rep-tara-sep', codes: 'PA04 · XS03.03' },
        { label: 'Progress history', to: '/parent/progress', codes: 'PA03' },
        { label: 'Attendance and competitions', to: '/parent/schedule', codes: 'PA05' },
        { label: 'Notifications', to: '/parent/notifications', codes: 'PA04.01' },
      ]}
    >
      <ChildCtx.Provider value={{ childId: active, setChildId }}>
        <div className="m-app" data-theme="chalk">
          <StatusBar />
          <main className="m-body" id="main" tabIndex={-1}>
            <Routes>
              <Route index element={<ParentHome />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="progress" element={<Progress />} />
              <Route path="reports" element={<Reports />} />
              <Route path="report/:id" element={<ReportReader />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="notifications" element={<Notifications />} />
            </Routes>
          </main>
          <SeamButton variant="fab" />
          <MobileNav items={[
            { to: '/parent', label: 'Home', icon: <Home size={20} />, end: true },
            { to: '/parent/progress', label: 'Progress', icon: <TrendingUp size={20} /> },
            { to: '/parent/reports', label: 'Reports', icon: <FileText size={20} /> },
            { to: '/parent/schedule', label: 'Schedule', icon: <CalendarDays size={20} /> },
          ]} />
          <HuddleCanvas variant="sheet" />
        </div>
      </ChildCtx.Provider>
    </PhoneStage>
  );
}

/** PA01.04 child switcher — always visible on child-scoped screens. */
function ChildBar() {
  const { db } = useStore();
  const p = useParent();
  const { childId, setChildId } = useContext(ChildCtx);
  const unread = db.notifications.filter((n) => n.personId === p.person.id && !n.read).length;
  return (
    <div className="m-top" style={{ margin: '0 calc(var(--s-4) * -1)', position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)' }}>
      {p.childIds.length > 1 ? (
        <div className="seg grow" role="tablist" aria-label="Choose child">
          {p.childIds.map((id) => (
            <button key={id} role="tab" aria-selected={id === childId} aria-pressed={id === childId} style={{ flex: 1 }} onClick={() => setChildId(id)}>
              {athleteById(db, id)?.name.split(' ')[0]}
            </button>
          ))}
        </div>
      ) : <span className="grow strong">{athleteById(db, childId)?.name ?? 'FlowX'}</span>}
      <Link to="/parent/notifications" className="btn btn-icon btn-sm" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} style={{ position: 'relative' }}>
        <Bell size={18} />
        {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: 'var(--err)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{unread}</span>}
      </Link>
    </div>
  );
}

function NoChild() {
  const p = useParent();
  return (
    <div className="m-section">
      <StateBlock kind={p.revoked.length ? 'permission' : 'empty'}
        title={p.revoked.length ? 'Your link to this child was removed' : 'No child linked yet'}
        body={p.revoked.length ? 'The academy removed your guardian link. Reports you were sent earlier are no longer available here. Contact the academy if this is a mistake.' : 'Use the invitation from the academy to link your child.'}
        action={<Link className="btn btn-sm" to="/parent/onboarding">Use an invitation</Link>} />
      <FlowCode codes="PA01.06" />
    </div>
  );
}

/** PA02.01–07 */
function ParentHome() {
  const { db } = useStore();
  const p = useParent();
  const { childId } = useContext(ChildCtx);
  const a = athleteById(db, childId);
  useHuddleContext(a ? { surface: 'parent', title: `${a.name.split(' ')[0]} · Home`, athleteId: a.id, reportId: db.reports.find((r) => r.athleteId === a.id && (r.status === 'published' || r.status === 'corrected'))?.id, prompts: ['Explain this report in plain words'] } : null);
  if (!a) return <><ChildBar /><NoChild /></>;
  const first = a.name.split(' ')[0];
  const { area } = currentFocus(db, a.id);
  const att = attendanceFor(db, a.id);
  const latest = db.reports.filter((r) => r.athleteId === a.id && (r.status === 'published' || r.status === 'corrected')).sort((x, y) => (y.publishedAt ?? '').localeCompare(x.publishedAt ?? ''))[0];
  const ms = db.milestones.filter((m) => m.athleteId === a.id && m.visibleToFamily).sort((x, y) => y.date.localeCompare(x.date))[0];
  const comp = db.competitions.filter((c) => c.athleteIds.includes(a.id) && c.status !== 'completed').sort((x, y) => x.date.localeCompare(y.date))[0];
  return (
    <>
      <ChildBar />
      {p.isAlsoCoach && <div className="m-section"><Banner tone="info">You’re also a coach. This app shows only what the academy publishes to families. <FlowCode codes="PA01.07" /></Banner></div>}
      <section className="m-section">
        <p className="small muted">{batchById(db, a.batchId)?.name} · {db.academies.find((x) => x.id === a.academyId)?.name}</p>
        <h1 className="display display-xl" style={{ marginTop: 4 }}>{first}</h1>
        <FlowCode codes="PA02.01–02.02" />
      </section>

      <section className="m-section card" aria-labelledby="pf-h" style={{ borderWidth: 1.5, borderColor: 'var(--line-strong)' }}>
        <h2 id="pf-h" className="small strong muted">What the coach is working on <FlowCode codes="PA02.03" /></h2>
        {area ? <p className="display display-md" style={{ marginTop: 8 }}><span className="mark">{area.title}</span></p> : <p className="small" style={{ marginTop: 8 }}>No current focus has been shared yet.</p>}
        {area && <p className="small muted" style={{ marginTop: 8 }}>Since {fmtDate(area.openedAt, { day: 'numeric', month: 'long' })}. Progress is shared in reports after each reassessment.</p>}
      </section>

      {latest?.comment && (
        <Link to={`/parent/report/${latest.id}`} className="m-section card card-link" style={{ display: 'block', borderLeft: '4px solid var(--forest-700)' }}>
          <p className="xs strong muted row gap-1"><MessageSquareQuote size={14} /> Latest from the coach <FlowCode codes="PA02.04" /></p>
          <p className="small" style={{ marginTop: 6 }}>“{latest.comment.length > 140 ? `${latest.comment.slice(0, 140)}…` : latest.comment}”</p>
          <p className="xs muted" style={{ marginTop: 6 }}>{latest.period} report{latest.status === 'corrected' ? ' · corrected' : ''}</p>
        </Link>
      )}

      <section className="m-section w-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Link to="/parent/schedule" className="metric card-link">
          <span className="metric-label row gap-1"><CalendarCheck size={14} /> Attendance</span>
          <span className="num">{att.total ? `${att.present}/${att.total}` : '—'}</span>
          <span className="metric-basis">recorded sessions <FlowCode codes="PA02.06" /></span>
        </Link>
        {ms ? (
          <Link to="/parent/progress" className="metric card-link" style={{ background: 'var(--lime-400)', borderColor: 'var(--lime-400)' }}>
            <span className="metric-label row gap-1"><Trophy size={14} /> Milestone</span>
            <span className="small strong">{ms.title}</span>
            <span className="metric-basis" style={{ color: 'var(--ink-700)' }}>{fmtDate(ms.date)} <FlowCode codes="PA02.05" /></span>
          </Link>
        ) : <div className="metric"><span className="metric-label">Milestones</span><span className="small muted">None yet</span></div>}
      </section>

      {comp && (
        <Link to="/parent/schedule" className="m-section card card-link row gap-3">
          <Medal size={22} color="var(--court-600)" />
          <span className="grow stack"><span className="small strong">{comp.name}</span><span className="xs muted">{fmtDate(comp.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {comp.venue}</span>{comp.status === 'changed' && <span className="xs" style={{ color: 'var(--warn)' }}>Changed: {comp.change}</span>}</span>
          <ChevronRight size={16} />
        </Link>
      )}
    </>
  );
}

/** PA03.01–06 */
function Progress() {
  const { db } = useStore();
  const { childId } = useContext(ChildCtx);
  const a = athleteById(db, childId);
  useHuddleContext(a ? { surface: 'parent', title: `${a.name.split(' ')[0]} · Progress`, athleteId: a.id, reportId: db.reports.find((r) => r.athleteId === a.id && (r.status === 'published' || r.status === 'corrected'))?.id, prompts: ['Explain this report in plain words'] } : null);
  if (!a) return <><ChildBar /><NoChild /></>;
  const areas = db.areas.filter((x) => x.athleteId === a.id);
  const lastApproved = db.reassessments.filter((r) => r.athleteId === a.id && r.status === 'approved').sort((x, y) => (y.submittedAt ?? '').localeCompare(x.submittedAt ?? ''))[0];
  const words: Record<string, string> = { needs_more_work: 'Still working on it', improving: 'Improving', on_track: 'On track', achieved: 'Achieved' };
  return (
    <>
      <ChildBar />
      <h1 className="display display-lg m-section">Progress</h1>
      <FlowCode codes="PA03.01–03.06" />
      <section className="m-section stack gap-2">
        <h2 className="small strong muted">Current focus and status <FlowCode codes="PA03.02–03.03" /></h2>
        {areas.filter((x) => x.status === 'active' || x.status === 'reopened').map((x) => {
          const r = db.reassessments.filter((y) => y.areaId === x.id && y.status === 'approved').sort((p, q) => (q.submittedAt ?? '').localeCompare(p.submittedAt ?? ''))[0];
          return (
            <div key={x.id} className="card">
              <p className="strong">{x.title}</p>
              <p className="small muted" style={{ marginTop: 4 }}>{r?.outcome ? `Last check: ${words[r.outcome]}` : 'Not reassessed yet. The coach checks progress at the next reassessment.'}</p>
              {x.status === 'reopened' && <p className="xs" style={{ color: 'var(--warn)', marginTop: 4 }}>Reopened: the coach is revisiting this skill.</p>}
            </div>
          );
        })}
        {lastApproved && <p className="xs muted">Status words come from the coach’s reassessment, not from automatic scoring.</p>}
      </section>
      <section className="m-section">
        <h2 className="small strong muted" style={{ marginBottom: 8 }}>History <FlowCode codes="PA03.04–03.05" /></h2>
        <Timeline items={timelineFor(db, a.id, 'family')} />
      </section>
      <section className="m-section"><Link to="/parent/reports" className="btn btn-block">Older reports <FlowCode codes="PA03.06" /></Link></section>
    </>
  );
}

function Reports() {
  const { db } = useStore();
  const { childId } = useContext(ChildCtx);
  const a = athleteById(db, childId);
  useHuddleContext(a ? { surface: 'parent', title: 'Reports', athleteId: a.id, prompts: ['What can you help with?'] } : null);
  if (!a) return <><ChildBar /><NoChild /></>;
  const list = db.reports.filter((r) => r.athleteId === a.id && ['published', 'corrected', 'withdrawn'].includes(r.status));
  return (
    <>
      <ChildBar />
      <h1 className="display display-lg m-section">Reports</h1>
      {list.length === 0 ? <div className="m-section"><StateBlock kind="empty" title="No reports yet" body="You’ll get a notification when the academy publishes one." /></div> : (
        <ul className="list card card-flush m-section">
          {list.map((r) => (
            <li key={r.id}><Link to={`/parent/report/${r.id}`} className="list-row"><span className="grow stack"><span className="small strong">{r.period}</span><span className="xs muted">{r.publishedAt ? fmtDate(r.publishedAt) : ''}{r.status === 'corrected' ? ` · corrected v${r.version}` : ''}</span></span><StatusBadge status={r.status} /></Link></li>
          ))}
        </ul>
      )}
    </>
  );
}

/** PA04.02–07 · deep link with revalidation (XS03, XS07.S07–S08) */
function ReportReader() {
  const { id } = useParams();
  const { db, update } = useStore();
  const p = useParent();
  const nav = useNavigate();
  const { setChildId } = useContext(ChildCtx);
  const r = db.reports.find((x) => x.id === id);
  const [video, setVideo] = useState(false);
  useHuddleContext(r ? { surface: 'parent', title: `${athleteById(db, r.athleteId)?.name.split(' ')[0]}’s ${r.period} report`, athleteId: r.athleteId, reportId: r.id, prompts: ['Explain this report in plain words'] } : null);

  const allowed = !!r && p.childIds.includes(r.athleteId);
  const visible = r && ['published', 'corrected', 'withdrawn'].includes(r.status);
  // Opening the report marks its notifications read.
  const personId = p.person.id;
  useEffect(() => {
    if (!allowed || !id) return;
    update((d) => d.notifications.forEach((n) => { if (n.personId === personId && n.target.id === id && !n.read) n.read = true; }));
  }, [allowed, id, personId, update]);

  return (
    <>
      <div className="m-top" style={{ margin: '0 calc(var(--s-4) * -1)' }}><BackLink to="/parent/reports" label="Reports" /></div>
      {!r ? (
        <div className="m-section"><StateBlock kind="archived" title="This report isn’t available" body="The link may be out of date. Your other reports are in the Reports tab." action={<Link className="btn btn-sm" to="/parent/reports">Open Reports</Link>} /></div>
      ) : !allowed ? (
        <div className="m-section"><StateBlock kind="permission" title="You can’t open this report" body="It belongs to a child you’re not linked to, or your guardian link was removed." action={<Button size="sm" onClick={() => nav('/parent')}>Go home</Button>} /></div>
      ) : !visible ? (
        <div className="m-section"><StateBlock kind="empty" title="Not published yet" body="The academy is still preparing this report." /></div>
      ) : (
        <div className="m-section stack gap-3">
          <FlowCode codes="PA04.02–04.07" />
          {r.status !== 'withdrawn' && <Assumption code="PA04.04" />}
          <ReportView db={db} report={r} onPlayVideo={() => setVideo(true)} />
          {video && r.videoId && (
            <div className="card stack gap-2">
              <p className="small strong">Coach’s notes on this clip <FlowCode codes="PA04.06" /></p>
              {db.videos.find((v) => v.id === r.videoId)!.comments.filter((c) => c.shared).map((c) => <p key={c.id} className="small"><span className="badge badge-lime">{Math.floor(c.t / 60)}:{String(c.t % 60).padStart(2, '0')}</span> {c.text}</p>)}
              <p className="xs muted">No media in the prototype.</p>
            </div>
          )}
          <Button variant="ghost" onClick={() => { setChildId(r.athleteId); nav('/parent/progress'); }}>See {athleteById(db, r.athleteId)?.name.split(' ')[0]}’s progress</Button>
        </div>
      )}
    </>
  );
}

/** PA05.01–05 */
function Schedule() {
  const { db } = useStore();
  const { childId } = useContext(ChildCtx);
  const a = athleteById(db, childId);
  useHuddleContext(a ? { surface: 'parent', title: 'Schedule', athleteId: a.id, prompts: ['What can you help with?'] } : null);
  if (!a) return <><ChildBar /><NoChild /></>;
  const att = attendanceFor(db, a.id);
  const comps = db.competitions.filter((c) => c.athleteIds.includes(a.id)).sort((x, y) => x.date.localeCompare(y.date));
  const upcoming = db.sessions.filter((s) => s.attendance[a.id] !== undefined && s.status === 'scheduled').sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start));
  return (
    <>
      <ChildBar />
      <h1 className="display display-lg m-section">Schedule</h1>
      <FlowCode codes="PA05.01–05.05" />
      <section className="m-section w-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="metric"><span className="metric-label">Attended</span><span className="num">{att.present}</span><span className="metric-basis">of {att.total} recorded sessions</span></div>
        <div className="metric"><span className="metric-label">Missed</span><span className="num">{att.total - att.present}</span><span className="metric-basis">marked absent by the coach</span></div>
      </section>
      <section className="m-section">
        <h2 className="small strong muted" style={{ marginBottom: 6 }}>Recent sessions</h2>
        <ul className="list card card-flush">
          {att.sessions.sort((x, y) => y.date.localeCompare(x.date)).map((s) => (
            <li key={s.id} className="list-row"><span className="grow stack"><span className="small strong">{s.title}</span><span className="xs muted">{fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span></span>{s.attendance[a.id] === 'present' ? <StatusBadge status="active" label="Present" /> : <StatusBadge status="failed" label="Absent" />}</li>
          ))}
        </ul>
      </section>
      <section className="m-section">
        <h2 className="small strong muted" style={{ marginBottom: 6 }}>Coming up</h2>
        <ul className="list card card-flush">
          {upcoming.map((s) => <li key={s.id} className="list-row"><span className="grow stack"><span className="small strong">{s.title}</span><span className="xs muted">{relDay(s.date)} · {s.start}</span></span></li>)}
          {!upcoming.length && <li className="list-row small muted">No sessions scheduled.</li>}
        </ul>
      </section>
      <section className="m-section stack gap-2">
        <h2 className="small strong muted">Competitions</h2>
        {comps.map((c) => (
          <div key={c.id} className="card stack gap-1" style={c.status === 'changed' ? { borderColor: 'var(--warn)', borderWidth: 1.5 } : undefined}>
            <div className="row between gap-2"><span className="small strong">{c.name}</span><span className="badge badge-outline">{c.status === 'completed' ? 'Played' : c.status === 'changed' ? 'Changed' : 'Upcoming'}</span></div>
            <span className="xs muted">{fmtDate(c.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {c.venue}</span>
            {c.change && <Banner tone="warn">{c.change}</Banner>}
            {c.update && <p className="small">{c.update}</p>}
          </div>
        ))}
        {!comps.length && <StateBlock kind="empty" title="No competitions" />}
      </section>
    </>
  );
}

function Notifications() {
  const { db, update } = useStore();
  const p = useParent();
  useHuddleContext({ surface: 'parent', title: 'Notifications', prompts: ['What can you help with?'] });
  const list = db.notifications.filter((n) => n.personId === p.person.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <div className="m-top" style={{ margin: '0 calc(var(--s-4) * -1)' }}><BackLink to="/parent" label="Home" /></div>
      <h1 className="display display-lg m-section">Notifications</h1>
      <FlowCode codes="PA04.01 · XS03.03" />
      {list.length === 0 ? <div className="m-section"><StateBlock kind="empty" title="You’re all caught up" /></div> : (
        <ul className="list card card-flush m-section">
          {list.map((n) => {
            const r = db.reports.find((x) => x.id === n.target.id);
            const gone = n.target.type === 'report' && (!r || r.status === 'withdrawn');
            return (
              <li key={n.id}>
                <Link to={n.route} className="list-row" onClick={() => update((d) => { const x = d.notifications.find((y) => y.id === n.id); if (x) x.read = true; })}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: n.read ? 'transparent' : 'var(--forest-600)', flex: 'none' }} aria-label={n.read ? undefined : 'Unread'} />
                  <span className="grow stack"><span className="small strong">{n.title}</span><span className="xs muted">{gone ? <><Ban size={11} style={{ display: 'inline' }} /> This report was withdrawn</> : n.body}</span></span>
                  <ChevronRight size={16} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** PA01.01–05 — demo onboarding with validation. */
function Onboarding() {
  const { db } = useStore();
  const p = useParent();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [touched, setTouched] = useState(false);
  useHuddleContext({ surface: 'parent', title: 'Getting started', prompts: ['What can you help with?'] });
  const codeOk = code.trim().toUpperCase() === 'VCA-KABIR';
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const kabir = athleteById(db, 'a-kabir')!;
  const otherGuardians = kabir.guardianIds.filter((g) => g !== p.person.id);
  return (
    <>
      <div className="m-top" style={{ margin: '0 calc(var(--s-4) * -1)' }}><BackLink to="/parent" label="Home" /></div>
      <h1 className="display display-lg m-section">{['Your invitation', 'Create your account', 'Link your child'][step]}</h1>
      <FlowCode codes={['PA01.01', 'PA01.02', 'PA01.03–01.05'][step]} />
      {step === 0 && (
        <form className="m-section stack gap-4" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (codeOk) { setTouched(false); setStep(1); } }}>
          <p className="small muted">Velocity Cricket Academy sent you an invitation code by SMS or email.</p>
          <Field id="inv" label="Invitation code" hint="Demo code: VCA-KABIR" error={touched && !codeOk ? 'That code doesn’t match an open invitation. Check the message, or ask the academy to resend it.' : ''}>
            <input id="inv" className="input" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" />
          </Field>
          <Button type="submit" variant="primary" size="lg" block>Continue</Button>
        </form>
      )}
      {step === 1 && (
        <form className="m-section stack gap-4" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (emailOk && pw.length >= 8) { setTouched(false); setStep(2); } }}>
          <Field id="em" label="Email" error={touched && !emailOk ? 'Enter a valid email address.' : ''}><input id="em" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          <Field id="pw" label="Password" hint="At least 8 characters" error={touched && pw.length < 8 ? 'Use at least 8 characters.' : ''}><input id="pw" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
          <Button type="submit" variant="primary" size="lg" block>Create account</Button>
          <p className="xs muted">Already have a FlowX account, for example as a coach? Use the same email and your roles are kept separate.</p>
        </form>
      )}
      {step === 2 && (
        <div className="m-section stack gap-4">
          <div className="card row gap-3"><Avatar name={kabir.name} /><span className="grow stack"><span className="strong">{kabir.name}</span><span className="xs muted">U16 Elite · Velocity Cricket Academy</span></span></div>
          {otherGuardians.length > 0 && <Banner tone="info">{otherGuardians.map((g) => db.people.find((x) => x.id === g)?.name).join(', ')} is also a guardian. You’ll both see the same published reports. <FlowCode codes="PA01.05" /></Banner>}
          <Assumption code="PA01.04" />
          <Button variant="primary" size="lg" block onClick={() => nav('/parent')}>Confirm and continue</Button>
          <p className="xs muted">Account creation is simulated in this prototype.</p>
        </div>
      )}
    </>
  );
}

