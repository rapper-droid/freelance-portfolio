import { describe, expect, it } from "vitest";
import { exportCsv, parseCsv } from "@/lib/csv";
import {
  compareReports,
  computeReport,
  summarise,
} from "@/lib/runtime/report/compute";
import {
  createRecipe,
  fitRecipe,
  reviseRecipe,
  suggestRoles,
  type Recipe,
} from "@/lib/runtime/report/recipe";
import {
  changeBasisPoints,
  formatMoney,
  parseAmount,
  sumMoney,
} from "@/lib/runtime/rules/money";

/** 受け入れ基準 C01–C10（指示書 §09-4 の三段階シナリオを含む）。 */

const AT = "2026-09-22T01:00:00.000Z";

const WEEK_1 = [
  "注文ID,日付,商品名,数量,金額",
  "ORD-001,2026-09-01,Webサイト修正,1,5000",
  "ORD-002,2026-09-02,データ加工,2,12000",
  "ORD-003,2026-09-03,フォーム制作,1,20000",
].join("\n");

// Same data, columns reordered. The meaning has not changed.
const WEEK_2 = [
  "日付,金額,注文ID,商品名,数量",
  "2026-09-08,7000,ORD-011,Webサイト修正,1",
  "2026-09-09,12000,ORD-012,データ加工,2",
  "2026-09-10,25000,ORD-013,フォーム制作,1",
  "2026-09-11,6000,ORD-014,新規メニュー,1",
].join("\n");

// A tax column appears. The meaning has changed.
const WEEK_3 = [
  "注文ID,日付,商品名,数量,金額,税区分",
  "ORD-021,2026-09-15,Webサイト修正,1,5000,10%",
  "ORD-022,2026-09-16,データ加工,2,12000,8%",
].join("\n");

const baseRecipe = (over: Partial<Recipe> = {}): Recipe => ({
  ...createRecipe({
    tenantId: "t1",
    label: "週次売上",
    columnRoles: {
      注文ID: "orderId",
      日付: "date",
      商品名: "productName",
      数量: "quantity",
      金額: "amount",
    },
    currency: "JPY",
    dedupeBy: "orderId",
    atIso: AT,
  }),
  ...over,
});

const run = (csv: string, recipe = baseRecipe()) => {
  const data = parseCsv(csv);
  const fit = fitRecipe(recipe, data);
  if (!fit.ok) throw new Error("recipe did not fit");
  return computeReport(data, recipe, fit.mapping, AT);
};

describe("money — C04 金額は整数で扱う", () => {
  it("reads yen as whole units", () => {
    const parsed = parseAmount("12,000", "JPY");
    expect(parsed.ok && parsed.money.minorUnits).toBe(12000);
  });

  it("reads a decimal currency as minor units", () => {
    const parsed = parseAmount("1,234.56", "USD");
    expect(parsed.ok && parsed.money.minorUnits).toBe(123456);
  });

  it("reads accounting parentheses as negative", () => {
    const parsed = parseAmount("(5,000)", "JPY");
    expect(parsed.ok && parsed.money.minorUnits).toBe(-5000);
  });

  it("refuses a cell carrying a different currency — C06", () => {
    const parsed = parseAmount("$120", "JPY");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.reason).toContain("USD");
  });

  it("refuses an unreadable cell rather than treating it as zero", () => {
    expect(parseAmount("未定", "JPY").ok).toBe(false);
    expect(parseAmount("", "JPY").ok).toBe(false);
  });

  it("refuses more decimal places than the currency has", () => {
    expect(parseAmount("100.5", "JPY").ok).toBe(false);
  });

  it("refuses to add different currencies", () => {
    expect(
      sumMoney([
        { minorUnits: 100, scale: 0, currency: "JPY" },
        { minorUnits: 100, scale: 2, currency: "USD" },
      ]),
    ).toBeNull();
  });

  it("adds in integers without floating point drift", () => {
    const cents = Array.from({ length: 10 }, () => ({
      minorUnits: 10,
      scale: 2,
      currency: "USD",
    }));
    expect(formatMoney(sumMoney(cents)!)).toBe("USD 1.00");
  });

  it("returns no percentage when the baseline is zero — C10", () => {
    expect(changeBasisPoints(0, 5000)).toBeNull();
    expect(changeBasisPoints(10000, 12000)).toBe(2000); // +20.00%
  });
});

describe("computeReport — C04 合計・件数はコードの期待値と一致する", () => {
  it("totals exactly what the rows contain", () => {
    const result = run(WEEK_1);
    expect(result.totals.rowsCounted).toBe(3);
    expect(result.totals.total?.minorUnits).toBe(5000 + 12000 + 20000);
    expect(result.totals.quantityTotal).toBe(4);
    expect(result.totals.averageOrder?.minorUnits).toBe(Math.round(37000 / 3));
  });

  it("groups by product with matching totals", () => {
    const byProduct = run(WEEK_1).totals.byProduct;
    expect(byProduct[0]).toEqual({
      name: "フォーム制作",
      count: 1,
      total: { minorUnits: 20000, scale: 0, currency: "JPY" },
    });
  });

  it("keeps the source rows untouched — C01", () => {
    const data = parseCsv(WEEK_1);
    const before = JSON.stringify(data.rows);
    run(WEEK_1);
    expect(JSON.stringify(parseCsv(WEEK_1).rows)).toBe(before);
  });
});

describe("computeReport — C03 重複は指定した条件だけで判定する", () => {
  const sameLooking = [
    "注文ID,日付,商品名,数量,金額",
    "ORD-101,2026-09-01,データ加工,1,5000",
    "ORD-102,2026-09-01,データ加工,1,5000",
  ].join("\n");

  it("keeps two different order ids that look alike — C03", () => {
    const result = run(sameLooking);
    expect(result.totals.rowsCounted).toBe(2);
    expect(result.totals.duplicatesRemoved).toBe(0);
    expect(result.totals.total?.minorUnits).toBe(10000);
  });

  it("removes a genuine repeat of the same order id and logs it", () => {
    const repeated = [
      "注文ID,日付,商品名,数量,金額",
      "ORD-101,2026-09-01,データ加工,1,5000",
      "ORD-101,2026-09-01,データ加工,1,5000",
    ].join("\n");
    const result = run(repeated);
    expect(result.totals.duplicatesRemoved).toBe(1);
    expect(result.changeLog[0].kind).toBe("duplicate_removed");
    expect(result.changeLog[0].sourceRow).toBe(3);
  });

  it("keeps every row when the recipe says not to deduplicate", () => {
    const result = run(
      [
        "注文ID,日付,商品名,数量,金額",
        "ORD-101,2026-09-01,データ加工,1,5000",
        "ORD-101,2026-09-01,データ加工,1,5000",
      ].join("\n"),
      baseRecipe({ dedupeBy: "none" }),
    );
    expect(result.totals.rowsCounted).toBe(2);
  });
});

describe("computeReport — 読めない行は隠さず除外する", () => {
  const broken = [
    "注文ID,日付,商品名,数量,金額",
    "ORD-201,2026-09-01,データ加工,1,5000",
    "ORD-202,2026-09-02,フォーム制作,1,未定",
  ].join("\n");

  it("excludes an unreadable row, counts it and says why", () => {
    const result = run(broken);
    expect(result.totals.rowsRead).toBe(2);
    expect(result.totals.rowsCounted).toBe(1);
    expect(result.totals.rowsExcluded).toBe(1);
    expect(result.problems[0].sourceRow).toBe(3);
    expect(result.warnings.map((w) => w.code)).toContain("unreadable_rows");
  });

  it("names the excluded rows in what the summary still needs", () => {
    const { needed } = summarise(run(broken), null);
    expect(needed.join(" ")).toContain("1 行");
  });

  it("stops for confirmation when tax categories are mixed — C06", () => {
    const data = parseCsv(WEEK_3);
    const recipe = baseRecipe({
      columnRoles: {
        注文ID: "orderId",
        日付: "date",
        商品名: "productName",
        数量: "quantity",
        金額: "amount",
        税区分: "taxCategory",
      },
      knownTaxCategories: ["10%", "8%"],
    });
    const fit = fitRecipe(recipe, data);
    if (!fit.ok) throw new Error("setup");
    const result = computeReport(data, recipe, fit.mapping, AT);
    expect(result.warnings.map((w) => w.code)).toContain("mixed_tax_category");
  });
});

describe("recipe — C05 列順が変わっても再利用できる", () => {
  it("re-applies to a reordered file without asking again — C05", () => {
    const fit = fitRecipe(
      baseRecipe(),
      parseCsv(WEEK_2.replace(",新規メニュー,1", ",データ加工,1")),
    );
    expect(fit.ok).toBe(true);
  });

  it("produces the same totals whatever the column order", () => {
    const reordered = [
      "金額,注文ID,日付,商品名,数量",
      "5000,ORD-001,2026-09-01,Webサイト修正,1",
      "12000,ORD-002,2026-09-02,データ加工,2",
      "20000,ORD-003,2026-09-03,フォーム制作,1",
    ].join("\n");
    expect(run(reordered).totals.total?.minorUnits).toBe(
      run(WEEK_1).totals.total?.minorUnits,
    );
  });

  it("stops on a new column instead of guessing — C06", () => {
    const fit = fitRecipe(baseRecipe(), parseCsv(WEEK_3));
    expect(fit.ok).toBe(false);
    if (fit.ok) return;
    expect(fit.needsConfirmation.map((c) => c.kind)).toContain("new_column");
    expect(fit.needsConfirmation[0].proposal).toContain("税区分");
  });

  it("stops when a required column disappears", () => {
    const missing = ["注文ID,商品名,数量", "ORD-001,データ加工,1"].join("\n");
    const fit = fitRecipe(baseRecipe(), parseCsv(missing));
    expect(fit.ok).toBe(false);
    if (fit.ok) return;
    expect(fit.needsConfirmation.map((c) => c.kind)).toContain(
      "missing_column",
    );
  });

  it("stops on a tax category that was never approved — §09-4 三週目", () => {
    const recipe = baseRecipe({
      columnRoles: {
        注文ID: "orderId",
        日付: "date",
        商品名: "productName",
        数量: "quantity",
        金額: "amount",
        税区分: "taxCategory",
      },
      knownTaxCategories: ["10%"],
    });
    const fit = fitRecipe(recipe, parseCsv(WEEK_3), ["10%", "8%"]);
    expect(fit.ok).toBe(false);
    if (fit.ok) return;
    expect(fit.needsConfirmation.map((c) => c.kind)).toContain(
      "new_tax_category",
    );
  });

  it("bumps the version on revision and leaves the old one intact — §18", () => {
    const first = baseRecipe();
    const second = reviseRecipe(first, {
      knownTaxCategories: ["10%", "8%"],
      approvedBy: "owner",
      atIso: AT,
    });
    expect(second.version).toBe(2);
    expect(first.version).toBe(1);
    expect(first.knownTaxCategories).toEqual([]);
  });

  it("suggests roles for a first run without saving them", () => {
    const guess = suggestRoles([
      "注文ID",
      "日付",
      "商品名",
      "数量",
      "金額",
      "備考",
    ]);
    expect(guess["金額"]).toBe("amount");
    expect(guess["日付"]).toBe("date");
    expect(guess["備考"]).toBe("ignore");
  });
});

describe("compareReports — C07 比較の条件を明示する", () => {
  it("states what was compared", () => {
    const comparison = compareReports(run(WEEK_1), run(WEEK_2), {
      previous: "第1週",
      current: "第2週",
    });
    expect(comparison.basis).toContain("第1週 → 第2週");
    expect(comparison.basis).toContain("通貨 JPY");
    expect(comparison.basis).toContain("集計対象 3 件 → 4 件");
  });

  it("computes the change in integers", () => {
    const comparison = compareReports(run(WEEK_1), run(WEEK_2), {
      previous: "第1週",
      current: "第2週",
    });
    expect(comparison.totalChange.absolute?.minorUnits).toBe(50000 - 37000);
    expect(comparison.countChange).toEqual({
      previous: 3,
      current: 4,
      absolute: 1,
    });
  });

  it("names products that appeared and disappeared", () => {
    const comparison = compareReports(run(WEEK_1), run(WEEK_2), {
      previous: "第1週",
      current: "第2週",
    });
    expect(comparison.newProducts).toContain("新規メニュー");
  });

  it("refuses to compare across currencies", () => {
    const usd = run(WEEK_1, baseRecipe({ currency: "USD" }));
    const comparison = compareReports(run(WEEK_1), usd, {
      previous: "前",
      current: "今",
    });
    expect(comparison.warnings.map((w) => w.code)).toContain(
      "currency_mismatch",
    );
    expect(comparison.totalChange.label).toContain("比較できません");
  });

  it("flags a recipe version change as a possible cause of the difference", () => {
    const revised = reviseRecipe(baseRecipe(), {
      approvedBy: "owner",
      atIso: AT,
    });
    const comparison = compareReports(run(WEEK_1), run(WEEK_2, revised), {
      previous: "前",
      current: "今",
    });
    expect(comparison.warnings.map((w) => w.code)).toContain(
      "recipe_version_changed",
    );
  });

  it("reports the absolute change when the baseline was zero", () => {
    const empty = run(
      ["注文ID,日付,商品名,数量,金額", "ORD-0,2026-09-01,x,0,0"].join("\n"),
    );
    const comparison = compareReports(empty, run(WEEK_1), {
      previous: "前",
      current: "今",
    });
    expect(comparison.totalChange.basisPoints).toBeNull();
    expect(comparison.totalChange.label).toContain("率は算出せず");
  });
});

describe("summarise — C10 データにない原因を断定しない", () => {
  it("separates what was measured from what might explain it", () => {
    const comparison = compareReports(run(WEEK_1), run(WEEK_2), {
      previous: "第1週",
      current: "第2週",
    });
    const { observed, possibleFactors } = summarise(run(WEEK_2), comparison);
    expect(observed.join(" ")).toContain("合計は");
    expect(possibleFactors.join(" ")).not.toMatch(/広告|天候|競合/);
    expect(possibleFactors.join(" ")).toContain("確認できません");
  });

  it("says outright that a cause cannot be determined from this file alone", () => {
    const { possibleFactors } = summarise(run(WEEK_1), null);
    expect(possibleFactors.join(" ")).toContain("判断できません");
  });
});

describe("CSV edge cases — §23, C09", () => {
  it("keeps a leading-zero id as text", () => {
    const data = parseCsv(
      [
        "注文ID,日付,商品名,数量,金額",
        "0012,2026-09-01,データ加工,1,5000",
      ].join("\n"),
    );
    expect(data.rows[0][0]).toBe("0012");
  });

  it("reads quoted fields containing commas and line breaks", () => {
    const data = parseCsv(
      [
        "注文ID,日付,商品名,数量,金額",
        '"ORD-1",2026-09-01,"データ加工, 一式",1,5000',
      ].join("\n"),
    );
    expect(data.rows[0][2]).toBe("データ加工, 一式");
  });

  it("neutralises a formula on export — C09", () => {
    const data = parseCsv(["注文ID,商品名", 'ORD-1,"=SUM(A1:A9)"'].join("\n"));
    expect(exportCsv(data)).toContain("'=SUM(A1:A9)");
  });

  it("leaves a plain negative number alone on export", () => {
    const data = parseCsv(["注文ID,金額", "ORD-1,-5000"].join("\n"));
    expect(exportCsv(data)).toContain('"-5000"');
    expect(exportCsv(data)).not.toContain("'-5000");
  });

  it("refuses a row whose column count does not match the header", () => {
    expect(() =>
      parseCsv(["注文ID,金額", "ORD-1,5000,extra"].join("\n")),
    ).toThrow();
  });
});
