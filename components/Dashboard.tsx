'use client';

import { useCallback, useMemo, useState } from 'react';
import AnnouncementOverlay from './AnnouncementOverlay';
import BottomNav, { type NavId } from './BottomNav';
import CountdownCard from './CountdownCard';
import Header from './Header';
import KerahatCard from './KerahatCard';
import PlaceholderCard from './PlaceholderCard';
import PrayerTimesCard from './PrayerTimesCard';
import SceneBackground from './scene/SceneBackground';
import SettingsPanel from './SettingsPanel';
import VerseCard from './VerseCard';
import { playChime, unlockAudio } from '@/lib/adhan';
import { buildSchedule } from '@/lib/prayer';
import { isoDateIn } from '@/lib/time';
import type { PrayerKey } from '@/lib/types';
import { useAnnouncer } from '@/lib/useAnnouncer';
import { useNow } from '@/lib/useNow';
import { useCalendar, useWeather } from '@/lib/usePrayerData';
import { useSettings } from '@/lib/useSettings';

function BootShell() {
  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand__mark" aria-hidden="true">
            m<span>.</span>
          </div>
          <h1 className="brand__name">
            Mektep <em>Prayer</em>
          </h1>
        </div>
      </header>
      <main className="app__main" aria-busy="true">
        <div className="app__column">
          <div className="clay clay-deep countdown" />
        </div>
        <div className="app__column">
          <div className="clay card">
            <div className="rows">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="skeleton" />
              ))}
            </div>
          </div>
        </div>
        <div className="app__column">
          <div className="clay card kerahat" style={{ minHeight: '24rem' }} />
          <div className="clay clay-deep verse" />
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  const { settings, ready, update, reset } = useSettings();
  const now = useNow(1000);
  // The sky only needs repainting once a minute; the countdown ticks per second.
  const minuteNow = useNow(60_000);

  const [nav, setNav] = useState<NavId>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioArmed, setAudioArmed] = useState(false);

  const { calendar, loading, error } = useCalendar(settings, ready);
  const weather = useWeather(settings, ready);

  const schedule = useMemo(
    () => (calendar ? buildSchedule(calendar, settings, now) : null),
    [calendar, settings, now],
  );

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

  const isoDate = isoDateIn(now || Date.now(), settings.location.timezone);

  // Nothing time-dependent may reach the server-rendered HTML, so the first
  // paint is a static shell and the live dashboard replaces it on mount.
  if (!now) return <BootShell />;

  return (
    <>
      <SceneBackground settings={settings} weather={weather} minuteNow={minuteNow} />

      <div className="app">
        <Header
          settings={settings}
          weather={weather}
          now={now}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="app__main">
          {nav === 'home' ? (
            <>
              <div className="app__column">
                <CountdownCard
                  schedule={schedule}
                  settings={settings}
                  now={now}
                  audioArmed={audioArmed}
                  onArmAudio={armAudio}
                />
              </div>
              <div className="app__column">
                <PrayerTimesCard
                  schedule={schedule}
                  settings={settings}
                  loading={loading || !ready}
                  onToggleAdhan={toggleAdhan}
                  onPreviewAdhan={previewAdhan}
                />
              </div>
              <div className="app__column">
                <KerahatCard schedule={schedule} settings={settings} now={now} />
                <VerseCard isoDate={isoDate} />
              </div>
            </>
          ) : (
            <div className="app__column" style={{ gridColumn: '1 / -1' }}>
              <PlaceholderCard section={nav} />
            </div>
          )}
        </main>

        <BottomNav active={nav} onSelect={setNav} />

        {error && <p className="notice">Prayer times unavailable: {error}</p>}
        {!error && calendar?.source === 'calculated' && (
          <p className="notice">
            Offline — times calculated locally for {settings.location.name}.
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
