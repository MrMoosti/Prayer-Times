import { NextResponse } from 'next/server';
import {
  cityDetail,
  diyanetConfigured,
  listCities,
  listCountries,
  listStates,
} from '@/lib/diyanet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The Country → State → City cascade Diyanet uses to address a place.
 *
 * Each list is cached on disk by the client the first time it is asked for, so
 * browsing the picker does not spend the daily quota more than once per level.
 */
export async function GET(request: Request) {
  if (!diyanetConfigured()) {
    return NextResponse.json(
      { error: 'Diyanet credentials are not configured on the server', configured: false },
      { status: 503 },
    );
  }

  const params = new URL(request.url).searchParams;
  const level = params.get('level') ?? 'countries';
  const parentId = Number(params.get('parentId'));

  try {
    switch (level) {
      case 'countries':
        return NextResponse.json({ results: await listCountries() });
      case 'states':
        if (!Number.isFinite(parentId)) {
          return NextResponse.json({ error: 'parentId (countryId) is required' }, { status: 400 });
        }
        return NextResponse.json({ results: await listStates(parentId) });
      case 'cities':
        if (!Number.isFinite(parentId)) {
          return NextResponse.json({ error: 'parentId (stateId) is required' }, { status: 400 });
        }
        return NextResponse.json({ results: await listCities(parentId) });
      case 'detail':
        if (!Number.isFinite(parentId)) {
          return NextResponse.json({ error: 'parentId (cityId) is required' }, { status: 400 });
        }
        return NextResponse.json({ result: await cityDetail(parentId) });
      default:
        return NextResponse.json({ error: `unknown level "${level}"` }, { status: 400 });
    }
  } catch (error) {
    // A spent quota is an expected state, not a crash: say so plainly.
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
