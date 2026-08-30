'use client';

import { useEffect, useRef, useState } from 'react';
import DiyanetPicker from './DiyanetPicker';
import { CloseIcon, PrayerGlyph } from './icons';
import { LANGUAGES, LANGUAGE_LABELS, prayerLabels, strings, type Language } from '@/lib/i18n';
import { CALCULATION_METHODS, HIGH_LATITUDE_LABELS } from '@/lib/settings';
import {
  PRAYABLE_KEYS,
  PRAYER_KEYS,
  type LocationSetting,
  type PrayerKey,
  type Settings,
  type YearlyCalendar,
} from '@/lib/types';
import type { HighLatitudeRule } from '@/lib/solar';

interface Props {
  settings: Settings;
  calendar: YearlyCalendar | null;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onClose: () => void;
}

function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button type="button" className="switch" aria-pressed={checked} onClick={() => onChange(!checked)}>
      <span>
        {label}
        {hint && <span className="field__hint" style={{ display: 'block' }}>{hint}</span>}
      </span>
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
    </button>
  );
}

export default function SettingsPanel({ settings, calendar, onChange, onReset, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSetting[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const t = strings(settings.language);
  const labels = prayerLabels(settings.language);

  // Focus the close button once, when the drawer opens — not on every render,
  // or it would steal focus back from the fields the moment you start typing.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Debounced city lookup; falls back to the bundled list when offline.
  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const body = (await res.json()) as { results: LocationSetting[] };
        if (!cancelled) setResults(body.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        onChange({
          location: {
            name: 'My location',
            country: `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
            latitude: Number(coords.latitude.toFixed(4)),
            longitude: Number(coords.longitude.toFixed(4)),
            timezone,
          },
        });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10_000 },
    );
  };

  const setOffset = (key: PrayerKey, delta: number) => {
    const next = Math.max(-60, Math.min(60, (settings.offsets[key] ?? 0) + delta));
    onChange({ offsets: { ...settings.offsets, [key]: next } });
  };

  const requestNotifications = async (enabled: boolean) => {
    if (!enabled) {
      onChange({ notificationsEnabled: false });
      return;
    }
    if (typeof Notification === 'undefined') return;
    const permission =
      Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    onChange({ notificationsEnabled: permission === 'granted' });
  };

  const source = !calendar
    ? t.timesSourceLoading
    : calendar.source === 'diyanet'
      ? `Diyanet · ${calendar.officialDays ?? 0} official days, rest calculated`
      : calendar.source === 'aladhan'
        ? `Aladhan · method ${calendar.method}`
        : 'Calculated locally (API unreachable)';

  return (
    <>
      <div className="drawer__scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={t.settings}>
        <div className="drawer__head">
          <h2 className="drawer__title">{t.settings}</h2>
          <button
            ref={closeRef}
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={t.closeSettings}
          >
            <CloseIcon width={26} height={26} />
          </button>
        </div>

        <div className="drawer__body">
          <div className="field">
            <label className="field__label" htmlFor="language">
              {t.language}
            </label>
            <p className="field__hint">{t.languageHint}</p>
            <div className="segmented">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  aria-pressed={settings.language === lang}
                  onClick={() => onChange({ language: lang as Language })}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="city">
              {t.location}
            </label>
            <p className="field__hint">
              {t.locationCurrently(
                `${settings.location.name}${
                  settings.location.country ? `, ${settings.location.country}` : ''
                }`,
                settings.location.timezone,
              )}
            </p>
            <input
              id="city"
              className="input"
              placeholder={t.searchCity}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <div className="results">
              {results.map((city) => {
                const selected =
                  city.latitude === settings.location.latitude &&
                  city.longitude === settings.location.longitude;
                return (
                  <button
                    key={`${city.name}-${city.latitude}-${city.longitude}`}
                    type="button"
                    className="results__item"
                    data-selected={selected}
                    onClick={() => onChange({ location: city })}
                  >
                    <span>{city.name}</span>
                    <span className="results__country">{city.country}</span>
                  </button>
                );
              })}
              {!results.length && !searching && <p className="field__hint">{t.noCitiesMatched}</p>}
            </div>
            <button type="button" className="button-ghost" onClick={useMyLocation} disabled={locating}>
              {locating ? t.locating : t.useMyLocation}
            </button>
          </div>

          <DiyanetPicker settings={settings} onChange={onChange} />

          <div className="field">
            <label className="field__label" htmlFor="method">
              {t.calculationMethod}
            </label>
            <p className="field__hint">{t.calculationMethodHint}</p>
            <select
              id="method"
              className="select"
              value={settings.method}
              onChange={(event) => onChange({ method: Number(event.target.value) })}
            >
              {CALCULATION_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="highlat">
              {t.highLatitudeRule}
            </label>
            <p className="field__hint">{t.highLatitudeRuleHint}</p>
            <select
              id="highlat"
              className="select"
              value={settings.highLatitudeRule}
              onChange={(event) =>
                onChange({ highLatitudeRule: event.target.value as HighLatitudeRule })
              }
            >
              {Object.entries(HIGH_LATITUDE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <span className="field__label">{t.timeOffsets}</span>
            <p className="field__hint">{t.timeOffsetsHint}</p>
            <div className="offsets">
              {PRAYER_KEYS.map((key) => (
                <div key={key} className="offset">
                  <span className="clay-badge" style={{ width: '3.6rem', height: '3.6rem' }}>
                    <PrayerGlyph prayer={key} width={20} height={20} />
                  </span>
                  <span className="offset__name">{labels[key].name}</span>
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() => setOffset(key, -1)}
                      aria-label={t.decreaseOffset(labels[key].name)}
                    >
                      −
                    </button>
                    <span className="stepper__value">
                      {settings.offsets[key] > 0 ? '+' : ''}
                      {settings.offsets[key]} {t.minAbbrev}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOffset(key, 1)}
                      aria-label={t.increaseOffset(labels[key].name)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">{t.announcements}</span>
            <p className="field__hint">{t.announcementsHint}</p>
            <Switch
              label={t.desktopNotifications}
              hint={t.desktopNotificationsHint}
              checked={settings.notificationsEnabled}
              onChange={requestNotifications}
            />
          </div>

          <div className="field">
            <span className="field__label">{t.announcedPrayers}</span>
            <p className="field__hint">{t.announcedPrayersHint}</p>
            <div className="offsets">
              {PRAYABLE_KEYS.map((key) => (
                <Switch
                  key={key}
                  label={labels[key].name}
                  checked={settings.adhanEnabled[key]}
                  onChange={(on) =>
                    onChange({ adhanEnabled: { ...settings.adhanEnabled, [key]: on } })
                  }
                />
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">{t.display}</span>
            <Switch
              label={t.clock24h}
              checked={settings.clock24h}
              onChange={(clock24h) => onChange({ clock24h })}
            />
            <Switch
              label={t.showWeather}
              hint={t.showWeatherHint}
              checked={settings.showWeather}
              onChange={(showWeather) => onChange({ showWeather })}
            />
            <Switch
              label={t.reduceMotion}
              hint={t.reduceMotionHint}
              checked={settings.reducedMotion}
              onChange={(reducedMotion) => onChange({ reducedMotion })}
            />
          </div>
        </div>

        <div className="drawer__footer">
          <span>
            {source}
            {calendar ? ` · ${t.daysCached(calendar.days.length)}` : ''}
            {calendar?.sourceNote ? ` · ${calendar.sourceNote}` : ''}
          </span>
          <button type="button" className="button-ghost" onClick={onReset}>
            {t.resetAll}
          </button>
        </div>
      </aside>
    </>
  );
}
