import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { format } from "prettier";
const publicRoot = path.resolve("public"),
  output = path.join(publicRoot, "_responsive");
await fs.mkdir(output, { recursive: true });
async function scan(dir) {
  let files = [];
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    if (item.name === "_responsive") continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) files.push(...(await scan(p)));
    else if (/\.(webp|png|jpe?g)$/i.test(item.name)) files.push(p);
  }
  return files;
}
const manifest = {};
for (const file of (await scan(publicRoot)).sort()) {
  const data = await fs.readFile(file),
    meta = await sharp(data).metadata();
  if (!meta.width || !meta.height || meta.pages > 1) continue;
  const hash = createHash("sha256")
    .update(data)
    .update("webp-q75-v1")
    .digest("hex")
    .slice(0, 20);
  const widths = [
    ...new Set(
      [64, 128, 256, 384, 640, 750, 828, 1080, 1200, 1440, 1920, 2048, 3840]
        .filter((w) => w < meta.width)
        .concat(Math.min(meta.width, 3840)),
    ),
  ];
  const variants = [];
  for (const width of widths) {
    const name = `${hash}-${width}.webp`,
      dest = path.join(output, name);
    try {
      await fs.access(dest);
    } catch {
      await sharp(data)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(dest);
    }
    variants.push({
      width,
      path: "/_responsive/" + name,
      bytes: (await fs.stat(dest)).size,
    });
  }
  manifest["/" + path.relative(publicRoot, file).replaceAll("\\", "/")] = {
    originalWidth: meta.width,
    originalHeight: meta.height,
    originalBytes: data.length,
    variants,
  };
}
await fs.writeFile(
  "src/workers/responsive-manifest.json",
  await format(JSON.stringify(manifest), { parser: "json" }),
);
console.log(
  JSON.stringify({
    sources: Object.keys(manifest).length,
    variants: Object.values(manifest).reduce(
      (s, v) => s + v.variants.length,
      0,
    ),
  }),
);
