'use client';

import { useEffect, useState } from 'react';
import { isoDateIn } from './time';
import type { DailyContent, Settings } from './types';

const STORAGE_KEY = 'mektep-prayer.daily-content.v1';

interface RawContent {
  date?: string;
  verse?: string | null;
  verseSource?: string | null;
  hadith?: string | null;
  hadithSource?: string | null;
  pray?: string | null;
  praySource?: string | null;
}

const clean = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

function normalize(date: string, raw: RawContent): DailyContent {
  return {
    date,
    verse: clean(raw.verse),
    verseSource: clean(raw.verseSource),
    hadith: clean(raw.hadith),
    hadithSource: clean(raw.hadithSource),
    pray: clean(raw.pray),
    praySource: clean(raw.praySource),
  };
}

function readCache(date: string): DailyContent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyContent;
    return parsed.date === date ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(content: DailyContent): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch {
    return;
  }
}

export function useDailyContent(settings: Settings, enabled: boolean): DailyContent | null {
  const [content, setContent] = useState<DailyContent | null>(null);
  const date = isoDateIn(Date.now(), settings.location.timezone);

  useEffect(() => {
    if (!enabled) return;
    const cached = readCache(date);
    if (cached) {
      setContent(cached);
      return;
    }
    setContent(null);

    let cancelled = false;
    fetch(`/api/daily-content?date=${date}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { data?: RawContent };
        const next = normalize(date, body.data ?? {});
        writeCache(next);
        if (!cancelled) setContent(next);
      })
      .catch(() => {
        if (!cancelled) setContent(null);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, date]);

  return content;
}
