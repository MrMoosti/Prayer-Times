'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookIcon } from './icons';
import { strings } from '@/lib/i18n';
import type { DailyContent, Settings } from '@/lib/types';

type SectionKey = 'verse' | 'hadith' | 'pray';

interface Section {
  key: SectionKey;
  text: string;
  source: string | null;
}

export function contentSections(content: DailyContent | null): Section[] {
  if (!content) return [];
  const all: Array<[SectionKey, string | null, string | null]> = [
    ['verse', content.verse, content.verseSource],
    ['hadith', content.hadith, content.hadithSource],
    ['pray', content.pray, content.praySource],
  ];
  return all.flatMap(([key, text, source]) => (text ? [{ key, text, source }] : []));
}

export default function DailyContentCard({
  content,
  settings,
}: {
  content: DailyContent;
  settings: Settings;
}) {
  const t = strings(settings.language);
  const sections = useMemo(() => contentSections(content), [content]);
  const [selected, setSelected] = useState<SectionKey | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [content.date]);

  const labels: Record<SectionKey, string> = {
    verse: t.contentVerse,
    hadith: t.contentHadith,
    pray: t.contentPray,
  };

  const active = sections.find((section) => section.key === selected) ?? sections[0];
  if (!active) return null;

  return (
    <section className="clay clay-deep verse">
      <span className="clay-badge verse__badge">
        <BookIcon width={28} height={28} style={{ color: '#3c5b42' }} />
      </span>
      <div className="verse__body">
        {sections.length > 1 ? (
          <div className="verse__tabs" role="tablist" aria-label={t.contentLabel}>
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                role="tab"
                className="verse__tab"
                aria-selected={section.key === active.key}
                onClick={() => setSelected(section.key)}
              >
                {labels[section.key]}
              </button>
            ))}
          </div>
        ) : (
          <h2 className="verse__title">{labels[active.key]}</h2>
        )}
        <p className="verse__text">{active.text}</p>
        {active.source && <p className="verse__ref">— {active.source}</p>}
      </div>
      <img className="verse__glyph" src="/scene/calligraphy.webp" alt="" aria-hidden="true" />
    </section>
  );
}
