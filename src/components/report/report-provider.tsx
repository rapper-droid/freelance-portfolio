"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { parseCsv, type CsvData } from "@/lib/csv";
import { runId as makeRunId } from "@/lib/runtime/ids";
import {
  compareReports,
  computeReport,
  summarise,
  type PeriodComparison,
  type ReportResult,
} from "@/lib/runtime/report/compute";
import {
  createRecipe,
  fitRecipe,
  reviseRecipe,
  suggestRoles,
  type ColumnRole,
  type Recipe,
  type RecipeChange,
} from "@/lib/runtime/report/recipe";
import { applyFixes, removeFix, upsertFix } from "@/lib/report/fixes";
import {
  REPORT_STORAGE_KEY,
  RUN_HISTORY_LIMIT,
  draftTooLarge,
  emptyReportState,
  exportReportState,
  importReportState,
  loadReportState,
  resetReportState,
  saveReportState,
} from "@/lib/report/store";
import type {
  ReportDraft,
  ReportState,
  RowFix,
  RunRecord,
  StoredResult,
} from "@/lib/report/types";

/**
 * REPORT FLOW's state (指示書 §15).
 *
 * The tool is one screen with four steps, not four screens: a person who has
 * just mapped a column should not lose the file by pressing back. So the step
 * lives in the draft, the draft lives in the sandbox, and reopening the tab
 * puts somebody back where they were — with the same file, the same mapping
 * and the same corrections.
 *
 * Everything derived is computed here, once, from three inputs: the parsed
 * file, the recipe in force, and the corrections. No screen keeps its own copy
 * of a total.
 */

const TENANT = "demo";
/** Problems are capped in storage; a history entry is a summary, not a copy. */
const STORED_PROBLEM_LIMIT = 20;

export type ReportStep = ReportDraft["step"];

type Loaded =
  | { kind: "none" }
  | { kind: "error"; message: string; fileLabel: string }
  | { kind: "ok"; data: CsvData; fileLabel: string; userSupplied: boolean };

export type ReviewState = {
  /** The file with the person's corrections laid over it. */
  data: CsvData;
  result: ReportResult;
  comparison: PeriodComparison | null;
  summary: ReturnType<typeof summarise>;
  /** Corrections that no longer match any row in this file. */
  orphanedFixes: RowFix[];
  /** Change log from the corrections, merged with the computation's own. */
  fixChangeLog: ReportResult["changeLog"];
};

type ReportContextValue = {
  ready: boolean;
  notice: string;
  state: ReportState;
  draft: ReportDraft | null;
  loaded: Loaded;
  recipe: Recipe | null;
  /** Set when a saved recipe does not fit and a person has to decide. */
  pending: RecipeChange[];
  mapping: Record<ColumnRole, string | null> | null;
  review: ReviewState | null;
  previousRun: RunRecord | null;

  openFile: (text: string, label: string, userSupplied: boolean) => void;
  clearFile: () => void;
  setStep: (step: ReportStep) => void;
  setRole: (column: string, role: ColumnRole) => void;
  setCurrency: (currency: string) => void;
  setDedupe: (dedupeBy: Recipe["dedupeBy"]) => void;
  applyRecipe: (recipeId: string | null) => void;
  saveRecipe: (label: string) => { ok: boolean; reason?: string };
  acceptChanges: (roles: Record<string, ColumnRole>) => void;
  addFix: (fix: RowFix) => void;
  dropFix: (sourceRow: number) => void;
  recordRun: () => RunRecord | null;
  deleteRecipe: (recipeId: string) => void;
  exportData: () => string;
  importData: (text: string) => string | null;
  reset: () => void;
};

const ReportContext = createContext<ReportContextValue | null>(null);

export function useReport() {
  const value = useContext(ReportContext);
  if (!value) throw new Error("useReport outside ReportProvider");
  return value;
}

const ALL_ROLES: ColumnRole[] = [
  "orderId",
  "date",
  "productName",
  "quantity",
  "amount",
  "taxCategory",
  "currency",
  "ignore",
];

const emptyMapping = () => {
  const mapping = {} as Record<ColumnRole, string | null>;
  for (const role of ALL_ROLES) mapping[role] = null;
  return mapping;
};

/** Builds the mapping a draft's own roles describe, without a saved recipe. */
function mappingOf(
  roles: Record<string, ColumnRole>,
  headers: string[],
): Record<ColumnRole, string | null> {
  const mapping = emptyMapping();
  for (const header of headers) {
    const role = roles[header];
    if (!role || role === "ignore") continue;
    if (!mapping[role]) mapping[role] = header;
  }
  return mapping;
}

const trimResult = (result: ReportResult): StoredResult => ({
  totals: result.totals,
  provenance: result.provenance,
  warnings: result.warnings,
  problems: result.problems.slice(0, STORED_PROBLEM_LIMIT),
  problemsTotal: result.problems.length,
});

/** A stored run, inflated enough for compareReports to read it. */
const asResult = (run: RunRecord): ReportResult => ({
  rows: [],
  problems: run.result.problems,
  changeLog: [],
  totals: run.result.totals,
  warnings: run.result.warnings,
  provenance: run.result.provenance,
});

export function ReportProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReportState>(() =>
    emptyReportState(new Date().toISOString(), "server"),
  );
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const loadedOnce = useRef(false);
  // Sequential edits in one handler must see each other; setState alone does
  // not give that, and the ops provider learned it the hard way.
  const live = useRef(state);

  const commit = useCallback((next: ReportState) => {
    const stamped = { ...next, updatedAtIso: new Date().toISOString() };
    live.current = stamped;
    setState(stamped);
    const saved = saveReportState(stamped);
    if (!saved.ok)
      setNotice(
        saved.droppedDraft
          ? "保存容量が足りないため、読み込み中のファイルは保持しませんでした。ルールと履歴は残っています。"
          : "このブラウザでは保存できないため、タブを閉じると内容は消えます。",
      );
    return stamped;
  }, []);

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    // Storage is only readable on the client, so the first read has to happen
    // here. One state update carries all of it rather than three in a row.
    const { state: stored, note } = loadReportState(new Date().toISOString());
    live.current = stored;
    queueMicrotask(() => {
      setState(stored);
      setNotice(note ?? "");
      setReady(true);
    });
  }, []);

  const draft = state.draft;

  // ---- the file ----------------------------------------------------------
  const loaded = useMemo<Loaded>(() => {
    if (!draft) return { kind: "none" };
    try {
      return {
        kind: "ok",
        data: parseCsv(draft.csvText),
        fileLabel: draft.fileLabel,
        userSupplied: draft.userSupplied,
      };
    } catch (error) {
      return {
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "このファイルは読み込めませんでした。",
        fileLabel: draft.fileLabel,
      };
    }
  }, [draft]);

  const recipeId = draft?.recipeId ?? null;
  const recipe = useMemo(
    () => state.recipes.find((r) => r.recipeId === recipeId) ?? null,
    [state.recipes, recipeId],
  );

  // ---- does the saved recipe still fit? -----------------------------------
  const fit = useMemo(() => {
    if (loaded.kind !== "ok" || !recipe) return null;
    const taxColumn = Object.entries(recipe.columnRoles).find(
      ([, role]) => role === "taxCategory",
    )?.[0];
    const at = taxColumn ? loaded.data.headers.indexOf(taxColumn) : -1;
    const observed =
      at >= 0
        ? [...new Set(loaded.data.rows.map((r) => (r[at] ?? "").trim()))]
        : [];
    return fitRecipe(recipe, loaded.data, observed);
  }, [loaded, recipe]);

  const pending = useMemo(
    () => (fit && !fit.ok ? fit.needsConfirmation : []),
    [fit],
  );

  const mapping = useMemo(() => {
    if (loaded.kind !== "ok") return null;
    if (fit?.ok) return fit.mapping;
    if (!draft) return null;
    return mappingOf(
      draft.columnRoles as Record<string, ColumnRole>,
      loaded.data.headers,
    );
  }, [loaded, fit, draft]);

  // ---- the numbers -------------------------------------------------------
  const previousRun = useMemo(() => {
    if (!recipeId) return null;
    return state.runs.find((r) => r.recipeId === recipeId) ?? null;
  }, [state.runs, recipeId]);

  const review = useMemo<ReviewState | null>(() => {
    if (loaded.kind !== "ok" || !draft || !mapping) return null;
    if (pending.length) return null;

    const effective =
      recipe ??
      createRecipe({
        tenantId: TENANT,
        label: draft.fileLabel,
        columnRoles: draft.columnRoles as Record<string, ColumnRole>,
        currency: draft.currency,
        dedupeBy: draft.dedupeBy,
        atIso: draft.updatedAtIso,
      });

    const fixed = applyFixes(loaded.data, draft.fixes);
    const result = computeReport(
      fixed.data,
      effective,
      mapping,
      new Date().toISOString(),
    );
    const comparison = previousRun
      ? compareReports(asResult(previousRun), result, {
          previous: previousRun.fileLabel,
          current: draft.fileLabel,
        })
      : null;

    return {
      data: fixed.data,
      result,
      comparison,
      summary: summarise(result, comparison),
      orphanedFixes: fixed.orphaned,
      fixChangeLog: fixed.changeLog,
    };
    // `recipe` is intentionally part of this: a revision must recompute.
  }, [loaded, draft, mapping, pending.length, recipe, previousRun]);

  // ---- actions -----------------------------------------------------------
  const patchDraft = useCallback(
    (patch: Partial<ReportDraft>) => {
      const current = live.current.draft;
      if (!current) return;
      commit({
        ...live.current,
        draft: { ...current, ...patch, updatedAtIso: new Date().toISOString() },
      });
    },
    [commit],
  );

  const value = useMemo<ReportContextValue>(() => {
    const now = () => new Date().toISOString();

    return {
      ready,
      notice,
      state,
      draft,
      loaded,
      recipe,
      pending,
      mapping,
      review,
      previousRun,

      openFile: (text, label, userSupplied) => {
        let roles: Record<string, ColumnRole> = {};
        try {
          roles = suggestRoles(parseCsv(text).headers);
        } catch {
          // An unreadable file still opens: the screen has to explain why.
        }
        // Which saved recipe is this file? Requiring an exact fit was wrong:
        // the third week — a known file with one new column — matched nothing
        // and arrived as a stranger, which is precisely the case the recipe
        // exists to handle. So the best overlap wins, and `fitRecipe` then
        // decides whether it can run or has to ask.
        let match: Recipe | null = null;
        try {
          const headers = new Set(parseCsv(text).headers);
          let best = 0;
          for (const candidate of live.current.recipes) {
            const columns = Object.entries(candidate.columnRoles)
              .filter(([, role]) => role !== "ignore")
              .map(([column]) => column);
            if (columns.length === 0) continue;
            const hit = columns.filter((c) => headers.has(c)).length;
            // Half its columns is the floor: below that it is another file.
            if (hit * 2 < columns.length) continue;
            if (hit > best) {
              best = hit;
              match = candidate;
            }
          }
        } catch {
          // Unreadable: the screen explains why, with no recipe attached.
        }

        if (draftTooLarge(text))
          setNotice(
            "このファイルは大きいため、タブを閉じると保持されません。ルールと履歴は残ります。",
          );

        commit({
          ...live.current,
          draft: {
            // `map` is also where the confirmation list appears, so a recipe
            // that needs a decision lands there rather than on empty totals.
            step: match ? "review" : "map",
            fileLabel: label,
            csvText: text,
            userSupplied,
            recipeId: match?.recipeId ?? null,
            columnRoles: roles,
            currency: match?.currency ?? "JPY",
            dedupeBy: match?.dedupeBy ?? "orderId",
            fixes: [],
            pendingConfirmation: false,
            updatedAtIso: now(),
          },
        });
      },

      clearFile: () => commit({ ...live.current, draft: null }),
      setStep: (step) => patchDraft({ step }),
      setRole: (column, role) =>
        patchDraft({
          columnRoles: { ...live.current.draft?.columnRoles, [column]: role },
        }),
      setCurrency: (currency) => patchDraft({ currency }),
      setDedupe: (dedupeBy) => patchDraft({ dedupeBy }),
      applyRecipe: (recipeId) => {
        const chosen = live.current.recipes.find(
          (r) => r.recipeId === recipeId,
        );
        patchDraft({
          recipeId,
          ...(chosen
            ? { currency: chosen.currency, dedupeBy: chosen.dedupeBy }
            : {}),
        });
      },

      saveRecipe: (label) => {
        const current = live.current.draft;
        if (!current) return { ok: false, reason: "ファイルがありません。" };
        if (!label.trim())
          return { ok: false, reason: "名前を入力してください。" };

        const roles = current.columnRoles as Record<string, ColumnRole>;
        const used = new Set(Object.values(roles));
        if (!used.has("amount") || !used.has("date"))
          return {
            ok: false,
            reason: "金額と日付の列を決めてから保存してください。",
          };

        let taxes: string[] = [];
        try {
          const data = parseCsv(current.csvText);
          const taxColumn = Object.entries(roles).find(
            ([, role]) => role === "taxCategory",
          )?.[0];
          const at = taxColumn ? data.headers.indexOf(taxColumn) : -1;
          if (at >= 0)
            taxes = [
              ...new Set(
                data.rows.map((r) => (r[at] ?? "").trim()).filter(Boolean),
              ),
            ];
        } catch {
          // Saving a recipe for a file that will not parse is still allowed;
          // the recipe is about columns, not about this file's rows.
        }

        const saved = createRecipe({
          tenantId: TENANT,
          label: label.trim(),
          columnRoles: roles,
          currency: current.currency,
          dedupeBy: current.dedupeBy,
          knownTaxCategories: taxes,
          atIso: now(),
        });
        const others = live.current.recipes.filter(
          (r) => r.recipeId !== saved.recipeId,
        );
        commit({
          ...live.current,
          recipes: [saved, ...others],
          draft: {
            ...current,
            recipeId: saved.recipeId,
            step: "review",
            updatedAtIso: now(),
          },
        });
        return { ok: true };
      },

      acceptChanges: (roles) => {
        const current = live.current.draft;
        const base = live.current.recipes.find(
          (r) => r.recipeId === current?.recipeId,
        );
        if (!current || !base) return;

        let taxes = base.knownTaxCategories;
        try {
          const data = parseCsv(current.csvText);
          const taxColumn = Object.entries(roles).find(
            ([, role]) => role === "taxCategory",
          )?.[0];
          const at = taxColumn ? data.headers.indexOf(taxColumn) : -1;
          if (at >= 0)
            taxes = [
              ...new Set([
                ...taxes,
                ...data.rows.map((r) => (r[at] ?? "").trim()).filter(Boolean),
              ]),
            ];
        } catch {
          /* the mapping decision stands regardless */
        }

        const revised = reviseRecipe(base, {
          columnRoles: roles,
          knownTaxCategories: taxes,
          approvedBy: "この端末の利用者",
          atIso: now(),
        });
        commit({
          ...live.current,
          // The previous version is kept: an earlier report has to stay
          // explainable by the recipe that produced it.
          recipes: [
            revised,
            ...live.current.recipes.filter(
              (r) => r.recipeId !== revised.recipeId,
            ),
          ],
          draft: { ...current, columnRoles: roles, updatedAtIso: now() },
        });
        setNotice(`ルールを版 ${revised.version} に更新しました。`);
      },

      addFix: (fix) =>
        patchDraft({ fixes: upsertFix(live.current.draft?.fixes ?? [], fix) }),
      dropFix: (sourceRow) =>
        patchDraft({
          fixes: removeFix(live.current.draft?.fixes ?? [], sourceRow),
        }),

      recordRun: () => {
        const current = live.current.draft;
        if (!current || !review) return null;
        const record: RunRecord = {
          runId: makeRunId("report", {
            fileLabel: current.fileLabel,
            at: now(),
          }),
          recipeId: current.recipeId ?? "adhoc",
          recipeVersion: review.result.provenance.recipeVersion,
          fileLabel: current.fileLabel,
          fileHash: makeRunId("file", current.csvText),
          userSupplied: current.userSupplied,
          atIso: now(),
          result: trimResult(review.result),
          fixesApplied: current.fixes.length,
          comparedWith: previousRun?.runId ?? null,
        };
        commit({
          ...live.current,
          runs: [record, ...live.current.runs].slice(0, RUN_HISTORY_LIMIT),
          draft: { ...current, step: "output", updatedAtIso: now() },
        });
        return record;
      },

      deleteRecipe: (recipeId) =>
        commit({
          ...live.current,
          recipes: live.current.recipes.filter((r) => r.recipeId !== recipeId),
          draft:
            live.current.draft?.recipeId === recipeId
              ? { ...live.current.draft, recipeId: null }
              : live.current.draft,
        }),

      exportData: () => exportReportState(live.current),
      importData: (text) => {
        const result = importReportState(text, now());
        if (!result.ok) return result.reason;
        commit(result.state);
        setNotice(result.note ?? "保存データを読み込みました。");
        return null;
      },
      reset: () => {
        const fresh = resetReportState(now());
        live.current = fresh;
        setState(fresh);
        setNotice("この端末のルールと履歴を初期化しました。");
      },
    };
  }, [
    ready,
    notice,
    state,
    draft,
    loaded,
    recipe,
    pending,
    mapping,
    review,
    previousRun,
    commit,
    patchDraft,
  ]);

  return (
    <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
  );
}

export { REPORT_STORAGE_KEY };
