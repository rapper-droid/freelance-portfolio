/**
 * TANEBI MASTER BRAND ICON — derivative generator.
 *
 * Every icon this project ships is produced here, from one file:
 *
 *   assets/brand/tanebi-master-icon.jpeg
 *
 * Nothing is redrawn. The only operations are crop, resize, pad and format
 * conversion, so a favicon and a 512px app icon are provably the same mark.
 * If a size loses detail, the answer is a tighter crop of the master, never a
 * simplified redraw — a second drawing would be a second brand.
 *
 * Run: node scripts/generate-icons.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MASTER = "assets/brand/tanebi-master-icon.jpeg";

/** Measured from the master itself; see docs/BRAND_ICON.md. */
const BASE = { r: 0x0e, g: 0x09, b: 0x06 };

await fs.access(MASTER).catch(() => {
  console.error(`MASTER ICON not found: ${MASTER}`);
  console.error("Place the original there. Do not substitute another image.");
  process.exit(1);
});

const master = sharp(MASTER);
const { width, height } = await master.metadata();
if (width !== height) {
  console.warn(`master is ${width}x${height}; expected a square. Continuing.`);
}

/**
 * Find where the artwork actually starts.
 *
 * The master is a glowing mark on a wide near-black field. At 16px that field
 * eats most of the pixels and the mark turns to mush, so the small sizes get a
 * crop that removes the dead margin. Measuring it beats hard-coding a guess:
 * re-exporting the master at different padding would silently break a constant.
 */
async function artBounds() {
  const probe = 256;
  const raw = await sharp(MASTER)
    .resize(probe, probe, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
  const lum = (i) =>
    0.2126 * raw[i] + 0.7152 * raw[i + 1] + 0.0722 * raw[i + 2];
  // The field sits near L=9. Anything clearly above it is glow or mark.
  const THRESHOLD = 34;
  let minX = probe,
    minY = probe,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < probe; y++) {
    for (let x = 0; x < probe; x++) {
      if (lum((y * probe + x) * 3) > THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { left: 0, top: 0, size: width };
  // Square it up around the centre so the mark never skews.
  const cx = ((minX + maxX) / 2 / probe) * width;
  const cy = ((minY + maxY) / 2 / probe) * height;
  const half = (Math.max(maxX - minX, maxY - minY) / 2 / probe) * width;
  return { cx, cy, half };
}

const bounds = await artBounds();

/**
 * Crop the master to the artwork plus `margin` (as a fraction of the art size).
 * margin 0 hugs the glow; 0.5 keeps the master's own airy framing.
 */
function cropped(margin) {
  if (bounds.half === undefined) return sharp(MASTER);
  const half = Math.min(
    bounds.half * (1 + margin),
    Math.min(bounds.cx, bounds.cy, width - bounds.cx, height - bounds.cy),
  );
  return sharp(MASTER).extract({
    left: Math.round(bounds.cx - half),
    top: Math.round(bounds.cy - half),
    width: Math.round(half * 2),
    height: Math.round(half * 2),
  });
}

const out = async (file, buf) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buf);
  console.log(`  ${file.padEnd(40)} ${String(buf.length).padStart(7)} bytes`);
};

/**
 * Flatten onto the master's own field colour so no icon ships transparency.
 *
 * ensureAlpha still adds an opaque alpha channel afterwards: the field is
 * already painted in, but ICO decoders (Turbopack's included) reject embedded
 * PNGs that are not RGBA, and a fully opaque channel costs almost nothing once
 * compressed.
 */
const png = (pipeline, size) =>
  pipeline
    .resize(size, size, { fit: "fill" })
    .flatten({ background: BASE })
    .ensureAlpha()
    // The master is a smooth gradient, so a full-colour PNG is mostly wasted
    // bytes. A 256-colour palette holds the glow without visible banding and
    // cuts the 512px icon by roughly 90%.
    .png(
      size >= 128
        ? { palette: true, quality: 92, effort: 10 }
        : { compressionLevel: 9 },
    )
    .toBuffer();

/**
 * Pack PNGs into an .ico. Windows has accepted PNG-in-ICO since Vista, and it
 * keeps the 48px entry a quarter of the size a raw bitmap would be.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

console.log(`MASTER ${MASTER} (${width}x${height})`);
console.log("derivatives:");

// --- browser tab -------------------------------------------------------
// Tight crop: at 16px the master's margin would leave a dark smudge.
const favicons = [];
for (const size of [16, 32, 48]) {
  favicons.push({ size, data: await png(cropped(0.02), size) });
}
await out("src/app/favicon.ico", ico(favicons));
// Modern browsers prefer this over the .ico. It replaces an earlier lime "TW"
// SVG: a vector of the master would mean redrawing it, and a second drawing is
// a second brand, so the high-resolution raster is the honest answer here.
await out("src/app/icon.png", await png(cropped(0.12), 512));

// --- Apple / Android / PWA --------------------------------------------
// Apple applies its own rounding and never masks to a circle, so the master's
// framing is kept; a tight crop would have its corners clipped.
await out("src/app/apple-icon.png", await png(cropped(0.22), 180));
await out("public/icons/icon-192.png", await png(cropped(0.12), 192));
await out("public/icons/icon-512.png", await png(cropped(0.12), 512));

/**
 * Maskable: Android may crop to a circle inscribed in the middle 80%. The art
 * is scaled to fit that circle and the rest is the master's field colour, so a
 * round launcher shows the whole mark instead of a cropped swirl.
 */
const maskableArt = await cropped(0.02)
  .resize(Math.round(512 * 0.76), Math.round(512 * 0.76), { fit: "fill" })
  .png()
  .toBuffer();
await out(
  "public/icons/icon-maskable-512.png",
  await sharp({
    create: { width: 512, height: 512, channels: 3, background: BASE },
  })
    .composite([{ input: maskableArt, gravity: "centre" }])
    .png({ palette: true, quality: 92, effort: 10 })
    .toBuffer(),
);

// --- social profile + in-page brand mark -------------------------------
await out(
  "public/icons/tanebi-social-1024.png",
  await png(cropped(0.22), 1024),
);
// Displayed at 38px; 3x for retina. Replaces the old Figma "TW" mark.
await out("public/brand/tanebi-mark.png", await png(cropped(0.06), 114));
// Used inside the OG card, where it sits on the card's own dark field.
await out("public/brand/tanebi-mark-og.png", await png(cropped(0.06), 256));

console.log("\nAll derived from the single master. No mark was redrawn.");
