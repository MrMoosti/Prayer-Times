import type { LocationSetting } from './types';

/**
 * A small offline list so the location picker still works without a network,
 * and so the app has a sensible starting point on first run.
 */
export const FALLBACK_CITIES: LocationSetting[] = [
  { name: 'Rijswijk', country: 'Netherlands', latitude: 52.0367, longitude: 4.3253, timezone: 'Europe/Amsterdam' },
  { name: 'The Hague', country: 'Netherlands', latitude: 52.0705, longitude: 4.3007, timezone: 'Europe/Amsterdam' },
  { name: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam' },
  { name: 'Rotterdam', country: 'Netherlands', latitude: 51.9244, longitude: 4.4777, timezone: 'Europe/Amsterdam' },
  { name: 'Utrecht', country: 'Netherlands', latitude: 52.0907, longitude: 5.1214, timezone: 'Europe/Amsterdam' },
  { name: 'Brussels', country: 'Belgium', latitude: 50.8503, longitude: 4.3517, timezone: 'Europe/Brussels' },
  { name: 'Cologne', country: 'Germany', latitude: 50.9375, longitude: 6.9603, timezone: 'Europe/Berlin' },
  { name: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin' },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { name: 'London', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276, timezone: 'Europe/London' },
  { name: 'Istanbul', country: 'Türkiye', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { name: 'Ankara', country: 'Türkiye', latitude: 39.9334, longitude: 32.8597, timezone: 'Europe/Istanbul' },
  { name: 'Izmir', country: 'Türkiye', latitude: 38.4237, longitude: 27.1428, timezone: 'Europe/Istanbul' },
  { name: 'Konya', country: 'Türkiye', latitude: 37.8746, longitude: 32.4932, timezone: 'Europe/Istanbul' },
  { name: 'Mecca', country: 'Saudi Arabia', latitude: 21.3891, longitude: 39.8579, timezone: 'Asia/Riyadh' },
  { name: 'Medina', country: 'Saudi Arabia', latitude: 24.5247, longitude: 39.5692, timezone: 'Asia/Riyadh' },
  { name: 'Jerusalem', country: 'Palestine', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Hebron' },
  { name: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { name: 'Casablanca', country: 'Morocco', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca' },
  { name: 'Sarajevo', country: 'Bosnia and Herzegovina', latitude: 43.8563, longitude: 18.4131, timezone: 'Europe/Sarajevo' },
  { name: 'Stockholm', country: 'Sweden', latitude: 59.3293, longitude: 18.0686, timezone: 'Europe/Stockholm' },
  { name: 'Oslo', country: 'Norway', latitude: 59.9139, longitude: 10.7522, timezone: 'Europe/Oslo' },
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  { name: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
  { name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { name: 'Karachi', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi' },
  { name: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { name: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.139, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
];

export const DEFAULT_LOCATION = FALLBACK_CITIES[0];

export function searchFallbackCities(query: string): LocationSetting[] {
  const q = query.trim().toLowerCase();
  if (!q) return FALLBACK_CITIES.slice(0, 8);
  return FALLBACK_CITIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
  ).slice(0, 8);
}
