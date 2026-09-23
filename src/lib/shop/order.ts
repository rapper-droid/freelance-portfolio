import { hash } from "@/lib/runtime/ids";
import { fromJst, toJst } from "@/lib/runtime/rules/datetime";
import type { Money } from "@/lib/runtime/rules/money";
import { CATEGORY_LABELS, HOURS, productById } from "./catalog";
import { cartTotals, describeVariants } from "./cart";
import type {
  Cart,
  Order,
  OrderLine,
  OrderStatus,
  PaymentState,
  SaleState,
} from "./types";

/**
 * Placing an order and moving it through the kitchen (指示書 §12).
 *
 * Pickup times come from the food, not from a dropdown of round numbers: the
 * slowest item in the cart sets the earliest slot, and the shop's own hours
 * and last-order time bound it. An order the kitchen cannot make by the stated
 * time is not a slot worth offering.
 */

export const SLOT_STEP_MINUTES = 15;
/** How far ahead pickup can be booked. */
export const SLOT_HORIZON_MINUTES = 6 * 60;
/** Orders per slot the counter can hand over comfortably. */
export const SLOT_CAPACITY = 3;

const minuteOfDay = (iso: string) => {
  const p = toJst(iso);
  return p.hour * 60 + p.minute;
};

/** The longest prep time in the cart; that is when the whole order is ready. */
export function prepMinutesFor(cart: Cart): number {
  let longest = 0;
  for (const line of cart.lines) {
    const product = productById(line.productId);
    if (product) longest = Math.max(longest, product.prepMinutes);
  }
  return longest;
}

export type Slot = {
  iso: string;
  minute: number;
  label: string;
  /** False when the shop can take it but this slot is already busy. */
  available: boolean;
  reason?: string;
};

/**
 * Pickup slots for a cart on a given day.
 *
 * Respects opening hours, the last-order time, each product's own serving
 * window and how many orders already share a slot. A product served only at
 * breakfast cannot be collected at four in the afternoon, and saying so here
 * is cheaper than saying sorry at the counter.
 */
export function pickupSlots(
  cart: Cart,
  nowIso: string,
  existingOrders: readonly Order[] = [],
): Slot[] {
  const prep = prepMinutesFor(cart);
  const now = toJst(nowIso);
  const nowMinute = now.hour * 60 + now.minute;
  const earliest = nowMinute + prep;

  // The narrowest serving window across the cart bounds every slot.
  let servedFrom = HOURS.openMinute;
  let servedTo = HOURS.lastOrderMinute;
  for (const line of cart.lines) {
    const product = productById(line.productId);
    if (!product) continue;
    if (product.servedFrom !== undefined)
      servedFrom = Math.max(servedFrom, product.servedFrom);
    if (product.servedTo !== undefined)
      servedTo = Math.min(servedTo, product.servedTo);
  }

  const slots: Slot[] = [];
  const first =
    Math.ceil(Math.max(earliest, servedFrom) / SLOT_STEP_MINUTES) *
    SLOT_STEP_MINUTES;

  for (
    let minute = first;
    minute <= Math.min(servedTo, nowMinute + SLOT_HORIZON_MINUTES);
    minute += SLOT_STEP_MINUTES
  ) {
    const iso = fromJst({
      year: now.year,
      month: now.month,
      day: now.day,
      hour: Math.floor(minute / 60),
      minute: minute % 60,
    });
    const taken = existingOrders.filter(
      (o) => o.status !== "cancelled" && o.pickupAtIso === iso,
    ).length;
    slots.push({
      iso,
      minute,
      label: `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
      available: taken < SLOT_CAPACITY,
      reason:
        taken < SLOT_CAPACITY
          ? undefined
          : "この時間は受取が混み合っています。",
    });
  }

  return slots;
}

export type PlaceResult =
  { ok: true; order: Order } | { ok: false; reason: string };

/** Short enough to read out at a counter, unique enough not to collide. */
const reference = (seed: unknown) =>
  "K-" + hash(seed).slice(0, 6).toUpperCase();

export function placeOrder(input: {
  cart: Cart;
  pickupAtIso: string;
  nowIso: string;
  note?: string;
  existingOrders: readonly Order[];
  saleOverrides?: Record<string, SaleState>;
}): PlaceResult {
  if (!input.cart.lines.length)
    return { ok: false, reason: "カートが空です。" };

  const slots = pickupSlots(input.cart, input.nowIso, input.existingOrders);
  const chosen = slots.find((s) => s.iso === input.pickupAtIso);
  if (!chosen)
    return {
      ok: false,
      reason:
        "選択した受取時間は、いまは選べません。時間を選び直してください。",
    };
  if (!chosen.available)
    return {
      ok: false,
      reason: chosen.reason ?? "この時間は受け付けられません。",
    };

  const lines: OrderLine[] = [];
  for (const line of input.cart.lines) {
    const product = productById(line.productId);
    if (!product)
      return { ok: false, reason: "取り扱いが終了した商品が含まれています。" };
    const state = input.saleOverrides?.[product.id] ?? product.saleState;
    if (state !== "on_sale")
      return {
        ok: false,
        reason: `${product.name}が注文できなくなりました。内容を確認してください。`,
      };
    lines.push({
      lineId: line.lineId,
      productId: product.id,
      productName: product.name,
      variantLabels: describeVariants(product, line.variantIds),
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: {
        minorUnits: line.unitPrice.minorUnits * line.quantity,
        scale: 0,
        currency: "JPY",
      },
    });
  }

  // Recomputed here rather than taken from the screen (指示書 §12).
  const totals = cartTotals(input.cart);
  const orderId =
    "order-" +
    hash({
      lines: lines.map((l) => [l.lineId, l.quantity]),
      pickupAtIso: input.pickupAtIso,
      placedAt: input.nowIso,
    }).slice(0, 14);

  return {
    ok: true,
    order: {
      orderId,
      reference: reference(orderId),
      lines,
      subtotal: totals.subtotal,
      total: totals.total,
      method: "pickup",
      pickupAtIso: input.pickupAtIso,
      status: "placed",
      payment: "unpaid",
      placedAtIso: input.nowIso,
      updatedAtIso: input.nowIso,
      note: (input.note ?? "").slice(0, 200),
      history: [
        {
          at: input.nowIso,
          event: "placed",
          detail: `${lines.length} 品・${totals.count} 点を受け付けました。`,
        },
      ],
    },
  };
}

/**
 * The kitchen's state machine. Transitions not listed cannot happen, which is
 * what stops an order going from handed over back to preparing.
 */
const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  placed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["handed_over", "cancelled"],
  handed_over: [],
  cancelled: [],
};

export const canAdvance = (from: OrderStatus, to: OrderStatus) =>
  ORDER_TRANSITIONS[from].includes(to);

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "受付",
  preparing: "調理中",
  ready: "受取待ち",
  handed_over: "受渡済み",
  cancelled: "取消",
};

export function advanceOrder(
  order: Order,
  to: OrderStatus,
  atIso: string,
): { ok: boolean; reason?: string; order: Order } {
  if (!canAdvance(order.status, to))
    return {
      ok: false,
      reason: `${ORDER_STATUS_LABELS[order.status]}から${ORDER_STATUS_LABELS[to]}へは進められません。`,
      order,
    };
  // Handing over an unpaid order is a decision, not an accident: it is allowed
  // but recorded, because the shop takes payment at the counter.
  const note =
    to === "handed_over" && order.payment !== "paid"
      ? "（未払いのまま受け渡し）"
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
          detail: `${ORDER_STATUS_LABELS[to]}へ変更しました。${note}`,
        },
      ],
    },
  };
}

export function applyPayment(
  order: Order,
  payment: PaymentState,
  atIso: string,
  paymentRef?: string,
): Order {
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

export const PAYMENT_LABELS: Record<PaymentState, string> = {
  unpaid: "未払い（店頭でお支払い）",
  authorised: "与信済み",
  paid: "支払済み",
  declined: "拒否",
  pending: "保留",
  refunded: "返金済み",
  outcome_unknown: "結果不明",
};

/** Totals for the operator console, separating money taken from money owed. */
export function orderTotals(orders: readonly Order[]): {
  count: number;
  gross: Money;
  paid: Money;
  unpaid: Money;
  cancelled: number;
} {
  let gross = 0;
  let paid = 0;
  let unpaid = 0;
  let cancelled = 0;
  for (const order of orders) {
    if (order.status === "cancelled") {
      cancelled++;
      continue;
    }
    gross += order.total.minorUnits;
    if (order.payment === "paid") paid += order.total.minorUnits;
    else unpaid += order.total.minorUnits;
  }
  const money = (minorUnits: number): Money => ({
    minorUnits,
    scale: 0,
    currency: "JPY",
  });
  return {
    count: orders.filter((o) => o.status !== "cancelled").length,
    gross: money(gross),
    paid: money(paid),
    unpaid: money(unpaid),
    cancelled,
  };
}

export { CATEGORY_LABELS };
