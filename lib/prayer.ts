import { PRAYER_KEYS, type DayTimes, type KerahatWindow, type PrayerKey, type Settings, type YearlyCalendar } from './types';
import { addDays, isoDateIn } from './time';

const MINUTE = 60_000;

/** Kerahat windows are conventionally 45 minutes wide either side of the event. */
export const KERAHAT_MINUTES = 45;

export interface ScheduleEntry {
  key: PrayerKey;
  /** Epoch ms, offset already applied. */
  at: number;
  /** True for the entry whose window contains "now". Sunrise never holds it. */
  current: boolean;
  /** True for the next entry due, sunrise included. */
  next: boolean;
  passed: boolean;
  /** Set on the next entry when it belongs to the following day. */
  tomorrow?: boolean;
}

export interface Schedule {
  date: string;
  entries: ScheduleEntry[];
  current: ScheduleEntry | null;
  next: ScheduleEntry | null;
  /** Epoch ms of the next entry, which may fall on tomorrow's calendar day. */
  nextAt: number | null;
  kerahat: KerahatWindow[];
}

function withOffsets(day: DayTimes, offsets: Record<PrayerKey, number>) {
  const out: Partial<Record<PrayerKey, number>> = {};
  for (const key of PRAYER_KEYS) {
    const raw = day.times[key];
    if (raw != null) out[key] = raw + (offsets[key] ?? 0) * MINUTE;
  }
  return out;
}

export function findDay(calendar: YearlyCalendar, isoDate: string): DayTimes | undefined {
  return calendar.days.find((d) => d.date === isoDate);
}

/**
 * Builds the day's schedule around `now`.
 *
 * "Current" is the prayer whose window we are inside - before Fajr that is
 * yesterday's Isha, which is why the previous day is consulted. "Next" is
 * simply the next event on the clock, and sunrise counts: it is what ends the
 * Fajr window, so it is the honest thing to count down to during Fajr.
 */
export function buildSchedule(
  calendar: YearlyCalendar,
  settings: Settings,
  now: number,
): Schedule | null {
  const tz = calendar.timezone;
  const today = isoDateIn(now, tz);
  const day = findDay(calendar, today);
  if (!day) return null;

  const times = withOffsets(day, settings.offsets);
  const yesterday = findDay(calendar, addDays(today, -1));
  const tomorrow = findDay(calendar, addDays(today, 1));

  // Sorted by clock, not by the canonical order: with a high-latitude rule or
  // a large offset, Isha can land after midnight and Fajr can cross a day
  // boundary, and everything below assumes chronological order.
  const entries: ScheduleEntry[] = PRAYER_KEYS.filter((k) => times[k] != null)
    .map((key) => ({
      key,
      at: times[key]!,
      current: false,
      next: false,
      passed: times[key]! <= now,
    }))
    .sort((a, b) => a.at - b.at);

  const nextEntry = entries.find((e) => e.at > now) ?? null;
  if (nextEntry) nextEntry.next = true;

  // Current prayer: the latest prayable time already reached today.
  const reached = entries.filter((e) => e.key !== 'sunrise' && e.at <= now);
  const currentEntry = reached.length ? reached[reached.length - 1] : null;
  if (currentEntry) currentEntry.current = true;

  // After Isha nothing is left today, so the countdown - and the card that
  // names it - roll over to tomorrow's Fajr. The rolled-over entry is
  // deliberately not added to `entries`: today's Fajr row must not light up.
  let next = nextEntry;
  if (!next && tomorrow) {
    const tomorrowTimes = withOffsets(tomorrow, settings.offsets);
    if (tomorrowTimes.fajr != null) {
      next = {
        key: 'fajr',
        at: tomorrowTimes.fajr,
        current: false,
        next: true,
        passed: false,
        tomorrow: true,
      };
    }
  }

  const nextAt: number | null = next?.at ?? null;

  let current = currentEntry;
  if (!current && yesterday) {
    // Before Fajr the standing prayer is last night's Isha.
    const y = withOffsets(yesterday, settings.offsets);
    if (y.isha != null) {
      current = { key: 'isha', at: y.isha, current: true, next: false, passed: true };
    }
  }

  return {
    date: today,
    entries,
    current,
    next,
    nextAt,
    kerahat: buildKerahat(times),
  };
}

function buildKerahat(times: Partial<Record<PrayerKey, number>>): KerahatWindow[] {
  const span = KERAHAT_MINUTES * MINUTE;
  const windows: KerahatWindow[] = [];

  if (times.sunrise != null) {
    windows.push({
      key: 'israk',
      label: 'After sunrise',
      description: 'From sunrise until the sun has fully risen (Israk).',
      start: times.sunrise,
      end: times.sunrise + span,
    });
  }
  if (times.dhuhr != null) {
    windows.push({
      key: 'istiva',
      label: 'Solar zenith',
      description: 'While the sun stands at its highest point, until Dhuhr (Istiva).',
      start: times.dhuhr - span,
      end: times.dhuhr,
    });
  }
  if (times.maghrib != null) {
    windows.push({
      key: 'isfirar',
      label: 'Before sunset',
      description: 'From when the sun yellows until it sets (Isfirar).',
      start: times.maghrib - span,
      end: times.maghrib,
    });
  }
  return windows;
}

export function activeKerahat(windows: KerahatWindow[], now: number): KerahatWindow | null {
  return windows.find((w) => now >= w.start && now < w.end) ?? null;
}
