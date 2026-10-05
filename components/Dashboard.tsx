'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AnnouncementOverlay from './AnnouncementOverlay';
import CountdownCard from './CountdownCard';
import Header from './Header';
import PrayerTimesCard from './PrayerTimesCard';
import SceneBackground from './scene/SceneBackground';
import SettingsPanel from './SettingsPanel';
import DailyContentCard, { contentSections } from './DailyContentCard';
import StatusDialog from './StatusDialog';
import { unlockAudio } from '@/lib/adhan';
import { buildSchedule, type Schedule } from '@/lib/prayer';
import type { PrayerKey, Settings } from '@/lib/types';
import { useAnnouncer } from '@/lib/useAnnouncer';
import { useNow } from '@/lib/useNow';
import { useCalendar } from '@/lib/useCalendar';
import { useDailyContent } from '@/lib/useDailyContent';
import { useWeather } from '@/lib/usePrayerData';
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
function isDarkNow(schedule: Schedule | null, now: number): boolean {
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
  const [cityPrompted, setCityPrompted] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const { calendar, status, error, reload } = useCalendar(settings, ready);
  const dailyContent = useDailyContent(settings, ready);
  const hasContent = contentSections(dailyContent).length > 0;

  useEffect(() => {
    if (status === 'no-city' && !cityPrompted) {
      setSettingsOpen(true);
      setCityPrompted(true);
    }
  }, [status, cityPrompted]);
  const weather = useWeather(settings, ready);

  const schedule = useMemo(
    () => (calendar ? buildSchedule(calendar, settings, now) : null),
    [calendar, settings, now],
  );

  const dark = useMemo(() => isDarkNow(schedule, now), [schedule, now]);

  const { announcement, dismiss } = useAnnouncer(schedule, settings, now);

  // The sound-arming buttons are gone, so unlock the audio context on the first
  // interaction of any kind — enough of a user gesture for the announcement
  // tone to play later without another prompt.
  useEffect(() => {
    const arm = () => {
      void unlockAudio();
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, []);

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
          onOpenSettings={openSettings}
        />

        <main className="app__main">
          <CountdownCard schedule={schedule} settings={settings} now={now} />
          <div className="app__column" data-solo={!hasContent}>
            <PrayerTimesCard
              schedule={schedule}
              settings={settings}
              loading={!ready || status === 'loading'}
            />
            {dailyContent && hasContent && (
              <DailyContentCard content={dailyContent} settings={settings} />
            )}
          </div>
        </main>
      </div>

      {status === 'error' && !settingsOpen && (
        <StatusDialog settings={settings} reason={error} onReload={reload} />
      )}

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={update}
          onReset={reset}
          onClose={closeSettings}
        />
      )}

      {announcement && (
        <AnnouncementOverlay announcement={announcement} settings={settings} onDismiss={dismiss} />
      )}
    </>
  );
}
