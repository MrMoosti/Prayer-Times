import { addDays, zonedToEpoch } from './time';
import { PRAYER_KEYS, type DayTimes, type PrayerKey, type YearlyCalendar } from './types';

const STORAGE_KEY = 'mektep-prayer.times.v1';

export const RANGE_DAYS = 365;
export const TOP_UP_BELOW_DAYS = 30;

interface RemoteDay {
  date: string;
  fajr: string | null;
  sunrise: string | null;
  dhuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
}

interface RangeResponse {
  data: RemoteDay[];
}

export function loadCalendar(): YearlyCalendar | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as YearlyCalendar;
    if (!parsed || !Array.isArray(parsed.days) || typeof parsed.cityId !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCalendar(calendar: YearlyCalendar): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calendar));
  } catch {
    return;
  }
}

export function clearCalendar(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

export function futureDayCount(calendar: YearlyCalendar, today: string): number {
  return calendar.days.filter((day) => day.date >= today).length;
}

function parseClock(value: string | null | undefined): [number, number] | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

function toDay(remote: RemoteDay, timezone: string): DayTimes {
  const times = {} as Record<PrayerKey, number | null>;
  for (const key of PRAYER_KEYS) {
    const clock = parseClock(remote[key]);
    times[key] = clock ? zonedToEpoch(remote.date, clock[0], clock[1], timezone) : null;
  }
  return { date: remote.date, times };
}

export async function fetchCalendar(
  cityId: number,
  timezone: string,
  today: string,
  previous: YearlyCalendar | null,
): Promise<YearlyCalendar> {
  const params = new URLSearchParams({
    cityId: String(cityId),
    startDate: today,
    endDate: addDays(today, RANGE_DAYS),
  });
  const res = await fetch(`/api/prayer-times?${params}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  const body = (await res.json()) as RangeResponse;
  const fresh = body.data.map((day) => toDay(day, timezone));
  if (!fresh.length) throw new Error('No prayer times returned');

  const byDate = new Map<string, DayTimes>();
  const keepFrom = addDays(today, -1);
  if (previous && previous.cityId === cityId && previous.timezone === timezone) {
    for (const day of previous.days) if (day.date >= keepFrom) byDate.set(day.date, day);
  }
  for (const day of fresh) byDate.set(day.date, day);

  return {
    cityId,
    timezone,
    fetchedAt: Date.now(),
    days: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
