import { emptyCart } from "./cart";
import { FORME_SCHEMA_VERSION, type FormeState } from "./types";

export { FORME_SCHEMA_VERSION };

/**
 * FORME's per-visitor sandbox (指示書 §18).
 *
 * Its own key, separate from KISSA's and from the operations record. Three
 * demos sharing one blob would mean resetting one resets the others, and a
 * schema change in one migrates all three.
 *
 * Stock is stored as deltas, so the published catalogue stays the source of
 * how many there are and a visitor's browser cannot pin it to an old number.
 */

export const FORME_STORAGE_KEY = "tsudowa-forme-sandbox-v1";

export const emptyFormeState = (
  nowIso: string,
  sandboxId: string,
): FormeState => ({
  schemaVersion: FORME_SCHEMA_VERSION,
  sandboxId,
  cart: emptyCart(),
  orders: [],
  favourites: [],
  stockDeltas: {},
  unpublished: [],
  createdAtIso: nowIso,
  updatedAtIso: nowIso,
});

export function newSandboxId(): string {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export type FormeMigration = { state: FormeState; note?: string };

const isRecordOfNumbers = (value: unknown): value is Record<string, number> =>
  !!value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.values(value).every((v) => typeof v === "number");

export function migrateForme(raw: unknown, nowIso: string): FormeMigration {
  if (!raw || typeof raw !== "object")
    return { state: emptyFormeState(nowIso, newSandboxId()) };

  const value = raw as Partial<FormeState>;
  const version =
    typeof value.schemaVersion === "number" ? value.schemaVersion : 0;

  if (version > FORME_SCHEMA_VERSION)
    return {
      state: emptyFormeState(nowIso, newSandboxId()),
      note: "新しい版で保存されたデータのため、この画面では読み込みませんでした。元のデータは変更していません。",
    };

  const base = emptyFormeState(nowIso, value.sandboxId || newSandboxId());
  const state: FormeState = {
    ...base,
    cart:
      value.cart && Array.isArray(value.cart.lines)
        ? { lines: value.cart.lines, updatedAt: value.cart.updatedAt ?? nowIso }
        : base.cart,
    orders: Array.isArray(value.orders) ? value.orders : [],
    favourites: Array.isArray(value.favourites) ? value.favourites : [],
    stockDeltas: isRecordOfNumbers(value.stockDeltas) ? value.stockDeltas : {},
    unpublished: Array.isArray(value.unpublished) ? value.unpublished : [],
    createdAtIso: value.createdAtIso ?? nowIso,
    updatedAtIso: nowIso,
    schemaVersion: FORME_SCHEMA_VERSION,
  };

  const carried =
    state.orders.length > 0 ||
    state.cart.lines.length > 0 ||
    state.favourites.length > 0 ||
    Object.keys(state.stockDeltas).length > 0;

  return {
    state,
    note:
      version < FORME_SCHEMA_VERSION && carried
        ? `保存されていたデータを${version ? `版 ${version}` : "旧形式"}から版 ${FORME_SCHEMA_VERSION} へ更新しました。内容はそのまま引き継いでいます。`
        : undefined,
  };
}

export function loadFormeState(nowIso: string): FormeMigration {
  try {
    const raw = localStorage.getItem(FORME_STORAGE_KEY);
    if (!raw) return { state: emptyFormeState(nowIso, newSandboxId()) };
    return migrateForme(JSON.parse(raw), nowIso);
  } catch {
    return {
      state: emptyFormeState(nowIso, newSandboxId()),
      note: "このブラウザでは保存が使えないため、このタブの間だけの体験になります。",
    };
  }
}

export function saveFormeState(state: FormeState): boolean {
  try {
    localStorage.setItem(FORME_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resetFormeState(nowIso: string): FormeState {
  const fresh = emptyFormeState(nowIso, newSandboxId());
  saveFormeState(fresh);
  return fresh;
}

export const FORME_STORAGE_DISCLOSURE =
  "この体験のカート・注文・在庫の変更は、お使いのブラウザの中だけに保存されます。サーバーには送信されず、他の訪問者とは共有されません。";
