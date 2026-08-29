import type { NavId } from './BottomNav';

const COPY: Record<Exclude<NavId, 'home'>, { title: string; body: string }> = {
  prayer: {
    title: 'Prayer',
    body: 'The full month and year of times for your city, the qibla direction and a tracker for the prayers you have prayed.',
  },
  program: {
    title: 'Program',
    body: 'Lesson times, Jumu‘ah and the mosque’s calendar of events.',
  },
  community: {
    title: 'Community',
    body: 'Announcements from your mosque and the people around you.',
  },
  account: {
    title: 'My Account',
    body: 'Your profile, saved locations and synced preferences.',
  },
};

export default function PlaceholderCard({ section }: { section: Exclude<NavId, 'home'> }) {
  const copy = COPY[section];
  return (
    <section className="clay card" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <h2 className="card__title" style={{ fontSize: '4rem' }}>
        {copy.title}
      </h2>
      <p style={{ fontSize: '2rem', opacity: 0.66, maxWidth: '40ch', lineHeight: 1.5 }}>{copy.body}</p>
      <p style={{ fontSize: '1.7rem', opacity: 0.45, marginTop: '2rem' }}>Not built yet.</p>
    </section>
  );
}
