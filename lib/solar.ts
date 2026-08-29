/**
 * Astronomical helpers.
 *
 * Used for two things:
 *  1. Placing the sun and the moon on the clay sky (real altitude / azimuth for
 *     the configured location, so the celestial body actually tracks the day).
 *  2. Calculating prayer times offline, as a fallback when the Aladhan API is
 *     unreachable. Angles match the Diyanet convention (Fajr 18deg, Isha 17deg,
 *     Asr shadow factor 1).
 *
 * Formulas follow the standard low-precision solar/lunar approximations
 * (Meeus, as popularised by suncalc); accurate to well under a minute for
 * prayer-time purposes.
 */

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
/** Obliquity of the ecliptic. */
const E = 23.4397 * RAD;

const toJulian = (date: Date) => date.valueOf() / DAY_MS - 0.5 + J1970;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * DAY_MS);
/** Days since the J2000.0 epoch. */
const toDays = (date: Date) => toJulian(date) - J2000;

const rightAscension = (l: number, b: number) =>
  Math.atan2(Math.sin(l) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(l));
const declination = (l: number, b: number) =>
  Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l));

const siderealTime = (d: number, lw: number) => RAD * (280.16 + 360.9856235 * d) - lw;

const solarMeanAnomaly = (d: number) => RAD * (357.5291 + 0.98560028 * d);

const eclipticLongitude = (M: number) => {
  // Equation of the centre + perihelion of the Earth.
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = RAD * 102.9372;
  return M + C + P + Math.PI;
};

function sunCoords(d: number) {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  return { dec: declination(L, 0), ra: rightAscension(L, 0), M, L };
}

export interface SkyPosition {
  /** Radians above the horizon; negative when below. */
  altitude: number;
  /** Radians, measured from due south, increasing westwards. */
  azimuth: number;
}

export function sunPosition(date: Date, lat: number, lng: number): SkyPosition {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d = toDays(date);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  return {
    azimuth: Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(c.dec) * Math.cos(phi)),
    altitude: Math.asin(
      Math.sin(phi) * Math.sin(c.dec) + Math.cos(phi) * Math.cos(c.dec) * Math.cos(H),
    ),
  };
}

function moonCoords(d: number) {
  const L = RAD * (218.316 + 13.176396 * d); // ecliptic longitude
  const M = RAD * (134.963 + 13.064993 * d); // mean anomaly
  const F = RAD * (93.272 + 13.22935 * d); // mean distance
  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M); // distance, km
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}

export interface MoonState extends SkyPosition {
  /** 0 = new, 0.5 = full, approaching 1 = waning crescent. */
  phase: number;
  /** Illuminated fraction of the disc, 0..1. */
  fraction: number;
}

export function moonPosition(date: Date, lat: number, lng: number): MoonState {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d = toDays(date);
  const m = moonCoords(d);
  const s = sunCoords(d);
  const H = siderealTime(d, lw) - m.ra;
  const altitude = Math.asin(
    Math.sin(phi) * Math.sin(m.dec) + Math.cos(phi) * Math.cos(m.dec) * Math.cos(H),
  );

  const sdist = 149598000;
  const phiAngle = Math.acos(
    Math.sin(s.dec) * Math.sin(m.dec) +
      Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra),
  );
  const inc = Math.atan2(sdist * Math.sin(phiAngle), m.dist - sdist * Math.cos(phiAngle));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) -
      Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra),
  );

  return {
    altitude,
    azimuth: Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(m.dec) * Math.cos(phi)),
    fraction: (1 + Math.cos(inc)) / 2,
    phase: 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI,
  };
}

/* ------------------------------------------------------------------ *
 * Offline prayer-time calculation
 * ------------------------------------------------------------------ */

const julianCycle = (d: number, lw: number) => Math.round(d - 0.0009 - lw / (2 * Math.PI));
const approxTransit = (Ht: number, lw: number, n: number) =>
  0.0009 + (Ht + lw) / (2 * Math.PI) + n;
const solarTransitJ = (ds: number, M: number, L: number) =>
  J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);

/** Hour angle at which the sun sits at altitude `h` (radians). */
const hourAngle = (h: number, phi: number, dec: number) => {
  const cosH =
    (Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosH > 1 || cosH < -1) return NaN; // sun never reaches this altitude today
  return Math.acos(cosH);
};

export interface SolarAngles {
  fajr: number;
  isha: number;
  /** Asr shadow multiplier: 1 = Diyanet/Shafi, 2 = Hanafi. */
  asrFactor: number;
}

export const DIYANET_ANGLES: SolarAngles = { fajr: 18, isha: 17, asrFactor: 1 };

/**
 * Above roughly 48deg latitude the sun never dips 17-18deg below the horizon in
 * midsummer, so Fajr and Isha have no astronomical solution. These are the
 * conventional substitutes; the names match Aladhan's
 * `latitudeAdjustmentMethod` so the API and the offline path agree.
 */
export type HighLatitudeRule = 'none' | 'middleOfNight' | 'oneSeventh' | 'angleBased';

export const ALADHAN_LATITUDE_METHOD: Record<HighLatitudeRule, number | null> = {
  none: null,
  middleOfNight: 1,
  oneSeventh: 2,
  angleBased: 3,
};

/**
 * Calculates the six times for a local calendar date. Returns `null` for any
 * event the sun does not reach at this latitude (high-latitude summer), so the
 * caller can fall back to the API or hide the row.
 */
export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  angles: SolarAngles = DIYANET_ANGLES,
  highLatitudeRule: HighLatitudeRule = 'oneSeventh',
): Record<string, Date | null> {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  // Anchor on local noon so the returned instants land on the requested day.
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const d = toDays(noon);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);

  const at = (h: number, side: -1 | 1) => {
    const w = hourAngle(h, phi, dec);
    if (Number.isNaN(w)) return null;
    const a = approxTransit(side * w, lw, n);
    return fromJulian(solarTransitJ(a, M, L));
  };

  // Asr: shadow of an object equals its own length times the factor, plus the
  // shadow already present at solar noon.
  const asrAltitude = Math.atan(1 / (angles.asrFactor + Math.tan(Math.abs(phi - dec))));

  const times = {
    fajr: at(-angles.fajr * RAD, -1),
    sunrise: at(-0.833 * RAD, -1),
    dhuhr: fromJulian(Jnoon),
    asr: at(asrAltitude, 1),
    maghrib: at(-0.833 * RAD, 1),
    isha: at(-angles.isha * RAD, 1),
  };

  // High-latitude adjustment. Two cases need catching, not one: the sun never
  // reaching the angle at all (no astronomical time), and reaching it so close
  // to solar midnight that the twilight never really ended - at 52N in late May
  // the astronomical Isha falls at 01:29, twelve minutes before the sun's
  // lowest point. Both are replaced by a fixed portion of the night.
  //
  // The trigger has to be narrow: a blanket "clamp anything past the portion"
  // also rewrites correct times at mid latitudes (it moves Istanbul's Fajr 40
  // minutes late). So a time only counts as pathological when it falls within
  // an eighth of the night of solar midnight.
  if (highLatitudeRule !== 'none' && times.sunrise && times.maghrib) {
    // Night runs from tonight's sunset to tomorrow's sunrise; today's sunrise
    // plus 24h is within a couple of minutes of it and avoids recursing.
    const night = times.sunrise.valueOf() + DAY_MS - times.maghrib.valueOf();
    const solarMidnight = Jnoon !== null ? fromJulian(Jnoon).valueOf() + DAY_MS / 2 : 0;
    const margin = night / 8;

    const portion = (angleDeg: number) => {
      switch (highLatitudeRule) {
        case 'middleOfNight':
          return night / 2;
        case 'angleBased':
          return (night * angleDeg) / 60;
        default:
          return night / 7;
      }
    };

    // Isha belongs to the evening: it must land clear of solar midnight.
    if (!times.isha || times.isha.valueOf() > solarMidnight - margin) {
      times.isha = new Date(times.maghrib.valueOf() + portion(angles.isha));
    }
    // Fajr belongs to the morning, so it is judged against the same midnight.
    if (!times.fajr || times.fajr.valueOf() < solarMidnight - DAY_MS + margin) {
      times.fajr = new Date(times.sunrise.valueOf() - portion(angles.fajr));
    }
  }

  return times;
}
