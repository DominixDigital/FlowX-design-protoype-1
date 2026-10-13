import { createNavigationContainerRef } from '@react-navigation/native';

/** Lets code outside screens (dit's buttons, notifications) navigate. */
export const navRef = createNavigationContainerRef<Record<string, object | undefined>>();

type Nav = (name: string, params?: object) => void;

/**
 * The shared data and the web prototype use paths like /athlete/score or /coach/athlete/a-kabir for notification
 * and dit links. This maps those paths onto the native navigators.
 */
export function goToPath(path: string, navigate?: Nav) {
  const nav: Nav = navigate ?? ((n, p) => { if (navRef.isReady()) (navRef.navigate as Nav)(n, p); });
  const [p, qs] = path.split('?');
  const seg = p.split('/').filter(Boolean);
  const q = new URLSearchParams(qs ?? '');
  const tab = (root: 'Athlete' | 'Coach', screen: string) => nav(root, { screen: 'Tabs', params: { screen } });
  const stack = (root: 'Athlete' | 'Coach', screen: string, params?: object) => nav(root, { screen, params });

  if (seg[0] === 'athlete') {
    const [, a, b] = seg;
    if (!a) return tab('Athlete', 'Home');
    if (a === 'practice') return tab('Athlete', 'Practice');
    if (a === 'progress') return tab('Athlete', 'Progress');
    if (a === 'score' && b === 'compare') return stack('Athlete', 'Compare');
    if (a === 'score') return tab('Athlete', 'Score');
    if (a === 'feedback' && b) return stack('Athlete', 'FeedbackDetail', { id: b });
    if (a === 'feedback') return tab('Athlete', 'Feedback');
    if (a === 'session' && b) return stack('Athlete', 'Session', { id: b });
    if (a === 'access') return stack('Athlete', 'Access');
    return tab('Athlete', 'Home');
  }
  if (seg[0] === 'coach') {
    const [, a, b, c] = seg;
    if (!a) return tab('Coach', 'Today');
    if (a === 'sessions') return tab('Coach', 'Sessions');
    if (a === 'athletes') return tab('Coach', 'Athletes');
    if (a === 'tasks' && b) return stack('Coach', 'TaskDetail', { id: b });
    if (a === 'tasks') return tab('Coach', 'Tasks');
    if (a === 'session' && b && c === 'wrap') return stack('Coach', 'WrapUp', { id: b });
    if (a === 'session' && b) return stack('Coach', 'SessionDetail', { id: b });
    if (a === 'athlete' && b && c === 'score') return stack('Coach', 'CoachScore', { id: b });
    if (a === 'athlete' && b) return stack('Coach', 'AthleteContext', { id: b, session: q.get('session') ?? undefined });
    if (a === 'reassess' && b) return stack('Coach', 'Reassess', { id: b });
    if (a === 'goal' && b) return stack('Coach', 'GoalEditor', { id: b });
    if (a === 'handover' && b === 'new') return stack('Coach', 'HandoverNew', { athleteId: q.get('athlete') ?? undefined });
    if (a === 'capture') return stack('Coach', 'Capture', { mode: q.get('mode') ?? 'note' });
    if (a === 'sync') return stack('Coach', 'Sync');
    if (a === 'context') return stack('Coach', 'Context');
    return tab('Coach', 'Today');
  }
}
