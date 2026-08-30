'use client';

import { PrayerGlyph } from './icons';
import { formatClock } from '@/lib/time';
import { PRAYER_LABELS, type Settings } from '@/lib/types';
import type { Announcement } from '@/lib/useAnnouncer';

interface Props {
  announcement: Announcement;
  settings: Settings;
  onDismiss: () => void;
}

export default function AnnouncementOverlay({ announcement, settings, onDismiss }: Props) {
  const label = PRAYER_LABELS[announcement.key];
  return (
    <div className="announce" role="alertdialog" aria-live="assertive" aria-label={`${label.name} has begun`}>
      <div className="clay clay-deep announce__card">
        <span className="clay-badge announce__icon">
          <PrayerGlyph prayer={announcement.key} width={78} height={78} />
        </span>
        <h2 className="announce__name">{label.name}</h2>
        <p className="announce__sub">
          {label.subtitle} · {formatClock(announcement.at, settings.location.timezone, settings.clock24h)}
        </p>
        <button type="button" className="announce__dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
