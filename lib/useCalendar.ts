'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  TOP_UP_BELOW_DAYS,
  fetchCalendar,
  futureDayCount,
  loadCalendar,
  saveCalendar,
} from './prayer-cache';
import { isoDateIn } from './time';
import type { Settings, YearlyCalendar } from './types';

export type CalendarStatus = 'loading' | 'ready' | 'no-city' | 'error';

export interface CalendarState {
  calendar: YearlyCalendar | null;
  status: CalendarStatus;
  error: string | null;
  reload: () => void;
}

export function useCalendar(settings: Settings, enabled: boolean): CalendarState {
  const { cityId, timezone } = settings.location;
  const today = isoDateIn(Date.now(), timezone);

  const [calendar, setCalendar] = useState<YearlyCalendar | null>(null);
  const [status, setStatus] = useState<CalendarStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    if (cityId == null) {
      setCalendar(null);
      setStatus('no-city');
      setError(null);
      return;
    }

    let cancelled = false;
    const cached = loadCalendar();
    const usable = cached && cached.cityId === cityId && cached.timezone === timezone ? cached : null;

    if (usable) {
      setCalendar(usable);
      setStatus('ready');
      setError(null);
      if (futureDayCount(usable, today) >= TOP_UP_BELOW_DAYS) return;
    } else {
      setCalendar(null);
      setStatus('loading');
      setError(null);
    }

    fetchCalendar(cityId, timezone, today, usable)
      .then((fresh) => {
        if (cancelled) return;
        saveCalendar(fresh);
        setCalendar(fresh);
        setStatus('ready');
        setError(null);
      })
      .catch((failure: Error) => {
        if (cancelled || usable) return;
        setStatus('error');
        setError(failure.message);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, cityId, timezone, today, attempt]);

  return { calendar, status, error, reload };
}
