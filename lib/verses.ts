export interface Verse {
  text: string;
  reference: string;
  /** A short Arabic phrase used as the watermark glyph on the card. */
  glyph: string;
}

/** Rotates once per day, chosen by day-of-year so every screen agrees. */
export const VERSES: Verse[] = [
  { text: 'Indeed, with hardship comes ease.', reference: "Qur'an 94:6", glyph: 'يُسْرًا' },
  { text: 'So remember Me; I will remember you.', reference: "Qur'an 2:152", glyph: 'ٱذْكُرُونِي' },
  { text: 'And He is with you wherever you are.', reference: "Qur'an 57:4", glyph: 'مَعَكُمْ' },
  { text: 'Verily, in the remembrance of Allah do hearts find rest.', reference: "Qur'an 13:28", glyph: 'تَطْمَئِنُّ' },
  { text: 'Allah does not burden a soul beyond what it can bear.', reference: "Qur'an 2:286", glyph: 'وُسْعَهَا' },
  { text: 'And seek help through patience and prayer.', reference: "Qur'an 2:45", glyph: 'ٱلصَّبْرِ' },
  { text: 'My Lord, increase me in knowledge.', reference: "Qur'an 20:114", glyph: 'عِلْمًا' },
  { text: 'Indeed, prayer prohibits immorality and wrongdoing.', reference: "Qur'an 29:45", glyph: 'ٱلصَّلَاةَ' },
  { text: 'And whoever is mindful of Allah, He will make a way out for them.', reference: "Qur'an 65:2", glyph: 'مَخْرَجًا' },
  { text: 'Do not despair of the mercy of Allah.', reference: "Qur'an 39:53", glyph: 'رَحْمَةِ' },
  { text: 'Speak to people kindly.', reference: "Qur'an 2:83", glyph: 'حُسْنًا' },
  { text: 'And it is He who sends down rain after they had despaired.', reference: "Qur'an 42:28", glyph: 'ٱلْغَيْثَ' },
  { text: 'Whoever does an atom’s weight of good will see it.', reference: "Qur'an 99:7", glyph: 'خَيْرًا' },
  { text: 'Establish prayer at the decline of the sun until the darkness of night.', reference: "Qur'an 17:78", glyph: 'أَقِمِ' },
];

export function verseOfTheDay(isoDate: string): Verse {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return VERSES[((dayNumber % VERSES.length) + VERSES.length) % VERSES.length];
}
