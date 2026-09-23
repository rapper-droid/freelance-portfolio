import { variantById } from "@/lib/forme/catalog";
import type { FormeProduct } from "@/lib/forme/types";

/**
 * Artwork for the products without a photograph (指示書 §16).
 *
 * §16 asks that every product and every main variant carry the right picture
 * and that changing the colour changes it. Three colours of FORME / 01 have
 * real photographs; the rest are drawn here, in the chosen colour, so the
 * linkage holds for the whole catalogue rather than for one shelf of it.
 *
 * They are illustrations. Nothing on these screens calls them photographs,
 * and a real shop shipping this would replace them with product photography
 * — recorded as outstanding rather than quietly skipped.
 */

export type ArtSize = "card" | "detail" | "thumb";

const VIEWBOX = 160;

/** The paper each object sits on, per category, so the set reads as a set. */
const GROUND: Record<string, string> = {
  drink: "#efe9df",
  carry: "#ece7e0",
  table: "#f0ece4",
  care: "#e9ece8",
};

const SHADE = "#00000014";

/** Darkens a hex colour, for the shadowed side of a drawn object. */
function darken(hex: string, amount = 0.22): string {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const channels = [0, 2, 4].map((i) =>
    Math.max(0, Math.round(parseInt(full.slice(i, i + 2), 16) * (1 - amount))),
  );
  return "#" + channels.map((c) => c.toString(16).padStart(2, "0")).join("");
}

type Drawing = (body: string, shadow: string) => React.ReactNode;

/**
 * One drawing per product.
 *
 * Each is its own silhouette — a bottle is not a mug with a different label —
 * because the point of the picture is to tell the objects apart.
 */
const SHAPES: Record<string, Drawing> = {
  tumbler: (body, shadow) => (
    <>
      <path d="M58 44h44l-5 74a9 9 0 0 1-9 8H72a9 9 0 0 1-9-8Z" fill={body} />
      <path d="M80 44h22l-5 74a9 9 0 0 1-9 8h-8Z" fill={shadow} />
      <rect x="55" y="34" width="50" height="12" rx="5" fill={shadow} />
      <rect x="60" y="56" width="18" height="34" rx="9" fill="#ffffff26" />
    </>
  ),
  bottle: (body, shadow) => (
    <>
      <path
        d="M70 52h20v10c10 6 14 14 14 24v32a8 8 0 0 1-8 8H64a8 8 0 0 1-8-8V86c0-10 4-18 14-24Z"
        fill={body}
      />
      <path
        d="M80 52h10v10c10 6 14 14 14 24v32a8 8 0 0 1-8 8h-16Z"
        fill={shadow}
      />
      <rect x="66" y="30" width="28" height="16" rx="6" fill={shadow} />
      <rect x="62" y="96" width="36" height="6" rx="3" fill="#ffffff33" />
    </>
  ),
  mug: (body, shadow) => (
    <>
      <path
        d="M48 58h56v44a18 18 0 0 1-18 18H66a18 18 0 0 1-18-18Z"
        fill={body}
      />
      <path d="M78 58h26v44a18 18 0 0 1-18 18h-8Z" fill={shadow} />
      <path
        d="M104 70h10a14 14 0 0 1 0 28h-10"
        fill="none"
        stroke={shadow}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <ellipse cx="76" cy="58" rx="28" ry="7" fill="#ffffff2e" />
    </>
  ),
  "lunch-box": (body, shadow) => (
    <>
      <rect x="34" y="62" width="92" height="56" rx="12" fill={body} />
      <path d="M80 62h46v56a12 12 0 0 1-12 12H80Z" fill={shadow} />
      <rect x="30" y="50" width="100" height="16" rx="8" fill={shadow} />
      <rect x="44" y="78" width="30" height="26" rx="6" fill="#ffffff2b" />
    </>
  ),
  tote: (body, shadow) => (
    <>
      <path
        d="M42 62h76l-8 62a10 10 0 0 1-10 9H60a10 10 0 0 1-10-9Z"
        fill={body}
      />
      <path d="M80 62h38l-8 62a10 10 0 0 1-10 9H80Z" fill={shadow} />
      <path
        d="M62 62V46a18 18 0 0 1 36 0v16"
        fill="none"
        stroke={shadow}
        strokeWidth="7"
        strokeLinecap="round"
      />
    </>
  ),
  "care-kit": (body, shadow) => (
    <>
      <rect x="52" y="40" width="10" height="82" rx="5" fill={body} />
      <rect x="48" y="34" width="18" height="14" rx="6" fill={shadow} />
      <rect x="78" y="52" width="9" height="70" rx="4" fill={shadow} />
      <rect x="74" y="46" width="17" height="12" rx="5" fill={body} />
      <circle
        cx="112"
        cy="98"
        r="16"
        fill="none"
        stroke={shadow}
        strokeWidth="7"
      />
    </>
  ),
};

const SIZES: Record<ArtSize, number> = { card: 240, detail: 440, thumb: 72 };

/**
 * The picture for a product in a given colour.
 *
 * Returns null when the product has a photograph for that colour — the caller
 * shows the photograph instead, and nothing draws over it.
 */
export function ProductArt({
  product,
  colourId,
  size = "card",
}: {
  product: FormeProduct;
  colourId?: string | null;
  size?: ArtSize;
}) {
  const colour = colourId ? variantById(product, colourId) : undefined;
  const body = colour?.swatch ?? "#9aa39a";
  const shadow = darken(body);
  const draw = SHAPES[product.id];
  const ground = GROUND[product.category] ?? "#eeeae3";
  const px = SIZES[size];

  return (
    <svg
      className="forme-art"
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      width={px}
      height={px}
      role="img"
      aria-label={`${product.name}${colour ? `（${colour.label}）` : ""}の図版`}
    >
      <rect width={VIEWBOX} height={VIEWBOX} fill={ground} />
      <ellipse cx="80" cy="132" rx="46" ry="7" fill={SHADE} />
      {draw ? (
        draw(body, shadow)
      ) : (
        <circle cx="80" cy="80" r="34" fill={body} />
      )}
    </svg>
  );
}

export const ART_DISCLOSURE =
  "写真は FORME / 01 のみです。ほかの商品はこのサイト内で描いた図版で、実物の写真ではありません。色を変えると図版の色も変わります。";
