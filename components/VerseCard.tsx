import { BookIcon } from './icons';
import { strings } from '@/lib/i18n';
import type { Settings } from '@/lib/types';
import { verseOfTheDay } from '@/lib/verses';

export default function VerseCard({ isoDate, settings }: { isoDate: string; settings: Settings }) {
  const verse = verseOfTheDay(isoDate);
  const t = strings(settings.language);
  return (
    <section className="clay clay-deep verse">
      <span className="clay-badge verse__badge">
        <BookIcon width={28} height={28} style={{ color: '#3c5b42' }} />
      </span>
      <div>
        <h2 className="verse__title">{t.verseOfTheDay}</h2>
        <p className="verse__text">{verse.text}</p>
        <p className="verse__ref">— {verse.reference}</p>
      </div>
      <img className="verse__glyph" src="/scene/calligraphy.webp" alt="" aria-hidden="true" />
    </section>
  );
}
