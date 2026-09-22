import { payloadHashOf } from "../approval";
import { hash, idempotencyKey, runId as makeRunId } from "../ids";
import type {
  ActionPlan,
  ExecutionMode,
  PlannedAction,
  Run,
  Warning,
} from "../types";
import type { ReportResult } from "./compute";
import type { Recipe, RecipeChange } from "./recipe";

/**
 * Wraps a report computation as a run (指示書 §06, §14).
 *
 * Without this, the report flow would be the one workflow with no stated
 * input source, processing kind or external-effect status — which is exactly
 * the single-label shortcut the specification rules out. The arithmetic lives
 * in `compute.ts`; this file only describes what happened and what would
 * happen next.
 */

export const REPORT_POLICY_VERSION = "report-2026.09.22";

export type ReportRunInput = {
  tenantId: string;
  fileId: string;
  fileLabel: string;
  atIso: string;
  mode: ExecutionMode;
  /** True when the visitor supplied the file rather than using the sample. */
  userSupplied: boolean;
  recipe: Recipe;
};

export type ReportRun = {
  run: Run;
  plan: ActionPlan;
  payloads: Record<string, unknown>;
};

/**
 * Builds the run for a computation that completed.
 *
 * The output artefacts are internal: a generated table and a stored file are
 * things we can regenerate, so they do not need approval. Delivering them to
 * a connected tool would, and that action is planned but not executable until
 * a destination is actually connected.
 */
export function reportRun(
  input: ReportRunInput,
  result: ReportResult,
): ReportRun {
  const runIdValue = makeRunId("report", {
    tenantId: input.tenantId,
    fileId: input.fileId,
    recipeVersion: input.recipe.version,
  });

  const reportPayload = {
    fileLabel: input.fileLabel,
    recipeId: input.recipe.recipeId,
    recipeVersion: input.recipe.version,
    rowsCounted: result.totals.rowsCounted,
    total: result.totals.total,
  };
  const artifactPayload = {
    files: ["加工済みCSV", "集計表", "問題行一覧", "変更ログ"],
    recipeVersion: input.recipe.version,
  };

  const actions: PlannedAction[] = [
    action({
      tenantId: input.tenantId,
      runId: runIdValue,
      id: "report-generate",
      kind: "report.generate",
      targetRef: `internal:report/${input.fileId}`,
      payload: reportPayload,
      summary: `${input.fileLabel} の集計表・比較表を作成します（内部処理）。`,
    }),
    action({
      tenantId: input.tenantId,
      runId: runIdValue,
      id: "artifact-store",
      kind: "artifact.store",
      targetRef: `internal:artifact/${input.fileId}`,
      payload: artifactPayload,
      summary: "加工済みCSV・問題行一覧・変更ログを保存します（内部記録）。",
    }),
    action({
      tenantId: input.tenantId,
      runId: runIdValue,
      id: "deliver",
      kind: "mail.send",
      targetRef: "mail:report-recipient",
      payload: reportPayload,
      summary: "承認後に、報告先へ成果物を送付します。",
    }),
  ];

  const blocking = result.warnings.some((w) => w.severity === "blocking");

  const plan: ActionPlan = {
    tenantId: input.tenantId,
    runId: runIdValue,
    version: input.recipe.version,
    inputHash: hash({ fileId: input.fileId, rows: result.totals.rowsRead }),
    policyVersion: `${REPORT_POLICY_VERSION}/recipe-v${input.recipe.version}`,
    mode: input.mode,
    evidence: [],
    missingFields: [],
    warnings: result.warnings,
    actions,
  };

  const run: Run = {
    tenantId: input.tenantId,
    runId: runIdValue,
    mode: input.mode,
    workflow: "report",
    status: blocking ? "needs_info" : "awaiting_approval",
    // A file the visitor chose is their file, even in the sample.
    inputSource: input.userSupplied
      ? "user_file"
      : input.mode === "sample"
        ? "sample"
        : "user_file",
    createdAt: input.atIso,
    updatedAt: input.atIso,
    plan,
    approvals: [],
    effects: [],
    timeline: [
      {
        at: input.atIso,
        event: "received",
        detail: `${input.fileLabel}（${result.totals.rowsRead} 行）を読み込みました。原本は変更していません。`,
      },
      {
        at: input.atIso,
        event: "recipe_applied",
        detail: `レシピ v${input.recipe.version} を適用（重複条件 ${input.recipe.dedupeBy}、通貨 ${input.recipe.currency}）。`,
      },
      {
        at: input.atIso,
        event: "computed",
        detail:
          `${result.totals.rowsCounted} 件を集計` +
          (result.totals.duplicatesRemoved
            ? `、重複 ${result.totals.duplicatesRemoved} 行を除外`
            : "") +
          (result.totals.rowsExcluded - result.totals.duplicatesRemoved > 0
            ? `、読み取れない ${result.totals.rowsExcluded - result.totals.duplicatesRemoved} 行を除外`
            : "") +
          "。合計は通常プログラムで計算しています。",
      },
    ],
  };

  return {
    run,
    plan,
    payloads: {
      "report-generate": reportPayload,
      "artifact-store": artifactPayload,
      deliver: reportPayload,
    },
  };
}

/**
 * The run for a file that stopped for confirmation, before any arithmetic.
 *
 * It still carries the four state labels: a run that refused to guess is a
 * result, and hiding it would make "this one needed a decision" look like
 * nothing happened (指示書 C06).
 */
export function blockedReportRun(
  input: ReportRunInput,
  changes: readonly RecipeChange[],
  warnings: readonly Warning[],
  rowsRead: number,
): ReportRun {
  const runIdValue = makeRunId("report", {
    tenantId: input.tenantId,
    fileId: input.fileId,
    recipeVersion: input.recipe.version,
  });

  const plan: ActionPlan = {
    tenantId: input.tenantId,
    runId: runIdValue,
    version: input.recipe.version,
    inputHash: hash({ fileId: input.fileId, rows: rowsRead }),
    policyVersion: `${REPORT_POLICY_VERSION}/recipe-v${input.recipe.version}`,
    mode: input.mode,
    evidence: [],
    missingFields: changes.map((c) => ({
      field: c.kind,
      label: c.detail,
      reason: c.proposal,
    })),
    warnings: [...warnings],
    actions: [],
  };

  return {
    run: {
      tenantId: input.tenantId,
      runId: runIdValue,
      mode: input.mode,
      workflow: "report",
      status: "needs_info",
      inputSource: input.userSupplied ? "user_file" : "sample",
      createdAt: input.atIso,
      updatedAt: input.atIso,
      plan,
      approvals: [],
      effects: [],
      timeline: [
        {
          at: input.atIso,
          event: "received",
          detail: `${input.fileLabel}（${rowsRead} 行）を読み込みました。原本は変更していません。`,
        },
        {
          at: input.atIso,
          event: "stopped",
          detail: `前回と意味が変わった点が ${changes.length} 件あるため、集計せずに確認を求めます。`,
        },
      ],
    },
    plan,
    payloads: {},
  };
}

function action(opts: {
  tenantId: string;
  runId: string;
  id: string;
  kind: PlannedAction["kind"];
  targetRef: string;
  payload: unknown;
  summary: string;
}): PlannedAction {
  const payloadHash = payloadHashOf(opts.payload);
  return {
    id: opts.id,
    kind: opts.kind,
    targetRef: opts.targetRef,
    payloadHash,
    requiresApproval: opts.kind === "mail.send",
    idempotencyKey: idempotencyKey({
      tenantId: opts.tenantId,
      runId: opts.runId,
      actionId: opts.id,
      payloadHash,
    }),
    summary: opts.summary,
  };
}
