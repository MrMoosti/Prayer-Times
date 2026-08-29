/**
 * Rasterises the clay scene art to transparent WebP.
 *
 *   npm run scene
 *
 * The generated files are committed, so a fresh clone runs without this step.
 * Re-run it after editing scripts/scene-art.mjs.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { LAYERS } from './scene-art.mjs';

const root = process.cwd();
const svgDir = path.join(root, 'assets', 'scene');
const outDir = path.join(root, 'public', 'scene');

await mkdir(svgDir, { recursive: true });
await mkdir(outDir, { recursive: true });

let total = 0;
for (const [name, layer] of Object.entries(LAYERS)) {
  const svg = layer.svg().trim();
  await writeFile(path.join(svgDir, `${name}.svg`), svg, 'utf8');

  const buffer = await sharp(Buffer.from(svg), { density: 220 })
    .resize({ width: layer.width * 2, withoutEnlargement: false })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toBuffer();

  const file = path.join(outDir, `${name}.webp`);
  await writeFile(file, buffer);
  const { width, height, channels } = await sharp(buffer).metadata();
  if (channels !== 4) throw new Error(`${name}.webp lost its alpha channel`);
  total += buffer.length;
  console.log(`  ${name.padEnd(14)} ${String(width).padStart(5)}x${String(height).padEnd(5)} ${(buffer.length / 1024).toFixed(1)} kB`);
}

console.log(`\n${Object.keys(LAYERS).length} layers, ${(total / 1024).toFixed(0)} kB total -> public/scene/`);
