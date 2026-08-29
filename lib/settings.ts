import { DEFAULT_LOCATION } from './cities';
import { PRAYER_KEYS, type PrayerKey, type Settings } from './types';

const STORAGE_KEY = 'mektep-prayer.settings.v1';

const zeroOffsets = () =>
  Object.fromEntries(PRAYER_KEYS.map((k) => [k, 0])) as Record<PrayerKey, number>;

const defaultAdhan = () =>
  Object.fromEntries(PRAYER_KEYS.map((k) => [k, k !== 'sunrise'])) as Record<PrayerKey, boolean>;

export const CALCULATION_METHODS: Array<{ id: number; label: string }> = [
  { id: 13, label: 'Diyanet İşleri Başkanlığı (Türkiye)' },
  { id: 3, label: 'Muslim World League' },
  { id: 2, label: 'ISNA (North America)' },
  { id: 4, label: 'Umm al-Qura (Makkah)' },
  { id: 5, label: 'Egyptian General Authority' },
  { id: 1, label: 'University of Islamic Sciences, Karachi' },
  { id: 12, label: 'Union des Organisations Islamiques de France' },
  { id: 15, label: 'Moonsighting Committee Worldwide' },
];

export const HIGH_LATITUDE_LABELS: Record<Settings['highLatitudeRule'], string> = {
  none: 'None (astronomical only)',
  middleOfNight: 'Middle of the night',
  oneSeventh: 'One seventh of the night',
  angleBased: 'Angle based',
};

export const DEFAULT_SETTINGS: Settings = {
  location: DEFAULT_LOCATION,
  method: 13,
  highLatitudeRule: 'oneSeventh',
  offsets: zeroOffsets(),
  adhanEnabled: defaultAdhan(),
  notificationsEnabled: false,
  clock24h: true,
  theme: 'auto',
  showWeather: true,
  reducedMotion: false,
};

/** Merges stored settings over the defaults so new fields appear on upgrade. */
export function normalizeSettings(input: unknown): Settings {
  const stored = (input ?? {}) as Partial<Settings>;
  const location = { ...DEFAULT_SETTINGS.location, ...(stored.location ?? {}) };
  const valid =
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180;

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    location: valid ? location : DEFAULT_SETTINGS.location,
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
