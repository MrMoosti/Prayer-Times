/**
 * The scene's colour is two independent things.
 *
 * The *sky* is a continuous function of the sun's altitude: every colour is
 * interpolated between keyframes, so the landscape drifts from night through
 * dawn to day without a visible switch. Dawn and dusk use different keyframes -
 * dawn runs cool and pink, dusk runs amber.
 *
 * The *interface* is not continuous. It is light or dark, and it flips at
 * Maghrib (back at sunrise), because a panel that fades gradually through
 * mid-grey is unreadable for the minutes it spends in between. The flip itself
 * is smoothed by the CSS transitions on the surfaces that consume these tokens.
 */

export interface SkyPalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  /** Warm bloom around the sun and along the horizon. */
  glow: string;
  landTint: string;
  landShade: string;
  /** 0..1 - stars fade in as the sky darkens. */
  stars: number;
  /** 0..1 - warm windows in the mosque light up at night. */
  windowGlow: number;
}

export interface UiPalette {
  pageBg: string;
  panel: string;
  panelDeep: string;
  rowBg: string;
  ink: string;
  inkMuted: string;
  inkOnDeep: string;
  /** Gold as it reads on the deep green surfaces. */
  accent: string;
  /** Gold darkened enough to read on the cream surfaces. */
  accentInk: string;
  clayShadow: string;
  clayLight: string;
}

type Keyframe = [altitudeDeg: number, palette: SkyPalette];

const NIGHT: SkyPalette = {
  skyTop: '#080f18', skyMid: '#101d26', skyBottom: '#1b2c30',
  glow: '#f6e6bd', landTint: '#1d2a24', landShade: '#111a16',
  stars: 1, windowGlow: 1,
};

const DEEP_TWILIGHT: SkyPalette = {
  skyTop: '#13202f', skyMid: '#293246', skyBottom: '#4a4453',
  glow: '#f7e8c4', landTint: '#25322a', landShade: '#16201b',
  stars: 0.7, windowGlow: 1,
};

const TWILIGHT: SkyPalette = {
  skyTop: '#41496b', skyMid: '#83708a', skyBottom: '#c2908a',
  glow: '#ffe9c2', landTint: '#3b4438', landShade: '#272f26',
  stars: 0.28, windowGlow: 0.85,
};

const DAWN_HORIZON: SkyPalette = {
  skyTop: '#b9c3da', skyMid: '#e7c5c6', skyBottom: '#f8e2cd',
  glow: '#ffe6c6', landTint: '#8fa285', landShade: '#5f7358',
  stars: 0.06, windowGlow: 0.45,
};

const DUSK_HORIZON: SkyPalette = {
  skyTop: '#cbc3ae', skyMid: '#f0c98a', skyBottom: '#f8e3c1',
  glow: '#ffdca6', landTint: '#93a184', landShade: '#63755a',
  stars: 0.05, windowGlow: 0.5,
};

/** Dusk holds its warmth much longer than dawn does. */
const GOLDEN_DUSK: SkyPalette = {
  skyTop: '#a8bcc6', skyMid: '#eab778', skyBottom: '#f8dfb6',
  glow: '#ffd79a', landTint: '#8d9a7c', landShade: '#5e6f54',
  stars: 0, windowGlow: 0.35,
};

const GOLDEN: SkyPalette = {
  skyTop: '#bfd0d3', skyMid: '#eed3a4', skyBottom: '#f7e9d3',
  glow: '#ffe8bd', landTint: '#9aa98a', landShade: '#6a7c5f',
  stars: 0, windowGlow: 0.3,
};

const DAY: SkyPalette = {
  skyTop: '#a6c9dc', skyMid: '#cfe0e4', skyBottom: '#f1e8d7',
  glow: '#ffeec4', landTint: '#9db089', landShade: '#6c8060',
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

export const UI_LIGHT: UiPalette = {
  pageBg: '#f5efe3',
  panel: '#fdf8ef',
  panelDeep: '#2f4a36',
  rowBg: '#f7f1e4',
  ink: '#26382b',
  inkMuted: '#6d7c6f',
  inkOnDeep: '#f4efe2',
  accent: '#eac46c',
  accentInk: '#bf871c',
  clayShadow: 'rgba(94,76,58,0.18)',
  clayLight: 'rgba(255,255,255,0.9)',
};

export const UI_DARK: UiPalette = {
  pageBg: '#0d1614',
  panel: '#18241d',
  panelDeep: '#223328',
  rowBg: '#202d25',
  ink: '#ece4d3',
  inkMuted: '#9aa89c',
  inkOnDeep: '#ece4d3',
  accent: '#e6bb60',
  accentInk: '#e0b45c',
  clayShadow: 'rgba(0,0,0,0.55)',
  clayLight: 'rgba(255,255,255,0.07)',
};

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

function mixColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const to = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r1, r2)}${to(g1, g2)}${to(b1, b2)}`;
}

function mixSky(a: SkyPalette, b: SkyPalette, t: number): SkyPalette {
  const out = {} as SkyPalette;
  for (const key of Object.keys(a) as (keyof SkyPalette)[]) {
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

/** Interpolated sky for a sun altitude in degrees. */
export function skyFor(altitudeDeg: number, rising: boolean): SkyPalette {
  const frames = rising ? RISING : SETTING;
  const alt = Math.max(-90, Math.min(90, altitudeDeg));
  for (let i = 0; i < frames.length - 1; i++) {
    const [a0, p0] = frames[i];
    const [a1, p1] = frames[i + 1];
    if (alt >= a0 && alt <= a1) {
      const t = a1 === a0 ? 0 : (alt - a0) / (a1 - a0);
      // Smoothstep keeps the horizon transitions from looking mechanical.
      return mixSky(p0, p1, t * t * (3 - 2 * t));
    }
  }
  return frames[frames.length - 1][1];
}

/** Weather mutes and greys the sky without changing the time of day. */
export function applyWeather(p: SkyPalette, cloudiness: number, fog: number): SkyPalette {
  const grey = Math.min(0.55, cloudiness * 0.4 + fog * 0.25);
  return {
    ...p,
    skyTop: mixColor(p.skyTop, '#8b939a', grey),
    skyMid: mixColor(p.skyMid, '#a3a8a6', grey * 0.9),
    skyBottom: mixColor(p.skyBottom, '#b8b6ad', grey * 0.6),
    landTint: mixColor(p.landTint, '#7f8880', grey * 0.7),
    landShade: mixColor(p.landShade, '#535b55', grey * 0.7),
  };
}

/** Perceived lightness of a hex colour, 0..1. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Ink for text that sits directly on the scene rather than on a panel.
 *
 * It follows the *sky*, not the interface mode. Between Maghrib and full dark
 * the cards are already dark while the sky is still burning gold, and taking
 * the dark-mode ink there would put pale text on a bright sky.
 */
export function inkOnScene(sky: SkyPalette): { ink: string; shadow: string } {
  // The header sits high, so the top of the gradient is what it reads against.
  const behind = (luminance(sky.skyTop) + luminance(sky.skyMid)) / 2;
  return behind > 0.32
    ? { ink: '#26382b', shadow: 'rgba(255,255,255,0.35)' }
    : { ink: '#f0e9db', shadow: 'rgba(0,0,0,0.45)' };
}

export function paletteToCssVars(sky: SkyPalette, ui: UiPalette): Record<string, string> {
  const scene = inkOnScene(sky);
  return {
    '--ink-on-scene': scene.ink,
    '--ink-on-scene-shadow': scene.shadow,
    '--sky-top': sky.skyTop,
    '--sky-mid': sky.skyMid,
    '--sky-bottom': sky.skyBottom,
    '--glow': sky.glow,
    '--land-tint': sky.landTint,
    '--land-shade': sky.landShade,
    '--stars': sky.stars.toFixed(3),
    '--window-glow': sky.windowGlow.toFixed(3),
    '--page-bg': ui.pageBg,
    '--panel': ui.panel,
    '--panel-deep': ui.panelDeep,
    '--row-bg': ui.rowBg,
    '--ink': ui.ink,
    '--ink-muted': ui.inkMuted,
    '--ink-on-deep': ui.inkOnDeep,
    '--accent': ui.accent,
    '--accent-ink': ui.accentInk,
    '--clay-shadow': ui.clayShadow,
    '--clay-light': ui.clayLight,
  };
}
