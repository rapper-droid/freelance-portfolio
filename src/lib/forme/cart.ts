import { hash } from "@/lib/runtime/ids";
import { sumMoney, type Money } from "@/lib/runtime/rules/money";
import {
  REGION_SURCHARGE,
  SHIPPING,
  axesOf,
  productById,
  variantById,
} from "./catalog";
import { skuKey, stockFor } from "./stock";
import type {
  FormeCart,
  FormeCartLine,
  FormeProduct,
  Fulfilment,
} from "./types";

/**
 * FORME's cart arithmetic (指示書 §16).
 *
 * Same contract as KISSA's: every total is recomputed here, the unit price is
 * captured onto the line when it is added, and a later catalogue change is
 * reported rather than applied behind the customer's back.
 *
 * What differs is stock. A line cannot exceed what is on the shelf, and the
 * ceiling is enforced when adding, when changing the quantity and again when
 * the order is placed — because the shelf can move between those moments.
 */

const yen = (minorUnits: number): Money => ({
  minorUnits,
  scale: 0,
  currency: "JPY",
});

export const emptyCart = (): FormeCart => ({ lines: [], updatedAt: "" });

export const lineKey = (productId: string, variantIds: readonly string[]) =>
  "fl-" + hash({ productId, variantIds: [...variantIds].sort() }).slice(0, 12);

export function unitPriceOf(
  product: FormeProduct,
  variantIds: readonly string[],
): Money {
  const extras = variantIds
    .map((id) => variantById(product, id)?.extra)
    .filter((m): m is Money => !!m);
  return sumMoney([product.price, ...extras]) ?? product.price;
}

export function describeVariants(
  product: FormeProduct,
  variantIds: readonly string[],
): string[] {
  return variantIds
    .map((id) => variantById(product, id)?.label)
    .filter((l): l is string => !!l);
}

/** Every axis answered exactly once: no half-chosen combination is sellable. */
export function selectionComplete(
  product: FormeProduct,
  variantIds: readonly string[],
): boolean {
  const axes = axesOf(product);
  const chosen = variantIds
    .map((id) => variantById(product, id)?.axis)
    .filter(Boolean);
  return (
    chosen.length === variantIds.length &&
    new Set(chosen).size === chosen.length &&
    axes.every((axis) => chosen.includes(axis))
  );
}

export const MAX_LINE_QUANTITY = 10;

export type AddResult =
  { ok: true; cart: FormeCart } | { ok: false; reason: string };

export function addToCart(
  cart: FormeCart,
  input: {
    productId: string;
    variantIds: readonly string[];
    quantity: number;
    atIso: string;
    stockDeltas: Record<string, number>;
    unpublished?: readonly string[];
  },
): AddResult {
  const product = productById(input.productId);
  if (!product)
    return { ok: false, reason: "この商品は見つかりませんでした。" };
  if (!product.published || input.unpublished?.includes(product.id))
    return { ok: false, reason: "この商品はいま取り扱っていません。" };
  if (!selectionComplete(product, input.variantIds))
    return { ok: false, reason: "選べる項目をすべて選んでください。" };

  const quantity = Math.trunc(input.quantity);
  if (quantity < 1) return { ok: false, reason: "数量を1以上にしてください。" };

  const available = stockFor(product.id, input.variantIds, input.stockDeltas);
  if (available <= 0)
    return { ok: false, reason: "この組み合わせは在庫切れです。" };

  const id = lineKey(product.id, input.variantIds);
  const existing = cart.lines.find((l) => l.lineId === id);
  const wanted = (existing?.quantity ?? 0) + quantity;

  if (wanted > available)
    return {
      ok: false,
      reason:
        existing && existing.quantity >= available
          ? `在庫は ${available} 点です。これ以上は追加できません。`
          : `在庫は ${available} 点です。数量を調整してください。`,
    };
  if (wanted > MAX_LINE_QUANTITY)
    return {
      ok: false,
      reason: `1つの商品につき ${MAX_LINE_QUANTITY} 点までです。`,
    };

  const unitPrice = unitPriceOf(product, input.variantIds);
  const lines = existing
    ? cart.lines.map((l) => (l.lineId === id ? { ...l, quantity: wanted } : l))
    : [
        ...cart.lines,
        {
          lineId: id,
          productId: product.id,
          variantIds: [...input.variantIds],
          quantity,
          unitPrice,
        } satisfies FormeCartLine,
      ];

  return { ok: true, cart: { lines, updatedAt: input.atIso } };
}

export function setQuantity(
  cart: FormeCart,
  lineId: string,
  quantity: number,
  atIso: string,
  stockDeltas: Record<string, number>,
): { cart: FormeCart; reason?: string } {
  const line = cart.lines.find((l) => l.lineId === lineId);
  if (!line) return { cart };

  const wanted = Math.trunc(quantity);
  if (wanted <= 0) return { cart: removeLine(cart, lineId, atIso) };

  const available = stockFor(line.productId, line.variantIds, stockDeltas);
  const capped = Math.min(wanted, available, MAX_LINE_QUANTITY);
  const reason =
    capped < wanted
      ? available < wanted
        ? `在庫は ${available} 点です。${capped} 点に変更しました。`
        : `1つの商品につき ${MAX_LINE_QUANTITY} 点までです。`
      : undefined;

  return {
    cart: {
      lines: cart.lines.map((l) =>
        l.lineId === lineId ? { ...l, quantity: capped } : l,
      ),
      updatedAt: atIso,
    },
    reason,
  };
}

export const removeLine = (
  cart: FormeCart,
  lineId: string,
  atIso: string,
): FormeCart => ({
  lines: cart.lines.filter((l) => l.lineId !== lineId),
  updatedAt: atIso,
});

export type CartTotals = {
  count: number;
  subtotal: Money;
  shipping: Money;
  total: Money;
  /** How much more would make delivery free, or null once it already is. */
  toFreeShipping: Money | null;
};

/**
 * What the order will cost.
 *
 * Collection is free; delivery is flat, free above a threshold, with a stated
 * surcharge for the two regions a single flat rate does not honestly cover.
 * One function, so the cart, the confirmation and the placed order cannot
 * quote three different numbers.
 */
export function cartTotals(
  cart: FormeCart,
  fulfilment: Fulfilment = "delivery",
  region = "関東",
): CartTotals {
  const count = cart.lines.reduce((n, l) => n + l.quantity, 0);
  const subtotalMinor = cart.lines.reduce(
    (sum, l) => sum + l.unitPrice.minorUnits * l.quantity,
    0,
  );
  const subtotal = yen(subtotalMinor);

  let shipping = SHIPPING.pickup;
  if (fulfilment === "delivery" && count > 0) {
    const free = subtotalMinor >= SHIPPING.freeAbove.minorUnits;
    const surcharge = REGION_SURCHARGE[region]?.minorUnits ?? 0;
    // The surcharge covers a real extra cost, so it applies even when the
    // flat rate has been waived; saying otherwise would be a fake discount.
    shipping = yen(free ? surcharge : SHIPPING.flat.minorUnits + surcharge);
  }

  const shortfall = SHIPPING.freeAbove.minorUnits - subtotalMinor;
  return {
    count,
    subtotal,
    shipping,
    total: yen(subtotalMinor + shipping.minorUnits),
    toFreeShipping:
      fulfilment === "delivery" && shortfall > 0 ? yen(shortfall) : null,
  };
}

export type PriceChange = {
  lineId: string;
  productName: string;
  detail: string;
};

/**
 * Checks the cart against the catalogue and the shelf.
 *
 * Reports; it does not repair. A line whose price moved or whose stock ran
 * out is something the customer has to see before paying, not something to
 * quietly adjust underneath them.
 */
export function repriceCart(
  cart: FormeCart,
  stockDeltas: Record<string, number>,
  unpublished: readonly string[] = [],
): { changes: PriceChange[]; cart: FormeCart } {
  const changes: PriceChange[] = [];
  const lines: FormeCartLine[] = [];

  for (const line of cart.lines) {
    const product = productById(line.productId);
    if (!product || !product.published || unpublished.includes(product.id)) {
      changes.push({
        lineId: line.lineId,
        productName: product?.name ?? line.productId,
        detail: "取り扱いが終了したため、カートから外しました。",
      });
      continue;
    }

    const available = stockFor(line.productId, line.variantIds, stockDeltas);
    if (available <= 0) {
      changes.push({
        lineId: line.lineId,
        productName: product.name,
        detail: "在庫切れのため、カートから外しました。",
      });
      continue;
    }

    let kept = line;
    if (available < line.quantity) {
      changes.push({
        lineId: line.lineId,
        productName: product.name,
        detail: `在庫が ${available} 点になったため、数量を変更しました。`,
      });
      kept = { ...kept, quantity: available };
    }

    const current = unitPriceOf(product, line.variantIds);
    if (current.minorUnits !== line.unitPrice.minorUnits) {
      changes.push({
        lineId: line.lineId,
        productName: product.name,
        detail: `価格が ¥${line.unitPrice.minorUnits.toLocaleString("ja-JP")} から ¥${current.minorUnits.toLocaleString("ja-JP")} に変わりました。`,
      });
      kept = { ...kept, unitPrice: current };
    }

    lines.push(kept);
  }

  return { changes, cart: { lines, updatedAt: cart.updatedAt } };
}

/** The stock each cart line consumes, ready for `applyStock`. */
export const stockChangesFor = (cart: FormeCart, sign: 1 | -1) =>
  cart.lines.map((l) => ({
    key: skuKey(l.productId, l.variantIds),
    by: sign * l.quantity,
  }));
