import { Route, Routes, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Users, ClipboardList, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { PhoneStage, StatusBar, MobileNav } from '../../components/chrome';
import { CompanionCanvas, CompanionIntro, SeamButton } from '../../companion/Companion';
import { CoachScoreReview } from './CoachScore';
import { Today } from './Today';
import { Sessions, SessionDetail, WrapUp } from './Sessions';
import { AthleteContext, AthletesList, GoalEditor, NewArea } from './Athlete';
import { TaskList, TaskDetail, HandoverNew, HandoverDetail } from './Tasks';
import { Capture, VideoReview } from './Capture';
import { Reassess } from './Reassess';
import { SyncQueue } from './Sync';
import { ContextSwitch } from './ContextSwitch';

export function CoachApp() {
  const loc = useLocation();
  const bodyRef = useRef<HTMLElement>(null);
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [loc.pathname]);

  return (
    <PhoneStage
      surface="coach"
      title="Coach Mobile"
      personas={[
        { personId: 'p-neha', label: 'Neha Rao', sub: 'coach, U16 Elite' },
        { personId: 'p-rohan', label: 'Rohan Shah', sub: 'head coach' },
        { personId: 'p-arjun', label: 'Arjun Patel', sub: 'temporary assistant' },
        { personId: 'p-sanjay', label: 'Sanjay Menon', sub: 'coach at Harbour, parent at Velocity' },
      ]}
      journeys={[
        { label: 'Today’s work', to: '/coach', codes: 'CM01.04 · CM02.01' },
        { label: 'Run the 16:00 session', to: '/coach/session/s-1005', codes: 'CM02 · CM03' },
        { label: 'Kabir’s context + dit voice note', to: '/coach/athlete/a-kabir?session=s-1005', codes: 'CM04 · CM05 · Flow E' },
        { label: 'Review Kabir’s Dit Score inputs', to: '/coach/athlete/a-kabir/score', codes: 'Score validation' },
        { label: 'Reassess Kabir', to: '/coach/reassess/r-1', codes: 'CM12' },
        { label: 'Capture video', to: '/coach/capture?mode=video', codes: 'CM10' },
        { label: 'Review a clip', to: '/coach/video/v-1', codes: 'CM11' },
        { label: 'Execute a task', to: '/coach/tasks/t-102', codes: 'CM08' },
        { label: 'Offline queue', to: '/coach/sync', codes: 'CM14 · XS04' },
        { label: 'Academy & role', to: '/coach/context', codes: 'CM01.02–03 · XS01' },
      ]}
    >
      <div className="m-app" data-theme="chalk" data-role="coach">
        <StatusBar />
        <main className="m-body" id="main" tabIndex={-1} ref={bodyRef}>
          <Routes>
            <Route index element={<Today />} />
            <Route path="context" element={<ContextSwitch />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="session/:id" element={<SessionDetail />} />
            <Route path="session/:id/wrap" element={<WrapUp />} />
            <Route path="athletes" element={<AthletesList />} />
            <Route path="athlete/:id" element={<AthleteContext />} />
            <Route path="athlete/:id/area/new" element={<NewArea />} />
            <Route path="athlete/:id/score" element={<CoachScoreReview />} />
            <Route path="goal/:id" element={<GoalEditor />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="handover/new" element={<HandoverNew />} />
            <Route path="handover/:id" element={<HandoverDetail />} />
            <Route path="capture" element={<Capture />} />
            <Route path="video/:id" element={<VideoReview />} />
            <Route path="reassess/:id" element={<Reassess />} />
            <Route path="sync" element={<SyncQueue />} />
          </Routes>
        </main>
        <SeamButton variant="fab" />
        <MobileNav
          items={[
            { to: '/coach', label: 'Today', icon: <Home size={20} />, end: true },
            { to: '/coach/sessions', label: 'Sessions', icon: <CalendarDays size={20} /> },
            { to: '/coach/capture', label: 'Capture a note or video', icon: <Plus size={24} />, capture: true },
            { to: '/coach/athletes', label: 'Athletes', icon: <Users size={20} /> },
            { to: '/coach/tasks', label: 'Tasks', icon: <ClipboardList size={20} /> },
          ]}
        />
        <CompanionCanvas variant="sheet" />
        <CompanionIntro surface="coach" />
      </div>
    </PhoneStage>
  );
}
