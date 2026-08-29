'use client';

import { BellIcon, ChevronRight, PrayerGlyph } from './icons';
import { formatClock, formatCountdown } from '@/lib/time';
import { PRAYER_LABELS, type Settings } from '@/lib/types';
import type { Schedule } from '@/lib/prayer';

interface Props {
  schedule: Schedule | null;
  settings: Settings;
  now: number;
  audioArmed: boolean;
  onArmAudio: () => void;
}

export default function CountdownCard({ schedule, settings, now, audioArmed, onArmAudio }: Props) {
  const current = schedule?.current;
  const nextAt = schedule?.nextAt ?? null;
  const nextKey = schedule?.next?.key;
  const countdown = formatCountdown(nextAt != null ? nextAt - now : 0);
  const label = current ? PRAYER_LABELS[current.key] : null;

  return (
    <section className="clay clay-deep countdown">
      <img className="countdown__art countdown__arch" src="/scene/arch.webp" alt="" aria-hidden="true" />
      <img className="countdown__art countdown__plant" src="/scene/plant.webp" alt="" aria-hidden="true" />

      <div className="countdown__head">
        <div className="clay-badge countdown__icon">
          {current ? <PrayerGlyph prayer={current.key} width={48} height={48} /> : null}
        </div>
        <div>
          <p className="countdown__eyebrow">Current prayer</p>
          <h2 className="countdown__name">{label?.name ?? '—'}</h2>
          <p className="countdown__subtitle">{label?.subtitle ?? 'Loading times'}</p>
        </div>
      </div>

      <div className="countdown__rule" />

      <p className="countdown__label">
        {nextKey ? `Next — ${PRAYER_LABELS[nextKey].name} in` : 'Next prayer in'}
      </p>
      <div className="countdown__value">
        <span>{nextAt != null ? countdown.hhmm : '--:--'}</span>
        <span className="countdown__seconds">{nextAt != null ? countdown.seconds : '--'}</span>
      </div>
      {nextAt != null && (
        <p className="countdown__target">
          at {formatClock(nextAt, settings.location.timezone, settings.clock24h)}
        </p>
      )}

      <button
        type="button"
        className="countdown__cta"
        onClick={onArmAudio}
        data-active={audioArmed}
      >
        <BellIcon width={26} height={26} aria-hidden="true" />
        <span>{audioArmed ? 'Prayer announcements on' : 'Enable prayer notifications'}</span>
        <ChevronRight className="countdown__cta-arrow" width={24} height={24} aria-hidden="true" />
      </button>
    </section>
  );
}
