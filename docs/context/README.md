# FlowX prototype context pack

This folder is a Claude-ready extraction of the [Integrated flows and IA FigJam board](https://www.figma.com/board/N8JlgmYApk0zCwWsb8tF6R/Integrated-flows-and-IA?node-id=0-1).

## What is included

| Surface / concern | Primary audience | IA groups | Detailed flows | Human-readable | Machine-readable |
|---|---|---:|---:|---|---|
| Management Web | Academy Owner / Admin / Head Coach | 11 | 84 | [Detailed flows](flows/management-web.md) | [JSON](data/management-web.json) |
| Coach Mobile | Coach / Head Coach / Assistant Coach | 14 | 100 | [Detailed flows](flows/coach-mobile.md) | [JSON](data/coach-mobile.json) |
| Parent App | Parent / Guardian | 5 | 32 | [Detailed flows](flows/parent-app.md) | [JSON](data/parent-app.json) |
| Athlete App | Athlete (with parent-device scenarios) | 5 | 30 | [Detailed flows](flows/athlete-app.md) | [JSON](data/athlete-app.json) |
| Head Coach Cross-Platform | Head Coach | 2 | 14 | [Detailed flows](flows/head-coach-cross-platform.md) | [JSON](data/head-coach-cross-platform.json) |
| Cross-System Scenarios | All roles / System | 7 | 52 | [Detailed flows](flows/cross-system.md) | [JSON](data/cross-system.json) |

The extraction contains 312 detailed flow sections, 412 documented edge cases, 624 added review cases, and 26 unresolved-rule markers.

> Source-count warning: the FigJam architecture-map title says **308 flows**, while its registry tables and the actual detailed-flow sections each contain **312 flows**. The files in this pack use the observed 312-flow source of truth.

## Recommended reading order

1. [Project context](00-project-context.md)
2. [Information architecture](01-information-architecture.md)
3. [Cross-flow connector map](05-cross-flow-map.md)
4. The relevant file under `flows/`
5. [Flow registry](02-flow-registry.md)
6. [Open decisions and source gaps](03-open-decisions.md)
7. [Prototype build brief](04-prototype-build-brief.md)
8. [CLAUDE.md](CLAUDE.md) when handing the folder to Claude

## Interpretation rules

- `P` means a primary flow in the FigJam registry.
- `B` means a branch or alternate flow.
- `-` is used for system scenarios, data-lifecycle maps, screen maps, and error-state references.
- “Documented exception” is copied from a FigJam node prefixed `Documented:`.
- “Added review case” is copied from a FigJam node prefixed `Added review:`.
- “Open product rule” is copied from a FigJam node prefixed `Product rule unresolved:`.
- Primary routes are reconstructed from connector direction, using the `No` branch at the standard “Edge case occurs?” decision.
- Figma node IDs are retained for auditability.

## Extraction metadata

- Extracted: 2026-10-08
- Board file key: `N8JlgmYApk0zCwWsb8tF6R`
- FigJam page: `0:1`
- Observed node count: 11,079
- Observed detailed-flow count: 312
- Registry row count: 312
