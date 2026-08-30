'use client';

import { PrayerGlyph } from './icons';
import { prayerLabels, strings } from '@/lib/i18n';
import { formatCountdown } from '@/lib/time';
import type { Settings } from '@/lib/types';
import type { Schedule } from '@/lib/prayer';

interface Props {
  schedule: Schedule | null;
  settings: Settings;
  now: number;
}

export default function CountdownCard({ schedule, settings, now }: Props) {
  const t = strings(settings.language);
  const labels = prayerLabels(settings.language);
  const next = schedule?.next;
  const nextAt = schedule?.nextAt ?? null;
  const countdown = formatCountdown(nextAt != null ? nextAt - now : 0);
  const label = next ? labels[next.key] : null;
  // Sunrise is on the list but it is not a prayer, so the eyebrow softens.
  // After Isha the next prayer is tomorrow's, and the card says so.
  const eyebrow = next?.tomorrow
    ? t.nextPrayerTomorrow
    : next?.key === 'sunrise'
      ? t.next
      : t.nextPrayer;

  return (
    <section className="clay clay-deep countdown">
      <img className="countdown__art countdown__arch" src="/scene/arch.webp" alt="" aria-hidden="true" />
      <img className="countdown__art countdown__plant" src="/scene/plant.webp" alt="" aria-hidden="true" />

      <div className="countdown__head">
        <div className="clay-badge countdown__icon">
          {next ? <PrayerGlyph prayer={next.key} width={78} height={78} /> : null}
        </div>
        <div>
          <p className="countdown__eyebrow">{eyebrow}</p>
          <h2 className="countdown__name">{label?.name ?? '—'}</h2>
          <p className="countdown__subtitle">{label?.subtitle ?? t.loadingTimes}</p>
        </div>
      </div>

      <div className="countdown__rule" />

      <p className="countdown__label">{t.nextPrayerIn}</p>
      <div className="countdown__value">{nextAt != null ? countdown.hhmm : '--:--'}</div>
    </section>
  );
}
