import { hash } from "@/lib/runtime/ids";
import type { Money } from "@/lib/runtime/rules/money";
import { PAYMENT_LABELS } from "@/lib/shop/order";
import type { PaymentState } from "@/lib/shop/types";
import { productById } from "./catalog";
import { cartTotals, describeVariants, repriceCart } from "./cart";
import { skuKey, stockFor } from "./stock";
import {
  FORME_STATUS_LABELS,
  FULFILMENT_LABELS,
  type FormeCart,
  type FormeOrder,
  type FormeOrderLine,
  type FormeOrderStatus,
  type Fulfilment,
} from "./types";

export { PAYMENT_LABELS };

/**
 * Placing and moving a FORME order (指示書 §16).
 *
 * Two rules the cafe never needed:
 *
 * - The price is captured onto the order. A catalogue edit afterwards changes
 *   what the shop sells, not what this customer agreed to pay.
 * - Nothing ships before it is paid for. Collection is different — that is
 *   paid at the counter — and the difference is in the rule rather than in a
 *   hope that the operator remembers.
 */

const yen = (minorUnits: number): Money => ({
  minorUnits,
  scale: 0,
  currency: "JPY",
});

export type PlaceResult =
  | { ok: true; order: FormeOrder }
  | {
      ok: false;
      reason: string;
      changes?: ReturnType<typeof repriceCart>["changes"];
    };

export function placeOrder(input: {
  cart: FormeCart;
  fulfilment: Fulfilment;
  region: string;
  nowIso: string;
  note?: string;
  stockDeltas: Record<string, number>;
  unpublished?: readonly string[];
}): PlaceResult {
  if (!input.cart.lines.length)
    return { ok: false, reason: "カートが空です。" };

  // Checked again here, not only in the cart: the shelf can move between
  // opening the checkout and pressing the button.
  const { changes } = repriceCart(
    input.cart,
    input.stockDeltas,
    input.unpublished ?? [],
  );
  if (changes.length)
    return {
      ok: false,
      reason: "カートの内容が変わりました。ご確認のうえお進みください。",
      changes,
    };

  const lines: FormeOrderLine[] = [];
  for (const line of input.cart.lines) {
    const product = productById(line.productId);
    if (!product)
      return { ok: false, reason: "取り扱いが終了した商品が含まれています。" };

    const available = stockFor(
      line.productId,
      line.variantIds,
      input.stockDeltas,
    );
    if (available < line.quantity)
      return {
        ok: false,
        reason: `${product.name}の在庫が足りません（残り ${available} 点）。`,
      };

    lines.push({
      lineId: line.lineId,
      productId: product.id,
      productName: product.name,
      variantLabels: describeVariants(product, line.variantIds),
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: yen(line.unitPrice.minorUnits * line.quantity),
    });
  }

  const totals = cartTotals(input.cart, input.fulfilment, input.region);
  const orderId =
    "forme-" +
    hash({
      lines: lines.map((l) => [l.lineId, l.quantity]),
      fulfilment: input.fulfilment,
      region: input.region,
      placedAt: input.nowIso,
    }).slice(0, 14);

  return {
    ok: true,
    order: {
      orderId,
      reference: "F-" + hash(orderId).slice(0, 6).toUpperCase(),
      lines,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      fulfilment: input.fulfilment,
      region: input.fulfilment === "delivery" ? input.region : "",
      status: "placed",
      payment: "unpaid",
      placedAtIso: input.nowIso,
      updatedAtIso: input.nowIso,
      note: (input.note ?? "").slice(0, 200),
      history: [
        {
          at: input.nowIso,
          event: "placed",
          detail: `${lines.length} 品・${totals.count} 点を ${FULFILMENT_LABELS[input.fulfilment]} で受け付けました。`,
        },
      ],
    },
  };
}

/**
 * The shop's state machine.
 *
 * Cancelling stops at `preparing`. Once a parcel is with a carrier, a button
 * on a screen does not bring it back, and pretending otherwise is how a demo
 * teaches the wrong thing.
 */
const TRANSITIONS: Record<FormeOrderStatus, readonly FormeOrderStatus[]> = {
  placed: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const canAdvance = (from: FormeOrderStatus, to: FormeOrderStatus) =>
  TRANSITIONS[from].includes(to);

export const isCancellable = (order: FormeOrder) =>
  canAdvance(order.status, "cancelled");

/** Whether this order may leave the building yet, and why not. */
export function shippingBlock(order: FormeOrder): string | null {
  if (order.fulfilment === "pickup") return null;
  if (order.payment === "paid") return null;
  return `お支払いが${PAYMENT_LABELS[order.payment]}のため、発送できません。`;
}

export function advanceOrder(
  order: FormeOrder,
  to: FormeOrderStatus,
  atIso: string,
): { ok: boolean; reason?: string; order: FormeOrder } {
  if (!canAdvance(order.status, to))
    return {
      ok: false,
      reason: `${FORME_STATUS_LABELS[order.status]}から${FORME_STATUS_LABELS[to]}へは進められません。`,
      order,
    };

  if (to === "shipped") {
    const block = shippingBlock(order);
    if (block) return { ok: false, reason: block, order };
  }

  // Collection handed over unpaid is a decision the counter can make; it is
  // allowed and recorded rather than silently permitted.
  const note =
    to === "delivered" &&
    order.fulfilment === "pickup" &&
    order.payment !== "paid"
      ? "（未払いのままお渡し）"
      : "";

  return {
    ok: true,
    order: {
      ...order,
      status: to,
      updatedAtIso: atIso,
      history: [
        ...order.history,
        {
          at: atIso,
          event: to,
          detail: `${FORME_STATUS_LABELS[to]}へ変更しました。${note}`,
        },
      ],
    },
  };
}

export function applyPayment(
  order: FormeOrder,
  payment: PaymentState,
  atIso: string,
  paymentRef?: string,
): FormeOrder {
  return {
    ...order,
    payment,
    paymentRef: paymentRef ?? order.paymentRef,
    updatedAtIso: atIso,
    history: [
      ...order.history,
      {
        at: atIso,
        event: "payment",
        detail: `支払状態：${PAYMENT_LABELS[payment]}${paymentRef ? `（${paymentRef}）` : ""}`,
      },
    ],
  };
}

/** The stock a cancelled order gives back. */
export const restockChanges = (order: FormeOrder) =>
  order.lines.map((line) => ({
    key: skuKeyForLine(line),
    by: line.quantity,
  }));

/**
 * Recovers the SKU from an order line.
 *
 * The line stores labels for display, so the key is rebuilt from the
 * catalogue by matching them back to variant ids. A line whose product has
 * since been removed yields no key and simply restocks nothing, which is the
 * honest outcome: there is no shelf to put it back on.
 */
function skuKeyForLine(line: FormeOrderLine): string {
  const product = productById(line.productId);
  if (!product) return skuKey(line.productId, []);
  const ids = line.variantLabels
    .map((label) => product.variants.find((v) => v.label === label)?.id)
    .filter((id): id is string => !!id);
  return skuKey(line.productId, ids);
}

export type OrderTotals = {
  count: number;
  gross: Money;
  paid: Money;
  unpaid: Money;
  cancelled: number;
  awaitingShipment: number;
};

/** The operator's figures, computed once so two screens cannot disagree. */
export function orderTotals(orders: readonly FormeOrder[]): OrderTotals {
  let gross = 0;
  let paid = 0;
  let unpaid = 0;
  let cancelled = 0;
  let awaitingShipment = 0;

  for (const order of orders) {
    if (order.status === "cancelled") {
      cancelled++;
      continue;
    }
    gross += order.total.minorUnits;
    if (order.payment === "paid") paid += order.total.minorUnits;
    else unpaid += order.total.minorUnits;
    if (order.status === "placed" || order.status === "preparing")
      awaitingShipment++;
  }

  return {
    count: orders.filter((o) => o.status !== "cancelled").length,
    gross: yen(gross),
    paid: yen(paid),
    unpaid: yen(unpaid),
    cancelled,
    awaitingShipment,
  };
}

export { FORME_STATUS_LABELS, FULFILMENT_LABELS };
