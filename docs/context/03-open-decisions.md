# Open decisions, inconsistencies, and assumptions

## Explicit unresolved-rule markers from FigJam

These are copied verbatim from nodes labelled `Product rule unresolved:`. The labels are often placeholders rather than decisions, so each must be translated into an actual policy before production implementation.

| Flow | Context | FigJam marker | Surface | Node |
|---|---|---|---|---|
| `MW01.01` | Create Academy | if supported | Management Web | `1:294` |
| `MW08.05` | Review Video Evidence | optional | Management Web | `1:1673` |
| `MW10.04` | Review Submitted Reassessment | policy required | Management Web | `1:2511` |
| `MW10.07` | Mark Milestone | where possible | Management Web | `1:2928` |
| `MW11.05` | Include Milestone | optional | Management Web | `1:2784` |
| `MW11.06` | Include Competition Update | optional | Management Web | `1:2843` |
| `CM03.04` | Athlete Not Listed | requires decision | Coach Mobile | `21:10197` |
| `CM04.06` | View Relevant Video | optional | Coach Mobile | `21:10428` |
| `CM05.03` | Voice Input | if introduced | Coach Mobile | `21:10530` |
| `CM05.05` | Link Existing Development Area | policy required | Coach Mobile | `21:10589` |
| `CM06.05` | Prioritise | to decide | Coach Mobile | `21:10792` |
| `CM07.03` | Set Next Action | optional | Coach Mobile | `21:10909` |
| `CM09.02` | Add Summary | where possible | Coach Mobile | `21:11329` |
| `CM09.03` | Add Required Next Action | optional | Coach Mobile | `21:11358` |
| `CM09.05` | Recipient Opens Handover | optional | Coach Mobile | `21:11416` |
| `CM10.02` | Capture Clip | where possible | Coach Mobile | `21:11511` |
| `CM10.07` | Attach Goal | not defined | Coach Mobile | `21:11656` |
| `CM12.04` | Review Video | optional | Coach Mobile | `21:12082` |
| `PA01.04` | Parent Has Multiple Children | not defined | Parent App | `30:20141` |
| `PA02.04` | View Latest Comment | optional | Parent App | `30:20334` |
| `PA04.04` | View Coach Comment | optional | Parent App | `30:20693` |
| `PA04.05` | View Milestone | optional | Parent App | `30:20724` |
| `AT01.01` | Athlete Access Enabled | policy required | Athlete App | `30:23221` |
| `AT02.06` | View Upcoming Competition | optional | Athlete App | `30:23524` |
| `AT03.05` | Practice Completed | not defined | Athlete App | `30:23665` |
| `XS01.07` | Assistant receives temporary access | if implemented | Cross-System Scenarios | `30:27574` |

## Source inconsistencies

1. **Flow total:** the architecture-map title says 308; the registry and detailed sections both contain 312.
2. **Management Web total:** one heading says 80; its registry subsections contain 33 + 51 = 84 and the detailed board contains 84.
3. **Parent surface title:** the top-level Parent App section has no name. The `PA` codes, actor nodes, and architecture registry identify it as Parent App / Consumer Mobile.
4. **Ellipsized review copy:** some long FigJam review nodes end in a literal ellipsis. The extraction preserves that source text and does not invent the missing clause.
5. **Optionality:** many flows use the unresolved label “optional” without saying whether this means optional in MVP, role-dependent, configuration-dependent, or optional user input.
6. **Flow classification:** system maps use `-` instead of primary/branch classification. The context pack labels these “System reference.”

## Decisions required before a production build

- Supported sports model: one sport per academy, multiple sports, or sport-specific sub-organizations.
- Athlete access rules by age, guardian consent, region, and academy policy.
- Parent/guardian invitation, verification, revocation, and multiple-guardian authority.
- Cross-academy identity matching and whether one identity can retain history across transfers.
- Exact permissions for owner, admin, head coach, coach, assistant coach, parent, and athlete.
- Temporary assistant access duration and automatic expiry.
- Which content can be published to parents versus athletes and who approves it.
- Whether reports are immutable after publication, versioned, withdrawn, or corrected with an audit note.
- Reassessment status vocabulary and approval authority.
- Milestone creation rules and whether a milestone can be reversed.
- Development-area priority model and reopen semantics.
- Video retention, consent, privacy, processing, and share/withdraw rules.
- Offline conflict policy by object type: last-write-wins, server-wins, field merge, or human resolution.
- Idempotency keys and user messaging for repeated creates, saves, uploads, and lifecycle actions.
- Archive versus delete behavior for every core entity.
- Notification channels, preferences, retry behavior, and deep-link fallback.
- Competition ownership and the source of schedule/result changes.
- Audit log requirements for identity, permission, reassignment, report, and lifecycle changes.

## Safe prototype assumptions

Until decisions are made, a prototype may:

- use a single sport per academy while keeping the model extensible;
- keep all destructive actions as reversible archive/deactivate actions;
- treat report corrections as a new version with a visible “corrected” status;
- show role and academy switchers when a fixture user has more than one context;
- use explicit draft, queued, processing, published, failed, archived, and withdrawn states;
- use optimistic UI only when a stable client-generated idempotency key exists;
- expose a conflict-resolution screen rather than silently overwriting offline changes;
- hide optional media or comment modules behind fixture flags;
- use simulated notifications and deep links;
- keep all parent/athlete content read-only unless a flow explicitly permits interaction.

## Prototype decision log template

| Date | Decision | Affected flows | Assumption or confirmed rule | Owner |
|---|---|---|---|---|
| YYYY-MM-DD | Example: report correction model | MW11.11, PA04.03 | Versioned correction; prior version retained | Product |

