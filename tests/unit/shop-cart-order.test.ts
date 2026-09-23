import { describe, expect, it } from "vitest";
import {
  addToCart,
  cartTotals,
  emptyCart,
  lineKey,
  MAX_LINE_QUANTITY,
  removeLine,
  repriceCart,
  setQuantity,
  unitPriceOf,
} from "@/lib/shop/cart";
import { productById, products } from "@/lib/shop/catalog";
import {
  advanceOrder,
  canAdvance,
  orderTotals,
  pickupSlots,
  placeOrder,
  prepMinutesFor,
} from "@/lib/shop/order";
import { attemptPayment, isReplay, paymentKeyFor } from "@/lib/shop/payment";
import type { Cart } from "@/lib/shop/types";

/** 受け入れ基準 Q13, Q14, Q17, Q19（指示書 §10, §12）。 */

// 2026-09-24 (木) 09:00 JST — a trading day, before the breakfast window ends.
const NOW = "2026-09-24T00:00:00.000Z";
const AT = NOW;

const withLatte = (quantity = 1): Cart => {
  const result = addToCart(emptyCart(), {
    productId: "latte",
    variantIds: ["temp-hot", "size-r"],
    quantity,
    atIso: AT,
  });
  if (!result.ok) throw new Error(result.reason);
  return result.cart;
};

describe("catalogue — 全商品が表示に必要な項目を持つ", () => {
  it("gives every product its own artwork id and a price", () => {
    const artIds = new Set<string>();
    for (const p of products) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.summary.length).toBeGreaterThan(0);
      expect(p.price.minorUnits).toBeGreaterThan(0);
      expect(p.price.currency).toBe("JPY");
      expect(p.artId.length).toBeGreaterThan(0);
      artIds.add(p.artId);
    }
    // No two products share an image (指示書 §07 / Q07, Q08).
    expect(artIds.size).toBe(products.length);
  });

  it("offers a temperature choice only where the product has one", () => {
    const espresso = productById("espresso")!;
    expect(
      espresso.variants.filter((v) => v.axis === "temperature"),
    ).toHaveLength(0);
    const latte = productById("latte")!;
    expect(
      latte.variants.filter((v) => v.axis === "temperature").length,
    ).toBeGreaterThan(0);
  });

  it("states allergens only where the fixture records them", () => {
    // Black coffee records none; a milk drink records milk. Nothing inferred.
    expect(productById("drip-house")!.allergens).toEqual([]);
    expect(productById("latte")!.allergens).toContain("乳");
  });
});

describe("cart — Q14 数量・価格・カートが一致する", () => {
  it("adds a line and totals it in integers", () => {
    const cart = withLatte(2);
    const totals = cartTotals(cart);
    expect(totals.count).toBe(2);
    expect(totals.total.minorUnits).toBe(560 * 2);
  });

  it("adds variant extras to the unit price", () => {
    const latte = productById("latte")!;
    expect(unitPriceOf(latte, ["temp-hot", "size-l"]).minorUnits).toBe(
      560 + 80,
    );
    expect(
      unitPriceOf(latte, ["temp-ice", "size-l", "addon-oat"]).minorUnits,
    ).toBe(560 + 80 + 60);
  });

  it("keeps different variants as separate lines", () => {
    const hot = withLatte();
    const both = addToCart(hot, {
      productId: "latte",
      variantIds: ["temp-ice", "size-r"],
      quantity: 1,
      atIso: AT,
    });
    expect(both.ok).toBe(true);
    if (!both.ok) return;
    expect(both.cart.lines).toHaveLength(2);
    expect(lineKey("latte", ["temp-hot", "size-r"])).not.toBe(
      lineKey("latte", ["temp-ice", "size-r"]),
    );
  });

  it("merges the same variant combination into one line", () => {
    const again = addToCart(withLatte(), {
      productId: "latte",
      variantIds: ["size-r", "temp-hot"], // order must not matter
      quantity: 2,
      atIso: AT,
    });
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.cart.lines).toHaveLength(1);
    expect(again.cart.lines[0].quantity).toBe(3);
  });

  it("refuses a sold-out product with a reason — Q19", () => {
    const result = addToCart(emptyCart(), {
      productId: "pudding",
      variantIds: [],
      quantity: 1,
      atIso: AT,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("売り切れ");
  });

  it("respects an operator marking something sold out", () => {
    const result = addToCart(emptyCart(), {
      productId: "latte",
      variantIds: ["temp-hot"],
      quantity: 1,
      atIso: AT,
      saleOverrides: { latte: "sold_out" },
    });
    expect(result.ok).toBe(false);
  });

  it("refuses two choices on the same axis", () => {
    const result = addToCart(emptyCart(), {
      productId: "latte",
      variantIds: ["temp-hot", "temp-ice"],
      quantity: 1,
      atIso: AT,
    });
    expect(result.ok).toBe(false);
  });

  it("allows several add-ons, which are not exclusive", () => {
    const result = addToCart(emptyCart(), {
      productId: "toast-set",
      variantIds: ["addon-butter", "addon-anko"],
      quantity: 1,
      atIso: AT,
    });
    expect(result.ok).toBe(true);
  });

  it("caps a line rather than accepting any quantity", () => {
    const result = addToCart(emptyCart(), {
      productId: "latte",
      variantIds: ["temp-hot"],
      quantity: MAX_LINE_QUANTITY + 1,
      atIso: AT,
    });
    expect(result.ok).toBe(false);
  });

  it("removes a line when its quantity reaches zero", () => {
    const cart = withLatte();
    expect(setQuantity(cart, cart.lines[0].lineId, 0, AT).lines).toHaveLength(
      0,
    );
    expect(removeLine(cart, cart.lines[0].lineId, AT).lines).toHaveLength(0);
  });

  it("totals an empty cart as zero, not as NaN", () => {
    expect(cartTotals(emptyCart()).total.minorUnits).toBe(0);
  });
});

describe("repriceCart — 勝手に値段を書き換えない", () => {
  it("reports a price change instead of applying it silently", () => {
    const cart = withLatte();
    const stale: Cart = {
      ...cart,
      lines: [
        {
          ...cart.lines[0],
          unitPrice: { minorUnits: 500, scale: 0, currency: "JPY" },
        },
      ],
    };
    const { changes } = repriceCart(stale);
    expect(changes).toHaveLength(1);
    expect(changes[0].kind).toBe("price_changed");
    expect(changes[0].detail).toContain("560");
  });

  it("drops a line that became unavailable and says why", () => {
    const cart = withLatte();
    const { changes, cart: next } = repriceCart(cart, { latte: "sold_out" });
    expect(next.lines).toHaveLength(0);
    expect(changes[0].kind).toBe("unavailable");
  });
});

describe("pickup slots — Q17 受取時間が調理時間と営業時間に連動する", () => {
  it("never offers a slot before the food can be made", () => {
    const cart = withLatte();
    const slots = pickupSlots(cart, NOW);
    const prep = prepMinutesFor(cart);
    expect(prep).toBe(5);
    // 09:00 + 5 minutes, rounded up to the next quarter hour.
    expect(slots[0].label).toBe("09:15");
  });

  it("uses the slowest item in the cart", () => {
    const withSandwich = addToCart(withLatte(), {
      productId: "sandwich",
      variantIds: [],
      quantity: 1,
      atIso: AT,
    });
    if (!withSandwich.ok) throw new Error("setup");
    expect(prepMinutesFor(withSandwich.cart)).toBe(12);
  });

  it("stops offering a breakfast item past its serving window", () => {
    const toast = addToCart(emptyCart(), {
      productId: "toast-set",
      variantIds: ["addon-butter"],
      quantity: 1,
      atIso: AT,
    });
    if (!toast.ok) throw new Error("setup");
    const slots = pickupSlots(toast.cart, NOW);
    // Served until 11:00, so nothing later is offered.
    for (const slot of slots) expect(slot.minute).toBeLessThanOrEqual(11 * 60);
  });

  it("marks a slot unavailable once it is full", () => {
    const cart = withLatte();
    const slots = pickupSlots(cart, NOW);
    const target = slots[0].iso;
    const placed = [0, 1, 2].map((i) => {
      const result = placeOrder({
        cart,
        pickupAtIso: target,
        nowIso: NOW,
        existingOrders: [],
      });
      if (!result.ok) throw new Error(result.reason);
      return { ...result.order, orderId: `o${i}` };
    });
    const after = pickupSlots(cart, NOW, placed);
    expect(after.find((s) => s.iso === target)?.available).toBe(false);
  });
});

describe("placeOrder — Q17/Q19 注文が最後まで通り、壊れない", () => {
  it("places an order with recomputed totals", () => {
    const cart = withLatte(2);
    const slot = pickupSlots(cart, NOW)[0];
    const result = placeOrder({
      cart,
      pickupAtIso: slot.iso,
      nowIso: NOW,
      existingOrders: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.total.minorUnits).toBe(560 * 2);
    expect(result.order.reference).toMatch(/^K-[0-9A-F]{6}$/);
    expect(result.order.status).toBe("placed");
    expect(result.order.payment).toBe("unpaid");
  });

  it("gives the same order id for the same cart and slot — 二重クリック対策", () => {
    const cart = withLatte();
    const slot = pickupSlots(cart, NOW)[0];
    const first = placeOrder({
      cart,
      pickupAtIso: slot.iso,
      nowIso: NOW,
      existingOrders: [],
    });
    const second = placeOrder({
      cart,
      pickupAtIso: slot.iso,
      nowIso: NOW,
      existingOrders: [],
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.order.orderId).toBe(first.order.orderId);
  });

  it("refuses an empty cart", () => {
    const result = placeOrder({
      cart: emptyCart(),
      pickupAtIso: NOW,
      nowIso: NOW,
      existingOrders: [],
    });
    expect(result.ok).toBe(false);
  });

  it("refuses a slot that is not on offer", () => {
    const result = placeOrder({
      cart: withLatte(),
      pickupAtIso: "2026-09-24T23:00:00.000Z",
      nowIso: NOW,
      existingOrders: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("選び直");
  });

  it("refuses when an item sold out between adding and checking out", () => {
    const cart = withLatte();
    const slot = pickupSlots(cart, NOW)[0];
    const result = placeOrder({
      cart,
      pickupAtIso: slot.iso,
      nowIso: NOW,
      existingOrders: [],
      saleOverrides: { latte: "sold_out" },
    });
    expect(result.ok).toBe(false);
  });
});

describe("order lifecycle — Q18 運営の操作が同じ記録へ残る", () => {
  const order = (() => {
    const cart = withLatte();
    const slot = pickupSlots(cart, NOW)[0];
    const result = placeOrder({
      cart,
      pickupAtIso: slot.iso,
      nowIso: NOW,
      existingOrders: [],
    });
    if (!result.ok) throw new Error("setup");
    return result.order;
  })();

  it("allows only the transitions the kitchen actually has", () => {
    expect(canAdvance("placed", "preparing")).toBe(true);
    expect(canAdvance("preparing", "ready")).toBe(true);
    expect(canAdvance("ready", "handed_over")).toBe(true);
    expect(canAdvance("handed_over", "preparing")).toBe(false);
    expect(canAdvance("cancelled", "preparing")).toBe(false);
  });

  it("records each advance in the order's own history", () => {
    const next = advanceOrder(order, "preparing", AT);
    expect(next.ok).toBe(true);
    expect(next.order.history.at(-1)?.detail).toContain("調理中");
  });

  it("notes an unpaid hand-over rather than hiding it", () => {
    const ready = advanceOrder(
      advanceOrder(order, "preparing", AT).order,
      "ready",
      AT,
    ).order;
    const done = advanceOrder(ready, "handed_over", AT);
    expect(done.order.history.at(-1)?.detail).toContain("未払い");
  });

  it("separates money taken from money owed", () => {
    const totals = orderTotals([order]);
    expect(totals.gross.minorUnits).toBe(560);
    expect(totals.paid.minorUnits).toBe(0);
    expect(totals.unpaid.minorUnits).toBe(560);
  });

  it("excludes a cancelled order from the takings", () => {
    const cancelled = advanceOrder(order, "cancelled", AT).order;
    const totals = orderTotals([cancelled]);
    expect(totals.count).toBe(0);
    expect(totals.gross.minorUnits).toBe(0);
    expect(totals.cancelled).toBe(1);
  });
});

describe("payment simulator — 実決済と混同しない", () => {
  const amount = { minorUnits: 560, scale: 0, currency: "JPY" };

  it("maps each outcome to the state the screens must handle", () => {
    const outcomes = {
      approve: "paid",
      decline: "declined",
      pending: "pending",
      cancel: "unpaid",
      timeout: "outcome_unknown",
    } as const;
    for (const [outcome, state] of Object.entries(outcomes))
      expect(
        attemptPayment({
          orderId: "o1",
          amount,
          outcome: outcome as keyof typeof outcomes,
          atIso: AT,
        }).state,
      ).toBe(state);
  });

  it("never claims to be an external provider", () => {
    const attempt = attemptPayment({
      orderId: "o1",
      amount,
      outcome: "approve",
      atIso: AT,
    });
    expect(attempt.external).toBe(false);
  });

  it("recognises an attempt rebuilt from a stored order", () => {
    // The console and the order screen do not keep attempt records; they
    // reconstruct one from the order. If that reconstruction derives a
    // different key, nothing ever matches and the guard is decoration.
    const first = attemptPayment({
      orderId: "o9",
      amount,
      outcome: "approve",
      atIso: AT,
    });
    const rebuilt = {
      ...first,
      attemptId: first.reference!,
      idempotencyKey: paymentKeyFor("o9", amount),
      detail: "",
    };
    const replay = attemptPayment({
      orderId: "o9",
      amount,
      outcome: "approve",
      atIso: AT,
      previous: [rebuilt],
    });
    expect(isReplay(replay)).toBe(true);
    expect(replay.detail).toContain("再実行しません");
  });

  it("does not charge twice for the same order and amount", () => {
    const first = attemptPayment({
      orderId: "o1",
      amount,
      outcome: "approve",
      atIso: AT,
    });
    const replay = attemptPayment({
      orderId: "o1",
      amount,
      outcome: "approve",
      atIso: AT,
      previous: [first],
    });
    expect(replay.idempotencyKey).toBe(first.idempotencyKey);
    expect(replay.detail).toContain("再実行しません");
  });

  it("does not silently retry an unknown outcome", () => {
    const unknown = attemptPayment({
      orderId: "o2",
      amount,
      outcome: "timeout",
      atIso: AT,
    });
    const replay = attemptPayment({
      orderId: "o2",
      amount,
      outcome: "approve",
      atIso: AT,
      previous: [unknown],
    });
    expect(replay.state).toBe("outcome_unknown");
    expect(replay.detail).toContain("自動での再実行はしません");
  });
});

describe("pickup slots — 受付が終わったら次に開く日へ回す", () => {
  // 2026-09-23 (水) 19:30 JST. Past the last order, and a closing day.
  const EVENING = "2026-09-23T10:30:00.000Z";

  it("offers the next open day rather than nothing", () => {
    const slots = pickupSlots(withLatte(), EVENING);
    expect(slots.length).toBeGreaterThan(0);
    // Wednesday is a closing day, so every slot lands on the Thursday.
    for (const slot of slots) expect(slot.dayKey).toBe("2026-09-24");
  });

  it("starts a later day at opening, not at the current time", () => {
    const slots = pickupSlots(withLatte(), EVENING);
    expect(slots[0].minute).toBe(8 * 60);
    expect(slots[0].label).toBe("9/24 08:00");
  });

  it("keeps today's labels free of a date", () => {
    const slots = pickupSlots(withLatte(), NOW);
    expect(slots[0].dayKey).toBe("2026-09-24");
    expect(slots[0].label).toBe("09:15");
  });

  it("still refuses a slot outside the cart's serving window", () => {
    const toast = addToCart(emptyCart(), {
      productId: "toast-set",
      variantIds: [],
      quantity: 1,
      atIso: EVENING,
    });
    if (!toast.ok) throw new Error("setup");
    const slots = pickupSlots(toast.cart, EVENING);
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) expect(slot.minute).toBeLessThanOrEqual(11 * 60);
  });

  it("accepts an order for the rolled-forward day", () => {
    const cart = withLatte();
    const slot = pickupSlots(cart, EVENING)[0];
    const result = placeOrder({
      cart,
      pickupAtIso: slot.iso,
      nowIso: EVENING,
      existingOrders: [],
    });
    expect(result.ok).toBe(true);
  });
});
