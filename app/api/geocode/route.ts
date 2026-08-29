import { NextResponse } from 'next/server';
import { searchFallbackCities } from '@/lib/cities';
import type { LocationSetting } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GEOCODING =
  process.env.OPEN_METEO_GEOCODING_URL ?? 'https://geocoding-api.open-meteo.com/v1';

interface GeocodeHit {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get('q') ?? '').trim();
  if (query.length < 2) {
    return NextResponse.json({ results: searchFallbackCities(query), source: 'builtin' });
  }

  const params = new URLSearchParams({
    name: query,
    count: '8',
    language: 'en',
    format: 'json',
  });

  try {
    const res = await fetch(`${GEOCODING}/search?${params}`, {
      signal: AbortSignal.timeout(8000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`geocoding responded ${res.status}`);
    const body = (await res.json()) as { results?: GeocodeHit[] };
    const results: LocationSetting[] = (body.results ?? []).map((hit) => ({
      name: hit.admin1 && hit.admin1 !== hit.name ? `${hit.name}, ${hit.admin1}` : hit.name,
      country: hit.country ?? '',
      latitude: hit.latitude,
      longitude: hit.longitude,
      timezone: hit.timezone ?? 'UTC',
    }));
    if (!results.length) {
      return NextResponse.json({ results: searchFallbackCities(query), source: 'builtin' });
    }
    return NextResponse.json({ results, source: 'open-meteo' });
  } catch {
    // Offline: fall back to the bundled list rather than an empty picker.
    return NextResponse.json({ results: searchFallbackCities(query), source: 'builtin' });
  }
}
