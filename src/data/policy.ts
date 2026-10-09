// Unresolved product rules (docs/context/03-open-decisions.md) live here, in one place.
// Each entry is a prototype ASSUMPTION, surfaced in the UI with <Assumption code="..."/>.

export interface PolicyAssumption {
  code: string;
  marker: string;
  assumption: string;
}

export const policy = {
  /** CM03.04 — Athlete Not Listed: "requires decision" */
  walkInAthletes: 'record_as_pending_review' as 'record_as_pending_review' | 'block',
  /** CM06.05 — Prioritise: "to decide" */
  priorityModel: ['high', 'normal', 'low'] as const,
  /** MW10.04 — Review Submitted Reassessment: "policy required" */
  reassessmentApprover: 'head_coach' as const,
  /** MW11.11 — report corrections create a new visible version */
  reportCorrection: 'versioned' as const,
  /** AT03.05 — Practice Completed: "not defined" */
  athleteCanMarkPractice: true,
  /** XS01.07 — temporary assistant access: expires at end of day on expiresOn */
  tempAccessExpiry: 'end_of_day' as const,
  /** Offline conflict policy (open decision): human resolution for every type */
  conflictPolicy: 'human' as const,
};

export const assumptions: Record<string, PolicyAssumption> = {
  'CM03.04': { code: 'CM03.04', marker: 'requires decision', assumption: 'A walk-in athlete is recorded as present but flagged for admin review before joining the batch.' },
  'CM05.03': { code: 'CM05.03', marker: 'if introduced', assumption: 'Voice input uses the device’s speech recognition. The coach always edits the draft and saves it.' },
  'CM05.05': { code: 'CM05.05', marker: 'policy required', assumption: 'An observation may link to an active or reopened development area for the same athlete only.' },
  'CM06.05': { code: 'CM06.05', marker: 'to decide', assumption: 'Three priority levels (high, normal, low). Only one area per athlete can be high.' },
  'CM07.03': { code: 'CM07.03', marker: 'optional', assumption: 'Next action is optional on a goal.' },
  'CM10.07': { code: 'CM10.07', marker: 'not defined', assumption: 'A video can link to at most one goal, from the selected development area.' },
  'CM12.04': { code: 'CM12.04', marker: 'optional', assumption: 'Video review is optional in reassessment and shown only when linked video exists.' },
  'MW10.04': { code: 'MW10.04', marker: 'policy required', assumption: 'The head coach approves submitted reassessments. Coaches can submit but not approve.' },
  'MW11.05': { code: 'MW11.05', marker: 'optional', assumption: 'Milestones are included only if they are marked visible to the family.' },
  'MW11.06': { code: 'MW11.06', marker: 'optional', assumption: 'A competition update is included only when one exists for the athlete.' },
  'MW11.11': { code: 'MW11.11', marker: '—', assumption: 'Corrections publish a new version with a visible “Corrected” note. The prior version is kept.' },
  'PA01.04': { code: 'PA01.04', marker: 'not defined', assumption: 'A parent with several children switches between them with a child switcher; nothing is merged.' },
  'PA04.04': { code: 'PA04.04', marker: 'optional', assumption: 'The coach comment is shown when present; the report reads fine without it.' },
  'AT01.01': { code: 'AT01.01', marker: 'policy required', assumption: 'Athletes aged 13+ may get a direct login; under 13 use a parent’s device.' },
  'AT02.06': { code: 'AT02.06', marker: 'optional', assumption: 'Upcoming competition appears only if the athlete is in its squad.' },
  'AT03.05': { code: 'AT03.05', marker: 'not defined', assumption: 'An athlete can mark a practice done. It is logged for the coach and is not verified.' },
  'XS01.07': { code: 'XS01.07', marker: 'if implemented', assumption: 'Temporary assistant access expires at the end of the stated day and is scoped to assigned athletes.' },
  HUDDLE: { code: 'HUDDLE', marker: 'not in flows', assumption: 'Huddle is a prototype layer over existing flow steps. No AI service is connected; responses are deterministic demo logic over recorded data.' },
};
