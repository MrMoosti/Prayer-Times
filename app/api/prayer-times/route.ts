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
  });

  return NextResponse.json(calendar, {
    // The yearly calendar is static once fetched; let the browser keep it too.
    headers: { 'cache-control': 'public, max-age=3600, stale-while-revalidate=86400' },
  });
}
