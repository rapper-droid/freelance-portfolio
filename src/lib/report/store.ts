import {
  backupNote,
  exportText,
  importSandbox,
  keepBackup,
  readRaw,
  writeRaw,
  type ImportResult,
} from "../runtime/sandbox";
import type { Recipe } from "../runtime/report/recipe";
import {
  DRAFT_TEXT_LIMIT,
  REPORT_SCHEMA_VERSION,
  type ReportDraft,
  type ReportState,
  type RunRecord,
} from "./types";

export { REPORT_SCHEMA_VERSION };

/**
 * REPORT FLOW's sandbox (指示書 §15, §18).
 *
 * The fourth of them, and the one whose loss would hurt most: a recipe is a
 * decision somebody made once so they would never have to make it again, and a
 * run history is the only record of what the numbers were last week. So it
 * takes the same contract as the shops — versioned, migrated, quarantined when
 * unusable, exportable — rather than a private copy of half of it.
 */

export const REPORT_STORAGE_KEY = "tsudowa-report-sandbox-v1";

/** History is capped: a browser is not an archive, and it should say so. */
export const RUN_HISTORY_LIMIT = 40;

export const emptyReportState = (
  nowIso: string,
  sandboxId: string,
): ReportState => ({
  schemaVersion: REPORT_SCHEMA_VERSION,
  sandboxId,
  recipes: [],
  runs: [],
  draft: null,
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

export type ReportMigration = { state: ReportState; note?: string };

const isRecipe = (value: unknown): value is Recipe => {
  const r = value as Partial<Recipe>;
  return (
    !!r &&
    typeof r.recipeId === "string" &&
    typeof r.version === "number" &&
    !!r.columnRoles
  );
};

const isRun = (value: unknown): value is RunRecord => {
  const r = value as Partial<RunRecord>;
  return !!r && typeof r.runId === "string" && !!r.result;
};

export function migrateReport(raw: unknown, nowIso: string): ReportMigration {
  if (!raw || typeof raw !== "object")
    return { state: emptyReportState(nowIso, newSandboxId()) };

  const value = raw as Partial<ReportState>;
  const version =
    typeof value.schemaVersion === "number" ? value.schemaVersion : 0;

  // Written by a newer build: copied aside before anything overwrites it.
  if (version > REPORT_SCHEMA_VERSION) {
    const kept = keepBackup(
      REPORT_STORAGE_KEY,
      JSON.stringify(raw),
      `schemaVersion ${version} > ${REPORT_SCHEMA_VERSION}`,
      nowIso,
    );
    return {
      state: emptyReportState(nowIso, newSandboxId()),
      note:
        "新しい版で保存されたデータのため、この画面では読み込みませんでした。" +
        backupNote(kept),
    };
  }

  const base = emptyReportState(nowIso, value.sandboxId || newSandboxId());
  // Individual rows are filtered rather than the whole record rejected: one
  // corrupt run should not cost somebody their recipes.
  const recipes = Array.isArray(value.recipes)
    ? value.recipes.filter(isRecipe)
    : [];
  const runs = Array.isArray(value.runs) ? value.runs.filter(isRun) : [];
  const dropped =
    (Array.isArray(value.recipes) ? value.recipes.length - recipes.length : 0) +
    (Array.isArray(value.runs) ? value.runs.length - runs.length : 0);

  const state: ReportState = {
    ...base,
    recipes,
    runs: runs.slice(0, RUN_HISTORY_LIMIT),
    draft: isDraft(value.draft) ? value.draft : null,
    createdAtIso: value.createdAtIso ?? nowIso,
    updatedAtIso: nowIso,
    schemaVersion: REPORT_SCHEMA_VERSION,
  };

  const carried = recipes.length > 0 || runs.length > 0;
  const notes: string[] = [];
  if (version < REPORT_SCHEMA_VERSION && carried)
    notes.push(
      `保存されていたルールと履歴を${version ? `版 ${version}` : "旧形式"}から版 ${REPORT_SCHEMA_VERSION} へ更新しました。内容はそのまま引き継いでいます。`,
    );
  if (dropped)
    notes.push(
      `読み取れなかった ${dropped} 件を除いて読み込みました。残りはそのままです。`,
    );

  return { state, note: notes.length ? notes.join(" ") : undefined };
}

function isDraft(value: unknown): value is ReportDraft {
  const d = value as Partial<ReportDraft>;
  return (
    !!d &&
    typeof d.csvText === "string" &&
    typeof d.fileLabel === "string" &&
    typeof d.step === "string"
  );
}

export function loadReportState(nowIso: string): ReportMigration {
  const read = readRaw(REPORT_STORAGE_KEY);
  if (read.ok)
    return read.value === null
      ? { state: emptyReportState(nowIso, newSandboxId()) }
      : migrateReport(read.value, nowIso);

  if (read.fault === "unavailable")
    return {
      state: emptyReportState(nowIso, newSandboxId()),
      note: "このブラウザでは保存が使えないため、このタブの間だけルールを保持します。",
    };

  const kept = keepBackup(
    REPORT_STORAGE_KEY,
    read.text ?? "",
    "unreadable",
    nowIso,
  );
  return {
    state: emptyReportState(nowIso, newSandboxId()),
    note:
      "保存されていたルールと履歴を読み込めませんでした。" + backupNote(kept),
  };
}

/**
 * Writes the sandbox, dropping the draft's file text first if the whole thing
 * will not fit.
 *
 * Losing a half-finished import is annoying; losing every saved recipe because
 * one large file would not fit is the kind of failure that makes a tool
 * untrustworthy. So the recoverable thing goes first and the caller is told.
 */
export function saveReportState(
  state: ReportState,
): { ok: true } | { ok: false; droppedDraft: boolean } {
  if (writeRaw(REPORT_STORAGE_KEY, state)) return { ok: true };
  if (state.draft) {
    const lean: ReportState = { ...state, draft: null };
    if (writeRaw(REPORT_STORAGE_KEY, lean))
      return { ok: false, droppedDraft: true };
  }
  return { ok: false, droppedDraft: false };
}

export function resetReportState(nowIso: string): ReportState {
  const fresh = emptyReportState(nowIso, newSandboxId());
  saveReportState(fresh);
  return fresh;
}

export const exportReportState = (state: ReportState) => exportText(state);

/** Recipes plus runs together belong to no other sandbox. */
const looksLikeReport = (raw: unknown) => {
  const value = raw as Partial<ReportState>;
  return Array.isArray(value?.recipes) && Array.isArray(value?.runs);
};

export function importReportState(
  text: string,
  nowIso: string,
): ImportResult<ReportState> {
  return importSandbox(text, nowIso, migrateReport, looksLikeReport);
}

/** True when a draft's file is too large to keep between visits. */
export const draftTooLarge = (csvText: string) =>
  csvText.length > DRAFT_TEXT_LIMIT;

export const REPORT_STORAGE_DISCLOSURE =
  "読み込んだCSV、作った加工ルール、処理履歴は、お使いのブラウザの中だけに保存されます。サーバーには送信されず、他の訪問者とは共有されません。";
