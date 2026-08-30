'use client';

import { PrayerGlyph } from './icons';
import { prayerLabels, strings } from '@/lib/i18n';
import { formatClock } from '@/lib/time';
import type { Settings } from '@/lib/types';
import type { Announcement } from '@/lib/useAnnouncer';

interface Props {
  announcement: Announcement;
  settings: Settings;
  onDismiss: () => void;
}

export default function AnnouncementOverlay({ announcement, settings, onDismiss }: Props) {
  const t = strings(settings.language);
  const label = prayerLabels(settings.language)[announcement.key];
  return (
    <div
      className="announce"
      role="alertdialog"
      aria-live="assertive"
      aria-label={t.hasBegun(label.name)}
    >
      <div className="clay clay-deep announce__card">
        <span className="clay-badge announce__icon">
          <PrayerGlyph prayer={announcement.key} width={78} height={78} />
        </span>
        <h2 className="announce__name">{label.name}</h2>
        <p className="announce__sub">
          {label.subtitle} ·{' '}
          {formatClock(announcement.at, settings.location.timezone, settings.clock24h)}
        </p>
        <button type="button" className="announce__dismiss" onClick={onDismiss}>
          {t.dismiss}
        </button>
      </div>
    </div>
  );
}
