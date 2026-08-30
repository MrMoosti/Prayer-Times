'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playAdhan } from './adhan';
import { PRAYER_LABELS, type PrayerKey, type Settings } from './types';
import type { Schedule } from './prayer';

const LAST_KEY = 'mektep-prayer.lastAnnounced';
/** How late an announcement may still fire, e.g. after the tab was asleep. */
const GRACE_MS = 90_000;
const OVERLAY_MS = 20_000;

export interface Announcement {
  key: PrayerKey;
  at: number;
}

function readLastAnnounced(): number {
  try {
    return Number(window.localStorage.getItem(LAST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeLastAnnounced(at: number): void {
  try {
    window.localStorage.setItem(LAST_KEY, String(at));
  } catch {
    /* nothing to do */
  }
}

/**
 * Fires once when a prayer time is reached. The per-prayer offset is already
 * baked into `schedule`, so a positive offset delays the announcement with the
 * time - which is what the offset control is for.
 */
export function useAnnouncer(
  schedule: Schedule | null,
  settings: Settings,
  now: number,
): { announcement: Announcement | null; dismiss: () => void; announce: (key: PrayerKey) => void } {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    lastRef.current = readLastAnnounced();
  }, []);

  const fire = useCallback(
    (key: PrayerKey, at: number) => {
      setAnnouncement({ key, at });
      void playAdhan(key);

      if (settings.notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(`${PRAYER_LABELS[key].name} — ${settings.location.name}`, {
            body: `It is time for ${PRAYER_LABELS[key].name}.`,
            tag: `prayer-${key}-${at}`,
            silent: true,
          });
        } catch {
          // Some platforms disallow constructing notifications outside a worker.
        }
      }
    },
    [settings.notificationsEnabled, settings.location.name],
  );

  useEffect(() => {
    if (!schedule) return;
    for (const entry of schedule.entries) {
      if (entry.key === 'sunrise') continue;
      if (!settings.adhanEnabled[entry.key]) continue;
      const due = entry.at <= now && now - entry.at < GRACE_MS;
      if (due && entry.at > lastRef.current) {
        lastRef.current = entry.at;
        writeLastAnnounced(entry.at);
        fire(entry.key, entry.at);
        break;
      }
    }
  }, [schedule, now, settings.adhanEnabled, fire]);

  useEffect(() => {
    if (!announcement) return;
    const timer = setTimeout(() => setAnnouncement(null), OVERLAY_MS);
    return () => clearTimeout(timer);
  }, [announcement]);

  const dismiss = useCallback(() => setAnnouncement(null), []);
  const announce = useCallback((key: PrayerKey) => fire(key, Date.now()), [fire]);

  return { announcement, dismiss, announce };
}
