import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Client for the Diyanet İşleri Başkanlığı prayer-time service
 * (awqatsalah.diyanet.gov.tr).
 *
 * Two things about this API shape everything below.
 *
 * 1. The quota is small. A Standard-role account gets five requests per day
 *    *per endpoint* (counted per parameter value); the documentation says in as
 *    many words that integrators are expected to host the data themselves. So
 *    every response here is written to disk and reused, tokens included, and a
 *    counter refuses to spend the day's allowance on retries.
 *
 * 2. There is no yearly endpoint. The largest is /Monthly/{cityId}, and it
 *    takes no month parameter - it returns the current month only. A full year
 *    cannot be fetched, however patient you are. The calendar layer therefore
 *    accumulates each month as it arrives and fills the rest by calculation.
 */

const BASE = (process.env.DIYANET_BASE_URL ?? 'https://awqatsalah.diyanet.gov.tr').replace(/\/$/, '');
const CACHE_DIR = path.join(process.cwd(), '.cache', 'diyanet');

/** Held back from the documented 5/day so a bad day cannot lock the account out. */
const DAILY_REQUEST_BUDGET = Number(process.env.DIYANET_DAILY_BUDGET ?? 4);

export interface DiyanetPlace {
  id: number;
  code: string | null;
  name: string;
}

export interface DiyanetCityDetail {
  id: string;
  name: string;
  city: string;
  country: string;
  countryEn: string | null;
  qiblaAngle: string | null;
  geographicQiblaAngle: string | null;
  distanceToKaaba: string | null;
}

export interface DiyanetPrayerDay {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  /** "29.11.2022" */
  gregorianDateShort: string;
  /** "2022-11-29T00:00:00.0000000+03:00" - carries the real UTC offset. */
  gregorianDateLongIso8601: string | null;
  hijriDateLong: string | null;
  greenwichMeanTimeZone: number | null;
}

interface DiyanetResult<T> {
  data: T;
  success: boolean;
  message: string | null;
}

export class DiyanetError extends Error {
  // Written out rather than declared as a constructor parameter property:
  // Node's type stripping (which runs scripts/diyanet-check.mjs) rejects those.
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DiyanetError';
    this.status = status;
  }
}

export function diyanetConfigured(): boolean {
  return Boolean(process.env.DIYANET_EMAIL && process.env.DIYANET_PASSWORD);
}

/* ------------------------------------------------------------------ *
 * Disk-backed state: tokens and the daily request counter
 * ------------------------------------------------------------------ */

interface TokenState {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms, read from the JWT's own exp claim. */
  expiresAt: number;
}

interface DiskState {
  token?: TokenState;
  /** ISO date (UTC) the counter belongs to. */
  budgetDate?: string;
  /** Requests spent today, keyed by endpoint path. */
  spent?: Record<string, number>;
}

let state: DiskState | null = null;

async function loadState(): Promise<DiskState> {
  if (state) return state;
  try {
    state = JSON.parse(await readFile(path.join(CACHE_DIR, 'state.json'), 'utf8')) as DiskState;
  } catch {
    state = {};
  }
  return state;
}

async function saveState(): Promise<void> {
  if (!state) return;
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, 'state.json'), JSON.stringify(state), 'utf8');
  } catch {
    // A read-only filesystem only costs us the token across restarts.
  }
}

const utcDay = () => new Date().toISOString().slice(0, 10);

/**
 * Spends one request against today's budget for `key`, or throws.
 * Auth calls are exempt: being unable to log in is not a quota problem, and
 * the token is cached hard enough that logins are rare.
 */
async function spendBudget(key: string): Promise<void> {
  const s = await loadState();
  const today = utcDay();
  if (s.budgetDate !== today) {
    s.budgetDate = today;
    s.spent = {};
  }
  const used = s.spent?.[key] ?? 0;
  if (used >= DAILY_REQUEST_BUDGET) {
    throw new DiyanetError(
      `Daily request budget for ${key} is spent (${used}/${DAILY_REQUEST_BUDGET}). ` +
        'Cached data is being served instead.',
    );
  }
  s.spent = { ...(s.spent ?? {}), [key]: used + 1 };
  await saveState();
}

export async function budgetReport(): Promise<{ date: string; spent: Record<string, number>; limit: number }> {
  const s = await loadState();
  return {
    date: s.budgetDate ?? utcDay(),
    spent: s.budgetDate === utcDay() ? (s.spent ?? {}) : {},
    limit: DAILY_REQUEST_BUDGET,
  };
}

/* ------------------------------------------------------------------ *
 * Authentication
 * ------------------------------------------------------------------ */

/** Reads the `exp` claim without verifying - we only need the expiry. */
function jwtExpiry(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Access tokens last 30 minutes; renew a little early. */
const RENEW_MARGIN_MS = 3 * 60_000;
const DEFAULT_TOKEN_LIFETIME_MS = 30 * 60_000;

function tokenStateFrom(data: { accessToken: string; refreshToken: string }): TokenState {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: jwtExpiry(data.accessToken) ?? Date.now() + DEFAULT_TOKEN_LIFETIME_MS,
  };
}

async function postLogin(): Promise<TokenState> {
  const email = process.env.DIYANET_EMAIL;
  const password = process.env.DIYANET_PASSWORD;
  if (!email || !password) throw new DiyanetError('DIYANET_EMAIL and DIYANET_PASSWORD are not set');

  const res = await fetch(`${BASE}/api/Auth/Login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => null)) as DiyanetResult<TokenState> | null;
  if (!res.ok || !body?.success || !body.data?.accessToken) {
    throw new DiyanetError(body?.message ?? `Login failed (${res.status})`, res.status);
  }
  return tokenStateFrom(body.data);
}

/**
 * The refresh window is the access token's expiry plus fifteen minutes. Past
 * that the refresh token is dead too and a full login is the only way back.
 */
async function postRefresh(refreshToken: string): Promise<TokenState> {
  const res = await fetch(`${BASE}/api/Auth/RefreshToken/${encodeURIComponent(refreshToken)}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => null)) as DiyanetResult<TokenState> | null;
  if (!res.ok || !body?.success || !body.data?.accessToken) {
    throw new DiyanetError(body?.message ?? `Token refresh failed (${res.status})`, res.status);
  }
  return tokenStateFrom(body.data);
}

/** One in-flight authentication at a time, so parallel calls share a login. */
let authInFlight: Promise<TokenState> | null = null;

async function authenticate(force = false): Promise<TokenState> {
  const s = await loadState();
  const current = s.token;
  if (!force && current && current.expiresAt - RENEW_MARGIN_MS > Date.now()) return current;

  authInFlight ??= (async () => {
    let next: TokenState;
    const REFRESH_GRACE_MS = 15 * 60_000;
    if (!force && current?.refreshToken && Date.now() < current.expiresAt + REFRESH_GRACE_MS) {
      try {
        next = await postRefresh(current.refreshToken);
      } catch {
        next = await postLogin();
      }
    } else {
      next = await postLogin();
    }
    const store = await loadState();
    store.token = next;
    await saveState();
    return next;
  })().finally(() => {
    authInFlight = null;
  });

  return authInFlight;
}

/* ------------------------------------------------------------------ *
 * Requests
 * ------------------------------------------------------------------ */

interface GetOptions {
  /** Budget key; omit for endpoints that should not be metered. */
  budgetKey?: string;
}

async function get<T>(endpoint: string, { budgetKey }: GetOptions = {}): Promise<T> {
  if (budgetKey) await spendBudget(budgetKey);

  const call = async (token: string) =>
    fetch(`${BASE}${endpoint}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    });

  let auth = await authenticate();
  let res = await call(auth.accessToken);

  // A rejected token means our cached expiry disagreed with the server's.
  if (res.status === 401) {
    auth = await authenticate(true);
    res = await call(auth.accessToken);
  }

  if (res.status === 429) {
    throw new DiyanetError(`Rate limited by Diyanet on ${endpoint}`, 429);
  }
  const body = (await res.json().catch(() => null)) as DiyanetResult<T> | null;
  if (!res.ok || !body?.success) {
    throw new DiyanetError(body?.message ?? `${endpoint} failed (${res.status})`, res.status);
  }
  return body.data;
}

/* ------------------------------------------------------------------ *
 * Place lookups
 *
 * Country/state/city lists effectively never change, so they are cached on
 * disk forever and only ever fetched once per deployment.
 * ------------------------------------------------------------------ */

async function cachedPlaces(
  cacheKey: string,
  endpoint: string,
  budgetKey: string,
): Promise<DiyanetPlace[]> {
  const file = path.join(CACHE_DIR, `${cacheKey}.json`);
  try {
    const cached = JSON.parse(await readFile(file, 'utf8')) as DiyanetPlace[];
    if (cached.length) return cached;
  } catch {
    // Not fetched yet.
  }

  const places = await get<DiyanetPlace[]>(endpoint, { budgetKey });
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(file, JSON.stringify(places), 'utf8');
  } catch {
    /* cache is an optimisation */
  }
  return places;
}

export const listCountries = () =>
  cachedPlaces('countries', '/api/Place/Countries', 'Place/Countries');

export const listStates = (countryId: number) =>
  cachedPlaces(`states-${countryId}`, `/api/Place/States/${countryId}`, `Place/States/${countryId}`);

export const listCities = (stateId: number) =>
  cachedPlaces(`cities-${stateId}`, `/api/Place/Cities/${stateId}`, `Place/Cities/${stateId}`);

export async function cityDetail(cityId: number): Promise<DiyanetCityDetail> {
  const file = path.join(CACHE_DIR, `city-${cityId}.json`);
  try {
    return JSON.parse(await readFile(file, 'utf8')) as DiyanetCityDetail;
  } catch {
    // Not fetched yet.
  }
  const detail = await get<DiyanetCityDetail>(`/api/Place/CityDetail/${cityId}`, {
    budgetKey: `Place/CityDetail/${cityId}`,
  });
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(file, JSON.stringify(detail), 'utf8');
  } catch {
    /* cache is an optimisation */
  }
  return detail;
}

/* ------------------------------------------------------------------ *
 * Prayer times
 * ------------------------------------------------------------------ */

/** The current month for a city. There is no way to ask for a different one. */
export const monthlyPrayerTimes = (cityId: number) =>
  get<DiyanetPrayerDay[]>(`/api/PrayerTime/Monthly/${cityId}`, {
    budgetKey: `PrayerTime/Monthly/${cityId}`,
  });

export const dailyPrayerTimes = (cityId: number) =>
  get<DiyanetPrayerDay[]>(`/api/PrayerTime/Daily/${cityId}`, {
    budgetKey: `PrayerTime/Daily/${cityId}`,
  });

export interface DailyContent {
  verse: string;
  verseSource: string | null;
  hadith: string;
  hadithSource: string | null;
  pray: string;
  praySource: string | null;
}

export const dailyContent = () =>
  get<DailyContent>('/api/DailyContent', { budgetKey: 'DailyContent' });
