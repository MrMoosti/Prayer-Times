'use client';

import { ClockIcon, PrayerGlyph } from './icons';
import { prayerLabels, strings } from '@/lib/i18n';
import { formatClock } from '@/lib/time';
import type { Settings } from '@/lib/types';
import type { Schedule } from '@/lib/prayer';

interface Props {
  schedule: Schedule | null;
  settings: Settings;
  loading: boolean;
}

export default function PrayerTimesCard({ schedule, settings, loading }: Props) {
  const t = strings(settings.language);
  const labels = prayerLabels(settings.language);
  const activeKey = schedule?.entries.filter((e) => e.passed).at(-1)?.key;

  return (
    <section className="clay card">
      <div className="card__head">
        <h2 className="card__title">{t.todaysPrayerTimes}</h2>
        <span className="card__action" aria-hidden="true">
          <ClockIcon width={26} height={26} />
        </span>
      </div>

      <div className="rows">
        {loading || !schedule
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" />)
          : schedule.entries.map((entry) => (
              <div
                key={entry.key}
                className="row"
                data-current={entry.key === activeKey}
                data-passed={entry.passed}
              >
                <span className="clay-badge row__icon">
                  <PrayerGlyph prayer={entry.key} width={29} height={29} />
                </span>
                <span className="row__name">{labels[entry.key].name}</span>
                <span className="row__time">
                  {formatClock(entry.at, settings.location.timezone, settings.clock24h)}
                </span>
              </div>
            ))}
      </div>
    </section>
  );
}
