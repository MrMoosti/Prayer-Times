/**
 * The palette is a continuous function of the sun's altitude, not a set of
 * discrete themes: every colour token is interpolated between keyframes so the
 * page drifts from night through dawn to day without a visible switch. Dawn and
 * dusk use different keyframes - dawn runs cool and pink, dusk runs amber.
 */

export interface Palette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  pageBg: string;
  panel: string;
  panelDeep: string;
  rowBg: string;
  ink: string;
  inkMuted: string;
  inkOnDeep: string;
  accent: string;
  glow: string;
  landTint: string;
  landShade: string;
  clayShadow: string;
  clayLight: string;
  /** 0..1 - stars fade in as the sky darkens. */
  stars: number;
  /** 0..1 - warm windows in the mosque light up at night. */
  windowGlow: number;
}

type Keyframe = [altitudeDeg: number, palette: Palette];

const NIGHT: Palette = {
  skyTop: '#080f18', skyMid: '#101d26', skyBottom: '#1b2c30',
  pageBg: '#0d1614', panel: '#16211b', panelDeep: '#101a15', rowBg: '#243228',
  ink: '#ece4d3', inkMuted: '#9aa89c', inkOnDeep: '#ece4d3',
  accent: '#e4b355', glow: '#f6e6bd',
  landTint: '#1d2a24', landShade: '#111a16',
  clayShadow: 'rgba(0,0,0,0.55)', clayLight: 'rgba(255,255,255,0.06)',
  stars: 1, windowGlow: 1,
};

const DEEP_TWILIGHT: Palette = {
  skyTop: '#13202f', skyMid: '#293246', skyBottom: '#4a4453',
  pageBg: '#141d1b', panel: '#1b2721', panelDeep: '#141f1a', rowBg: '#293830',
  ink: '#eee7d8', inkMuted: '#a3b0a4', inkOnDeep: '#eee7d8',
  accent: '#e6b855', glow: '#f7e8c4',
  landTint: '#25322a', landShade: '#16201b',
  clayShadow: 'rgba(0,0,0,0.5)', clayLight: 'rgba(255,255,255,0.08)',
  stars: 0.7, windowGlow: 1,
};

const TWILIGHT: Palette = {
  skyTop: '#41496b', skyMid: '#83708a', skyBottom: '#c2908a',
  pageBg: '#33302f', panel: '#31392f', panelDeep: '#252d25', rowBg: '#3b4338',
  ink: '#f3ece0', inkMuted: '#c0bdb0', inkOnDeep: '#f3ece0',
  accent: '#eabd5e', glow: '#ffe9c2',
  landTint: '#3b4438', landShade: '#272f26',
  clayShadow: 'rgba(20,14,10,0.42)', clayLight: 'rgba(255,255,255,0.14)',
  stars: 0.28, windowGlow: 0.85,
};

const DAWN_HORIZON: Palette = {
  skyTop: '#b9c3da', skyMid: '#e7c5c6', skyBottom: '#f8e2cd',
  pageBg: '#f0e6da', panel: '#faf4e9', panelDeep: '#2f4a36', rowBg: '#f3ebdc',
  ink: '#26382b', inkMuted: '#6d7c6f', inkOnDeep: '#f4efe2',
  accent: '#d9a13c', glow: '#ffe6c6',
  landTint: '#8fa285', landShade: '#5f7358',
  clayShadow: 'rgba(94,76,58,0.22)', clayLight: 'rgba(255,255,255,0.8)',
  stars: 0.06, windowGlow: 0.45,
};

const DUSK_HORIZON: Palette = {
  skyTop: '#cbc3ae', skyMid: '#f0c98a', skyBottom: '#f8e3c1',
  pageBg: '#f2e7d6', panel: '#fbf5ea', panelDeep: '#2f4a36', rowBg: '#f5edde',
  ink: '#26382b', inkMuted: '#6d7c6f', inkOnDeep: '#f4efe2',
  accent: '#d99b34', glow: '#ffdca6',
  landTint: '#93a184', landShade: '#63755a',
  clayShadow: 'rgba(94,76,58,0.24)', clayLight: 'rgba(255,255,255,0.82)',
  stars: 0.05, windowGlow: 0.5,
};

/** Dusk holds its warmth much longer than dawn does. */
const GOLDEN_DUSK: Palette = {
  skyTop: '#a8bcc6', skyMid: '#eab778', skyBottom: '#f8dfb6',
  pageBg: '#f3e7d3', panel: '#fbf4e7', panelDeep: '#2f4a36', rowBg: '#f6eeda',
  ink: '#26382b', inkMuted: '#6d7c6f', inkOnDeep: '#f4efe2',
  accent: '#cf9128', glow: '#ffd79a',
  landTint: '#8d9a7c', landShade: '#5e6f54',
  clayShadow: 'rgba(94,76,58,0.24)', clayLight: 'rgba(255,255,255,0.84)',
  stars: 0, windowGlow: 0.35,
};

const GOLDEN: Palette = {
  skyTop: '#bfd0d3', skyMid: '#eed3a4', skyBottom: '#f7e9d3',
  pageBg: '#f4ecdd', panel: '#fcf7ee', panelDeep: '#2f4a36', rowBg: '#f7f0e2',
  ink: '#26382b', inkMuted: '#6d7c6f', inkOnDeep: '#f4efe2',
  accent: '#d59a30', glow: '#ffe8bd',
  landTint: '#9aa98a', landShade: '#6a7c5f',
  clayShadow: 'rgba(94,76,58,0.2)', clayLight: 'rgba(255,255,255,0.85)',
  stars: 0, windowGlow: 0.3,
};

const DAY: Palette = {
  skyTop: '#a6c9dc', skyMid: '#cfe0e4', skyBottom: '#f1e8d7',
  pageBg: '#f5efe3', panel: '#fdf8ef', panelDeep: '#2f4a36', rowBg: '#f8f2e6',
  ink: '#26382b', inkMuted: '#6d7c6f', inkOnDeep: '#f4efe2',
  accent: '#d3a12f', glow: '#ffeec4',
  landTint: '#9db089', landShade: '#6c8060',
  clayShadow: 'rgba(94,76,58,0.18)', clayLight: 'rgba(255,255,255,0.9)',
  stars: 0, windowGlow: 0,
};

const RISING: Keyframe[] = [
  [-90, NIGHT], [-14, NIGHT], [-9, DEEP_TWILIGHT], [-6, TWILIGHT],
  [-1.5, DAWN_HORIZON], [6, GOLDEN], [20, DAY], [90, DAY],
];

const SETTING: Keyframe[] = [
  [-90, NIGHT], [-14, NIGHT], [-9, DEEP_TWILIGHT], [-6, TWILIGHT],
  [-1.5, DUSK_HORIZON], [7, GOLDEN_DUSK], [22, DAY], [90, DAY],
];

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const RGBA = /rgba?\(([^)]+)\)/;

function mixColor(a: string, b: string, t: number): string {
  const ma = a.match(RGBA);
  const mb = b.match(RGBA);
  if (ma && mb) {
    const pa = ma[1].split(',').map(Number);
    const pb = mb[1].split(',').map(Number);
    const c = [0, 1, 2].map((i) => Math.round(pa[i] + (pb[i] - pa[i]) * t));
    const alpha = (pa[3] ?? 1) + ((pb[3] ?? 1) - (pa[3] ?? 1)) * t;
    return `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`;
  }
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const to = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r1, r2)}${to(g1, g2)}${to(b1, b2)}`;
}

function mixPalette(a: Palette, b: Palette, t: number): Palette {
  const out = {} as Palette;
  for (const key of Object.keys(a) as (keyof Palette)[]) {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') {
      (out[key] as number) = av + (bv - av) * t;
    } else {
      (out[key] as string) = mixColor(av as string, bv as string, t);
    }
  }
  return out;
}

export type SkyPhase =
  | 'night'
  | 'astronomical-dawn'
  | 'dawn'
  | 'sunrise'
  | 'morning'
  | 'day'
  | 'golden-hour'
  | 'sunset'
  | 'dusk';

export function skyPhase(altitudeDeg: number, rising: boolean): SkyPhase {
  if (altitudeDeg < -12) return 'night';
  if (altitudeDeg < -6) return rising ? 'astronomical-dawn' : 'dusk';
  if (altitudeDeg < -0.833) return rising ? 'dawn' : 'dusk';
  if (altitudeDeg < 6) return rising ? 'sunrise' : 'sunset';
  if (altitudeDeg < 20) return rising ? 'morning' : 'golden-hour';
  return 'day';
}

/** Interpolated palette for a sun altitude in degrees. */
export function paletteFor(altitudeDeg: number, rising: boolean): Palette {
  const frames = rising ? RISING : SETTING;
  const alt = Math.max(-90, Math.min(90, altitudeDeg));
  for (let i = 0; i < frames.length - 1; i++) {
    const [a0, p0] = frames[i];
    const [a1, p1] = frames[i + 1];
    if (alt >= a0 && alt <= a1) {
      const t = a1 === a0 ? 0 : (alt - a0) / (a1 - a0);
      // Smoothstep keeps the horizon transitions from looking mechanical.
      return mixPalette(p0, p1, t * t * (3 - 2 * t));
    }
  }
  return frames[frames.length - 1][1];
}

/** Weather mutes and greys the palette without changing the time of day. */
export function applyWeather(p: Palette, cloudiness: number, fog: number): Palette {
  const grey = Math.min(0.55, cloudiness * 0.4 + fog * 0.25);
  const dull: Palette = {
    ...p,
    skyTop: mixColor(p.skyTop, '#8b939a', grey),
    skyMid: mixColor(p.skyMid, '#a3a8a6', grey * 0.9),
    skyBottom: mixColor(p.skyBottom, '#b8b6ad', grey * 0.6),
    landTint: mixColor(p.landTint, '#7f8880', grey * 0.7),
    landShade: mixColor(p.landShade, '#535b55', grey * 0.7),
  };
  return dull;
}

export function paletteToCssVars(p: Palette): Record<string, string> {
  return {
    '--sky-top': p.skyTop,
    '--sky-mid': p.skyMid,
    '--sky-bottom': p.skyBottom,
    '--page-bg': p.pageBg,
    '--panel': p.panel,
    '--panel-deep': p.panelDeep,
    '--row-bg': p.rowBg,
    '--ink': p.ink,
    '--ink-muted': p.inkMuted,
    '--ink-on-deep': p.inkOnDeep,
    '--accent': p.accent,
    '--glow': p.glow,
    '--land-tint': p.landTint,
    '--land-shade': p.landShade,
    '--clay-shadow': p.clayShadow,
    '--clay-light': p.clayLight,
    '--stars': p.stars.toFixed(3),
    '--window-glow': p.windowGlow.toFixed(3),
  };
}
