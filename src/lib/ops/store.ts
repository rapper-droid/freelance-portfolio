import { emptyOpsState } from "./cases";
import {
  backupNote,
  exportText,
  importSandbox,
  keepBackup,
  readRaw,
  writeRaw,
  type ImportResult,
} from "../runtime/sandbox";
import { OPS_SCHEMA_VERSION, type OpsState } from "./types";

export { OPS_SCHEMA_VERSION };

/**
 * Per-visitor storage for the operations demos (指示書 §18).
 *
 * The same contract KISSA's sandbox keeps, for the same reasons: this browser
 * only, versioned, migrated rather than discarded. Only the visitor's own work
 * is stored — the sample cases are regenerated on read, so a build that
 * changes the sample is not fighting stale copies in everyone's storage.
 */

export const OPS_STORAGE_KEY = "tsudowa-ops-sandbox-v1";

export function newSandboxId(): string {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

export type OpsMigration = { state: OpsState; note?: string };

export function migrateOps(raw: unknown, nowIso: string): OpsMigration {
  if (!raw || typeof raw !== "object")
    return { state: emptyOpsState(nowIso, newSandboxId()) };

  const value = raw as Partial<OpsState>;
  const version =
    typeof value.schemaVersion === "number" ? value.schemaVersion : 0;

  // Copied aside before a fresh sandbox starts writing over the key.
  if (version > OPS_SCHEMA_VERSION) {
    const kept = keepBackup(
      OPS_STORAGE_KEY,
      JSON.stringify(raw),
      `schemaVersion ${version} > ${OPS_SCHEMA_VERSION}`,
      nowIso,
    );
    return {
      state: emptyOpsState(nowIso, newSandboxId()),
      note:
        "新しい版で保存されたデータのため、この画面では読み込みませんでした。" +
        backupNote(kept),
    };
  }

  const base = emptyOpsState(nowIso, value.sandboxId || newSandboxId());
  const state: OpsState = {
    ...base,
    cases: Array.isArray(value.cases) ? value.cases : [],
    dismissedSeedIds: Array.isArray(value.dismissedSeedIds)
      ? value.dismissedSeedIds
      : [],
    createdAtIso: value.createdAtIso ?? nowIso,
    updatedAtIso: nowIso,
    schemaVersion: OPS_SCHEMA_VERSION,
  };

  const carried = state.cases.length > 0 || state.dismissedSeedIds.length > 0;
  return {
    state,
    note:
      version < OPS_SCHEMA_VERSION && carried
        ? `保存されていた対応記録を${version ? `版 ${version}` : "旧形式"}から版 ${OPS_SCHEMA_VERSION} へ更新しました。内容はそのまま引き継いでいます。`
        : undefined,
  };
}

export function loadOpsState(nowIso: string): OpsMigration {
  const read = readRaw(OPS_STORAGE_KEY);
  if (read.ok)
    return read.value === null
      ? { state: emptyOpsState(nowIso, newSandboxId()) }
      : migrateOps(read.value, nowIso);

  if (read.fault === "unavailable")
    return {
      state: emptyOpsState(nowIso, newSandboxId()),
      note: "このブラウザでは保存が使えないため、このタブの間だけの体験になります。",
    };

  const kept = keepBackup(
    OPS_STORAGE_KEY,
    read.text ?? "",
    "unreadable",
    nowIso,
  );
  return {
    state: emptyOpsState(nowIso, newSandboxId()),
    note: "保存されていた対応記録を読み込めませんでした。" + backupNote(kept),
  };
}

export function saveOpsState(state: OpsState): boolean {
  return writeRaw(OPS_STORAGE_KEY, state);
}

export function resetOpsState(nowIso: string): OpsState {
  const fresh = emptyOpsState(nowIso, newSandboxId());
  saveOpsState(fresh);
  return fresh;
}

export const exportOpsState = (state: OpsState) => exportText(state);

/** Cases and dismissed seeds together belong to no other sandbox. */
const looksLikeOps = (raw: unknown) => {
  const value = raw as Partial<OpsState>;
  return Array.isArray(value?.cases) && Array.isArray(value?.dismissedSeedIds);
};

export function importOpsState(
  text: string,
  nowIso: string,
): ImportResult<OpsState> {
  return importSandbox(text, nowIso, migrateOps, looksLikeOps);
}

export const OPS_STORAGE_DISCLOSURE =
  "この体験の対応記録は、お使いのブラウザの中だけに保存されます。サーバーには送信されず、他の訪問者とは共有されません。";
