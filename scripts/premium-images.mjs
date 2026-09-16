import sharp from "sharp";
import fs from "node:fs/promises";

const names = ["ritual", "food", "space", "drip"];
await fs.mkdir("public/visuals", { recursive: true });
for (const name of names) {
  const source = `assets/imagery/kissa-${name}-v2.png`;
  const target = `public/visuals/kissa-${name}-v2.webp`;
  await sharp(source)
    .resize({ width: 1440, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(target);
  console.log(`${target}: ${(await fs.stat(target)).size} bytes`);
}
