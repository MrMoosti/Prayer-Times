'use client';

import { CalendarIcon, GearIcon, MapPin, MoonGlyph, SunGlyph, WeatherGlyph } from './icons';
import { formatHijri, formatLongDate } from '@/lib/time';
import { describeWeather } from '@/lib/weather';
import type { Settings, WeatherNow } from '@/lib/types';

interface Props {
  settings: Settings;
  weather: WeatherNow | null;
  now: number;
  /** The mode actually in effect, whether from the clock or an override. */
  dark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export default function Header({
  settings,
  weather,
  now,
  dark,
  onToggleTheme,
  onOpenSettings,
}: Props) {
  const tz = settings.location.timezone;
  const conditions = weather ? describeWeather(weather.code, weather.cloudCover, dark) : null;
  const hijri = formatHijri(now, tz);

  return (
    <header className="header">
      <div className="meta">
        <div className="meta__item">
          <MapPin width={30} height={30} aria-hidden="true" />
          <div>
            <div className="meta__label">{settings.location.name}</div>
            <div className="meta__value">{settings.location.country}</div>
          </div>
        </div>
        <div className="meta__item">
          <CalendarIcon width={30} height={30} aria-hidden="true" />
          <div>
            <div className="meta__label">Today</div>
            <div className="meta__value">{formatLongDate(now, tz)}</div>
          </div>
        </div>
        {hijri && (
          <div className="meta__item">
            <div>
              <div className="meta__label">Hijri</div>
              <div className="meta__value">{hijri}</div>
            </div>
          </div>
        )}
      </div>

      <div className="header__actions">
        {conditions && weather && (
          <div
            className="weather"
            title={`${conditions.label} — feels like ${Math.round(weather.apparentTemperature)}°`}
          >
            <WeatherGlyph name={conditions.glyph} width={40} height={40} aria-hidden="true" />
            <div>
              <div className="weather__temp">{Math.round(weather.temperature)}°C</div>
              <div className="weather__label">{conditions.label}</div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="icon-button"
          onClick={onToggleTheme}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={
            settings.theme === 'auto'
              ? 'Following the sun — dark after Maghrib'
              : `Locked to ${settings.theme} mode`
          }
          data-overridden={settings.theme !== 'auto'}
        >
          {dark ? <MoonGlyph width={28} height={28} /> : <SunGlyph width={28} height={28} />}
        </button>

        <button
          type="button"
          className="icon-button icon-button--gear"
          onClick={onOpenSettings}
          aria-label="Open settings"
        >
          <GearIcon width={28} height={28} />
        </button>
      </div>
    </header>
  );
}
