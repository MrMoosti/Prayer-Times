import type { HighLatitudeRule } from './solar';

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

/** Sunrise is a marker, not a prayer: it never becomes the "current prayer". */
export const PRAYABLE_KEYS = PRAYER_KEYS.filter((k) => k !== 'sunrise') as Exclude<
  PrayerKey,
  'sunrise'
>[];

export const PRAYER_LABELS: Record<PrayerKey, { name: string; subtitle: string }> = {
  fajr: { name: 'Fajr', subtitle: 'Dawn prayer' },
  sunrise: { name: 'Sunrise', subtitle: 'Sunrise' },
  dhuhr: { name: 'Dhuhr', subtitle: 'Midday prayer' },
  asr: { name: 'Asr', subtitle: 'Afternoon prayer' },
  maghrib: { name: 'Maghrib', subtitle: 'Evening prayer' },
  isha: { name: 'Isha', subtitle: 'Night prayer' },
};

export interface LocationSetting {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  /** IANA zone, e.g. "Europe/Amsterdam". */
  timezone: string;
}

export interface Settings {
  location: LocationSetting;
  /** Aladhan calculation method id. 13 = Diyanet Isleri Baskanligi. */
  method: number;
  highLatitudeRule: HighLatitudeRule;
  /** Minutes added to (or subtracted from) each time, per prayer. */
  offsets: Record<PrayerKey, number>;
  /** Which prayers announce themselves when their time arrives. */
  adhanEnabled: Record<PrayerKey, boolean>;
  notificationsEnabled: boolean;
  clock24h: boolean;
  /** 'auto' follows the sun for the configured location. */
  theme: 'auto' | 'day' | 'night';
  showWeather: boolean;
  reducedMotion: boolean;
}

/** One calendar day of times, as milliseconds since the epoch. */
export interface DayTimes {
  /** ISO date, YYYY-MM-DD, in the location's own timezone. */
  date: string;
  times: Record<PrayerKey, number | null>;
}

export interface YearlyCalendar {
  year: number;
  latitude: number;
  longitude: number;
  method: number;
  timezone: string;
  /** Where the numbers came from, surfaced in the UI. */
  source: 'aladhan' | 'calculated';
  fetchedAt: number;
  days: DayTimes[];
}

export interface WeatherNow {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  /** WMO code, 0..99. */
  code: number;
  isDay: boolean;
  cloudCover: number;
  precipitation: number;
  observedAt: number;
  source: 'open-meteo' | 'unavailable';
}

export interface KerahatWindow {
  key: 'israk' | 'istiva' | 'isfirar';
  label: string;
  description: string;
  start: number;
  end: number;
}
