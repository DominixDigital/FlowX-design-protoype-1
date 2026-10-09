// One shared domain schema for every surface (build brief: "Data and architecture guidance").
// Lifecycle values are explicit enums, never booleans.

export type ID = string;

export type Role = 'owner' | 'head_coach' | 'coach' | 'assistant' | 'parent' | 'athlete';
export type Surface = 'web' | 'coach' | 'parent' | 'athlete';

export interface Membership {
  academyId: ID;
  role: Role;
  /** XS01.07 — temporary access expiry (ISO date) */
  expiresOn?: string;
  status: 'active' | 'removed';
}

export interface Person {
  id: ID;
  name: string;
  memberships: Membership[];
  /** Links to coach / athlete records where the person also acts in that role */
  coachId?: ID;
  athleteId?: ID;
  childIds?: ID[];
}

export interface Location {
  id: ID;
  name: string;
  status: 'active' | 'inactive';
}

export interface Academy {
  id: ID;
  name: string;
  sport: string;
  locations: Location[];
  /** MW01 setup progress */
  setup: { step: 0 | 1 | 2 | 3 | 4; completed: boolean };
}

export interface Coach {
  id: ID;
  personId: ID;
  academyId: ID;
  name: string;
  role: 'head_coach' | 'coach' | 'assistant';
  status: 'invited' | 'active' | 'inactive';
  tempAccessUntil?: string;
}

export type AthleteStatus = 'active' | 'archived' | 'duplicate_suspected' | 'transferred';

export interface Athlete {
  id: ID;
  academyId: ID;
  name: string;
  born: string;
  batchId: ID | null;
  primaryCoachId: ID | null;
  supportingCoachIds: ID[];
  status: AthleteStatus;
  guardianIds: ID[];
  discipline: string;
  /** AT01 — direct login enabled */
  access: 'none' | 'parent_device' | 'direct';
  duplicateOf?: ID;
}

export interface Batch {
  id: ID;
  academyId: ID;
  name: string;
  coachIds: ID[];
  assistantIds: ID[];
  status: 'active' | 'archived';
}

export type AttendanceMark = 'present' | 'absent' | 'unmarked';

/** Every record a coach can create offline carries a sync state (XS04, CM14). */
export type SyncState = 'local' | 'queued' | 'sending' | 'synced' | 'failed' | 'conflict';

export interface Session {
  id: ID;
  batchId: ID;
  title: string;
  date: string;
  start: string;
  end: string;
  locationId: ID;
  coachId: ID;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  plan: string;
  attendance: Record<ID, AttendanceMark>;
  attendanceSync: SyncState;
  walkIns: ID[];
}

export interface Observation {
  id: ID;
  athleteId: ID;
  sessionId: ID | null;
  areaId: ID | null;
  text: string;
  source: 'typed' | 'voice';
  aiDrafted: boolean;
  authorId: ID;
  createdAt: string;
  sync: SyncState;
  status: 'draft' | 'saved';
  correctedFrom?: string;
}

export interface Goal {
  id: ID;
  areaId: ID;
  title: string;
  target: string;
  nextAction: string;
  drill: { name: string; instructions: string; frequency: string } | null;
  status: 'active' | 'achieved';
}

export interface DevArea {
  id: ID;
  athleteId: ID;
  title: string;
  status: 'active' | 'achieved' | 'closed' | 'reopened';
  priority: 'high' | 'normal' | 'low';
  openedAt: string;
  ownerId: ID;
}

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

export interface Task {
  id: ID;
  athleteId: ID;
  areaId: ID | null;
  title: string;
  instruction: string;
  assigneeId: ID;
  createdById: ID;
  status: TaskStatus;
  due: string;
  blockedReason?: string;
  followUp?: string;
  evidenceObservationIds: ID[];
  evidenceVideoIds: ID[];
  createdAt: string;
  /** XS04.S03 — version for conflict checks */
  version: number;
}

export interface Handover {
  id: ID;
  athleteId: ID;
  fromId: ID;
  toId: ID;
  summary: string;
  nextAction: string;
  status: 'sent' | 'opened' | 'converted';
  createdAt: string;
}

export interface VideoComment {
  id: ID;
  t: number;
  text: string;
  shared: boolean;
}

export interface Video {
  id: ID;
  athleteId: ID;
  areaId: ID | null;
  goalId: ID | null;
  sessionId: ID | null;
  title: string;
  duration: number;
  capturedAt: string;
  /** Binary upload state is separate from processing and publication (build brief). */
  upload: 'local' | 'queued' | 'uploading' | 'failed' | 'uploaded';
  progress: number;
  processing: 'pending' | 'processing' | 'ready' | 'failed';
  share: 'private' | 'shared' | 'withdrawn';
  comments: VideoComment[];
  /** Placeholder frame tint for the prototype (no real media) */
  tint: string;
}

export type ReassessmentOutcome = 'improving' | 'on_track' | 'needs_more_work' | 'achieved';

export interface Reassessment {
  id: ID;
  athleteId: ID;
  areaId: ID;
  assigneeId: ID;
  due: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved';
  outcome: ReassessmentOutcome | null;
  note: string;
  nextAction: string;
  milestoneId: ID | null;
  /** A coach proposes; the head coach confirms on approval (MW10.07) */
  proposedMilestone?: string;
  submittedAt?: string;
}

export interface Milestone {
  id: ID;
  athleteId: ID;
  areaId: ID | null;
  title: string;
  date: string;
  visibleToFamily: boolean;
}

export type ReportStatus = 'draft' | 'approved' | 'published' | 'corrected' | 'withdrawn';

export interface Report {
  id: ID;
  athleteId: ID;
  period: string;
  status: ReportStatus;
  version: number;
  comment: string;
  focusSummary: string;
  includes: { attendance: boolean; milestone: boolean; competition: boolean; video: boolean };
  videoId: ID | null;
  milestoneId: ID | null;
  competitionId: ID | null;
  approvedById?: ID;
  publishedAt?: string;
  correctionNote?: string;
  history: { at: string; event: string; by: string }[];
}

export interface Competition {
  id: ID;
  academyId: ID;
  name: string;
  date: string;
  venue: string;
  status: 'upcoming' | 'changed' | 'completed';
  athleteIds: ID[];
  update?: string;
  change?: string;
}

export interface Feedback {
  id: ID;
  athleteId: ID;
  coachId: ID;
  text: string;
  videoId: ID | null;
  status: 'published' | 'withdrawn';
  publishedAt: string;
}

export interface PracticeLog {
  id: ID;
  athleteId: ID;
  goalId: ID;
  date: string;
}

export interface Notification {
  id: ID;
  personId: ID;
  kind: 'task' | 'reassessment' | 'report' | 'feedback' | 'video' | 'assignment' | 'handover';
  title: string;
  body: string;
  route: string;
  /** Target object for deep-link revalidation (XS03 / XS07.S08) */
  target: { type: 'report' | 'task' | 'reassessment' | 'feedback' | 'video' | 'handover'; id: ID };
  createdAt: string;
  read: boolean;
}

export interface QueuedCommand {
  id: ID;
  /** Client-generated idempotency key — a retry with the same key never duplicates. */
  idempotencyKey: string;
  kind: 'attendance' | 'observation' | 'video' | 'task';
  label: string;
  refId: ID;
  status: 'queued' | 'sending' | 'failed' | 'conflict';
  attempts: number;
  error?: string;
  conflict?: { field: string; mine: string; theirs: string; theirsBy: string };
}

export interface AuditEntry {
  id: ID;
  at: string;
  by: string;
  what: string;
  ref?: string;
}
