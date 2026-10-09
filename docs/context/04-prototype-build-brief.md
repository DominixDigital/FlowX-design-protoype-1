# Prototype build brief

## Objective

Build a coherent, clickable FlowX prototype that demonstrates the athlete-development operating loop across Management Web, Coach Mobile, Parent App, and Athlete App. Use the extracted flow files as behavioral requirements and the JSON files as structured test scenarios.

The first prototype should optimize for validating product logic, navigation, cross-surface continuity, and state handling. It does not need production integrations.

## Recommended prototype sequence

### Slice 1 — Academy foundation

- Management Web: create academy, add a location, configure sport, complete setup.
- Add a head coach, coach, athlete, and batch.
- Assign the coach and move between academy/role contexts.
- Include validation, duplicate, revoked-session, and retry states.

### Slice 2 — Session execution

- Coach Mobile: sign in, select academy, view today's sessions, open/start/end a session.
- Load roster and mark attendance.
- Open an athlete, inspect current focus, add an observation, and save offline.
- Surface queued, synced, conflicted, and failed states.

### Slice 3 — Development loop

- Create a development area and goal.
- Add a drill/next action and delegate a task.
- Complete work, attach observation/video evidence, reassess, and mark a milestone.
- Show the resulting history in Management Web.

### Slice 4 — Communication loop

- Management Web: create, preview, approve, share, and correct a progress report.
- Parent App: open a report from a notification/deep link and view comment, milestone, attendance, competition, and optional video.
- Athlete App: view current focus, practice assignment, coach feedback, shared video, progress, and milestone.

### Slice 5 — Cross-system stress cases

- user with multiple roles and academies;
- permission or assignment changes while a screen is open;
- duplicate submit after an uncertain response;
- object archived or reassigned between list and detail;
- offline change colliding with a server change;
- upload accepted locally but rejected or delayed server-side;
- report or feedback withdrawn after notification.

## Prototype personas and fixtures

Create at least these seeded identities:

| Persona | Context |
|---|---|
| Asha Mehta | Academy owner/admin for Velocity Cricket Academy |
| Rohan Shah | Head coach; web and mobile access |
| Neha Rao | Coach; assigned to U16 Elite |
| Arjun Patel | Assistant coach; temporary scoped access |
| Kabir Singh | Athlete; active development area and upcoming reassessment |
| Maya Singh | Parent of Kabir and a second child |
| Tara Singh | Athlete with direct login |
| Multi-role fixture | Parent plus coach, with two academies |
| Offline fixture | Coach with queued attendance, observation, and video upload |

Suggested academy fixtures:

- Velocity Cricket Academy
- Main Ground and Indoor Nets locations
- U16 Elite and U14 Foundation batches
- one active and one archived location;
- one active and one archived coach;
- athletes in normal, duplicate-suspected, transferred, and archived states.

## Shared application states

Every relevant screen should be testable in:

- loading;
- empty;
- populated;
- validation error;
- permission denied;
- stale or archived object;
- network unavailable;
- save/upload processing;
- success;
- retry after uncertain outcome;
- offline queued;
- sync conflict;
- withdrawn or corrected publication.

## Interaction requirements

- Keep active role and academy context visible.
- Preserve typed input on recoverable failures.
- Disable or deduplicate repeated submissions while the first request is pending.
- Revalidate permissions and object state before committing.
- Show whether data is local, queued, processing, synchronized, published, archived, or failed.
- Give conflicts an explicit resolution path.
- Preserve references and history when objects are archived.
- Deep links must have a safe fallback if access or target state changed.
- Externally shared content must show publication/correction/withdrawal state.
- All videos need capture/upload, processing, failed, ready, shared, and withdrawn states.

## Component inventory

### Shared

- role/academy context switcher;
- status badge;
- identity/avatar;
- search and filters;
- empty/error/permission state;
- confirmation and destructive-action guard;
- activity timeline;
- audit/history item;
- notification/deep-link landing state;
- offline/sync indicator;
- conflict-resolution panel;
- attachment/video state card.

### Management Web

- sidebar and dashboard shell;
- academy setup stepper;
- data table and bulk actions;
- staff invitation and role editor;
- athlete passport header;
- batch roster and assignment panel;
- development-area and goal cards;
- task board/list;
- reassessment review workspace;
- report composer, preview, approval, publication, and correction banner.

### Coach Mobile

- Today/session cards;
- roster attendance controls;
- athlete quick context;
- quick observation composer with voice placeholder;
- development/goal/task actions;
- handover composer;
- capture/upload queue;
- timestamp comment editor;
- reassessment checklist;
- session completion checklist;
- offline queue and conflict screen.

### Parent and Athlete Apps

- child switcher where applicable;
- progress summary and timeline;
- current focus/goal card;
- practice assignment;
- report reader;
- coach comment and feedback card;
- milestone card;
- attendance summary;
- competition card;
- shared video player state.

## Data and architecture guidance

- Use one shared domain schema across surfaces.
- Model permissions as capabilities resolved from user + role + academy + object state.
- Give create/save/upload/lifecycle commands idempotency keys.
- Store mobile commands in a visible local queue with server acknowledgement.
- Separate video binary upload state from video processing and publication state.
- Use explicit lifecycle enums instead of booleans.
- Use fixtures and a local mock service layer so every branch can be triggered.
- Keep unresolved policies centralized as feature flags or configuration.

## Definition of done for each implemented flow

A flow is prototype-complete when:

1. its entry point is reachable;
2. every primary-path step is interactive;
3. its success state is visible;
4. every documented exception in the relevant flow file can be triggered;
5. both added review cases can be demonstrated;
6. unresolved product rules are labelled as assumptions;
7. loading, empty, permission, stale-state, and network behavior are represented where relevant;
8. route, role, academy, and selected-entity context remain consistent;
9. it is traceable to its flow code and FigJam node ID.

