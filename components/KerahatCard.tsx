'use client';

import { useState } from 'react';
import { ClockIcon, InfoIcon } from './icons';
import { formatClock } from '@/lib/time';
import { activeKerahat, KERAHAT_MINUTES } from '@/lib/prayer';
import type { Settings } from '@/lib/types';
import type { Schedule } from '@/lib/prayer';

interface Props {
  schedule: Schedule | null;
  settings: Settings;
  now: number;
}

export default function KerahatCard({ schedule, settings, now }: Props) {
  const [explained, setExplained] = useState(false);
  const windows = schedule?.kerahat ?? [];
  const active = activeKerahat(windows, now);
  const tz = settings.location.timezone;

  return (
    <section className="clay card kerahat">
      <div className="card__head">
        <h2 className="card__title">Kerahat Times</h2>
        <button
          type="button"
          className="card__action"
          onClick={() => setExplained((v) => !v)}
          aria-expanded={explained}
          aria-label="What are kerahat times?"
        >
          <InfoIcon width={22} height={22} />
        </button>
      </div>

      {explained && (
        <p style={{ margin: '0 0.6rem 1.4rem', fontSize: '1.6rem', opacity: 0.72, lineHeight: 1.45 }}>
          The three periods in which voluntary prayer is discouraged, each {KERAHAT_MINUTES} minutes
          long: as the sun rises, as it stands at its zenith, and as it sets.
        </p>
      )}

      <div className="rows">
        {windows.map((window) => (
          <div
            key={window.key}
            className="row"
            data-active={active?.key === window.key}
            title={window.description}
          >
            <span className="clay-badge row__icon">
              <ClockIcon width={20} height={20} />
            </span>
            <span className="kerahat__label kerahat__name">{window.label}</span>
            <span className="kerahat__range">
              {formatClock(window.start, tz, settings.clock24h)} –{' '}
              {formatClock(window.end, tz, settings.clock24h)}
            </span>
          </div>
        ))}
        {!windows.length && <div className="skeleton" style={{ minHeight: '6rem' }} />}
      </div>
    </section>
  );
}
