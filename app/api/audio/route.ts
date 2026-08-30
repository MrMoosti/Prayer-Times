import { NextResponse } from 'next/server';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

/**
 * Lists the adhan recordings present in /public/audio.
 *
 * Asking the server once is what keeps the client from probing for files that
 * are usually absent and filling the console with 404s. Drop `adhan.mp3` (or
 * `adhan-fajr.mp3` for a per-prayer call) into public/audio and it is picked up
 * on the next load - no configuration.
 */
export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'audio');
    const files = await readdir(dir);
    return NextResponse.json({
      files: files.filter((name) => /\.(mp3|ogg|m4a|wav)$/i.test(name)),
    });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
