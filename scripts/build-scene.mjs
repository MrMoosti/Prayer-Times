/**
 * Rasterises the clay scene masters to the sizes the app actually serves.
 *
 *   npm run scene
 *
 * Masters live in assets/scene/*.webp as trimmed, lossless WebP. This step
 * resizes each to roughly twice its largest on-screen size and re-encodes it
 * lossily, which is what keeps public/scene small enough to ship.
 *
 * The generated files are committed, so a fresh clone runs without this step.
 * Re-run it after replacing a master.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const srcDir = path.join(root, 'assets', 'scene');
const outDir = path.join(root, 'public', 'scene');

/**
 * `width`/`height` cap the long edge. `canvas` instead pads onto a fixed frame:
 * the two mosques are separate renders and have to share one frame, bottom
 * aligned on the ground line, or they jump when they cross-fade.
 */
const MOSQUE_FRAME = [1200, 1023];

const LAYERS = {
  landscape: { width: 2172 },
  'mosque-day': { canvas: MOSQUE_FRAME },
  'mosque-night': { canvas: MOSQUE_FRAME },
  tree: { height: 280 },
  bushes: { height: 240 },

  'cloud-1': { width: 640 },
  'cloud-2': { width: 640 },
  'cloud-rain': { width: 640 },

  'sun-full': { width: 380 },
  'sun-rising': { width: 260 },
  'sun-setting': { width: 260 },

  'moon-crescent': { height: 260 },
  'moon-half': { height: 260 },
  'moon-gibbous': { height: 260 },
  'moon-full': { height: 260 },

  arch: { height: 900 },
  plant: { height: 420 },
  calligraphy: { height: 320 },
};

await mkdir(outDir, { recursive: true });

let total = 0;
for (const [name, spec] of Object.entries(LAYERS)) {
  const master = await readFile(path.join(srcDir, `${name}.webp`));
  let pipeline = sharp(master);

  if (spec.canvas) {
    const [w, h] = spec.canvas;
    pipeline = pipeline.resize(w, h, {
      fit: 'contain',
      position: 'south',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  } else {
    pipeline = pipeline.resize({
      width: spec.width,
      height: spec.height,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const buffer = await pipeline.webp({ quality: 86, alphaQuality: 100, effort: 6 }).toBuffer();
  await writeFile(path.join(outDir, `${name}.webp`), buffer);

  const { width, height, channels } = await sharp(buffer).metadata();
  if (channels !== 4) throw new Error(`${name}.webp lost its alpha channel`);
  total += buffer.length;
  console.log(
    `  ${name.padEnd(16)} ${String(width).padStart(5)}x${String(height).padEnd(5)} ${(buffer.length / 1024).toFixed(1)} kB`,
  );
}

console.log(
  `\n${Object.keys(LAYERS).length} layers, ${(total / 1024).toFixed(0)} kB total -> public/scene/`,
);
