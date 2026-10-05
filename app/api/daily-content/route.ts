import { NextResponse } from 'next/server';
import { badRequest, diyanetGet, errorResponse, ISO_DATE } from '@/lib/diyanet-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cache = new Map<string, { at: number; body: unknown }>();
const TTL = 60 * 60_000;

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? '';
  if (!ISO_DATE.test(date)) return badRequest('date must be YYYY-MM-DD');

  const hit = cache.get(date);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.body);

  try {
    const body = await diyanetGet('/api/v1/daily-content', { date });
    cache.set(date, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (error) {
    if (hit) return NextResponse.json(hit.body);
    return errorResponse(error);
  }
}
