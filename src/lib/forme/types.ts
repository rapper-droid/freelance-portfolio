import type { Money } from "@/lib/runtime/rules/money";
import type { PaymentState } from "@/lib/shop/types";

/**
 * FORME — the objects shop (指示書 §16).
 *
 * KISSA sells what it makes that morning; FORME sells things it has a finite
 * number of. That is the difference the model has to carry: stock per SKU,
 * a price captured when the order is placed, and a cancellation that puts the
 * stock back. Sale state alone cannot express "two left".
 *
 * The payment simulator is KISSA's, unchanged and imported — §16 asks for the
 * same safe adapter, and a second one would be a second thing to get wrong.
 */

export const FORME_SCHEMA_VERSION = 1;

/** The instant the server renders from, so the markup matches on hydrate. */
export const FORME_REFERENCE_ISO = "2026-09-23T01:00:00.000Z";

export type FormeAxis = "color" | "size";

export type FormeVariant = {
  id: string;
  axis: FormeAxis;
  label: string;
  /** Added to the product's base price. Zero for the default choice. */
  extra: Money;
  /** Swatch for a colour; unused on other axes. */
  swatch?: string;
};

export type FormeCategory = "drink" | "carry" | "table" | "care";

export type FormeImage = {
  /** A real file under /visuals, or null when the artwork is drawn inline. */
  src: string | null;
  alt: string;
  caption: string;
};

export type FormeProduct = {
  id: string;
  code: string;
  name: string;
  category: FormeCategory;
  summary: string;
  description: string;
  price: Money;
  variants: FormeVariant[];
  /** Keyed by colour variant id; every colour has its own picture. */
  images: Record<string, FormeImage[]>;
  spec: Array<[string, string]>;
  /** Grams. Used by the comparison table, and nowhere else. */
  weightGrams: number;
  order: number;
  /** Published or not. An unpublished product is not orderable or listed. */
  published: boolean;
};

/** A sellable combination: the product plus one choice on each axis. */
export type Sku = {
  productId: string;
  variantIds: string[];
};

export type FormeCartLine = {
  lineId: string;
  productId: string;
  variantIds: string[];
  quantity: number;
  /** Captured when added, so a price change is surfaced rather than applied. */
  unitPrice: Money;
};

export type FormeCart = {
  lines: FormeCartLine[];
  updatedAt: string;
};

export type Fulfilment = "delivery" | "pickup";

export type FormeOrderLine = {
  lineId: string;
  productId: string;
  productName: string;
  variantLabels: string[];
  quantity: number;
  /** The price at the moment of ordering. Later catalogue edits do not move it. */
  unitPrice: Money;
  lineTotal: Money;
};

/**
 * Where an order is.
 *
 * `preparing` and `shipped` are separate because only one of them is
 * reversible: stock comes back from a cancelled order, and an order already
 * handed to a carrier is not something this screen can take back.
 */
export type FormeOrderStatus =
  "placed" | "preparing" | "shipped" | "delivered" | "cancelled";

export type FormeOrder = {
  orderId: string;
  reference: string;
  lines: FormeOrderLine[];
  subtotal: Money;
  shipping: Money;
  total: Money;
  fulfilment: Fulfilment;
  /** Prefecture only. The demo asks for nothing that identifies anyone. */
  region: string;
  status: FormeOrderStatus;
  payment: PaymentState;
  paymentRef?: string;
  placedAtIso: string;
  updatedAtIso: string;
  note: string;
  history: Array<{ at: string; event: string; detail: string }>;
};

export type FormeState = {
  schemaVersion: number;
  sandboxId: string;
  cart: FormeCart;
  orders: FormeOrder[];
  /** Product ids this visitor kept. */
  favourites: string[];
  /**
   * Stock changes against the catalogue, keyed by SKU.
   *
   * Deltas rather than absolute counts: the catalogue is the published stock,
   * and a build that restocks a line should not be overridden by a number
   * written into someone's browser weeks ago.
   */
  stockDeltas: Record<string, number>;
  /** Operator unpublishing, keyed by product id. */
  unpublished: string[];
  createdAtIso: string;
  updatedAtIso: string;
};

export const FULFILMENT_LABELS: Record<Fulfilment, string> = {
  delivery: "配送",
  pickup: "店頭受け取り",
};

export const FORME_STATUS_LABELS: Record<FormeOrderStatus, string> = {
  placed: "受付",
  preparing: "準備中",
  shipped: "発送済み",
  delivered: "お渡し済み",
  cancelled: "取消",
};
