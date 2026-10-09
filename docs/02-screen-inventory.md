# Screen inventory and flow traceability

Each screen maps back to its flow codes from [`context/02-flow-registry.md`](context/02-flow-registry.md). The UI also shows codes inline as small grey `flow-code` labels, so testers can trace any element.

**Status key**
- ● Implemented and interactive.
- ◐ Partial or simulated. The note says what is simulated.
- ○ Not built. The reason is given.

## Management Web: `#/web`

| Screen | Route | Flows | Status |
|---|---|---|---|
| Overview: metrics, needs attention, coaches, today, pending reassessments, report status | `/web` | MW06.01–07 | ● |
| Athletes list, filters, add athlete with duplicate check, import, archive/reactivate, merge duplicate | `/web/athletes` | MW03.01–07, MW07.01 | ● |
| Athlete passport: Matchday header, tabs for overview/history, development, sessions, attendance, videos, reassessments, milestones, competitions, reports; edit profile; transfer | `/web/athletes/:id/:tab?` | MW07.02–11, MW03.04, MW03.07, HC01.01, HC01.07 | ● |
| Development oversight: area list, then goal, drill, observations, video evidence, decide follow-up, close | `/web/development/:areaId?` | MW08.01–07, HC02.05–06 | ● |
| Task board, bulk review, create/assign/instruct, status, reassign, follow-up, cancel | `/web/tasks/:taskId?` | MW09.01–08, HC01.02, HC02.03 | ● |
| Reassessment oversight: lists, assign, evidence and Huddle brief, submitted review, approve/update, next-action task, milestone | `/web/reassessments/:rid?` | MW10.01–07 | ● |
| Report list, start report | `/web/reports` | MW11.01, MW06.07 | ● |
| Report composer: pull dev info, Huddle comment draft, include toggles, live parent preview, approve, share, correct (versioned), withdraw | `/web/reports/:id` | MW11.02–11 | ● |
| Batches: create, add athletes, assign coach/assistant, move, rename, archive; allocation with primary and supporting coach; change during development sends a handover | `/web/batches/:batchId?` | MW04.01–07, MW05.01–04 | ● |
| Staff: invite (head coach / coach / assistant with expiry), accept (simulated), change role, deactivate with mandatory reassignment, reactivate, view assignments | `/web/staff` | MW02.01–08, MW05.05 | ◐ invitation email is simulated |
| Academy: details, locations, setup wizard with resume | `/web/academy` | MW01.01–06 | ● |

## Coach Mobile: `#/coach`

| Screen | Route | Flows | Status |
|---|---|---|---|
| Academy and role selection; parent+coach handoff | `/coach/context` | CM01.02–03, XS01.01–04 | ◐ sign-in (CM01.01) is the persona picker |
| Today: sessions, resume, needs you, notifications | `/coach` | CM01.04–05, CM02.01, XS03.01–02 | ● |
| Sessions and history | `/coach/sessions` | CM02.01, CM13.05 | ● |
| Session: info, plan, start, roster attendance, walk-in, save/correct, end | `/coach/session/:id` | CM02.02–05, CM03.01–06, CM14.02–03 | ● |
| Wrap-up: notes, uploads, complete, cancel | `/coach/session/:id/wrap` | CM13.01–04, CM13.07 | ● |
| Athletes list (assistant scope applied) | `/coach/athletes` | CM04.01, XS01.07, XS02.S02 | ● |
| Athlete context: focus, next action, last session, reassessment state, relevant video, notes and corrections | `/coach/athlete/:id` | CM04.01–06, CM05.07 | ● |
| New development area: check existing, reopen, priority, cancel | `/coach/athlete/:id/area/new` | CM06.01–06 | ● |
| Goal editor: next action, drill, frequency, replace drill, mark achieved | `/coach/goal/:id` | CM07.01–07 | ● |
| Capture: typed observation | `/coach/capture?mode=note` | CM05.01–06, CM08.05, CM14.04 | ● |
| Capture: Huddle voice note to draft observation | Huddle sheet | CM05.03–06 | ● real Web Speech API where supported; labelled sample note otherwise |
| Capture: video record/upload, review, attach, upload, background, failure | `/coach/capture?mode=video` | CM10.01–11, CM08.06, CM14.05–06 | ◐ real camera/file pick; upload and processing simulated |
| Video review: scrub, timestamp comments, edit, share selected, withdraw, re-link | `/coach/video/:id` | CM11.01–06, CM10.12 | ◐ real playback for local files; fixtures have no media |
| Tasks and handovers list | `/coach/tasks` | CM08.01, CM09 | ● |
| Task execution with commit-time version check | `/coach/tasks/:id` | CM08.02–09, XS04.S03, XS07.S08 | ● |
| Handover: start, recipient opens, convert to follow-up | `/coach/handover/new`, `/:id` | CM09.01–06 | ● |
| Reassessment checklist with evidence brief | `/coach/reassess/:id` | CM12.01–09, HC02.07 | ● |
| Sync queue: offline, retry, conflict resolution | `/coach/sync` | CM14.01–09, XS04.S01, XS07.S01–02/05/09 | ● |

## Parent App: `#/parent`

| Screen | Route | Flows | Status |
|---|---|---|---|
| Onboarding: invitation code, account, link child, two guardians | `/parent/onboarding` | PA01.01–05 | ◐ account creation simulated |
| Child switcher (always visible) | header | PA01.04 | ● |
| Guardian removed state | any child screen | PA01.06 | ● toggled from prototype controls |
| Parent who is also a coach | Home banner, coach context | PA01.07, XS01.03 | ● |
| Home: focus, latest comment, attendance, milestone, competition | `/parent` | PA02.01–07 | ● |
| Progress: focus/status, family timeline, milestones, older reports | `/parent/progress` | PA03.01–06 | ● |
| Notifications with withdrawn fallback | `/parent/notifications` | PA04.01, XS03.03 | ● |
| Report reader: deep-link revalidation, corrected/withdrawn, video notes, Huddle explainer | `/parent/report/:id` | PA04.02–07, XS07.S07–08 | ● |
| Schedule: attendance, session count, upcoming, competition changes | `/parent/schedule` | PA05.01–05 | ● |

## Athlete App: `#/athlete`

| Screen | Route | Flows | Status |
|---|---|---|---|
| Access: enabled, own login, parent device, ages up, changes academy | `/athlete/access` | AT01.01–06 | ◐ sign-in simulated |
| Focus home: focus, goal, next practice, coach tip, milestones, competition | `/athlete` | AT02.01–06 | ● |
| Practice: drill, goal, video, mark done, assignment changed | `/athlete/practice` | AT03.01–06 | ● |
| Feedback list and detail: timestamp comments, Huddle moment explainer, withdrawn | `/athlete/feedback/:id?` | AT04.01–06, XS03.04–05 | ● |
| Progress: status per area, achieved/reopened, milestones, timeline | `/athlete/progress` | AT05.01–06 | ● |

## Cross-system

| Concern | Where it lives | Flows | Status |
|---|---|---|---|
| Identity and role scenarios | Persona pickers, `/coach/context`, `useCoach` gate | XS01.01–07 | ● |
| Visibility scopes | `timelineFor(audience)`; parent and athlete never see internal notes or unshared comments | XS02.S01–05 | ● |
| Notifications and deep links | Store notifications plus reader revalidation | XS03.01–06 | ● simulated delivery |
| Sync conflicts | Attendance: human resolution. Task: version check. Report: stale-save refusal. Video: separate upload/processing/share | XS04.S01–04, S06 | ◐ profile conflict (S05) not built |
| Data lifecycle | Archive/reactivate/transfer, inactive coach, archived batch, area achieved/reopened, report versions, guardian link | XS05.S01–09 | ● |
| Screen maps | This document | XS06 | ● |
| Error and recovery states | `StateBlock`, banners, sync queue, prototype controls | XS07.S01–02, S04–09 | ◐ auth failure (S03) not built |

## Not built

- **Detailed exception and review cases.** The 412 exceptions and 624 review cases sit in `flows/*.md`, which weren't supplied. The shared state set covers the common ones.
- **Real sign-in and auth failure** (CM01.01, XS07.S03). Persona switching stands in.
- **Profile sync conflict** (XS04.S05).
