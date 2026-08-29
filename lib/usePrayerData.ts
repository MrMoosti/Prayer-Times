'use client';

import { useEffect, useState } from 'react';
import type { Settings, WeatherNow, YearlyCalendar } from './types';
import { isoDateIn } from './time';

export interface CalendarState {
  calendar: YearlyCalendar | null;
  loading: boolean;
  error: string | null;
}

function calendarUrl(settings: Settings, year: number): string {
  const { location } = settings;
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: location.timezone,
    method: String(settings.method),
    highLatitudeRule: settings.highLatitudeRule,
    year: String(year),
  });
  if (settings.diyanet) params.set('diyanetCityId', String(settings.diyanet.cityId));
  return `/api/prayer-times?${params}`;
}

/**
 * Fetches the whole year in one request and keeps it in memory. Near a year
 * boundary the following year is pulled in as well, so the countdown to the
 * first Fajr of January never goes blank. Nothing refetches until the location,
 * method or year actually changes.
 */
export function useCalendar(settings: Settings, enabled: boolean): CalendarState {
  const [state, setState] = useState<CalendarState>({
    calendar: null,
    loading: true,
    error: null,
  });

  const { location, method, highLatitudeRule, diyanet } = settings;
  const today = isoDateIn(Date.now(), location.timezone);
  const year = Number(today.slice(0, 4));
  const nearYearEnd = today.slice(5) >= '12-28';
  const nearYearStart = today.slice(5) <= '01-03';

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const years = [year];
    if (nearYearEnd) years.push(year + 1);
    if (nearYearStart) years.unshift(year - 1);

    Promise.all(
      years.map(async (y) => {
        const res = await fetch(calendarUrl(settings, y));
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Request failed (${res.status})`);
        }
        return (await res.json()) as YearlyCalendar;
      }),
    )
      .then((calendars) => {
        if (cancelled) return;
        const primary = calendars.find((c) => c.year === year) ?? calendars[0];
        const days = calendars.flatMap((c) => c.days).sort((a, b) => a.date.localeCompare(b.date));
        setState({ calendar: { ...primary, days }, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ calendar: null, loading: false, error: error.message });
      });

    return () => {
      cancelled = true;
    };
    // Deliberately keyed on the inputs that change the data, not the whole
    // settings object - offsets are applied client-side and must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    location.latitude,
    location.longitude,
    location.timezone,
    method,
    highLatitudeRule,
    diyanet?.cityId,
    year,
    nearYearEnd,
    nearYearStart,
  ]);

  return state;
}

const WEATHER_INTERVAL = 10 * 60_000;

export function useWeather(settings: Settings, enabled: boolean): WeatherNow | null {
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const { latitude, longitude } = settings.location;
  const on = enabled && settings.showWeather;

  useEffect(() => {
    if (!on) {
      setWeather(null);
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `/api/weather?latitude=${latitude}&longitude=${longitude}`,
        );
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as WeatherNow;
        if (!cancelled) setWeather(body);
      } catch {
        // Keep the last good reading; the scene simply stops updating.
      }
    };

    load();
    const timer = setInterval(load, WEATHER_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [on, latitude, longitude]);

  return weather;
}
