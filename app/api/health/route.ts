import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Liveness probe for the container healthcheck and for Coolify. */
export async function GET() {
  return NextResponse.json({ status: 'ok', at: new Date().toISOString() });
}
