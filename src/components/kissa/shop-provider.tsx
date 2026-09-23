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
  removeLine as removeLineRule,
  setQuantity as setQuantityRule,
} from "@/lib/shop/cart";
import { advanceOrder, applyPayment } from "@/lib/shop/order";
import {
  attemptPayment,
  isReplay,
  paymentKeyFor,
  type PaymentAttempt,
  type PaymentOutcome,
} from "@/lib/shop/payment";
import {
  cancelReservation as cancelRule,
  confirmReservation as confirmRule,
  holdTable as holdRule,
  proposeChange as changeRule,
  releaseExpired,
} from "@/lib/shop/reservation";
import {
  emptyState,
  loadState,
  newSandboxId,
  resetState,
  saveState,
} from "@/lib/shop/store";
import type {
  Order,
  OrderStatus,
  PaymentState,
  Reservation,
  SaleState,
  ShopState,
} from "@/lib/shop/types";

/**
 * The state every KISSA screen shares (指示書 §12, §18).
 *
 * One record, one visitor, one browser. The menu, the cart, the order status
 * page and the operator console all read and write through here, which is what
 * makes an operator marking something sold out visible on the menu and a
 * kitchen advancing an order visible on the customer's own status page.
 *
 * Expired holds are swept whenever state is read, so a table nobody confirmed
 * returns to the slots without anything having to remember to release it.
 */

type ShopContextValue = {
  state: ShopState;
  ready: boolean;
  /** Set when storage is unavailable or data was migrated. */
  notice: string;
  nowIso: string;
  addToCart: (input: {
    productId: string;
    variantIds: string[];
    quantity: number;
  }) => { ok: boolean; reason?: string };
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
  saveOrder: (order: Order) => void;
  advance: (
    orderId: string,
    to: OrderStatus,
  ) => { ok: boolean; reason?: string };
  pay: (
    orderId: string,
    outcome: PaymentOutcome,
  ) => { ok: boolean; reason?: string; detail?: string; replay?: boolean };
  holdTable: (input: {
    seatId: string;
    startIso: string;
    partySize: number;
    durationMinutes: number;
  }) => { ok: boolean; reason?: string; reservation?: Reservation };
  confirmReservation: (
    reservationId: string,
    name: string,
    note?: string,
  ) => { ok: boolean; reason?: string; reservation?: Reservation };
  changeReservation: (
    reservationId: string,
    next: { seatId: string; startIso: string; partySize: number },
  ) => { ok: boolean; reason?: string };
  cancelReservation: (reservationId: string) => {
    ok: boolean;
    reason?: string;
  };
  setSaleState: (productId: string, state: SaleState) => void;
  reset: () => void;
};

/** The attempt that would have produced each recorded payment state. */
const OUTCOME_OF_STATE: Partial<Record<PaymentState, PaymentOutcome>> = {
  paid: "approve",
  declined: "decline",
  pending: "pending",
  outcome_unknown: "timeout",
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function useShop(): ShopContextValue {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside <ShopProvider>");
  return value;
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  // Rendered server-side as an empty sandbox so the markup matches on hydrate;
  // the stored sandbox is read in an effect, after mount.
  const [state, setState] = useState<ShopState>(() =>
    emptyState(new Date().toISOString(), "server"),
  );
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const now = new Date().toISOString();
    const { state: stored, note } = loadState(now);
    const swept = releaseExpired(stored.reservations, now);
    setState({ ...stored, reservations: swept.reservations });
    setNotice(
      note ??
        (swept.released.length
          ? `期限切れのお取り置き ${swept.released.length} 件を解放しました。`
          : ""),
    );
    setNowIso(now);
    setReady(true);
  }, []);

  // A clock the slot lists can depend on without re-rendering every second.
  useEffect(() => {
    const id = setInterval(() => setNowIso(new Date().toISOString()), 30_000);
    return () => clearInterval(id);
  }, []);

  const commit = useCallback((next: ShopState) => {
    const stamped = { ...next, updatedAtIso: new Date().toISOString() };
    setState(stamped);
    if (!saveState(stamped))
      setNotice(
        "このブラウザでは保存できないため、タブを閉じると内容は消えます。",
      );
    return stamped;
  }, []);

  const value = useMemo<ShopContextValue>(() => {
    const now = () => new Date().toISOString();

    // The order carries the result of its last attempt, not the attempt
    // record itself. Rebuilding one lets the simulator recognise a replay —
    // the outcome is derived from the stored state rather than assumed, so an
    // unknown result is not replayed as an approval.
    const priorAttempt = (order: Order): PaymentAttempt[] | undefined => {
      if (!order.paymentRef) return undefined;
      const outcome = OUTCOME_OF_STATE[order.payment];
      if (!outcome) return undefined;
      return [
        {
          attemptId: order.paymentRef,
          // Derived, not the stored reference: the simulator matches on this
          // key, and a key that cannot match makes the guard silently useless.
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

    const updateOrder = (orderId: string, map: (order: Order) => Order) => {
      const order = state.orders.find((o) => o.orderId === orderId);
      if (!order) return { ok: false, reason: "注文が見つかりません。" };
      commit({
        ...state,
        orders: state.orders.map((o) => (o.orderId === orderId ? map(o) : o)),
      });
      return { ok: true };
    };

    return {
      state,
      ready,
      notice,
      nowIso,

      addToCart: (input) => {
        const result = addToCartRule(state.cart, {
          ...input,
          atIso: now(),
          saleOverrides: state.saleOverrides,
        });
        if (!result.ok) return { ok: false, reason: result.reason };
        commit({ ...state, cart: result.cart });
        return { ok: true };
      },

      setQuantity: (lineId, quantity) =>
        commit({
          ...state,
          cart: setQuantityRule(state.cart, lineId, quantity, now()),
        }),

      removeLine: (lineId) =>
        commit({
          ...state,
          cart: removeLineRule(state.cart, lineId, now()),
        }),

      clearCart: () =>
        commit({ ...state, cart: { lines: [], updatedAt: now() } }),

      saveOrder: (order) => {
        // Placing the same cart twice yields the same id, so a double click
        // replaces rather than duplicates (指示書 §12).
        const existing = state.orders.some((o) => o.orderId === order.orderId);
        commit({
          ...state,
          orders: existing
            ? state.orders.map((o) => (o.orderId === order.orderId ? order : o))
            : [order, ...state.orders],
          cart: { lines: [], updatedAt: now() },
        });
      },

      advance: (orderId, to) => {
        const order = state.orders.find((o) => o.orderId === orderId);
        if (!order) return { ok: false, reason: "注文が見つかりません。" };
        const result = advanceOrder(order, to, now());
        if (!result.ok) return { ok: false, reason: result.reason };
        return updateOrder(orderId, () => result.order);
      },

      pay: (orderId, outcome) => {
        const order = state.orders.find((o) => o.orderId === orderId);
        if (!order) return { ok: false, reason: "注文が見つかりません。" };
        const attempt = attemptPayment({
          orderId,
          amount: order.total,
          outcome,
          atIso: now(),
          // Prior attempts live in the order's own history of payment states.
          previous: priorAttempt(order),
        });
        // A replay changed nothing, so the order is left exactly as it was —
        // writing the same state again would fill the history with events that
        // never happened.
        if (!isReplay(attempt))
          updateOrder(orderId, (o) =>
            applyPayment(o, attempt.state, now(), attempt.reference),
          );
        return { ok: true, detail: attempt.detail, replay: isReplay(attempt) };
      },

      holdTable: (input) => {
        const result = holdRule({
          ...input,
          reservations: state.reservations,
          nowIso: now(),
        });
        if (!result.ok) return { ok: false, reason: result.reason };
        commit({
          ...state,
          reservations: [result.reservation, ...state.reservations],
        });
        return { ok: true, reservation: result.reservation };
      },

      confirmReservation: (reservationId, name, note) => {
        const reservation = state.reservations.find(
          (r) => r.reservationId === reservationId,
        );
        if (!reservation)
          return { ok: false, reason: "予約が見つかりません。" };
        const result = confirmRule(reservation, { name, note, nowIso: now() });
        if (!result.ok) return { ok: false, reason: result.reason };
        commit({
          ...state,
          reservations: state.reservations.map((r) =>
            r.reservationId === reservationId ? result.reservation : r,
          ),
        });
        // Returned as well as stored: the caller's `state` is the render it
        // was built from, so reading the confirmation back out of it would
        // find the unconfirmed copy.
        return { ok: true, reservation: result.reservation };
      },

      changeReservation: (reservationId, next) => {
        const reservation = state.reservations.find(
          (r) => r.reservationId === reservationId,
        );
        if (!reservation)
          return { ok: false, reason: "予約が見つかりません。" };
        const result = changeRule(reservation, next, state.reservations, now());
        if (!result.ok) return { ok: false, reason: result.reason };
        commit({
          ...state,
          reservations: state.reservations.map((r) =>
            r.reservationId === reservationId ? result.reservation : r,
          ),
        });
        return { ok: true };
      },

      cancelReservation: (reservationId) => {
        const reservation = state.reservations.find(
          (r) => r.reservationId === reservationId,
        );
        if (!reservation)
          return { ok: false, reason: "予約が見つかりません。" };
        const result = cancelRule(reservation, now());
        if (!result.ok) return { ok: false, reason: result.reason };
        commit({
          ...state,
          reservations: state.reservations.map((r) =>
            r.reservationId === reservationId ? result.reservation : r,
          ),
        });
        return { ok: true };
      },

      setSaleState: (productId, saleState) =>
        commit({
          ...state,
          saleOverrides: { ...state.saleOverrides, [productId]: saleState },
        }),

      reset: () => {
        const fresh = resetState(new Date().toISOString());
        setState(fresh);
        setNotice("この端末の体験データを初期化しました。");
      },
    };
  }, [state, ready, notice, nowIso, commit]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export { newSandboxId };
