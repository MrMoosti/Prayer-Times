import { NextResponse } from 'next/server';
import { badRequest, diyanetGet, errorResponse } from '@/lib/diyanet-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const search = (params.get('search') ?? '').trim();
  if (search.length < 2) return badRequest('search needs at least 2 characters');

  try {
    const body = await diyanetGet('/api/v1/places/cities', { search, size: '12' });
    return NextResponse.json(body);
  } catch (error) {
    return errorResponse(error);
  }
}
