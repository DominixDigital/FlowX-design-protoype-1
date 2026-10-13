# ditdit prototype

A clickable prototype of ditdit, an operating system for a sports academy. It has four apps that share one data store:

| Surface | Route | Theme |
|---|---|---|
| Academy web | `#/web` | Coach teal |
| Coach mobile | `#/coach` | Coach teal |
| Parent app | `#/parent` | Parent lime |
| Athlete app | `#/athlete` | Athlete grey + charcoal |

**dit** is the ditdit companion: a two-dot avatar and a context-aware layer that answers with interface objects instead of chat bubbles. The **Dit Score** is a proposed development score with an illustrative method.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static build in dist/ (hash routing, relative paths)
node scripts/e2e.mjs http://127.0.0.1:5173   # cross-surface journey check (needs Playwright)
```

## Start here

1. **`#/`** has a launcher with the signature loop. It is about 3 minutes and touches all four apps.
2. **`#/explore`** has the ditdit explorations: brand, three companion concepts, conversational canvas, three score visualisations and home integration. `#/explore/v1` keeps the FlowX-era directions.
3. **Prototype controls** (bottom-left) simulate offline, slow network, failed saves, lost confirmations, sync conflicts, and server-side changes such as cancelled tasks, removed access, withdrawn feedback, moved fixtures and removed guardians. **Reset all demo data** restores the fixtures.

## Native app

[`mobile/`](mobile) is an Expo (React Native) version of the Athlete and Coach apps that shares the data, store, score and dit logic with this web build. See [`mobile/README.md`](mobile/README.md).

## Docs

- [`docs/01-discovery.md`](docs/01-discovery.md): product understanding, roles, journeys, AI opportunities, assumptions.
- [`docs/02-screen-inventory.md`](docs/02-screen-inventory.md): every screen mapped to its flow codes, with honest status.
- [`docs/03-design-system.md`](docs/03-design-system.md): tokens, modes, components, companion rules.
- [`docs/04-ditdit-evolution.md`](docs/04-ditdit-evolution.md): **start here for ditdit**. Rebrand impact, avatar and score directions, flow map, integrated loop, open decisions.
- [`docs/05-dit-score-model.md`](docs/05-dit-score-model.md): score information model and validation needs.
- [`docs/06-companion-and-score-flows.md`](docs/06-companion-and-score-flows.md): Flows A–G with entry, action, response, AI, data, permissions, success, failure, edge cases, exit.
- [`docs/07-colour-system.md`](docs/07-colour-system.md): five-colour palette, scales, contrast, role tokens.
- [`docs/08-dependencies.md`](docs/08-dependencies.md): what needs backend, AI or sports-expert validation.
- [`docs/context/`](docs/context): the supplied flow and IA context pack, kept unchanged.
- [`src/data/policy.ts`](src/data/policy.ts): every unresolved product rule as a labelled assumption.

## What is real and what is simulated

- **Real:**
  - Every navigation path and form, with validation.
  - State shared across all four apps, persisted in `localStorage`.
  - An idempotent command queue.
  - Offline queueing and human conflict resolution.
  - Commit-time revalidation.
  - Speech recognition, where the browser supports it.
  - Camera and file pick for video.
- **Simulated:**
  - The network, the media server (upload and processing progress) and notification delivery.
  - Sign-in and account creation.
  - dit responses. These are deterministic logic over the fixture records, and the UI says so. No AI model is connected.
- **Gemini (optional):** when the rule-based dit has no answer for a free-text question, `api/chat.ts` (a Vercel function) asks Gemini. It sees only a few role-filtered facts from the screen (no other athletes, no unpublished feedback, no private scores) and the answer is labelled "AI-generated". Without `GEMINI_API_KEY`, or when rate-limited, dit falls back to the built-in answer. Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in Vercel project settings; `npm run dev` has no `/api`, so use `vercel dev` to try it locally. The Dit Score is never calculated by the model.
- **Not shown:** performance telemetry such as speeds or ratings. Every number on screen comes from a recorded attendance, note, goal or practice log. The Dit Score combines those records with an illustrative, unvalidated method, and is labelled that way.

## Stack

Vite, React 18 and TypeScript, with react-router (hash routing) and lucide-react icons. Fonts are self-hosted through @fontsource. There is no UI framework: styling is plain CSS on design tokens.
