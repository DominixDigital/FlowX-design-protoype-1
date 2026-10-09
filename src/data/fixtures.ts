import type {
  Academy, Athlete, Batch, Coach, Competition, DevArea, Feedback, Goal, Handover, Milestone,
  Notification, Observation, Person, PracticeLog, Reassessment, Report, Session, Task, Video,
} from './types';

/** The prototype clock is frozen so fixtures stay coherent. */
export const TODAY = '2026-10-09';

export const academies: Academy[] = [
  {
    id: 'ac-velocity',
    name: 'Velocity Cricket Academy',
    sport: 'Cricket',
    locations: [
      { id: 'loc-main', name: 'Main Ground', status: 'active' },
      { id: 'loc-nets', name: 'Indoor Nets', status: 'active' },
      { id: 'loc-east', name: 'East Field', status: 'inactive' },
    ],
    setup: { step: 4, completed: true },
  },
  {
    id: 'ac-harbour',
    name: 'Harbour Cricket Club',
    sport: 'Cricket',
    locations: [{ id: 'loc-harbour', name: 'Harbour Oval', status: 'active' }],
    setup: { step: 4, completed: true },
  },
];

export const people: Person[] = [
  { id: 'p-asha', name: 'Asha Mehta', memberships: [{ academyId: 'ac-velocity', role: 'owner', status: 'active' }] },
  {
    id: 'p-rohan', name: 'Rohan Shah', coachId: 'c-rohan',
    memberships: [{ academyId: 'ac-velocity', role: 'head_coach', status: 'active' }],
  },
  {
    id: 'p-neha', name: 'Neha Rao', coachId: 'c-neha',
    memberships: [{ academyId: 'ac-velocity', role: 'coach', status: 'active' }],
  },
  {
    id: 'p-arjun', name: 'Arjun Patel', coachId: 'c-arjun',
    memberships: [{ academyId: 'ac-velocity', role: 'assistant', status: 'active', expiresOn: '2026-10-31' }],
  },
  {
    id: 'p-maya', name: 'Maya Singh', childIds: ['a-kabir', 'a-tara'],
    memberships: [{ academyId: 'ac-velocity', role: 'parent', status: 'active' }],
  },
  {
    id: 'p-tara', name: 'Tara Singh', athleteId: 'a-tara',
    memberships: [{ academyId: 'ac-velocity', role: 'athlete', status: 'active' }],
  },
  {
    id: 'p-kabir', name: 'Kabir Singh', athleteId: 'a-kabir',
    memberships: [{ academyId: 'ac-velocity', role: 'athlete', status: 'active' }],
  },
  {
    // Multi-role fixture: parent at Velocity, coach at Harbour (XS01.03 / XS01.04)
    id: 'p-sanjay', name: 'Sanjay Menon', coachId: 'c-sanjay', childIds: ['a-ishaan'],
    memberships: [
      { academyId: 'ac-velocity', role: 'parent', status: 'active' },
      { academyId: 'ac-harbour', role: 'coach', status: 'active' },
    ],
  },
];

export const coaches: Coach[] = [
  { id: 'c-rohan', personId: 'p-rohan', academyId: 'ac-velocity', name: 'Rohan Shah', role: 'head_coach', status: 'active' },
  { id: 'c-neha', personId: 'p-neha', academyId: 'ac-velocity', name: 'Neha Rao', role: 'coach', status: 'active' },
  {
    id: 'c-arjun', personId: 'p-arjun', academyId: 'ac-velocity', name: 'Arjun Patel', role: 'assistant',
    status: 'active', tempAccessUntil: '2026-10-31',
  },
  { id: 'c-vikram', personId: 'p-vikram', academyId: 'ac-velocity', name: 'Vikram Desai', role: 'coach', status: 'inactive' },
  { id: 'c-leena', personId: 'p-leena', academyId: 'ac-velocity', name: 'Leena Fernandes', role: 'coach', status: 'invited' },
  { id: 'c-sanjay', personId: 'p-sanjay', academyId: 'ac-harbour', name: 'Sanjay Menon', role: 'coach', status: 'active' },
];

export const batches: Batch[] = [
  { id: 'b-u16', academyId: 'ac-velocity', name: 'U16 Elite', coachIds: ['c-neha'], assistantIds: ['c-arjun'], status: 'active' },
  { id: 'b-u14', academyId: 'ac-velocity', name: 'U14 Foundation', coachIds: ['c-rohan'], assistantIds: [], status: 'active' },
  { id: 'b-summer', academyId: 'ac-velocity', name: 'Summer Camp 2026', coachIds: ['c-vikram'], assistantIds: [], status: 'archived' },
];

const ath = (a: Partial<Athlete> & Pick<Athlete, 'id' | 'name' | 'born' | 'batchId'>): Athlete => ({
  academyId: 'ac-velocity', primaryCoachId: 'c-neha', supportingCoachIds: [], status: 'active',
  guardianIds: [], discipline: 'Batter', access: 'none', ...a,
});

export const athletes: Athlete[] = [
  ath({ id: 'a-kabir', name: 'Kabir Singh', born: '2011-03-14', batchId: 'b-u16', guardianIds: ['p-maya'], discipline: 'Top-order batter', access: 'parent_device', supportingCoachIds: ['c-arjun'] }),
  ath({ id: 'a-zoya', name: 'Zoya Khan', born: '2010-11-02', batchId: 'b-u16', discipline: 'Left-arm seam' }),
  ath({ id: 'a-ishaan', name: 'Ishaan Verma', born: '2011-06-21', batchId: 'b-u16', guardianIds: ['p-sanjay'], discipline: 'Wicketkeeper-batter' }),
  ath({ id: 'a-aarav', name: 'Aarav Nair', born: '2010-08-09', batchId: 'b-u16', discipline: 'Off-spin all-rounder' }),
  ath({ id: 'a-meera', name: 'Meera Iyer', born: '2011-01-30', batchId: 'b-u16', discipline: 'Opening batter' }),
  ath({ id: 'a-dev', name: 'Dev Malhotra', born: '2010-12-17', batchId: 'b-u16', discipline: 'Fast bowler' }),
  ath({ id: 'a-riya', name: 'Riya Kapoor', born: '2012-05-05', batchId: 'b-u14', primaryCoachId: 'c-rohan', discipline: 'Leg-spin' }),
  ath({ id: 'a-riya2', name: 'Riya Kapur', born: '2012-05-05', batchId: null, primaryCoachId: null, status: 'duplicate_suspected', duplicateOf: 'a-riya', discipline: 'Leg-spin' }),
  ath({ id: 'a-tara', name: 'Tara Singh', born: '2013-02-11', batchId: 'b-u14', primaryCoachId: 'c-rohan', guardianIds: ['p-maya'], discipline: 'Middle-order batter', access: 'direct' }),
  ath({ id: 'a-omar', name: 'Omar Siddiqui', born: '2012-09-28', batchId: 'b-u14', primaryCoachId: 'c-rohan', discipline: 'Medium pace' }),
  ath({ id: 'a-sameer', name: 'Sameer Joshi', born: '2010-04-04', batchId: null, primaryCoachId: null, status: 'archived', discipline: 'Batter' }),
  ath({ id: 'a-ananya', name: 'Ananya Bose', born: '2011-07-19', batchId: null, primaryCoachId: null, status: 'transferred', discipline: 'Off-spin' }),
];

const u16 = ['a-kabir', 'a-zoya', 'a-ishaan', 'a-aarav', 'a-meera', 'a-dev'];
const u14 = ['a-riya', 'a-tara', 'a-omar'];
const marks = (ids: string[], absent: string[] = []) =>
  Object.fromEntries(ids.map((id) => [id, absent.includes(id) ? 'absent' : 'present'])) as Session['attendance'];
const unmarked = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, 'unmarked'])) as Session['attendance'];

export const sessions: Session[] = [
  { id: 's-1002', batchId: 'b-u16', title: 'Front-foot batting block', date: '2026-10-02', start: '16:00', end: '17:30', locationId: 'loc-nets', coachId: 'c-neha', status: 'completed', plan: 'Throwdowns, front-foot drive, head-position work.', attendance: marks(u16, ['a-dev']), attendanceSync: 'synced', walkIns: [] },
  { id: 's-1003', batchId: 'b-u16', title: 'Match simulation', date: '2026-10-05', start: '08:00', end: '10:30', locationId: 'loc-main', coachId: 'c-neha', status: 'completed', plan: '20-over centre-wicket game with scenarios.', attendance: marks(u16, ['a-meera']), attendanceSync: 'synced', walkIns: [] },
  { id: 's-1004', batchId: 'b-u16', title: 'Spin play in the nets', date: '2026-10-07', start: '16:00', end: '17:30', locationId: 'loc-nets', coachId: 'c-neha', status: 'completed', plan: 'Footwork against spin, sweep options.', attendance: marks(u16, ['a-kabir']), attendanceSync: 'synced', walkIns: [] },
  { id: 's-1005', batchId: 'b-u16', title: 'Front-foot drive & balance', date: TODAY, start: '16:00', end: '17:30', locationId: 'loc-nets', coachId: 'c-neha', status: 'scheduled', plan: 'Warm-up, throwdowns on the drive with a still head, 2× six-ball challenges, cool-down.', attendance: unmarked(u16), attendanceSync: 'synced', walkIns: [] },
  { id: 's-1006', batchId: 'b-u14', title: 'Fielding fundamentals', date: TODAY, start: '17:45', end: '19:00', locationId: 'loc-main', coachId: 'c-rohan', status: 'scheduled', plan: 'Ground fielding, long barrier, throwing at one stump.', attendance: unmarked(u14), attendanceSync: 'synced', walkIns: [] },
  { id: 's-1007', batchId: 'b-u16', title: 'Bowling workloads', date: '2026-10-10', start: '08:00', end: '09:30', locationId: 'loc-main', coachId: 'c-neha', status: 'scheduled', plan: 'Seam bowlers: controlled spells, run-up rhythm.', attendance: unmarked(u16), attendanceSync: 'synced', walkIns: [] },
  { id: 's-0990', batchId: 'b-u14', title: 'Running between wickets', date: '2026-10-03', start: '17:45', end: '19:00', locationId: 'loc-main', coachId: 'c-rohan', status: 'completed', plan: 'Calling, turning, backing up.', attendance: marks(u14, []), attendanceSync: 'synced', walkIns: [] },
  { id: 's-0991', batchId: 'b-u14', title: 'Batting against short balls', date: '2026-10-06', start: '17:45', end: '19:00', locationId: 'loc-nets', coachId: 'c-rohan', status: 'completed', plan: 'Tennis-ball short-pitch work.', attendance: marks(u14, ['a-omar']), attendanceSync: 'synced', walkIns: [] },
];

export const areas: DevArea[] = [
  { id: 'da-kabir-head', athleteId: 'a-kabir', title: 'Head position on the front-foot drive', status: 'active', priority: 'high', openedAt: '2026-09-02', ownerId: 'c-neha' },
  { id: 'da-kabir-run', athleteId: 'a-kabir', title: 'Calling and running between wickets', status: 'achieved', priority: 'normal', openedAt: '2026-06-10', ownerId: 'c-neha' },
  { id: 'da-zoya-runup', athleteId: 'a-zoya', title: 'Run-up rhythm', status: 'active', priority: 'normal', openedAt: '2026-09-15', ownerId: 'c-neha' },
  { id: 'da-ishaan-gather', athleteId: 'a-ishaan', title: 'Glovework: taking the ball late', status: 'active', priority: 'high', openedAt: '2026-08-28', ownerId: 'c-neha' },
  { id: 'da-tara-short', athleteId: 'a-tara', title: 'Playing the short ball', status: 'active', priority: 'high', openedAt: '2026-09-08', ownerId: 'c-rohan' },
  { id: 'da-tara-calling', athleteId: 'a-tara', title: 'Calling clearly', status: 'reopened', priority: 'normal', openedAt: '2026-05-20', ownerId: 'c-rohan' },
  { id: 'da-dev-landing', athleteId: 'a-dev', title: 'Front-foot landing', status: 'active', priority: 'normal', openedAt: '2026-09-20', ownerId: 'c-neha' },
];

export const goals: Goal[] = [
  {
    id: 'g-kabir-head', areaId: 'da-kabir-head', title: 'Eyes level over the front knee at contact',
    target: '8 of 10 throwdowns with head still at contact, two sessions in a row',
    nextAction: 'Six-ball challenge on the drive with a still head',
    drill: { name: 'Tee drive with head marker', instructions: 'Ball on a tee at full length. Partner holds a cone at eye height; hit 3 sets of 10 without your head dropping past the cone.', frequency: '3× a week' },
    status: 'active',
  },
  {
    id: 'g-kabir-run', areaId: 'da-kabir-run', title: 'Call every run loud and early',
    target: 'No run-out confusion across 4 match sims', nextAction: '', drill: null, status: 'achieved',
  },
  {
    id: 'g-tara-short', areaId: 'da-tara-short', title: 'Get inside the line and sway under the bouncer',
    target: 'Leave or sway safely under 9 of 10 short balls', nextAction: 'Tennis-ball sway ladder',
    drill: { name: 'Sway ladder', instructions: 'Partner throws tennis balls at shoulder height; sway inside the line, eyes on the ball, 4 sets of 6.', frequency: '2× a week' },
    status: 'active',
  },
  {
    id: 'g-zoya-runup', areaId: 'da-zoya-runup', title: 'Consistent 12-step run-up',
    target: 'No front-foot no-balls across a 6-over spell', nextAction: 'Mark run-up with cones every session',
    drill: { name: 'Cone run-up', instructions: 'Run through cones at steps 4, 8, 12 for 3 sets of 6 deliveries.', frequency: 'Every session' },
    status: 'active',
  },
  {
    id: 'g-ishaan-gather', areaId: 'da-ishaan-gather', title: 'Let the ball come; soft hands below the eyes',
    target: 'Clean takes on 18 of 20 standing-up deliveries', nextAction: 'Rebound-net takes', drill: null, status: 'active',
  },
  {
    id: 'g-dev-landing', areaId: 'da-dev-landing', title: 'Land front foot pointing to fine leg',
    target: 'Coach video check on 3 consecutive sessions', nextAction: 'Landing-mat drill', drill: null, status: 'active',
  },
];

export const observations: Observation[] = [
  { id: 'o-1', athleteId: 'a-kabir', sessionId: 's-1002', areaId: 'da-kabir-head', text: 'Head falls to the off side on the drive once he reaches for the ball. Better when the ball is in his arc.', source: 'typed', aiDrafted: false, authorId: 'c-neha', createdAt: '2026-10-02T16:42', sync: 'synced', status: 'saved' },
  { id: 'o-2', athleteId: 'a-kabir', sessionId: 's-1003', areaId: 'da-kabir-head', text: 'In the match sim he got stuck on the crease twice; the head was still on the drive he did play — 2 clean drives.', source: 'voice', aiDrafted: true, authorId: 'c-neha', createdAt: '2026-10-05T09:15', sync: 'synced', status: 'saved' },
  { id: 'o-3', athleteId: 'a-kabir', sessionId: 's-1003', areaId: null, text: 'Calling much louder now. Took a quick single to point with confidence.', source: 'typed', aiDrafted: false, authorId: 'c-arjun', createdAt: '2026-10-05T10:02', sync: 'synced', status: 'saved' },
  { id: 'o-4', athleteId: 'a-zoya', sessionId: 's-1003', areaId: 'da-zoya-runup', text: 'Two no-balls in the second spell. Run-up stretches when tired.', source: 'typed', aiDrafted: false, authorId: 'c-neha', createdAt: '2026-10-05T09:40', sync: 'synced', status: 'saved' },
  { id: 'o-5', athleteId: 'a-tara', sessionId: 's-0991', areaId: 'da-tara-short', text: 'Turned her back on two short balls. Swayed well once she picked up the length early.', source: 'typed', aiDrafted: false, authorId: 'c-rohan', createdAt: '2026-10-06T18:30', sync: 'synced', status: 'saved' },
  { id: 'o-6', athleteId: 'a-ishaan', sessionId: 's-1004', areaId: 'da-ishaan-gather', text: 'Snatching at the ball against spin. Hands going early.', source: 'typed', aiDrafted: false, authorId: 'c-neha', createdAt: '2026-10-07T16:55', sync: 'synced', status: 'saved' },
];

export const tasks: Task[] = [
  {
    id: 't-101', athleteId: 'a-kabir', areaId: 'da-kabir-head', title: 'Head-position throwdowns with Kabir',
    instruction: '15 minutes of throwdowns on the drive. Film one set side-on. Note how many he plays with eyes level at contact.',
    assigneeId: 'c-arjun', createdById: 'c-rohan', status: 'open', due: TODAY, evidenceObservationIds: [], evidenceVideoIds: [],
    createdAt: '2026-10-07T20:10', version: 1,
  },
  {
    id: 't-102', athleteId: 'a-ishaan', areaId: 'da-ishaan-gather', title: 'Rebound-net glovework block',
    instruction: 'Standing up to the stumps. Count clean takes out of 20.', assigneeId: 'c-neha', createdById: 'c-rohan',
    status: 'in_progress', due: '2026-10-10', evidenceObservationIds: ['o-6'], evidenceVideoIds: [], createdAt: '2026-10-06T19:00', version: 2,
  },
  {
    id: 't-103', athleteId: 'a-dev', areaId: 'da-dev-landing', title: 'Film front-foot landing from behind',
    instruction: 'Three overs, filmed from directly behind the bowler’s arm.', assigneeId: 'c-arjun', createdById: 'c-neha',
    status: 'blocked', blockedReason: 'Dev missed Tuesday (illness). Needs a new slot.', due: '2026-10-08', evidenceObservationIds: [], evidenceVideoIds: [],
    createdAt: '2026-10-04T12:00', version: 3,
  },
  {
    id: 't-104', athleteId: 'a-zoya', areaId: 'da-zoya-runup', title: 'Mark run-up and count no-balls',
    instruction: 'Cones at 4, 8, 12. Record no-balls per over.', assigneeId: 'c-neha', createdById: 'c-rohan',
    status: 'completed', due: '2026-10-05', evidenceObservationIds: ['o-4'], evidenceVideoIds: [], createdAt: '2026-10-01T09:00', version: 4,
  },
];

export const handovers: Handover[] = [
  {
    id: 'h-1', athleteId: 'a-dev', fromId: 'c-neha', toId: 'c-arjun',
    summary: 'Dev is back from illness on Saturday. Landing work is paused; keep his workload light.',
    nextAction: 'Re-film front-foot landing once he bowls 3 overs pain-free.', status: 'sent', createdAt: '2026-10-08T19:30',
  },
];

export const videos: Video[] = [
  {
    id: 'v-1', athleteId: 'a-kabir', areaId: 'da-kabir-head', goalId: 'g-kabir-head', sessionId: 's-1002',
    title: 'Drive — side-on, throwdowns', duration: 42, capturedAt: '2026-10-02T16:30', upload: 'uploaded', progress: 100,
    processing: 'ready', share: 'shared', tint: '#1b5a3f',
    comments: [
      { id: 'vc-1', t: 8, text: 'Here — head drifts outside off as the bat comes down.', shared: true },
      { id: 'vc-2', t: 27, text: 'Much better. Eyes level, front knee bent, ball under the eyes.', shared: true },
      { id: 'vc-3', t: 35, text: 'Internal: check whether the back-lift is the cause.', shared: false },
    ],
  },
  {
    id: 'v-2', athleteId: 'a-tara', areaId: 'da-tara-short', goalId: 'g-tara-short', sessionId: 's-0991',
    title: 'Short-ball sway — front-on', duration: 31, capturedAt: '2026-10-06T18:10', upload: 'uploaded', progress: 100,
    processing: 'ready', share: 'shared', tint: '#0f2a57',
    comments: [
      { id: 'vc-4', t: 6, text: 'You turn your head away here. Keep watching the ball all the way.', shared: true },
      { id: 'vc-5', t: 19, text: 'This is the one: inside the line, eyes on the ball.', shared: true },
    ],
  },
  {
    id: 'v-3', athleteId: 'a-zoya', areaId: 'da-zoya-runup', goalId: null, sessionId: 's-1003',
    title: 'Run-up — second spell', duration: 55, capturedAt: '2026-10-05T09:35', upload: 'uploaded', progress: 100,
    processing: 'failed', share: 'private', tint: '#26362e', comments: [],
  },
];

export const reassessments: Reassessment[] = [
  { id: 'r-1', athleteId: 'a-kabir', areaId: 'da-kabir-head', assigneeId: 'c-neha', due: '2026-10-12', status: 'pending', outcome: null, note: '', nextAction: '', milestoneId: null },
  { id: 'r-2', athleteId: 'a-zoya', areaId: 'da-zoya-runup', assigneeId: 'c-neha', due: '2026-10-08', status: 'submitted', outcome: 'improving', note: 'No-balls down from 4 to 2 per spell. Still stretches when tired.', nextAction: 'Shorter spells, cones stay in.', milestoneId: null, submittedAt: '2026-10-08T18:00' },
  { id: 'r-3', athleteId: 'a-tara', areaId: 'da-tara-short', assigneeId: 'c-rohan', due: '2026-10-20', status: 'pending', outcome: null, note: '', nextAction: '', milestoneId: null },
  { id: 'r-4', athleteId: 'a-ishaan', areaId: 'da-ishaan-gather', assigneeId: 'c-arjun', due: '2026-10-15', status: 'pending', outcome: null, note: '', nextAction: '', milestoneId: null },
];

export const milestones: Milestone[] = [
  { id: 'm-1', athleteId: 'a-kabir', areaId: 'da-kabir-run', title: 'Clear calling — no run-out mix-ups across four match sims', date: '2026-09-14', visibleToFamily: true },
  { id: 'm-2', athleteId: 'a-tara', areaId: null, title: 'First fifty in the U14 inter-academy game', date: '2026-08-30', visibleToFamily: true },
];

export const competitions: Competition[] = [
  { id: 'comp-1', academyId: 'ac-velocity', name: 'District U16 T20 Cup — Round 2', date: '2026-10-18', venue: 'Shivaji Park', status: 'upcoming', athleteIds: u16 },
  { id: 'comp-2', academyId: 'ac-velocity', name: 'U14 Inter-academy League', date: '2026-10-25', venue: 'Main Ground', status: 'changed', change: 'Moved from 24 Oct to 25 Oct (ground availability).', athleteIds: u14 },
  { id: 'comp-0', academyId: 'ac-velocity', name: 'District U16 T20 Cup — Round 1', date: '2026-09-27', venue: 'Cross Maidan', status: 'completed', update: 'Won by 14 runs. Kabir 31 (24).', athleteIds: u16 },
];

export const reports: Report[] = [
  {
    id: 'rep-kabir-sep', athleteId: 'a-kabir', period: 'September 2026', status: 'published', version: 1,
    focusSummary: 'Calling and running between wickets — achieved. New focus: head position on the front-foot drive.',
    comment: 'Kabir has turned his calling into a real strength — loud, early and decisive. Our new focus is keeping his head still over the ball on the drive.',
    includes: { attendance: true, milestone: true, competition: true, video: false }, videoId: null, milestoneId: 'm-1', competitionId: 'comp-0',
    approvedById: 'c-rohan', publishedAt: '2026-10-01T10:00',
    history: [{ at: '2026-09-30T18:00', event: 'Draft started', by: 'Neha Rao' }, { at: '2026-10-01T09:40', event: 'Approved', by: 'Rohan Shah' }, { at: '2026-10-01T10:00', event: 'Published to guardians', by: 'Rohan Shah' }],
  },
  {
    id: 'rep-tara-sep', athleteId: 'a-tara', period: 'September 2026', status: 'corrected', version: 2,
    focusSummary: 'Playing the short ball with confidence.',
    comment: 'Tara is learning to stay inside the line against the short ball. Her first fifty in August showed what she can do.',
    includes: { attendance: true, milestone: true, competition: true, video: true }, videoId: 'v-2', milestoneId: 'm-2', competitionId: 'comp-2',
    approvedById: 'c-rohan', publishedAt: '2026-10-02T09:00', correctionNote: 'Attendance count corrected from 6 to 7 sessions.',
    history: [{ at: '2026-10-01T12:00', event: 'Published v1', by: 'Rohan Shah' }, { at: '2026-10-02T09:00', event: 'Corrected → v2 (attendance count)', by: 'Rohan Shah' }],
  },
  {
    id: 'rep-zoya-sep', athleteId: 'a-zoya', period: 'September 2026', status: 'draft', version: 1,
    focusSummary: 'Run-up rhythm.', comment: '',
    includes: { attendance: true, milestone: false, competition: true, video: false }, videoId: null, milestoneId: null, competitionId: 'comp-1',
    history: [{ at: '2026-10-08T18:20', event: 'Draft started', by: 'Neha Rao' }],
  },
];

export const feedback: Feedback[] = [
  { id: 'f-1', athleteId: 'a-tara', coachId: 'c-rohan', text: 'Brilliant effort on Tuesday. Watch the 0:19 clip — that sway is exactly what we want every time.', videoId: 'v-2', status: 'published', publishedAt: '2026-10-06T20:00' },
  { id: 'f-2', athleteId: 'a-tara', coachId: 'c-rohan', text: 'Keep backing up at the non-striker’s end. You were half a yard late twice.', videoId: null, status: 'published', publishedAt: '2026-10-03T19:30' },
  { id: 'f-3', athleteId: 'a-tara', coachId: 'c-rohan', text: 'Selection note for Saturday.', videoId: null, status: 'withdrawn', publishedAt: '2026-09-29T19:00' },
  { id: 'f-4', athleteId: 'a-kabir', coachId: 'c-neha', text: 'See 0:27 — that is the head position we want on every drive.', videoId: 'v-1', status: 'published', publishedAt: '2026-10-02T19:00' },
];

export const practiceLogs: PracticeLog[] = [
  { id: 'pl-1', athleteId: 'a-tara', goalId: 'g-tara-short', date: '2026-10-04' },
  { id: 'pl-2', athleteId: 'a-tara', goalId: 'g-tara-short', date: '2026-10-07' },
  { id: 'pl-3', athleteId: 'a-kabir', goalId: 'g-kabir-head', date: '2026-10-06' },
];

export const notifications: Notification[] = [
  { id: 'n-1', personId: 'p-arjun', kind: 'task', title: 'New task from Rohan Shah', body: 'Head-position throwdowns with Kabir — due today', route: '/coach/tasks/t-101', target: { type: 'task', id: 't-101' }, createdAt: '2026-10-07T20:10', read: false },
  { id: 'n-2', personId: 'p-neha', kind: 'reassessment', title: 'Reassessment due in 3 days', body: 'Kabir Singh — Head position on the front-foot drive', route: '/coach/reassess/r-1', target: { type: 'reassessment', id: 'r-1' }, createdAt: '2026-10-09T07:00', read: false },
  { id: 'n-3', personId: 'p-maya', kind: 'report', title: 'Tara’s September report was corrected', body: 'Attendance count corrected. Tap to read version 2.', route: '/parent/report/rep-tara-sep', target: { type: 'report', id: 'rep-tara-sep' }, createdAt: '2026-10-02T09:00', read: false },
  { id: 'n-4', personId: 'p-maya', kind: 'report', title: 'Kabir’s September report is ready', body: 'Read Coach Neha’s comment and his new focus.', route: '/parent/report/rep-kabir-sep', target: { type: 'report', id: 'rep-kabir-sep' }, createdAt: '2026-10-01T10:00', read: true },
  { id: 'n-5', personId: 'p-tara', kind: 'feedback', title: 'New feedback from Coach Rohan', body: 'Watch the 0:19 clip.', route: '/athlete/feedback/f-1', target: { type: 'feedback', id: 'f-1' }, createdAt: '2026-10-06T20:00', read: false },
  { id: 'n-6', personId: 'p-arjun', kind: 'handover', title: 'Handover from Neha Rao', body: 'Dev Malhotra — landing work paused', route: '/coach/handover/h-1', target: { type: 'handover', id: 'h-1' }, createdAt: '2026-10-08T19:30', read: false },
];
