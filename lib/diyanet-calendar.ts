import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DiyanetError, monthlyPrayerTimes, type DiyanetPrayerDay } from './diyanet';
import { PRAYER_KEYS, type PrayerKey } from './types';
import { zonedToEpoch } from './time';

/**
 * Accumulates what Diyanet will give us.
 *
 * /api/PrayerTime/Monthly/{cityId} returns the current month and takes no month
 * parameter, so a year cannot be requested. Instead every response is merged
 * into a per-city store that grows month by month; the calendar layer fills
 * whatever is still missing by calculation. A display left running collects the
 * official times for each month as it arrives.
 */

const STORE_DIR = path.join(process.cwd(), '.cache', 'prayer');

export interface DiyanetStore {
  cityId: number;
  /** ISO date -> per-prayer epoch ms. */
  days: Record<string, Record<PrayerKey, number | null>>;
  lastFetchAt: number;
  lastError?: string;
}

const storeFile = (cityId: number) => path.join(STORE_DIR, `diyanet-${cityId}.json`);

async function readStore(cityId: number): Promise<DiyanetStore> {
  try {
    const parsed = JSON.parse(await readFile(storeFile(cityId), 'utf8')) as DiyanetStore;
    if (parsed.cityId === cityId && parsed.days) return parsed;
  } catch {
    // First run for this city.
  }
  return { cityId, days: {}, lastFetchAt: 0 };
}

async function writeStore(store: DiyanetStore): Promise<void> {
  try {
    await mkdir(STORE_DIR, { recursive: true });
    await writeFile(storeFile(store.cityId), JSON.stringify(store), 'utf8');
  } catch {
    // Without a writable cache every restart re-spends a request; the budget
    // guard in diyanet.ts still keeps that from running away.
  }
}

/**
 * Diyanet sends wall-clock times plus the date's real UTC offset. Using that
 * offset directly is more reliable than mapping the city onto an IANA zone,
 * and it stays correct across a daylight-saving change mid-month.
 */
function parseDay(
  day: DiyanetPrayerDay,
  fallbackTimezone: string,
): { date: string; times: Record<PrayerKey, number | null> } | null {
  // "29.11.2022"
  const short = day.gregorianDateShort?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!short) return null;
  const isoDate = `${short[3]}-${short[2]}-${short[1]}`;

  // "2022-11-29T00:00:00.0000000+03:00"
  const offsetMatch = day.gregorianDateLongIso8601?.match(/([+-])(\d{2}):(\d{2})$/);
  let offsetMinutes: number | null = null;
  if (offsetMatch) {
    const sign = offsetMatch[1] === '-' ? -1 : 1;
    offsetMinutes = sign * (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3]));
  } else if (typeof day.greenwichMeanTimeZone === 'number') {
    offsetMinutes = day.greenwichMeanTimeZone * 60;
  }

  const [y, m, d] = isoDate.split('-').map(Number);
  const toEpoch = (value: string): number | null => {
    const hm = value?.match(/^(\d{1,2}):(\d{2})/);
    if (!hm) return null;
    const hours = Number(hm[1]);
    const minutes = Number(hm[2]);
    if (offsetMinutes == null) {
      // No offset in the payload: fall back to the configured zone.
      return zonedToEpoch(isoDate, hours, minutes, fallbackTimezone);
    }
    return Date.UTC(y, m - 1, d, hours, minutes) - offsetMinutes * 60_000;
  };

  const times = {} as Record<PrayerKey, number | null>;
  for (const key of PRAYER_KEYS) times[key] = toEpoch(day[key]);
  // A day with no Dhuhr is a malformed row, not a high-latitude edge case.
  if (times.dhuhr == null) return null;

  return { date: isoDate, times };
}

export interface RefreshOutcome {
  store: DiyanetStore;
  fetched: boolean;
  error?: string;
}

/**
 * Fetches the current month when the store no longer covers the days we are
 * about to display. `lookaheadDays` is small on purpose: there is no way to ask
 * for next month early, so the fetch has to wait until the month turns over.
 */
export async function refreshDiyanetStore(
  cityId: number,
  fallbackTimezone: string,
  todayIso: string,
  lookaheadDays = 2,
): Promise<RefreshOutcome> {
  const store = await readStore(cityId);

  const needed: string[] = [];
  const [y, m, d] = todayIso.split('-').map(Number);
  for (let i = 0; i <= lookaheadDays; i++) {
    const cursor = new Date(Date.UTC(y, m - 1, d + i));
    needed.push(cursor.toISOString().slice(0, 10));
  }
  const covered = needed.every((date) => store.days[date]);

  // One fetch per hour at most, on top of the daily budget in diyanet.ts.
  const recentlyTried = Date.now() - store.lastFetchAt < 60 * 60_000;
  if (covered || recentlyTried) return { store, fetched: false, error: store.lastError };

  try {
    const month = await monthlyPrayerTimes(cityId);
    let added = 0;
    for (const raw of month) {
      const parsed = parseDay(raw, fallbackTimezone);
      if (!parsed) continue;
      store.days[parsed.date] = parsed.times;
      added++;
    }
    store.lastFetchAt = Date.now();
    delete store.lastError;
    if (!added) store.lastError = 'Diyanet returned no usable days';
    await writeStore(store);
    return { store, fetched: added > 0 };
  } catch (error) {
    const message =
      error instanceof DiyanetError ? error.message : (error as Error).message;
    store.lastFetchAt = Date.now();
    store.lastError = message;
    await writeStore(store);
    return { store, fetched: false, error: message };
  }
}
