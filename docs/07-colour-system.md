# ditdit colour system and role identities

This supersedes the FlowX palette. Tokens are in `src/styles/tokens.css`. Scales are generated in OKLab: tints are interpolated toward white (50–400) and shades toward a deep tone (600–900), with chroma reduced proportionally. **The approved hex sits exactly at 500.**

| | 50 | 100 | 200 | 300 | 400 | **500** | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| Teal (coach) | #f1f8f9 | #ddedee | #b9dee1 | #93cdd2 | #6abcc3 | **#36ABB4** | #218c93 | #086d74 | #005156 | #00353a |
| Lime (parent) | #f5f9ed | #eef6dc | #e2f3b8 | #d5ef90 | #c9ea62 | **#BEE501** | #99bb00 | #769200 | #546b00 | #354600 |
| Grey (athlete) | #f7f7f7 | #f1f1f1 | #e8e8e8 | #dfdfdf | #d5d5d5 | **#CCCCCC** | #a6a6a6 | #818181 | #5e5e5e | #3d3d3d |
| Taupe (shared) | #f7f6f5 | #e5e3e1 | #cbc7c2 | #b0a9a2 | #958d83 | **#7B7165** | #645b51 | #4e463e | #39332b | #25201a |
| Charcoal (shared) | #f7f7f7 | #d7d7d7 | #acabab | #7e7d7d | #535152 | **#2C2A2B** | #232122 | #1a1819 | #111011 | #090809 |

## Accessibility (WCAG 2.2, AA)

| Pair | Ratio | Rule |
|---|---|---|
| Charcoal 500 on white | 14.3:1 | Primary text everywhere |
| Teal 500 on white | 2.75:1 | **Never text.** Fill with charcoal text (5.2:1) |
| Teal 700 on white | ≥ 4.5:1 | Coach role-coloured text (`--role-text`) |
| Lime 500 under charcoal text | 9.8:1 | Parent primary action and highlights |
| Lime 800 on white | ≥ 4.5:1 | Parent role-coloured text |
| Grey 500 on charcoal | 8.9:1 | Athlete silver on dark |
| Grey 800 on white | ≥ 4.5:1 | Athlete role-coloured text on light |
| Taupe 500 on white | 4.8:1 | Secondary text on white |
| Taupe 600 | — | Secondary text on tinted role backgrounds (taupe 500 drops to 4.46:1) |

On light athlete surfaces the primary action is **charcoal**, because silver can't carry an action.

## Semantic tokens

Components read only these tokens:
- **Surfaces and text:** `--bg`, `--surface`, `--surface-2`, `--surface-sunk`, `--text`, `--text-muted`, `--text-faint`, `--line`, `--line-strong`.
- **Actions and highlights:** `--accent`, `--accent-ink`, `--hl`, `--hl-soft`, `--hl-ink`.
- **Role colours:** `--role-50…900`, `--role-text`.
- **Status:** `--ok`, `--warn`, `--err`, `--info`, each with its `-bg`.

| Token | Coach | Parent | Athlete |
|---|---|---|---|
| `--bg` (chalk) | teal 50 | lime 50 | grey 50 |
| `--accent` | teal 500 + charcoal text | lime 500 + charcoal text | charcoal + white text |
| `--hl` (highlight, avatar dots, active nav) | teal 500 | lime 500 | grey 500 on dark / grey 400 on light |
| `--line` | teal 200 mixed with taupe | lime 200 mixed with taupe | grey 200 mixed with taupe |
| Hover / pressed | border to `--line-strong`; 1px press | same | same |
| Focus | 2px charcoal ring with paper gap (chalk); role ring on dark | same | same |
| Disabled | 45% opacity with an explanation nearby | same | same |

## Modes × roles

- **chalk**: operational light surfaces tinted by role.
- **floodlit**: charcoal immersive surfaces for the companion, the Dit Score, milestones and athlete heroes.
- **matchday**: charcoal and taupe editorial surfaces.

Put `data-role` and `data-theme` on the same element whenever either one changes. Custom properties resolve where they are declared.

**Status colours.** Success uses lime 800 to stay inside the palette. Warning (amber) and error (red) are functional exceptions, because they must read as warnings and errors. They always come with an icon and a word.

**Management web.** It uses the coach family: teal accents and a charcoal sidebar. No sixth role colour was introduced, because management workflows are coach and academy workflows.
