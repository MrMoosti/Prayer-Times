/**
 * Timezone helpers. Every prayer time is stored as an absolute epoch value so a
 * screen in one timezone can display times for a city in another, which is the
 * whole point of the location setting.
 */

const partsCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsCache.set(timeZone, f);
  }
  return f;
}

/** Milliseconds that `timeZone` is ahead of UTC at the given instant. */
export function timezoneOffset(at: Date | number, timeZone: string): number {
  const date = typeof at === 'number' ? new Date(at) : at;
  const parts = formatter(timeZone).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Converts a wall-clock date and time in `timeZone` to an epoch value.
 * Resolves the offset twice so times that straddle a DST change land correctly.
 */
export function zonedToEpoch(
  isoDate: string,
  hours: number,
  minutes: number,
  timeZone: string,
): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const naive = Date.UTC(y, m - 1, d, hours, minutes, 0, 0);
  const firstGuess = naive - timezoneOffset(naive, timeZone);
  const refined = naive - timezoneOffset(firstGuess, timeZone);
  return refined;
}

/** YYYY-MM-DD for an instant, as seen in `timeZone`. */
export function isoDateIn(at: Date | number, timeZone: string): string {
  const date = typeof at === 'number' ? new Date(at) : at;
  const parts = formatter(timeZone).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function formatClock(at: number, timeZone: string, clock24h: boolean): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: !clock24h,
  })
    .format(new Date(at))
    .replace(/\s?(am|pm)/i, (s) => s.toUpperCase());
}

export function formatLongDate(at: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(at));
}

export function formatHijri(at: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      timeZone,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(at));
  } catch {
    return '';
  }
}

/** "02:07:41" or "07:41" - always fixed width so the display does not jitter. */
export function formatCountdown(ms: number): { hhmm: string; seconds: string } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    hhmm: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    seconds: String(s).padStart(2, '0'),
  };
}
