import { emptyCart } from "./cart";
import { SHOP_SCHEMA_VERSION, type ShopState } from "./types";

// Re-exported so callers that work with stored state get the version from the
// same module, rather than reaching past it into the type definitions.
export { SHOP_SCHEMA_VERSION };

/**
 * Per-visitor sandbox storage (指示書 §18).
 *
 * The demo keeps its state in this browser only. That is a deliberate limit,
 * not a shortcut: a public demo where strangers' carts and bookings meet would
 * be a worse demonstration and a worse idea. The screens say so plainly rather
 * than implying a shared system.
 *
 * `schemaVersion` is the contract. A sandbox written by an older build is
 * migrated; it is never dropped because the shape moved. Someone halfway
 * through a booking should not lose it to a deploy.
 */

export const STORAGE_KEY = "tsudowa-kissa-sandbox-v1";

export const emptyState = (nowIso: string, sandboxId: string): ShopState => ({
  schemaVersion: SHOP_SCHEMA_VERSION,
  sandboxId,
  cart: emptyCart(),
  orders: [],
  reservations: [],
  saleOverrides: {},
  createdAtIso: nowIso,
  updatedAtIso: nowIso,
});

/** Random enough to separate tabs; not an identity and never sent anywhere. */
export function newSandboxId(): string {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export type MigrationResult = {
  state: ShopState;
  /** Set when the stored data could not be used as-is. */
  note?: string;
};

/**
 * Brings a stored sandbox up to the current shape.
 *
 * Unknown future versions are kept rather than rewritten: a newer tab's data
 * is not this build's to downgrade. Unreadable data is replaced, and says so,
 * instead of throwing on every render.
 */
export function migrate(raw: unknown, nowIso: string): MigrationResult {
  if (!raw || typeof raw !== "object")
    return { state: emptyState(nowIso, newSandboxId()) };

  const value = raw as Partial<ShopState>;
  const version =
    typeof value.schemaVersion === "number" ? value.schemaVersion : 0;

  if (version > SHOP_SCHEMA_VERSION)
    return {
      state: emptyState(nowIso, newSandboxId()),
      note: "新しい版で保存されたデータのため、この画面では読み込みませんでした。元のデータは変更していません。",
    };

  const base = emptyState(nowIso, value.sandboxId || newSandboxId());
  const state: ShopState = {
    ...base,
    cart:
      value.cart && Array.isArray(value.cart.lines)
        ? { lines: value.cart.lines, updatedAt: value.cart.updatedAt ?? nowIso }
        : base.cart,
    orders: Array.isArray(value.orders) ? value.orders : [],
    reservations: Array.isArray(value.reservations) ? value.reservations : [],
    saleOverrides:
      value.saleOverrides && typeof value.saleOverrides === "object"
        ? value.saleOverrides
        : {},
    createdAtIso: value.createdAtIso ?? nowIso,
    updatedAtIso: nowIso,
    schemaVersion: SHOP_SCHEMA_VERSION,
  };

  // Data with no version at all is the oldest kind there is, so it is exactly
  // the case worth telling someone about — an earlier guard of `version > 0`
  // silenced the message precisely when a migration had happened.
  const upgraded = version < SHOP_SCHEMA_VERSION && hasContent(value);
  return {
    state,
    note: upgraded
      ? `保存されていたデータを${version ? `版 ${version}` : "旧形式"}から版 ${SHOP_SCHEMA_VERSION} へ更新しました。内容はそのまま引き継いでいます。`
      : undefined,
  };
}

/** True when the stored record actually held something worth migrating. */
function hasContent(value: Partial<ShopState>): boolean {
  return (
    (Array.isArray(value.orders) && value.orders.length > 0) ||
    (Array.isArray(value.reservations) && value.reservations.length > 0) ||
    (Array.isArray(value.cart?.lines) && value.cart.lines.length > 0)
  );
}

/** Reads the sandbox, tolerating storage being unavailable or blocked. */
export function loadState(nowIso: string): MigrationResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: emptyState(nowIso, newSandboxId()) };
    return migrate(JSON.parse(raw), nowIso);
  } catch {
    return {
      state: emptyState(nowIso, newSandboxId()),
      note: "このブラウザでは保存が使えないため、このタブの間だけの体験になります。",
    };
  }
}

export function saveState(state: ShopState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    // Quota or blocked storage. The screens keep working from memory.
    return false;
  }
}

/** Clears this visitor's sandbox only. Nobody else's demo is affected. */
export function resetState(nowIso: string): ShopState {
  const fresh = emptyState(nowIso, newSandboxId());
  saveState(fresh);
  return fresh;
}

/** Lets someone carry their sandbox between browsers, or keep a copy. */
export const exportState = (state: ShopState) => JSON.stringify(state, null, 2);

export function importState(
  text: string,
  nowIso: string,
):
  | { ok: true; state: ShopState; note?: string }
  | { ok: false; reason: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "読み込めない形式です。" };
  }
  const result = migrate(parsed, nowIso);
  if (!Array.isArray((parsed as Partial<ShopState>)?.orders))
    return { ok: false, reason: "この体験の保存データではないようです。" };
  return { ok: true, state: result.state, note: result.note };
}

export const STORAGE_DISCLOSURE =
  "この体験の注文・予約は、お使いのブラウザの中だけに保存されます。サーバーには送信されず、他の訪問者とは共有されません。";
