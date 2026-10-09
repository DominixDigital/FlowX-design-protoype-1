import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Crosshair, Dumbbell, MessageCircle, TrendingUp, Trophy, Check, Medal, Ban, Play, Pause, Smartphone, RotateCcw, ChevronRight, CalendarCheck } from 'lucide-react';
import { useStore, uid, nowISO } from '../../store/store';
import { TODAY } from '../../data/fixtures';
import { ageOn, athleteById, coachById, currentFocus, fmtDate, fmtTime, timelineFor, daysBetween, relDay } from '../../store/selectors';
import { PhoneStage, StatusBar, MobileNav, BackLink } from '../../components/chrome';
import { Assumption, AssumptionNote, Banner, Button, FlowCode, StateBlock, Timeline } from '../../components/ui';
import { Clip } from '../../components/art';
import { Seam } from '../../components/Seam';
import { CompanionCanvas, CompanionIntro, CompanionNudge, SeamButton, useCompanion, useCompanionContext } from '../../companion/Companion';
import { DitAvatar } from '../../companion/DitAvatar';
import { ScoreDiscs, DitChip } from '../../score/ScoreViz';
import { computeDitScore, scoreChange } from '../../score/ditScore';
import { ScorePage, ComparePage } from './AthleteScore';

export function useAthlete() {
  const { db, personas } = useStore();
  const person = db.people.find((p) => p.id === personas.athlete.personId)!;
  const a = athleteById(db, person.athleteId)!;
  return { person, a, first: a.name.split(' ')[0], viaParent: a.access === 'parent_device', age: ageOn(a.born) };
}

export function AthleteApp() {
  return (
    <PhoneStage
      surface="athlete"
      title="Athlete App"
      personas={[{ personId: 'p-tara', label: 'Tara Singh', sub: 'own login, U14' }, { personId: 'p-kabir', label: 'Kabir Singh', sub: 'on a parent’s device' }]}
      journeys={[
        { label: 'Meet dit (first run)', to: '/athlete?intro=1', codes: 'Flow A' },
        { label: 'Session: explain my mistake', to: '/athlete/session/s-0991', codes: 'Flow B · AT04' },
        { label: 'Understand my Dit Score', to: '/athlete/score', codes: 'Flow C' },
        { label: 'Milestone celebration', to: '/athlete?milestone=1', codes: 'Flow D' },
        { label: 'Squad comparison', to: '/athlete/score/compare', codes: 'Flow G' },
        { label: 'Practice and mark done', to: '/athlete/practice', codes: 'AT03' },
        { label: 'Progress timeline', to: '/athlete/progress', codes: 'AT05' },
        { label: 'Access and sign-in', to: '/athlete/access', codes: 'AT01' },
      ]}
    >
      <div className="m-app" data-theme="chalk" data-role="athlete">
        <StatusBar />
        <main className="m-body" id="main" tabIndex={-1}>
          <Routes>
            <Route index element={<FocusHome />} />
            <Route path="access" element={<Access />} />
            <Route path="practice" element={<Practice />} />
            <Route path="session/:id" element={<SessionSummary />} />
            <Route path="score" element={<ScorePage />} />
            <Route path="score/compare" element={<ComparePage />} />
            <Route path="feedback" element={<FeedbackList />} />
            <Route path="feedback/:id" element={<FeedbackDetail />} />
            <Route path="progress" element={<ProgressPage />} />
          </Routes>
        </main>
        <SeamButton variant="fab" />
        <MobileNav items={[
          { to: '/athlete', label: 'Home', icon: <Crosshair size={20} />, end: true },
          { to: '/athlete/practice', label: 'Practice', icon: <Dumbbell size={20} /> },
          { to: '/athlete/score', label: 'Dit Score', icon: <span className="nav-dits" aria-hidden><i /><i /></span> },
          { to: '/athlete/feedback', label: 'Feedback', icon: <MessageCircle size={20} /> },
          { to: '/athlete/progress', label: 'Progress', icon: <TrendingUp size={20} /> },
        ]} />
        <CompanionCanvas variant="sheet" />
        <CompanionIntro surface="athlete" />
      </div>
    </PhoneStage>
  );
}

export function Top({ back, title }: { back?: string; title?: string }) {
  const { db } = useStore();
  const { a, first, viaParent } = useAthlete();
  const nav = useNavigate();
  return (
    <div className="m-top" style={{ margin: '0 calc(var(--s-4) * -1)', position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)' }}>
      {back ? <BackLink to={back} /> : <span className="grow strong">{title ?? `Hi, ${first}`}</span>}
      {back && <span className="grow" />}
      {viaParent && <span className="badge badge-outline" title="Signed in on a parent’s device"><Smartphone size={12} /> Parent’s device</span>}
      <DitChip db={db} athleteId={a.id} onClick={() => nav('/athlete/score')} />
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
        <span key={i} className={`week-dot${i < done ? ' is-done' : ''}`}>{i < done && <Check size={14} />}</span>
      ))}
      <span className="small" style={{ marginLeft: 6 }}>{done}/{target} this week</span>
    </div>
  );
}

/** AT02.01–06 + Dit Score hero + session nudge + milestone celebration (Flow D) */
function FocusHome() {
  const { db, update } = useStore();
  const { a, first } = useAthlete();
  const { openCompanion } = useCompanion();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { area, goal } = currentFocus(db, a.id);
  const tip = db.feedback.filter((f) => f.athleteId === a.id && f.status === 'published').sort((x, y) => y.publishedAt.localeCompare(x.publishedAt))[0];
  const comp = db.competitions.filter((c) => c.athleteIds.includes(a.id) && c.status !== 'completed').sort((x, y) => x.date.localeCompare(y.date))[0];
  const st = computeDitScore(db, a.id);
  const ch = scoreChange(db, a.id);
  const lastSession = db.sessions.filter((s) => s.status === 'completed' && s.attendance[a.id] === 'present').sort((x, y) => y.date.localeCompare(x.date))[0];
  const sessionFb = lastSession && db.feedback.some((f) => f.athleteId === a.id && f.sessionId === lastSession.id && f.status === 'published');
  const prefs = db.scorePrefs[a.id];
  const unseen = db.milestones.filter((m) => m.athleteId === a.id && m.visibleToFamily && !prefs?.seenMilestoneIds.includes(m.id)).sort((x, y) => y.date.localeCompare(x.date))[0];
  useCompanionContext({ surface: 'athlete', title: `${first} · Home`, athleteId: a.id, prompts: ['What’s my Dit Score?', 'Why did my Dit Score change?'] });

  // Prototype journey shortcuts: replay the intro or a milestone
  useEffect(() => {
    if (params.get('intro')) update((d) => { delete d.companionPrefs[`athlete:${db.people.find((p) => p.athleteId === a.id)?.id}`]; });
    if (params.get('milestone') && a.id === 'a-tara') update((d) => { const p = d.scorePrefs['a-tara']; if (p) p.seenMilestoneIds = p.seenMilestoneIds.filter((x) => x !== 'm-3'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Top />
      <section className="m-section score-hero" data-theme="floodlit" data-role="athlete">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div>
            <p className="xs strong" style={{ color: 'var(--text-muted)' }}>Your Dit Score</p>
            {st.kind === 'scored' && ch && (
              <p className="small" style={{ marginTop: 4 }}>{ch.delta > 0 ? `▲ ${ch.delta}` : ch.delta < 0 ? `▼ ${-ch.delta}` : 'Steady'} since {fmtDate(ch.since)}</p>
            )}
            {st.kind === 'building' && <p className="small" style={{ marginTop: 4, maxWidth: '22ch' }}>Building — needs {st.missing[0]}</p>}
          </div>
          <span className="badge badge-outline">Illustrative</span>
        </div>
        <Link to="/athlete/score" aria-label="Open my Dit Score" style={{ display: 'grid', placeItems: 'center' }}><ScoreDiscs state={st} size={230} /></Link>
        <div className="row gap-2">
          <button className="choice" onClick={() => openCompanion({ ask: st.kind === 'scored' && ch ? 'Why did my Dit Score change?' : 'What’s my Dit Score?' })}>{st.kind === 'scored' && ch ? 'Why did it change?' : 'What is this?'}</button>
          <Link className="choice" to="/athlete/score" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Details</Link>
        </div>
      </section>

      {lastSession && (
        <Link to={`/athlete/session/${lastSession.id}`} className="m-section card card-link row gap-3">
          <CalendarCheck size={20} />
          <span className="grow stack"><span className="xs muted">Last session · {relDay(lastSession.date)}</span><span className="small strong">{lastSession.title}</span><span className="xs muted">{sessionFb ? 'Your coach shared feedback' : 'No feedback shared yet'}</span></span>
          <ChevronRight size={16} />
        </Link>
      )}

      <section className="m-section">
        <p className="xs strong muted">Your focus <FlowCode codes="AT02.01" /></p>
        {area ? <h1 className="display" style={{ fontSize: '2.6rem', marginTop: 6 }}>{area.title}</h1> : <h1 className="display display-lg">No focus set yet</h1>}
        {goal && <p className="small muted" style={{ marginTop: 8 }}>Goal: {goal.title} <FlowCode codes="AT02.02" /></p>}
      </section>

      {goal?.drill && (
        <Link to="/athlete/practice" className="m-section card card-link stack gap-3" style={{ display: 'flex' }}>
          <span className="xs strong muted">Next practice <FlowCode codes="AT02.03" /></span>
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

      {comp && (
        <section className="m-section card row gap-3">
          <Medal size={20} />
          <span className="grow stack"><span className="small strong">{comp.name}</span><span className="xs muted">{fmtDate(comp.date, { weekday: 'short', day: 'numeric', month: 'short' })}{comp.status === 'changed' ? ' · changed' : ''}</span></span>
          <Assumption code="AT02.06" />
        </section>
      )}

      {sessionFb && !unseen && (
        <CompanionNudge id={`session-${lastSession.id}`} surface="athlete" text={`Good session${lastSession.date === TODAY ? ' today' : ''}! Want to see what improved?`} ask="How was my session?" />
      )}
      {unseen && <MilestoneCelebration milestoneId={unseen.id} onDone={() => nav('/athlete')} />}
    </>
  );
}

/** Flow D — a coach-verified milestone: celebrate, explain, optionally share. */
function MilestoneCelebration({ milestoneId, onDone }: { milestoneId: string; onDone: () => void }) {
  const { db, update, toast } = useStore();
  const { a, first, age } = useAthlete();
  const m = db.milestones.find((x) => x.id === milestoneId)!;
  const area = db.areas.find((x) => x.id === m.areaId);
  const [step, setStep] = useState<'celebrate' | 'share'>('celebrate');
  const needsGuardian = age < 16;
  const done = (shared?: 'requested' | 'squad') => {
    update((d) => {
      const p = d.scorePrefs[a.id] ?? (d.scorePrefs[a.id] = { visibility: 'family', comparisonOptIn: false, seenMilestoneIds: [], shareRequests: [] });
      p.seenMilestoneIds.push(milestoneId);
      if (shared === 'requested') {
        const rid = uid('sr');
        p.shareRequests.push({ id: rid, milestoneId, status: 'pending', at: nowISO() });
        for (const g of athleteById(d, a.id)!.guardianIds) d.notifications.push({ id: uid('n'), personId: g, kind: 'share', title: `${first} wants to share a milestone`, body: m.title, route: '/parent', target: { type: 'share', id: rid }, createdAt: nowISO(), read: false });
      }
    });
    if (shared === 'requested') toast({ tone: 'ok', text: 'Asked a parent to approve. Nothing is shared until they say yes.' });
    if (shared === 'squad') toast({ tone: 'ok', text: 'Shared with your squad inside ditdit.' });
    onDone();
  };
  return (
    <>
      <div className="scrim" aria-hidden />
      <section className="sheet milestone-sheet" data-theme="floodlit" data-role="athlete" role="dialog" aria-modal="true" aria-labelledby="ms-h">
        <div className="sheet-grip" />
        <div className="sheet-body stack gap-4" style={{ textAlign: 'center', alignItems: 'center' }}>
          <DitAvatar state="celebrating" form="face" size={72} />
          <p className="xs strong" style={{ color: 'var(--text-muted)' }}>Milestone · confirmed by {coachById(db, area?.ownerId ?? 'c-rohan')?.name ?? 'your coach'} · {fmtDate(m.date)}</p>
          <h2 id="ms-h" className="display" style={{ fontSize: '2.2rem' }}>{m.title}</h2>
          {step === 'celebrate' ? (
            <>
              <div className="obj-say" style={{ textAlign: 'left' }}>
                <DitAvatar state="explaining" form="compact" size={26} still />
                <p>{area ? `This is real progress on ${area.title.toLowerCase()}. ` : ''}It counts towards your Dit Score as a coach-confirmed milestone.</p>
              </div>
              <div className="row gap-2 wrap" style={{ justifyContent: 'center' }}>
                <Button variant="highlight" onClick={() => setStep('share')}>Share it</Button>
                <Button onClick={() => done()}>Keep it to myself</Button>
              </div>
            </>
          ) : (
            <>
              <div className="share-card" aria-label="Preview of the milestone card">
                <span className="dc-dots" aria-hidden><i /><i /></span>
                <strong>{first} · {m.title}</strong>
                <span className="xs">Confirmed by the coach · {fmtDate(m.date)} · ditdit</span>
              </div>
              <p className="small muted">Only your squad and family can see shared milestones. There are no likes or public counts.</p>
              {needsGuardian ? (
                <Button variant="highlight" onClick={() => done('requested')}>Ask a parent to approve</Button>
              ) : (
                <Button variant="highlight" onClick={() => done('squad')}>Share with my squad</Button>
              )}
              <Button variant="ghost" onClick={() => done()}>Not now</Button>
              {needsGuardian && <p className="xs muted">Under 16, a parent approves before anything is shared. Assumption DS-06.</p>}
            </>
          )}
        </div>
      </section>
    </>
  );
}

/** Flow B — session summary as a guided conversation over coach-approved items only. */
function SessionSummary() {
  const { id } = useParams();
  const { db } = useStore();
  const { a, first } = useAthlete();
  const { openCompanion } = useCompanion();
  const s = db.sessions.find((x) => x.id === id);
  const fb = db.feedback.filter((f) => f.athleteId === a.id && f.sessionId === id && f.status === 'published');
  useCompanionContext(s ? { surface: 'athlete', title: `${first} · ${s.title}`, athleteId: a.id, sessionId: s.id, prompts: ['How was my session?', 'What should I improve?'] } : null);
  if (!s || s.attendance[a.id] === undefined) return <><Top back="/athlete" /><div className="m-section"><StateBlock kind="archived" title="This session isn’t available" /></div></>;
  const mark = s.attendance[a.id];
  return (
    <>
      <Top back="/athlete" />
      <section className="m-section">
        <p className="small muted">{fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="display display-lg">{s.title}</h1>
        <p className="small" style={{ marginTop: 6 }}>{mark === 'present' ? 'You were there' : mark === 'absent' ? 'Marked absent' : 'Not marked yet'} · <FlowCode codes="Flow B · AT04" /></p>
      </section>
      <section className="m-section score-hero" data-theme="floodlit" data-role="athlete">
        <div className="obj-say">
          <DitAvatar state={fb.length ? 'insight' : 'uncertain'} form="face" size={44} />
          <p>{fb.length ? `Good session${mark === 'present' ? '' : ''}! Your coach shared feedback. Want to see what improved?` : 'Your coach hasn’t shared feedback for this session yet. I only talk about what your coach approves.'}</p>
        </div>
        {fb.length > 0 && (
          <div className="obj-choices">
            <button className="choice" onClick={() => openCompanion({ ask: 'What improved?' })}>Show me</button>
            <button className="choice" onClick={() => openCompanion({ ask: 'What should I improve?' })}>What should I improve?</button>
          </div>
        )}
      </section>
      {fb.map((f) => (
        <Link key={f.id} to={`/athlete/feedback/${f.id}`} className="m-section card card-link" style={{ display: 'block' }}>
          <p className="xs strong muted">From {coachById(db, f.coachId)?.name}{f.aiDrafted ? ' · drafted with dit, approved by your coach' : ''}</p>
          <p style={{ marginTop: 6 }}>“{f.text}”</p>
          {f.videoId && <p className="xs muted" style={{ marginTop: 6 }}>Includes a clip with coach notes</p>}
        </Link>
      ))}
      <p className="xs muted m-section">Only coach-approved feedback appears here. Raw coach notes stay with your coaches.</p>
    </>
  );
}

export const _athleteIcons = { Trophy, Seam };

/** AT03.01–06 */
function Practice() {
  const { db, update, toast } = useStore();
  const { a, first } = useAthlete();
  const { goal } = currentFocus(db, a.id);
  const [seen, setSeen] = useState<string | null>(() => { try { return localStorage.getItem(`ditdit-proto-v2:seen-drill:${a.id}`); } catch { return null; } });
  const video = goal ? db.videos.find((v) => v.goalId === goal.id && v.share === 'shared') : undefined;
  useCompanionContext({ surface: 'athlete', title: `${first} · Practice`, athleteId: a.id, videoId: video?.id, prompts: video ? ['Explain my coach’s comment'] : ['What can you help with?'] });
  const drillKey = goal?.drill ? `${goal.id}:${goal.drill.name}` : null;
  const changed = !!(drillKey && seen && seen !== drillKey);
  useEffect(() => { if (drillKey && !seen) { setSeen(drillKey); try { localStorage.setItem(`ditdit-proto-v2:seen-drill:${a.id}`, drillKey); } catch { /* ignore */ } } }, [drillKey, seen, a.id]);
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
              <Banner tone="warn" action={<Button size="sm" onClick={() => { setSeen(drillKey); try { localStorage.setItem(`ditdit-proto-v2:seen-drill:${a.id}`, drillKey!); } catch { /* ignore */ } }}>Got it</Button>}>
                Your coach changed this drill since you last looked. <FlowCode codes="AT03.06" />
              </Banner>
            </div>
          )}
          <section className="m-section card stack gap-3" style={{ borderColor: 'var(--hl)' }}>
            <p className="xs strong" style={{ color: 'var(--hl)' }}>Drill · {goal.drill.frequency} <FlowCode codes="AT03.02" /></p>
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
  useCompanionContext({ surface: 'athlete', title: `${first} · Feedback`, athleteId: a.id, prompts: ['What can you help with?'] });
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
  const h = useCompanion();
  const f = db.feedback.find((x) => x.id === id && x.athleteId === a.id);
  const v = f?.videoId ? db.videos.find((x) => x.id === f.videoId) : undefined;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const shared = v ? v.comments.filter((c) => c.shared).sort((x, y) => x.t - y.t) : [];
  const active = shared.filter((c) => c.t <= t).pop();
  useCompanionContext(f && f.status === 'published' ? {
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
              <p className="xs strong" style={{ color: 'var(--hl)' }}>{coachById(db, f.coachId)?.name} · {fmtDate(f.publishedAt)} <FlowCode codes="AT04.02" /></p>
              <p className="h2" style={{ marginTop: 6 }}>“{f.text}”</p>
            </section>
            {v && (v.share === 'withdrawn' ? <div className="m-section"><StateBlock kind="withdrawn" title="Clip withdrawn" body="Your coach withdrew this clip." /></div> : (
              <section className="m-section stack gap-2">
                <FlowCode codes="AT04.03–04.04" />
                <div style={{ position: 'relative' }}>
                  <Clip video={v} compact />
                  {active && <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(11,19,15,.85)', fontSize: 13 }}><strong style={{ color: 'var(--hl)' }}>{fmtTime(active.t)}</strong> {active.text}</div>}
                </div>
                <div className="row gap-2">
                  <button className="btn btn-icon btn-sm" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
                  <div className="scrubber grow">
                    <div className="scrubber-track" />
                    <div className="scrubber-fill" style={{ width: `${(t / v.duration) * 100}%`, background: 'var(--grey-50)' }} />
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
                <button className="card card-link row gap-3" onClick={() => h.openCompanion({ ask: 'Explain my coach’s comment' })} style={{ borderColor: 'var(--hl)' }}>
                  <span style={{ color: 'var(--hl)' }}><Seam state="insight" size={28} /></span>
                  <span className="grow stack" style={{ textAlign: 'left' }}><span className="strong">What should I copy from this?</span><span className="xs muted">dit turns the coach’s comment into a practice cue.</span></span>
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
  useCompanionContext({ surface: 'athlete', title: `${first} · Progress`, athleteId: a.id, prompts: ['What can you help with?'] });
  const areas = db.areas.filter((x) => x.athleteId === a.id);
  const ms = db.milestones.filter((m) => m.athleteId === a.id && m.visibleToFamily);
  return (
    <>
      <Top />
      <h1 className="display display-lg m-section">Progress</h1>
      <FlowCode codes="AT05.01–05.06" />
      <section className="m-section stack gap-2">
        {areas.map((x) => (
          <div key={x.id} className="card row gap-3" style={x.status === 'achieved' ? { background: 'var(--hl)', color: 'var(--char-700)', borderColor: 'var(--hl)' } : undefined}>
            {x.status === 'achieved' ? <Trophy size={22} /> : x.status === 'reopened' ? <RotateCcw size={22} color="var(--warn)" /> : <Crosshair size={22} color="var(--hl)" />}
            <span className="grow stack">
              <span className="strong">{x.title}</span>
              <span className="xs" style={{ color: x.status === 'achieved' ? 'var(--char-400)' : 'var(--grey-600)' }}>
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
            <div key={m.id} className="card" data-theme="floodlit" data-role="athlete" style={{ background: 'linear-gradient(135deg, rgba(204,204,204,.22), transparent 60%), var(--char-500)', marginBottom: 8 }}>
              <Trophy size={20} color="var(--hl)" />
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
  useCompanionContext({ surface: 'athlete', title: 'Access', prompts: ['What can you help with?'] });
  return (
    <>
      <Top back="/athlete" />
      <h1 className="display display-lg m-section">Your access</h1>
      <FlowCode codes="AT01.01–01.06" />
      <section className="m-section card stack gap-2">
        <p className="small"><strong>{a.name}</strong> · age {age} · {db.academies.find((x) => x.id === a.academyId)?.name}</p>
        <p className="small muted">{a.access === 'direct' ? 'You have your own login.' : a.access === 'parent_device' ? 'You use ditdit on a parent’s device, signed in through their account.' : 'Athlete access isn’t enabled yet.'}</p>
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
