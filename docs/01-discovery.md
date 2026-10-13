# ditdit — discovery summary

Sources read: `docs/context/00`–`05` and the context-pack README (copied from the uploads), plus the three reference images in `docs/reference-images/`.

## What ditdit is

ditdit is an operating system for a sports academy. It runs the athlete-development loop:

**set up → organise → plan development → run sessions → capture evidence → reassess → communicate → keep continuity**

The loop runs across four separate apps that share one domain model:

| Surface | Platform | Who | Job |
|---|---|---|---|
| Management Web | Desktop web | Owner/admin, head coach | Configure, supervise, review, publish |
| Coach Mobile | Phone, works offline | Head coach, coach, assistant | Run sessions, capture, execute, reassess |
| Parent App | Phone | Parent / guardian | Read published progress, reports, attendance, competitions |
| Athlete App | Phone | Athlete | Focus, practice, feedback, progress |

The head-coach loop (HC01/HC02) runs across Management Web and Coach Mobile. The cross-system rules (XS01–XS07) apply on every surface.

## Roles

| Role | What they must be able to do | Source flows |
|---|---|---|
| Owner / admin | Set up the academy, staff, athletes, batches and allocation; read the dashboard | MW01–MW06 |
| Head coach | Everything coaches do, plus oversight, task delegation, reassessment approval and report approval; works on both web and mobile | MW06–MW11, HC01–02, CM* |
| Coach | Sessions, attendance, observations, development areas and goals, tasks, video, reassessment, wrap-up, offline work | CM01–CM14 |
| Assistant coach | Scoped or temporary work on tasks and handovers | MW02.03, MW04.04, CM08–09, XS01.07 |
| Parent | Onboarding and child links (several children, two guardians, a parent who is also a coach); reading only | PA01–PA05 |
| Athlete | Access depends on age and policy; reads, and marks practice complete | AT01–AT05 |
| System | Identity, visibility, notifications, sync, lifecycle, errors | XS01–XS07 |

## Major journeys (priority order for the prototype)

1. **Courtside capture:** Today → session → attendance → athlete context → voice or typed observation → offline queue → sync. (CM01–05, CM13–14)
2. **Development loop:** observation → development area → goal, drill and next action → delegated task → evidence → reassessment → milestone → web history. (CM06–08, CM10–12, MW08–10, HC01–02)
3. **Communication loop:** report composer → preview → approve → share → notification → parent reads, with correction and withdrawal. Feedback and video are shared with the athlete. (MW11, PA04, AT04, XS03)
4. **Oversight:** dashboard attention queue → athlete passport → development review → task board → reassessment review. (MW06–MW10)
5. **Foundation:** setup stepper → coaches → athletes and duplicates → batches → allocation. (MW01–MW05)

## Proposed screen architecture

Each surface keeps its own navigation. All surfaces share one design system and one data store.

```
Management Web (sidebar, 7 items)      Coach Mobile (bottom bar, 4 + capture)
  Overview        MW06                   Today          CM01.04, CM02.01, notifications
  Athletes        MW03, MW07 passport    Sessions       CM02, CM03, CM13
  Development     MW08, MW09, MW10       Athletes       CM04, CM06, CM07
  Reports         MW11                   Tasks          CM08, CM09, CM12
  Batches         MW04, MW05             (+) Capture    CM05 observation, CM10 video
  Staff           MW02                   Sync status    CM14 (always-visible pill)
  Academy         MW01

Parent App (bottom bar, 4)             Athlete App (bottom bar, 4)
  Home            PA02                   Focus          AT02
  Progress        PA03                   Practice       AT03
  Reports         PA04                   Feedback       AT04
  Schedule        PA05                   Progress       AT05
  Child switcher  PA01.04                 Access flows   AT01
```

The full traceable screen list is in [`02-screen-inventory.md`](02-screen-inventory.md).

## Where AI fits

**Finding:** none of the 312 flows specifies an AI capability. The closest are `CM05.03` Voice Input ("if introduced"), `CM09.02` handover summary ("where possible"), `MW11.02` Pull Development Information, and `MW10.03` / `CM12.03` evidence review.

So the AI layer, **dit (companion)**, attaches only to steps that already exist in the flows. It speeds up a step that already exists and never adds a new kind of decision:

| dit (companion) object | Anchored to | What it does | What stays human |
|---|---|---|---|
| **Voice → observation draft** | CM05.03, CM05.05, CM14.04 | Speech becomes a draft observation, with a suggested development-area link and an athlete match | The coach edits and saves; nothing saves on its own |
| **Evidence brief** | CM12.02–04, MW10.03 | Lists the notes, attendance, videos and goal state since the last review, each linked to its source record | The status decision |
| **Report comment draft** | MW11.02–03 | Drafts a parent-friendly comment from published-safe records only | Approve and share (MW11.09–10) |
| **Plain-language explainer** | PA04.03–04, PA03.03 | Rewrites a published report section for a parent | Reads published content only |
| **Moment explainer** | AT04.04 | Expands a coach's timestamp comment into a practice cue | Shows only feedback that is already published |
| **Handover summary** | CM09.02 | Summarises open work for the recipient | The sender confirms the recipient (CM09.04) |

Trust rules for every dit (companion) object:
- It cites its basis: links to the source records.
- It labels interpretation as **Suggestion**, never as fact.
- Consequential actions go through a **Proposed action** card with Confirm / Edit / Dismiss.
- AI-assisted records carry an "AI-drafted, coach-confirmed" mark in their history.

**Prototype honesty:** dit (companion) responses come from deterministic templates over the fixture records and are labelled as demo logic. Only open free-text questions can go to an optional Gemini function (`api/chat.ts`), and those answers carry an *AI-generated* label. Voice uses the browser's Web Speech API where it exists. Elsewhere it falls back to typing, plus a clearly labelled sample voice note.

## Visual directions explored

The same screen is rendered three ways at `#/explore`: Coach Mobile athlete context plus a voice-to-observation dit (companion).

- **A — Floodlit (Performance Lab):** ink background, lime glow, sculptural numbers, translucent layers.
- **B — Matchday (Sports Editorial):** duotone photo plates, giant condensed type, deep court blue.
- **C — Chalk (Functional Sports Intelligence):** chalk-white surfaces, forest ink, lime used like a highlighter.

**Chosen synthesis:** C is the base for everyday work. A is reserved for dit (companion) and performance insight. B is used only at identity moments: onboarding, the passport header, the report cover and milestones. Details and the scoring are on the explore page and in [`03-design-system.md`](03-design-system.md).

## Gaps, inconsistencies and assumptions

1. **The detailed flow files were not supplied.** That means `flows/*.md`, `data/*.json` and `CLAUDE.md`. The 412 documented exceptions and 624 review cases therefore can't be traced one by one. Screens implement the shared state set from the build brief: loading, empty, permission, stale/archived, offline, queued, conflict, failed, corrected and withdrawn. These states are triggered from the **Prototype controls** panel. *Needs: the flow files, to trace exceptions individually.*
2. **Reference C mismatch.** The brief describes Reference C as warm off-white with forest green and lime. The third image supplied is a dark, multicolour wellness-widget grid. I followed the brief's written description for C. From the image I took only the idea of glanceable tiles that each hold one metric.
3. **Sport.** The fixtures are cricket (Velocity Cricket Academy), while the references show tennis and padel. The UI stays sport-neutral, and the cricket vocabulary lives only in fixtures.
4. **No measured performance telemetry exists in the flows.** There is no speed, score or rating. All numbers come from records the system actually keeps: attendance, sessions, observations, goals, drill completions and days to reassessment. Ratings and statistics like the ones in the references are deliberately left out.
5. **Photography.** No licensed sport imagery is available. Editorial plates use a duotone graphic placeholder marked "photo slot".
6. **Unresolved rules** (from 03-open-decisions) live in one config file, `src/data/policy.ts`, and are shown as "Assumption" tags where they affect the UI. Examples: CM03.04 adding a walk-in athlete, CM06.05 the priority model, AT03.05 practice completion, MW10.04 approval policy.
7. **Count discrepancy** (308 vs 312 flows): 312 is used, as the context pack advises.

## Implementation sequence

1. Design tokens and the core components (Seam companion, dit (companion) objects, status badges, sync pill).
2. Shared store: fixtures, an idempotent command queue, and simulation switches.
3. Coach Mobile: courtside capture plus offline and conflict handling (journey 1).
4. Coach Mobile, then Web: the development loop and reassessment (journey 2 / HC01–02).
5. Web report composer, then Parent App and Athlete App (journey 3).
6. Web dashboard, passport and task board (journey 4); setup, staff and batches (journey 5).
7. Validation pass: screenshots at 390px and 1440px, keyboard, reduced motion.
