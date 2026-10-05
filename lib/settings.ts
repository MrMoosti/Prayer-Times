import { DEFAULT_LOCATION } from './cities';
import { LANGUAGES, type Language } from './i18n';
import { PRAYER_KEYS, type PrayerKey, type Settings } from './types';

const STORAGE_KEY = 'prayer-times.settings.v1';

const zeroOffsets = () =>
  Object.fromEntries(PRAYER_KEYS.map((k) => [k, 0])) as Record<PrayerKey, number>;

const defaultAdhan = () =>
  Object.fromEntries(PRAYER_KEYS.map((k) => [k, k !== 'sunrise'])) as Record<PrayerKey, boolean>;

export const DEFAULT_SETTINGS: Settings = {
  location: DEFAULT_LOCATION,
  language: 'tr',
  offsets: zeroOffsets(),
  adhanEnabled: defaultAdhan(),
  notificationsEnabled: false,
  clock24h: true,
  showWeather: true,
  reducedMotion: false,
};

/** Merges stored settings over the defaults so new fields appear on upgrade. */
export function normalizeSettings(input: unknown): Settings {
  const stored = (input ?? {}) as Partial<Settings>;
  const location = {
    ...DEFAULT_SETTINGS.location,
    ...(stored.location ?? {}),
  };
  if (typeof location.cityId !== 'number') location.cityId = null;
  const valid =
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180;

  const language: Language = LANGUAGES.includes(stored.language as Language)
    ? (stored.language as Language)
    : DEFAULT_SETTINGS.language;

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    location: valid ? location : DEFAULT_SETTINGS.location,
    language,
    offsets: { ...zeroOffsets(), ...(stored.offsets ?? {}) },
    adhanEnabled: { ...defaultAdhan(), ...(stored.adhanEnabled ?? {}) },
  };
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private browsing or a full quota - the app still works for this session.
  }
}
