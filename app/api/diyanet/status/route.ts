import { NextResponse } from 'next/server';
import { budgetReport, diyanetConfigured } from '@/lib/diyanet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Whether the server holds Diyanet credentials, and what today's quota looks like. */
export async function GET() {
  const configured = diyanetConfigured();
  if (!configured) return NextResponse.json({ configured: false });
  return NextResponse.json({ configured: true, budget: await budgetReport() });
}
