import { NextResponse } from 'next/server';
import { badRequest, diyanetGet, errorResponse } from '@/lib/diyanet-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get('latitude'));
  const longitude = Number(params.get('longitude'));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return badRequest('latitude and longitude are required');
  }

  try {
    const body = await diyanetGet('/api/v1/places/nearest', {
      latitude: String(latitude),
      longitude: String(longitude),
      limit: '5',
    });
    return NextResponse.json(body);
  } catch (error) {
    return errorResponse(error);
  }
}
