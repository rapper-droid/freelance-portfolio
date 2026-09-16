/**
 * Open Graph card for TANEBI WORKS.
 *
 * Brand values mirror src/lib/brand.ts so the share card cannot drift from the
 * site. The domain follows NEXT_PUBLIC_SITE_URL for the same reason: a
 * hard-coded host would go stale at exactly the moment the domain moves, and
 * it would go stale inside an image, where nobody would notice.
 *
 * Colours are the ones measured from the master icon (docs/BRAND_ICON.md), not
 * picked by eye, so the card and the mark sit on the same black.
 */
import fs from "node:fs/promises";
import sharp from "sharp";

const BRAND_NAME = "TANEBI WORKS";
const PARENT_BRAND = "TANEBI";
const siteHost = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tetsuworks.com",
).host;

const FIELD = "#0e0906"; // the master icon's own field
const INK = "#f0debf"; // warm white, from the spheres
const EMBER = "#fcbe69"; // the glow
const MUTED = "#cea276"; // warm tan
const RULE = "#332c26";

/**
 * The mark is the real master derivative, embedded as bytes. Drawing a
 * lookalike in SVG would put a second version of the brand into circulation on
 * every social preview.
 */
const mark = await fs.readFile("public/brand/tanebi-mark-og.png");
const markData = `data:image/png;base64,${mark.toString("base64")}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="${FIELD}"/>
<image href="${markData}" x="942" y="150" width="200" height="200" opacity="0.10"/>
<image href="${markData}" x="64" y="40" width="44" height="44"/>
<g font-family="Arial,sans-serif">
<text x="124" y="70" font-size="19" font-weight="700" letter-spacing="1.6" fill="${INK}">${BRAND_NAME}</text>
<text x="58" y="242" font-size="118" font-weight="900" letter-spacing="-5" fill="${INK}">BUILD.</text>
<text x="58" y="354" font-size="118" font-weight="900" letter-spacing="-5" fill="${INK}">AUTOMATE.</text>
<text x="58" y="466" font-size="118" font-weight="900" letter-spacing="-5" fill="${EMBER}">DELIVER.</text>
<text x="64" y="529" font-size="19" letter-spacing="0.5" fill="${MUTED}">Web / AI / Automation — 設計から実装・テスト・納品まで</text>
<path d="M64 566H1136" stroke="${RULE}"/>
<text x="64" y="601" font-size="13" letter-spacing="2" fill="${MUTED}">A ${PARENT_BRAND} SERVICE</text>
<text x="1136" y="601" font-size="13" letter-spacing="1" fill="${MUTED}" text-anchor="end">${siteHost}</text>
</g></svg>`;

await fs.writeFile("public/og.svg", svg);
await sharp(Buffer.from(svg)).png().toFile("public/og.png");
console.log(`og.png written for ${siteHost}`);
