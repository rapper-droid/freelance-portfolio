import type { Money } from "../runtime/rules/money";
import type { Warning } from "../runtime/types";
import type { Recipe } from "../runtime/report/recipe";
import type {
  ProblemRow,
  ReportResult,
  ReportTotals,
} from "../runtime/report/compute";

/**
 * What REPORT FLOW keeps between visits (指示書 §15, §18).
 *
 * The domain — recipes, computation, period comparison — already existed and
 * had thirty-eight tests, and no screen had ever rendered it. These are the
 * types the tool needs on top of it: what a completed run is worth storing,
 * what a correction is, and how far through a file somebody got before they
 * closed the tab.
 *
 * The rule that shapes all of it: **the source file is never modified.**
 * Corrections are stored beside the data as row-level overrides, so the
 * original can always be shown next to what was counted.
 */

export const REPORT_SCHEMA_VERSION = 1;

/** A person's correction to one unreadable row. The file keeps its value. */
export type RowFix = {
  /** 1-based index in the source file, matching ProblemRow.sourceRow. */
  sourceRow: number;
  /** Column name → the value to use instead. Absent columns are untouched. */
  cells: Record<string, string>;
  note: string;
  atIso: string;
};

/**
 * A stored run.
 *
 * The computed rows are deliberately dropped: ten thousand of them would not
 * survive a browser's storage quota, and nothing reads them back. What is kept
 * is exactly what `compareReports` and the history screen need — the totals,
 * the provenance, the warnings, and a capped sample of the problems so a
 * reader can see what kind of thing failed.
 */
export type StoredResult = {
  totals: ReportTotals;
  provenance: ReportResult["provenance"];
  warnings: Warning[];
  problems: ProblemRow[];
  problemsTotal: number;
};

export type RunRecord = {
  runId: string;
  recipeId: string;
  recipeVersion: number;
  fileLabel: string;
  /** Distinguishes "the same file again" from "a new file" in the history. */
  fileHash: string;
  userSupplied: boolean;
  atIso: string;
  result: StoredResult;
  fixesApplied: number;
  /** The run this one was compared against, when there was one. */
  comparedWith: string | null;
};

/** Where somebody was when they stopped, so reopening resumes it. */
export type ReportDraft = {
  step: "import" | "map" | "review" | "output";
  fileLabel: string;
  /** Kept so a reload does not ask for the file again. */
  csvText: string;
  userSupplied: boolean;
  recipeId: string | null;
  /** The mapping being edited, before it is saved into a recipe. */
  columnRoles: Record<string, string>;
  currency: string;
  dedupeBy: Recipe["dedupeBy"];
  fixes: RowFix[];
  /** Changes a recipe reuse stopped for, until a person decides. */
  pendingConfirmation: boolean;
  updatedAtIso: string;
};

export type ReportState = {
  schemaVersion: number;
  sandboxId: string;
  recipes: Recipe[];
  runs: RunRecord[];
  draft: ReportDraft | null;
  createdAtIso: string;
  updatedAtIso: string;
};

/** The tool refuses a draft bigger than this rather than failing to save. */
export const DRAFT_TEXT_LIMIT = 400_000;

export type MoneyLike = Money | null;
