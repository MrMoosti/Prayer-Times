import type { HighLatitudeRule } from './solar';
import type { Language } from './i18n';

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

/** Sunrise is a marker, not a prayer: it never becomes the "current prayer". */
export const PRAYABLE_KEYS = PRAYER_KEYS.filter((k) => k !== 'sunrise') as Exclude<
  PrayerKey,
  'sunrise'
>[];

export interface LocationSetting {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  /** IANA zone, e.g. "Europe/Amsterdam". */
  timezone: string;
}

/**
 * Diyanet addresses places by its own city id, not by coordinates, so this
 * sits alongside `location` rather than replacing it: the id fetches the
 * times, the coordinates still drive the weather and the sky.
 */
export interface DiyanetPlaceSetting {
  cityId: number;
  cityName: string;
  stateName: string;
  countryName: string;
}

export interface Settings {
  location: LocationSetting;
  /** Interface language. Also decides whether prayer names are localised. */
  language: Language;
  /** When set and the server has credentials, times come from Diyanet. */
  diyanet: DiyanetPlaceSetting | null;
  /** Aladhan calculation method id. 13 = Diyanet Isleri Baskanligi. */
  method: number;
  highLatitudeRule: HighLatitudeRule;
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
  year: number;
  latitude: number;
  longitude: number;
  method: number;
  timezone: string;
  /** Where the numbers came from, surfaced in the UI. */
  source: 'diyanet' | 'aladhan' | 'calculated';
  fetchedAt: number;
  days: DayTimes[];
  /**
   * How many days in `days` came from the named source rather than from the
   * local calculation. Diyanet can only ever supply the current month, so this
   * is well short of a year and the UI says so.
   */
  officialDays?: number;
  /** Set when a source was configured but could not be used. */
  sourceNote?: string;
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
