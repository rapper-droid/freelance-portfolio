/**
 * TANEBI category key visuals.
 *
 * Generated here rather than sourced or prompted. Three reasons, in order:
 * they are rights-clean because we make them; they are consistent by
 * construction because every one is the same composition grammar with a
 * different motif; and they cost nothing, which matters because the standing
 * instruction for this project is zero additional spend.
 *
 * The grammar, fixed for all of them:
 *   - the master icon's own field colour as the ground
 *   - one ember light source, always from the upper right
 *   - a motif drawn in warm line work at low opacity, never competing with
 *     the heading that sits over it
 *   - a fine grain so large flat areas do not band on dark screens
 *
 * These are ATMOSPHERE, not information. Nothing here is the only place a
 * fact appears, and every use carries an empty alt: the page states its own
 * category in text directly beside the image.
 *
 * Run: node scripts/generate-keyvisuals.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";

const W = 1200;
const H = 620;
const OUT = "public/visuals";

// Measured from the master icon; see docs/BRAND_ICON.md.
const FIELD = "#0e0906";
const EMBER = "#fcbe69";
const WARM = "#f0e9e0";

/** Line work shared by every motif, so the set reads as one family. */
const line = (d, o = 0.5, w = 1.2) =>
  `<path d="${d}" fill="none" stroke="${WARM}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;
const rect = (x, y, w, h, o = 0.4, r = 6) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${WARM}" stroke-width="1.2" opacity="${o}"/>`;
const dot = (x, y, r = 5, o = 0.9, c = EMBER) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`;

/** Each motif is a short visual sentence about what that category does. */
const MOTIFS = {
  // pages stacking into a site
  web: [
    rect(180, 150, 420, 300, 0.22),
    rect(230, 190, 420, 300, 0.34),
    rect(280, 230, 420, 300, 0.5),
    line("M320 280h300M320 320h220M320 360h260", 0.4),
    dot(300, 250, 4),
  ],
  // one page, one message, one action
  lp: [
    rect(400, 110, 300, 420, 0.45),
    line("M440 190h220", 0.55, 3),
    line("M440 240h150M440 280h190", 0.32),
    rect(440, 370, 180, 46, 0.7, 23),
    dot(560, 393, 5),
  ],
  // a grid of things to buy
  ec: [
    ...[0, 1, 2].flatMap((c) =>
      [0, 1].map((r) => rect(300 + c * 200, 170 + r * 190, 160, 150, 0.35)),
    ),
    line("M320 480h120", 0.5),
    dot(700, 245, 6),
  ],
  // a window with a working panel in it
  apps: [
    rect(240, 140, 620, 340, 0.45),
    line("M240 190h620", 0.35),
    line("M370 190v290", 0.35),
    line("M280 230h50M280 265h50M280 300h50", 0.3),
    line("M410 240h180M410 285h300M410 330h240M410 375h160", 0.3),
    dot(272, 165, 4, 0.8),
  ],
  // things arriving, being sorted, moving on
  automation: [
    line("M180 310h150", 0.35),
    line("M420 310h130", 0.35),
    line("M640 310h130", 0.35),
    line("M860 310h140", 0.35),
    dot(375, 310, 14, 0.18),
    dot(375, 310, 6),
    dot(595, 310, 14, 0.18),
    dot(595, 310, 6),
    dot(815, 310, 14, 0.18),
    dot(815, 310, 6),
    line("M375 310c60-90 160-90 220 0s160 90 220 0", 0.28),
  ],
  // two systems joined
  api: [
    rect(200, 220, 220, 180, 0.4, 12),
    rect(780, 220, 220, 180, 0.4, 12),
    line("M420 280h360M420 340h360", 0.3),
    dot(600, 280, 6),
    dot(600, 340, 6, 0.5),
    line("M470 310h260", 0.5, 2),
  ],
  // shapes finding an arrangement
  design: [
    `<circle cx="470" cy="300" r="130" fill="none" stroke="${WARM}" stroke-width="1.2" opacity="0.4"/>`,
    rect(560, 200, 200, 200, 0.4, 10),
    line("M380 430h400", 0.3),
    dot(560, 300, 7),
  ],
  // checks passing
  qa: [
    ...[0, 1, 2, 3].map((i) => rect(300 + i * 150, 250, 110, 110, 0.32, 10)),
    line("M330 305l18 18 32-36", 0.75, 2.4),
    line("M480 305l18 18 32-36", 0.6, 2.4),
    line("M630 305l18 18 32-36", 0.45, 2.4),
    dot(835, 305, 5),
  ],
};

/** Motifs reused for the categories that share a shape. */
const ALIASES = {
  coding: "web",
  nextjs: "apps",
  responsive: "web",
  improvement: "design",
};

const svg = (
  motif,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="78%" cy="18%" r="72%">
      <stop offset="0%" stop-color="${EMBER}" stop-opacity="0.30"/>
      <stop offset="45%" stop-color="${EMBER}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${EMBER}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${FIELD}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${FIELD}" stop-opacity="0.85"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${FIELD}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g>${motif.join("")}</g>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5"/>
</svg>`;

await fs.mkdir(OUT, { recursive: true });
const keys = [...Object.keys(MOTIFS), ...Object.keys(ALIASES)];
let total = 0;
for (const key of keys) {
  const motif = MOTIFS[key] ?? MOTIFS[ALIASES[key]];
  const file = `${OUT}/kv-${key}.webp`;
  // Quality 72 is well past the point where these read as clean on a dark
  // screen, and keeps the whole set smaller than one photograph.
  const buf = await sharp(Buffer.from(svg(motif)))
    .webp({ quality: 72, effort: 6 })
    .toBuffer();
  await fs.writeFile(file, buf);
  total += buf.length;
  console.log(`  ${file.padEnd(34)} ${String(buf.length).padStart(6)} bytes`);
}
console.log(
  `\n${keys.length} key visuals, ${(total / 1024).toFixed(0)}KB total`,
);
