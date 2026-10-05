import { NextResponse } from 'next/server';
import { badRequest, diyanetGet, errorResponse, ISO_DATE } from '@/lib/diyanet-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const cityId = Number(params.get('cityId'));
  const startDate = params.get('startDate') ?? '';
  const endDate = params.get('endDate') ?? '';
  if (!Number.isInteger(cityId) || cityId <= 0) return badRequest('cityId is required');
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) {
    return badRequest('startDate and endDate must be YYYY-MM-DD');
  }

  try {
    const body = await diyanetGet(`/api/v1/prayer-times/${cityId}/range`, { startDate, endDate });
    return NextResponse.json(body);
  } catch (error) {
    return errorResponse(error);
  }
}
