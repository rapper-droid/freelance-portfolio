import { sumMoney, type Money } from "@/lib/runtime/rules/money";
import { hash } from "@/lib/runtime/ids";
import { productById, variantById } from "./catalog";
import type { Cart, CartLine, Product, SaleState, Variant } from "./types";

/**
 * Cart arithmetic (指示書 §12).
 *
 * Every total is recomputed here from the catalogue and the stored unit price.
 * A total that arrives from a screen is never trusted as the amount to charge
 * — the screen is where a number is displayed, not where it is decided.
 *
 * Prices are captured onto the line when it is added, so a menu change between
 * adding and checking out does not silently alter what the customer agreed to.
 * The change is surfaced instead, by `repriceCart`.
 */

export const emptyCart = (): Cart => ({ lines: [], updatedAt: "" });

/**
 * Identifies a line by product *and* chosen variants, so a hot latte and an
 * iced one are two lines rather than a quantity of two of something ambiguous.
 */
export const lineKey = (productId: string, variantIds: readonly string[]) =>
  "ln-" + hash({ productId, variantIds: [...variantIds].sort() }).slice(0, 12);

export function unitPriceOf(
  product: Product,
  variantIds: readonly string[],
): Money {
  const extras = variantIds
    .map((id) => variantById(product, id)?.extra)
    .filter((m): m is Money => !!m);
  return sumMoney([product.price, ...extras]) ?? product.price;
}

export type AddResult =
  { ok: true; cart: Cart } | { ok: false; reason: string };

/** Why a product cannot be added right now, in words a customer can act on. */
const SALE_REASONS: Record<Exclude<SaleState, "on_sale">, string> = {
  sold_out: "本日分は売り切れました。",
  closed_for_now: "いまの時間は承っていません。",
  ended: "販売を終了しました。",
};

export const MAX_LINE_QUANTITY = 20;

export function addToCart(
  cart: Cart,
  input: {
    productId: string;
    variantIds: readonly string[];
    quantity: number;
    atIso: string;
    /** Operator overrides; the catalogue value alone is not the last word. */
    saleOverrides?: Record<string, SaleState>;
  },
): AddResult {
  const product = productById(input.productId);
  if (!product)
    return { ok: false, reason: "この商品は見つかりませんでした。" };

  const state = input.saleOverrides?.[product.id] ?? product.saleState;
  if (state !== "on_sale") return { ok: false, reason: SALE_REASONS[state] };

  for (const id of input.variantIds) {
    const variant = variantById(product, id);
    if (!variant) return { ok: false, reason: "選択できない組み合わせです。" };
    if (variant.saleState !== "on_sale")
      return { ok: false, reason: `${variant.label}は選べません。` };
  }

  // At most one choice per axis: a drink is hot or iced, not both.
  const axes = input.variantIds
    .map((id) => variantById(product, id)?.axis)
    .filter(Boolean);
  const nonAddon = axes.filter((a) => a !== "addon");
  if (new Set(nonAddon).size !== nonAddon.length)
    return { ok: false, reason: "同じ項目を二つ選ぶことはできません。" };

  const quantity = Math.floor(input.quantity);
  if (!Number.isFinite(quantity) || quantity < 1)
    return { ok: false, reason: "数量を1以上で指定してください。" };

  const key = lineKey(product.id, input.variantIds);
  const existing = cart.lines.find((l) => l.lineId === key);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (nextQuantity > MAX_LINE_QUANTITY)
    return {
      ok: false,
      reason: `同じ内容は${MAX_LINE_QUANTITY}点までお願いしています。`,
    };

  const line: CartLine = {
    lineId: key,
    productId: product.id,
    variantIds: [...input.variantIds],
    quantity: nextQuantity,
    unitPrice: unitPriceOf(product, input.variantIds),
  };

  return {
    ok: true,
    cart: {
      lines: existing
        ? cart.lines.map((l) => (l.lineId === key ? line : l))
        : [...cart.lines, line],
      updatedAt: input.atIso,
    },
  };
}

export function setQuantity(
  cart: Cart,
  lineId: string,
  quantity: number,
  atIso: string,
): Cart {
  const next = Math.floor(quantity);
  if (next <= 0)
    return {
      lines: cart.lines.filter((l) => l.lineId !== lineId),
      updatedAt: atIso,
    };
  return {
    lines: cart.lines.map((l) =>
      l.lineId === lineId
        ? { ...l, quantity: Math.min(next, MAX_LINE_QUANTITY) }
        : l,
    ),
    updatedAt: atIso,
  };
}

export const removeLine = (
  cart: Cart,
  lineId: string,
  atIso: string,
): Cart => ({
  lines: cart.lines.filter((l) => l.lineId !== lineId),
  updatedAt: atIso,
});

export type CartTotals = {
  count: number;
  subtotal: Money;
  total: Money;
};

const ZERO: Money = { minorUnits: 0, scale: 0, currency: "JPY" };

/** Recomputed from the lines every time; never read off a screen. */
export function cartTotals(cart: Cart): CartTotals {
  let minorUnits = 0;
  let count = 0;
  for (const line of cart.lines) {
    minorUnits += line.unitPrice.minorUnits * line.quantity;
    count += line.quantity;
  }
  const money: Money = { minorUnits, scale: 0, currency: "JPY" };
  return {
    count,
    subtotal: cart.lines.length ? money : ZERO,
    total: cart.lines.length ? money : ZERO,
  };
}

export type RepriceChange = {
  lineId: string;
  productName: string;
  kind: "price_changed" | "unavailable";
  detail: string;
};

/**
 * Compares the cart against the catalogue as it stands now.
 *
 * Returns the changes rather than applying them, because silently updating a
 * price the customer already saw is the behaviour this guards against. The
 * checkout screen shows these and asks.
 */
export function repriceCart(
  cart: Cart,
  saleOverrides: Record<string, SaleState> = {},
): { changes: RepriceChange[]; cart: Cart } {
  const changes: RepriceChange[] = [];
  const lines: CartLine[] = [];

  for (const line of cart.lines) {
    const product = productById(line.productId);
    if (!product) {
      changes.push({
        lineId: line.lineId,
        productName: line.productId,
        kind: "unavailable",
        detail: "取り扱いが終了しました。",
      });
      continue;
    }
    const state = saleOverrides[product.id] ?? product.saleState;
    if (state !== "on_sale") {
      changes.push({
        lineId: line.lineId,
        productName: product.name,
        kind: "unavailable",
        detail: SALE_REASONS[state],
      });
      continue;
    }
    const current = unitPriceOf(product, line.variantIds);
    if (current.minorUnits !== line.unitPrice.minorUnits) {
      changes.push({
        lineId: line.lineId,
        productName: product.name,
        kind: "price_changed",
        detail: `${line.unitPrice.minorUnits}円 → ${current.minorUnits}円`,
      });
      lines.push({ ...line, unitPrice: current });
      continue;
    }
    lines.push(line);
  }

  return { changes, cart: { lines, updatedAt: cart.updatedAt } };
}

export function describeVariants(
  product: Product,
  variantIds: readonly string[],
): string[] {
  return variantIds
    .map((id) => variantById(product, id))
    .filter((v): v is Variant => !!v)
    .map((v) => v.label);
}
