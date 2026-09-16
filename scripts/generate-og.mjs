/** Open Graph card for the TSUDOWA parent brand. */
import fs from "node:fs/promises";
import sharp from "sharp";

const siteHost = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsudowa.com",
).host;
const FIELD = "#090300";
const INK = "#f0e9e0";
const ACCENT = "#fcbe69";
const MUTED = "#c2b7aa";
const RULE = "#332c26";
const mark = await fs.readFile("public/brand/tsudowa-mark-og.png");
const markData = `data:image/png;base64,${mark.toString("base64")}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="${FIELD}"/>
<circle cx="1035" cy="315" r="220" fill="none" stroke="${RULE}" opacity="0.45"/>
<circle cx="1035" cy="315" r="154" fill="none" stroke="${RULE}" opacity="0.28"/>
<image href="${markData}" x="900" y="180" width="270" height="270" opacity="0.12"/>
<image href="${markData}" x="64" y="38" width="48" height="48"/>
<g font-family="Arial,sans-serif">
<text x="128" y="70" font-size="20" font-weight="700" letter-spacing="2.5" fill="${INK}">TSUDOWA</text>
<text x="60" y="244" font-size="108" font-weight="900" letter-spacing="-4" fill="${INK}">GATHER.</text>
<text x="60" y="352" font-size="108" font-weight="900" letter-spacing="-4" fill="${INK}">BUILD.</text>
<text x="60" y="460" font-size="108" font-weight="900" letter-spacing="-4" fill="${ACCENT}">EXPAND.</text>
<text x="64" y="522" font-size="18" letter-spacing="0.5" fill="${MUTED}">集まり、つくり、次へ広がる輪。</text>
<path d="M64 566H1136" stroke="${RULE}"/>
<text x="64" y="601" font-size="13" letter-spacing="1.8" fill="${MUTED}">TETSU WORKS / TSUKUTTA LAB</text>
<text x="1136" y="601" font-size="13" letter-spacing="1" fill="${MUTED}" text-anchor="end">${siteHost}</text>
</g></svg>`;

await fs.writeFile("public/og.svg", svg);
await sharp(Buffer.from(svg)).png().toFile("public/og.png");
console.log(`og.png written for ${siteHost}`);
