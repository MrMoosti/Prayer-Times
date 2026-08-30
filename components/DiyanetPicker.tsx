'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DiyanetPlaceSetting, Settings } from '@/lib/types';

interface Place {
  id: number;
  code: string | null;
  name: string;
}

interface Status {
  configured: boolean;
  budget?: { date: string; spent: Record<string, number>; limit: number };
}

async function fetchPlaces(level: string, parentId?: number): Promise<Place[]> {
  const params = new URLSearchParams({ level });
  if (parentId != null) params.set('parentId', String(parentId));
  const res = await fetch(`/api/diyanet/places?${params}`);
  const body = (await res.json()) as { results?: Place[]; error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body.results ?? [];
}

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

/**
 * Diyanet addresses places by its own Country → State → City ids, so the
 * picker walks that cascade. Each level is cached server-side on first use;
 * the daily quota is small enough that re-browsing must not re-fetch.
 */
export default function DiyanetPicker({ settings, onChange }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [countries, setCountries] = useState<Place[]>([]);
  const [states, setStates] = useState<Place[]>([]);
  const [cities, setCities] = useState<Place[]>([]);
  const [countryId, setCountryId] = useState<number | ''>('');
  const [stateId, setStateId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/diyanet/status')
      .then((res) => res.json())
      .then((body: Status) => setStatus(body))
      .catch(() => setStatus({ configured: false }));
  }, []);

  const load = useCallback(
    async (level: string, parentId: number | undefined, apply: (places: Place[]) => void) => {
      setBusy(true);
      setError(null);
      try {
        apply(await fetchPlaces(level, parentId));
      } catch (e) {
        setError((e as Error).message);
        apply([]);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  // Countries are only loaded once the section is actually shown.
  useEffect(() => {
    if (status?.configured && !countries.length) {
      void load('countries', undefined, setCountries);
    }
  }, [status, countries.length, load]);

  if (!status) return null;

  if (!status.configured) {
    return (
      <div className="field">
        <span className="field__label">Diyanet</span>
        <p className="field__hint">
          Not configured. Set <code>DIYANET_EMAIL</code> and <code>DIYANET_PASSWORD</code> on the
          server and restart to fetch official Diyanet times; until then the app uses Aladhan with
          the Diyanet calculation method.
        </p>
      </div>
    );
  }

  const chosen: DiyanetPlaceSetting | null = settings.diyanet;
  const spentToday = Object.values(status.budget?.spent ?? {}).reduce((a, b) => a + b, 0);

  const selectCity = (cityId: number) => {
    const city = cities.find((c) => c.id === cityId);
    const state = states.find((s) => s.id === stateId);
    const country = countries.find((c) => c.id === countryId);
    if (!city) return;
    onChange({
      diyanet: {
        cityId: city.id,
        cityName: city.name,
        stateName: state?.name ?? '',
        countryName: country?.name ?? '',
      },
    });
  };

  return (
    <div className="field">
      <span className="field__label">Diyanet place</span>
      <p className="field__hint">
        Official times from awqatsalah.diyanet.gov.tr. Diyanet addresses places by its own
        country, province and district — pick yours below. The location above still drives the
        weather and the sky.
      </p>

      {chosen ? (
        <div className="results__item" data-selected="true">
          <span>
            {chosen.cityName}
            {chosen.stateName ? `, ${chosen.stateName}` : ''}
          </span>
          <span className="results__country">{chosen.countryName}</span>
        </div>
      ) : (
        <p className="field__hint">No Diyanet place selected — using Aladhan.</p>
      )}

      <select
        className="select"
        value={countryId}
        disabled={busy}
        onChange={(event) => {
          const id = Number(event.target.value);
          setCountryId(id || '');
          setStateId('');
          setCities([]);
          setStates([]);
          if (id) void load('states', id, setStates);
        }}
        aria-label="Country"
      >
        <option value="">Country…</option>
        {countries.map((country) => (
          <option key={country.id} value={country.id}>
            {country.name}
          </option>
        ))}
      </select>

      {states.length > 0 && (
        <select
          className="select"
          value={stateId}
          disabled={busy}
          onChange={(event) => {
            const id = Number(event.target.value);
            setStateId(id || '');
            setCities([]);
            if (id) void load('cities', id, setCities);
          }}
          aria-label="Province"
        >
          <option value="">Province…</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
      )}

      {cities.length > 0 && (
        <select
          className="select"
          defaultValue=""
          disabled={busy}
          onChange={(event) => {
            const id = Number(event.target.value);
            if (id) selectCity(id);
          }}
          aria-label="District"
        >
          <option value="">District…</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      )}

      {error && <p className="field__hint">Diyanet: {error}</p>}

      <p className="field__hint">
        Requests used today: {spentToday} (budget {status.budget?.limit ?? '?'} per endpoint).
        Diyanet only serves the current month, so the rest of the year is calculated locally until
        each month arrives.
      </p>

      {chosen && (
        <button type="button" className="button-ghost" onClick={() => onChange({ diyanet: null })}>
          Stop using Diyanet
        </button>
      )}
    </div>
  );
}
