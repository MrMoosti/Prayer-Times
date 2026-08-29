'use client';

import type { PrayerKey } from './types';

/**
 * A synthesised call tone, not a recording: struck-bell partials arranged in
 * Hijaz, which is the maqam the adhan is most often sung in. Keeping it
 * synthesised means no audio files ship with the app and nothing has to load
 * before a prayer can be announced.
 *
 * Drop your own recordings at /public/audio/adhan.mp3 (or adhan-fajr.mp3) and
 * `playAdhan` will prefer them - see README.
 */

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

/** Browsers start audio suspended; call this from a user gesture. */
export async function unlockAudio(): Promise<boolean> {
  const ctx = audioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === 'running';
}

export function audioReady(): boolean {
  return context?.state === 'running';
}

/** Hijaz on D - the interval that gives the call its recognisable colour. */
const HIJAZ = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16];
const MELODY = [0, 2, 3, 2, 0, 1, 0];

function strike(ctx: AudioContext, destination: AudioNode, freq: number, at: number, gain: number) {
  // Three inharmonic partials give the tone a struck, metallic body.
  const partials: Array<[ratio: number, level: number, decay: number]> = [
    [1, 1, 2.6],
    [2.01, 0.34, 1.5],
    [3.02, 0.14, 0.9],
  ];
  for (const [ratio, level, decay] of partials) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * ratio, at);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(gain * level, at + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    osc.connect(env).connect(destination);
    osc.start(at);
    osc.stop(at + decay + 0.05);
  }
}

/**
 * @param key      which prayer - Fajr and Isha sound an octave lower and slower
 * @param volume   0..1
 * @returns        seconds the tone will last
 */
export function playChime(key: PrayerKey, volume = 0.5): number {
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return 0;

  const night = key === 'fajr' || key === 'isha';
  const octave = night ? 0.5 : 1;
  const step = night ? 0.62 : 0.44;

  const master = ctx.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume)) * 0.5;

  // A short feedback delay stands in for the reverberation of a hall.
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.28;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = night ? 1800 : 3200;

  master.connect(tone).connect(ctx.destination);
  tone.connect(delay).connect(feedback).connect(delay);
  delay.connect(wet).connect(ctx.destination);

  const start = ctx.currentTime + 0.05;
  MELODY.forEach((degree, i) => {
    const emphasis = i === 0 || i === MELODY.length - 1 ? 0.32 : 0.2;
    strike(ctx, master, HIJAZ[degree] * octave, start + i * step, emphasis);
  });

  return MELODY.length * step + 2.6;
}

let recordings: Promise<string[]> | null = null;

/** Asked once per session; see app/api/audio/route.ts. */
function availableRecordings(): Promise<string[]> {
  recordings ??= fetch('/api/audio')
    .then((res) => (res.ok ? res.json() : { files: [] }))
    .then((body: { files?: string[] }) => body.files ?? [])
    .catch(() => []);
  return recordings;
}

/** Plays a bundled recording when one is present, otherwise the chime. */
export async function playAdhan(key: PrayerKey, volume = 0.5): Promise<void> {
  const files = await availableRecordings();
  // A prayer-specific file wins over the general one.
  const match =
    files.find((name) => name.replace(/\.[^.]+$/, '') === `adhan-${key}`) ??
    files.find((name) => name.replace(/\.[^.]+$/, '') === 'adhan');

  if (match) {
    try {
      const audio = new Audio(`/audio/${match}`);
      audio.volume = Math.max(0, Math.min(1, volume));
      await audio.play();
      return;
    } catch {
      // Autoplay refused, or a codec the browser will not take.
    }
  }
  playChime(key, volume);
}
