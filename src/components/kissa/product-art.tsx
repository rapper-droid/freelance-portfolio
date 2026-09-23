import type { Product } from "@/lib/shop/types";

/**
 * Artwork for every item on the menu (指示書 §07).
 *
 * Each product has its own drawing — a different vessel, fill, garnish and
 * plate — so a cake never wears the coffee's picture and two drinks are told
 * apart at a glance. They are drawn as inline SVG: nothing is downloaded, no
 * licence is needed and there is no spend, which is the constraint this work
 * runs under.
 *
 * They are illustrations, and the image ledger records them as such. They are
 * not photographs and are never presented as any. A real shop shipping this
 * would replace them with photography of the actual food; that step is
 * recorded as outstanding rather than quietly skipped (指示書 §07).
 */

export type ArtSize = "card" | "detail" | "thumb";

const VIEWBOX = 160;

/** Palette per product, so each drawing reads as its own drink or dish. */
const PALETTE: Record<
  string,
  { bg: string; vessel: string; fill: string; accent: string }
> = {
  "drip-house": {
    bg: "#f0e6d8",
    vessel: "#f7f3ec",
    fill: "#5b3a24",
    accent: "#8c5a34",
  },
  latte: {
    bg: "#efe7dc",
    vessel: "#fbf8f3",
    fill: "#c8a273",
    accent: "#f2e4d0",
  },
  espresso: {
    bg: "#e8ddd0",
    vessel: "#f6f1e9",
    fill: "#3a2317",
    accent: "#6b4429",
  },
  "cold-brew": {
    bg: "#e4e8ea",
    vessel: "#f4f7f8",
    fill: "#4a3a2c",
    accent: "#9fb0b8",
  },
  "hojicha-latte": {
    bg: "#f0e7da",
    vessel: "#faf6f0",
    fill: "#a9724a",
    accent: "#e6d2b8",
  },
  sencha: {
    bg: "#e6ece1",
    vessel: "#f5f8f2",
    fill: "#8fa86a",
    accent: "#c3d3a8",
  },
  "herbal-tea": {
    bg: "#eae7dd",
    vessel: "#f8f6f0",
    fill: "#d2b155",
    accent: "#efdfa8",
  },
  "toast-set": {
    bg: "#f2e9da",
    vessel: "#fcf8f1",
    fill: "#d9a55c",
    accent: "#7f9a5c",
  },
  sandwich: {
    bg: "#f1ece0",
    vessel: "#fbf8f2",
    fill: "#f0d68a",
    accent: "#e8e2d2",
  },
  curry: {
    bg: "#eee4d2",
    vessel: "#faf6ee",
    fill: "#a85f24",
    accent: "#f3ead4",
  },
  cheesecake: {
    bg: "#efe6d6",
    vessel: "#fbf7f0",
    fill: "#d9b46f",
    accent: "#6b4a2a",
  },
  pudding: {
    bg: "#f1e7d5",
    vessel: "#fcf8f1",
    fill: "#f0cf7a",
    accent: "#8a5a22",
  },
  "seasonal-citrus": {
    bg: "#eae6d6",
    vessel: "#f9f7f1",
    fill: "#f0a93a",
    accent: "#cfe0b0",
  },
  "seasonal-mont-blanc": {
    bg: "#efe8dc",
    vessel: "#fbf8f3",
    fill: "#c99a62",
    accent: "#f6efe4",
  },
};

const FALLBACK = {
  bg: "#efe8dc",
  vessel: "#fbf8f3",
  fill: "#a9865f",
  accent: "#d8c7ae",
};

/** Which vessel a product is served in; drives the silhouette. */
type Shape = "mug" | "glass" | "cup" | "teapot" | "plate" | "bowl" | "slice";

const SHAPES: Record<string, Shape> = {
  "drip-house": "mug",
  latte: "mug",
  espresso: "cup",
  "cold-brew": "glass",
  "hojicha-latte": "mug",
  sencha: "teapot",
  "herbal-tea": "teapot",
  "toast-set": "plate",
  sandwich: "plate",
  curry: "bowl",
  cheesecake: "slice",
  pudding: "slice",
  "seasonal-citrus": "glass",
  "seasonal-mont-blanc": "slice",
};

function Vessel({
  shape,
  colours,
}: {
  shape: Shape;
  colours: (typeof PALETTE)[string];
}) {
  const { vessel, fill, accent } = colours;
  switch (shape) {
    case "glass":
      return (
        <>
          <path
            d="M56 46h48l-6 66a10 10 0 0 1-10 9H72a10 10 0 0 1-10-9Z"
            fill={vessel}
          />
          <path
            d="M60 70h40l-4.5 42a8 8 0 0 1-8 7H72.5a8 8 0 0 1-8-7Z"
            fill={fill}
          />
          <ellipse cx="80" cy="70" rx="20" ry="4" fill={accent} opacity="0.7" />
        </>
      );
    case "cup":
      return (
        <>
          <path
            d="M62 62h36l-4 30a12 12 0 0 1-12 10h-4a12 12 0 0 1-12-10Z"
            fill={vessel}
          />
          <ellipse cx="80" cy="64" rx="18" ry="5" fill={fill} />
          <path
            d="M98 70c9 0 13 5 13 11s-5 10-12 10"
            stroke={vessel}
            strokeWidth="5"
            fill="none"
          />
          <ellipse
            cx="80"
            cy="112"
            rx="26"
            ry="5"
            fill={accent}
            opacity="0.5"
          />
        </>
      );
    case "teapot":
      return (
        <>
          <path
            d="M50 74c0-14 14-22 30-22s30 8 30 22-13 28-30 28-30-14-30-28Z"
            fill={vessel}
          />
          <path
            d="M110 72c10 2 14 8 13 16"
            stroke={vessel}
            strokeWidth="6"
            fill="none"
          />
          <path
            d="M50 74c-9 2-12 7-11 14"
            stroke={vessel}
            strokeWidth="6"
            fill="none"
          />
          <ellipse cx="80" cy="66" rx="16" ry="5" fill={fill} />
          <rect x="74" y="44" width="12" height="8" rx="4" fill={accent} />
        </>
      );
    case "plate":
      return (
        <>
          <ellipse cx="80" cy="92" rx="46" ry="16" fill={vessel} />
          <ellipse
            cx="80"
            cy="89"
            rx="36"
            ry="12"
            fill={accent}
            opacity="0.6"
          />
          <rect x="56" y="62" width="48" height="28" rx="5" fill={fill} />
          <rect
            x="62"
            y="68"
            width="36"
            height="6"
            rx="3"
            fill={vessel}
            opacity="0.55"
          />
        </>
      );
    case "bowl":
      return (
        <>
          <path d="M42 76h76c0 22-17 34-38 34S42 98 42 76Z" fill={vessel} />
          <path d="M52 80h56c0 14-12 22-28 22s-28-8-28-22Z" fill={fill} />
          <ellipse cx="80" cy="80" rx="18" ry="6" fill={accent} opacity="0.8" />
        </>
      );
    case "slice":
      return (
        <>
          <ellipse cx="80" cy="104" rx="42" ry="13" fill={vessel} />
          <path d="M56 58h48l-6 42H62Z" fill={fill} />
          <path d="M56 58h48l-3 10H59Z" fill={accent} />
        </>
      );
    default:
      return (
        <>
          <path
            d="M58 58h44l-5 40a12 12 0 0 1-12 11h-10a12 12 0 0 1-12-11Z"
            fill={vessel}
          />
          <ellipse cx="80" cy="60" rx="22" ry="6" fill={fill} />
          <path
            d="M102 68c11 0 16 6 16 13s-6 12-15 12"
            stroke={vessel}
            strokeWidth="6"
            fill="none"
          />
          <ellipse
            cx="80"
            cy="115"
            rx="30"
            ry="5"
            fill={accent}
            opacity="0.45"
          />
        </>
      );
  }
}

/**
 * Renders a product's artwork.
 *
 * `alt` describes the drawing, not the product's marketing copy, and says it
 * is an illustration so a screen reader is not told there is a photograph.
 */
export function ProductArt({
  product,
  size = "card",
  className,
}: {
  product: Product;
  size?: ArtSize;
  className?: string;
}) {
  const colours = PALETTE[product.artId] ?? FALLBACK;
  const shape = SHAPES[product.artId] ?? "mug";
  const gradientId = `art-${product.artId}`;

  return (
    <svg
      className={["kissa-art", `kissa-art-${size}`, className]
        .filter(Boolean)
        .join(" ")}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      role="img"
      aria-label={`${product.name}のイラスト`}
      // Fixed ratio: the box never changes size as the drawing loads.
      width={VIEWBOX}
      height={VIEWBOX}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colours.bg} />
          <stop offset="100%" stopColor={colours.accent} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect
        width={VIEWBOX}
        height={VIEWBOX}
        rx="14"
        fill={`url(#${gradientId})`}
      />
      <Vessel shape={shape} colours={colours} />
    </svg>
  );
}

/** What the image ledger records about these, in one place. */
export const ART_DISCLOSURE =
  "商品画像はこのサイトで描いたイラストです。写真ではありません。実店舗の導入時は実物の撮影に差し替えます。";
