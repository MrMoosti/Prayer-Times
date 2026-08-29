'use client';

import { useCallback, useMemo, useState } from 'react';
import AnnouncementOverlay from './AnnouncementOverlay';
import CountdownCard from './CountdownCard';
import Header from './Header';
import PrayerTimesCard from './PrayerTimesCard';
import SceneBackground from './scene/SceneBackground';
import SettingsPanel from './SettingsPanel';
import VerseCard from './VerseCard';
import { playChime, unlockAudio } from '@/lib/adhan';
import { buildSchedule, type Schedule } from '@/lib/prayer';
import { isoDateIn } from '@/lib/time';
import type { PrayerKey, Settings } from '@/lib/types';
import { useAnnouncer } from '@/lib/useAnnouncer';
import { useNow } from '@/lib/useNow';
import { useCalendar, useWeather } from '@/lib/usePrayerData';
import { useSettings } from '@/lib/useSettings';

function BootShell() {
  return (
    <div className="app">
      <header className="header" />
      <main className="app__main" aria-busy="true">
        <div className="clay clay-deep countdown" />
        <div className="app__column">
          <div className="clay card">
            <div className="rows">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="skeleton" />
              ))}
            </div>
          </div>
          <div className="clay clay-deep verse" />
        </div>
      </main>
    </div>
  );
}

/**
 * Dark from Maghrib until sunrise. The switch is deliberately tied to the
 * prayer times rather than to the sun's altitude: Maghrib is the moment the
 * day is over for the people reading this screen.
 */
function isDarkNow(schedule: Schedule | null, settings: Settings, now: number): boolean {
  if (settings.theme === 'light') return false;
  if (settings.theme === 'dark') return true;
  if (!schedule) return false;

  const at = (key: PrayerKey) => schedule.entries.find((e) => e.key === key)?.at;
  const maghrib = at('maghrib');
  const sunrise = at('sunrise');
  if (maghrib == null || sunrise == null) return false;
  return now >= maghrib || now < sunrise;
}

export default function Dashboard() {
  const { settings, ready, update, reset } = useSettings();
  const now = useNow(1000);
  // The sky only needs repainting once a minute; the countdown ticks per second.
  const minuteNow = useNow(60_000);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioArmed, setAudioArmed] = useState(false);

  const { calendar, loading, error } = useCalendar(settings, ready);
  const weather = useWeather(settings, ready);

  const schedule = useMemo(
    () => (calendar ? buildSchedule(calendar, settings, now) : null),
    [calendar, settings, now],
  );

  const dark = useMemo(() => isDarkNow(schedule, settings, now), [schedule, settings, now]);

  const { announcement, dismiss, announce } = useAnnouncer(schedule, settings, now);

  const armAudio = useCallback(async () => {
    const ok = await unlockAudio();
    setAudioArmed(ok);
    if (ok) {
      // Play a short confirmation so it is obvious the sound works.
      playChime('dhuhr', 0.32);
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        update({ notificationsEnabled: permission === 'granted' });
      }
    }
  }, [update]);

  const toggleAdhan = useCallback(
    (key: PrayerKey) => {
      update({
        adhanEnabled: { ...settings.adhanEnabled, [key]: !settings.adhanEnabled[key] },
      });
    },
    [settings.adhanEnabled, update],
  );

  const previewAdhan = useCallback(
    async (key: PrayerKey) => {
      await unlockAudio();
      setAudioArmed(true);
      announce(key);
    },
    [announce],
  );

  // Tapping the toggle pins the opposite mode; 'auto' is restored in settings.
  const toggleTheme = useCallback(() => {
    update({ theme: dark ? 'light' : 'dark' });
  }, [dark, update]);

  const isoDate = isoDateIn(now || Date.now(), settings.location.timezone);

  // Nothing time-dependent may reach the server-rendered HTML, so the first
  // paint is a static shell and the live dashboard replaces it on mount.
  if (!now) return <BootShell />;

  return (
    <>
      <SceneBackground
        settings={settings}
        weather={weather}
        minuteNow={minuteNow}
        dark={dark}
      />

      <div className="app">
        <Header
          settings={settings}
          weather={weather}
          now={now}
          dark={dark}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="app__main">
          <CountdownCard
            schedule={schedule}
            now={now}
            audioArmed={audioArmed}
            onArmAudio={armAudio}
          />
          <div className="app__column">
            <PrayerTimesCard
              schedule={schedule}
              settings={settings}
              loading={loading || !ready}
              onToggleAdhan={toggleAdhan}
              onPreviewAdhan={previewAdhan}
            />
            <VerseCard isoDate={isoDate} />
          </div>
        </main>

        {error && <p className="notice">Prayer times unavailable: {error}</p>}
        {!error && calendar?.source === 'calculated' && (
          <p className="notice">
            {settings.diyanet
              ? `Diyanet unavailable — times calculated locally for ${settings.diyanet.cityName}.`
              : `Offline — times calculated locally for ${settings.location.name}.`}
          </p>
        )}
      </div>

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          calendar={calendar}
          onChange={update}
          onReset={reset}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {announcement && (
        <AnnouncementOverlay announcement={announcement} settings={settings} onDismiss={dismiss} />
      )}
    </>
  );
}
