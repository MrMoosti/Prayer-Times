/**
 * UI translations. Three languages, Turkish is the default.
 *
 * Prayer names: Turkish uses the Turkish names (Sabah, Öğlen, İkindi, Akşam,
 * Yatsı); Dutch and English keep the Arabic/English names. Subtitles are
 * translated in every language.
 */

import type { PrayerKey } from './types';

export const LANGUAGES = ['tr', 'nl', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  tr: 'Türkçe',
  nl: 'Nederlands',
  en: 'English',
};

interface PrayerLabel {
  name: string;
  subtitle: string;
}

const PRAYER_LABELS: Record<Language, Record<PrayerKey, PrayerLabel>> = {
  en: {
    fajr: { name: 'Fajr', subtitle: 'Dawn prayer' },
    sunrise: { name: 'Sunrise', subtitle: 'Fajr ends' },
    dhuhr: { name: 'Dhuhr', subtitle: 'Midday prayer' },
    asr: { name: 'Asr', subtitle: 'Afternoon prayer' },
    maghrib: { name: 'Maghrib', subtitle: 'Evening prayer' },
    isha: { name: 'Isha', subtitle: 'Night prayer' },
  },
  nl: {
    fajr: { name: 'Fajr', subtitle: 'Ochtendgebed' },
    sunrise: { name: 'Sunrise', subtitle: 'Einde Fajr' },
    dhuhr: { name: 'Dhuhr', subtitle: 'Middaggebed' },
    asr: { name: 'Asr', subtitle: 'Namiddaggebed' },
    maghrib: { name: 'Maghrib', subtitle: 'Avondgebed' },
    isha: { name: 'Isha', subtitle: 'Nachtgebed' },
  },
  tr: {
    fajr: { name: 'Sabah', subtitle: 'Sabah namazı' },
    sunrise: { name: 'Güneş', subtitle: 'Sabah vakti çıkışı' },
    dhuhr: { name: 'Öğlen', subtitle: 'Öğlen namazı' },
    asr: { name: 'İkindi', subtitle: 'İkindi namazı' },
    maghrib: { name: 'Akşam', subtitle: 'Akşam namazı' },
    isha: { name: 'Yatsı', subtitle: 'Yatsı namazı' },
  },
};

export function prayerLabels(language: Language): Record<PrayerKey, PrayerLabel> {
  return PRAYER_LABELS[language] ?? PRAYER_LABELS.tr;
}

/** WMO condition labels, keyed by the English string from lib/weather.ts. */
const WEATHER_LABELS: Record<string, Record<Language, string>> = {
  'Clear sky': { en: 'Clear sky', nl: 'Heldere hemel', tr: 'Açık hava' },
  'Mainly clear': { en: 'Mainly clear', nl: 'Overwegend helder', tr: 'Az bulutlu' },
  'Partly cloudy': { en: 'Partly cloudy', nl: 'Half bewolkt', tr: 'Parçalı bulutlu' },
  Overcast: { en: 'Overcast', nl: 'Zwaar bewolkt', tr: 'Kapalı' },
  Fog: { en: 'Fog', nl: 'Mist', tr: 'Sis' },
  Drizzle: { en: 'Drizzle', nl: 'Motregen', tr: 'Çisenti' },
  Rain: { en: 'Rain', nl: 'Regen', tr: 'Yağmur' },
  'Heavy rain': { en: 'Heavy rain', nl: 'Zware regen', tr: 'Kuvvetli yağmur' },
  'Freezing rain': { en: 'Freezing rain', nl: 'IJzel', tr: 'Dondurucu yağmur' },
  Snow: { en: 'Snow', nl: 'Sneeuw', tr: 'Kar' },
  Thunderstorm: { en: 'Thunderstorm', nl: 'Onweer', tr: 'Gök gürültülü fırtına' },
  'Thunderstorm with hail': {
    en: 'Thunderstorm with hail',
    nl: 'Onweer met hagel',
    tr: 'Dolulu gök gürültülü fırtına',
  },
};

export function weatherLabel(englishLabel: string, language: Language): string {
  return WEATHER_LABELS[englishLabel]?.[language] ?? englishLabel;
}

export interface Strings {
  today: string;
  hijri: string;
  next: string;
  nextPrayer: string;
  nextPrayerTomorrow: string;
  nextPrayerIn: string;
  loadingTimes: string;
  todaysPrayerTimes: string;
  verseOfTheDay: string;
  hasBegun: (name: string) => string;
  dismiss: string;
  feelsLike: (deg: number) => string;

  // settings drawer
  settings: string;
  closeSettings: string;
  language: string;
  languageHint: string;
  timeOffsets: string;
  timeOffsetsHint: string;
  decreaseOffset: (name: string) => string;
  increaseOffset: (name: string) => string;
  minAbbrev: string;
  announcements: string;
  announcementsHint: string;
  desktopNotifications: string;
  desktopNotificationsHint: string;
  announcedPrayers: string;
  announcedPrayersHint: string;
  display: string;
  clock24h: string;
  showWeather: string;
  showWeatherHint: string;
  reduceMotion: string;
  reduceMotionHint: string;
  resetAll: string;
}

export const STRINGS: Record<Language, Strings> = {
  en: {
    today: 'Today',
    hijri: 'Hijri',
    next: 'Next',
    nextPrayer: 'Next prayer',
    nextPrayerTomorrow: 'Next prayer · tomorrow',
    nextPrayerIn: 'Next prayer in',
    loadingTimes: 'Loading times',
    todaysPrayerTimes: 'Today’s Prayer Times',
    verseOfTheDay: 'Verse of the Day',
    hasBegun: (name) => `${name} has begun`,
    dismiss: 'Dismiss',
    feelsLike: (deg) => `feels like ${deg}°`,
    settings: 'Settings',
    closeSettings: 'Close settings',
    language: 'Language',
    languageHint: 'The language of the interface and the prayer names.',
    timeOffsets: 'Time offsets',
    timeOffsetsHint:
      'Minutes added to each time. This shifts the displayed time and delays the announcement with it.',
    decreaseOffset: (name) => `Decrease ${name} offset`,
    increaseOffset: (name) => `Increase ${name} offset`,
    minAbbrev: 'min',
    announcements: 'Announcements',
    announcementsHint: 'A call tone plays on this device when a prayer time arrives.',
    desktopNotifications: 'Desktop notifications',
    desktopNotificationsHint: 'Shows a system notification alongside the tone.',
    announcedPrayers: 'Announced prayers',
    announcedPrayersHint: 'Choose which prayers announce themselves when their time arrives.',
    display: 'Display',
    clock24h: '24-hour clock',
    showWeather: 'Show weather',
    showWeatherHint: 'Also drives the rain, snow and cloud effects in the scene.',
    reduceMotion: 'Reduce motion',
    reduceMotionHint: 'Stops the drifting clouds and the spinning sun.',
    resetAll: 'Reset all',
  },
  nl: {
    today: 'Vandaag',
    hijri: 'Hidjri',
    next: 'Volgende',
    nextPrayer: 'Volgend gebed',
    nextPrayerTomorrow: 'Volgend gebed · morgen',
    nextPrayerIn: 'Volgend gebed over',
    loadingTimes: 'Tijden laden',
    todaysPrayerTimes: 'Gebedstijden van vandaag',
    verseOfTheDay: 'Vers van de dag',
    hasBegun: (name) => `${name} is begonnen`,
    dismiss: 'Sluiten',
    feelsLike: (deg) => `voelt als ${deg}°`,
    settings: 'Instellingen',
    closeSettings: 'Instellingen sluiten',
    language: 'Taal',
    languageHint: 'De taal van de interface en de gebedsnamen.',
    timeOffsets: 'Tijdcorrecties',
    timeOffsetsHint:
      'Minuten toegevoegd aan elke tijd. Dit verschuift de getoonde tijd en stelt de aankondiging mee uit.',
    decreaseOffset: (name) => `Correctie voor ${name} verlagen`,
    increaseOffset: (name) => `Correctie voor ${name} verhogen`,
    minAbbrev: 'min',
    announcements: 'Aankondigingen',
    announcementsHint: 'Een oproeptoon speelt op dit apparaat wanneer een gebedstijd aanbreekt.',
    desktopNotifications: 'Bureaubladmeldingen',
    desktopNotificationsHint: 'Toont een systeemmelding naast de toon.',
    announcedPrayers: 'Aangekondigde gebeden',
    announcedPrayersHint: 'Kies welke gebeden zich melden wanneer hun tijd aanbreekt.',
    display: 'Weergave',
    clock24h: '24-uursklok',
    showWeather: 'Weer tonen',
    showWeatherHint: 'Bepaalt ook de regen-, sneeuw- en wolkeneffecten in het tafereel.',
    reduceMotion: 'Beweging beperken',
    reduceMotionHint: 'Stopt de drijvende wolken en de draaiende zon.',
    resetAll: 'Alles herstellen',
  },
  tr: {
    today: 'Bugün',
    hijri: 'Hicri',
    next: 'Sonraki',
    nextPrayer: 'Sonraki namaz',
    nextPrayerTomorrow: 'Sonraki namaz · yarın',
    nextPrayerIn: 'Sonraki namaza kalan',
    loadingTimes: 'Vakitler yükleniyor',
    todaysPrayerTimes: 'Bugünün Namaz Vakitleri',
    verseOfTheDay: 'Günün Ayeti',
    hasBegun: (name) => `${name} vakti girdi`,
    dismiss: 'Kapat',
    feelsLike: (deg) => `hissedilen ${deg}°`,
    settings: 'Ayarlar',
    closeSettings: 'Ayarları kapat',
    language: 'Dil',
    languageHint: 'Arayüzün ve namaz isimlerinin dili.',
    timeOffsets: 'Vakit düzeltmeleri',
    timeOffsetsHint:
      'Her vakte eklenen dakika. Gösterilen vakti kaydırır ve duyuruyu da onunla birlikte geciktirir.',
    decreaseOffset: (name) => `${name} düzeltmesini azalt`,
    increaseOffset: (name) => `${name} düzeltmesini artır`,
    minAbbrev: 'dk',
    announcements: 'Duyurular',
    announcementsHint: 'Namaz vakti geldiğinde bu cihazda bir ezan sesi çalar.',
    desktopNotifications: 'Masaüstü bildirimleri',
    desktopNotificationsHint: 'Sesin yanında bir sistem bildirimi gösterir.',
    announcedPrayers: 'Duyurulan namazlar',
    announcedPrayersHint: 'Vakti geldiğinde hangi namazların duyurulacağını seçin.',
    display: 'Görünüm',
    clock24h: '24 saat biçimi',
    showWeather: 'Havayı göster',
    showWeatherHint: 'Sahnedeki yağmur, kar ve bulut efektlerini de yönetir.',
    reduceMotion: 'Hareketi azalt',
    reduceMotionHint: 'Süzülen bulutları ve dönen güneşi durdurur.',
    resetAll: 'Tümünü sıfırla',
  },
};

export function strings(language: Language): Strings {
  return STRINGS[language] ?? STRINGS.tr;
}
