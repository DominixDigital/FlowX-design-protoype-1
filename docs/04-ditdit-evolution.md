# ditdit evolution: start here

This document covers how FlowX became ditdit. It adds the companion (**dit**), the **Dit Score**, and the approved role-based colour system. The existing flows, information architecture and screens are kept; the new work is layered on top.

Live: `#/` (launcher), `#/explore` (explorations 1–6), `#/explore/v1` (the FlowX-era directions, kept for history).

Related docs: [05 Dit Score model](05-dit-score-model.md) · [06 Companion and score flows](06-companion-and-score-flows.md) · [07 Colour system](07-colour-system.md) · [08 Dependencies](08-dependencies.md)

## 1. What the rebrand changes

| Area | FlowX | ditdit | Kept |
|---|---|---|---|
| Name and wordmark | "FlowX", uppercase condensed, seam mark | "ditdit", lowercase. The two i-dots are the brand's two dots (Morse *dit dit*): first dot in the role colour, second in silver | Instrument Sans as the reading face |
| Core idea | Ball seam | **Two dots**: the wordmark tittles, the companion's eyes and the two Dit Score discs | The surface modes (chalk, floodlit, matchday) |
| Palette | Forest, lime, court blue, ink, chalk | Teal (coach), lime (parent), grey (athlete), charcoal, taupe. Full 50–900 scales | Semantic status colours (amber and red kept as functional exceptions) |
| Display type | Big Shoulders, uppercase everywhere | Big Shoulders for numbers. Uppercase only on athlete and editorial surfaces; coach and parent headings use sentence case (friendlier, less aggressive) | Type scale, tabular numerals |
| AI layer | "Huddle", seam icon | **dit**, a companion with one identity and role-adapted tone | Plays-not-transcript canvas, evidence and trust rules, demo-logic disclosure |
| Role identity | One look plus floodlit athlete app | `data-role` (athlete, parent, coach) × `data-theme` (chalk, floodlit, matchday). The same components re-colour | Layout, spacing, components, flows |

Code impact:
- `src/huddle` → `src/companion` and `Huddle*` → `Companion*`.
- Legacy palette variables are migrated to role tokens.
- Old localStorage data is ignored, because the storage key moved to `ditdit-proto-v2`.

## 2. Three avatar directions

All three share one vocabulary of seven states: idle, listening, thinking, explaining, celebrating, unsure, insight ready. They are live in `#/explore` §2.

| | A · Living symbol | B · Character companion | **C · Hybrid (recommended)** |
|---|---|---|---|
| Silhouette | Two dots only | Capsule body, sweatband, dot eyes, mouth | Dots in a squircle face. Opens into the two score discs |
| Personality | Calm, premium | Warm, cheeky | Friendly and sporty; tone adapts by role |
| Listening | Dots become equaliser bars | Eyes pulse | Dots pulse alternately: dit… dit |
| Thinking | Dots orbit | Eyes look across | Eyes look across |
| Explaining | Right dot stretches to a dash | Mouth opens | Dit-dah: the right dot stretches |
| Celebrating | Burst ring | Big smile and hop | Happy-arc eyes and hop. Coach-confirmed milestones only |
| Unsure | Dots drift apart | Flat mouth, tilt | Tilt and a smaller dot |
| Small sizes | Excellent (12px) | Weak below 24px | Dots at 16px, face at 28–48px |
| Risk | Cold for younger athletes | Childish for teens, coaches and parents | — |

**Why C:** it is the only direction where the logo, the companion and the score are the same object. It scales from a nav icon to a full-screen moment, and its expressiveness sits between A and B, which fits ages 7–18 as well as adults.

**Presence lifecycle:** Compact → Listening → Conversation → Insight → Action → Compact.
- Minimise (−) always returns dit to compact.
- Quiet mode (the bell) stops proactive suggestions.
- Each suggestion can be dismissed on its own.
- dit sits bottom right, above the navigation, and never covers primary actions.

## 3. Three Dit Score visualisations

They are live in `#/explore` §4.

| | V1 · Two Dits (recommended hero) | V2 · Signal | V3 · Strata |
|---|---|---|---|
| Form | Two translucent discs: Development (role colour) and Commitment (silver). The number sits in the overlap | Each input is a Morse mark growing from dit to dah. Self-reported inputs are outlined | Stacked frosted plates; thickness shows weight, fill shows value |
| Strength | Recognisable without a logo; echoes reference A's layered translucency without copying it | Tiny, honest, works in lists | Shows the method most transparently |
| Use | Score page, home hero, milestone, parent card | Chips, cards, coach review | Coach validation view; documentation |

The compact chip (`·· 87`) appears in the athlete header, coach athlete context and the web passport.

## 4. Where the companion and score enter the existing flows

| Existing flow | Companion | Dit Score | Why here |
|---|---|---|---|
| AT02 Athlete dashboard | Nudge after a session with shared feedback; Flow A intro on first run | Hero with change, plus header chip | The first thing an athlete wants to know |
| AT04 Feedback | "Explain my coach's comment" (moment explainer) | — | Feedback is already coach-approved |
| **New** athlete session summary (`/athlete/session/:id`) | Flow B guided conversation | Link to the score | Turns a static report into a conversation |
| **New** Dit Score (`/athlete/score`) | Flow C explanations | Full experience | — |
| AT05 Progress | — | Milestones reused | Avoids duplicating the score |
| CM04 Athlete context | Existing voice note → draft, now with Flow E | Chip → coach review | Coach is the source of truth |
| CM05 Observations | Flow E: athlete-friendly draft, coach approves | Coach-confirmed inputs | — |
| **New** coach score review (`/coach/athlete/:id/score`) | Can explain changes | Inputs, evidence, confirm or pause | Validation step |
| CM12 Reassessment | Evidence brief (existing) | Approved outcomes feed the score | — |
| PA02 Parent dashboard | Flow F "Explain it simply"; share approvals | Lime-themed card with breakdown | Understanding over complexity |
| PA04 Report reader | Plain-language explainer (existing) | — | — |
| MW07 Passport | Existing companion | Chip in header | Context for head coaches |
| MW01 Academy settings | — | Governance: enable, comparison batches, ages | Academy controls competition |
| XS03 Notifications | New kinds: milestone, share request, athlete question | — | — |

The companion is deliberately **not** added to attendance, batches, staff, setup or the sync queue. There it would add noise without value; the existing launcher still answers questions there.

## 5. The integrated loop

**Recorded coaching data → Dit Score → dit explains → athlete understands → next action from the coach's plan → future progress**

1. A coach records attendance, observations and reassessments (existing flows), with dit helping on structure (Flow E).
2. The Dit Score recalculates from coach-recorded and coach-confirmed data only.
3. The athlete sees the change on home. dit offers one suggestion, for example "Your score went up. Want to see why?"
4. The athlete asks "why" and dit shows the drivers with their sources, the trend, and next steps from the coach's plan (Flow C).
5. The athlete practises (AT03) or asks the coach. Questions route to the primary coach as a notification.
6. A coach-confirmed milestone triggers a celebration and optional, governed sharing (Flow D).
7. Parents see the same story in plain words (Flow F); coaches can confirm or pause the score.

## 6. Decisions still open

These are tracked in `src/data/policy.ts` as DS-01…08 where the prototype needed an assumption.

1. **The Dit Score method (DS-01):** inputs, weights, normalisation, update frequency, minimum data (DS-02), and whether the score is sport-specific.
2. **Skill and performance measurement:** which tests, by sport and age. These two dimensions are shown as "not measured yet".
3. **Comparison policy:** minimum ages (DS-04/05), whether to rank by improvement or by level, and cohort size floors (for example, no comparison in squads under 5).
4. **Sharing:** destinations (in-app only?), guardian consent model by region (DS-06), and retention of shared cards.
5. **Visibility:** an age threshold for athlete control (DS-07); whether coaches can hide a score from parents.
6. **Pausing and appeal (DS-08):** who can pause, and how an athlete or parent can query a score.
7. **The AI service:** model, hosting, data residency, logging, evaluation set, refusal behaviour and child-safety review. Today dit is demo logic.
8. **Voice for athletes:** off in the prototype for privacy. Needs a consent decision.
9. **Companion name:** "dit" is the working name. It needs a trademark and usability check with children.
10. **Brand assets:** final wordmark drawing, avatar illustration and motion specs, and app icon.
