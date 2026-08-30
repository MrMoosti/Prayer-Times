import { NextResponse } from 'next/server';
import type { WeatherNow } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPEN_METEO = process.env.OPEN_METEO_BASE_URL ?? 'https://api.open-meteo.com/v1';

/** Cached in memory so a wall display polling every 10 min hits the API rarely. */
const cache = new Map<string, { at: number; value: WeatherNow }>();
const TTL = 10 * 60_000;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get('latitude'));
  const longitude = Number(params.get('longitude'));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: 'latitude and longitude are required' }, { status: 400 });
  }

  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.value);

  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m',
    timezone: 'UTC',
  });

  try {
    const res = await fetch(`${OPEN_METEO}/forecast?${query}`, {
      signal: AbortSignal.timeout(8000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
    const body = (await res.json()) as { current?: Record<string, number> };
    const c = body.current;
    if (!c) throw new Error('Open-Meteo returned no current conditions');

    const value: WeatherNow = {
      temperature: c.temperature_2m,
      apparentTemperature: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      code: c.weather_code,
      isDay: c.is_day === 1,
      cloudCover: c.cloud_cover,
      precipitation: c.precipitation,
      observedAt: Date.now(),
      source: 'open-meteo',
    };
    cache.set(key, { at: Date.now(), value });
    return NextResponse.json(value);
  } catch (error) {
    // Stale beats blank on a display that runs unattended.
    if (hit) return NextResponse.json(hit.value);
    console.warn(`[weather] ${(error as Error).message}`);
    return NextResponse.json(
      { error: 'weather unavailable', source: 'unavailable' } satisfies Partial<WeatherNow> & {
        error: string;
      },
      { status: 503 },
    );
  }
}
