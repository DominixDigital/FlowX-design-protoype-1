# Companion and Dit Score flows (A–G)

The model is **Coach = source of truth · ditdit = system of record · dit = intelligent assistant**.

Every flow below is implemented in the prototype. Its route is listed under each heading. "AI behaviour" describes what the real assistant must do; in the prototype that behaviour is deterministic demo logic, and the UI labels it as such.

## Companion behaviour by role

| | Athlete (grey) | Coach (teal) | Parent (lime) | Head coach and web (teal) |
|---|---|---|---|---|
| Tone | Friendly, motivating, short | Efficient, terse | Reassuring, explains terms | Professional, summary-first |
| Does | Session walk-through, mistake explainer, score explanation, practice cues | Voice note → observation, summaries, comparisons, evidence brief, athlete-friendly drafts | Plain-language reports, Dit Score meaning, coach priorities | Evidence brief, report comment drafts, history summaries |
| Never | Invents training; judges ability; reveals internal notes | Saves or shares without approval | Shows unpublished or internal content | Publishes or approves anything |
| Voice | Off (privacy decision pending) | On, with live transcript | Off | Off |

Shared states: idle, listening, thinking, explaining, celebrating, unsure, insight ready.

Presence:
- **Compact**: bottom-right face, or "Ask dit" on web.
- **Conversation**: bottom sheet on mobile, side panel on web.
- **Minimise**: (−) returns to compact.
- **Quiet mode**: the bell turns off proactive suggestions.
- **Dismiss**: each suggestion has its own ×.

---

## Flow A · First interaction with the companion
Route: `/athlete?intro=1`; also on first visit to each app.

| Step | Detail |
|---|---|
| Entry point | First open of any app, as a sheet over the home screen once the screen context is ready |
| User action | Reads the intro, then taps a suggested question, "Not now", or "Only when I ask" |
| System response | Records `introSeen`. A question opens the canvas with that ask; "Only when I ask" also turns on quiet mode |
| AI behaviour | A role-specific greeting, what dit does, and what it doesn't do (coach is the source of truth) |
| Data | Companion preferences per person and surface |
| Permissions | Visible to every role; content is scoped to the role |
| Success | The user asks a first question and gets a contextual answer, or dismisses knowingly |
| Failure | No screen context yet: the intro waits (it renders only once a context exists) |
| Edge cases | Shared parent device (Kabir): the intro shows for the athlete persona. Multi-role person: one intro per surface |
| Exit | Back to the home screen; dit stays compact |

## Flow B · Explain my mistake
Route: `/athlete/session/s-0991`.

| Step | Detail |
|---|---|
| Entry point | Home "Last session" card, a dit nudge ("Good session! Want to see what improved?"), or a feedback notification |
| User action | Show me → What should I improve? → Show me the mistake / Explain it simply / What should I practise? / Ask my coach |
| System response | Coach-shared clip moments (positive first), the flagged moment, a practice cue, and the assigned drill linking to Practice |
| AI behaviour | Uses **only published feedback and shared clip comments**. Labels the cue "Suggestion"; refers anything new to the coach |
| Data | Feedback (with `sessionId`), shared video comments, goal and drill |
| Permissions | Athlete sees only shared items; internal coach comments are never used |
| Success | The athlete understands the point and opens the drill, or asks the coach |
| Failure | No feedback shared yet: dit says so, in the unsure state, and offers "Ask my coach" |
| Edge cases | Feedback or clip withdrawn: the withdrawn state is shown (AT04.06). No goal drill: dit says so and suggests asking. Coach unassigned: "Ask my coach" warns instead of sending |
| Exit | Practice tab, feedback detail, or minimise |

## Flow C · Understanding my Dit Score
Route: `/athlete/score`.

| Step | Detail |
|---|---|
| Entry point | Header chip, home score hero, "Dit Score" tab, or a dit question |
| User action | Views the score, trend and breakdown; asks "Why did it change?", "How can I improve?" or "What counts?" |
| System response | Drivers (from → to, source, trust), weekly trend with personal best, next steps from the coach's plan, method notice |
| AI behaviour | Explains changes in terms of recorded inputs, never as a verdict on ability. Next steps come only from the coach's plan; if there's no plan, it refers to the coach |
| Data | `computeDitScore`, `scoreHistory`, `scoreChange`, goals and drills |
| Permissions | The athlete's own score; visibility controls on the same page (DS-07) |
| Success | The athlete can say what moved their score and what to do next |
| Failure | Building (not enough data), paused by the coach, or disabled by the academy. Each has its own state, and nothing is guessed |
| Edge cases | First scored week (no change), a self-reported input at 100% (flagged for the coach), negative change (explaining tone, never celebrating) |
| Exit | Practice, Compare, or minimise |

## Flow D · Score milestone
Routes: `/athlete?milestone=1` (athlete), `/parent?child=a-tara` (guardian approval).

| Step | Detail |
|---|---|
| Entry point | A milestone recorded by a coach (CM12.08 / MW10.07) that the athlete hasn't seen |
| User action | Reads the celebration; chooses "Share it" or "Keep it to myself" |
| System response | Celebrating avatar and a share-card preview. Under 16 → a request is sent to guardians; 16+ → shared with the squad |
| AI behaviour | Explains why it matters ("real progress on …") and how it counts in the score; no hype |
| Data | Milestones, `scorePrefs.seenMilestoneIds`, `shareRequests`, guardian links |
| Permissions | Only coach-confirmed milestones celebrate. Sharing stays inside ditdit (DS-06) |
| Success | The athlete feels recognised; sharing respects consent |
| Failure | No guardian linked: the request can't be delivered (shown to the coach and admin as a missing link) |
| Edge cases | Guardian declines: nothing is shared, and the athlete isn't shamed. Multiple guardians: any one may approve (assumption). Milestone later reversed: the card is withdrawn (pending decision) |
| Exit | Home; the parent approves or declines on the Parent home |

## Flow E · Coach-assisted feedback
Route: `/coach/athlete/a-kabir?session=s-1005` → Talk a note.

| Step | Detail |
|---|---|
| Entry point | Talk a note (CM05.03) or the capture tab |
| User action | Speaks → reviews the interpretation → edits → saves → "Share an athlete-friendly version" → edits → approves and sends |
| System response | The observation is saved (marked AI-drafted, coach-confirmed); the feedback is published with `aiDrafted`; the athlete is notified |
| AI behaviour | Structures the note (athlete, area, tone), then rewrites it in second person for the athlete. Every field is editable, and nothing goes out without "Approve and send" |
| Data | Observation, feedback, notification, audit entry |
| Permissions | Assigned coaches only; an assistant's scope applies |
| Success | The athlete gets clear, coach-approved feedback the same day |
| Failure | Speech is unavailable or denied → typing. Offline → the observation is queued. Name not recognised → the athlete must be chosen before saving |
| Edge cases | Athlete without app access: the feedback waits in their record. Wrong athlete: correct before saving. Concern-toned note: framed as "One thing to work on" |
| Exit | Back to the athlete context; the athlete's dit can explain the feedback (Flow B) |

## Flow F · Parent explanation
Route: `/parent?child=a-kabir`.

| Step | Detail |
|---|---|
| Entry point | Parent home Dit Score card, a report reader, or a dit question |
| User action | "Explain it simply" / "What's in it" / "Explain this report in plain words" |
| System response | Plain-language meaning, a breakdown with parent labels, and the coach's current priority |
| AI behaviour | Reassuring, defines terms, states that this is not a talent rating. Uses only published and family-visible data |
| Data | Score state, published reports, family-visible milestones |
| Permissions | A guardian of the child. From 16, the athlete may hide the score (DS-07), and the parent sees why |
| Success | The parent can explain the priority in their own words |
| Failure | Score building or paused: the matching state; never a guess |
| Edge cases | Guardian link removed (PA01.06); parent is also a coach (separation banner); two children (the switcher keeps context separate) |
| Exit | Back to home, or to the report |

## Flow G · Score comparison
Routes: `/athlete/score/compare` (Kabir eligible, Tara not offered); web Academy → governance.

| Step | Detail |
|---|---|
| Entry point | Dit Score page → Compare progress |
| User action | Picks Me vs me / Squad progress / Academy. Opts in to squad progress |
| System response | Personal trend and best. Squad shows the athlete's band (under 16) or position (16+) for **improvement**, with anonymised rows |
| AI behaviour | Explains the criteria if asked; never names teammates or compares across sports |
| Data | `squadComparison`, `scoreSettings`, `scorePrefs.comparisonOptIn` |
| Permissions | Batch enabled by the academy, age ≥ 13, athlete opted in (DS-04/05) |
| Success | The athlete sees where they stand in progress, fairly, without humiliation |
| Failure | Not offered (batch off or too young), with the reason; opt-in needed; academy tab "not available yet" |
| Edge cases | Tiny cohort (needs a minimum-size rule); athletes with no score count as 0 improvement (the rule needs a decision); opting out removes the athlete from others' views |
| Exit | Back to the score page |
