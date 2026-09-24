"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addToCart as addToCartRule,
  cartTotals,
  removeLine as removeLineRule,
  repriceCart,
  setQuantity as setQuantityRule,
  stockChangesFor,
} from "@/lib/forme/cart";
import {
  advanceOrder,
  applyPayment,
  placeOrder as placeOrderRule,
  restockChanges,
} from "@/lib/forme/order";
import { applyStock, setStock as setStockRule } from "@/lib/forme/stock";
import {
  emptyFormeState,
  exportFormeState,
  importFormeState,
  loadFormeState,
  newSandboxId,
  resetFormeState,
  saveFormeState,
} from "@/lib/forme/store";
import {
  attemptPayment,
  isReplay,
  paymentKeyFor,
  type PaymentAttempt,
  type PaymentOutcome,
} from "@/lib/shop/payment";
import type { PaymentState } from "@/lib/shop/types";
import type {
  FormeOrder,
  FormeOrderStatus,
  FormeState,
  Fulfilment,
} from "@/lib/forme/types";

/**
 * The state every FORME screen shares (指示書 §16, §18).
 *
 * Same shape as KISSA's provider, and deliberately so — one pattern for both
 * shops means one place to be wrong. Two things are FORME's own: the shelf
 * moves when an order is placed and moves back when it is cancelled, and the
 * operator's stock edits live in the same record the customer reads.
 *
 * Mutations read a ref rather than the render's copy of state, because placing
 * an order takes stock and writes the order in one handler and the second half
 * must see the first.
 */

type FormeContextValue = {
  state: FormeState;
  ready: boolean;
  notice: string;
  nowIso: string;
  addToCart: (input: {
    productId: string;
    variantIds: string[];
    quantity: number;
  }) => { ok: boolean; reason?: string };
  setQuantity: (lineId: string, quantity: number) => { reason?: string };
  removeLine: (lineId: string) => void;
  toggleFavourite: (productId: string) => void;
  isFavourite: (productId: string) => boolean;
  placeOrder: (input: {
    fulfilment: Fulfilment;
    region: string;
    note?: string;
  }) => { ok: boolean; reason?: string; order?: FormeOrder };
  advance: (
    orderId: string,
    to: FormeOrderStatus,
  ) => { ok: boolean; reason?: string };
  pay: (
    orderId: string,
    outcome: PaymentOutcome,
  ) => { ok: boolean; reason?: string; detail?: string; replay?: boolean };
  setStock: (key: string, count: number) => void;
  togglePublished: (productId: string) => void;
  reset: () => void;
  /** The visitor's own copy of this sandbox, to keep or carry. */
  exportData: () => string;
  /** Returns a message when the file was refused, null when taken. */
  importData: (text: string) => string | null;
};

const OUTCOME_OF_STATE: Partial<Record<PaymentState, PaymentOutcome>> = {
  paid: "approve",
  declined: "decline",
  pending: "pending",
  outcome_unknown: "timeout",
};

const FormeContext = createContext<FormeContextValue | null>(null);

export function useForme(): FormeContextValue {
  const value = useContext(FormeContext);
  if (!value) throw new Error("useForme must be used inside <FormeProvider>");
  return value;
}

export function FormeProvider({
  children,
  referenceIso,
}: {
  children: React.ReactNode;
  referenceIso: string;
}) {
  const [state, setState] = useState<FormeState>(() =>
    emptyFormeState(referenceIso, "server"),
  );
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [nowIso, setNowIso] = useState(referenceIso);
  const loaded = useRef(false);
  const live = useRef(state);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const now = new Date().toISOString();
    const { state: stored, note } = loadFormeState(now);
    live.current = stored;
    setState(stored);
    setNotice(note ?? "");
    setNowIso(now);
    setReady(true);
  }, []);

  const commit = useCallback((next: FormeState) => {
    const stamped = { ...next, updatedAtIso: new Date().toISOString() };
    live.current = stamped;
    setState(stamped);
    if (!saveFormeState(stamped))
      setNotice(
        "このブラウザでは保存できないため、タブを閉じると内容は消えます。",
      );
  }, []);

  const value = useMemo<FormeContextValue>(() => {
    const now = () => new Date().toISOString();

    const priorAttempt = (order: FormeOrder): PaymentAttempt[] | undefined => {
      if (!order.paymentRef) return undefined;
      const outcome = OUTCOME_OF_STATE[order.payment];
      if (!outcome) return undefined;
      return [
        {
          attemptId: order.paymentRef,
          idempotencyKey: paymentKeyFor(order.orderId, order.total),
          orderId: order.orderId,
          amount: order.total,
          outcome,
          state: order.payment,
          reference: order.paymentRef,
          detail: "",
          atIso: order.updatedAtIso,
          external: false,
        },
      ];
    };

    const putOrder = (orderId: string, map: (o: FormeOrder) => FormeOrder) => {
      const current = live.current;
      const order = current.orders.find((o) => o.orderId === orderId);
      if (!order) return { ok: false, reason: "注文が見つかりません。" };
      commit({
        ...current,
        orders: current.orders.map((o) => (o.orderId === orderId ? map(o) : o)),
      });
      return { ok: true };
    };

    return {
      state,
      ready,
      notice,
      nowIso,

      addToCart: (input) => {
        const current = live.current;
        const result = addToCartRule(current.cart, {
          ...input,
          atIso: now(),
          stockDeltas: current.stockDeltas,
          unpublished: current.unpublished,
        });
        if (!result.ok) return { ok: false, reason: result.reason };
        commit({ ...current, cart: result.cart });
        return { ok: true };
      },

      setQuantity: (lineId, quantity) => {
        const current = live.current;
        const result = setQuantityRule(
          current.cart,
          lineId,
          quantity,
          now(),
          current.stockDeltas,
        );
        commit({ ...current, cart: result.cart });
        return { reason: result.reason };
      },

      removeLine: (lineId) => {
        const current = live.current;
        commit({
          ...current,
          cart: removeLineRule(current.cart, lineId, now()),
        });
      },

      toggleFavourite: (productId) => {
        const current = live.current;
        const has = current.favourites.includes(productId);
        commit({
          ...current,
          favourites: has
            ? current.favourites.filter((id) => id !== productId)
            : [...current.favourites, productId],
        });
      },

      isFavourite: (productId) => state.favourites.includes(productId),

      placeOrder: ({ fulfilment, region, note }) => {
        const current = live.current;
        const { cart } = repriceCart(
          current.cart,
          current.stockDeltas,
          current.unpublished,
        );
        const result = placeOrderRule({
          cart,
          fulfilment,
          region,
          nowIso: now(),
          note,
          stockDeltas: current.stockDeltas,
          unpublished: current.unpublished,
        });
        if (!result.ok) return { ok: false, reason: result.reason };

        // The shelf moves with the order, in the same commit: two writes here
        // would leave a window where the stock was taken and the order was not
        // recorded, or the other way round.
        const exists = current.orders.some(
          (o) => o.orderId === result.order.orderId,
        );
        commit({
          ...current,
          orders: exists
            ? current.orders.map((o) =>
                o.orderId === result.order.orderId ? result.order : o,
              )
            : [result.order, ...current.orders],
          cart: { lines: [], updatedAt: now() },
          stockDeltas: exists
            ? current.stockDeltas
            : applyStock(current.stockDeltas, stockChangesFor(cart, -1)),
        });
        return { ok: true, order: result.order };
      },

      advance: (orderId, to) => {
        const current = live.current;
        const order = current.orders.find((o) => o.orderId === orderId);
        if (!order) return { ok: false, reason: "注文が見つかりません。" };
        const result = advanceOrder(order, to, now());
        if (!result.ok) return { ok: false, reason: result.reason };

        commit({
          ...current,
          orders: current.orders.map((o) =>
            o.orderId === orderId ? result.order : o,
          ),
          // Cancelling puts the stock back on the shelf, which is the whole
          // reason stock is a count rather than a flag.
          stockDeltas:
            to === "cancelled"
              ? applyStock(current.stockDeltas, restockChanges(order))
              : current.stockDeltas,
        });
        return { ok: true };
      },

      pay: (orderId, outcome) => {
        const current = live.current;
        const order = current.orders.find((o) => o.orderId === orderId);
        if (!order) return { ok: false, reason: "注文が見つかりません。" };
        const attempt = attemptPayment({
          orderId,
          amount: order.total,
          outcome,
          atIso: now(),
          previous: priorAttempt(order),
        });
        if (!isReplay(attempt))
          putOrder(orderId, (o) =>
            applyPayment(o, attempt.state, now(), attempt.reference),
          );
        return { ok: true, detail: attempt.detail, replay: isReplay(attempt) };
      },

      setStock: (key, count) => {
        const current = live.current;
        commit({
          ...current,
          stockDeltas: setStockRule(current.stockDeltas, key, count),
        });
      },

      togglePublished: (productId) => {
        const current = live.current;
        const hidden = current.unpublished.includes(productId);
        commit({
          ...current,
          unpublished: hidden
            ? current.unpublished.filter((id) => id !== productId)
            : [...current.unpublished, productId],
        });
      },

      reset: () => {
        const fresh = resetFormeState(new Date().toISOString());
        live.current = fresh;
        setState(fresh);
        setNotice("この端末の体験データを初期化しました。");
      },

      exportData: () => exportFormeState(live.current),
      importData: (text: string) => {
        const result = importFormeState(text, new Date().toISOString());
        if (!result.ok) return result.reason;
        commit(result.state);
        setNotice(result.note ?? "");
        return null;
      },
    };
  }, [state, ready, notice, nowIso, commit]);

  return (
    <FormeContext.Provider value={value}>{children}</FormeContext.Provider>
  );
}

/** Totals for the current cart, with the chosen fulfilment applied. */
export function useCartTotals(
  fulfilment: Fulfilment = "delivery",
  region = "関東",
) {
  const { state } = useForme();
  return cartTotals(state.cart, fulfilment, region);
}

export { newSandboxId };
