export interface Verse {
  text: string;
  reference: string;
}

/** Rotates once per day, chosen by day-of-year so every screen agrees. */
export const VERSES: Verse[] = [
  { text: 'Indeed, with hardship comes ease.', reference: "Qur'an 94:6" },
  { text: 'So remember Me; I will remember you.', reference: "Qur'an 2:152" },
  { text: 'And He is with you wherever you are.', reference: "Qur'an 57:4" },
  { text: 'Verily, in the remembrance of Allah do hearts find rest.', reference: "Qur'an 13:28" },
  { text: 'Allah does not burden a soul beyond what it can bear.', reference: "Qur'an 2:286" },
  { text: 'And seek help through patience and prayer.', reference: "Qur'an 2:45" },
  { text: 'My Lord, increase me in knowledge.', reference: "Qur'an 20:114" },
  { text: 'Indeed, prayer prohibits immorality and wrongdoing.', reference: "Qur'an 29:45" },
  { text: 'And whoever is mindful of Allah, He will make a way out for them.', reference: "Qur'an 65:2" },
  { text: 'Do not despair of the mercy of Allah.', reference: "Qur'an 39:53" },
  { text: 'Speak to people kindly.', reference: "Qur'an 2:83" },
  { text: 'And it is He who sends down rain after they had despaired.', reference: "Qur'an 42:28" },
  { text: 'Whoever does an atom’s weight of good will see it.', reference: "Qur'an 99:7" },
  { text: 'Establish prayer at the decline of the sun until the darkness of night.', reference: "Qur'an 17:78" },
];

export function verseOfTheDay(isoDate: string): Verse {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return VERSES[((dayNumber % VERSES.length) + VERSES.length) % VERSES.length];
}
