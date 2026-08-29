import { NextResponse } from 'next/server';
import { getYearlyCalendar } from '@/lib/calendar-source';
import type { HighLatitudeRule } from '@/lib/solar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RULES: HighLatitudeRule[] = ['none', 'middleOfNight', 'oneSeventh', 'angleBased'];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get('latitude'));
  const longitude = Number(params.get('longitude'));
  const year = Number(params.get('year')) || new Date().getFullYear();
  const method = Number(params.get('method')) || 13;
  const timezone = params.get('timezone') || 'UTC';
  const cityIdParam = Number(params.get('diyanetCityId'));
  const diyanetCityId = Number.isFinite(cityIdParam) && cityIdParam > 0 ? cityIdParam : null;
  const ruleParam = params.get('highLatitudeRule') as HighLatitudeRule | null;
  const highLatitudeRule = ruleParam && RULES.includes(ruleParam) ? ruleParam : 'oneSeventh';

  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) {
    return NextResponse.json({ error: 'latitude must be between -90 and 90' }, { status: 400 });
  }
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    return NextResponse.json({ error: 'longitude must be between -180 and 180' }, { status: 400 });
  }
  if (year < 1970 || year > 2200) {
    return NextResponse.json({ error: 'year out of range' }, { status: 400 });
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    return NextResponse.json({ error: `unknown timezone "${timezone}"` }, { status: 400 });
  }

  const calendar = await getYearlyCalendar({
    year,
    latitude,
    longitude,
    method,
    highLatitudeRule,
    timezone,
    diyanetCityId,
  });

  return NextResponse.json(calendar, {
    headers: {
      // Aladhan's year is static once fetched. Diyanet's grows a month at a
      // time, so it is held for a shorter spell.
      'cache-control': calendar.source === 'diyanet'
        ? 'public, max-age=600, stale-while-revalidate=3600'
        : 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
