import { useEffect, useState } from 'react';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { Crosshair, Dumbbell, MessageCircle, TrendingUp, Trophy, Check, Medal, Ban, Play, Pause, Smartphone, RotateCcw } from 'lucide-react';
import { useStore, uid } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { ageOn, athleteById, coachById, currentFocus, fmtDate, fmtTime, timelineFor, daysBetween } from '../../store/selectors';
import { PhoneStage, StatusBar, MobileNav, BackLink } from '../../components/chrome';
import { Assumption, AssumptionNote, Banner, Button, FlowCode, StateBlock, Timeline } from '../../components/ui';
import { Clip } from '../../components/art';
import { Seam } from '../../components/Seam';
import { HuddleCanvas, SeamButton, useHuddle, useHuddleContext } from '../../huddle/Huddle';

function useAthlete() {
  const { db, personas } = useStore();
  const person = db.people.find((p) => p.id === personas.athlete.personId)!;
  const a = athleteById(db, person.athleteId)!;
  return { person, a, first: a.name.split(' ')[0], viaParent: a.access === 'parent_device' };
}

export function AthleteApp() {
  return (
    <PhoneStage
      surface="athlete"
      title="Athlete App"
      personas={[{ personId: 'p-tara', label: 'Tara Singh', sub: 'own login, U14' }, { personId: 'p-kabir', label: 'Kabir Singh', sub: 'on a parent’s device' }]}
      journeys={[
        { label: 'Access and sign-in', to: '/athlete/access', codes: 'AT01' },
        { label: 'Focus home', to: '/athlete', codes: 'AT02' },
        { label: 'Practice and mark done', to: '/athlete/practice', codes: 'AT03' },
        { label: 'Feedback with clip moments', to: '/athlete/feedback/f-1', codes: 'AT04 · XS03.04' },
        { label: 'Progress timeline', to: '/athlete/progress', codes: 'AT05' },
      ]}
    >
      <div className="m-app" data-theme="floodlit" style={{ background: 'var(--ink-950)' }}>
        <StatusBar />
        <main className="m-body" id="main" tabIndex={-1}>
          <Routes>
            <Route index element={<FocusHome />} />
            <Route path="access" element={<Access />} />
            <Route path="practice" element={<Practice />} />
            <Route path="feedback" element={<FeedbackList />} />
            <Route path="feedback/:id" element={<FeedbackDetail />} />
            <Route path="progress" element={<ProgressPage />} />
          </Routes>
        </main>
        <SeamButton variant="fab" />
        <MobileNav items={[
          { to: '/athlete', label: 'Focus', icon: <Crosshair size={20} />, end: true },
          { to: '/athlete/practice', label: 'Practice', icon: <Dumbbell size={20} /> },
          { to: '/athlete/feedback', label: 'Feedback', icon: <MessageCircle size={20} /> },
          { to: '/athlete/progress', label: 'Progress', icon: <TrendingUp size={20} /> },
        ]} />
        <HuddleCanvas variant="sheet" />
      </div>
    </PhoneStage>
  );
}

function Top({ back }: { back?: string }) {
  const { first, viaParent } = useAthlete();
  return (
    <div className="m-top" style={{ margin: '0 calc(var(--s-4) * -1)', position: 'sticky', top: 0, zIndex: 5, background: 'var(--ink-950)' }}>
      {back ? <BackLink to={back} /> : <span className="grow strong">Hi, {first}</span>}
      {back && <span className="grow" />}
      {viaParent && <span className="badge badge-outline" title="Signed in on a parent’s device"><Smartphone size={12} /> Parent’s device</span>}
    </div>
  );
}

/** Practice this week vs. the assigned frequency — athlete-reported counts only. */
function WeekDots({ goalId, frequency }: { goalId: string; frequency: string }) {
  const { db } = useStore();
  const target = frequency.startsWith('3') ? 3 : frequency.startsWith('2') ? 2 : frequency.startsWith('Once') ? 1 : 4;
  const done = db.practiceLogs.filter((p) => p.goalId === goalId && daysBetween(p.date, TODAY) < 7 && daysBetween(p.date, TODAY) >= 0).length;
  return (
    <div className="row gap-2" role="img" aria-label={`${done} of ${target} practices logged this week`}>
      {Array.from({ length: Math.max(target, done) }, (_, i) => (
        <span key={i} style={{ width: 28, height: 28, borderRadius: 8, border: '2px solid var(--lime-400)', background: i < done ? 'var(--lime-400)' : 'transparent', display: 'grid', placeItems: 'center', color: 'var(--ink-950)' }}>
          {i < done && <Check size={14} />}
        </span>
      ))}
      <span className="small" style={{ marginLeft: 6 }}>{done}/{target} this week</span>
    </div>
  );
}

/** AT02.01–06 */
function FocusHome() {
  const { db } = useStore();
  const { a, first } = useAthlete();
  const { area, goal } = currentFocus(db, a.id);
  const tip = db.feedback.filter((f) => f.athleteId === a.id && f.status === 'published').sort((x, y) => y.publishedAt.localeCompare(x.publishedAt))[0];
  const comp = db.competitions.filter((c) => c.athleteIds.includes(a.id) && c.status !== 'completed').sort((x, y) => x.date.localeCompare(y.date))[0];
  const ms = db.milestones.filter((m) => m.athleteId === a.id && m.visibleToFamily).length;
  useHuddleContext({ surface: 'athlete', title: `${first} · Focus`, athleteId: a.id, videoId: tip?.videoId ?? undefined, prompts: tip?.videoId ? ['Explain my coach’s comment'] : ['What can you help with?'] });

  return (
    <>
      <Top />
      <section className="m-section" style={{ position: 'relative' }}>
        <div aria-hidden style={{ position: 'absolute', inset: '-40px -40px auto auto', width: 260, height: 260, background: 'radial-gradient(circle, rgba(215,255,60,.35), transparent 65%)', filter: 'blur(20px)' }} />
        <p className="small" style={{ color: 'var(--lime-400)', fontWeight: 650 }}>Your focus <FlowCode codes="AT02.01" /></p>
        {area ? <h1 className="display" style={{ fontSize: '3rem', marginTop: 6, position: 'relative' }}>{area.title}</h1> : <h1 className="display display-lg">No focus set yet</h1>}
        {goal && <p style={{ marginTop: 12, color: 'var(--slate-300)', position: 'relative' }}>Goal: {goal.title} <FlowCode codes="AT02.02" /></p>}
      </section>

      {goal?.drill && (
        <Link to="/athlete/practice" className="m-section card card-link stack gap-3" style={{ borderColor: 'var(--lime-400)', display: 'flex' }}>
          <span className="xs strong" style={{ color: 'var(--lime-400)' }}>Next practice <FlowCode codes="AT02.03" /></span>
          <span className="h2">{goal.drill.name}</span>
          <WeekDots goalId={goal.id} frequency={goal.drill.frequency} />
        </Link>
      )}

      {tip && (
        <Link to={`/athlete/feedback/${tip.id}`} className="m-section card card-link" style={{ display: 'block' }}>
          <p className="xs strong muted">Latest from {coachById(db, tip.coachId)?.name.split(' ')[0]} <FlowCode codes="AT02.04" /></p>
          <p style={{ marginTop: 6 }}>“{tip.text}”</p>
        </Link>
      )}

      <section className="m-section w-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Link to="/athlete/progress" className="metric card-link">
          <span className="metric-label row gap-1"><Trophy size={14} /> Milestones</span>
          <span className="num">{ms}</span>
          <span className="metric-basis">earned <FlowCode codes="AT02.05" /></span>
        </Link>
        {comp ? (
          <div className="metric">
            <span className="metric-label row gap-1"><Medal size={14} /> Next match</span>
            <span className="small strong">{comp.name}</span>
            <span className="metric-basis">{fmtDate(comp.date, { weekday: 'short', day: 'numeric', month: 'short' })}{comp.status === 'changed' ? ' · changed' : ''}</span>
          </div>
        ) : <div className="metric"><span className="metric-label">Next match</span><span className="small muted">None scheduled</span></div>}
      </section>
      {comp && <Assumption code="AT02.06" />}
    </>
  );
}

/** AT03.01–06 */
function Practice() {
  const { db, update, toast } = useStore();
  const { a, first } = useAthlete();
  const { goal } = currentFocus(db, a.id);
  const [seen, setSeen] = useState<string | null>(() => { try { return localStorage.getItem(`flowx-proto-v1:seen-drill:${a.id}`); } catch { return null; } });
  const video = goal ? db.videos.find((v) => v.goalId === goal.id && v.share === 'shared') : undefined;
  useHuddleContext({ surface: 'athlete', title: `${first} · Practice`, athleteId: a.id, videoId: video?.id, prompts: video ? ['Explain my coach’s comment'] : ['What can you help with?'] });
  const drillKey = goal?.drill ? `${goal.id}:${goal.drill.name}` : null;
  const changed = !!(drillKey && seen && seen !== drillKey);
  useEffect(() => { if (drillKey && !seen) { setSeen(drillKey); try { localStorage.setItem(`flowx-proto-v1:seen-drill:${a.id}`, drillKey); } catch { /* ignore */ } } }, [drillKey, seen, a.id]);
  const doneToday = goal && db.practiceLogs.some((p) => p.goalId === goal.id && p.date === TODAY);

  return (
    <>
      <Top />
      <h1 className="display display-lg m-section">Practice</h1>
      <FlowCode codes="AT03.01–03.06" />
      {!goal?.drill ? <div className="m-section"><StateBlock kind="empty" title="No practice assigned" body="When your coach adds a drill to your goal, it shows up here." /></div> : (
        <>
          {changed && (
            <div className="m-section">
              <Banner tone="warn" action={<Button size="sm" onClick={() => { setSeen(drillKey); try { localStorage.setItem(`flowx-proto-v1:seen-drill:${a.id}`, drillKey!); } catch { /* ignore */ } }}>Got it</Button>}>
                Your coach changed this drill since you last looked. <FlowCode codes="AT03.06" />
              </Banner>
            </div>
          )}
          <section className="m-section card stack gap-3" style={{ borderColor: 'var(--lime-400)' }}>
            <p className="xs strong" style={{ color: 'var(--lime-400)' }}>Drill · {goal.drill.frequency} <FlowCode codes="AT03.02" /></p>
            <h2 className="display display-md">{goal.drill.name}</h2>
            <p>{goal.drill.instructions}</p>
            <WeekDots goalId={goal.id} frequency={goal.drill.frequency} />
          </section>
          <section className="m-section card">
            <p className="xs strong muted">Why you’re doing it <FlowCode codes="AT03.03" /></p>
            <p style={{ marginTop: 4 }}>{goal.title}</p>
            <p className="small muted" style={{ marginTop: 4 }}>Target: {goal.target}</p>
          </section>
          {video && (
            <section className="m-section stack gap-2">
              <p className="xs strong muted">Watch first <FlowCode codes="AT03.04" /></p>
              <Link to={`/athlete/feedback/${db.feedback.find((f) => f.videoId === video.id)?.id ?? ''}`}><Clip video={video} /></Link>
            </section>
          )}
          <section className="m-section stack gap-2">
            <Button variant="highlight" size="lg" block disabled={!!doneToday} icon={<Check size={18} />} onClick={() => {
              update((d) => d.practiceLogs.push({ id: uid('pl'), athleteId: a.id, goalId: goal.id, date: TODAY }));
              toast({ tone: 'ok', text: 'Logged. Your coach can see you practised today.' });
            }}>{doneToday ? 'Done for today' : 'I did this practice'}</Button>
            <AssumptionNote code="AT03.05" />
          </section>
        </>
      )}
    </>
  );
}

function FeedbackList() {
  const { db } = useStore();
  const { a, first } = useAthlete();
  useHuddleContext({ surface: 'athlete', title: `${first} · Feedback`, athleteId: a.id, prompts: ['What can you help with?'] });
  const list = db.feedback.filter((f) => f.athleteId === a.id).sort((x, y) => y.publishedAt.localeCompare(x.publishedAt));
  return (
    <>
      <Top />
      <h1 className="display display-lg m-section">Feedback</h1>
      <FlowCode codes="AT04.01 · AT04.05" />
      {list.length === 0 ? <div className="m-section"><StateBlock kind="empty" title="No feedback yet" body="When your coach shares a note or a clip with you, it lands here." /></div> : (
        <ul className="list card card-flush m-section">
          {list.map((f) => (
            <li key={f.id}>
              <Link to={`/athlete/feedback/${f.id}`} className="list-row" style={{ alignItems: 'flex-start' }}>
                <span className="grow stack gap-1">
                  {f.status === 'withdrawn' ? <span className="small muted row gap-1"><Ban size={14} /> Withdrawn by your coach</span> : <span className="small">{f.text}</span>}
                  <span className="xs muted">{coachById(db, f.coachId)?.name} · {fmtDate(f.publishedAt)}{f.videoId && f.status !== 'withdrawn' ? ' · clip' : ''}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** AT04.02–06 */
function FeedbackDetail() {
  const { id } = useParams();
  const { db } = useStore();
  const { a, first } = useAthlete();
  const h = useHuddle();
  const f = db.feedback.find((x) => x.id === id && x.athleteId === a.id);
  const v = f?.videoId ? db.videos.find((x) => x.id === f.videoId) : undefined;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const shared = v ? v.comments.filter((c) => c.shared).sort((x, y) => x.t - y.t) : [];
  const active = shared.filter((c) => c.t <= t).pop();
  useHuddleContext(f && f.status === 'published' ? {
    surface: 'athlete', title: `${first} · Feedback from ${coachById(db, f.coachId)?.name.split(' ')[0]}`, athleteId: a.id, videoId: v && v.share === 'shared' ? v.id : undefined,
    prompts: v ? ['Explain my coach’s comment'] : ['What can you help with?'],
  } : { surface: 'athlete', title: 'Feedback', prompts: ['What can you help with?'] });
  useEffect(() => {
    if (!playing || !v) return;
    const iv = setInterval(() => setT((x) => (x + 0.25 >= v.duration ? (setPlaying(false), v.duration) : x + 0.25)), 250);
    return () => clearInterval(iv);
  }, [playing, v]);

  return (
    <>
      <Top back="/athlete/feedback" />
      {!f ? <div className="m-section"><StateBlock kind="archived" title="This feedback isn’t available" body="The link may be out of date." action={<Link className="btn btn-sm" to="/athlete/feedback">All feedback</Link>} /></div>
        : f.status === 'withdrawn' ? (
          <div className="m-section"><StateBlock kind="withdrawn" title="Your coach withdrew this feedback" body="It’s no longer shared with you. Nothing for you to do. Ask your coach if you have questions." /><FlowCode codes="AT04.06" /></div>
        ) : (
          <>
            <section className="m-section">
              <p className="xs strong" style={{ color: 'var(--lime-400)' }}>{coachById(db, f.coachId)?.name} · {fmtDate(f.publishedAt)} <FlowCode codes="AT04.02" /></p>
              <p className="h2" style={{ marginTop: 6 }}>“{f.text}”</p>
            </section>
            {v && (v.share === 'withdrawn' ? <div className="m-section"><StateBlock kind="withdrawn" title="Clip withdrawn" body="Your coach withdrew this clip." /></div> : (
              <section className="m-section stack gap-2">
                <FlowCode codes="AT04.03–04.04" />
                <div style={{ position: 'relative' }}>
                  <Clip video={v} compact />
                  {active && <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(11,19,15,.85)', fontSize: 13 }}><strong style={{ color: 'var(--lime-400)' }}>{fmtTime(active.t)}</strong> {active.text}</div>}
                </div>
                <div className="row gap-2">
                  <button className="btn btn-icon btn-sm" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
                  <div className="scrubber grow">
                    <div className="scrubber-track" />
                    <div className="scrubber-fill" style={{ width: `${(t / v.duration) * 100}%`, background: 'var(--chalk-50)' }} />
                    {shared.map((c) => <button key={c.id} className="scrubber-pin" style={{ left: `${(c.t / v.duration) * 100}%` }} onClick={() => { setPlaying(false); setT(c.t); }} aria-label={`Coach comment at ${fmtTime(c.t)}`} />)}
                    <label htmlFor="ath-scrub" className="sr-only">Position</label>
                    <input id="ath-scrub" type="range" min={0} max={v.duration} step={0.5} value={t} onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} />
                  </div>
                  <span className="num" style={{ fontSize: '1.1rem' }}>{fmtTime(t)}</span>
                </div>
                <p className="xs muted">No media in the prototype. Tap a lime marker to jump to a coach comment.</p>
                <ul className="list card card-flush">
                  {shared.map((c) => (
                    <li key={c.id}>
                      <button className="list-row" onClick={() => { setPlaying(false); setT(c.t); }}>
                        <span className="badge badge-lime">{fmtTime(c.t)}</span><span className="grow small">{c.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button className="card card-link row gap-3" onClick={() => h.openHuddle({ ask: 'Explain my coach’s comment' })} style={{ borderColor: 'var(--lime-400)' }}>
                  <span style={{ color: 'var(--lime-400)' }}><Seam state="insight" size={28} /></span>
                  <span className="grow stack" style={{ textAlign: 'left' }}><span className="strong">What should I copy from this?</span><span className="xs muted">Huddle turns the coach’s comment into a practice cue.</span></span>
                </button>
              </section>
            ))}
          </>
        )}
    </>
  );
}

/** AT05.01–06 */
function ProgressPage() {
  const { db } = useStore();
  const { a, first } = useAthlete();
  useHuddleContext({ surface: 'athlete', title: `${first} · Progress`, athleteId: a.id, prompts: ['What can you help with?'] });
  const areas = db.areas.filter((x) => x.athleteId === a.id);
  const ms = db.milestones.filter((m) => m.athleteId === a.id && m.visibleToFamily);
  return (
    <>
      <Top />
      <h1 className="display display-lg m-section">Progress</h1>
      <FlowCode codes="AT05.01–05.06" />
      <section className="m-section stack gap-2">
        {areas.map((x) => (
          <div key={x.id} className="card row gap-3" style={x.status === 'achieved' ? { background: 'var(--lime-400)', color: 'var(--ink-950)', borderColor: 'var(--lime-400)' } : undefined}>
            {x.status === 'achieved' ? <Trophy size={22} /> : x.status === 'reopened' ? <RotateCcw size={22} color="#f2c14e" /> : <Crosshair size={22} color="var(--lime-400)" />}
            <span className="grow stack">
              <span className="strong">{x.title}</span>
              <span className="xs" style={{ color: x.status === 'achieved' ? 'var(--ink-700)' : 'var(--slate-400)' }}>
                {x.status === 'achieved' ? 'Achieved. Nice work.' : x.status === 'reopened' ? 'Back in focus: your coach wants to sharpen this again' : x.status === 'closed' ? 'Closed' : 'Working on it now'}
              </span>
            </span>
          </div>
        ))}
      </section>
      {ms.length > 0 && (
        <section className="m-section">
          <h2 className="small strong muted" style={{ marginBottom: 8 }}>Milestones <FlowCode codes="AT05.04" /></h2>
          {ms.map((m) => (
            <div key={m.id} className="card" style={{ background: 'linear-gradient(135deg, rgba(215,255,60,.18), transparent 60%), var(--ink-900)', marginBottom: 8 }}>
              <Trophy size={20} color="var(--lime-400)" />
              <p className="display display-md" style={{ marginTop: 8 }}>{m.title}</p>
              <p className="xs muted" style={{ marginTop: 6 }}>{fmtDate(m.date, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          ))}
        </section>
      )}
      <section className="m-section">
        <h2 className="small strong muted" style={{ marginBottom: 8 }}>Timeline <FlowCode codes="AT05.03" /></h2>
        <Timeline items={timelineFor(db, a.id, 'family')} />
      </section>
    </>
  );
}

/** AT01.01–06 */
function Access() {
  const { db } = useStore();
  const { a, first, viaParent } = useAthlete();
  const age = ageOn(a.born);
  const [signedIn, setSignedIn] = useState(false);
  useHuddleContext({ surface: 'athlete', title: 'Access', prompts: ['What can you help with?'] });
  return (
    <>
      <Top back="/athlete" />
      <h1 className="display display-lg m-section">Your access</h1>
      <FlowCode codes="AT01.01–01.06" />
      <section className="m-section card stack gap-2">
        <p className="small"><strong>{a.name}</strong> · age {age} · {db.academies.find((x) => x.id === a.academyId)?.name}</p>
        <p className="small muted">{a.access === 'direct' ? 'You have your own login.' : a.access === 'parent_device' ? 'You use FlowX on a parent’s device, signed in through their account.' : 'Athlete access isn’t enabled yet.'}</p>
        <Assumption code="AT01.01" />
      </section>
      {viaParent && (
        <section className="m-section">
          <Banner tone="info">
            {age >= 13 ? `${first} is ${age} and can get an own login. A guardian or the academy enables it. Until then, nothing changes.` : `${first} will be able to get an own login at 13.`} <FlowCode codes="AT01.04–01.05" />
          </Banner>
        </section>
      )}
      {a.access === 'direct' && (
        <section className="m-section stack gap-3">
          {signedIn ? <Banner tone="ok">Signed in (simulated).</Banner> : (
            <form className="stack gap-3" onSubmit={(e) => { e.preventDefault(); setSignedIn(true); }}>
              <div className="field"><label htmlFor="at-u">Username</label><input id="at-u" className="input" defaultValue="tara.singh" autoComplete="username" /></div>
              <div className="field"><label htmlFor="at-p">Password</label><input id="at-p" className="input" type="password" defaultValue="cricket-2026" autoComplete="current-password" /></div>
              <Button type="submit" variant="highlight" block>Sign in</Button>
              <p className="xs muted">Sign-in is simulated. <FlowCode codes="AT01.02–01.03" /></p>
            </form>
          )}
        </section>
      )}
      <section className="m-section">
        <p className="small muted">If you move to another academy, your new academy invites you again. Feedback from this academy stays here. <FlowCode codes="AT01.06" /></p>
      </section>
    </>
  );
}
