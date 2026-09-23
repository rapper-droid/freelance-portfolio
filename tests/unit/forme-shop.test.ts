import { describe, expect, it } from "vitest";
import {
  addToCart,
  cartTotals,
  emptyCart,
  removeLine,
  repriceCart,
  selectionComplete,
  setQuantity,
  stockChangesFor,
  unitPriceOf,
} from "@/lib/forme/cart";
import { SHIPPING, productById, products } from "@/lib/forme/catalog";
import {
  advanceOrder,
  applyPayment,
  orderTotals,
  placeOrder,
  restockChanges,
  shippingBlock,
} from "@/lib/forme/order";
import {
  allSkus,
  anyInStock,
  applyStock,
  baseStock,
  describeSku,
  levelOf,
  setStock,
  skuKey,
  skusOf,
  stockFor,
  stockLabel,
  totalStock,
} from "@/lib/forme/stock";
import { FORME_SCHEMA_VERSION, migrateForme } from "@/lib/forme/store";
import type { FormeCart } from "@/lib/forme/types";

/** 受け入れ基準 Q26（指示書 §16）。 */

const NOW = "2026-09-23T01:00:00.000Z";
const LATER = "2026-09-23T02:00:00.000Z";

/** Sage 350ml: twelve on the shelf, so there is room to push against. */
const SAGE = ["tumbler-sage", "tumbler-350"];
const SAND_500 = ["tumbler-sand", "tumbler-500"]; // zero on the shelf

const withTumbler = (quantity = 1, deltas = {}): FormeCart => {
  const result = addToCart(emptyCart(), {
    productId: "tumbler",
    variantIds: SAGE,
    quantity,
    atIso: NOW,
    stockDeltas: deltas,
  });
  if (!result.ok) throw new Error(result.reason);
  return result.cart;
};

describe("catalogue — 表示に必要な項目がそろっている", () => {
  it("gives every product a price, a summary and a spec", () => {
    expect(products.length).toBeGreaterThanOrEqual(6);
    for (const product of products) {
      expect(product.price.minorUnits).toBeGreaterThan(0);
      expect(product.price.currency).toBe("JPY");
      expect(product.summary.length).toBeGreaterThan(8);
      expect(product.spec.length).toBeGreaterThanOrEqual(3);
      expect(product.weightGrams).toBeGreaterThan(0);
    }
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
  });

  it("gives every photographed colour an alt text that names it", () => {
    for (const product of products)
      for (const [variantId, images] of Object.entries(product.images)) {
        const variant = product.variants.find((v) => v.id === variantId);
        expect(
          variant,
          `${product.id} has no variant ${variantId}`,
        ).toBeTruthy();
        for (const image of images) {
          expect(image.alt.length).toBeGreaterThan(10);
          expect(image.caption.length).toBeGreaterThan(0);
        }
      }
  });

  it("invents no reviews, ratings or awards", () => {
    // §16: fabricated social proof is the one thing a fictional shop must not
    // carry. This fails the moment such a field is added.
    for (const product of products) {
      const keys = Object.keys(product);
      expect(keys).not.toContain("rating");
      expect(keys).not.toContain("reviews");
      expect(keys).not.toContain("awards");
      expect(keys).not.toContain("popularity");
    }
  });
});

describe("stock — 「残り2点」と「売り切れ」は別の文", () => {
  it("names every combination of every product", () => {
    const tumbler = productById("tumbler")!;
    // Three colours by two sizes.
    expect(skusOf(tumbler)).toHaveLength(6);
    // No variants at all is still one sellable thing.
    expect(skusOf(productById("care-kit")!)).toEqual([[]]);
    expect(allSkus().length).toBeGreaterThanOrEqual(19);
  });

  it("reports the shelf, not a guess", () => {
    expect(stockFor("tumbler", SAGE, {})).toBe(12);
    expect(stockFor("tumbler", SAND_500, {})).toBe(0);
    expect(
      levelOf(stockFor("tumbler", ["tumbler-sand", "tumbler-350"], {})),
    ).toBe("low");
    expect(stockLabel(2)).toBe("残り 2 点");
    expect(stockLabel(0)).toBe("在庫切れ");
    expect(stockLabel(9)).toBe("在庫あり");
  });

  it("stores changes as deltas so a later restock is not overridden", () => {
    const key = skuKey("tumbler", SAGE);
    const deltas = applyStock({}, [{ key, by: -3 }]);
    expect(deltas[key]).toBe(-3);
    expect(stockFor("tumbler", SAGE, deltas)).toBe(baseStock(key) - 3);
    // Back to the published number means no delta at all, not a zero entry.
    expect(applyStock(deltas, [{ key, by: 3 }])).toEqual({});
  });

  it("never lets a shelf go negative", () => {
    const key = skuKey("tumbler", SAGE);
    const deltas = applyStock({}, [{ key, by: -99 }]);
    expect(stockFor("tumbler", SAGE, deltas)).toBe(0);
  });

  it("sets an exact count, which is what an operator does", () => {
    const key = skuKey("mug", ["mug-sand"]);
    const deltas = setStock({}, key, 3);
    expect(stockFor("mug", ["mug-sand"], deltas)).toBe(3);
    expect(setStock(deltas, key, baseStock(key))).toEqual({});
    expect(stockFor("mug", ["mug-sand"], setStock({}, key, -5))).toBe(0);
  });

  it("knows when nothing of a product can be bought", () => {
    const lunch = productById("lunch-box")!;
    expect(anyInStock(lunch, {})).toBe(true);
    const empty = skusOf(lunch).reduce(
      (deltas, ids) => setStock(deltas, skuKey(lunch.id, ids), 0),
      {},
    );
    expect(anyInStock(lunch, empty)).toBe(false);
    expect(totalStock(lunch, empty)).toBe(0);
  });

  it("describes a SKU in the operator's words", () => {
    expect(describeSku(skuKey("tumbler", SAGE))).toContain("タンブラー");
    expect(describeSku(skuKey("tumbler", SAGE))).toContain("セージ");
    expect(describeSku(skuKey("care-kit", []))).toBe("お手入れキット");
  });
});

describe("cart — 在庫を超えて買えない", () => {
  it("adds a complete selection and prices it from the catalogue", () => {
    const cart = withTumbler(2);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].quantity).toBe(2);
    expect(cart.lines[0].unitPrice.minorUnits).toBe(3800);
    // The larger size costs more, and the line carries that.
    expect(
      unitPriceOf(productById("tumbler")!, ["tumbler-sage", "tumbler-500"])
        .minorUnits,
    ).toBe(4400);
  });

  it("refuses a half-chosen combination", () => {
    const tumbler = productById("tumbler")!;
    expect(selectionComplete(tumbler, ["tumbler-sage"])).toBe(false);
    expect(selectionComplete(tumbler, SAGE)).toBe(true);
    const result = addToCart(emptyCart(), {
      productId: "tumbler",
      variantIds: ["tumbler-sage"],
      quantity: 1,
      atIso: NOW,
      stockDeltas: {},
    });
    expect(result.ok).toBe(false);
  });

  it("refuses what is not on the shelf", () => {
    const result = addToCart(emptyCart(), {
      productId: "tumbler",
      variantIds: SAND_500,
      quantity: 1,
      atIso: NOW,
      stockDeltas: {},
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("在庫切れ");
  });

  it("counts what is already in the cart against the shelf", () => {
    const key = skuKey("tumbler", SAGE);
    const deltas = setStock({}, key, 2);
    const cart = withTumbler(2, deltas);
    const more = addToCart(cart, {
      productId: "tumbler",
      variantIds: SAGE,
      quantity: 1,
      atIso: NOW,
      stockDeltas: deltas,
    });
    expect(more.ok).toBe(false);
    if (!more.ok) expect(more.reason).toContain("これ以上");
  });

  it("caps a quantity change and says what it did", () => {
    const key = skuKey("tumbler", SAGE);
    const deltas = setStock({}, key, 4);
    const cart = withTumbler(1, deltas);
    const result = setQuantity(cart, cart.lines[0].lineId, 9, LATER, deltas);
    expect(result.cart.lines[0].quantity).toBe(4);
    expect(result.reason).toContain("在庫は 4 点");
  });

  it("removes a line by setting it to zero", () => {
    const cart = withTumbler(1);
    expect(
      setQuantity(cart, cart.lines[0].lineId, 0, LATER, {}).cart.lines,
    ).toHaveLength(0);
    expect(removeLine(cart, cart.lines[0].lineId, LATER).lines).toHaveLength(0);
  });
});

describe("totals — 送料のルールが一つの関数から出る", () => {
  it("charges the flat rate below the threshold", () => {
    const totals = cartTotals(withTumbler(1), "delivery", "関東");
    expect(totals.subtotal.minorUnits).toBe(3800);
    expect(totals.shipping.minorUnits).toBe(SHIPPING.flat.minorUnits);
    expect(totals.total.minorUnits).toBe(3800 + 600);
    expect(totals.toFreeShipping?.minorUnits).toBe(8000 - 3800);
  });

  it("waives the flat rate above it, and says nothing more is needed", () => {
    const totals = cartTotals(withTumbler(3), "delivery", "関東");
    expect(totals.subtotal.minorUnits).toBe(11400);
    expect(totals.shipping.minorUnits).toBe(0);
    expect(totals.toFreeShipping).toBeNull();
  });

  it("keeps the regional surcharge even when the flat rate is waived", () => {
    // The surcharge covers a real extra cost; dropping it would be a discount
    // the shop never offered.
    const totals = cartTotals(withTumbler(3), "delivery", "九州・沖縄");
    expect(totals.shipping.minorUnits).toBe(300);
    expect(
      cartTotals(withTumbler(1), "delivery", "九州・沖縄").shipping.minorUnits,
    ).toBe(900);
  });

  it("charges nothing to collect", () => {
    const totals = cartTotals(withTumbler(1), "pickup");
    expect(totals.shipping.minorUnits).toBe(0);
    expect(totals.total.minorUnits).toBe(3800);
    expect(totals.toFreeShipping).toBeNull();
  });

  it("charges no shipping on an empty cart", () => {
    expect(cartTotals(emptyCart(), "delivery").shipping.minorUnits).toBe(0);
  });
});

describe("repriceCart — 黙って直さず、知らせる", () => {
  it("reports a price change and does not hide it", () => {
    const cart = withTumbler(1);
    const stale = {
      ...cart,
      lines: [
        {
          ...cart.lines[0],
          unitPrice: { minorUnits: 3000, scale: 0, currency: "JPY" },
        },
      ],
    };
    const { changes, cart: fixed } = repriceCart(stale, {});
    expect(changes).toHaveLength(1);
    expect(changes[0].detail).toContain("価格");
    expect(fixed.lines[0].unitPrice.minorUnits).toBe(3800);
  });

  it("drops a line whose stock has gone, and says so", () => {
    const cart = withTumbler(1);
    const empty = setStock({}, skuKey("tumbler", SAGE), 0);
    const { changes, cart: fixed } = repriceCart(cart, empty);
    expect(fixed.lines).toHaveLength(0);
    expect(changes[0].detail).toContain("在庫切れ");
  });

  it("drops a line the operator unpublished", () => {
    const { changes, cart } = repriceCart(withTumbler(1), {}, ["tumbler"]);
    expect(cart.lines).toHaveLength(0);
    expect(changes[0].detail).toContain("取り扱いが終了");
  });
});

describe("placeOrder — 価格を注文時点で固定する", () => {
  it("places an order and records what it cost then", () => {
    const cart = withTumbler(2);
    const result = placeOrder({
      cart,
      fulfilment: "delivery",
      region: "関東",
      nowIso: NOW,
      stockDeltas: {},
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.reference).toMatch(/^F-[0-9A-F]{6}$/);
    expect(result.order.lines[0].unitPrice.minorUnits).toBe(3800);
    expect(result.order.lines[0].lineTotal.minorUnits).toBe(7600);
    expect(result.order.total.minorUnits).toBe(7600 + 600);
    expect(result.order.status).toBe("placed");
    expect(result.order.payment).toBe("unpaid");
    expect(result.order.lines[0].variantLabels).toContain("セージ");
  });

  it("refuses when the shelf moved under the cart", () => {
    const cart = withTumbler(2);
    const nearlyGone = setStock({}, skuKey("tumbler", SAGE), 1);
    const result = placeOrder({
      cart,
      fulfilment: "delivery",
      region: "関東",
      nowIso: NOW,
      stockDeltas: nearlyGone,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.changes?.[0].detail).toContain("在庫");
  });

  it("refuses an empty cart", () => {
    const result = placeOrder({
      cart: emptyCart(),
      fulfilment: "pickup",
      region: "",
      nowIso: NOW,
      stockDeltas: {},
    });
    expect(result.ok).toBe(false);
  });

  it("keeps no delivery region on a collection order", () => {
    const result = placeOrder({
      cart: withTumbler(1),
      fulfilment: "pickup",
      region: "関東",
      nowIso: NOW,
      stockDeltas: {},
    });
    if (!result.ok) throw new Error(result.reason);
    expect(result.order.region).toBe("");
    expect(result.order.shipping.minorUnits).toBe(0);
  });
});

describe("order lifecycle — 未払いのまま発送しない", () => {
  const placed = () => {
    const result = placeOrder({
      cart: withTumbler(1),
      fulfilment: "delivery",
      region: "関東",
      nowIso: NOW,
      stockDeltas: {},
    });
    if (!result.ok) throw new Error(result.reason);
    return result.order;
  };

  it("blocks shipment until the money is in", () => {
    const order = placed();
    expect(shippingBlock(order)).toContain("発送できません");
    const preparing = advanceOrder(order, "preparing", LATER).order;
    const shipped = advanceOrder(preparing, "shipped", LATER);
    expect(shipped.ok).toBe(false);
    expect(shipped.reason).toContain("発送できません");

    const paid = applyPayment(preparing, "paid", LATER, "SIM-1");
    expect(shippingBlock(paid)).toBeNull();
    expect(advanceOrder(paid, "shipped", LATER).ok).toBe(true);
  });

  it("lets collection be handed over unpaid, and records it", () => {
    const result = placeOrder({
      cart: withTumbler(1),
      fulfilment: "pickup",
      region: "",
      nowIso: NOW,
      stockDeltas: {},
    });
    if (!result.ok) throw new Error(result.reason);
    const preparing = advanceOrder(result.order, "preparing", LATER).order;
    const shipped = advanceOrder(preparing, "shipped", LATER).order;
    const handed = advanceOrder(shipped, "delivered", LATER);
    expect(handed.ok).toBe(true);
    expect(handed.order.history.at(-1)?.detail).toContain("未払いのまま");
  });

  it("will not take a parcel back once it is with a carrier", () => {
    const paid = applyPayment(placed(), "paid", LATER, "SIM-1");
    const preparing = advanceOrder(paid, "preparing", LATER).order;
    const shipped = advanceOrder(preparing, "shipped", LATER).order;
    expect(advanceOrder(shipped, "cancelled", LATER).ok).toBe(false);
    expect(advanceOrder(preparing, "cancelled", LATER).ok).toBe(true);
  });

  it("gives the stock back when an order is cancelled", () => {
    const order = placed();
    const taken = applyStock({}, stockChangesFor(withTumbler(1), -1));
    expect(stockFor("tumbler", SAGE, taken)).toBe(11);
    const returned = applyStock(taken, restockChanges(order));
    expect(stockFor("tumbler", SAGE, returned)).toBe(12);
  });

  it("separates money taken from money owed", () => {
    const a = applyPayment(placed(), "paid", LATER, "SIM-1");
    const b = placed();
    const c = advanceOrder(placed(), "cancelled", LATER).order;
    const totals = orderTotals([a, b, c]);
    expect(totals.count).toBe(2);
    expect(totals.cancelled).toBe(1);
    expect(totals.paid.minorUnits).toBe(a.total.minorUnits);
    expect(totals.unpaid.minorUnits).toBe(b.total.minorUnits);
    expect(totals.awaitingShipment).toBe(2);
  });
});

describe("sandbox storage — 更新で保存を消さない", () => {
  it("carries the visitor's work across a schema bump", () => {
    const cart = withTumbler(1);
    const result = migrateForme(
      {
        schemaVersion: FORME_SCHEMA_VERSION - 1,
        sandboxId: "abc",
        cart,
        orders: [],
        favourites: ["mug"],
        stockDeltas: { "mug|mug-sand": -1 },
        unpublished: [],
      },
      LATER,
    );
    expect(result.state.cart.lines).toHaveLength(1);
    expect(result.state.favourites).toEqual(["mug"]);
    expect(result.state.sandboxId).toBe("abc");
    expect(result.note).toContain("引き継いで");
  });

  it("does not rewrite what a newer build wrote", () => {
    const result = migrateForme(
      { schemaVersion: FORME_SCHEMA_VERSION + 1, favourites: ["mug"] },
      NOW,
    );
    expect(result.state.favourites).toEqual([]);
    expect(result.note).toContain("新しい版");
  });

  it("replaces unreadable data rather than throwing on every render", () => {
    for (const junk of ["nonsense", null, 7, [], { stockDeltas: "no" }]) {
      const result = migrateForme(junk, NOW);
      expect(result.state.cart.lines).toEqual([]);
      expect(result.state.stockDeltas).toEqual({});
      expect(result.state.schemaVersion).toBe(FORME_SCHEMA_VERSION);
    }
  });

  it("says nothing about an empty sandbox it migrated", () => {
    expect(migrateForme({ schemaVersion: 0 }, NOW).note).toBeUndefined();
  });
});
