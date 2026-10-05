'use client';

import { useEffect, useState } from 'react';
import type { Settings, WeatherNow } from './types';

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
