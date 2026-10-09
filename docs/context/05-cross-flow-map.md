# Cross-flow map

This file preserves the connector-level relationships **between** detailed flow sections and **between** IA groups. Labels are copied from the FigJam connectors. For the steps inside each detailed flow, use the surface files under `flows/` or the exact graphs under `data/graphs/`.

## Management Web

### IA-group transitions

- **A1 — Academy Setup First-time setup: create academy, add location, configure sport, complete.** — → Build Coaching Team → **A2 — Coaching Team Build the coaching roster: invite head coach, coaches, assistants. Manage roles.**  
  Connector `23:9537`
- **A2 — Coaching Team Build the coaching roster: invite head coach, coaches, assistants. Manage roles.** — → Add Athletes → **A3 — Athlete Roster Add or import athletes. Detect duplicates. Edit, archive, transfer.**  
  Connector `23:9541`
- **A3 — Athlete Roster Add or import athletes. Detect duplicates. Edit, archive, transfer.** — → Create Batches → **A4 — Batch / Squad Create batches, assign athletes and coaches. Move, archive, rename.**  
  Connector `23:9545`
- **A4 — Batch / Squad Create batches, assign athletes and coaches. Move, archive, rename.** — → Allocate Coaches → **A5 — Coach ↔ Athlete Allocation Assign primary coach, change, add supporting. Handle reassignment and departures.**  
  Connector `23:9549`
- **A5 — Coach ↔ Athlete Allocation Assign primary coach, change, add supporting. Handle reassignment and departures.** — ✦ SETUP COMPLETE → Dashboard → **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.**  
  Connector `23:9553`
- **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.** — Athlete Overview → Passport → **A7 — Athlete Passport Search → overview → development, sessions, attendance, videos, reassessments, milestones, competitions, reports.**  
  Connector `23:9557`
- **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.** — Attention → Development → **A8 — Development Oversight Review active areas → goal → drill → observations → video evidence → decide follow-up → close area.**  
  Connector `23:9561`
- **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.** — Tasks → Assignment → **A9 — Task Assignment & Review Create task → assign coach → add instruction → view status → reassign, follow-up, cancel, or bulk review.**  
  Connector `23:9565`
- **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.** — Reassessments → Oversight → **A10 — Reassessment Oversight View pending → assign → review evidence → review submitted → update status → next action → mark milestone.**  
  Connector `23:9569`
- **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.** — Reports → Parent Report → **A11 — Parent Report Start report → pull dev info → add comment → include attendance, milestones, competition, video → preview → approve → share.**  
  Connector `23:9573`
- **A7 — Athlete Passport Search → overview → development, sessions, attendance, videos, reassessments, milestones, competitions, reports.** — View Development → → **A8 — Development Oversight Review active areas → goal → drill → observations → video evidence → decide follow-up → close area.**  
  Connector `23:9577`
- **A8 — Development Oversight Review active areas → goal → drill → observations → video evidence → decide follow-up → close area.** — Assign Coach Task → → **A9 — Task Assignment & Review Create task → assign coach → add instruction → view status → reassign, follow-up, cancel, or bulk review.**  
  Connector `23:9581`
- **A8 — Development Oversight Review active areas → goal → drill → observations → video evidence → decide follow-up → close area.** — Request Reassessment → → **A10 — Reassessment Oversight View pending → assign → review evidence → review submitted → update status → next action → mark milestone.**  
  Connector `23:9585`
- **A9 — Task Assignment & Review Create task → assign coach → add instruction → view status → reassign, follow-up, cancel, or bulk review.** — Trigger Reassessment → → **A10 — Reassessment Oversight View pending → assign → review evidence → review submitted → update status → next action → mark milestone.**  
  Connector `23:9589`
- **A10 — Reassessment Oversight View pending → assign → review evidence → review submitted → update status → next action → mark milestone.** — ← Follow-Up Task → **A9 — Task Assignment & Review Create task → assign coach → add instruction → view status → reassign, follow-up, cancel, or bulk review.**  
  Connector `23:9593`
- **A10 — Reassessment Oversight View pending → assign → review evidence → review submitted → update status → next action → mark milestone.** — Trigger Report → → **A11 — Parent Report Start report → pull dev info → add comment → include attendance, milestones, competition, video → preview → approve → share.**  
  Connector `23:9597`
- **A8 — Development Oversight Review active areas → goal → drill → observations → video evidence → decide follow-up → close area.** — ↩ Dashboard → **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.**  
  Connector `23:9601`
- **A9 — Task Assignment & Review Create task → assign coach → add instruction → view status → reassign, follow-up, cancel, or bulk review.** — ↩ Dashboard → **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.**  
  Connector `23:9605`
- **A10 — Reassessment Oversight View pending → assign → review evidence → review submitted → update status → next action → mark milestone.** — ↩ Dashboard → **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.**  
  Connector `23:9609`
- **A11 — Parent Report Start report → pull dev info → add comment → include attendance, milestones, competition, video → preview → approve → share.** — ↩ Dashboard → **A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.**  
  Connector `23:9613`

### A1 — Academy Setup First-time setup: create academy, add location, configure sport, complete.

- `MW01.01` Create Academy — **Next** → `MW01.02` Add Academy Location  
  Connector `23:9617`
- `MW01.02` Add Academy Location — **Next** → `MW01.03` Configure Sport  
  Connector `23:9621`
- `MW01.03` Configure Sport — **Complete** → `MW01.04` Complete Initial Setup  
  Connector `23:9625`
- `MW01.04` Complete Initial Setup — **Resume** → `MW01.05` Resume Incomplete Setup  
  Connector `23:9629`
- `MW01.04` Complete Initial Setup — **Edit Later** → `MW01.06` Edit Academy Details  
  Connector `23:9633`

### A2 — Coaching Team Build the coaching roster: invite head coach, coaches, assistants. Manage roles.

- `MW02.01` Add Head Coach — **Add Coach** → `MW02.02` Add Coach  
  Connector `23:9637`
- `MW02.02` Add Coach — **Add Assistant** → `MW02.03` Add Assistant Coach  
  Connector `23:9641`
- `MW02.01` Add Head Coach — **Invite Sent** → `MW02.04` Accept Invitation  
  Connector `23:9645`
- `MW02.02` Add Coach — **Invite Sent** → `MW02.04` Accept Invitation  
  Connector `23:9649`
- `MW02.04` Accept Invitation — **Change Role** → `MW02.05` Change Role  
  Connector `23:9653`
- `MW02.05` Change Role — **Deactivate** → `MW02.06` Deactivate Coach  
  Connector `23:9657`
- `MW02.06` Deactivate Coach — **Reactivate** → `MW02.07` Reactivate Coach  
  Connector `23:9661`
- `MW02.01` Add Head Coach — **View Assignments** → `MW02.08` View Coach Assignment  
  Connector `23:9665`

### A3 — Athlete Roster Add or import athletes. Detect duplicates. Edit, archive, transfer.

- `MW03.01` Add Athlete — **Or Import** → `MW03.02` Import Athletes  
  Connector `23:9669`
- `MW03.01` Add Athlete — **Duplicate Check** → `MW03.03` Detect Possible Duplicate  
  Connector `23:9673`
- `MW03.02` Import Athletes — **Duplicate Check** → `MW03.03` Detect Possible Duplicate  
  Connector `23:9677`
- `MW03.03` Detect Possible Duplicate — **Edit Profile** → `MW03.04` Edit Athlete Profile  
  Connector `23:9681`
- `MW03.04` Edit Athlete Profile — **Archive** → `MW03.05` Archive Athlete  
  Connector `23:9685`
- `MW03.05` Archive Athlete — **Reactivate** → `MW03.06` Reactivate Athlete  
  Connector `23:9689`
- `MW03.06` Reactivate Athlete — **Transfer** → `MW03.07` Athlete Transfers Academy  
  Connector `23:9693`

### A4 — Batch / Squad Create batches, assign athletes and coaches. Move, archive, rename.

- `MW04.01` Create Batch — **Add Athletes** → `MW04.02` Add Athletes  
  Connector `23:9697`
- `MW04.02` Add Athletes — **Assign Coach** → `MW04.03` Assign Coach  
  Connector `23:9701`
- `MW04.03` Assign Coach — **Assign Assistant** → `MW04.04` Assign Assistant  
  Connector `23:9705`
- `MW04.02` Add Athletes — **Move Athlete** → `MW04.05` Move Athlete  
  Connector `23:9709`
- `MW04.01` Create Batch — **Archive Batch** → `MW04.06` Archive Batch  
  Connector `23:9713`
- `MW04.01` Create Batch — **Rename** → `MW04.07` Rename Batch  
  Connector `23:9717`

### A5 — Coach ↔ Athlete Allocation Assign primary coach, change, add supporting. Handle reassignment and departures.

- `MW05.01` Assign Primary Coach — **Change Coach** → `MW05.02` Change Primary Coach  
  Connector `23:9721`
- `MW05.01` Assign Primary Coach — **Add Supporting** → `MW05.03` Add Supporting Coach  
  Connector `23:9725`
- `MW05.02` Change Primary Coach — **During Dev** → `MW05.04` Reassign During Development  
  Connector `23:9729`
- `MW05.04` Reassign During Development — **Coach Leaves** → `MW05.05` Coach Leaves Academy  
  Connector `23:9733`

### A6 — Management Dashboard Central hub: academy overview, athlete/coach summaries, attention queue, report status.

- `MW06.01` View Academy Overview — **Athletes** → `MW06.02` View Athlete Overview  
  Connector `23:9737`
- `MW06.01` View Academy Overview — **Coaches** → `MW06.03` View Coach Overview  
  Connector `23:9741`
- `MW06.01` View Academy Overview — **Needing Attention** → `MW06.04` View Athletes Needing Attention  
  Connector `23:9745`
- `MW06.01` View Academy Overview — **Reassessments** → `MW06.05` View Pending Reassessments  
  Connector `23:9749`
- `MW06.01` View Academy Overview — **Tasks** → `MW06.06` View Open Coach Tasks  
  Connector `23:9753`
- `MW06.01` View Academy Overview — **Reports** → `MW06.07` View Parent Report Status  
  Connector `23:9757`

### A7 — Athlete Passport Search → overview → development, sessions, attendance, videos, reassessments, milestones, competitions, reports.

- `MW07.01` Search Athlete — **View Overview** → `MW07.02` View Athlete Overview  
  Connector `23:9761`
- `MW07.02` View Athlete Overview — **Current Dev** → `MW07.03` View Current Development  
  Connector `23:9765`
- `MW07.02` View Athlete Overview — **Dev History** → `MW07.04` View Development History  
  Connector `23:9769`
- `MW07.02` View Athlete Overview — **Sessions** → `MW07.05` View Session History  
  Connector `23:9773`
- `MW07.02` View Athlete Overview — **Attendance** → `MW07.06` View Attendance  
  Connector `23:9777`
- `MW07.02` View Athlete Overview — **Videos** → `MW07.07` View Videos  
  Connector `23:9781`
- `MW07.02` View Athlete Overview — **Reassessments** → `MW07.08` View Reassessments  
  Connector `23:9785`
- `MW07.02` View Athlete Overview — **Milestones** → `MW07.09` View Milestones  
  Connector `23:9789`
- `MW07.02` View Athlete Overview — **Competitions** → `MW07.10` View Competitions  
  Connector `23:9793`
- `MW07.02` View Athlete Overview — **Reports** → `MW07.11` View Shared Reports  
  Connector `23:9797`

### A8 — Development Oversight Review active areas → goal → drill → observations → video evidence → decide follow-up → close area.

- `MW08.01` Review Active Development Areas — **Review Goal** → `MW08.02` Review Goal  
  Connector `23:9801`
- `MW08.02` Review Goal — **Review Drill** → `MW08.03` Review Assigned Drill  
  Connector `23:9805`
- `MW08.03` Review Assigned Drill — **Observations** → `MW08.04` Review Coach Observations  
  Connector `23:9809`
- `MW08.04` Review Coach Observations — **Video Evidence** → `MW08.05` Review Video Evidence  
  Connector `23:9813`
- `MW08.05` Review Video Evidence — **Decide Follow-Up** → `MW08.06` Decide Follow-Up  
  Connector `23:9817`
- `MW08.06` Decide Follow-Up — **Close Area** → `MW08.07` Close Development Area  
  Connector `23:9821`

### A9 — Task Assignment & Review Create task → assign coach → add instruction → view status → reassign, follow-up, cancel, or bulk review.

- `MW09.01` Create Task — **Assign Coach** → `MW09.02` Assign Coach / Assistant  
  Connector `23:9825`
- `MW09.02` Assign Coach / Assistant — **Add Instruction** → `MW09.03` Add Instruction  
  Connector `23:9829`
- `MW09.03` Add Instruction — **View Status** → `MW09.04` View Task Status  
  Connector `23:9833`
- `MW09.04` View Task Status — **Reassign** → `MW09.05` Reassign Task  
  Connector `23:9837`
- `MW09.04` View Task Status — **Follow-Up** → `MW09.06` Request Follow-Up  
  Connector `23:9841`
- `MW09.04` View Task Status — **Cancel** → `MW09.07` Cancel Task  
  Connector `23:9845`
- `MW09.01` Create Task — **Bulk Review** → `MW09.08` Bulk Review Tasks  
  Connector `23:9849`

### A10 — Reassessment Oversight View pending → assign → review evidence → review submitted → update status → next action → mark milestone.

- `MW10.01` View Pending Reassessments — **Assign** → `MW10.02` Assign Reassessment  
  Connector `23:9853`
- `MW10.02` Assign Reassessment — **Review Evidence** → `MW10.03` Review Evidence  
  Connector `23:9857`
- `MW10.03` Review Evidence — **Review Submitted** → `MW10.04` Review Submitted Reassessment  
  Connector `23:9861`
- `MW10.04` Review Submitted Reassessment — **Update Status** → `MW10.05` Update/Approve Status  
  Connector `23:9865`
- `MW10.05` Update/Approve Status — **Next Action** → `MW10.06` Create Next Action  
  Connector `23:9869`
- `MW10.06` Create Next Action — **Mark Milestone** → `MW10.07` Mark Milestone  
  Connector `23:9873`

### A11 — Parent Report Start report → pull dev info → add comment → include attendance, milestones, competition, video → preview → approve → share.

- `MW11.01` Start Progress Report — **Pull Dev Info** → `MW11.02` Pull Development Information  
  Connector `23:9877`
- `MW11.02` Pull Development Information — **Add Comment** → `MW11.03` Add Coach Comment  
  Connector `23:9881`
- `MW11.03` Add Coach Comment — **Attendance** → `MW11.04` Include Attendance  
  Connector `23:9885`
- `MW11.04` Include Attendance — **Milestone** → `MW11.05` Include Milestone  
  Connector `23:9889`
- `MW11.05` Include Milestone — **Competition** → `MW11.06` Include Competition Update  
  Connector `23:9893`
- `MW11.06` Include Competition Update — **Video** → `MW11.07` Include Video  
  Connector `23:9897`
- `MW11.07` Include Video — **Preview** → `MW11.08` Preview Parent View  
  Connector `23:9901`
- `MW11.08` Preview Parent View — **Approve** → `MW11.09` Approve Report  
  Connector `23:9905`
- `MW11.09` Approve Report — **Share** → `MW11.10` Share Report  
  Connector `23:9909`
- `MW11.10` Share Report — **Correct** → `MW11.11` Correct Shared Report  
  Connector `23:9913`
## Coach Mobile

### IA-group transitions

- **B1: Authentication & Entry CM01 · Sign-in → Role ID → Academy → Today's Work** — Authenticated → Sessions → **B2: Session Management CM02 · View Sessions → Open → Review → Start / End**  
  Connector `27:16580`
- **B2: Session Management CM02 · View Sessions → Open → Review → Start / End** — Session Opened → Attendance → **B3: Attendance CM03 · Load Roster → Mark Present / Absent → Save**  
  Connector `27:16584`
- **B3: Attendance CM03 · Load Roster → Mark Present / Absent → Save** — Attendance Done → Athlete View → **B4: Athlete Context CM04 · Open Athlete → Current Focus → Next Action**  
  Connector `27:16588`
- **B4: Athlete Context CM04 · Open Athlete → Current Focus → Next Action** — Athlete Viewed → Observations → **B5: Observations CM05 · Quick Add → Type / Voice → Link → Save**  
  Connector `27:16592`
- **B5: Observations CM05 · Quick Add → Type / Voice → Link → Save** — Observation Logged → Dev Areas → **B6: Development Areas CM06 · Identify Issue → Check / Create Area → Prioritise**  
  Connector `27:16596`
- **B6: Development Areas CM06 · Identify Issue → Check / Create Area → Prioritise** — Area Set → Goals → **B7: Goal Management CM07 · Create → Edit → Next Action → Drill → Frequency**  
  Connector `27:16600`
- **B7: Goal Management CM07 · Create → Edit → Next Action → Drill → Frequency** — Goal Created → Tasks → **B8: Task Execution CM08 · Receive → Open → Review → Conduct → Observe → Complete**  
  Connector `27:16604`
- **B8: Task Execution CM08 · Receive → Open → Review → Conduct → Observe → Complete** — Task Done → Handover → **B9: Handover CM09 · Start → Summary → Next Action → Assign → Receive**  
  Connector `27:16608`
- **B9: Handover CM09 · Start → Summary → Next Action → Assign → Receive** — Handover Sent → Video Capture → **B10: Video Capture CM10 · Launch → Capture → Review → Attach → Upload**  
  Connector `27:16612`
- **B10: Video Capture CM10 · Launch → Capture → Review → Attach → Upload** — Video Captured → Video Review → **B11: Video Review & Feedback CM11 · Play → Pause → Comment → Share**  
  Connector `27:16616`
- **B11: Video Review & Feedback CM11 · Play → Pause → Comment → Share** — Review Done → Reassessment → **B12: Reassessment CM12 · Open Pending → Review → Record → Choose Status → Complete**  
  Connector `27:16620`
- **B12: Reassessment CM12 · Open Pending → Review → Record → Choose Status → Complete** — Reassessed → Session Wrap-up → **B13: Session Wrap-up CM13 · Review → Resolve Notes → Resolve Uploads → Complete**  
  Connector `27:16624`
- **B13: Session Wrap-up CM13 · Review → Resolve Notes → Resolve Uploads → Complete** — Session Closed → Offline Mode → **B14: Offline Mode CM14 · Detect Offline → Cache → Work Offline → Reconnect → Sync**  
  Connector `27:16628`

### B1: Authentication & Entry CM01 · Sign-in → Role ID → Academy → Today's Work

- `CM01.01` Sign In — **Role ID** → `CM01.02` Identify Role  
  Connector `27:16632`
- `CM01.02` Identify Role — **Select Academy** → `CM01.03` Choose Academy  
  Connector `27:16636`
- `CM01.03` Choose Academy — **Load Work** → `CM01.04` Load Today's Work  
  Connector `27:16640`
- `CM01.04` Load Today's Work — **Resume Previous** → `CM01.05` Resume Previous Work  
  Connector `27:16644`

### B2: Session Management CM02 · View Sessions → Open → Review → Start / End

- `CM02.01` View Today's Sessions — **Open** → `CM02.02` Open Session  
  Connector `27:16648`
- `CM02.02` Open Session — **Review** → `CM02.03` Review Session Info  
  Connector `27:16652`
- `CM02.03` Review Session Info — **Start** → `CM02.04` Start Session  
  Connector `27:16656`
- `CM02.04` Start Session — **End Session** → `CM02.05` End Session  
  Connector `27:16660`

### B3: Attendance CM03 · Load Roster → Mark Present / Absent → Save

- `CM03.01` Load Roster — **Mark Present** → `CM03.02` Mark Present  
  Connector `27:16664`
- `CM03.02` Mark Present — **Save** → `CM03.05` Save Attendance  
  Connector `27:16668`
- `CM03.01` Load Roster — **Absent** → `CM03.03` Mark Absent  
  Connector `27:16672`
- `CM03.01` Load Roster — **Not Listed** → `CM03.04` Athlete Not Listed  
  Connector `27:16676`
- `CM03.05` Save Attendance — **Correct** → `CM03.06` Correct Attendance  
  Connector `27:16680`

### B4: Athlete Context CM04 · Open Athlete → Current Focus → Next Action

- `CM04.01` Open Athlete from Session — **View Focus** → `CM04.02` View Current Focus  
  Connector `27:16684`
- `CM04.02` View Current Focus — **Next Action** → `CM04.04` View Next Action  
  Connector `27:16688`
- `CM04.01` Open Athlete from Session — **Last Session** → `CM04.03` View Last Session  
  Connector `27:16692`
- `CM04.02` View Current Focus — **Reassessment** → `CM04.05` View Reassessment State  
  Connector `27:16696`
- `CM04.02` View Current Focus — **Video** → `CM04.06` View Relevant Video  
  Connector `27:16700`

### B5: Observations CM05 · Quick Add → Type / Voice → Link → Save

- `CM05.01` Quick Add Observation — **Type Note** → `CM05.02` Type Note  
  Connector `27:16704`
- `CM05.02` Type Note — **Link Session** → `CM05.04` Link to Session  
  Connector `27:16708`
- `CM05.01` Quick Add Observation — **Voice Input** → `CM05.03` Voice Input  
  Connector `27:16712`
- `CM05.04` Link to Session — **Link Dev Area** → `CM05.05` Link Existing Development Area  
  Connector `27:16716`
- `CM05.04` Link to Session — **Unstructured** → `CM05.06` Leave Unstructured  
  Connector `27:16720`
- `CM05.01` Quick Add Observation — **Correct** → `CM05.07` Correct Observation  
  Connector `27:16724`

### B6: Development Areas CM06 · Identify Issue → Check / Create Area → Prioritise

- `CM06.01` Identify Issue — **Check Existing** → `CM06.02` Check Existing Areas  
  Connector `27:16728`
- `CM06.02` Check Existing Areas — **Create New** → `CM06.03` Create New Area  
  Connector `27:16732`
- `CM06.03` Create New Area — **Prioritise** → `CM06.05` Prioritise  
  Connector `27:16736`
- `CM06.02` Check Existing Areas — **Reopen Previous** → `CM06.04` Reopen Previous Area  
  Connector `27:16740`
- `CM06.02` Check Existing Areas — **Cancel** → `CM06.06` Cancel Creation  
  Connector `27:16744`

### B7: Goal Management CM07 · Create → Edit → Next Action → Drill → Frequency

- `CM07.01` Create Goal — **Edit** → `CM07.02` Edit Goal  
  Connector `27:16748`
- `CM07.02` Edit Goal — **Next Action** → `CM07.03` Set Next Action  
  Connector `27:16752`
- `CM07.03` Set Next Action — **Add Drill** → `CM07.04` Add Drill  
  Connector `27:16756`
- `CM07.04` Add Drill — **Frequency** → `CM07.05` Assign Frequency  
  Connector `27:16760`
- `CM07.05` Assign Frequency — **Replace Drill** → `CM07.06` Replace Drill  
  Connector `27:16764`
- `CM07.05` Assign Frequency — **Goal Achieved** → `CM07.07` Mark Goal Achieved  
  Connector `27:16768`

### B8: Task Execution CM08 · Receive → Open → Review → Conduct → Observe → Complete

- `CM08.01` Receive Assignment — **Open Task** → `CM08.02` Open Task  
  Connector `27:16772`
- `CM08.02` Open Task — **Review** → `CM08.03` Review Head Coach Instruction  
  Connector `27:16776`
- `CM08.03` Review Head Coach Instruction — **Conduct** → `CM08.04` Conduct Work  
  Connector `27:16780`
- `CM08.04` Conduct Work — **Observe** → `CM08.05` Add Observation  
  Connector `27:16784`
- `CM08.05` Add Observation — **Complete** → `CM08.07` Mark Completed  
  Connector `27:16788`
- `CM08.05` Add Observation — **Attach Video** → `CM08.06` Attach Video  
  Connector `27:16792`
- `CM08.04` Conduct Work — **Blocked** → `CM08.08` Mark Blocked  
  Connector `27:16796`
- `CM08.07` Mark Completed — **Follow-Up** → `CM08.09` Request Follow-Up  
  Connector `27:16800`

### B9: Handover CM09 · Start → Summary → Next Action → Assign → Receive

- `CM09.01` Start Handover — **Summary** → `CM09.02` Add Summary  
  Connector `27:16804`
- `CM09.02` Add Summary — **Next Action** → `CM09.03` Add Required Next Action  
  Connector `27:16808`
- `CM09.03` Add Required Next Action — **Assign** → `CM09.04` Assign Recipient  
  Connector `27:16812`
- `CM09.04` Assign Recipient — **Recipient Opens** → `CM09.05` Recipient Opens Handover  
  Connector `27:16816`
- `CM09.05` Recipient Opens Handover — **Convert Follow-Up** → `CM09.06` Convert to Follow-Up  
  Connector `27:16820`

### B10: Video Capture CM10 · Launch → Capture → Review → Attach → Upload

- `CM10.01` Launch Camera — **Capture** → `CM10.02` Capture Clip  
  Connector `27:16824`
- `CM10.02` Capture Clip — **Review** → `CM10.03` Review Clip  
  Connector `27:16828`
- `CM10.03` Review Clip — **Attach Athlete** → `CM10.05` Attach Athlete  
  Connector `27:16832`
- `CM10.05` Attach Athlete — **Attach Dev Area** → `CM10.06` Attach Development Area  
  Connector `27:16836`
- `CM10.06` Attach Development Area — **Upload** → `CM10.09` Upload  
  Connector `27:16840`
- `CM10.01` Launch Camera — **Upload Existing** → `CM10.04` Upload Existing Clip  
  Connector `27:16844`
- `CM10.06` Attach Development Area — **Attach Goal** → `CM10.07` Attach Goal  
  Connector `27:16848`
- `CM10.06` Attach Development Area — **Add Comment** → `CM10.08` Add Comment  
  Connector `27:16852`
- `CM10.09` Upload — **Background** → `CM10.10` Background Upload  
  Connector `27:16856`
- `CM10.09` Upload — **Failed Upload** → `CM10.11` Failed Upload  
  Connector `27:16860`
- `CM10.09` Upload — **Remove Wrong** → `CM10.12` Remove Wrong Attachment  
  Connector `27:16864`

### B11: Video Review & Feedback CM11 · Play → Pause → Comment → Share

- `CM11.01` Play Video — **Pause** → `CM11.02` Pause at Moment  
  Connector `27:16868`
- `CM11.02` Pause at Moment — **Comment** → `CM11.03` Add Comment  
  Connector `27:16872`
- `CM11.03` Add Comment — **Edit Comment** → `CM11.04` Edit Comment  
  Connector `27:16876`
- `CM11.03` Add Comment — **Multiple Comments** → `CM11.05` Add Multiple Comments  
  Connector `27:16880`
- `CM11.03` Add Comment — **Share Feedback** → `CM11.06` Share Selected Feedback  
  Connector `27:16884`

### B12: Reassessment CM12 · Open Pending → Review → Record → Choose Status → Complete

- `CM12.01` Open Pending Reassessment — **Review Goal** → `CM12.02` Review Goal  
  Connector `27:16888`
- `CM12.02` Review Goal — **Review Notes** → `CM12.03` Review Notes  
  Connector `27:16892`
- `CM12.03` Review Notes — **Record Note** → `CM12.05` Record Reassessment Note  
  Connector `27:16896`
- `CM12.05` Record Reassessment Note — **Choose Status** → `CM12.06` Choose Status  
  Connector `27:16900`
- `CM12.06` Choose Status — **Set Next Action** → `CM12.07` Set Next Action  
  Connector `27:16904`
- `CM12.07` Set Next Action — **Complete** → `CM12.09` Complete  
  Connector `27:16908`
- `CM12.03` Review Notes — **Review Video** → `CM12.04` Review Video  
  Connector `27:16912`
- `CM12.07` Set Next Action — **Add Milestone** → `CM12.08` Add Milestone  
  Connector `27:16916`

### B13: Session Wrap-up CM13 · Review → Resolve Notes → Resolve Uploads → Complete

- `CM13.01` Review Session — **Resolve Notes** → `CM13.02` Resolve Draft Notes  
  Connector `27:16920`
- `CM13.02` Resolve Draft Notes — **Resolve Uploads** → `CM13.03` Resolve Uploads  
  Connector `27:16924`
- `CM13.03` Resolve Uploads — **Complete** → `CM13.04` Complete Session  
  Connector `27:16928`
- `CM13.04` Complete Session — **View History** → `CM13.05` View History  
  Connector `27:16932`
- `CM13.05` View History — **Edit Historical** → `CM13.06` Edit Historical Session  
  Connector `27:16936`
- `CM13.01` Review Session — **Cancel Session** → `CM13.07` Cancel Session  
  Connector `27:16940`

### B14: Offline Mode CM14 · Detect Offline → Cache → Work Offline → Reconnect → Sync

- `CM14.01` Detect Offline State — **View Cached** → `CM14.02` View Cached Session  
  Connector `27:16944`
- `CM14.02` View Cached Session — **Mark Attendance** → `CM14.03` Mark Attendance Offline  
  Connector `27:16948`
- `CM14.03` Mark Attendance Offline — **Add Observation** → `CM14.04` Add Observation Offline  
  Connector `27:16952`
- `CM14.04` Add Observation Offline — **Record Video** → `CM14.05` Record Video Offline  
  Connector `27:16956`
- `CM14.05` Record Video Offline — **Queue Upload** → `CM14.06` Queue Upload  
  Connector `27:16960`
- `CM14.06` Queue Upload — **Reconnect** → `CM14.07` Reconnect  
  Connector `27:16964`
- `CM14.07` Reconnect — **Sync Complete** → `CM14.09` Sync Complete  
  Connector `27:16968`
- `CM14.07` Reconnect — **Resolve Conflict** → `CM14.08` Resolve Conflict  
  Connector `27:16972`
## Parent App

### IA-group transitions

- **C1: Parent Onboarding PA01 · Receive Invite → Create Account → Link Child** — Onboarded → Dashboard → **C2: Dashboard PA02 · Open App → Overall Progress → Coach Focus**  
  Connector `32:19020`
- **C2: Dashboard PA02 · Open App → Overall Progress → Coach Focus** — Dashboard → Progress → **C3: Progress Tracking PA03 · Open Progress → Current Focus → Status**  
  Connector `32:19024`
- **C3: Progress Tracking PA03 · Open Progress → Current Focus → Status** — Progress Viewed → Reports → **C4: Reports & Feedback PA04 · Receive Notification → Open → Read Report**  
  Connector `32:19028`
- **C4: Reports & Feedback PA04 · Receive Notification → Open → Read Report** — Reports Read → Attendance & Competition → **C5: Attendance & Competition PA05 · View Attendance → Session Count → Competition**  
  Connector `32:19032`

### C1: Parent Onboarding PA01 · Receive Invite → Create Account → Link Child

- `PA01.01` Receive Invite — **Create Account** → `PA01.02` Create / Access Account  
  Connector `32:19036`
- `PA01.02` Create / Access Account — **Link Child** → `PA01.03` Link Child  
  Connector `32:19040`
- `PA01.03` Link Child — **Multiple Children** → `PA01.04` Parent Has Multiple Children  
  Connector `32:19044`
- `PA01.03` Link Child — **Two Guardians** → `PA01.05` Two Guardians  
  Connector `32:19048`
- `PA01.05` Two Guardians — **Guardian Removed** → `PA01.06` Guardian Removed  
  Connector `32:19052`
- `PA01.01` Receive Invite — **Parent Also Coach** → `PA01.07` Parent Also Coach  
  Connector `32:19056`

### C2: Dashboard PA02 · Open App → Overall Progress → Coach Focus

- `PA02.01` Open App — **View Progress** → `PA02.02` View Overall Progress  
  Connector `32:19060`
- `PA02.02` View Overall Progress — **Coach Focus** → `PA02.03` View Coach Focus  
  Connector `32:19064`
- `PA02.03` View Coach Focus — **Latest Comment** → `PA02.04` View Latest Comment  
  Connector `32:19068`
- `PA02.03` View Coach Focus — **Milestone** → `PA02.05` View Milestone  
  Connector `32:19072`
- `PA02.03` View Coach Focus — **Attendance** → `PA02.06` View Attendance  
  Connector `32:19076`
- `PA02.03` View Coach Focus — **Competition** → `PA02.07` View Competition  
  Connector `32:19080`

### C3: Progress Tracking PA03 · Open Progress → Current Focus → Status

- `PA03.01` Open Progress — **Current Focus** → `PA03.02` View Current Focus  
  Connector `32:19084`
- `PA03.02` View Current Focus — **Status** → `PA03.03` View Progress Status  
  Connector `32:19088`
- `PA03.03` View Progress Status — **Dev History** → `PA03.04` View Development History  
  Connector `32:19092`
- `PA03.03` View Progress Status — **Milestones** → `PA03.05` View Milestones  
  Connector `32:19096`
- `PA03.03` View Progress Status — **Older Reports** → `PA03.06` View Older Reports  
  Connector `32:19100`

### C4: Reports & Feedback PA04 · Receive Notification → Open → Read Report

- `PA04.01` Receive Notification — **Open Link** → `PA04.02` Open Deep Link  
  Connector `32:19104`
- `PA04.02` Open Deep Link — **Read Report** → `PA04.03` Read Report  
  Connector `32:19108`
- `PA04.03` Read Report — **Coach Comment** → `PA04.04` View Coach Comment  
  Connector `32:19112`
- `PA04.03` Read Report — **Milestone** → `PA04.05` View Milestone  
  Connector `32:19116`
- `PA04.03` Read Report — **Video** → `PA04.06` View Video  
  Connector `32:19120`
- `PA04.03` Read Report — **Revisit Report** → `PA04.07` Revisit Report  
  Connector `32:19124`

### C5: Attendance & Competition PA05 · View Attendance → Session Count → Competition

- `PA05.01` View Attendance Summary — **Session Count** → `PA05.02` View Session Count  
  Connector `32:19128`
- `PA05.02` View Session Count — **Upcoming** → `PA05.03` View Upcoming Competition  
  Connector `32:19132`
- `PA05.03` View Upcoming Competition — **Competition Update** → `PA05.04` View Competition Update  
  Connector `32:19136`
- `PA05.03` View Upcoming Competition — **Changed** → `PA05.05` Competition Changed  
  Connector `32:19140`
## Athlete App

### IA-group transitions

- **D1: Athlete Access & Onboarding AT01 · Access Enabled → Create Login → Sign In** — Onboarded → Dashboard → **D2: Athlete Dashboard AT02 · Current Focus → Goal → Next Practice**  
  Connector `34:22022`
- **D2: Athlete Dashboard AT02 · Current Focus → Goal → Next Practice** — Dashboard → Practice → **D3: Practice AT03 · Open Practice → View Drill → View Goal**  
  Connector `34:22026`
- **D3: Practice AT03 · Open Practice → View Drill → View Goal** — Practice Done → Feedback → **D4: Feedback AT04 · Open Feedback → Read Comment → Watch Video**  
  Connector `34:22030`
- **D4: Feedback AT04 · Open Feedback → Read Comment → Watch Video** — Feedback Read → Progress → **D5: Progress & Milestones AT05 · Open Progress → Current Status → Timeline**  
  Connector `34:22034`

### D1: Athlete Access & Onboarding AT01 · Access Enabled → Create Login → Sign In

- `AT01.01` Athlete Access Enabled — **Create Login** → `AT01.02` Create Athlete Login  
  Connector `34:22038`
- `AT01.02` Create Athlete Login — **Sign In** → `AT01.03` Sign In  
  Connector `34:22042`
- `AT01.01` Athlete Access Enabled — **Parent Device** → `AT01.04` Parent Device Access  
  Connector `34:22046`
- `AT01.03` Sign In — **Ages Up** → `AT01.05` Athlete Ages Up  
  Connector `34:22050`
- `AT01.03` Sign In — **Changes Academy** → `AT01.06` Athlete Changes Academy  
  Connector `34:22054`

### D2: Athlete Dashboard AT02 · Current Focus → Goal → Next Practice

- `AT02.01` View Current Focus — **View Goal** → `AT02.02` View Goal  
  Connector `34:22058`
- `AT02.02` View Goal — **Next Practice** → `AT02.03` View Next Practice  
  Connector `34:22062`
- `AT02.03` View Next Practice — **Coach Tip** → `AT02.04` View Latest Coach Tip  
  Connector `34:22066`
- `AT02.03` View Next Practice — **Progress** → `AT02.05` View Progress  
  Connector `34:22070`
- `AT02.03` View Next Practice — **Competition** → `AT02.06` View Upcoming Competition  
  Connector `34:22074`

### D3: Practice AT03 · Open Practice → View Drill → View Goal

- `AT03.01` Open Practice — **View Drill** → `AT03.02` View Drill  
  Connector `34:22078`
- `AT03.02` View Drill — **View Goal** → `AT03.03` View Goal  
  Connector `34:22082`
- `AT03.03` View Goal — **Watch Video** → `AT03.04` Watch Practice Video  
  Connector `34:22086`
- `AT03.03` View Goal — **Completed** → `AT03.05` Practice Completed  
  Connector `34:22090`
- `AT03.03` View Goal — **Changed** → `AT03.06` Assignment Changed  
  Connector `34:22094`

### D4: Feedback AT04 · Open Feedback → Read Comment → Watch Video

- `AT04.01` Open Feedback — **Read Comment** → `AT04.02` Read Coach Comment  
  Connector `34:22098`
- `AT04.02` Read Coach Comment — **Watch Video** → `AT04.03` Watch Shared Video  
  Connector `34:22102`
- `AT04.03` Watch Shared Video — **Timestamp Comment** → `AT04.04` View Timestamp Comment  
  Connector `34:22106`
- `AT04.03` Watch Shared Video — **Older Feedback** → `AT04.05` View Older Feedback  
  Connector `34:22110`
- `AT04.03` Watch Shared Video — **Withdrawn** → `AT04.06` Feedback Withdrawn  
  Connector `34:22114`

### D5: Progress & Milestones AT05 · Open Progress → Current Status → Timeline

- `AT05.01` Open Progress — **Current Status** → `AT05.02` View Current Status  
  Connector `34:22118`
- `AT05.02` View Current Status — **Timeline** → `AT05.03` View Timeline  
  Connector `34:22122`
- `AT05.03` View Timeline — **Milestone** → `AT05.04` View Milestone  
  Connector `34:22126`
- `AT05.03` View Timeline — **Area Achieved** → `AT05.05` Development Area Achieved  
  Connector `34:22130`
- `AT05.03` View Timeline — **Area Reopened** → `AT05.06` Area Reopened  
  Connector `34:22134`
## Head Coach Cross-Platform

### IA-group transitions

- **E1: Web-to-Mobile Development Loop HC01 · Review on Web → Create Task → Train on Mobile → Return to Web** — Loop Complete → Courtside → **E2: Courtside Observation & Delegation HC02 · Observe → Create Dev Area → Assign → Review → Reassess**  
  Connector `36:25953`

### E1: Web-to-Mobile Development Loop HC01 · Review on Web → Create Task → Train on Mobile → Return to Web

- `HC01.01` Review Athlete on Web — **Create Task** → `HC01.02` Create Development Task  
  Connector `36:25957`
- `HC01.02` Create Development Task — **Open App** → `HC01.03` Open Coach App Later  
  Connector `36:25961`
- `HC01.03` Open Coach App Later — **Train** → `HC01.04` Conduct Training  
  Connector `36:25965`
- `HC01.04` Conduct Training — **Record** → `HC01.05` Record Observation  
  Connector `36:25969`
- `HC01.05` Record Observation — **Return to Web** → `HC01.06` Return to Web  
  Connector `36:25973`
- `HC01.06` Return to Web — **Review History** → `HC01.07` Review Updated History  
  Connector `36:25977`

### E2: Courtside Observation & Delegation HC02 · Observe → Create Dev Area → Assign → Review → Reassess

- `HC02.01` Observe Athlete Courtside — **Create Area** → `HC02.02` Create Development Area  
  Connector `36:25981`
- `HC02.02` Create Development Area — **Assign** → `HC02.03` Assign Assistant  
  Connector `36:25985`
- `HC02.03` Assign Assistant — **Assistant Works** → `HC02.04` Assistant Works  
  Connector `36:25989`
- `HC02.04` Assistant Works — **HC Reviews** → `HC02.05` Head Coach Reviews on Web  
  Connector `36:25993`
- `HC02.05` Head Coach Reviews on Web — **Schedule Reassess** → `HC02.06` Schedule Reassessment  
  Connector `36:25997`
- `HC02.06` Schedule Reassessment — **Reassess Mobile** → `HC02.07` Reassess on Mobile  
  Connector `36:26001`
## Cross-System Scenarios

### IA-group transitions

- **F1: Identity & Role Scenarios XS01 · Single role → Multi-role → Cross-platform → Edge cases** — Roles Defined → Visibility → **F2: Visibility Scopes XS02 · What each role can see across the system**  
  Connector `36:26037`
- **F2: Visibility Scopes XS02 · What each role can see across the system** — Scopes Set → Notifications → **F3: Cross-System Notifications XS03 · Task → Reassessment → Report → Feedback → Video → Assignment**  
  Connector `36:26041`
- **F3: Cross-System Notifications XS03 · Task → Reassessment → Report → Feedback → Video → Assignment** — Triggers Set → Conflicts → **F4: Sync & Data Conflicts XS04 · Attendance → Development → Task → Video → Profile → Report**  
  Connector `36:26045`
- **F4: Sync & Data Conflicts XS04 · Attendance → Development → Task → Video → Profile → Report** — Conflicts Handled → Lifecycle → **F5: Data Lifecycle XS05 · Entity states across Athlete, Coach, Batch, Dev Area, Goal, Task, Video, Report, Parent**  
  Connector `36:26049`
- **F5: Data Lifecycle XS05 · Entity states across Athlete, Coach, Batch, Dev Area, Goal, Task, Video, Report, Parent** — Lifecycle Mapped → Screens → **F6: Screen Maps XS06 · Academy → Coach → Athlete → Development → Video → Reassessment → Parent → Practice → Competition → Milestones**  
  Connector `36:26053`
- **F6: Screen Maps XS06 · Academy → Coach → Athlete → Development → Video → Reassessment → Parent → Practice → Competition → Milestones** — Screens Mapped → Error States → **F7: Error & Recovery States XS07 · Save → Upload → Auth → Partial Save → Sync → Processing → Permission → Deleted → Network**  
  Connector `36:26057`

### F1: Identity & Role Scenarios XS01 · Single role → Multi-role → Cross-platform → Edge cases

- `XS01.01` User has one role — **Multi-role** → `XS01.02` Head Coach uses Web + Mobile  
  Connector `36:26061`
- `XS01.02` Head Coach uses Web + Mobile — **Parent+Coach** → `XS01.03` Parent is also Coach  
  Connector `36:26065`
- `XS01.03` Parent is also Coach — **Multi-academy** → `XS01.04` User belongs to multiple academies  
  Connector `36:26069`
- `XS01.04` User belongs to multiple academies — **Role Change** → `XS01.05` Role changes while logged in  
  Connector `36:26073`
- `XS01.05` Role changes while logged in — **Removed** → `XS01.06` User removed from academy  
  Connector `36:26077`
- `XS01.06` User removed from academy — **Temp Access** → `XS01.07` Assistant receives temporary access  
  Connector `36:26081`

### F2: Visibility Scopes XS02 · What each role can see across the system

- No cross-flow connector shown.

### F3: Cross-System Notifications XS03 · Task → Reassessment → Report → Feedback → Video → Assignment

- `XS03.01` Coach receives task — **Reassessment** → `XS03.02` Reassessment due  
  Connector `36:26085`
- `XS03.02` Reassessment due — **Report** → `XS03.03` Parent report published  
  Connector `36:26089`
- `XS03.03` Parent report published — **Feedback** → `XS03.04` Athlete feedback published  
  Connector `36:26093`
- `XS03.04` Athlete feedback published — **Video** → `XS03.05` Video shared  
  Connector `36:26097`
- `XS03.05` Video shared — **Assignment** → `XS03.06` Coach assignment changed  
  Connector `36:26101`

### F4: Sync & Data Conflicts XS04 · Attendance → Development → Task → Video → Profile → Report

- No cross-flow connector shown.

### F5: Data Lifecycle XS05 · Entity states across Athlete, Coach, Batch, Dev Area, Goal, Task, Video, Report, Parent

- No cross-flow connector shown.

### F6: Screen Maps XS06 · Academy → Coach → Athlete → Development → Video → Reassessment → Parent → Practice → Competition → Milestones

- No cross-flow connector shown.

### F7: Error & Recovery States XS07 · Save → Upload → Auth → Partial Save → Sync → Processing → Permission → Deleted → Network

- No cross-flow connector shown.

