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
  HUDDLE: { code: 'HUDDLE', marker: 'not in flows', assumption: 'dit, the companion, is a prototype layer over existing flow steps. No AI service is connected; responses are deterministic demo logic over recorded data.' },
  'DS-01': { code: 'DS-01', marker: 'new · needs validation', assumption: 'The Dit Score method (inputs, weights, mappings) is illustrative only and must be set with coaches and sports experts.' },
  'DS-02': { code: 'DS-02', marker: 'new', assumption: 'No score is shown until there are at least 4 recorded sessions and one coach-confirmed result.' },
  'DS-03': { code: 'DS-03', marker: 'new', assumption: 'Self-reported practice counts for 10% at most and is always labelled self-reported.' },
  'DS-04': { code: 'DS-04', marker: 'new', assumption: 'Squad comparison ranks 4-week improvement inside one batch and one sport, is opt-in, and is enabled per batch by the academy.' },
  'DS-05': { code: 'DS-05', marker: 'new', assumption: 'Under 16, comparison shows bands (top, middle, building), not rank positions. Academy setting, default 16.' },
  'DS-06': { code: 'DS-06', marker: 'new', assumption: 'Under 16, sharing a milestone needs a guardian’s approval. Shared items stay inside ditdit (squad and family only).' },
  'DS-07': { code: 'DS-07', marker: 'new', assumption: 'Coaches always see an athlete’s score. Under 16, guardians always see it too; from 16 the athlete chooses.' },
  'DS-08': { code: 'DS-08', marker: 'new', assumption: 'A primary coach or head coach can pause a score; the athlete sees “paused by your coach” without the reason.' },
};
