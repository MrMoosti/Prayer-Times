/** WMO weather-code interpretation, and how each condition dresses the scene. */

export type WeatherKind =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'sleet'
  | 'snow'
  | 'thunder';

export interface SceneEffects {
  kind: WeatherKind;
  label: string;
  /** Icon key rendered by <WeatherGlyph />. */
  glyph: string;
  /** 0..1 - how many clouds drift across the sky and how opaque they are. */
  cloudiness: number;
  /** 0 = dry. 1..3 = light / steady / heavy. */
  precipitation: 0 | 1 | 2 | 3;
  precipitationType: 'none' | 'rain' | 'sleet' | 'snow';
  lightning: boolean;
  /** 0..1 haze veil drawn over the landscape. */
  fog: number;
  /** How much the sun/moon is dimmed behind the weather, 0..1. */
  celestialDimming: number;
}

const EFFECTS: Record<WeatherKind, Omit<SceneEffects, 'kind' | 'label' | 'glyph'>> = {
  clear: { cloudiness: 0.18, precipitation: 0, precipitationType: 'none', lightning: false, fog: 0, celestialDimming: 0 },
  'partly-cloudy': { cloudiness: 0.45, precipitation: 0, precipitationType: 'none', lightning: false, fog: 0, celestialDimming: 0.1 },
  cloudy: { cloudiness: 0.7, precipitation: 0, precipitationType: 'none', lightning: false, fog: 0.05, celestialDimming: 0.35 },
  overcast: { cloudiness: 0.95, precipitation: 0, precipitationType: 'none', lightning: false, fog: 0.12, celestialDimming: 0.6 },
  fog: { cloudiness: 0.6, precipitation: 0, precipitationType: 'none', lightning: false, fog: 0.75, celestialDimming: 0.55 },
  drizzle: { cloudiness: 0.8, precipitation: 1, precipitationType: 'rain', lightning: false, fog: 0.2, celestialDimming: 0.5 },
  rain: { cloudiness: 0.92, precipitation: 2, precipitationType: 'rain', lightning: false, fog: 0.18, celestialDimming: 0.65 },
  sleet: { cloudiness: 0.9, precipitation: 2, precipitationType: 'sleet', lightning: false, fog: 0.22, celestialDimming: 0.6 },
  snow: { cloudiness: 0.88, precipitation: 2, precipitationType: 'snow', lightning: false, fog: 0.3, celestialDimming: 0.5 },
  thunder: { cloudiness: 1, precipitation: 3, precipitationType: 'rain', lightning: true, fog: 0.15, celestialDimming: 0.8 },
};

const CODE_MAP: Array<[number[], WeatherKind, string, string]> = [
  [[0], 'clear', 'Clear sky', 'sun'],
  [[1], 'clear', 'Mainly clear', 'sun'],
  [[2], 'partly-cloudy', 'Partly cloudy', 'cloud-sun'],
  [[3], 'overcast', 'Overcast', 'cloud'],
  [[45, 48], 'fog', 'Fog', 'fog'],
  [[51, 53, 55, 56, 57], 'drizzle', 'Drizzle', 'drizzle'],
  [[61, 63, 80, 81], 'rain', 'Rain', 'rain'],
  [[65, 82], 'rain', 'Heavy rain', 'rain'],
  [[66, 67], 'sleet', 'Freezing rain', 'sleet'],
  [[71, 73, 75, 77, 85, 86], 'snow', 'Snow', 'snow'],
  [[95], 'thunder', 'Thunderstorm', 'thunder'],
  [[96, 99], 'thunder', 'Thunderstorm with hail', 'thunder'],
];

/** At night a clear sky wants a moon on the chip, not a sun. */
const NIGHT_GLYPHS: Record<string, string> = { sun: 'moon', 'cloud-sun': 'cloud-moon' };

export function describeWeather(code: number, cloudCover?: number, isNight = false): SceneEffects {
  const entry = CODE_MAP.find(([codes]) => codes.includes(code)) ?? CODE_MAP[0];
  const [, kind, label, glyph] = entry;
  const base = EFFECTS[kind];

  // Open-Meteo reports cloud cover separately; let it nudge a "clear" or
  // "partly cloudy" reading so the sky matches what is actually outside.
  let cloudiness = base.cloudiness;
  if (cloudCover != null && (kind === 'clear' || kind === 'partly-cloudy')) {
    cloudiness = Math.max(0.1, Math.min(1, cloudCover / 100));
  }

  const heavy = code === 65 || code === 82 || code === 75;
  return {
    ...base,
    kind,
    label,
    glyph: isNight ? (NIGHT_GLYPHS[glyph] ?? glyph) : glyph,
    cloudiness,
    precipitation: heavy ? 3 : base.precipitation,
  };
}

export const CLEAR_EFFECTS = describeWeather(0);
