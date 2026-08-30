import { BookIcon } from './icons';
import { verseOfTheDay } from '@/lib/verses';

export default function VerseCard({ isoDate }: { isoDate: string }) {
  const verse = verseOfTheDay(isoDate);
  return (
    <section className="clay clay-deep verse">
      <span className="clay-badge verse__badge">
        <BookIcon width={28} height={28} style={{ color: '#3c5b42' }} />
      </span>
      <div>
        <h2 className="verse__title">Verse of the Day</h2>
        <p className="verse__text">{verse.text}</p>
        <p className="verse__ref">— {verse.reference}</p>
      </div>
      <img className="verse__glyph" src="/scene/calligraphy.webp" alt="" aria-hidden="true" />
    </section>
  );
}
