/**
 * Listing thumbnails for the marketplaces (A-04).
 *
 * Drawn from type, rules and the site's own tokens — no photography, no stock
 * art and no AI-generated illustration, because Coconala prohibits selling or
 * illustrating with AI-generated images (docs/growth/CHANNEL_POLICY.md). No URL
 * or contact detail appears either: Coconala treats those as information that
 * could lead to contact outside the platform.
 *
 *   node scripts/growth-listing-images.mjs
 *
 * Output: artifacts/growth-public/listings/images/<listing>-<w>x<h>.png
 * Sizes are generated in the three shapes the upload screens commonly ask for;
 * read the exact requirement off the screen and keep the matching file.
 */
import fs from "node:fs/promises";
import sharp from "sharp";

const FIELD = "#0e0906";
const PANEL = "#1c1816";
const INK = "#f0e9e0";
const ACCENT = "#fcbe69";
const MUTED = "#c2b7aa";
const RULE = "#332c26";

/** Text is drawn, not laid out: keep lines short enough to fit by eye. */
const listings = [
  {
    id: "coconala-web-fix",
    eyebrow: "TETSU WORKS",
    title: ["スマホの表示崩れを", "1ページ1か所から"],
    price: "5,500円（税込）",
    facts: [
      "対象1ページ・不具合1種類",
      "修正前後のスクリーンショット",
      "確認手順つき／メッセージ中心",
    ],
    diagram: "beforeAfter",
  },
  {
    id: "lancers-web-fix",
    eyebrow: "TETSU WORKS",
    title: ["表示崩れの修正", "1ページ1か所"],
    price: "5,500円（税込）",
    facts: [
      "原因の確認から修正まで",
      "修正前後の画面と差分をお渡し",
      "打ち合わせは必須ではありません",
    ],
    diagram: "beforeAfter",
  },
  {
    id: "lancers-csv-routine",
    eyebrow: "TETSU WORKS",
    title: ["毎回のCSV整理を", "1本の手順に"],
    price: "16,500円（税込）",
    facts: [
      "入力1形式・ルール最大3つ・出力1形式",
      "実行手順書と検証結果つき",
      "元のファイルは上書きしません",
    ],
    diagram: "rows",
  },
];

const sizes = [
  [1130, 760],
  [1200, 800],
  [1200, 630],
];

function diagram(kind, x, y, w, h) {
  if (kind === "beforeAfter") {
    // Two stacked panels: a line escaping its frame, then contained.
    const half = (h - 18) / 2;
    return `
      <rect x="${x}" y="${y}" width="${w}" height="${half}" rx="8" fill="${PANEL}" stroke="${RULE}"/>
      <rect x="${x + 16}" y="${y + 18}" width="${w - 32}" height="10" rx="5" fill="${MUTED}" opacity="0.5"/>
      <rect x="${x + 16}" y="${y + 40}" width="${w + 26}" height="10" rx="5" fill="#a2543f"/>
      <rect x="${x + 16}" y="${y + 62}" width="${w - 70}" height="10" rx="5" fill="${MUTED}" opacity="0.5"/>
      <rect x="${x}" y="${y + half + 18}" width="${w}" height="${half}" rx="8" fill="${PANEL}" stroke="${RULE}"/>
      <rect x="${x + 16}" y="${y + half + 36}" width="${w - 32}" height="10" rx="5" fill="${MUTED}" opacity="0.5"/>
      <rect x="${x + 16}" y="${y + half + 58}" width="${w - 48}" height="10" rx="5" fill="${ACCENT}"/>
      <rect x="${x + 16}" y="${y + half + 80}" width="${w - 70}" height="10" rx="5" fill="${MUTED}" opacity="0.5"/>`;
  }
  // rows: a ragged table above the rule, an even one below it
  const step = (h - 32) / 8;
  const row = (n, width, fill, opacity = 1) =>
    `<rect x="${x + 16}" y="${y + 16 + n * step}" width="${width}" height="${Math.min(12, step * 0.5)}" rx="4" fill="${fill}" opacity="${opacity}"/>`;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${PANEL}" stroke="${RULE}"/>
    ${row(0, w - 40, MUTED, 0.5)}
    ${row(1, w - 96, MUTED, 0.35)}
    ${row(2, w - 40, MUTED, 0.5)}
    ${row(3, w - 150, "#a2543f")}
    <path d="M${x + 16} ${y + 16 + 3.9 * step}H${x + w - 16}" stroke="${RULE}"/>
    ${row(4.4, w - 40, ACCENT)}
    ${row(5.4, w - 40, MUTED, 0.5)}
    ${row(6.4, w - 40, MUTED, 0.5)}
    ${row(7.4, w - 40, MUTED, 0.5)}`;
}

function card(listing, width, height) {
  const pad = Math.round(width * 0.062);
  const artWidth = Math.round(width * 0.3);
  const artX = width - pad - artWidth;
  const titleSize = Math.round(width * 0.062);
  const factSize = Math.round(width * 0.0215);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${FIELD}"/>
  <rect x="0" y="0" width="${width}" height="6" fill="${ACCENT}"/>
  ${diagram(listing.diagram, artX, Math.round(height * 0.3), artWidth, Math.round(height * 0.42))}
  <g font-family="'Yu Gothic','Hiragino Sans','Noto Sans JP',Meiryo,Arial,sans-serif">
    <text x="${pad}" y="${Math.round(height * 0.14)}" font-size="${Math.round(width * 0.018)}" letter-spacing="3" fill="${MUTED}">${listing.eyebrow}</text>
    ${listing.title
      .map(
        (line, i) =>
          `<text x="${pad}" y="${Math.round(height * 0.32) + i * Math.round(titleSize * 1.32)}" font-size="${titleSize}" font-weight="700" fill="${INK}">${line}</text>`,
      )
      .join("\n    ")}
    <text x="${pad}" y="${Math.round(height * 0.57)}" font-size="${Math.round(width * 0.036)}" font-weight="700" fill="${ACCENT}">${listing.price}</text>
    ${listing.facts
      .map(
        (fact, i) =>
          `<g><circle cx="${pad + 6}" cy="${Math.round(height * 0.69) + i * Math.round(factSize * 2.1) - Math.round(factSize * 0.32)}" r="4" fill="${ACCENT}"/><text x="${pad + 22}" y="${Math.round(height * 0.69) + i * Math.round(factSize * 2.1)}" font-size="${factSize}" fill="${MUTED}">${fact}</text></g>`,
      )
      .join("\n    ")}
    <path d="M${pad} ${height - Math.round(height * 0.1)}H${width - pad}" stroke="${RULE}"/>
    <text x="${pad}" y="${height - Math.round(height * 0.05)}" font-size="${Math.round(width * 0.017)}" letter-spacing="1.5" fill="${MUTED}">実際に触れる自主制作デモをご用意しています</text>
  </g>
</svg>`;
}

const out = "artifacts/growth-public/listings/images";
await fs.mkdir(out, { recursive: true });
for (const listing of listings)
  for (const [width, height] of sizes) {
    const file = `${out}/${listing.id}-${width}x${height}.png`;
    await sharp(Buffer.from(card(listing, width, height)))
      .png()
      .toFile(file);
    console.log(`wrote ${file}`);
  }
