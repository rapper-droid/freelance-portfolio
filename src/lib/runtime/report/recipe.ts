import type { CsvData } from "@/lib/csv";
import { hash } from "../ids";
import type { Warning } from "../types";

/**
 * The saved processing recipe (指示書 §09-1).
 *
 * This is what makes the second run cheaper than the first. The recipe stores
 * the decisions a person made once — which column is the date, what counts as
 * a duplicate, which currency the amounts are in — and re-applies them to the
 * next file.
 *
 * The line it will not cross: re-applying is only allowed when the new file
 * means the same thing as the old one. A reordered column is the same data and
 * reruns silently (C05). A new column, a missing required column or a changed
 * tax basis is not, and stops for confirmation instead of guessing (C06).
 */

export const RECIPE_SCHEMA_VERSION = 1;

export type ColumnRole =
  | "orderId"
  | "date"
  | "productName"
  | "quantity"
  | "amount"
  | "taxCategory"
  | "currency"
  | "ignore";

export type Recipe = {
  recipeId: string;
  tenantId: string;
  /** Bumped whenever a person approves a change (指示書 §18). */
  version: number;
  label: string;
  schemaVersion: number;
  /** Source column name → the role it plays. Order is irrelevant. */
  columnRoles: Record<string, ColumnRole>;
  /** Roles that must be present for the recipe to run at all. */
  requiredRoles: ColumnRole[];
  currency: string;
  /** Explicit, never inferred from "looks the same" (指示書 C03). */
  dedupeBy: "none" | "orderId" | "wholeRow";
  /** Tax categories seen and accepted when the recipe was approved. */
  knownTaxCategories: string[];
  createdAt: string;
  updatedAt: string;
};

export type RecipeFit =
  | {
      ok: true;
      mapping: Record<ColumnRole, string | null>;
      warnings: Warning[];
    }
  | { ok: false; warnings: Warning[]; needsConfirmation: RecipeChange[] };

export type RecipeChange = {
  kind: "new_column" | "missing_column" | "new_tax_category" | "mixed_currency";
  detail: string;
  /** What the recipe would become if a person accepts it. */
  proposal: string;
};

export function recipeIdFor(tenantId: string, label: string) {
  return "recipe-" + hash({ tenantId, label }).slice(0, 12);
}

/**
 * Builds the first version of a recipe from a mapping a person confirmed.
 * There is no auto-detect that saves itself: the first run always ends with a
 * human decision, which is what makes the second run trustworthy.
 */
export function createRecipe(opts: {
  tenantId: string;
  label: string;
  columnRoles: Record<string, ColumnRole>;
  currency: string;
  dedupeBy: Recipe["dedupeBy"];
  knownTaxCategories?: string[];
  atIso: string;
}): Recipe {
  return {
    recipeId: recipeIdFor(opts.tenantId, opts.label),
    tenantId: opts.tenantId,
    version: 1,
    label: opts.label,
    schemaVersion: RECIPE_SCHEMA_VERSION,
    columnRoles: { ...opts.columnRoles },
    requiredRoles: requiredRolesOf(opts.columnRoles),
    currency: opts.currency,
    dedupeBy: opts.dedupeBy,
    knownTaxCategories: opts.knownTaxCategories ?? [],
    createdAt: opts.atIso,
    updatedAt: opts.atIso,
  };
}

const ESSENTIAL: ColumnRole[] = ["date", "amount"];

function requiredRolesOf(roles: Record<string, ColumnRole>): ColumnRole[] {
  const present = new Set(Object.values(roles));
  return ESSENTIAL.filter((r) => present.has(r));
}

/**
 * Tries to apply a saved recipe to a new file.
 *
 * Matching is by column *name*, so the physical order can change freely — the
 * third week's export putting 金額 before 数量 is not a new file format
 * (指示書 C05 / §09-4).
 */
export function fitRecipe(
  recipe: Recipe,
  data: CsvData,
  observedTaxCategories: readonly string[] = [],
): RecipeFit {
  const warnings: Warning[] = [];
  const changes: RecipeChange[] = [];
  const headers = new Set(data.headers);

  const mapping = {} as Record<ColumnRole, string | null>;
  for (const role of [
    "orderId",
    "date",
    "productName",
    "quantity",
    "amount",
    "taxCategory",
    "currency",
    "ignore",
  ] as ColumnRole[])
    mapping[role] = null;

  for (const [column, role] of Object.entries(recipe.columnRoles)) {
    if (role === "ignore") continue;
    if (headers.has(column)) {
      mapping[role] = column;
      continue;
    }
    changes.push({
      kind: "missing_column",
      detail: `前回あった列「${column}」（${roleLabel(role)}）が今回のファイルにありません。`,
      proposal: `${roleLabel(role)} に対応する列を選び直してください。`,
    });
  }

  for (const header of data.headers) {
    if (header in recipe.columnRoles) continue;
    changes.push({
      kind: "new_column",
      detail: `前回になかった列「${header}」が増えています。`,
      proposal: `「${header}」の扱い（集計対象・無視）を選んでください。`,
    });
  }

  const unknownTax = observedTaxCategories.filter(
    (t) => t && !recipe.knownTaxCategories.includes(t),
  );
  for (const t of unknownTax)
    changes.push({
      kind: "new_tax_category",
      detail: `承認済みでない税区分「${t}」が含まれています。`,
      proposal: `「${t}」の扱いを決めてから再実行してください。`,
    });

  for (const role of recipe.requiredRoles)
    if (!mapping[role])
      warnings.push({
        code: "required_role_missing",
        message: `${roleLabel(role)} の列が特定できないため、集計できません。`,
        severity: "blocking",
      });

  if (changes.length) {
    for (const c of changes)
      warnings.push({
        code: c.kind,
        message: c.detail,
        severity: "blocking",
      });
    return { ok: false, warnings, needsConfirmation: changes };
  }

  return { ok: true, mapping, warnings };
}

/**
 * Applies an accepted change and bumps the version. The previous version is
 * not mutated, so an earlier report stays explainable by the recipe that
 * produced it (指示書 §18).
 */
export function reviseRecipe(
  recipe: Recipe,
  revision: {
    columnRoles?: Record<string, ColumnRole>;
    knownTaxCategories?: string[];
    dedupeBy?: Recipe["dedupeBy"];
    approvedBy: string;
    atIso: string;
  },
): Recipe {
  const columnRoles = revision.columnRoles ?? recipe.columnRoles;
  return {
    ...recipe,
    columnRoles: { ...columnRoles },
    requiredRoles: requiredRolesOf(columnRoles),
    knownTaxCategories:
      revision.knownTaxCategories ?? recipe.knownTaxCategories,
    dedupeBy: revision.dedupeBy ?? recipe.dedupeBy,
    version: recipe.version + 1,
    updatedAt: revision.atIso,
  };
}

const ROLE_LABELS: Record<ColumnRole, string> = {
  orderId: "注文ID",
  date: "日付",
  productName: "商品名",
  quantity: "数量",
  amount: "金額",
  taxCategory: "税区分",
  currency: "通貨",
  ignore: "対象外",
};

export const roleLabel = (role: ColumnRole) => ROLE_LABELS[role];

/**
 * A starting guess for the first run only, shown as a suggestion a person
 * confirms or changes. It never becomes a recipe by itself.
 */
export function suggestRoles(
  headers: readonly string[],
): Record<string, ColumnRole> {
  const guess: Record<string, ColumnRole> = {};
  for (const h of headers) {
    const n = h.normalize("NFKC").toLowerCase();
    guess[h] = /注文|order|伝票|id$/.test(n)
      ? "orderId"
      : /日付|date|日時|受注日/.test(n)
        ? "date"
        : /商品|item|product|品名/.test(n)
          ? "productName"
          : /数量|個数|qty|quantity/.test(n)
            ? "quantity"
            : /金額|価格|amount|price|売上|小計/.test(n)
              ? "amount"
              : /税|tax/.test(n)
                ? "taxCategory"
                : /通貨|currency/.test(n)
                  ? "currency"
                  : "ignore";
  }
  return guess;
}
