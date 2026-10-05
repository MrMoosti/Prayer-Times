import type { Language } from './i18n';

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

/** Sunrise is a marker, not a prayer: it never becomes the "current prayer". */
export const PRAYABLE_KEYS = PRAYER_KEYS.filter((k) => k !== 'sunrise') as Exclude<
  PrayerKey,
  'sunrise'
>[];

export interface LocationSetting {
  cityId: number | null;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  /** IANA zone, e.g. "Europe/Amsterdam". */
  timezone: string;
}

export interface Settings {
  location: LocationSetting;
  /** Interface language. Also decides whether prayer names are localised. */
  language: Language;
  /** Minutes added to (or subtracted from) each time, per prayer. */
  offsets: Record<PrayerKey, number>;
  /** Which prayers announce themselves when their time arrives. */
  adhanEnabled: Record<PrayerKey, boolean>;
  notificationsEnabled: boolean;
  clock24h: boolean;
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
  cityId: number;
  timezone: string;
  fetchedAt: number;
  days: DayTimes[];
}

export interface DailyContent {
  date: string;
  verse: string | null;
  verseSource: string | null;
  hadith: string | null;
  hadithSource: string | null;
  pray: string | null;
  praySource: string | null;
}

export interface CityResult {
  id: number;
  name: string;
  stateName: string;
  countryName: string;
  latitude: number;
  longitude: number;
  timezone: string;
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
