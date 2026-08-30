'use client';

import { useEffect, useMemo } from 'react';
import { moonPosition, sunPosition } from '@/lib/solar';
import {
  UI_DARK,
  UI_LIGHT,
  applyWeather,
  paletteToCssVars,
  skyFor,
  skyPhase,
  type SkyPhase,
} from '@/lib/sky';
import { CLEAR_EFFECTS, describeWeather, type SceneEffects } from '@/lib/weather';
import type { Settings, WeatherNow } from '@/lib/types';

const DEG = 180 / Math.PI;

/**
 * Maps a real sky position to a place on the screen.
 *
 * Azimuth drives x across the arc a viewer facing south would see. Altitude
 * drives y, but compressed into the strip of sky above the cards - the full
 * 0-90deg arc would put the midday sun behind the prayer list, where it would
 * appear to have vanished. The body still rises, crosses and sets; the height
 * of the arc is just flattened to fit the frame.
 */
const SKY_TOP = 3;
/** alt 0 lands on the hill ridge, so a low sun really does set behind it. */
const SKY_HORIZON = 21;
/** The arc is centred right of screen centre to clear the brand block. */
const ARC_CENTRE = 62;
const ARC_SPREAD = 28;

function project(altitudeDeg: number, azimuthDeg: number) {
  const x = ARC_CENTRE + (Math.max(-135, Math.min(135, azimuthDeg)) / 135) * ARC_SPREAD;
  const climb = Math.max(-12, Math.min(90, altitudeDeg)) / 90;
  const y = SKY_HORIZON - climb * (SKY_HORIZON - SKY_TOP);
  return { left: `${x.toFixed(2)}%`, top: `${y.toFixed(2)}%` };
}

/**
 * Picks one of the four rendered phases.
 *
 * The renders are lit from the left, which is a waning moon in the northern
 * hemisphere, so a waxing moon is the same art mirrored.
 */
function moonArt(fraction: number, phase: number) {
  const name =
    fraction < 0.2 ? 'moon-crescent'
    : fraction < 0.55 ? 'moon-half'
    : fraction < 0.88 ? 'moon-gibbous'
    : 'moon-full';
  return { src: `/scene/${name}.webp`, waxing: phase < 0.5 };
}

/** Deterministic 0..1 from an integer, so clouds are stable across renders. */
const noise = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

interface CloudSprite {
  id: number;
  src: string;
  top: string;
  size: string;
  opacity: number;
  duration: string;
  delay: string;
}

function buildClouds(cloudiness: number, raining: boolean): CloudSprite[] {
  const count = Math.round(2 + cloudiness * 6);
  return Array.from({ length: count }, (_, i) => {
    const a = noise(i + 1);
    const b = noise(i + 41);
    const c = noise(i + 87);
    // Higher clouds are smaller, slower and fainter: cheap aerial perspective.
    const depth = a;
    const duration = 150 + depth * 220;
    // Only the lower, nearer clouds carry rain - a drizzling cloud at the top
    // of the sky reads as a sticker.
    const wet = raining && depth < 0.55;
    return {
      id: i,
      src: wet ? '/scene/cloud-rain.webp' : `/scene/cloud-${(i % 2) + 1}.webp`,
      top: `${3 + b * 26}%`,
      size: `${(30 - depth * 13).toFixed(1)}rem`,
      opacity: Number((0.55 + (1 - depth) * 0.4 * Math.min(1, cloudiness + 0.4)).toFixed(2)),
      duration: `${duration.toFixed(0)}s`,
      // Negative delays scatter the clouds across the sky on first paint.
      delay: `${(-c * duration).toFixed(0)}s`,
    };
  });
}

/** Trees and bush clumps standing in front of the hill band. */
const SCENERY: Array<{ src: string; left: string; bottom: string; width: string }> = [
  { src: '/scene/tree.webp', left: '4%', bottom: '22%', width: '9rem' },
  { src: '/scene/bushes.webp', left: '12%', bottom: '19%', width: '11rem' },
  { src: '/scene/bushes.webp', left: '31%', bottom: '25%', width: '9rem' },
  { src: '/scene/tree.webp', left: '46%', bottom: '23%', width: '7.5rem' },
  { src: '/scene/bushes.webp', left: '58%', bottom: '28%', width: '8rem' },
  { src: '/scene/tree.webp', left: '86%', bottom: '24%', width: '8.5rem' },
  { src: '/scene/bushes.webp', left: '94%', bottom: '21%', width: '10rem' },
];

export interface SceneState {
  phase: SkyPhase;
  effects: SceneEffects;
  sunAltitude: number;
  isNight: boolean;
}

interface Props {
  settings: Settings;
  weather: WeatherNow | null;
  /** Minute-resolution clock; the sky does not need to move every second. */
  minuteNow: number;
  /** Decided by the caller from Maghrib, not from the sun's altitude. */
  dark: boolean;
  onState?: (state: SceneState) => void;
}

export default function SceneBackground({ settings, weather, minuteNow, dark, onState }: Props) {
  const { latitude, longitude } = settings.location;

  const scene = useMemo(() => {
    const now = new Date(minuteNow);
    const sun = sunPosition(now, latitude, longitude);
    const later = sunPosition(new Date(minuteNow + 600_000), latitude, longitude);
    const rising = later.altitude > sun.altitude;
    const moon = moonPosition(now, latitude, longitude);

    const sunAlt = sun.altitude * DEG;
    const moonAlt = moon.altitude * DEG;

    const effects = weather
      ? describeWeather(weather.code, weather.cloudCover, sunAlt < -6)
      : CLEAR_EFFECTS;

    // A pinned theme also pins the sky, so "dark mode" is not a bright sky
    // behind dark cards.
    const forced =
      settings.theme === 'light'
        ? Math.max(sunAlt, 25)
        : settings.theme === 'dark'
          ? Math.min(sunAlt, -30)
          : sunAlt;
    const sky = applyWeather(skyFor(forced, rising), effects.cloudiness, effects.fog);

    // One brightness value carries the whole landscape from noon to midnight,
    // rather than a second set of night-time art.
    const bright = Math.max(0.32, Math.min(1.05, 0.36 + (forced + 12) / 26));

    return {
      sky,
      effects,
      rising,
      sunAlt,
      moonAlt,
      sunPos: project(sunAlt, sun.azimuth * DEG),
      moonPos: project(moonAlt, moon.azimuth * DEG),
      moon: moonArt(moon.fraction, moon.phase),
      bright,
      phase: skyPhase(forced, rising),
    };
  }, [latitude, longitude, minuteNow, weather, settings.theme]);

  const clouds = useMemo(
    () => buildClouds(scene.effects.cloudiness, scene.effects.precipitation > 0),
    [scene.effects.cloudiness, scene.effects.precipitation],
  );

  useEffect(() => {
    onState?.({
      phase: scene.phase,
      effects: scene.effects,
      sunAltitude: scene.sunAlt,
      isNight: scene.sunAlt < -6,
    });
  }, [scene, onState]);

  // Palette tokens live on <html> so cards, text and the scene share them.
  useEffect(() => {
    const root = document.documentElement;
    const vars = paletteToCssVars(scene.sky, dark ? UI_DARK : UI_LIGHT);
    for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
    root.style.setProperty('--land-bright', scene.bright.toFixed(3));
    root.style.setProperty('--land-sat', (0.7 + scene.bright * 0.35).toFixed(3));
    // The card ornaments are rendered in the light-mode card green, so they
    // have to be dimmed by the same amount the card itself is.
    root.style.setProperty('--ornament-bright', dark ? '0.72' : '1');
    root.style.setProperty('--fog-opacity', scene.effects.fog.toFixed(2));
    root.style.setProperty(
      '--precip-opacity',
      scene.effects.precipitation === 0 ? '0' : String(0.3 + scene.effects.precipitation * 0.18),
    );
    root.style.setProperty(
      '--rain-speed',
      `${(0.85 - scene.effects.precipitation * 0.16).toFixed(2)}s`,
    );
  }, [scene, dark]);

  const { effects } = scene;
  const sunVisible = scene.sunAlt > -8;
  // A daytime moon is real, but the rendered disc is opaque enough to read as
  // a grey blob in a bright sky, so it is dropped once the sun is properly up.
  const moonVisible = scene.moonAlt > -4 && scene.sunAlt < 6;
  const dim = 1 - effects.celestialDimming;
  const still = settings.reducedMotion;

  return (
    <div className="scene" aria-hidden="true">
      <div className="scene__sky" />
      <div className="scene__horizon" />
      <div className="scene__stars" />

      {scene.sunAlt > -14 && scene.sunAlt < 14 && (
        // The disc is behind the hills near the horizon; this is the glow that
        // still reaches the sky above them at dawn and dusk.
        <div
          className="scene__sunglow"
          style={{
            left: scene.sunPos.left,
            opacity:
              Math.max(0, 1 - Math.abs(scene.sunAlt) / 14) * (1 - effects.celestialDimming * 0.7),
          }}
        />
      )}

      {sunVisible && (
        <div
          className="celestial celestial--sun"
          style={{ ...scene.sunPos, opacity: Math.max(0.15, dim) }}
        >
          <div
            className="celestial__halo"
            style={{ animationPlayState: still ? 'paused' : undefined }}
          />
          <img
            className={still ? undefined : 'celestial__spin'}
            src="/scene/sun-full.webp"
            alt=""
            width={380}
            height={380}
          />
        </div>
      )}

      {moonVisible && (
        <div
          className="celestial celestial--moon"
          style={{
            ...scene.moonPos,
            opacity: Math.max(0.12, dim * (scene.sunAlt > -2 ? 0.4 : 1)),
          }}
        >
          <div className="celestial__halo" style={{ opacity: scene.sunAlt < -6 ? 0.5 : 0.1 }} />
          <img
            src={scene.moon.src}
            alt=""
            width={260}
            height={260}
            style={scene.moon.waxing ? { transform: 'scaleX(-1)' } : undefined}
          />
        </div>
      )}

      <div className="clouds">
        {clouds.map((cloud) => (
          <div
            key={cloud.id}
            className="cloud"
            style={{
              ['--top' as string]: cloud.top,
              ['--size' as string]: cloud.size,
              ['--opacity' as string]: cloud.opacity,
              ['--dur' as string]: cloud.duration,
              ['--delay' as string]: cloud.delay,
              animationPlayState: still ? 'paused' : undefined,
            }}
          >
            <img src={cloud.src} alt="" width={640} height={334} />
          </div>
        ))}
      </div>

      <div className="land">
        <img className="land__hills" src="/scene/landscape.webp" alt="" width={2172} height={328} />

        <div className="land__mosque">
          <img
            className="land__mosque-day"
            src="/scene/mosque-day.webp"
            alt=""
            width={1200}
            height={1023}
            style={{ opacity: dark ? 0 : 1 }}
          />
          {/* Its own render, with the windows lit, rather than a glow overlay. */}
          <img
            className="land__mosque-night"
            src="/scene/mosque-night.webp"
            alt=""
            width={1200}
            height={1023}
            style={{ opacity: dark ? 1 : 0 }}
          />
        </div>

        {SCENERY.map((item, i) => (
          <img
            key={i}
            className="land__sprite"
            src={item.src}
            alt=""
            style={{ left: item.left, bottom: item.bottom, width: item.width }}
          />
        ))}
      </div>

      {effects.precipitation > 0 && (
        <div className="precip">
          {effects.precipitationType === 'snow' ? (
            <>
              <div className="precip__snow" />
              <div className="precip__snow precip__snow--far" />
            </>
          ) : (
            <>
              <div className="precip__rain" />
              <div className="precip__rain precip__rain--far" />
              {effects.precipitationType === 'sleet' && (
                <div className="precip__snow precip__snow--far" />
              )}
            </>
          )}
        </div>
      )}

      {effects.fog > 0.2 && (
        <div className="fog">
          <div className="fog__band" />
          <div className="fog__band" />
          <div className="fog__band" />
        </div>
      )}

      {effects.lightning && !still && <div className="lightning" />}

      <div className="scene__vignette" />
    </div>
  );
}
