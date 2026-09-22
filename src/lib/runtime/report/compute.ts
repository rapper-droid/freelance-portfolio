import type { CsvData } from "@/lib/csv";
import type { Warning } from "../types";
import {
  changeBasisPoints,
  formatBasisPoints,
  formatMoney,
  parseAmount,
  scaleFor,
  type Money,
} from "../rules/money";
import type { ColumnRole, Recipe } from "./recipe";

/**
 * The arithmetic (指示書 §09-2).
 *
 * Nothing in this file is probabilistic. Totals, counts, ratios and
 * period-over-period changes are computed here from integers, and the summary
 * text downstream is only allowed to describe numbers this module produced.
 * A model is never asked to add up a column.
 *
 * Rows that cannot be read are counted and returned as problem rows rather
 * than skipped quietly — a total over 98 of 125 rows that presents itself as a
 * total over 125 is the kind of wrong that survives review.
 */

export type ReportRow = {
  /** 1-based index in the source file, so a problem can be found again. */
  sourceRow: number;
  orderId: string;
  date: string;
  productName: string;
  quantity: number | null;
  amount: Money | null;
  taxCategory: string;
  issues: string[];
};

export type ProblemRow = { sourceRow: number; reason: string; raw: string[] };

export type ChangeLogEntry = {
  kind: "duplicate_removed" | "row_unreadable" | "value_normalised";
  sourceRow: number;
  detail: string;
};

export type ReportTotals = {
  rowsRead: number;
  rowsCounted: number;
  rowsExcluded: number;
  duplicatesRemoved: number;
  total: Money | null;
  quantityTotal: number | null;
  averageOrder: Money | null;
  byProduct: Array<{ name: string; count: number; total: Money }>;
};

export type ReportResult = {
  rows: ReportRow[];
  problems: ProblemRow[];
  changeLog: ChangeLogEntry[];
  totals: ReportTotals;
  warnings: Warning[];
  /** Everything needed to explain the numbers later. */
  provenance: {
    recipeId: string;
    recipeVersion: number;
    currency: string;
    dedupeBy: Recipe["dedupeBy"];
    computedAt: string;
  };
};

export function computeReport(
  data: CsvData,
  recipe: Recipe,
  mapping: Record<ColumnRole, string | null>,
  atIso: string,
): ReportResult {
  const index = (role: ColumnRole) => {
    const column = mapping[role];
    return column === null ? -1 : data.headers.indexOf(column);
  };
  const cols = {
    orderId: index("orderId"),
    date: index("date"),
    productName: index("productName"),
    quantity: index("quantity"),
    amount: index("amount"),
    taxCategory: index("taxCategory"),
  };

  const warnings: Warning[] = [];
  const problems: ProblemRow[] = [];
  const changeLog: ChangeLogEntry[] = [];
  const rows: ReportRow[] = [];
  const seen = new Map<string, number>();
  let duplicatesRemoved = 0;

  data.rows.forEach((raw, i) => {
    const sourceRow = i + 2; // header is row 1
    const cell = (c: number) => (c >= 0 ? (raw[c] ?? "").trim() : "");
    const issues: string[] = [];

    const orderId = cell(cols.orderId);
    const date = cell(cols.date);
    const productName = cell(cols.productName);
    const taxCategory = cell(cols.taxCategory);

    let quantity: number | null = null;
    if (cols.quantity >= 0) {
      const text = cell(cols.quantity).normalize("NFKC").replace(/,/g, "");
      if (/^\d+$/.test(text)) quantity = Number(text);
      else
        issues.push(`数量「${cell(cols.quantity)}」を整数として読めません。`);
    }

    let amount: Money | null = null;
    const parsed = parseAmount(cell(cols.amount), recipe.currency);
    if (parsed.ok) amount = parsed.money;
    else issues.push(`金額「${parsed.raw}」: ${parsed.reason}`);

    // Deduplication uses only the key the recipe declares. Two rows with the
    // same customer and the same amount on the same day are two sales until
    // an identifier says otherwise (指示書 C03).
    if (recipe.dedupeBy !== "none") {
      const key = recipe.dedupeBy === "orderId" ? orderId : JSON.stringify(raw);
      if (key && seen.has(key)) {
        duplicatesRemoved++;
        changeLog.push({
          kind: "duplicate_removed",
          sourceRow,
          detail:
            recipe.dedupeBy === "orderId"
              ? `注文ID「${orderId}」が ${seen.get(key)} 行目と重複するため除外しました。`
              : `${seen.get(key)} 行目と全項目が一致するため除外しました。`,
        });
        return;
      }
      if (key) seen.set(key, sourceRow);
    }

    if (issues.length) {
      problems.push({ sourceRow, reason: issues.join(" / "), raw });
      changeLog.push({
        kind: "row_unreadable",
        sourceRow,
        detail: issues.join(" / ") + " 集計から除外しました。",
      });
    }

    rows.push({
      sourceRow,
      orderId,
      date,
      productName,
      quantity,
      amount,
      taxCategory,
      issues,
    });
  });

  const counted = rows.filter((r) => !r.issues.length && r.amount);
  const currency = recipe.currency;
  const scale = scaleFor(currency);
  const totalMinor = counted.reduce((sum, r) => sum + r.amount!.minorUnits, 0);
  const total: Money | null = counted.length
    ? { minorUnits: totalMinor, scale, currency }
    : null;

  const quantityValues = counted
    .map((r) => r.quantity)
    .filter((q): q is number => q !== null);
  const quantityTotal =
    cols.quantity >= 0 && quantityValues.length === counted.length
      ? quantityValues.reduce((a, b) => a + b, 0)
      : null;

  const byProductMap = new Map<string, { count: number; minorUnits: number }>();
  for (const r of counted) {
    const key = r.productName || "(未記入)";
    const entry = byProductMap.get(key) ?? { count: 0, minorUnits: 0 };
    entry.count++;
    entry.minorUnits += r.amount!.minorUnits;
    byProductMap.set(key, entry);
  }

  if (problems.length)
    warnings.push({
      code: "unreadable_rows",
      message: `${problems.length} 行を読み取れなかったため集計から除外しました。内訳は問題行一覧を確認してください。`,
      severity: "blocking",
    });

  const taxCategories = new Set(
    rows.map((r) => r.taxCategory).filter((t): t is string => !!t),
  );
  if (taxCategories.size > 1)
    warnings.push({
      code: "mixed_tax_category",
      message: `税区分が ${taxCategories.size} 種類含まれています（${[...taxCategories].join("、")}）。合算の可否を確認してください。`,
      severity: "blocking",
    });

  return {
    rows,
    problems,
    changeLog,
    warnings,
    totals: {
      rowsRead: data.rows.length,
      rowsCounted: counted.length,
      rowsExcluded: data.rows.length - counted.length,
      duplicatesRemoved,
      total,
      quantityTotal,
      averageOrder: counted.length
        ? {
            minorUnits: Math.round(totalMinor / counted.length),
            scale,
            currency,
          }
        : null,
      byProduct: [...byProductMap.entries()]
        .map(([name, v]) => ({
          name,
          count: v.count,
          total: { minorUnits: v.minorUnits, scale, currency } as Money,
        }))
        .sort((a, b) => b.total.minorUnits - a.total.minorUnits),
    },
    provenance: {
      recipeId: recipe.recipeId,
      recipeVersion: recipe.version,
      currency,
      dedupeBy: recipe.dedupeBy,
      computedAt: atIso,
    },
  };
}

export type PeriodComparison = {
  /** Stated explicitly so a reader never has to infer what was compared. */
  basis: string;
  totalChange: {
    previous: Money | null;
    current: Money | null;
    absolute: Money | null;
    basisPoints: number | null;
    label: string;
  };
  countChange: { previous: number; current: number; absolute: number };
  newProducts: string[];
  droppedProducts: string[];
  warnings: Warning[];
};

/**
 * Compares two runs (指示書 C07).
 *
 * Refuses to compare across currencies, and says so when a previous total of
 * zero makes a percentage meaningless instead of printing an invented one.
 */
export function compareReports(
  previous: ReportResult,
  current: ReportResult,
  labels: { previous: string; current: string },
): PeriodComparison {
  const warnings: Warning[] = [];
  const basis =
    `${labels.previous} → ${labels.current}｜通貨 ${current.provenance.currency}` +
    `｜レシピ v${previous.provenance.recipeVersion} → v${current.provenance.recipeVersion}` +
    `｜集計対象 ${previous.totals.rowsCounted} 件 → ${current.totals.rowsCounted} 件`;

  if (previous.provenance.currency !== current.provenance.currency) {
    warnings.push({
      code: "currency_mismatch",
      message: `通貨が異なるため比較できません（${previous.provenance.currency} と ${current.provenance.currency}）。`,
      severity: "blocking",
    });
    return {
      basis,
      totalChange: {
        previous: previous.totals.total,
        current: current.totals.total,
        absolute: null,
        basisPoints: null,
        label: "比較できません",
      },
      countChange: {
        previous: previous.totals.rowsCounted,
        current: current.totals.rowsCounted,
        absolute: current.totals.rowsCounted - previous.totals.rowsCounted,
      },
      newProducts: [],
      droppedProducts: [],
      warnings,
    };
  }

  if (previous.provenance.recipeVersion !== current.provenance.recipeVersion)
    warnings.push({
      code: "recipe_version_changed",
      message: `レシピの版が ${previous.provenance.recipeVersion} から ${current.provenance.recipeVersion} に変わっています。差分の一部は処理方法の変更による可能性があります。`,
      severity: "blocking",
    });

  const prevMinor = previous.totals.total?.minorUnits ?? 0;
  const currMinor = current.totals.total?.minorUnits ?? 0;
  const bp = changeBasisPoints(prevMinor, currMinor);
  const absolute: Money = {
    minorUnits: currMinor - prevMinor,
    scale: current.provenance.currency === "JPY" ? 0 : 2,
    currency: current.provenance.currency,
  };

  if (bp === null)
    warnings.push({
      code: "zero_baseline",
      message:
        "前期の合計が0のため、増減率は算出しません。実数の差のみを表示します。",
      severity: "advisory",
    });

  const prevProducts = new Set(previous.totals.byProduct.map((p) => p.name));
  const currProducts = new Set(current.totals.byProduct.map((p) => p.name));

  return {
    basis,
    totalChange: {
      previous: previous.totals.total,
      current: current.totals.total,
      absolute,
      basisPoints: bp,
      label:
        bp === null
          ? `${formatMoney(absolute)}（前期0のため率は算出せず）`
          : `${formatMoney(absolute)}（${formatBasisPoints(bp)}）`,
    },
    countChange: {
      previous: previous.totals.rowsCounted,
      current: current.totals.rowsCounted,
      absolute: current.totals.rowsCounted - previous.totals.rowsCounted,
    },
    newProducts: [...currProducts].filter((p) => !prevProducts.has(p)),
    droppedProducts: [...prevProducts].filter((p) => !currProducts.has(p)),
    warnings,
  };
}

/**
 * The written summary, assembled from computed values only.
 *
 * It separates what was measured from what might explain it, and never names
 * a cause. A sales CSV cannot see an ad campaign, a competitor or the weather,
 * so this text does not pretend to (指示書 §09-3 / C10).
 */
export function summarise(
  current: ReportResult,
  comparison: PeriodComparison | null,
): { observed: string[]; possibleFactors: string[]; needed: string[] } {
  const observed: string[] = [];
  const possibleFactors: string[] = [];
  const needed: string[] = [];

  if (current.totals.total)
    observed.push(
      `集計対象 ${current.totals.rowsCounted} 件の合計は ${formatMoney(current.totals.total)} です。`,
    );
  if (current.totals.averageOrder)
    observed.push(
      `1件あたりの平均は ${formatMoney(current.totals.averageOrder)} です。`,
    );
  if (current.totals.duplicatesRemoved)
    observed.push(
      `重複条件（${current.provenance.dedupeBy}）により ${current.totals.duplicatesRemoved} 行を除外しました。`,
    );
  if (comparison) {
    observed.push(
      `前回比: ${comparison.totalChange.label}（${comparison.basis}）。`,
    );
    if (comparison.newProducts.length)
      possibleFactors.push(
        `前回になかった商品が ${comparison.newProducts.length} 件あります（${comparison.newProducts.slice(0, 3).join("、")}）。増減との関係はこのデータだけでは確認できません。`,
      );
    if (comparison.droppedProducts.length)
      possibleFactors.push(
        `前回あった商品のうち ${comparison.droppedProducts.length} 件が今回ありません（${comparison.droppedProducts.slice(0, 3).join("、")}）。`,
      );
  }

  if (current.problems.length)
    needed.push(
      `読み取れなかった ${current.problems.length} 行の正しい値。除外したまま合計しています。`,
    );
  for (const w of current.warnings)
    if (w.severity === "blocking") needed.push(w.message);
  if (!possibleFactors.length)
    possibleFactors.push(
      "このファイルの中だけでは、増減の理由は判断できません。要因の特定には別のデータが必要です。",
    );

  return { observed, possibleFactors, needed };
}
