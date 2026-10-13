/** Mirrors src/styles/tokens.css. Raw scales are the approved palette; components only use the resolved Theme. */
export const raw = {
  teal: { 50: '#f1f8f9', 100: '#ddedee', 200: '#b9dee1', 300: '#93cdd2', 400: '#6abcc3', 500: '#36abb4', 600: '#218c93', 700: '#086d74', 800: '#005156', 900: '#00353a' },
  lime: { 50: '#f5f9ed', 100: '#eef6dc', 200: '#e2f3b8', 300: '#d5ef90', 400: '#c9ea62', 500: '#bee501', 600: '#99bb00', 700: '#769200', 800: '#546b00', 900: '#354600' },
  grey: { 50: '#f7f7f7', 100: '#f1f1f1', 200: '#e8e8e8', 300: '#dfdfdf', 400: '#d5d5d5', 500: '#cccccc', 600: '#a6a6a6', 700: '#818181', 800: '#5e5e5e', 900: '#3d3d3d' },
  taupe: { 50: '#f7f6f5', 100: '#e5e3e1', 200: '#cbc7c2', 300: '#b0a9a2', 400: '#958d83', 500: '#7b7165', 600: '#645b51', 700: '#4e463e', 800: '#39332b', 900: '#25201a' },
  char: { 50: '#f7f7f7', 100: '#d7d7d7', 200: '#acabab', 300: '#7e7d7d', 400: '#535152', 500: '#2c2a2b', 600: '#232122', 700: '#1a1819', 800: '#111011', 900: '#090809' },
  paper: '#ffffff',
} as const;

export type Role = 'coach' | 'parent' | 'athlete';
export type Mode = 'chalk' | 'floodlit' | 'matchday';

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;
/** Widest the app gets on the web: wider windows show it as a phone-sized column. */
export const PHONE_MAX = 440;
/** Bottom sheets render in a portal on the web, so they need the same cap. */
export const sheetFrame = { width: '100%', maxWidth: PHONE_MAX, alignSelf: 'center' } as const;

export const radius = { xs: 4, sm: 8, md: 12, lg: 20, xl: 28 } as const;
export const fs = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 40, '4xl': 56 } as const;

export const fonts = {
  display: 'BigShouldersDisplay_900Black',
  displayBold: 'BigShouldersDisplay_700Bold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemi: 'InstrumentSans_600SemiBold',
  bodyBold: 'InstrumentSans_700Bold',
} as const;

export interface Theme {
  role: Role;
  mode: Mode;
  dark: boolean;
  bg: string; surface: string; surface2: string; surfaceSunk: string;
  text: string; textMuted: string; textFaint: string;
  line: string; lineStrong: string;
  accent: string; accentInk: string;
  hl: string; hlSoft: string; hlInk: string;
  roleText: string; ramp: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  ok: string; okBg: string; warn: string; warnBg: string; err: string; errBg: string; info: string; infoBg: string;
}

const family = { coach: raw.teal, parent: raw.lime, athlete: raw.grey } as const;
const roleText = { coach: raw.teal[700], parent: raw.lime[800], athlete: raw.grey[800] } as const;
const hlOf = { coach: raw.teal[500], parent: raw.lime[500], athlete: raw.grey[500] } as const;
const hlSoftOf = { coach: raw.teal[100], parent: raw.lime[100], athlete: raw.grey[200] } as const;

export function makeTheme(role: Role, mode: Mode): Theme {
  const f = family[role];
  const base = {
    ramp: f as Theme['ramp'], roleText: roleText[role], hl: hlOf[role], hlSoft: hlSoftOf[role], hlInk: raw.char[500],
    ok: '#546b00', okBg: '#eef6dc', warn: '#8a5a00', warnBg: '#fbecc8', err: '#b42f2f', errBg: '#f8dcdc', info: raw.teal[700], infoBg: raw.teal[100],
  };
  if (mode === 'floodlit') {
    return {
      ...base, role, mode, dark: true,
      bg: raw.char[700], surface: raw.char[600], surface2: raw.char[500], surfaceSunk: raw.char[800],
      text: raw.grey[50], textMuted: raw.grey[600], textFaint: raw.grey[700],
      line: raw.char[400], lineStrong: raw.grey[50],
      accent: base.hl, accentInk: raw.char[500],
      ok: raw.lime[500], okBg: 'rgba(190,229,1,0.12)', warn: '#f2c14e', warnBg: 'rgba(242,193,78,0.14)',
      err: '#ff8a8a', errBg: 'rgba(255,138,138,0.14)', info: raw.teal[300], infoBg: 'rgba(54,171,180,0.16)',
    };
  }
  if (mode === 'matchday') {
    return {
      ...base, role, mode, dark: true,
      bg: raw.char[500], surface: raw.char[400], surface2: raw.taupe[800], surfaceSunk: raw.char[700],
      text: raw.paper, textMuted: raw.taupe[200], textFaint: raw.taupe[300],
      line: raw.taupe[700], lineStrong: raw.paper, accent: base.hl, accentInk: raw.char[500],
    };
  }
  // chalk. Silver can't carry an action on light surfaces, so athletes get a charcoal primary action.
  const athlete = role === 'athlete';
  return {
    ...base, role, mode, dark: false,
    hl: athlete ? raw.grey[400] : base.hl,
    bg: f[50], surface: raw.paper, surface2: f[50], surfaceSunk: f[100],
    text: raw.char[500], textMuted: raw.taupe[600], textFaint: raw.taupe[500],
    line: mix(f[200], raw.taupe[100]), lineStrong: raw.char[500],
    accent: athlete ? raw.char[500] : f[500], accentInk: athlete ? raw.paper : raw.char[500],
  };
}

/** ~55/45 blend, standing in for color-mix(in oklab, …) */
function mix(a: string, b: string) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v * 0.55 + y[i] * 0.45).toString(16).padStart(2, '0')).join('');
}
