'use client';

import { useEffect, useRef, useState } from 'react';
import { CloseIcon, PrayerGlyph } from './icons';
import { CALCULATION_METHODS, HIGH_LATITUDE_LABELS } from '@/lib/settings';
import { PRAYER_KEYS, PRAYER_LABELS, type LocationSetting, type PrayerKey, type Settings, type YearlyCalendar } from '@/lib/types';
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

  useEffect(() => {
    closeRef.current?.focus();
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

  const source =
    calendar?.source === 'aladhan'
      ? `Aladhan · method ${calendar.method}`
      : calendar
        ? 'Calculated locally (API unreachable)'
        : 'Loading';

  return (
    <>
      <div className="drawer__scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="drawer__head">
          <h2 className="drawer__title">Settings</h2>
          <button
            ref={closeRef}
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <CloseIcon width={26} height={26} />
          </button>
        </div>

        <div className="drawer__body">
          <div className="field">
            <label className="field__label" htmlFor="city">
              Location
            </label>
            <p className="field__hint">
              Used for prayer times, the weather and the position of the sun and moon. Currently{' '}
              <strong>
                {settings.location.name}
                {settings.location.country ? `, ${settings.location.country}` : ''}
              </strong>{' '}
              ({settings.location.timezone}).
            </p>
            <input
              id="city"
              className="input"
              placeholder="Search for a city…"
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
              {!results.length && !searching && <p className="field__hint">No cities matched.</p>}
            </div>
            <button type="button" className="button-ghost" onClick={useMyLocation} disabled={locating}>
              {locating ? 'Locating…' : 'Use my current location'}
            </button>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="method">
              Calculation method
            </label>
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
              High latitude rule
            </label>
            <p className="field__hint">
              Above about 48° the sun never dips far enough below the horizon in summer for Fajr and
              Isha to have an astronomical time. This decides what is shown instead.
            </p>
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
            <span className="field__label">Time offsets</span>
            <p className="field__hint">
              Minutes added to each time. This shifts the displayed time and delays the announcement
              with it — set +5 on Dhuhr to call it five minutes after the calculated time.
            </p>
            <div className="offsets">
              {PRAYER_KEYS.map((key) => (
                <div key={key} className="offset">
                  <span className="clay-badge" style={{ width: '3.6rem', height: '3.6rem' }}>
                    <PrayerGlyph prayer={key} width={20} height={20} />
                  </span>
                  <span className="offset__name">{PRAYER_LABELS[key].name}</span>
                  <div className="stepper">
                    <button type="button" onClick={() => setOffset(key, -1)} aria-label={`Decrease ${PRAYER_LABELS[key].name} offset`}>
                      −
                    </button>
                    <span className="stepper__value">
                      {settings.offsets[key] > 0 ? '+' : ''}
                      {settings.offsets[key]} min
                    </span>
                    <button type="button" onClick={() => setOffset(key, 1)} aria-label={`Increase ${PRAYER_LABELS[key].name} offset`}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Announcements</span>
            <p className="field__hint">
              A call tone plays on this device when a prayer time arrives. Tap the speaker on any
              prayer row to turn its call on or off; shift-click it to hear the tone now.
            </p>
            <Switch
              label="Desktop notifications"
              hint="Shows a system notification alongside the tone."
              checked={settings.notificationsEnabled}
              onChange={requestNotifications}
            />
          </div>

          <div className="field">
            <span className="field__label">Appearance</span>
            <div className="segmented">
              {(['auto', 'day', 'night'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  aria-pressed={settings.theme === theme}
                  onClick={() => onChange({ theme })}
                >
                  {theme === 'auto' ? 'Follow the sun' : theme === 'day' ? 'Day' : 'Night'}
                </button>
              ))}
            </div>
            <Switch
              label="24-hour clock"
              checked={settings.clock24h}
              onChange={(clock24h) => onChange({ clock24h })}
            />
            <Switch
              label="Show weather"
              hint="Also drives the rain, snow and cloud effects in the scene."
              checked={settings.showWeather}
              onChange={(showWeather) => onChange({ showWeather })}
            />
            <Switch
              label="Reduce motion"
              hint="Stops the drifting clouds and the spinning sun."
              checked={settings.reducedMotion}
              onChange={(reducedMotion) => onChange({ reducedMotion })}
            />
          </div>
        </div>

        <div className="drawer__footer">
          <span>
            Times: {source}
            {calendar ? ` · ${calendar.days.length} days cached` : ''}
          </span>
          <button type="button" className="button-ghost" onClick={onReset}>
            Reset all
          </button>
        </div>
      </aside>
    </>
  );
}
