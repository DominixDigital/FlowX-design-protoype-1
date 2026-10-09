# FlowX information architecture

This document preserves the board's section hierarchy. Arrows between flow names indicate the left-to-right or top-to-bottom ordering shown inside each FigJam group; they are not a claim that every flow automatically invokes the next one.

## System-level IA

```text
FlowX
├── Management Web
│   ├── Academy setup and configuration
│   ├── Coaches and roles
│   ├── Athletes and imports
│   ├── Batches and assignments
│   ├── Dashboards and athlete passport
│   ├── Development review and task oversight
│   ├── Reassessment and milestones
│   └── Progress reports
├── Coach Mobile
│   ├── Authentication and academy context
│   ├── Sessions and attendance
│   ├── Athlete context and observations
│   ├── Development areas, goals, and drills
│   ├── Tasks and handovers
│   ├── Video capture, upload, comments, and sharing
│   ├── Reassessment and session completion
│   └── Offline mode and sync
├── Parent App
│   ├── Invitation, account, and child links
│   ├── Home / overview
│   ├── Progress history
│   ├── Reports and notifications
│   └── Attendance and competition
├── Athlete App
│   ├── Access and login
│   ├── Current focus
│   ├── Practice assignments
│   ├── Feedback and shared video
│   └── Progress timeline and milestones
├── Head Coach Cross-Platform
│   ├── Web-to-mobile development loop
│   └── Courtside delegation and reassessment
└── Cross-System
    ├── Identity and role scenarios
    ├── Visibility rules
    ├── Notifications and deep links
    ├── Sync conflicts
    ├── Data lifecycle
    ├── Screen ownership
    └── Error states
```

## Management Web

**Audience:** Academy Owner / Admin / Head Coach  
**Coverage:** 11 IA groups, 84 detailed flows

### A1 — Academy Setup First-time setup: create academy, add location, configure sport, complete.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW01.01` Create Academy → `MW01.02` Add Academy Location → `MW01.03` Configure Sport → `MW01.04` Complete Initial Setup → `MW01.05` Resume Incomplete Setup → `MW01.06` Edit Academy Details.

### A2 — Coaching Team Build the coaching roster: invite head coach, coaches, assistants. Manage roles.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW02.01` Add Head Coach → `MW02.02` Add Coach → `MW02.03` Add Assistant Coach → `MW02.04` Accept Invitation → `MW02.05` Change Role → `MW02.06` Deactivate Coach → `MW02.07` Reactivate Coach → `MW02.08` View Coach Assignment.

### A3 — Athlete Roster Add or import athletes. Detect duplicates. Edit, archive, transfer.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW03.01` Add Athlete → `MW03.02` Import Athletes → `MW03.03` Detect Possible Duplicate → `MW03.04` Edit Athlete Profile → `MW03.05` Archive Athlete → `MW03.06` Reactivate Athlete → `MW03.07` Athlete Transfers Academy.

### A4 — Batch / Squad Create batches, assign athletes and coaches. Move, archive, rename.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW04.01` Create Batch → `MW04.02` Add Athletes → `MW04.03` Assign Coach → `MW04.04` Assign Assistant → `MW04.05` Move Athlete → `MW04.06` Archive Batch → `MW04.07` Rename Batch.

### A5 — Coach ↔ Athlete Allocation Assign primary coach, change, add supporting. Handle reassignment and departures.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW05.01` Assign Primary Coach → `MW05.02` Change Primary Coach → `MW05.03` Add Supporting Coach → `MW05.04` Reassign During Development → `MW05.05` Coach Leaves Academy.

### A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW06.01` View Academy Overview → `MW06.02` View Athlete Overview → `MW06.03` View Coach Overview → `MW06.04` View Athletes Needing Attention → `MW06.05` View Pending Reassessments → `MW06.06` View Open Coach Tasks → `MW06.07` View Parent Report Status.

### A7 — Athlete Passport Search → overview → development, sessions, attendance, videos, reassessments, milestones, competitions, reports.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW07.01` Search Athlete → `MW07.02` View Athlete Overview → `MW07.03` View Current Development → `MW07.04` View Development History → `MW07.05` View Session History → `MW07.06` View Attendance → `MW07.07` View Videos → `MW07.08` View Reassessments → `MW07.09` View Milestones → `MW07.10` View Competitions → `MW07.11` View Shared Reports.

### A8 — Development Oversight Review active areas → goal → drill → observations → video evidence → decide follow-up → close area.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW08.01` Review Active Development Areas → `MW08.02` Review Goal → `MW08.03` Review Assigned Drill → `MW08.04` Review Coach Observations → `MW08.05` Review Video Evidence → `MW08.06` Decide Follow-Up → `MW08.07` Close Development Area.

### A9 — Task Assignment & Review Create task → assign coach → add instruction → view status → reassign, follow-up, cancel, or bulk review.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW09.01` Create Task → `MW09.02` Assign Coach / Assistant → `MW09.03` Add Instruction → `MW09.04` View Task Status → `MW09.05` Reassign Task → `MW09.06` Request Follow-Up → `MW09.07` Cancel Task → `MW09.08` Bulk Review Tasks.

### A10 — Reassessment Oversight View pending → assign → review evidence → review submitted → update status → next action → mark milestone.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW10.01` View Pending Reassessments → `MW10.02` Assign Reassessment → `MW10.03` Review Evidence → `MW10.04` Review Submitted Reassessment → `MW10.05` Update/Approve Status → `MW10.06` Create Next Action → `MW10.07` Mark Milestone.

### A11 — Parent Report Start report → pull dev info → add comment → include attendance, milestones, competition, video → preview → approve → share.

Board labels: ▸ Primary Flow · ▹ Branches & Alternates

Flows: `MW11.01` Start Progress Report → `MW11.02` Pull Development Information → `MW11.03` Add Coach Comment → `MW11.04` Include Attendance → `MW11.05` Include Milestone → `MW11.06` Include Competition Update → `MW11.07` Include Video → `MW11.08` Preview Parent View → `MW11.09` Approve Report → `MW11.10` Share Report → `MW11.11` Correct Shared Report.

## Coach Mobile

**Audience:** Coach / Head Coach / Assistant Coach  
**Coverage:** 14 IA groups, 100 detailed flows

### B1: Authentication & Entry CM01 · Sign-in → Role ID → Academy → Today's Work

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM01.01` Sign In → `CM01.02` Identify Role → `CM01.03` Choose Academy → `CM01.04` Load Today's Work → `CM01.05` Resume Previous Work.

### B2: Session Management CM02 · View Sessions → Open → Review → Start / End

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM02.01` View Today's Sessions → `CM02.02` Open Session → `CM02.03` Review Session Info → `CM02.04` Start Session → `CM02.05` End Session.

### B3: Attendance CM03 · Load Roster → Mark Present / Absent → Save

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM03.01` Load Roster → `CM03.02` Mark Present → `CM03.05` Save Attendance → `CM03.03` Mark Absent → `CM03.04` Athlete Not Listed → `CM03.06` Correct Attendance.

### B4: Athlete Context CM04 · Open Athlete → Current Focus → Next Action

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM04.01` Open Athlete from Session → `CM04.02` View Current Focus → `CM04.04` View Next Action → `CM04.03` View Last Session → `CM04.05` View Reassessment State → `CM04.06` View Relevant Video.

### B5: Observations CM05 · Quick Add → Type / Voice → Link → Save

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM05.01` Quick Add Observation → `CM05.02` Type Note → `CM05.04` Link to Session → `CM05.03` Voice Input → `CM05.05` Link Existing Development Area → `CM05.06` Leave Unstructured → `CM05.07` Correct Observation.

### B6: Development Areas CM06 · Identify Issue → Check / Create Area → Prioritise

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM06.01` Identify Issue → `CM06.02` Check Existing Areas → `CM06.03` Create New Area → `CM06.05` Prioritise → `CM06.04` Reopen Previous Area → `CM06.06` Cancel Creation.

### B7: Goal Management CM07 · Create → Edit → Next Action → Drill → Frequency

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM07.01` Create Goal → `CM07.02` Edit Goal → `CM07.03` Set Next Action → `CM07.04` Add Drill → `CM07.05` Assign Frequency → `CM07.06` Replace Drill → `CM07.07` Mark Goal Achieved.

### B8: Task Execution CM08 · Receive → Open → Review → Conduct → Observe → Complete

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM08.01` Receive Assignment → `CM08.02` Open Task → `CM08.03` Review Head Coach Instruction → `CM08.04` Conduct Work → `CM08.05` Add Observation → `CM08.07` Mark Completed → `CM08.06` Attach Video → `CM08.08` Mark Blocked → `CM08.09` Request Follow-Up.

### B9: Handover CM09 · Start → Summary → Next Action → Assign → Receive

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM09.01` Start Handover → `CM09.02` Add Summary → `CM09.03` Add Required Next Action → `CM09.04` Assign Recipient → `CM09.05` Recipient Opens Handover → `CM09.06` Convert to Follow-Up.

### B10: Video Capture CM10 · Launch → Capture → Review → Attach → Upload

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM10.01` Launch Camera → `CM10.02` Capture Clip → `CM10.03` Review Clip → `CM10.05` Attach Athlete → `CM10.06` Attach Development Area → `CM10.09` Upload → `CM10.04` Upload Existing Clip → `CM10.07` Attach Goal → `CM10.08` Add Comment → `CM10.10` Background Upload → `CM10.11` Failed Upload → `CM10.12` Remove Wrong Attachment.

### B11: Video Review & Feedback CM11 · Play → Pause → Comment → Share

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM11.01` Play Video → `CM11.02` Pause at Moment → `CM11.03` Add Comment → `CM11.04` Edit Comment → `CM11.05` Add Multiple Comments → `CM11.06` Share Selected Feedback.

### B12: Reassessment CM12 · Open Pending → Review → Record → Choose Status → Complete

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM12.01` Open Pending Reassessment → `CM12.02` Review Goal → `CM12.03` Review Notes → `CM12.05` Record Reassessment Note → `CM12.06` Choose Status → `CM12.07` Set Next Action → `CM12.09` Complete → `CM12.04` Review Video → `CM12.08` Add Milestone.

### B13: Session Wrap-up CM13 · Review → Resolve Notes → Resolve Uploads → Complete

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM13.01` Review Session → `CM13.02` Resolve Draft Notes → `CM13.03` Resolve Uploads → `CM13.04` Complete Session → `CM13.05` View History → `CM13.06` Edit Historical Session → `CM13.07` Cancel Session.

### B14: Offline Mode CM14 · Detect Offline → Cache → Work Offline → Reconnect → Sync

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `CM14.01` Detect Offline State → `CM14.02` View Cached Session → `CM14.03` Mark Attendance Offline → `CM14.04` Add Observation Offline → `CM14.05` Record Video Offline → `CM14.06` Queue Upload → `CM14.07` Reconnect → `CM14.09` Sync Complete → `CM14.08` Resolve Conflict.

## Parent App

**Audience:** Parent / Guardian  
**Coverage:** 5 IA groups, 32 detailed flows

### C1: Parent Onboarding PA01 · Receive Invite → Create Account → Link Child

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `PA01.01` Receive Invite → `PA01.02` Create / Access Account → `PA01.03` Link Child → `PA01.04` Parent Has Multiple Children → `PA01.05` Two Guardians → `PA01.06` Guardian Removed → `PA01.07` Parent Also Coach.

### C2: Dashboard PA02 · Open App → Overall Progress → Coach Focus

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `PA02.01` Open App → `PA02.02` View Overall Progress → `PA02.03` View Coach Focus → `PA02.04` View Latest Comment → `PA02.05` View Milestone → `PA02.06` View Attendance → `PA02.07` View Competition.

### C3: Progress Tracking PA03 · Open Progress → Current Focus → Status

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `PA03.01` Open Progress → `PA03.02` View Current Focus → `PA03.03` View Progress Status → `PA03.04` View Development History → `PA03.05` View Milestones → `PA03.06` View Older Reports.

### C4: Reports & Feedback PA04 · Receive Notification → Open → Read Report

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `PA04.01` Receive Notification → `PA04.02` Open Deep Link → `PA04.03` Read Report → `PA04.04` View Coach Comment → `PA04.05` View Milestone → `PA04.06` View Video → `PA04.07` Revisit Report.

### C5: Attendance & Competition PA05 · View Attendance → Session Count → Competition

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `PA05.01` View Attendance Summary → `PA05.02` View Session Count → `PA05.03` View Upcoming Competition → `PA05.04` View Competition Update → `PA05.05` Competition Changed.

## Athlete App

**Audience:** Athlete (with parent-device scenarios)  
**Coverage:** 5 IA groups, 30 detailed flows

### D1: Athlete Access & Onboarding AT01 · Access Enabled → Create Login → Sign In

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `AT01.01` Athlete Access Enabled → `AT01.02` Create Athlete Login → `AT01.03` Sign In → `AT01.04` Parent Device Access → `AT01.05` Athlete Ages Up → `AT01.06` Athlete Changes Academy.

### D2: Athlete Dashboard AT02 · Current Focus → Goal → Next Practice

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `AT02.01` View Current Focus → `AT02.02` View Goal → `AT02.03` View Next Practice → `AT02.04` View Latest Coach Tip → `AT02.05` View Progress → `AT02.06` View Upcoming Competition.

### D3: Practice AT03 · Open Practice → View Drill → View Goal

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `AT03.01` Open Practice → `AT03.02` View Drill → `AT03.03` View Goal → `AT03.04` Watch Practice Video → `AT03.05` Practice Completed → `AT03.06` Assignment Changed.

### D4: Feedback AT04 · Open Feedback → Read Comment → Watch Video

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `AT04.01` Open Feedback → `AT04.02` Read Coach Comment → `AT04.03` Watch Shared Video → `AT04.04` View Timestamp Comment → `AT04.05` View Older Feedback → `AT04.06` Feedback Withdrawn.

### D5: Progress & Milestones AT05 · Open Progress → Current Status → Timeline

Board labels: ▶ Primary Flow · ↗ Branches & Alternates

Flows: `AT05.01` Open Progress → `AT05.02` View Current Status → `AT05.03` View Timeline → `AT05.04` View Milestone → `AT05.05` Development Area Achieved → `AT05.06` Area Reopened.

## Head Coach Cross-Platform

**Audience:** Head Coach  
**Coverage:** 2 IA groups, 14 detailed flows

### E1: Web-to-Mobile Development Loop HC01 · Review on Web → Create Task → Train on Mobile → Return to Web

Board labels: ▶ Primary Flow · ↩ Return Path

Flows: `HC01.01` Review Athlete on Web → `HC01.02` Create Development Task → `HC01.03` Open Coach App Later → `HC01.04` Conduct Training → `HC01.05` Record Observation → `HC01.06` Return to Web → `HC01.07` Review Updated History.

### E2: Courtside Observation & Delegation HC02 · Observe → Create Dev Area → Assign → Review → Reassess

Board labels: ▶ Primary Flow · ↩ Return Path

Flows: `HC02.01` Observe Athlete Courtside → `HC02.02` Create Development Area → `HC02.03` Assign Assistant → `HC02.04` Assistant Works → `HC02.05` Head Coach Reviews on Web → `HC02.06` Schedule Reassessment → `HC02.07` Reassess on Mobile.

## Cross-System Scenarios

**Audience:** All roles / System  
**Coverage:** 7 IA groups, 52 detailed flows

### F1: Identity & Role Scenarios XS01 · Single role → Multi-role → Cross-platform → Edge cases

Board labels: ▶ Core Scenarios · ↗ Edge Cases

Flows: `XS01.01` User has one role → `XS01.02` Head Coach uses Web + Mobile → `XS01.03` Parent is also Coach → `XS01.04` User belongs to multiple academies → `XS01.05` Role changes while logged in → `XS01.06` User removed from academy → `XS01.07` Assistant receives temporary access.

### F2: Visibility Scopes XS02 · What each role can see across the system

Board labels: 👁 Role Scopes · 👁 Additional Scopes

Flows: `XS02.S01` Internal Coach Only → `XS02.S02` Coaching Team → `XS02.S03` Athlete → `XS02.S04` Parent → `XS02.S05` Parent + Athlete.

### F3: Cross-System Notifications XS03 · Task → Reassessment → Report → Feedback → Video → Assignment

Board labels: ▶ Primary Triggers · ↗ Additional Triggers

Flows: `XS03.01` Coach receives task → `XS03.02` Reassessment due → `XS03.03` Parent report published → `XS03.04` Athlete feedback published → `XS03.05` Video shared → `XS03.06` Coach assignment changed.

### F4: Sync & Data Conflicts XS04 · Attendance → Development → Task → Video → Profile → Report

Board labels: ▶ Core Conflicts · ↗ Additional Conflicts

Flows: `XS04.S01` Attendance conflict → `XS04.S02` Development status conflict → `XS04.S03` Task conflict → `XS04.S04` Video state conflict → `XS04.S05` Profile conflict → `XS04.S06` Report conflict.

### F5: Data Lifecycle XS05 · Entity states across Athlete, Coach, Batch, Dev Area, Goal, Task, Video, Report, Parent

Board labels: ▶ Core Entities · ↗ Supporting Entities

Flows: `XS05.S01` Athlete → `XS05.S02` Coach → `XS05.S03` Batch → `XS05.S04` Development Area → `XS05.S05` Goal → `XS05.S06` Task → `XS05.S07` Video → `XS05.S08` Report → `XS05.S09` Parent Link.

### F6: Screen Maps XS06 · Academy → Coach → Athlete → Development → Video → Reassessment → Parent → Practice → Competition → Milestones

Board labels: ▶ Primary Screens · ↗ Additional Screens

Flows: `XS06.S01` Academy → `XS06.S02` Coach Home → `XS06.S03` Athlete → `XS06.S04` Development → `XS06.S05` Video → `XS06.S06` Reassessment → `XS06.S07` Parent → `XS06.S08` Athlete Practice → `XS06.S09` Competition → `XS06.S10` Milestones.

### F7: Error & Recovery States XS07 · Save → Upload → Auth → Partial Save → Sync → Processing → Permission → Deleted → Network

Board labels: ▶ Core Errors · ↗ Additional Errors

Flows: `XS07.S01` Save failure → `XS07.S02` Upload failure → `XS07.S03` Authentication failure → `XS07.S04` Partial data save → `XS07.S05` Sync conflict → `XS07.S06` Processing failure → `XS07.S07` Permission denied → `XS07.S08` Deleted/inactive object → `XS07.S09` Network unavailable.

## Navigation model for prototypes

The following navigation is an implementation-oriented inference from the flows.

### Management Web

- Overview
- Academy
  - Details
  - Locations
  - Sport / setup
- People
  - Coaches and roles
  - Athletes
  - Parent links
- Batches
- Development
  - Development areas
  - Goals and drills
  - Tasks
  - Reassessments
  - Milestones
- Sessions and attendance
- Video
- Reports
- Competitions
- Settings / role and academy context

### Coach Mobile

- Today
- Sessions
- Athletes
- Tasks
- Capture
  - Observation
  - Video
- Reassessments
- Notifications / handovers
- Offline queue and sync status
- Profile / academy and role switcher

### Parent App

- Home
- Progress
- Reports
- Attendance
- Competitions
- Children switcher
- Profile / guardian links

### Athlete App

- Home / current focus
- Practice
- Feedback
- Progress
- Competitions
- Profile

## Cross-surface ownership

| Capability | System of action | Read/summary surfaces |
|---|---|---|
| Academy, staff, athletes, batches | Management Web | Coach Mobile and consumer apps receive scoped context |
| Session execution and attendance | Coach Mobile | Management Web, Parent App summaries |
| Observations and courtside evidence | Coach Mobile | Management Web review; selected Parent/Athlete publication |
| Development areas, goals, tasks | Management Web and Coach Mobile | Athlete App, selected Parent App summaries |
| Video capture and upload | Coach Mobile | Management Web review; selected Parent/Athlete sharing |
| Reassessment and milestone decisions | Coach Mobile execution, Management Web oversight | Parent and Athlete Apps |
| Progress report assembly and approval | Management Web | Parent App; selected Athlete App information |
| Identity, permissions, sync, lifecycle | Shared backend | All surfaces |

## Context selectors that must remain visible

- active academy;
- active user role;
- selected athlete or child;
- selected batch/session;
- offline/sync state on mobile;
- draft/published/archived state for externally visible content.

