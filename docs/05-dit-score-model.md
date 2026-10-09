# Dit Score: proposed information model

> **Status: a concept with an illustrative method.** Every number the prototype shows comes from fixture records passed through the placeholder weights below. The real method must be designed and validated with coaches and sports experts before any athlete sees a score.

Code: `src/score/ditScore.ts`. Visuals: `src/score/ScoreViz.tsx`.

## Concept

The Dit Score is a single, understandable view of **how an athlete's development is going right now**. It is built from what coaches record and confirm, plus a small, clearly labelled amount of athlete-reported practice.

It is **not** a talent rating, it is not comparable across sports, and it never substitutes engagement or popularity for ability.

Principles, all enforced in code:

1. Only recorded or coach-approved data feeds it. Nothing is inferred or invented.
2. Missing dimensions are shown as "not measured yet", never imputed.
3. With too little verified data there is no score. The UI says "building" and lists what's missing.
4. Self-reported data is weighted low and always labelled.
5. A coach can confirm the inputs, or pause the score.
6. History is recalculated from records dated on or before each week. Nothing is stored or back-filled.

## Proposed dimensions

| Dimension | Question | Data source | Trust | Available today? | Illustrative weight |
|---|---|---|---|---|---|
| Coach-validated progress | Is the athlete moving forward on what the coach is working on? | Approved reassessment outcomes (CM12, MW10) | Coach-approved | Yes | 45% |
| Training consistency | Does the athlete attend expected sessions? | Attendance over the last 8 completed sessions (CM03) | Recorded | Yes | 30% |
| Practice commitment | Is the athlete doing assigned drills? | Practice marked done vs assigned frequency, 14 days (AT03.05) | Self-reported | Yes, unverified | 10% |
| Milestones | Recent coach-recognised achievements? | Milestones in the last 90 days (CM12.08, MW10.07) | Coach-approved | Yes | 15% |
| Skill development (measured) | How do measured skills change? | Needs sport-specific skill tests | — | **No** | — |
| Performance outcomes (measured) | How does the athlete perform in matches? | Needs match data capture | — | **No** | — |

Illustrative mappings:
- Reassessment outcome: needs more work = 40, improving = 65, on track = 80, achieved = 100.
- Milestones: 55 + 15 per milestone, capped at 100.
- The score is the weighted mean of the available dimensions, re-normalised over the weights that have data.
- `coverage` reports the share of planned inputs that are measurable.

Two displayed groupings, used in the V1 discs:
- **Development** = coach progress + milestones.
- **Commitment** = consistency + practice.

## States

| State | When | What athletes see |
|---|---|---|
| `scored` | Enough verified data | Number, change, breakdown, trend |
| `building` | Fewer than 4 recorded sessions, or no coach-confirmed result (DS-02) | "Building", plus what's missing |
| `paused` | Coach paused it (DS-08) | "Paused by your coach" (no reason shown) |
| `disabled` | Academy turned scores off | "Dit Scores are off at your academy" |

## Visibility, sharing and comparison

**Visibility (DS-07):**
- Coaches always see the score.
- Under 16, guardians always see it.
- From 16, the athlete chooses: coaches only, + family, or + squad.

**Milestone sharing (DS-06):**
- It stays inside ditdit (squad and family only), with no likes or counts.
- Under 16, a guardian must approve first.

**Squad comparison (DS-04, DS-05):**
- It is opt-in, and only in batches the academy enables.
- It applies from age 13.
- It ranks **4-week improvement**, not the score.
- It shows bands under 16 and positions from 16 (an academy setting).
- Teammates are never named.

**Not offered:**
- Academy-wide ranking across age groups.
- Cross-sport comparison.

Both stay off until there is a validated normalisation method.

## Validation needed before production

1. Expert panel per sport to define skill tests and how they map to development stage.
2. Choice of weights, using coach judgement studies plus retrospective data. Test for bias by age, gender, attendance constraints and coach.
3. Stability and sensitivity: how much a single mismarked session can move the score.
4. Comprehension testing with athletes aged 7–9, 10–12, 13–15 and 16–18, and with parents.
5. Wellbeing review: no discouraging rankings for young athletes; monitoring for pressure effects.
6. A governance and appeal process for disputed scores.
