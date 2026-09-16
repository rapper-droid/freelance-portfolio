/**
 * TSUDOWA icon derivatives.
 *
 * The editable vector in public/brand/tsudowa-mark.svg is the single source
 * for every raster icon. No page imports the generated social profile image.
 * Run: node scripts/generate-icons.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MASTER = "public/brand/tsudowa-mark.svg";
const FIELD = { r: 0x09, g: 0x03, b: 0x00 };
const vector = await fs.readFile(MASTER);

const out = async (file, data) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  console.log(`  ${file.padEnd(42)} ${String(data.length).padStart(7)} bytes`);
};

const transparentMark = (size) =>
  sharp(vector).resize(size, size, { fit: "contain" }).png().toBuffer();

async function fieldIcon(size, artRatio = 0.72) {
  const artSize = Math.round(size * artRatio);
  const mark = await transparentMark(artSize);
  return sharp({
    create: { width: size, height: size, channels: 4, background: FIELD },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png(
      size >= 128
        ? { palette: true, quality: 96, effort: 10 }
        : { compressionLevel: 9 },
    )
    .toBuffer();
}

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

const favicons = [];
for (const size of [16, 32, 48])
  favicons.push({ size, data: await fieldIcon(size, 0.82) });
await out("src/app/favicon.ico", ico(favicons));
await out("src/app/icon.png", await fieldIcon(512, 0.72));
await out("src/app/apple-icon.png", await fieldIcon(180, 0.68));
await out("public/icons/icon-192.png", await fieldIcon(192, 0.72));
await out("public/icons/icon-512.png", await fieldIcon(512, 0.72));
await out("public/icons/icon-maskable-512.png", await fieldIcon(512, 0.58));
await out("public/icons/tsudowa-social-1024.png", await fieldIcon(1024, 0.58));
await out("public/brand/tsudowa-mark-og.png", await transparentMark(256));

console.log(`\nAll icons generated from ${MASTER}.`);
