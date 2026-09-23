/**
 * STILL / STUDIO — one design, several shapes (指示書 §17).
 *
 * The demo used to render three fixed posters. §17 asks for something harder
 * and more honest: a piece of content — a product, a price, a period, a call
 * to action — laid out at several ratios, editable, with the export matching
 * what is on screen.
 *
 * The rule that matters is the one about the price: *変更した価格が一部画像
 * だけ古いまま残らない*. Every ratio is rendered from this one record by this
 * one function, so a price cannot be current in the square and stale in the
 * banner. There is no per-ratio copy of the text to fall out of step.
 *
 * Output is SVG. It is a real file that opens in any browser and any vector
 * editor, which is what §17 asks for; nothing here claims a format it cannot
 * actually produce.
 */

export type Ratio = "square" | "portrait" | "landscape";

export const RATIOS: Ratio[] = ["square", "portrait", "landscape"];

export const RATIO_LABELS: Record<Ratio, string> = {
  square: "SNS投稿 / 1080 × 1080",
  portrait: "ストーリー / 1080 × 1920",
  landscape: "広告バナー / 1200 × 630",
};

export const RATIO_SIZES: Record<Ratio, [number, number]> = {
  square: [1080, 1080],
  portrait: [1080, 1920],
  landscape: [1200, 630],
};

export type Palette = {
  id: string;
  name: string;
  bg: string;
  fg: string;
  accent: string;
};

/** Three directions, each a colour pair that has to survive small text. */
export const PALETTES: Palette[] = [
  {
    id: "ink",
    name: "MAKE ROOM.",
    bg: "#263baf",
    fg: "#d6ec97",
    accent: "#8fb8ff",
  },
  {
    id: "clay",
    name: "SLOW DAYS.",
    bg: "#e8dcc5",
    fg: "#4d4939",
    accent: "#a8845c",
  },
  {
    id: "moss",
    name: "LESS. BETTER.",
    bg: "#263f35",
    fg: "#e9efd4",
    accent: "#9dbf87",
  },
];

export type DesignContent = {
  /** The headline. The one piece of copy that carries the direction. */
  headline: string;
  productName: string;
  /** Written as the shop would write it, not as a number to do sums with. */
  price: string;
  period: string;
  cta: string;
};

export const DEFAULT_CONTENT: DesignContent = {
  headline: "MAKE ROOM.",
  productName: "FORME / 01 タンブラー",
  price: "¥3,800",
  period: "9/24 — 10/6",
  cta: "オンラインストアで見る",
};

export type Design = {
  content: DesignContent;
  paletteId: string;
  /**
   * Where the circle sits, 0–100 across and down.
   *
   * This is the crop: the artwork is larger than any of the frames, and the
   * focal point decides which part of it each ratio shows.
   */
  focusX: number;
  focusY: number;
  /** Scale of the graphic element, as a percentage of the frame's width. */
  scale: number;
};

export const DEFAULT_DESIGN: Design = {
  content: DEFAULT_CONTENT,
  paletteId: "ink",
  focusX: 76,
  focusY: 62,
  scale: 58,
};

export const paletteById = (id: string) =>
  PALETTES.find((p) => p.id === id) ?? PALETTES[0];

/**
 * The safe area.
 *
 * Nothing that has to be read is placed outside it. Story formats get a
 * deeper top and bottom because that is where the platform's own chrome sits;
 * a banner is tight because it is small to begin with.
 */
export const SAFE_AREA: Record<Ratio, { x: number; y: number }> = {
  square: { x: 0.08, y: 0.08 },
  portrait: { x: 0.08, y: 0.16 },
  landscape: { x: 0.06, y: 0.1 },
};

/** Escapes text for inclusion in SVG markup. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wraps a headline onto at most three lines, by width rather than by luck. */
export function wrapHeadline(text: string, perLine: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  if (lines.length <= 3) return lines;
  // Rather than silently dropping copy, the tail is folded into the third
  // line: an export that quietly loses half a headline is worse than a busy
  // one, and the editor can see it is too long.
  return [lines[0], lines[1], lines.slice(2).join(" ")];
}

export type RenderOptions = {
  /** Draws the safe-area guides. Preview only; never in a downloaded file. */
  showSafeArea?: boolean;
};

/**
 * Renders one design at one ratio.
 *
 * Every measurement is derived from the frame, so the same record produces a
 * story and a banner that say the same thing in proportions that suit each.
 */
export function renderDesign(
  design: Design,
  ratio: Ratio,
  options: RenderOptions = {},
): string {
  const [w, h] = RATIO_SIZES[ratio] ?? RATIO_SIZES.square;
  const palette = paletteById(design.paletteId);
  const safe = SAFE_AREA[ratio] ?? SAFE_AREA.square;
  const padX = Math.round(w * safe.x);
  const padY = Math.round(h * safe.y);
  const inner = w - padX * 2;

  const circleR = Math.round(
    (w * Math.min(90, Math.max(20, design.scale))) / 200,
  );
  const cx = Math.round((w * Math.min(100, Math.max(0, design.focusX))) / 100);
  const cy = Math.round((h * Math.min(100, Math.max(0, design.focusY))) / 100);

  // The headline is the largest thing on the frame, so its size is what the
  // layout is built around.
  const headlineSize =
    ratio === "landscape" ? Math.round(w * 0.062) : Math.round(w * 0.082);
  const perLine = Math.max(8, Math.floor(inner / (headlineSize * 0.56)));
  const lines = wrapHeadline(design.content.headline, perLine);
  const lineHeight = Math.round(headlineSize * 1.12);
  const metaSize = Math.round(w * 0.024);
  const ctaSize = Math.round(w * 0.028);

  const headTop = padY + Math.round(metaSize * 3.4);
  const ctaY = h - padY - Math.round(ctaSize * 1.2);
  const metaY = ctaY - Math.round(ctaSize * 2.4);

  const text = (
    x: number,
    y: number,
    size: number,
    weight: string,
    fill: string,
    value: string,
  ) =>
    `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}">${escapeXml(value)}</text>`;

  const guides = options.showSafeArea
    ? `<rect x="${padX}" y="${padY}" width="${w - padX * 2}" height="${h - padY * 2}" fill="none" stroke="${palette.accent}" stroke-width="${Math.max(2, Math.round(w * 0.003))}" stroke-dasharray="${Math.round(w * 0.02)} ${Math.round(w * 0.014)}" opacity="0.85"/>`
    : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(design.content.headline)}">`,
    `<rect width="${w}" height="${h}" fill="${palette.bg}"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${circleR}" fill="none" stroke="${palette.fg}" stroke-width="${Math.round(w * 0.11)}" opacity="0.9"/>`,
    text(
      padX,
      padY + metaSize,
      metaSize,
      "400",
      palette.accent,
      "STILL / STUDIO — SELF-INITIATED DEMO",
    ),
    ...lines.map((line, index) =>
      text(
        padX,
        headTop + headlineSize + index * lineHeight,
        headlineSize,
        "bold",
        palette.fg,
        line,
      ),
    ),
    text(
      padX,
      metaY,
      metaSize,
      "400",
      palette.accent,
      design.content.productName,
    ),
    text(
      padX,
      metaY + Math.round(metaSize * 1.5),
      metaSize,
      "bold",
      palette.fg,
      `${design.content.price}　${design.content.period}`,
    ),
    text(padX, ctaY, ctaSize, "bold", palette.fg, design.content.cta),
    guides,
    `</svg>`,
  ].join("");
}

/** A data URI for the preview, so nothing has to be written to disk to look. */
export const designDataUri = (
  design: Design,
  ratio: Ratio,
  options?: RenderOptions,
) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderDesign(design, ratio, options))}`;

export const designFilename = (design: Design, ratio: Ratio) =>
  `still-${paletteById(design.paletteId).id}-${ratio}.svg`;

/**
 * What the editor is allowed to accept.
 *
 * Long copy does not silently vanish at export time; it is refused here, with
 * a reason, while there is still something to do about it.
 */
export const LIMITS = {
  headline: 40,
  productName: 40,
  price: 20,
  period: 24,
  cta: 28,
};

export function contentProblems(content: DesignContent): string[] {
  const problems: string[] = [];
  if (!content.headline.trim()) problems.push("見出しを入力してください。");
  for (const [field, label, max] of [
    ["headline", "見出し", LIMITS.headline],
    ["productName", "商品名", LIMITS.productName],
    ["price", "価格", LIMITS.price],
    ["period", "期間", LIMITS.period],
    ["cta", "CTA", LIMITS.cta],
  ] as Array<[keyof DesignContent, string, number]>)
    if (content[field].length > max)
      problems.push(`${label}は ${max} 文字までです。`);
  return problems;
}
