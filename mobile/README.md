# ditdit mobile (Expo)

The Athlete and Coach apps as a React Native (Expo) project. It shares its data, store, Dit Score maths and dit
engine with the web prototype in `../src`, so both apps behave the same and one fix lands in both.

```bash
cd mobile
npm install
npx expo start            # scan the QR code with Expo Go (iOS / Android), or press w for the web build
npm run typecheck         # tsc with one copy of React types
npm run bundle:ios        # compiles the Hermes bundle: catches anything Metro can't resolve
npm run bundle:android
```

Expo SDK 57, React Native 0.86, React 19.2. Navigation is React Navigation 7 (native stack and bottom tabs).
State is the shared React-context store, persisted through AsyncStorage. There are no UI frameworks: styling is
`StyleSheet` on the same colour tokens as the web (`src/theme/tokens.ts`, mirroring `src/styles/tokens.css`).

## What is here

| Area | Screens |
|---|---|
| Launcher | Persona picker for both apps, journeys A–G, honesty note |
| Athlete | Home (Dit Score hero, focus, last session, milestone celebration), Practice, Feedback and clip detail, Progress, Dit Score (trend, breakdown, privacy), Compare, Session summary, Access |
| Coach | Today, Sessions and attendance (with offline queue and conflicts), Athletes and athlete context, new area and goal editor, Tasks and handovers, Capture (typed note, simulated video upload), Reassessment, Dit Score review, Sync queue, Academy and role |
| dit | Presence, nudges, first-run intro, conversation canvas with every object type, Gemini for open questions (labelled) |

Not in this build, on purpose: the **parent app** and the **academy web dashboard** (they stay in the web build),
and the **video review** screen (timestamped comments with the skeleton overlay is the next build; `VideoReview`
is a placeholder).

## How the sharing works

- `metro.config.js` watches `../src` and aliases it as `ditcore/*`; `disableHierarchicalLookup` makes every import,
  shared files included, resolve `react` and `react-native` from `mobile/node_modules`. One copy of React.
- `../src/core/platform.ts` holds the two seams: a key-value store (browser `localStorage` on web, AsyncStorage
  here) and the API base URL. `src/platform.ts` swaps them in before the first render.
- `../src/companion/engine.ts` has `route()`, the single router both apps use to decide rules vs the model.
- `tsconfig.json` is what Metro reads; `tsconfig.check.json` adds a path so `tsc` sees one copy of the React types.

## Gemini

The app never holds a key. Open questions call `POST {EXPO_PUBLIC_API_BASE}/api/chat` (the Vercel function in
`../api/chat.ts`, which holds `GEMINI_API_KEY`). Set the base in `.env` (see `.env.example`). If the call fails,
is rate-limited, or the base is protected by Vercel Authentication, dit falls back to the built-in answer.
**The staging deployment is behind Vercel Authentication, so a phone cannot reach it**; point
`EXPO_PUBLIC_API_BASE` at a deployment without protection (or turn protection off for the project) to test it.

## Verified, and what was not

Verified in the build environment:
- `tsc` clean (mobile and web); the web build and its 19 end-to-end checks are unchanged.
- iOS and Android Hermes bundles compile (`expo export`).
- 15 end-to-end checks (`scripts/e2e.mjs`) on the web export in a phone-sized browser: launcher, athlete home and
  Dit Score, dit rules vs Gemini (mocked) vs busy fallback, privacy choice, coach attendance, offline queue and
  reconnect, Flow E across both apps, score pause, persistence across reload, task blocking.

**Not verified (no device or simulator was available):** gestures and scrolling feel, safe areas and notches,
keyboard behaviour with the dit input, font rendering on device, performance, Android back button, and anything
needing a native module. Please try it in Expo Go and report what is off.

## Known gaps and decisions

- Voice notes: the mic is disabled; use dit's sample voice note or type. Live speech needs a native module.
- Video: recording and picking need `expo-camera` / `expo-image-picker` (native). Capture uses the demo clip.
- The floating dit face is hidden on the attendance screen (it covered the absent buttons); a small face in the
  header opens it instead.
- Fonts (Big Shoulders Display, Instrument Sans; SIL Open Font License) are bundled from `assets/fonts`, not from
  `node_modules`: static hosts such as Vercel refuse to serve `node_modules` paths, which left the web preview on
  system fonts. `npm run export:web` also moves any other vendor assets out of `node_modules` paths.
- Flow codes (MW06.04 and similar) are dropped from the mobile UI; assumptions that affect behaviour are kept.
