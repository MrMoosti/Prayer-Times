import 'server-only';
import { NextResponse } from 'next/server';

const BASE_URL = (process.env.DIYANET_API_URL ?? 'https://diyanetapi.mennova.nl').replace(/\/$/, '');

export class DiyanetApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

interface Problem {
  code?: string;
  title?: string;
  detail?: string;
}

export async function diyanetGet<T>(path: string, params: Record<string, string | undefined> = {}) {
  const apiKey = process.env.DIYANET_API_KEY;
  if (!apiKey) {
    throw new DiyanetApiError('DIYANET_API_KEY is not set', 503, 'missing_api_key');
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, value);
  }
  const url = `${BASE_URL}${path}${query.size ? `?${query}` : ''}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { accept: 'application/json', 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    });
  } catch {
    throw new DiyanetApiError('Diyanet API unreachable', 502, 'upstream_unreachable');
  }

  if (!res.ok) {
    const problem = (await res.json().catch(() => ({}))) as Problem;
    throw new DiyanetApiError(
      problem.detail ?? problem.title ?? `Diyanet API responded ${res.status}`,
      res.status,
      problem.code ?? 'upstream_error',
    );
  }
  return (await res.json()) as T;
}

export function errorResponse(error: unknown) {
  if (error instanceof DiyanetApiError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: 'Unexpected error', code: 'internal_error' }, { status: 500 });
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function badRequest(message: string) {
  return NextResponse.json({ error: message, code: 'bad_request' }, { status: 400 });
}
