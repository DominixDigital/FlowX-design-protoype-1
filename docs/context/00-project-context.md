# FlowX project context

## Product definition

FlowX is a multi-surface sports-academy operating system for managing an athlete-development loop from academy setup through coaching, evidence capture, reassessment, milestones, and stakeholder reporting.

The product is not a single app. It is a coordinated system with four user-facing surfaces plus cross-platform and cross-system behavior:

| Surface | Main users | Primary job |
|---|---|---|
| Management Web | Academy owner, admin, head coach | Configure the academy, manage people and batches, supervise development work, review reassessments, and publish reports |
| Coach Mobile | Coach, assistant coach, head coach | Run sessions, take attendance, capture observations and video, execute tasks, reassess athletes, and work offline |
| Parent App | Parent or guardian | Link children, follow progress, read reports and coach comments, view milestones, attendance, and competition updates |
| Athlete App | Athlete | View focus and goals, complete practice work, consume feedback and video, and follow progress |
| Cross-platform head-coach loop | Head coach | Create work on web, execute or supervise it on mobile, then review synchronized history on web |
| Cross-system layer | All roles and services | Resolve identity, permissions, notifications, sync conflicts, lifecycle rules, screen ownership, and error states |

## Product goals inferred from the board

1. Give an academy one coherent source of truth for athletes, coaches, sessions, and development work.
2. Make courtside capture fast enough for real coaching: attendance, observations, tasks, video, and reassessment.
3. Preserve continuity across web, mobile, user roles, academy memberships, and offline periods.
4. Turn coaching activity into a durable athlete-development history rather than isolated notes.
5. Publish controlled, understandable progress information to parents and athletes.
6. Preserve historical and shared records when operational objects are archived, reassigned, or corrected.

## Users and role model

- **Academy Owner / Admin** — owns setup, locations, sport configuration, staff, athletes, batches, assignments, and operational oversight.
- **Head Coach** — works across web and mobile; reviews athletes, creates and delegates development work, supervises reassessment, and approves reports.
- **Coach** — runs training sessions and records attendance, observations, tasks, video, feedback, and reassessment evidence.
- **Assistant Coach** — receives scoped assignments or temporary access and contributes observations, evidence, and completion updates.
- **Parent / Guardian** — links one or more children, including multiple-guardian scenarios, and consumes published information.
- **Athlete** — receives access based on academy and age rules and consumes goals, practice, feedback, progress, milestones, and competition information.
- **System** — enforces role context, academy context, permission changes, lifecycle rules, synchronization, idempotency, and failure recovery.

A person may have multiple roles, may belong to multiple academies, and may change role or academy while signed in. Prototype identity and navigation must therefore model an active **role context** and **academy context**, not assume one permanent persona.

## Core domain model

| Entity | Purpose and important relationships |
|---|---|
| Academy | Root tenant and permission boundary; has locations, sports, staff, athletes, batches, and settings |
| Location | Training venue with an active/inactive lifecycle; historical sessions must survive closure |
| User / Identity | Authentication identity that can hold multiple roles and academy memberships |
| Coach Assignment | Connects coaches or assistants to batches, athletes, tasks, and development work |
| Athlete | Central longitudinal record; linked to academy, batch, guardians, sessions, development history, media, and reports |
| Batch | Training group containing athletes and assigned coaching staff |
| Session | Scheduled or ad-hoc coaching event with roster, attendance, notes, observations, tasks, and media |
| Attendance | Per-athlete session state with correction, offline capture, and conflict handling |
| Observation | Structured or unstructured coaching evidence, optionally linked to a session and development area |
| Development Area | Long-lived skill or issue under development; can be created, prioritized, closed, achieved, or reopened |
| Goal | Target within a development area; can have a next action, drill, frequency, and achieved state |
| Drill / Practice Assignment | Actionable work given to an athlete and surfaced in the Athlete App |
| Task | Delegated development work with owner, instructions, status, evidence, blocked state, reassignment, and follow-up |
| Handover | Cross-coach continuity record that can become a follow-up task |
| Video | Evidence captured or uploaded, processed, linked to athlete/session/goal/development area, commented by timestamp, and shared selectively |
| Reassessment | Review cycle that pulls goals, notes, observations, video, attendance, and evidence into a status decision |
| Milestone | Durable achievement created from development progress or reassessment |
| Report | Parent-facing progress publication with comments, attendance, milestones, competition updates, and optional video |
| Competition | Upcoming or historical event and update shown to management, parents, and athletes |
| Parent Link | Relationship between guardian and athlete, with multi-child, multi-guardian, revocation, and role-overlap cases |
| Notification / Deep Link | Routes users into tasks, reassessments, reports, feedback, video, and assignment changes |
| Sync Queue / Conflict | Mobile offline operations, upload state, retry behavior, and conflict resolution |

## End-to-end operating loop

1. **Set up the academy** — create academy, add locations, configure sport, and complete or resume setup.
2. **Build the organization** — invite staff, establish roles, add athletes, create batches, and assign coaches.
3. **Plan development work** — identify development areas, create goals, choose drills, create tasks, and schedule reassessment.
4. **Run sessions** — load the roster, mark attendance, open athlete context, capture observations, and execute assigned work.
5. **Capture evidence** — record or upload video, link it to domain objects, process it, and add timestamped feedback.
6. **Reassess** — review goals, notes, observations, video, and attendance; update status; create next actions; mark milestones.
7. **Communicate** — compile progress reports, preview parent view, approve and share; publish athlete feedback and notifications.
8. **Maintain continuity** — hand over work, reassign coaches, correct history, archive records without deleting references, and resolve offline or concurrency conflicts.

## Shared behavioral rules

Every detailed FigJam flow uses the same control pattern:

`Actor context → Entry → user/system actions → Edge case occurs? → No → System validates current state → outcome rules → Successful exit`

Exception branches then converge back into validation:

- **Documented exceptions** use a stated recovery rule.
- **Added review cases** preserve user input where possible, refresh authoritative state, and avoid silent duplication.
- **Product-rule unresolved markers** require an explicit product decision before high-fidelity implementation.
- Historical and externally shared data should be preserved when a live object is archived or deactivated.
- Any action that can be retried after uncertain network confirmation needs an idempotent server contract.
- Permission, role, academy, and object state must be revalidated at commit time, not only when a screen first loads.
- Mobile capture must distinguish local acceptance, queued upload, processing, server rejection, and synchronized completion.
- Corrective edits should retain auditability; reports and externally visible records need stronger correction semantics than drafts.

## Scope quantified

- 312 detailed flows across 44 IA groups
- 412 documented exception cases
- 624 added review cases
- 26 unresolved-rule markers
- 312 registry rows, despite the board title saying 308

## What the board does not specify

The FigJam provides flow intent and control logic, but not a final visual design system, field-level data schema, API contract, analytics plan, or exact MVP boundary. The prototype should therefore:

- use realistic fixture data and explicit loading/empty/error/permission states;
- avoid inventing irreversible policy where the board says a rule is unresolved;
- keep optional capabilities behind visible prototype assumptions or feature flags;
- maintain a shared domain model across all surfaces;
- record any new design decision in [03-open-decisions.md](03-open-decisions.md).

