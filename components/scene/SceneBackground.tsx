'use client';

import { useEffect, useMemo } from 'react';
import { moonPosition, sunPosition } from '@/lib/solar';
import { applyWeather, paletteFor, paletteToCssVars, skyPhase, type SkyPhase } from '@/lib/sky';
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

function buildClouds(cloudiness: number): CloudSprite[] {
  const count = Math.round(2 + cloudiness * 7);
  return Array.from({ length: count }, (_, i) => {
    const a = noise(i + 1);
    const b = noise(i + 41);
    const c = noise(i + 87);
    // Higher clouds are smaller, slower and fainter: cheap aerial perspective.
    const depth = a;
    const duration = 150 + depth * 220;
    return {
      id: i,
      src: `/scene/cloud-${(i % 4) + 1}.webp`,
      top: `${4 + b * 34}%`,
      size: `${(30 - depth * 14).toFixed(1)}rem`,
      opacity: Number((0.45 + (1 - depth) * 0.45 * Math.min(1, cloudiness + 0.35)).toFixed(2)),
      duration: `${duration.toFixed(0)}s`,
      // Negative delays scatter the clouds across the sky on first paint.
      delay: `${(-c * duration).toFixed(0)}s`,
    };
  });
}

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
  onState?: (state: SceneState) => void;
}

export default function SceneBackground({ settings, weather, minuteNow, onState }: Props) {
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

    const forced =
      settings.theme === 'day' ? 25 : settings.theme === 'night' ? -30 : sunAlt;
    const palette = applyWeather(
      paletteFor(forced, rising),
      effects.cloudiness,
      effects.fog,
    );

    // Hills and the mosque are one flat art asset; brightness carries them
    // through the day rather than a second night-time set of images.
    const bright = Math.max(0.3, Math.min(1.05, 0.34 + (forced + 12) / 26));

    return {
      palette,
      effects,
      rising,
      sunAlt,
      moonAlt,
      sunPos: project(sunAlt, sun.azimuth * DEG),
      moonPos: project(moonAlt, moon.azimuth * DEG),
      moonFraction: moon.fraction,
      moonPhase: moon.phase,
      bright,
      phase: skyPhase(forced, rising),
    };
  }, [latitude, longitude, minuteNow, weather, settings.theme]);

  const clouds = useMemo(
    () => buildClouds(scene.effects.cloudiness),
    [scene.effects.cloudiness],
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
    const vars = paletteToCssVars(scene.palette);
    for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
    root.style.setProperty('--land-bright', scene.bright.toFixed(3));
    root.style.setProperty('--land-sat', (0.7 + scene.bright * 0.35).toFixed(3));
    root.style.setProperty('--fog-opacity', scene.effects.fog.toFixed(2));
    root.style.setProperty(
      '--precip-opacity',
      scene.effects.precipitation === 0 ? '0' : String(0.35 + scene.effects.precipitation * 0.2),
    );
    root.style.setProperty(
      '--rain-speed',
      `${(0.85 - scene.effects.precipitation * 0.16).toFixed(2)}s`,
    );
  }, [scene]);

  const { effects } = scene;
  const sunVisible = scene.sunAlt > -8;
  const moonVisible = scene.moonAlt > -4;
  const dim = 1 - effects.celestialDimming;

  // Carve the lunar phase out of the disc: a same-size circle slid across it.
  const waning = scene.moonPhase > 0.5;
  const shadowOffset = 71 * scene.moonFraction * (waning ? 1 : -1);
  const moonMask = `radial-gradient(ellipse 35.5% 35.5% at ${(50 + shadowOffset).toFixed(1)}% 50%, transparent 0 98%, #000 100%)`;

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
            opacity: Math.max(0, 1 - Math.abs(scene.sunAlt) / 14) * (1 - effects.celestialDimming * 0.7),
          }}
        />
      )}

      {sunVisible && (
        <div
          className="celestial celestial--sun"
          style={{ ...scene.sunPos, opacity: Math.max(0.15, dim) }}
        >
          <div className="celestial__halo" style={{ animationPlayState: still ? 'paused' : undefined }} />
          <img
            className={still ? undefined : 'celestial__rays'}
            src="/scene/sun.webp"
            alt=""
            width={420}
            height={420}
          />
        </div>
      )}

      {moonVisible && (
        <div
          className="celestial celestial--moon"
          style={{
            ...scene.moonPos,
            // A daytime moon is real, but it should be barely there.
            opacity: Math.max(0.08, dim * (scene.sunAlt > 2 ? 0.28 : 1)),
          }}
        >
          <div className="celestial__halo" style={{ opacity: scene.sunAlt < -6 ? 0.5 : 0.1 }} />
          <div
            className="celestial__moon-disc"
            style={{ ['--moon-mask' as string]: moonMask }}
          >
            <img src="/scene/moon.webp" alt="" width={360} height={360} />
          </div>
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
            <img src={cloud.src} alt="" width={340} height={170} />
          </div>
        ))}
      </div>

      {scene.sunAlt > 0 && effects.cloudiness < 0.7 && (
        <div className="birds" style={{ animationDelay: '-60s' }}>
          <img src="/scene/birds.webp" alt="" width={240} height={90} />
        </div>
      )}

      <div className="land">
        <img className="land__band land__band--back" src="/scene/hills-back.webp" alt="" width={1600} height={520} />
        <div className="land__mosque">
          <img src="/scene/mosque.webp" alt="" width={900} height={760} />
          <img className="land__mosque-glow" src="/scene/mosque-glow.webp" alt="" width={900} height={760} />
        </div>
        <img className="land__band land__band--mid" src="/scene/hills-mid.webp" alt="" width={1600} height={520} />
        <img className="land__band land__band--front" src="/scene/hills-front.webp" alt="" width={1600} height={520} />
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
              {effects.precipitationType === 'sleet' && <div className="precip__snow precip__snow--far" />}
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
