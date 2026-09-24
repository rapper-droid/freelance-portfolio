/**
 * The storage mechanics every per-visitor sandbox shares (指示書 §18).
 *
 * KISSA, FORME and the operations record each keep their own state under their
 * own key, and each knows how to migrate its own shape. What they had in
 * common was the part around it: reading a key that might not be readable,
 * writing one that might be full, and — the part that was missing — what to do
 * when what comes back cannot be used.
 *
 * Before this, unreadable data was replaced and the original was gone at the
 * next save. Worse, data written by a *newer* build produced an on-screen
 * promise that "元のデータは変更していません" and then the first edit
 * overwrote it anyway. Somebody with a booking in a newer tab lost it and was
 * told they hadn't.
 *
 * So anything that cannot be used is copied aside first, under
 * `<key>--backup`, with the reason and the time. The demo carries on with a
 * fresh sandbox, the screen says a copy was kept, and the copy can be fed back
 * through import. Nothing is deleted to make the shape fit.
 */

export type SandboxFault =
  /** Storage itself is off: private window, blocked site data, SSR. */
  | "unavailable"
  /** Present but not JSON, or not an object. */
  | "unreadable";

export type RawRead =
  | { ok: true; value: unknown }
  /** Nothing stored yet. Not a fault — this is the first visit. */
  | { ok: true; value: null }
  | { ok: false; fault: SandboxFault; text: string | null };

export const backupKeyFor = (key: string) => `${key}--backup`;

/** What a quarantined copy looks like on disk. */
export type SandboxBackup = {
  savedAtIso: string;
  reason: string;
  /** The original payload, exactly as it was found. */
  text: string;
};

function storage(): Storage | null {
  try {
    // Reading the property itself throws in some blocked-cookie settings.
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readRaw(key: string): RawRead {
  const store = storage();
  if (!store) return { ok: false, fault: "unavailable", text: null };

  let text: string | null;
  try {
    text = store.getItem(key);
  } catch {
    return { ok: false, fault: "unavailable", text: null };
  }
  if (text === null) return { ok: true, value: null };

  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object")
      return { ok: false, fault: "unreadable", text };
    return { ok: true, value };
  } catch {
    return { ok: false, fault: "unreadable", text };
  }
}

export function writeRaw(key: string, value: unknown): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota, or storage blocked between the read and now. The screens keep
    // working from memory and say so.
    return false;
  }
}

/**
 * Copies a payload we are about to stop using into the backup slot.
 *
 * One slot, not a growing pile: the point is that the last thing that went
 * wrong is recoverable, not that every generation is archived in somebody's
 * browser forever. Returns false when the copy could not be kept, so the
 * caller can avoid promising one.
 */
export function keepBackup(
  key: string,
  text: string,
  reason: string,
  nowIso: string,
): boolean {
  const store = storage();
  if (!store) return false;
  const backup: SandboxBackup = { savedAtIso: nowIso, reason, text };
  try {
    store.setItem(backupKeyFor(key), JSON.stringify(backup));
    return true;
  } catch {
    return false;
  }
}

export function readBackup(key: string): SandboxBackup | null {
  const read = readRaw(backupKeyFor(key));
  if (!read.ok || !read.value) return null;
  const value = read.value as Partial<SandboxBackup>;
  if (typeof value.text !== "string") return null;
  return {
    savedAtIso: typeof value.savedAtIso === "string" ? value.savedAtIso : "",
    reason: typeof value.reason === "string" ? value.reason : "",
    text: value.text,
  };
}

export function forgetBackup(key: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(backupKeyFor(key));
  } catch {
    // Nothing to do: the copy stays, which is the safe direction.
  }
}

/** The text someone downloads. Indented, because they may open and read it. */
export const exportText = (state: unknown) => JSON.stringify(state, null, 2);

export type ImportResult<T> =
  { ok: true; state: T; note?: string } | { ok: false; reason: string };

/**
 * Reads a file somebody exported earlier and hands it to the store's own
 * migration, so an old export is upgraded rather than refused.
 *
 * `looksLikeOurs` is what stops a FORME export being loaded into KISSA. Both
 * are JSON objects with a `schemaVersion`, so the shape has to be checked
 * against something specific to the experience.
 */
export function importSandbox<T>(
  text: string,
  nowIso: string,
  migrate: (raw: unknown, nowIso: string) => { state: T; note?: string },
  looksLikeOurs: (raw: unknown) => boolean,
): ImportResult<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "読み込めない形式です。" };
  }
  if (!parsed || typeof parsed !== "object")
    return { ok: false, reason: "読み込めない形式です。" };
  if (!looksLikeOurs(parsed))
    return { ok: false, reason: "この体験の保存データではないようです。" };

  const result = migrate(parsed, nowIso);
  return { ok: true, state: result.state, note: result.note };
}

/** The sentence every sandbox screen uses about a kept copy. */
export const backupNote = (kept: boolean) =>
  kept
    ? "読み込めなかったデータは、消さずにこのブラウザ内へ控えとして残しています。"
    : "読み込めなかったデータの控えは残せませんでした（保存領域がいっぱいか、使えません）。";
