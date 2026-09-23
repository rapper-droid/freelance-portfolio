import type { Money } from "@/lib/runtime/rules/money";

/**
 * The entities the commerce and reservation experiences share (指示書 §18).
 *
 * One definition, used by the customer screens and the operator screens
 * alike. The failure this replaces is a fixed JSON per screen, where pressing
 * "order" changed a badge and nothing else in the product ever knew.
 *
 * Money is always `Money` (integer minor units) — never a number that might be
 * yen in one place and a float in another.
 */

export type ProductCategory =
  "coffee" | "tea" | "food" | "dessert" | "seasonal";

/** Why a product cannot be bought right now, if it cannot. */
export type SaleState = "on_sale" | "sold_out" | "closed_for_now" | "ended";

export type VariantAxis = "temperature" | "size" | "addon";

export type Variant = {
  id: string;
  axis: VariantAxis;
  label: string;
  /** Added to the base price. Zero for the default choice. */
  extra: Money;
  saleState: SaleState;
};

export type Product = {
  id: string;
  category: ProductCategory;
  name: string;
  /** One sentence that says what it tastes like, not marketing copy. */
  summary: string;
  description: string;
  price: Money;
  /** Axes this product actually offers. A latte has temperature; a cake does not. */
  variants: Variant[];
  saleState: SaleState;
  /** Minutes to prepare; drives the pickup slot calculation. */
  prepMinutes: number;
  /** Served only within these hours, when narrower than opening hours. */
  servedFrom?: number;
  servedTo?: number;
  order: number;
  /** Keyed to the artwork registry; every product has its own. */
  artId: string;
  allergens: string[];
  /** Stated only where the recipe fixture actually records it. */
  caffeine?: "none" | "low" | "regular";
};

export type CartLine = {
  lineId: string;
  productId: string;
  /** Chosen variant ids, one per axis at most. */
  variantIds: string[];
  quantity: number;
  /**
   * Price captured when the line was added. An order keeps what the customer
   * was shown, even if the menu changes before they check out (指示書 §16).
   */
  unitPrice: Money;
};

export type Cart = {
  lines: CartLine[];
  updatedAt: string;
};

export const ORDER_STATUSES = [
  "placed",
  "preparing",
  "ready",
  "handed_over",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATES = [
  "unpaid",
  "authorised",
  "paid",
  "declined",
  "pending",
  "refunded",
  "outcome_unknown",
] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

export type OrderLine = {
  lineId: string;
  productId: string;
  productName: string;
  variantLabels: string[];
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
};

export type Order = {
  orderId: string;
  /** Short, human-readable, shown to the customer at the counter. */
  reference: string;
  lines: OrderLine[];
  subtotal: Money;
  total: Money;
  method: "pickup";
  pickupAtIso: string;
  status: OrderStatus;
  payment: PaymentState;
  /** Set only when a simulated payment returned an id. */
  paymentRef?: string;
  placedAtIso: string;
  updatedAtIso: string;
  note: string;
  history: Array<{ at: string; event: string; detail: string }>;
};

/** A table or counter seat group the cafe can actually seat people at. */
export type Seat = {
  id: string;
  label: string;
  capacity: number;
  /** Seats that cannot be occupied at the same time as this one. */
  conflictsWith?: string[];
};

export const RESERVATION_STATUSES = [
  "requested",
  "held",
  "confirmed",
  "change_pending",
  "cancelled",
  "expired",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type Reservation = {
  reservationId: string;
  reference: string;
  seatId: string;
  partySize: number;
  startIso: string;
  /** Minutes the table is held, including turnaround. */
  durationMinutes: number;
  status: ReservationStatus;
  name: string;
  note: string;
  createdAtIso: string;
  updatedAtIso: string;
  /** Holds release at this time; absent once confirmed. */
  holdExpiresAtIso?: string;
  history: Array<{ at: string; event: string; detail: string }>;
};

/**
 * Everything one visitor's sandbox holds.
 *
 * `schemaVersion` is the contract for migration: a stored sandbox from an
 * older build is upgraded, never silently discarded, because a cart or a
 * reservation someone is midway through is theirs (指示書 §18).
 */
export type ShopState = {
  schemaVersion: number;
  sandboxId: string;
  cart: Cart;
  orders: Order[];
  reservations: Reservation[];
  /** Operator-side overrides to the catalogue, so changes are visible. */
  saleOverrides: Record<string, SaleState>;
  createdAtIso: string;
  updatedAtIso: string;
};

export const SHOP_SCHEMA_VERSION = 1;
