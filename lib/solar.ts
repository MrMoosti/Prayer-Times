/**
 * Astronomical helpers.
 *
 * Places the sun and the moon on the clay sky (real altitude / azimuth for
 * the configured location, so the celestial body actually tracks the day).
 *
 * Formulas follow the standard low-precision solar/lunar approximations
 * (Meeus, as popularised by suncalc).
 */

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
/** Obliquity of the ecliptic. */
const E = 23.4397 * RAD;

const toJulian = (date: Date) => date.valueOf() / DAY_MS - 0.5 + J1970;
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
