/**
 * Source art for the clay scene.
 *
 * Every layer is authored here as SVG and rasterised to transparent WebP by
 * build-scene.mjs. The clay look comes from three things applied consistently:
 * a soft two-stop gradient across each form, a blurred inner highlight at the
 * top-left, and a wide low-opacity drop shadow. Nothing uses a hard edge.
 */

/** Shared gradient + filter definitions, parameterised per palette. */
const clayDefs = (id, { light, base, shade, deep }) => `
  <linearGradient id="${id}-body" x1="0.15" y1="0" x2="0.85" y2="1">
    <stop offset="0" stop-color="${light}"/>
    <stop offset="0.55" stop-color="${base}"/>
    <stop offset="1" stop-color="${shade}"/>
  </linearGradient>
  <radialGradient id="${id}-dome" cx="0.34" cy="0.24" r="0.85">
    <stop offset="0" stop-color="${light}"/>
    <stop offset="0.5" stop-color="${base}"/>
    <stop offset="1" stop-color="${deep}"/>
  </radialGradient>
  <linearGradient id="${id}-deep" x1="0" y1="0" x2="0.6" y2="1">
    <stop offset="0" stop-color="${shade}"/>
    <stop offset="1" stop-color="${deep}"/>
  </linearGradient>
  <filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="6" dy="12" stdDeviation="14" flood-color="${deep}" flood-opacity="0.38"/>
  </filter>
  <filter id="${id}-inner" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
  <filter id="${id}-glow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="16"/>
  </filter>`;

const CREAM = { light: '#FDF6E8', base: '#F0E2C8', shade: '#DCC7A4', deep: '#B79E77' };
const GREEN = { light: '#B9CBA4', base: '#8CA778', shade: '#5F7A50', deep: '#3D5636' };
const DARKGREEN = { light: '#7E9B6C', base: '#5A7A4C', shade: '#3E5A36', deep: '#283B24' };
const GOLD = { light: '#FBE6A6', base: '#EFC65C', shade: '#D9A233', deep: '#A97A1E' };

/* ------------------------------------------------------------------ */

export const mosque = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 760" width="900" height="760">
  <defs>
    ${clayDefs('m', CREAM)}
    ${clayDefs('g', GOLD)}
    <linearGradient id="window-lit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#B9A382"/>
      <stop offset="1" stop-color="#8C7355"/>
    </linearGradient>
  </defs>

  <g filter="url(#m-soft)">
    <!-- main hall -->
    <rect x="150" y="430" width="470" height="300" rx="30" fill="url(#m-body)"/>
    <!-- side wings -->
    <rect x="96" y="520" width="80" height="210" rx="26" fill="url(#m-deep)" opacity="0.85"/>
    <rect x="600" y="520" width="86" height="210" rx="26" fill="url(#m-deep)" opacity="0.85"/>

    <!-- drum + main dome -->
    <rect x="270" y="368" width="228" height="80" rx="22" fill="url(#m-body)"/>
    <path d="M384 150 C 512 150 552 268 552 372 L 216 372 C 216 268 256 150 384 150 Z" fill="url(#m-dome)"/>
    <!-- dome highlight -->
    <path d="M330 200 C 300 246 288 300 288 350" stroke="#FFFBF0" stroke-opacity="0.55" stroke-width="26"
          stroke-linecap="round" fill="none" filter="url(#m-inner)"/>
    <!-- dome underside shade -->
    <path d="M470 210 C 512 262 524 320 524 366 L 470 366 Z" fill="${CREAM.deep}" opacity="0.22" filter="url(#m-inner)"/>

    <!-- small domes -->
    <path d="M188 452 C 232 452 246 494 246 524 L 130 524 C 130 494 144 452 188 452 Z" fill="url(#m-dome)"/>
    <path d="M642 452 C 686 452 700 494 700 524 L 584 524 C 584 494 598 452 642 452 Z" fill="url(#m-dome)"/>

    <!-- minaret -->
    <rect x="742" y="230" width="74" height="500" rx="26" fill="url(#m-body)"/>
    <rect x="730" y="352" width="98" height="34" rx="16" fill="url(#m-deep)"/>
    <path d="M779 96 L 828 236 L 730 236 Z" fill="url(#m-dome)"/>
    <rect x="762" y="252" width="34" height="84" rx="16" fill="${CREAM.deep}" opacity="0.28"/>
  </g>

  <!-- arched openings; these are the windows that light up at night -->
  <g id="windows">
    <path d="M385 520 C 425 520 442 552 442 588 L 442 700 L 328 700 L 328 588 C 328 552 345 520 385 520 Z" fill="url(#window-lit)"/>
    <path d="M232 592 C 258 592 270 614 270 638 L 270 700 L 194 700 L 194 638 C 194 614 206 592 232 592 Z" fill="url(#window-lit)"/>
    <path d="M540 592 C 566 592 578 614 578 638 L 578 700 L 502 700 L 502 638 C 502 614 514 592 540 592 Z" fill="url(#window-lit)"/>
    <path d="M779 268 C 792 268 798 280 798 294 L 798 330 L 760 330 L 760 294 C 760 280 766 268 779 268 Z" fill="url(#window-lit)"/>
  </g>

  <!-- finials -->
  <g fill="url(#g-body)" filter="url(#g-soft)">
    <path d="M384 92 a30 30 0 1 0 26 45 a24 24 0 1 1 -20 -37 a30 30 0 0 1 -6 -8 Z"/>
    <path d="M779 44 a22 22 0 1 0 19 33 a18 18 0 1 1 -15 -27 a22 22 0 0 1 -4 -6 Z"/>
  </g>
</svg>`;

/** Just the lit windows, drawn again so they can be glowed on top at night. */
export const mosqueGlow = () => {
  const full = mosque();
  const windows = full.slice(full.indexOf('<g id="windows">'), full.indexOf('<!-- finials -->'));
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 760" width="900" height="760">
  <defs>
    <linearGradient id="window-lit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF0BE"/>
      <stop offset="1" stop-color="#F2B13F"/>
    </linearGradient>
    <filter id="bloom" x="-120%" y="-120%" width="340%" height="340%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
  </defs>
  <g opacity="0.85" filter="url(#bloom)">${windows}</g>
  ${windows}
</svg>`;
};

/**
 * A clump of rounded treetops sitting on the ridge. They are deliberately two
 * steps darker than the hill they stand on, otherwise the whole band reads as
 * one flat silhouette at a distance.
 */
const treeCluster = (x, y, scale, tree, seed, count = 6) => {
  const r = (n) => ((Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  let out = '';
  for (let i = 0; i < count; i++) {
    const tx = x + (r(i) - 0.5) * 190 * scale;
    const rad = (30 + r(i + 3) * 26) * scale;
    // Sit each canopy on the ridge rather than floating above it.
    const ty = y - rad * 0.55 + (r(i + 9) - 0.5) * 14 * scale;
    out += `<ellipse cx="${tx.toFixed(1)}" cy="${(ty + rad * 0.72).toFixed(1)}" rx="${(rad * 0.9).toFixed(1)}" ry="${(rad * 0.3).toFixed(1)}" fill="${tree.deep}" opacity="0.28"/>`;
    out += `<ellipse cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" rx="${(rad * 0.92).toFixed(1)}" ry="${rad.toFixed(1)}" fill="${tree.base}"/>`;
    out += `<ellipse cx="${(tx - rad * 0.28).toFixed(1)}" cy="${(ty - rad * 0.34).toFixed(1)}" rx="${(rad * 0.46).toFixed(1)}" ry="${(rad * 0.4).toFixed(1)}" fill="${tree.light}" opacity="0.6"/>`;
    out += `<ellipse cx="${(tx + rad * 0.34).toFixed(1)}" cy="${(ty + rad * 0.3).toFixed(1)}" rx="${(rad * 0.4).toFixed(1)}" ry="${(rad * 0.34).toFixed(1)}" fill="${tree.shade}" opacity="0.45"/>`;
  }
  return out;
};

/**
 * Three hill bands. Back is hazy and pale, front is saturated and carries the
 * trees; the parallax in the scene component moves them at different rates.
 */
export const hills = (depth) => {
  const palettes = {
    back: { light: '#CBD9BA', base: '#AFC49B', shade: '#8FAA7C', deep: '#6B855C' },
    mid: { light: '#AFC698', base: '#8FAC77', shade: '#6C8C59', deep: '#4E6B40' },
    front: { light: '#8FAC76', base: '#6C8C56', shade: '#4C6C3D', deep: '#33512A' },
  };
  const trees = {
    back: { light: '#9FB98C', base: '#7E9C6C', shade: '#5F7D51', deep: '#43603A' },
    mid: { light: '#84A46F', base: '#628A50', shade: '#456A38', deep: '#2E4B26' },
    front: { light: '#638C4D', base: '#456B34', shade: '#2F4F25', deep: '#1D371A' },
  };
  const p = palettes[depth];
  const t = trees[depth];
  // A tight 1600x220 artboard: the ridge sits near the top of the frame so the
  // band can be laid low on the screen without cropping the hilltops away.
  const shapes = {
    back: 'M0 88 C 180 40 330 56 470 76 C 620 98 760 46 960 60 C 1160 74 1330 42 1600 66 L 1600 220 L 0 220 Z',
    mid: 'M0 112 C 220 62 340 96 520 112 C 700 128 830 82 1020 96 C 1210 110 1400 74 1600 98 L 1600 220 L 0 220 Z',
    front: 'M0 142 C 240 100 420 132 640 142 C 860 152 1060 118 1290 134 C 1420 142 1520 136 1600 130 L 1600 220 L 0 220 Z',
  };
  const treeRows = {
    back: [[180, 52, 0.42, 1], [520, 74, 0.4, 2], [900, 58, 0.44, 3], [1290, 50, 0.4, 11]],
    mid: [[300, 80, 0.6, 4], [740, 120, 0.62, 5], [1140, 100, 0.56, 6], [1480, 90, 0.54, 12]],
    front: [[130, 118, 0.78, 7], [520, 142, 0.82, 8], [980, 146, 0.76, 9], [1420, 132, 0.72, 10]],
  };
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 220" width="1600" height="220">
  <defs>
    <linearGradient id="h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.light}"/>
      <stop offset="0.45" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.shade}"/>
    </linearGradient>
    <filter id="hs" x="-10%" y="-60%" width="120%" height="240%">
      <feDropShadow dx="0" dy="-5" stdDeviation="8" flood-color="${p.deep}" flood-opacity="0.3"/>
    </filter>
  </defs>
  <path d="${shapes[depth]}" fill="url(#h)" filter="url(#hs)"/>
  <!-- rim light along the ridge, the way light catches the top of a clay slab -->
  <path d="${shapes[depth]}" fill="none" stroke="${p.light}" stroke-width="6" opacity="0.6"/>
  <g>
    ${treeRows[depth].map(([x, y, s, seed]) => treeCluster(x, y, s, t, seed)).join('')}
  </g>
</svg>`;
};

/** Puffy clay clouds; four silhouettes so the sky never looks tiled. */
export const cloud = (variant) => {
  const lumps = [
    [[70, 78, 56], [140, 62, 68], [214, 76, 50], [150, 96, 62]],
    [[80, 84, 48], [148, 60, 62], [206, 70, 44], [258, 86, 38]],
    [[64, 74, 44], [124, 58, 58], [188, 72, 46]],
    [[90, 90, 60], [170, 66, 74], [252, 84, 54], [316, 92, 40]],
  ][variant];
  const width = Math.max(...lumps.map(([x, , r]) => x + r)) + 40;
  const body = lumps
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
    .join('');
  const highlight = lumps
    .map(([x, y, r]) => `<circle cx="${x - r * 0.22}" cy="${y - r * 0.3}" r="${r * 0.62}"/>`)
    .join('');
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 170" width="${width}" height="170">
  <defs>
    <linearGradient id="c" x1="0.2" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.6" stop-color="#F4EEE2"/>
      <stop offset="1" stop-color="#DED4C2"/>
    </linearGradient>
    <filter id="cs" x="-40%" y="-40%" width="180%" height="200%">
      <feDropShadow dx="2" dy="10" stdDeviation="10" flood-color="#8E8271" flood-opacity="0.3"/>
    </filter>
    <filter id="cb" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>
  <g filter="url(#cs)" fill="url(#c)">${body}
    <rect x="30" y="88" width="${width - 70}" height="60" rx="30"/>
  </g>
  <g fill="#FFFFFF" opacity="0.55" filter="url(#cb)">${highlight}</g>
</svg>`;
};

export const sun = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420" width="420" height="420">
  <defs>
    ${clayDefs('s', GOLD)}
    <radialGradient id="s-face" cx="0.36" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#FFF3C4"/>
      <stop offset="0.5" stop-color="#F5CB5C"/>
      <stop offset="1" stop-color="#DFA531"/>
    </radialGradient>
  </defs>
  <g filter="url(#s-soft)">
    ${Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      const x1 = 210 + Math.cos(a) * 138;
      const y1 = 210 + Math.sin(a) * 138;
      const x2 = 210 + Math.cos(a) * 196;
      const y2 = 210 + Math.sin(a) * 196;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#F2CF74" stroke-width="13" stroke-linecap="round" opacity="0.85"/>`;
    }).join('')}
    <circle cx="210" cy="210" r="132" fill="url(#s-face)"/>
    <ellipse cx="168" cy="166" rx="52" ry="44" fill="#FFF8DC" opacity="0.5" filter="url(#s-inner)"/>
  </g>
</svg>`;

export const moon = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" width="360" height="360">
  <defs>
    <radialGradient id="mn" cx="0.34" cy="0.28" r="0.85">
      <stop offset="0" stop-color="#FFFBEF"/>
      <stop offset="0.55" stop-color="#F1E6CE"/>
      <stop offset="1" stop-color="#CDBE9E"/>
    </radialGradient>
    <filter id="mn-s" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#0B1622" flood-opacity="0.5"/>
    </filter>
    <filter id="mn-b" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="7"/>
    </filter>
  </defs>
  <g filter="url(#mn-s)">
    <circle cx="180" cy="180" r="128" fill="url(#mn)"/>
    <g fill="#D9CBAC" opacity="0.55" filter="url(#mn-b)">
      <circle cx="146" cy="152" r="26"/>
      <circle cx="214" cy="206" r="19"/>
      <circle cx="160" cy="228" r="14"/>
      <circle cx="226" cy="140" r="11"/>
    </g>
    <ellipse cx="142" cy="140" rx="42" ry="34" fill="#FFFDF6" opacity="0.5" filter="url(#mn-b)"/>
  </g>
</svg>`;

/** The mihrab relief pressed into the countdown card. */
export const arch = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 560" width="420" height="560">
  <defs>
    <linearGradient id="a-body" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.16"/>
    </linearGradient>
    <filter id="a-emb" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>
  <g>
    <rect x="40" y="500" width="340" height="46" rx="18" fill="url(#a-body)"/>
    <rect x="66" y="462" width="288" height="42" rx="16" fill="url(#a-body)"/>
    <path d="M210 44 C 300 44 336 116 336 196 L 336 470 L 84 470 L 84 196 C 84 116 120 44 210 44 Z"
          fill="url(#a-body)"/>
    <path d="M210 96 C 278 96 300 152 300 208 L 300 440 L 120 440 L 120 208 C 120 152 142 96 210 96 Z"
          fill="#000000" opacity="0.1"/>
    <path d="M210 96 C 278 96 300 152 300 208 L 300 440 L 120 440 L 120 208 C 120 152 142 96 210 96 Z"
          fill="none" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="3" filter="url(#a-emb)"/>
    <!-- eight-point star lattice -->
    <g stroke="#FFFFFF" stroke-opacity="0.13" stroke-width="3" fill="none">
      ${Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 3 }, (_, col) => {
          const cx = 150 + col * 60;
          const cy = 180 + row * 62;
          return `<rect x="${cx - 21}" y="${cy - 21}" width="42" height="42" transform="rotate(45 ${cx} ${cy})"/><rect x="${cx - 21}" y="${cy - 21}" width="42" height="42"/>`;
        }).join(''),
      ).join('')}
    </g>
  </g>
</svg>`;

export const plant = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" width="320" height="400">
  <defs>
    ${clayDefs('p', CREAM)}
    <linearGradient id="leaf" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#A9C48F"/>
      <stop offset="0.55" stop-color="#7D9E68"/>
      <stop offset="1" stop-color="#4F7043"/>
    </linearGradient>
  </defs>
  <g filter="url(#p-soft)">
    <g fill="url(#leaf)">
      <path d="M160 210 C 96 196 62 138 78 78 C 140 84 176 132 168 200 Z"/>
      <path d="M168 214 C 232 196 268 142 250 84 C 190 92 156 142 164 206 Z"/>
      <path d="M162 216 C 116 250 74 244 50 206 C 92 176 140 180 160 210 Z"/>
      <path d="M168 220 C 214 252 258 246 282 208 C 240 178 190 184 170 214 Z"/>
      <path d="M164 216 C 158 156 176 108 210 74 C 226 128 210 186 172 218 Z" opacity="0.9"/>
    </g>
    <path d="M96 268 L 224 268 L 206 372 C 204 386 194 394 180 394 L 140 394 C 126 394 116 386 114 372 Z" fill="url(#p-body)"/>
    <rect x="84" y="248" width="152" height="34" rx="16" fill="url(#p-dome)"/>
    <path d="M116 286 C 110 320 112 350 120 378" stroke="#FFFDF4" stroke-opacity="0.5" stroke-width="14"
          stroke-linecap="round" fill="none" filter="url(#p-inner)"/>
  </g>
</svg>`;

export const birds = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" width="240" height="90">
  <g fill="none" stroke="#6F7C74" stroke-width="4" stroke-linecap="round" opacity="0.75">
    <path d="M14 40 q 14 -14 26 0 q 12 -14 26 0"/>
    <path d="M96 20 q 10 -10 19 0 q 9 -10 19 0"/>
    <path d="M160 56 q 12 -12 22 0 q 11 -12 22 0"/>
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
  sun: { svg: sun, width: 420 },
  moon: { svg: moon, width: 360 },
  arch: { svg: arch, width: 420 },
  plant: { svg: plant, width: 320 },
  birds: { svg: birds, width: 240 },
};
