import {
  axesOf,
  productById,
  products,
  variantById,
  variantsOn,
} from "./catalog";
import type { FormeProduct, FormeState } from "./types";

/**
 * How many of a thing there are (指示書 §16).
 *
 * KISSA has sale states; FORME has counts, because "two left" and "sold out"
 * are different sentences and a shop that cannot tell them apart oversells.
 *
 * Stock lives per SKU — the product with one choice on every axis — since a
 * sage 350ml running out says nothing about the charcoal 500ml.
 */

/** Stable identifier for one sellable combination. */
export function skuKey(
  productId: string,
  variantIds: readonly string[],
): string {
  return [productId, ...[...variantIds].sort()].join("|");
}

/** Every combination a product can be ordered as. */
export function skusOf(product: FormeProduct): string[][] {
  const axes = axesOf(product);
  if (!axes.length) return [[]];
  return axes.reduce<string[][]>(
    (combos, axis) =>
      combos.flatMap((combo) =>
        variantsOn(product, axis).map((variant) => [...combo, variant.id]),
      ),
    [[]],
  );
}

/**
 * Published stock.
 *
 * Written down rather than generated, so the demo has the shapes worth
 * showing: plenty, nearly gone, and gone. A shop where everything is always
 * available never exercises the screens that matter.
 */
const BASE_STOCK: Record<string, number> = {
  "tumbler|tumbler-350|tumbler-sage": 12,
  "tumbler|tumbler-350|tumbler-sand": 2,
  "tumbler|tumbler-350|tumbler-charcoal": 8,
  "tumbler|tumbler-500|tumbler-sage": 5,
  "tumbler|tumbler-500|tumbler-sand": 0,
  "tumbler|tumbler-500|tumbler-charcoal": 6,
  "bottle|bottle-500|bottle-sage": 9,
  "bottle|bottle-500|bottle-charcoal": 1,
  "bottle|bottle-750|bottle-sage": 4,
  "bottle|bottle-750|bottle-charcoal": 0,
  "mug|mug-sand": 14,
  "mug|mug-charcoal": 7,
  "lunch-box|lunch-sage": 3,
  "lunch-box|lunch-sand": 0,
  "tote|tote-s|tote-sand": 6,
  "tote|tote-s|tote-charcoal": 4,
  "tote|tote-m|tote-sand": 2,
  "tote|tote-m|tote-charcoal": 5,
  "care-kit": 40,
};

/** Fallback for a combination nobody wrote a number for. */
const DEFAULT_STOCK = 5;

export const baseStock = (key: string) => BASE_STOCK[key] ?? DEFAULT_STOCK;

/**
 * Stock right now: what was published, plus this visitor's own changes.
 *
 * Deltas, not absolutes. A count written into a browser weeks ago must not
 * override a later build that restocked the line, and an order placed here
 * must not silently become the new published number.
 */
export function stockFor(
  productId: string,
  variantIds: readonly string[],
  deltas: Record<string, number>,
): number {
  const key = skuKey(productId, variantIds);
  return Math.max(0, baseStock(key) + (deltas[key] ?? 0));
}

export type StockLevel = "in_stock" | "low" | "out";

/** Below this, the screens say how many are left instead of just "in stock". */
export const LOW_STOCK_AT = 3;

export const levelOf = (count: number): StockLevel =>
  count <= 0 ? "out" : count <= LOW_STOCK_AT ? "low" : "in_stock";

export function stockLabel(count: number): string {
  if (count <= 0) return "在庫切れ";
  if (count <= LOW_STOCK_AT) return `残り ${count} 点`;
  return "在庫あり";
}

/** Whether any combination of this product can be ordered at all. */
export function anyInStock(
  product: FormeProduct,
  deltas: Record<string, number>,
): boolean {
  return skusOf(product).some((ids) => stockFor(product.id, ids, deltas) > 0);
}

/** Stock across every combination, for the product card and the operator. */
export function totalStock(
  product: FormeProduct,
  deltas: Record<string, number>,
): number {
  return skusOf(product).reduce(
    (sum, ids) => sum + stockFor(product.id, ids, deltas),
    0,
  );
}

export type StockChange = { key: string; by: number };

/**
 * Moves stock by a signed amount, keeping the result at or above zero.
 *
 * A negative count is not a fact about a shelf, so an order for three when
 * two remain takes the two. The caller checks availability first; this is the
 * floor that stops a rounding mistake becoming a negative shelf.
 */
export function applyStock(
  deltas: Record<string, number>,
  changes: readonly StockChange[],
): Record<string, number> {
  const next = { ...deltas };
  for (const { key, by } of changes) {
    const base = baseStock(key);
    const current = base + (next[key] ?? 0);
    const wanted = Math.max(0, current + by);
    const delta = wanted - base;
    if (delta === 0) delete next[key];
    else next[key] = delta;
  }
  return next;
}

/**
 * Sets a SKU to an exact count, which is what an operator actually does.
 *
 * Stored as the difference from the published number, so setting it back to
 * that number leaves no entry at all rather than a zero that would pin the
 * shelf if the catalogue later changed.
 */
export function setStock(
  deltas: Record<string, number>,
  key: string,
  count: number,
): Record<string, number> {
  const next = { ...deltas };
  const delta = Math.max(0, Math.trunc(count)) - baseStock(key);
  if (delta === 0) delete next[key];
  else next[key] = delta;
  return next;
}

/** The catalogue label for a SKU, for the operator's table. */
export function describeSku(key: string): string {
  const [productId, ...variantIds] = key.split("|");
  const product = productById(productId);
  if (!product) return key;
  const labels = variantIds
    .map((id) => variantById(product, id)?.label)
    .filter(Boolean);
  return labels.length
    ? `${product.name}（${labels.join(" / ")}）`
    : product.name;
}

/** Every SKU in the catalogue, in catalogue order. */
export function allSkus(): Array<{ key: string; productId: string }> {
  return [...products]
    .sort((a, b) => a.order - b.order)
    .flatMap((product) =>
      skusOf(product).map((ids) => ({
        key: skuKey(product.id, ids),
        productId: product.id,
      })),
    );
}

/** Whether the visitor has hidden this product through the operator screen. */
export const isPublished = (product: FormeProduct, state: FormeState) =>
  product.published && !state.unpublished.includes(product.id);
