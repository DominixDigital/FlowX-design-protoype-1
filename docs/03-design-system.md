# ditdit design system

> **Updated for ditdit.** Colours now follow the approved five-colour palette and role architecture in [07-colour-system.md](07-colour-system.md). The companion is **dit** (two-dot avatar, `src/companion/DitAvatar.tsx`), and the Dit Score visual language lives in `src/score/` and `src/styles/score.css`. Earlier colour names in this doc (forest, chalk, court) describe the FlowX era and map to `--role-*`, `--grey-*`, `--char-*`.

Tokens: `src/styles/tokens.css`. Components: `src/components/`, `src/huddle/`. Explorations: `#/explore`.

## One language, three surface modes

| Mode | `data-theme` | Use for | Never use for |
|---|---|---|---|
| **Chalk** (default) | `chalk` | Rosters, forms, tasks, reports, lists. Roughly 80% of screens | — |
| **Floodlit** | `floodlit` | dit (companion) (always), the Athlete App, performance and milestone moments | Dense operational lists |
| **Matchday** | `matchday` | Onboarding, passport header, report cover, milestone celebration | Anything a coach does with one hand courtside |

Every themed subtree re-resolves its own colours, so any component works in any mode. dit (companion) is always Floodlit, so AI output can never be mistaken for recorded data.

## Colour

| Token | Hex | Role |
|---|---|---|
| `--chalk-100` | `#eceee4` | Operational background: pitch-line chalk, cooler than cream |
| `--ink-900` | `#111c17` | Text on chalk; Floodlit surfaces |
| `--forest-700` | `#14432f` | Primary action, identity, web sidebar (`--forest-800`) |
| `--lime-400` | `#d7ff3c` | Highlight, active state, dit (companion) accent. Always with ink text, never as text on chalk |
| `--court-600` / `--court-900` | `#1f4fb8` / `#0a1a36` | Matchday plates, info, competition data |
| semantic `--ok` / `--warn` / `--err` / `--info` | AA on chalk | Status. Always paired with a shape glyph |

**Rules**
- Lime is a marker, not paint. It sits behind ink text (`.mark`, lime metric tiles, active nav) and never carries text by itself on chalk.
- Status is never colour alone. Each `StatusBadge` pairs colour with an icon and a word.

## Type

- **Big Shoulders Display** (700–900), set uppercase. Used only for headlines and numerals (`.display`, `.num`), in the manner of a scoreboard.
- **Instrument Sans** (variable). Used for everything else. Body text is 16px with 1.5 line height.
- Numerals use tabular figures.
- Labels are sentence case. Only display headlines are uppercase.

## Space, radius, motion

- **Space:** a 4px scale, `--s-1` to `--s-16`.
- **Radius:** 4 (badges, inputs-in-tables), 8 (buttons, inputs), 12 (cards), 20–28 (sheets, plates, phone). The radius follows hierarchy rather than being uniform.
- **Motion:** 140/220/420ms with `--ease-out`. The only orchestrated motion is dit (companion)'s object reveal, staggered 90ms. `prefers-reduced-motion` turns all motion off.

## Core components

`Button` (pending state dedupes repeat submits) · `StatusBadge` · `Field` (label above, error inline with `role=alert`) · `Banner` · `StateBlock` (empty / error / permission / archived / offline / withdrawn) · `ConfirmDialog` (native `<dialog>`) · `Metric` (one number, with a basis line saying where it comes from) · `Timeline` · `Clip` (upload, processing and share states kept separate) · `PitchArt` / `PhotoSlot` (honest image placeholders) · `SyncPill` · `Assumption` / `AssumptionNote` / `FlowCode` (traceability).

## dit (companion): the AI layer

- **Seam** (`components/Seam.tsx`) is the companion mark: two stitched ball-seam arcs, deliberately not an orb.
  - `idle`: still.
  - `listening`: stitches run, arcs breathe.
  - `thinking`: arcs turn.
  - `insight`: a lime notch pulses. The current screen has a relevant object, such as a reassessment, report or clip.
  - `done`: arcs turn lime.
- **Presence:** a compact launcher. A FAB on mobile and a top-bar button on web. It never covers primary actions.
- **Canvas:** plays stack; they don't scroll as a transcript.
  - Each question becomes a display headline, and dit (companion) answers with objects.
  - Earlier plays collapse to one line.
  - Context ("Looking at: …") follows the screen, role and selected entity.
- **Objects** (`huddle/engine.ts`): `interpretation`, `facts`, `evidence`, `suggestion`, `compare`, `explainer`, `draft`, `moment`, `capabilities`, `notice`.
- **Trust rules:**
  1. Every interpretive object is tagged **Suggestion**, **Interpretation** or **Draft**.
  2. Every object can show what it is "Based on N records".
  3. Nothing is saved without a confirm action.
  4. Saved AI-assisted records carry "AI-drafted, coach-confirmed".
  5. The canvas permanently says which answers are demo logic and which (open questions only) may come from an AI model, and labels the latter.
- **Voice:**
  - It uses real speech recognition where the browser has it, with a live transcript and a stop control.
  - Error states offer "Use what was heard" and "Type instead".
  - Voice is never the only way in.

## Accessibility baseline

- A visible focus ring in every theme (`--focus-ring`).
- A skip link.
- Native controls throughout.
- Targets of 44px or more on mobile.
- Toasts with actions stay until dismissed.
- Sheets and drawers close on Esc.
- Tables use `th` headers.
- Contrast is AA for text: muted chalk text is `#5d6862` on `#eceee4`, about 4.95:1.
