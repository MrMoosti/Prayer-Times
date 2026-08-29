'use client';

import { ClockIcon, PrayerGlyph, SpeakerIcon } from './icons';
import { formatClock } from '@/lib/time';
import { PRAYER_LABELS, type PrayerKey, type Settings } from '@/lib/types';
import type { Schedule } from '@/lib/prayer';

interface Props {
  schedule: Schedule | null;
  settings: Settings;
  loading: boolean;
  onToggleAdhan: (key: PrayerKey) => void;
  onPreviewAdhan: (key: PrayerKey) => void;
}

export default function PrayerTimesCard({
  schedule,
  settings,
  loading,
  onToggleAdhan,
  onPreviewAdhan,
}: Props) {
  return (
    <section className="clay card">
      <div className="card__head">
        <h2 className="card__title">Today’s Prayer Times</h2>
        <span className="card__action" aria-hidden="true">
          <ClockIcon width={26} height={26} />
        </span>
      </div>

      <div className="rows">
        {loading || !schedule
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" />)
          : schedule.entries.map((entry) => {
              const announced = settings.adhanEnabled[entry.key];
              const isPrayer = entry.key !== 'sunrise';
              return (
                <div
                  key={entry.key}
                  className="row"
                  data-current={entry.next}
                  data-passed={entry.passed}
                >
                  <span className="clay-badge row__icon">
                    <PrayerGlyph prayer={entry.key} width={29} height={29} />
                  </span>
                  <span className="row__name">{PRAYER_LABELS[entry.key].name}</span>
                  <span className="row__time">
                    {formatClock(entry.at, settings.location.timezone, settings.clock24h)}
                  </span>
                  {isPrayer && (
                    <button
                      type="button"
                      className="row__speaker"
                      data-muted={!announced}
                      onClick={(event) => {
                        // Click toggles; shift-click plays the call now so the
                        // volume can be checked without waiting for the time.
                        if (event.shiftKey) onPreviewAdhan(entry.key);
                        else onToggleAdhan(entry.key);
                      }}
                      title={
                        announced
                          ? `${PRAYER_LABELS[entry.key].name} will be announced — shift-click to hear it now`
                          : `${PRAYER_LABELS[entry.key].name} announcement is off`
                      }
                      aria-label={`${announced ? 'Disable' : 'Enable'} the ${PRAYER_LABELS[entry.key].name} announcement`}
                      aria-pressed={announced}
                    >
                      <SpeakerIcon muted={!announced} width={26} height={26} />
                    </button>
                  )}
                </div>
              );
            })}
      </div>
    </section>
  );
}
