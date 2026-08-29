/**
 * Source art for the clay scene.
 *
 * Every layer is authored here as SVG and rasterised to transparent WebP by
 * build-scene.mjs. Three things carry the claymorphic look and are applied
 * consistently: a soft two-stop gradient across each form, a blurred highlight
 * where the light falls, and a fine noise grain so surfaces read as matte felt
 * or pressed paper rather than flat vector. Nothing uses a hard edge.
 */

/**
 * Fine noise multiplied back onto the shape it came from. This is what stops
 * the art looking like flat vector fills.
 */
const grain = (id, { frequency = 0.85, strength = 0.42, seed = 7 } = {}) => `
  <filter id="${id}" x="-4%" y="-4%" width="108%" height="108%">
    <feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="4" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0" result="g"/>
    <feComponentTransfer in="g" result="a">
      <feFuncA type="linear" slope="${strength}" intercept="${(-strength / 4).toFixed(3)}"/>
    </feComponentTransfer>
    <feComposite in="a" in2="SourceGraphic" operator="in" result="grain"/>
    <feBlend in="SourceGraphic" in2="grain" mode="multiply"/>
  </filter>`;

const softShadow = (id, { dx = 4, dy = 10, blur = 12, color = '#8A7550', opacity = 0.3 } = {}) => `
  <filter id="${id}" x="-40%" y="-40%" width="180%" height="200%">
    <feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur}" flood-color="${color}" flood-opacity="${opacity}"/>
  </filter>`;

const blur = (id, deviation) => `
  <filter id="${id}" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="${deviation}"/>
  </filter>`;

/* --- palettes ------------------------------------------------------- */

const CREAM = { light: '#FDF6E7', base: '#EFE1C6', mid: '#E2D0AE', shade: '#CBB48C', deep: '#A98F65' };
const GOLD = { light: '#FFF0BB', base: '#F5C842', shade: '#E0A62F', deep: '#B47C1B' };

/* ------------------------------------------------------------------ *
 * Mosque
 * ------------------------------------------------------------------ */

/** An onion dome: straight-ish shoulders rising to a point. */
const onionDome = (cx, baseY, halfWidth, height) => {
  const w = halfWidth;
  const apex = baseY - height;
  return `M ${cx - w} ${baseY}
    C ${cx - w} ${baseY - height * 0.52}, ${cx - w * 0.86} ${baseY - height * 0.82}, ${cx - w * 0.30} ${apex + height * 0.13}
    C ${cx - w * 0.13} ${apex + height * 0.05}, ${cx - w * 0.05} ${apex + height * 0.02}, ${cx} ${apex}
    C ${cx + w * 0.05} ${apex + height * 0.02}, ${cx + w * 0.13} ${apex + height * 0.05}, ${cx + w * 0.30} ${apex + height * 0.13}
    C ${cx + w * 0.86} ${baseY - height * 0.82}, ${cx + w} ${baseY - height * 0.52}, ${cx + w} ${baseY} Z`;
};

/** A pointed arch, used for every window and doorway. */
const pointedArch = (cx, baseY, halfWidth, height) => {
  const w = halfWidth;
  const apex = baseY - height;
  return `M ${cx - w} ${baseY}
    L ${cx - w} ${baseY - height * 0.52}
    C ${cx - w} ${apex + height * 0.16}, ${cx - w * 0.5} ${apex}, ${cx} ${apex}
    C ${cx + w * 0.5} ${apex}, ${cx + w} ${apex + height * 0.16}, ${cx + w} ${baseY - height * 0.52}
    L ${cx + w} ${baseY} Z`;
};

const crescent = (cx, cy, r) => `
  <path d="M ${cx} ${cy - r}
    a ${r} ${r} 0 1 0 ${r * 0.72} ${r * 1.72}
    a ${r * 0.8} ${r * 0.8} 0 1 1 ${-r * 0.72} ${-r * 1.72} Z" fill="url(#gold-body)"/>`;

const WINDOWS = [
  // cx, baseY, halfWidth, height
  [384, 700, 48, 156],
  [252, 700, 34, 108],
  [516, 700, 34, 108],
  [779, 330, 17, 60],
];

export const mosque = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 780" width="900" height="780">
  <defs>
    ${grain('m-grain', { frequency: 0.9, strength: 0.4, seed: 3 })}
    ${softShadow('m-shadow', { dx: 5, dy: 12, blur: 14, color: '#96805A', opacity: 0.34 })}
    ${blur('m-soft', 10)}
    <linearGradient id="wall" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="${CREAM.light}"/>
      <stop offset="0.5" stop-color="${CREAM.base}"/>
      <stop offset="1" stop-color="${CREAM.shade}"/>
    </linearGradient>
    <radialGradient id="dome" cx="0.33" cy="0.2" r="0.9">
      <stop offset="0" stop-color="#FFFBF0"/>
      <stop offset="0.45" stop-color="${CREAM.base}"/>
      <stop offset="1" stop-color="${CREAM.deep}"/>
    </radialGradient>
    <linearGradient id="recess" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7E6544"/>
      <stop offset="1" stop-color="#A98C63"/>
    </linearGradient>
    <linearGradient id="gold-body" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${GOLD.light}"/>
      <stop offset="0.55" stop-color="${GOLD.base}"/>
      <stop offset="1" stop-color="${GOLD.deep}"/>
    </linearGradient>
  </defs>

  <g filter="url(#m-shadow)">
    <g filter="url(#m-grain)">
      <!-- prayer hall -->
      <rect x="150" y="452" width="470" height="298" rx="26" fill="url(#wall)"/>
      <!-- side wings, set back -->
      <rect x="96" y="546" width="76" height="204" rx="22" fill="${CREAM.mid}"/>
      <rect x="600" y="546" width="82" height="204" rx="22" fill="${CREAM.mid}"/>

      <!-- drum and main dome -->
      <rect x="276" y="392" width="216" height="72" rx="18" fill="url(#wall)"/>
      <path d="${onionDome(384, 396, 168, 232)}" fill="url(#dome)"/>
      <!-- side dome -->
      <path d="${onionDome(188, 476, 62, 88)}" fill="url(#dome)"/>
      <rect x="140" y="470" width="96" height="26" rx="12" fill="url(#wall)"/>

      <!-- minaret: shaft, balcony, upper shaft, cap -->
      <rect x="750" y="286" width="60" height="464" rx="20" fill="url(#wall)"/>
      <rect x="736" y="372" width="88" height="30" rx="14" fill="${CREAM.mid}"/>
      <rect x="740" y="366" width="80" height="10" rx="5" fill="${CREAM.light}" opacity="0.8"/>
      <rect x="762" y="214" width="36" height="80" rx="14" fill="url(#wall)"/>
      <path d="M 780 92 L 818 220 L 742 220 Z" fill="url(#dome)"/>
    </g>

    <!-- dome highlight and underside shade, kept out of the grain pass -->
    <path d="M 322 232 C 292 288, 280 344, 280 392" stroke="#FFFCF3" stroke-opacity="0.6"
          stroke-width="30" stroke-linecap="round" fill="none" filter="url(#m-soft)"/>
    <path d="M 462 244 C 496 300, 502 350, 502 392 L 452 392 Z"
          fill="${CREAM.deep}" opacity="0.22" filter="url(#m-soft)"/>
    <path d="M 168 500 C 158 520, 154 540, 154 552" stroke="#FFFCF3" stroke-opacity="0.5"
          stroke-width="14" stroke-linecap="round" fill="none" filter="url(#m-soft)"/>
    <rect x="758" y="300" width="14" height="420" rx="7" fill="#FFFCF3" opacity="0.4" filter="url(#m-soft)"/>
  </g>

  <!-- recessed openings; the glow layer lights these at night -->
  <g id="windows">
    ${WINDOWS.map(([cx, y, w, h]) => `<path d="${pointedArch(cx, y, w, h)}" fill="url(#recess)"/>`).join('\n    ')}
  </g>
  <g fill="none" stroke="${CREAM.light}" stroke-opacity="0.55" stroke-width="5">
    ${WINDOWS.map(([cx, y, w, h]) => `<path d="${pointedArch(cx, y, w, h)}"/>`).join('\n    ')}
  </g>

  ${crescent(384, 150, 30)}
  ${crescent(780, 62, 21)}
</svg>`;

/** Just the openings, drawn again so they can be bloomed on top at night. */
export const mosqueGlow = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 780" width="900" height="780">
  <defs>
    <linearGradient id="lit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF1C4"/>
      <stop offset="1" stop-color="#F0AE3E"/>
    </linearGradient>
    ${blur('bloom', 20)}
  </defs>
  <g opacity="0.8" filter="url(#bloom)">
    ${WINDOWS.map(([cx, y, w, h]) => `<path d="${pointedArch(cx, y, w, h)}" fill="url(#lit)"/>`).join('\n    ')}
  </g>
  ${WINDOWS.map(([cx, y, w, h]) => `<path d="${pointedArch(cx, y, w, h)}" fill="url(#lit)"/>`).join('\n  ')}
</svg>`;

/* ------------------------------------------------------------------ *
 * Hills and trees
 * ------------------------------------------------------------------ */

/**
 * A single tree: a short trunk under a canopy built from overlapping lobes,
 * lit from the top left. Drawn small and repeated rather than stamped from one
 * shape, so a row of them does not read as a pattern.
 */
const tree = (x, groundY, scale, p, seed) => {
  const rnd = (n) => {
    const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const h = (34 + rnd(1) * 16) * scale;
  const w = h * (0.72 + rnd(2) * 0.16);
  const trunkH = h * 0.3;
  const cy = groundY - trunkH - h * 0.52;
  const f = (n) => n.toFixed(1);

  return `
    <ellipse cx="${f(x)}" cy="${f(groundY)}" rx="${f(w * 0.85)}" ry="${f(h * 0.1)}" fill="${p.deep}" opacity="0.22"/>
    <rect x="${f(x - w * 0.09)}" y="${f(groundY - trunkH - 2)}" width="${f(w * 0.18)}" height="${f(trunkH + 4)}" rx="${f(w * 0.09)}" fill="${p.trunk}"/>
    <ellipse cx="${f(x)}" cy="${f(cy + h * 0.2)}" rx="${f(w * 0.62)}" ry="${f(h * 0.42)}" fill="${p.base}"/>
    <ellipse cx="${f(x - w * 0.4)}" cy="${f(cy + h * 0.16)}" rx="${f(w * 0.4)}" ry="${f(h * 0.32)}" fill="${p.base}"/>
    <ellipse cx="${f(x + w * 0.4)}" cy="${f(cy + h * 0.2)}" rx="${f(w * 0.38)}" ry="${f(h * 0.3)}" fill="${p.shade}"/>
    <ellipse cx="${f(x)}" cy="${f(cy - h * 0.14)}" rx="${f(w * 0.5)}" ry="${f(h * 0.36)}" fill="${p.base}"/>
    <ellipse cx="${f(x - w * 0.22)}" cy="${f(cy - h * 0.24)}" rx="${f(w * 0.3)}" ry="${f(h * 0.22)}" fill="${p.light}"/>
    <ellipse cx="${f(x + w * 0.26)}" cy="${f(cy + h * 0.06)}" rx="${f(w * 0.24)}" ry="${f(h * 0.18)}" fill="${p.shade}" opacity="0.8"/>`;
};

/**
 * Three hill bands on a tight 1600x220 artboard: the ridge sits near the top of
 * the frame so the band can be laid low on the screen without cropping the
 * hilltops away. Back is hazy and pale, front is saturated and carries the
 * larger trees; the scene component moves them at different rates.
 */
export const hills = (depth) => {
  const hill = {
    back: { light: '#D3DFC2', base: '#BCCDA6', shade: '#A2B78B', deep: '#7E946B' },
    mid: { light: '#BDCFA4', base: '#A2B889', shade: '#88A06E', deep: '#65804F' },
    front: { light: '#A6BC8A', base: '#8AA46E', shade: '#6E8B54', deep: '#4E6A39' },
  }[depth];

  const foliage = {
    back: { light: '#A9BF8E', base: '#8CA772', shade: '#71905A', deep: '#556F42', trunk: '#9A8763' },
    mid: { light: '#94AE76', base: '#77935B', shade: '#5E7C46', deep: '#425C31', trunk: '#8B7856' },
    front: { light: '#7E9A5F', base: '#5F7F45', shade: '#496935', deep: '#2F4B22', trunk: '#7A6848' },
  }[depth];

  const shapes = {
    back: 'M0 88 C 180 40 330 56 470 76 C 620 98 760 46 960 60 C 1160 74 1330 42 1600 66 L 1600 220 L 0 220 Z',
    mid: 'M0 112 C 220 62 340 96 520 112 C 700 128 830 82 1020 96 C 1210 110 1400 74 1600 98 L 1600 220 L 0 220 Z',
    front: 'M0 142 C 240 100 420 132 640 142 C 860 152 1060 118 1290 134 C 1420 142 1520 136 1600 130 L 1600 220 L 0 220 Z',
  };

  // x, ground y on the ridge, scale, seed
  const rows = {
    back: [
      [150, 80, 0.36, 1], [190, 86, 0.3, 21], [520, 92, 0.34, 2], [900, 68, 0.36, 3],
      [940, 74, 0.29, 31], [1290, 54, 0.33, 11], [1424, 62, 0.3, 41],
    ],
    mid: [
      [300, 96, 0.56, 4], [348, 104, 0.46, 22], [742, 122, 0.6, 5], [796, 128, 0.48, 32],
      [1120, 104, 0.55, 6], [1172, 110, 0.45, 42], [1500, 92, 0.52, 12],
    ],
    front: [
      [180, 132, 1, 7], [246, 140, 0.82, 23], [560, 148, 1.04, 8], [634, 152, 0.86, 33],
      [1000, 148, 0.96, 9], [1068, 152, 0.8, 43], [1420, 136, 0.92, 10], [1486, 140, 0.76, 53],
    ],
  };

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 220" width="1600" height="220">
  <defs>
    ${grain(`h-grain-${depth}`, { frequency: 1.1, strength: 0.34, seed: depth.length * 5 })}
    <linearGradient id="h-${depth}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${hill.light}"/>
      <stop offset="0.4" stop-color="${hill.base}"/>
      <stop offset="1" stop-color="${hill.shade}"/>
    </linearGradient>
    <filter id="h-shadow-${depth}" x="-10%" y="-60%" width="120%" height="240%">
      <feDropShadow dx="0" dy="-4" stdDeviation="7" flood-color="${hill.deep}" flood-opacity="0.28"/>
    </filter>
  </defs>

  <g filter="url(#h-grain-${depth})">
    <path d="${shapes[depth]}" fill="url(#h-${depth})" filter="url(#h-shadow-${depth})"/>
    <!-- rim light along the ridge, the way light catches a folded paper edge -->
    <path d="${shapes[depth]}" fill="none" stroke="${hill.light}" stroke-width="5" opacity="0.7"/>
    ${rows[depth].map(([x, y, s, seed]) => tree(x, y, s, foliage, seed)).join('')}
  </g>
</svg>`;
};

/* ------------------------------------------------------------------ *
 * Sky
 * ------------------------------------------------------------------ */

/** Puffy clay clouds; four silhouettes so the sky never looks tiled. */
export const cloud = (variant) => {
  const lumps = [
    [[74, 80, 54], [142, 62, 68], [214, 78, 50], [152, 98, 60]],
    [[82, 86, 46], [148, 60, 62], [206, 72, 44], [258, 88, 38]],
    [[66, 76, 44], [124, 58, 58], [188, 74, 46]],
    [[92, 92, 58], [172, 66, 74], [252, 86, 52], [316, 94, 40]],
  ][variant];
  const width = Math.max(...lumps.map(([x, , r]) => x + r)) + 40;
  const body = lumps.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  const highlight = lumps
    .map(([x, y, r]) => `<circle cx="${x - r * 0.24}" cy="${y - r * 0.32}" r="${r * 0.58}"/>`)
    .join('');
  const underside = lumps
    .map(([x, y, r]) => `<circle cx="${x + r * 0.16}" cy="${y + r * 0.34}" r="${r * 0.52}"/>`)
    .join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 175" width="${width}" height="175">
  <defs>
    ${grain(`c-grain-${variant}`, { frequency: 1.05, strength: 0.3, seed: variant + 2 })}
    ${softShadow(`c-shadow-${variant}`, { dx: 2, dy: 9, blur: 10, color: '#93856F', opacity: 0.28 })}
    ${blur(`c-soft-${variant}`, 11)}
    <linearGradient id="c-body-${variant}" x1="0.25" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#FBF6EB"/>
      <stop offset="1" stop-color="#E6DCC8"/>
    </linearGradient>
  </defs>
  <g filter="url(#c-shadow-${variant})">
    <g filter="url(#c-grain-${variant})" fill="url(#c-body-${variant})">
      ${body}
      <rect x="30" y="90" width="${width - 70}" height="58" rx="29"/>
    </g>
  </g>
  <g fill="#FFFFFF" opacity="0.6" filter="url(#c-soft-${variant})">${highlight}</g>
  <g fill="#CFC3AC" opacity="0.3" filter="url(#c-soft-${variant})">${underside}</g>
</svg>`;
};

/**
 * The sun: a matte disc behind a wheel of long, fine, tapering rays. The
 * reference has far more of them, and far thinner, than a chunky sunburst.
 */
export const sun = () => {
  const cx = 300;
  const cy = 300;
  const rays = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    const long = i % 2 === 0;
    const inner = 132;
    const outer = long ? 282 : 236;
    const halfWidth = long ? 0.0075 : 0.006;
    const p = (radius, offset) => [
      (cx + Math.cos(a + offset) * radius).toFixed(1),
      (cy + Math.sin(a + offset) * radius).toFixed(1),
    ];
    const [x1, y1] = p(inner, -halfWidth * 3);
    const [x2, y2] = p(inner, halfWidth * 3);
    const [x3, y3] = p(outer, halfWidth);
    const [x4, y4] = p(outer, -halfWidth);
    return `<path d="M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z"/>`;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    ${grain('s-grain', { frequency: 0.95, strength: 0.36, seed: 9 })}
    ${softShadow('s-shadow', { dx: 0, dy: 10, blur: 16, color: '#C79A2A', opacity: 0.34 })}
    ${blur('s-soft', 16)}
    <radialGradient id="s-face" cx="0.34" cy="0.28" r="0.85">
      <stop offset="0" stop-color="#FFF4CD"/>
      <stop offset="0.5" stop-color="${GOLD.base}"/>
      <stop offset="1" stop-color="${GOLD.shade}"/>
    </radialGradient>
    <linearGradient id="s-ray" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F8D66A"/>
      <stop offset="1" stop-color="#EFC047"/>
    </linearGradient>
  </defs>

  <g fill="url(#s-ray)" opacity="0.9">${rays}</g>
  <g filter="url(#s-shadow)">
    <circle cx="${cx}" cy="${cy}" r="128" fill="url(#s-face)" filter="url(#s-grain)"/>
  </g>
  <ellipse cx="${cx - 42}" cy="${cy - 46}" rx="50" ry="42" fill="#FFF9DE" opacity="0.5" filter="url(#s-soft)"/>
</svg>`;
};

export const moon = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" width="360" height="360">
  <defs>
    ${grain('mn-grain', { frequency: 1, strength: 0.3, seed: 5 })}
    ${blur('mn-soft', 7)}
    <radialGradient id="mn-face" cx="0.34" cy="0.28" r="0.85">
      <stop offset="0" stop-color="#FFFCF2"/>
      <stop offset="0.55" stop-color="#F2E7D0"/>
      <stop offset="1" stop-color="#CDBEA0"/>
    </radialGradient>
    <filter id="mn-shadow" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#0B1622" flood-opacity="0.5"/>
    </filter>
  </defs>
  <g filter="url(#mn-shadow)">
    <circle cx="180" cy="180" r="128" fill="url(#mn-face)" filter="url(#mn-grain)"/>
    <g fill="#D8C9A9" opacity="0.5" filter="url(#mn-soft)">
      <circle cx="146" cy="152" r="26"/>
      <circle cx="214" cy="206" r="19"/>
      <circle cx="160" cy="228" r="14"/>
      <circle cx="226" cy="140" r="11"/>
    </g>
    <ellipse cx="142" cy="140" rx="42" ry="34" fill="#FFFEF8" opacity="0.5" filter="url(#mn-soft)"/>
  </g>
</svg>`;

/* ------------------------------------------------------------------ *
 * Card ornaments
 * ------------------------------------------------------------------ */

/**
 * The mihrab relief pressed into the countdown card.
 *
 * It has no colour of its own: it is highlight and shadow only, so it takes the
 * colour of whatever it is laid over. An ogee arch over a panel of eight-point
 * stars, on a stepped plinth.
 */
export const arch = () => {
  // A true ogee: shoulders that rise, turn concave, and meet at a point.
  const outer = `M 62 512 L 62 300
    C 62 212, 94 148, 148 126
    C 188 110, 208 88, 214 28
    C 220 88, 240 110, 280 126
    C 334 148, 366 212, 366 300
    L 366 512 Z`;
  const inner = `M 100 484 L 100 308
    C 100 234, 126 180, 170 160
    C 199 147, 210 120, 214 74
    C 218 120, 229 147, 258 160
    C 302 180, 328 234, 328 308
    L 328 484 Z`;

  // Eight-point stars from two overlapping squares - the traditional khatam
  // construction - tiled across the panel. Coarse and faint: at this size a
  // fine grid reads as mesh rather than as a carved pattern.
  const step = 58;
  const half = 28;
  const lattice = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      const cx = 100 + col * step;
      const cy = 150 + row * step;
      lattice.push(
        `<rect x="${cx - half}" y="${cy - half}" width="${half * 2}" height="${half * 2}"/>`,
        `<rect x="${cx - half}" y="${cy - half}" width="${half * 2}" height="${half * 2}" transform="rotate(45 ${cx} ${cy})"/>`,
      );
    }
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 428 560" width="428" height="560">
  <defs>
    ${blur('a-soft', 3)}
    ${blur('a-wide', 8)}
    <clipPath id="a-panel"><path d="${inner}"/></clipPath>
    <linearGradient id="a-face" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.14"/>
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.16"/>
    </linearGradient>
    <linearGradient id="a-step" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.13"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.15"/>
    </linearGradient>
  </defs>

  <!-- plinth -->
  <rect x="26" y="516" width="376" height="34" rx="14" fill="url(#a-step)"/>
  <rect x="52" y="486" width="324" height="32" rx="13" fill="url(#a-step)"/>

  <!-- arch face, raised -->
  <path d="${outer}" fill="url(#a-face)"/>
  <path d="${outer}" fill="none" stroke="#FFFFFF" stroke-opacity="0.17" stroke-width="3" filter="url(#a-soft)"/>

  <!-- recessed panel: dark fill, soft inner shadow, light lower lip -->
  <path d="${inner}" fill="#000000" opacity="0.12"/>
  <path d="${inner}" fill="none" stroke="#000000" stroke-opacity="0.22" stroke-width="9" filter="url(#a-wide)"/>
  <path d="${inner}" fill="none" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="2.5"/>

  <!-- lattice, clipped to the panel -->
  <g clip-path="url(#a-panel)">
    <g fill="none" stroke="#000000" stroke-opacity="0.13" stroke-width="3" transform="translate(0,2)">
      ${lattice.join('')}
    </g>
    <g fill="none" stroke="#FFFFFF" stroke-opacity="0.11" stroke-width="2.2">
      ${lattice.join('')}
    </g>
  </g>
</svg>`;
};

/** Potted plant: broad veined leaves in a ribbed cream pot. */
export const plant = () => {
  const leaf = (cx, cy, len, wide, angle, fill, vein) => `
    <g transform="rotate(${angle} ${cx} ${cy})">
      <path d="M ${cx} ${cy} C ${cx - wide * 1.05} ${cy - len * 0.3}, ${cx - wide * 0.92} ${cy - len * 0.84}, ${cx} ${cy - len}
               C ${cx + wide * 0.92} ${cy - len * 0.84}, ${cx + wide * 1.05} ${cy - len * 0.3}, ${cx} ${cy} Z" fill="${fill}"/>
      <path d="M ${cx} ${cy - len * 0.06} L ${cx} ${cy - len * 0.9}" stroke="${vein}" stroke-width="3.5"
            stroke-linecap="round" opacity="0.55"/>
    </g>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 420" width="340" height="420">
  <defs>
    ${grain('p-grain', { frequency: 1, strength: 0.32, seed: 4 })}
    ${softShadow('p-shadow', { dx: 4, dy: 10, blur: 12, color: '#7C6B4C', opacity: 0.32 })}
    ${blur('p-soft', 8)}
    <linearGradient id="p-pot" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="${CREAM.light}"/>
      <stop offset="0.55" stop-color="${CREAM.base}"/>
      <stop offset="1" stop-color="${CREAM.shade}"/>
    </linearGradient>
    <linearGradient id="p-rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFAEE"/>
      <stop offset="1" stop-color="${CREAM.mid}"/>
    </linearGradient>
  </defs>

  <g filter="url(#p-shadow)">
    <g filter="url(#p-grain)">
      ${leaf(170, 258, 166, 52, -36, '#6E9153', '#4E6C39')}
      ${leaf(170, 258, 154, 50, 34, '#5F8248', '#436031')}
      ${leaf(170, 262, 128, 46, -70, '#7FA162', '#5B7C44')}
      ${leaf(170, 262, 122, 44, 68, '#547A41', '#3C5A2C')}
      ${leaf(170, 256, 180, 48, -4, '#749A57', '#52743C')}

      <!-- pot -->
      <path d="M 104 286 L 236 286 L 218 388 C 216 402, 206 410, 192 410 L 148 410
               C 134 410, 124 402, 122 388 Z" fill="url(#p-pot)"/>
      <rect x="92" y="264" width="156" height="34" rx="15" fill="url(#p-rim)"/>
    </g>
    <path d="M 128 304 C 122 338, 124 366, 132 394" stroke="#FFFDF5" stroke-opacity="0.55"
          stroke-width="13" stroke-linecap="round" fill="none" filter="url(#p-soft)"/>
    <path d="M 212 306 C 216 338, 214 364, 208 390" stroke="${CREAM.deep}" stroke-opacity="0.3"
          stroke-width="12" stroke-linecap="round" fill="none" filter="url(#p-soft)"/>
  </g>
</svg>`;
};

export const birds = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" width="240" height="90">
  <g fill="none" stroke="#6F7C74" stroke-width="4" stroke-linecap="round" opacity="0.7">
    <path d="M14 40 q 14 -13 26 0 q 12 -13 26 0"/>
    <path d="M96 20 q 10 -9 19 0 q 9 -9 19 0"/>
    <path d="M160 56 q 12 -11 22 0 q 11 -11 22 0"/>
  </g>
</svg>`;

export const LAYERS = {
  mosque: { svg: mosque, width: 900 },
  'mosque-glow': { svg: mosqueGlow, width: 900 },
  'hills-back': { svg: () => hills('back'), width: 1600 },
  'hills-mid': { svg: () => hills('mid'), width: 1600 },
  'hills-front': { svg: () => hills('front'), width: 1600 },
  'cloud-1': { svg: () => cloud(0), width: 320 },
  'cloud-2': { svg: () => cloud(1), width: 340 },
  'cloud-3': { svg: () => cloud(2), width: 280 },
  'cloud-4': { svg: () => cloud(3), width: 400 },
  sun: { svg: sun, width: 600 },
  moon: { svg: moon, width: 360 },
  arch: { svg: arch, width: 428 },
  plant: { svg: plant, width: 340 },
  birds: { svg: birds, width: 240 },
};
