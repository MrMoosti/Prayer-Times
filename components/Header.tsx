'use client';

import { CalendarIcon, GearIcon, MapPin, WeatherGlyph } from './icons';
import { formatHijri, formatLongDate } from '@/lib/time';
import { sunPosition } from '@/lib/solar';
import { describeWeather } from '@/lib/weather';
import type { Settings, WeatherNow } from '@/lib/types';

interface Props {
  settings: Settings;
  weather: WeatherNow | null;
  now: number;
  onOpenSettings: () => void;
}

export default function Header({ settings, weather, now, onOpenSettings }: Props) {
  const tz = settings.location.timezone;
  const { latitude, longitude } = settings.location;
  const isNight = sunPosition(new Date(now), latitude, longitude).altitude * (180 / Math.PI) < -6;
  const conditions = weather ? describeWeather(weather.code, weather.cloudCover, isNight) : null;
  const hijri = formatHijri(now, tz);

  return (
    <header className="header">
      <div>
        <div className="brand">
          <div className="brand__mark" aria-hidden="true">
            m<span>.</span>
          </div>
          <h1 className="brand__name">
            Mektep <em>Prayer</em>
          </h1>
        </div>

        <div className="meta">
          <div className="meta__item">
            <MapPin width={26} height={26} aria-hidden="true" />
            <div>
              <div className="meta__label">{settings.location.name}</div>
              <div className="meta__value">{settings.location.country}</div>
            </div>
          </div>
          <div className="meta__item">
            <CalendarIcon width={26} height={26} aria-hidden="true" />
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
      </div>

      <div className="header__actions">
        {conditions && weather && (
          <div className="weather" title={`${conditions.label} — feels like ${Math.round(weather.apparentTemperature)}°`}>
            <WeatherGlyph name={conditions.glyph} width={38} height={38} aria-hidden="true" />
            <div>
              <div className="weather__temp">{Math.round(weather.temperature)}°C</div>
              <div className="weather__label">{conditions.label}</div>
            </div>
          </div>
        )}
        <button
          type="button"
          className="icon-button"
          onClick={onOpenSettings}
          aria-label="Open settings"
        >
          <GearIcon width={28} height={28} />
        </button>
      </div>
    </header>
  );
}
