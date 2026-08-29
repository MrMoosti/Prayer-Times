'use client';

import { BellIcon, ChevronRight, PrayerGlyph } from './icons';
import { formatCountdown } from '@/lib/time';
import { PRAYER_LABELS } from '@/lib/types';
import type { Schedule } from '@/lib/prayer';

interface Props {
  schedule: Schedule | null;
  now: number;
  audioArmed: boolean;
  onArmAudio: () => void;
}

export default function CountdownCard({ schedule, now, audioArmed, onArmAudio }: Props) {
  const next = schedule?.next;
  const nextAt = schedule?.nextAt ?? null;
  const countdown = formatCountdown(nextAt != null ? nextAt - now : 0);
  const label = next ? PRAYER_LABELS[next.key] : null;
  // Sunrise is on the list but it is not a prayer, so the eyebrow softens.
  // After Isha the next prayer is tomorrow's, and the card says so.
  const eyebrow = next?.tomorrow
    ? 'Next prayer · tomorrow'
    : next?.key === 'sunrise'
      ? 'Next'
      : 'Next prayer';

  return (
    <section className="clay clay-deep countdown">
      <img className="countdown__art countdown__arch" src="/scene/arch.webp" alt="" aria-hidden="true" />
      <img className="countdown__art countdown__plant" src="/scene/plant.webp" alt="" aria-hidden="true" />

      <div className="countdown__head">
        <div className="clay-badge countdown__icon">
          {next ? <PrayerGlyph prayer={next.key} width={62} height={62} /> : null}
        </div>
        <div>
          <p className="countdown__eyebrow">{eyebrow}</p>
          <h2 className="countdown__name">{label?.name ?? '—'}</h2>
          <p className="countdown__subtitle">{label?.subtitle ?? 'Loading times'}</p>
        </div>
      </div>

      <div className="countdown__rule" />

      <p className="countdown__label">Next prayer in</p>
      <div className="countdown__value">{nextAt != null ? countdown.hhmm : '--:--'}</div>

      <button type="button" className="countdown__cta" onClick={onArmAudio} data-active={audioArmed}>
        <BellIcon width={28} height={28} aria-hidden="true" />
        <span>{audioArmed ? 'Prayer announcements on' : 'Enable prayer notifications'}</span>
        <ChevronRight className="countdown__cta-arrow" width={26} height={26} aria-hidden="true" />
      </button>
    </section>
  );
}
