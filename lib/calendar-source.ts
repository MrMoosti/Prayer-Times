import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PRAYER_KEYS, type DayTimes, type PrayerKey, type YearlyCalendar } from './types';
import { diyanetConfigured } from './diyanet';
import { refreshDiyanetStore } from './diyanet-calendar';
import { isoDateIn, zonedToEpoch } from './time';
import {
  ALADHAN_LATITUDE_METHOD,
  DIYANET_ANGLES,
  calculatePrayerTimes,
  type HighLatitudeRule,
} from './solar';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'prayer');
/**
 * Bump when the shape of a cached calendar or the local calculation changes,
 * so an old cache is bypassed instead of quietly serving stale times.
 */
const CACHE_VERSION = 2;
const ALADHAN_BASE = process.env.ALADHAN_BASE_URL ?? 'https://api.aladhan.com/v1';

export interface CalendarRequest {
  year: number;
  latitude: number;
  longitude: number;
  method: number;
  highLatitudeRule: HighLatitudeRule;
  timezone: string;
  /** When set and credentials exist, Diyanet supplies the days it can. */
  diyanetCityId?: number | null;
}

const key = (r: CalendarRequest) =>
  [
    `v${CACHE_VERSION}`,
    r.year,
    r.latitude.toFixed(4),
    r.longitude.toFixed(4),
    r.method,
    r.highLatitudeRule,
    r.timezone.replace(/\//g, '-'),
  ].join('_');

async function readCache(r: CalendarRequest): Promise<YearlyCalendar | null> {
  try {
    const raw = await readFile(path.join(CACHE_DIR, `${key(r)}.json`), 'utf8');
    const parsed = JSON.parse(raw) as YearlyCalendar;
    return parsed.days?.length ? parsed : null;
  } catch {
    return null;
  }
}

async function writeCache(r: CalendarRequest, calendar: YearlyCalendar): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, `${key(r)}.json`), JSON.stringify(calendar), 'utf8');
  } catch {
    // A read-only filesystem (some hosts) just means we refetch next boot.
  }
}

const ALADHAN_FIELDS: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

interface AladhanDay {
  timings: Record<string, string>;
  date: { gregorian: { date: string } };
  meta?: { timezone?: string };
}

/** One request covers the whole year, which is the point of the yearly cache. */
async function fetchFromAladhan(r: CalendarRequest): Promise<YearlyCalendar> {
  const params = new URLSearchParams({
    latitude: String(r.latitude),
    longitude: String(r.longitude),
    method: String(r.method),
    annual: 'true',
  });
  const latAdj = ALADHAN_LATITUDE_METHOD[r.highLatitudeRule];
  if (latAdj != null) params.set('latitudeAdjustmentMethod', String(latAdj));

  const res = await fetch(`${ALADHAN_BASE}/calendar/${r.year}?${params}`, {
    signal: AbortSignal.timeout(20_000),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Aladhan responded ${res.status}`);

  const body = (await res.json()) as { data?: Record<string, AladhanDay[]> };
  const months = body.data;
  if (!months) throw new Error('Aladhan returned no calendar data');

  let timezone = r.timezone;
  const days: DayTimes[] = [];

  for (let month = 1; month <= 12; month++) {
    for (const entry of months[String(month)] ?? []) {
      timezone = entry.meta?.timezone || timezone;
      // Gregorian date arrives as DD-MM-YYYY.
      const [dd, mm, yyyy] = entry.date.gregorian.date.split('-');
      const isoDate = `${yyyy}-${mm}-${dd}`;
      const times = {} as Record<PrayerKey, number | null>;

      for (const prayer of PRAYER_KEYS) {
        // Values look like "05:12 (CEST)"; the zone suffix is redundant once we
        // resolve against the IANA timezone ourselves.
        const raw = entry.timings[ALADHAN_FIELDS[prayer]];
        const match = raw?.match(/^(\d{1,2}):(\d{2})/);
        times[prayer] = match
          ? zonedToEpoch(isoDate, Number(match[1]), Number(match[2]), timezone)
          : null;
      }
      days.push({ date: isoDate, times });
    }
  }

  if (days.length < 300) throw new Error(`Aladhan returned only ${days.length} days`);

  return {
    year: r.year,
    latitude: r.latitude,
    longitude: r.longitude,
    method: r.method,
    timezone,
    source: 'aladhan',
    fetchedAt: Date.now(),
    days,
  };
}

/**
 * Offline fallback: the same year, computed locally. Used when the network is
 * unavailable so the display never goes blank, and flagged in the response so
 * the UI can say where the numbers came from.
 */
export function computeYear(r: CalendarRequest): YearlyCalendar {
  const days: DayTimes[] = [];
  const cursor = new Date(r.year, 0, 1, 12, 0, 0);

  while (cursor.getFullYear() === r.year) {
    const raw = calculatePrayerTimes(
      cursor,
      r.latitude,
      r.longitude,
      DIYANET_ANGLES,
      r.highLatitudeRule,
    );
    const times = {} as Record<PrayerKey, number | null>;
    for (const prayer of PRAYER_KEYS) {
      times[prayer] = raw[prayer]?.getTime() ?? null;
    }
    // Label the day by the location's own calendar, not the server's.
    const anchor = raw.dhuhr?.getTime() ?? cursor.getTime();
    days.push({ date: isoDateIn(anchor, r.timezone), times });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    year: r.year,
    latitude: r.latitude,
    longitude: r.longitude,
    method: r.method,
    timezone: r.timezone,
    source: 'calculated',
    fetchedAt: Date.now(),
    days,
  };
}

/**
 * Overlays whatever Diyanet has supplied for this city onto a locally computed
 * year.
 *
 * Diyanet can only ever return the current month, so a full year from it does
 * not exist. Rather than leaving eleven months blank, the calculated year is
 * the base and the official days replace it where they are known. The result
 * reports how many days are genuinely official so the UI can be honest about
 * what is on screen.
 */
async function buildFromDiyanet(r: CalendarRequest): Promise<YearlyCalendar> {
  const cityId = r.diyanetCityId!;
  const today = isoDateIn(Date.now(), r.timezone);
  const { store, error } = await refreshDiyanetStore(cityId, r.timezone, today);

  const base = computeYear(r);
  let officialDays = 0;
  const days = base.days.map((day) => {
    const official = store.days[day.date];
    if (!official) return day;
    officialDays++;
    // Keep a calculated value for any single time Diyanet omitted.
    const times = { ...day.times };
    for (const prayer of PRAYER_KEYS) {
      if (official[prayer] != null) times[prayer] = official[prayer];
    }
    return { date: day.date, times };
  });

  return {
    ...base,
    source: officialDays > 0 ? 'diyanet' : 'calculated',
    days,
    officialDays,
    sourceNote:
      error ?? (officialDays > 0 ? undefined : 'No Diyanet data cached for this city yet'),
  };
}

/**
 * Cache-first, in source order: Diyanet when it is configured and a city is
 * chosen, otherwise Aladhan's annual calendar, otherwise local calculation.
 *
 * Aladhan's year is fetched once and never refetched. Diyanet is not cached
 * here at all - it maintains its own accumulating store, because its data
 * arrives a month at a time and has to be topped up as the year goes on.
 */
export async function getYearlyCalendar(r: CalendarRequest): Promise<YearlyCalendar> {
  if (r.diyanetCityId && diyanetConfigured()) {
    try {
      return await buildFromDiyanet(r);
    } catch (error) {
      console.warn(`[prayer-times] Diyanet failed (${(error as Error).message}).`);
      // Fall through to Aladhan rather than showing nothing.
    }
  }

  const cached = await readCache(r);
  if (cached && cached.source === 'aladhan') return cached;

  try {
    const fresh = await fetchFromAladhan(r);
    await writeCache(r, fresh);
    return fresh;
  } catch (error) {
    if (cached) return cached;
    const computed = computeYear(r);
    if (computed.days.length) await writeCache(r, computed);
    console.warn(
      `[prayer-times] Aladhan unavailable (${(error as Error).message}); using local calculation.`,
    );
    return computed;
  }
}
