'use client';

import { useEffect, useState } from 'react';
import { strings } from '@/lib/i18n';
import type { CityResult, LocationSetting, Settings } from '@/lib/types';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

interface RemoteCity {
  id: number;
  name: string;
  stateName?: string | null;
  countryName?: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
}

const toResult = (city: RemoteCity): CityResult => ({
  id: city.id,
  name: city.name,
  stateName: city.stateName ?? '',
  countryName: city.countryName ?? '',
  latitude: city.latitude,
  longitude: city.longitude,
  timezone: city.timezone,
});

const toLocation = (city: CityResult): LocationSetting => ({
  cityId: city.id,
  name: city.name,
  country: [city.stateName, city.countryName].filter(Boolean).join(', '),
  latitude: city.latitude,
  longitude: city.longitude,
  timezone: city.timezone,
});

export default function LocationPicker({ settings, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateFailed, setLocateFailed] = useState(false);

  const t = strings(settings.language);
  const { location } = settings;
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setFailed(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?search=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { data?: { items?: RemoteCity[] } };
        if (cancelled) return;
        setResults((body.data?.items ?? []).map(toResult));
        setFailed(false);
      } catch {
        if (cancelled) return;
        setResults([]);
        setFailed(true);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  const choose = (city: CityResult) => {
    onChange({ location: toLocation(city) });
    setQuery('');
    setResults([]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocateFailed(true);
      return;
    }
    setLocating(true);
    setLocateFailed(false);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `/api/places/nearest?latitude=${coords.latitude}&longitude=${coords.longitude}`,
          );
          if (!res.ok) throw new Error(String(res.status));
          const body = (await res.json()) as { data?: RemoteCity[] };
          const nearest = body.data?.[0];
          if (!nearest) throw new Error('none');
          choose(toResult(nearest));
        } catch {
          setLocateFailed(true);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocateFailed(true);
      },
      { timeout: 10_000 },
    );
  };

  return (
    <div className="field">
      <label className="field__label" htmlFor="city">
        {t.location}
      </label>
      <p className="field__hint">
        {location.cityId == null
          ? t.locationNone
          : t.locationCurrently(
              `${location.name}${location.country ? `, ${location.country}` : ''}`,
              location.timezone,
            )}
      </p>
      <input
        id="city"
        className="input"
        placeholder={t.searchCity}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />
      <div className="results">
        {results.map((city) => (
          <button
            key={city.id}
            type="button"
            className="results__item"
            data-selected={city.id === location.cityId}
            onClick={() => choose(city)}
          >
            <span>{city.name}</span>
            <span className="results__country">
              {[city.stateName, city.countryName].filter(Boolean).join(', ')}
            </span>
          </button>
        ))}
        {trimmed.length < 2 && <p className="field__hint">{t.searchHint}</p>}
        {trimmed.length >= 2 && searching && <p className="field__hint">{t.searching}</p>}
        {trimmed.length >= 2 && !searching && failed && (
          <p className="field__hint">{t.searchFailed}</p>
        )}
        {trimmed.length >= 2 && !searching && !failed && !results.length && (
          <p className="field__hint">{t.noCitiesMatched}</p>
        )}
      </div>
      <button type="button" className="button-ghost" onClick={useMyLocation} disabled={locating}>
        {locating ? t.locating : t.useMyLocation}
      </button>
      {locateFailed && <p className="field__hint">{t.locationFailed}</p>}
    </div>
  );
}
