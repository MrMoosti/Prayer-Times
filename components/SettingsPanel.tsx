'use client';

import { useEffect, useRef } from 'react';
import LocationPicker from './LocationPicker';
import { CloseIcon, PrayerGlyph } from './icons';
import { LANGUAGES, LANGUAGE_LABELS, prayerLabels, strings, type Language } from '@/lib/i18n';
import {
  PRAYABLE_KEYS,
  PRAYER_KEYS,
  type PrayerKey,
  type Settings,
} from '@/lib/types';

interface Props {
  settings: Settings;
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

export default function SettingsPanel({ settings, onChange, onReset, onClose }: Props) {
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

          <LocationPicker settings={settings} onChange={onChange} />

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
          <button type="button" className="button-ghost" onClick={onReset}>
            {t.resetAll}
          </button>
        </div>
      </aside>
    </>
  );
}
