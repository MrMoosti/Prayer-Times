import { addDays, isoDateIn, zonedToEpoch } from './time';
import type { DayTimes, PrayerKey, YearlyCalendar } from './types';

const DUMMY_CLOCK: Record<PrayerKey, [number, number]> = {
  fajr: [5, 30],
  sunrise: [7, 0],
  dhuhr: [13, 15],
  asr: [16, 30],
  maghrib: [19, 45],
  isha: [21, 15],
};

const SPAN_DAYS = 3;

function dummyDay(isoDate: string, timezone: string): DayTimes {
  const times = {} as Record<PrayerKey, number | null>;
  for (const key of Object.keys(DUMMY_CLOCK) as PrayerKey[]) {
    const [hours, minutes] = DUMMY_CLOCK[key];
    times[key] = zonedToEpoch(isoDate, hours, minutes, timezone);
  }
  return { date: isoDate, times };
}

export function dummyCalendar(now: number, timezone: string): YearlyCalendar {
  const today = isoDateIn(now, timezone);
  const days: DayTimes[] = [];
  for (let offset = -SPAN_DAYS; offset <= SPAN_DAYS; offset++) {
    days.push(dummyDay(addDays(today, offset), timezone));
  }
  return { timezone, days };
}
