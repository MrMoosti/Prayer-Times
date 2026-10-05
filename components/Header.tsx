'use client';

import { CalendarIcon, GearIcon, MapPin, WeatherGlyph } from './icons';
import { strings, weatherLabel } from '@/lib/i18n';
import { formatHijri, formatLongDate } from '@/lib/time';
import { describeWeather } from '@/lib/weather';
import type { Settings, WeatherNow } from '@/lib/types';

interface Props {
  settings: Settings;
  weather: WeatherNow | null;
  now: number;
  /** The mode actually in effect, decided from the prayer times. */
  dark: boolean;
  onOpenSettings: () => void;
}

export default function Header({ settings, weather, now, dark, onOpenSettings }: Props) {
  const tz = settings.location.timezone;
  const t = strings(settings.language);
  const conditions = weather ? describeWeather(weather.code, weather.cloudCover, dark) : null;
  const hijri = formatHijri(now, tz);

  return (
    <header className="header">
      <div className="meta">
        {settings.location.cityId != null && (
          <div className="meta__item">
            <MapPin width={30} height={30} aria-hidden="true" />
            <div>
              <div className="meta__label">{settings.location.name}</div>
              <div className="meta__value">{settings.location.country}</div>
            </div>
          </div>
        )}
        <div className="meta__item">
          <CalendarIcon width={30} height={30} aria-hidden="true" />
          <div>
            <div className="meta__label">{t.today}</div>
            <div className="meta__value">{formatLongDate(now, tz)}</div>
          </div>
        </div>
        {hijri && (
          <div className="meta__item">
            <div>
              <div className="meta__label">{t.hijri}</div>
              <div className="meta__value">{hijri}</div>
            </div>
          </div>
        )}
      </div>

      <div className="header__actions">
        {conditions && weather && (
          <div
            className="weather"
            title={`${weatherLabel(conditions.label, settings.language)} — ${t.feelsLike(
              Math.round(weather.apparentTemperature),
            )}`}
          >
            <WeatherGlyph name={conditions.glyph} width={40} height={40} aria-hidden="true" />
            <div>
              <div className="weather__temp">{Math.round(weather.temperature)}°C</div>
              <div className="weather__label">{weatherLabel(conditions.label, settings.language)}</div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="icon-button icon-button--gear"
          onClick={onOpenSettings}
          aria-label={t.settings}
        >
          <GearIcon width={28} height={28} />
        </button>
      </div>
    </header>
  );
}
