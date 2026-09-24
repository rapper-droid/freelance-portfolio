import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseCsv } from "../../src/lib/csv";
import {
  createRecipe,
  fitRecipe,
  reviseRecipe,
  suggestRoles,
  type ColumnRole,
} from "../../src/lib/runtime/report/recipe";
import {
  compareReports,
  computeReport,
  summarise,
} from "../../src/lib/runtime/report/compute";
import { sampleWeeks, largeSample } from "../../src/lib/report/samples";
import { applyFixes, upsertFix, cellsOf } from "../../src/lib/report/fixes";
import {
  REPORT_STORAGE_KEY,
  REPORT_SCHEMA_VERSION,
  emptyReportState,
  exportReportState,
  importReportState,
  loadReportState,
  migrateReport,
  saveReportState,
} from "../../src/lib/report/store";
import { readBackup } from "../../src/lib/runtime/sandbox";
import type { RowFix } from "../../src/lib/report/types";

const NOW = "2026-09-24T02:00:00.000Z";
const TENANT = "demo";

const week = (id: string) => sampleWeeks.find((w) => w.id === id)!;

/** Week one, done properly: a person confirms a mapping and it is saved. */
function firstWeek() {
  const data = parseCsv(week("week1").csv);
  const roles = suggestRoles(data.headers);
  const recipe = createRecipe({
    tenantId: TENANT,
    label: "週次売上",
    columnRoles: roles,
    currency: "JPY",
    dedupeBy: "orderId",
    knownTaxCategories: ["10%"],
    atIso: NOW,
  });
  const fit = fitRecipe(recipe, data, ["10%"]);
  if (!fit.ok) throw new Error("week 1 should fit its own recipe");
  return {
    data,
    recipe,
    result: computeReport(data, recipe, fit.mapping, NOW),
  };
}

describe("列の役割は、名前から素直に決まる", () => {
  it("1週目の6列すべてに役割がつき、無視は残らない", () => {
    const data = parseCsv(week("week1").csv);
    const roles = suggestRoles(data.headers);
    expect(roles).toEqual({
      注文ID: "orderId",
      日付: "date",
      商品: "productName",
      数量: "quantity",
      金額: "amount",
      税区分: "taxCategory",
    });
  });
});

describe("1週目：壊してはいけない値を壊さない（指示書 §15）", () => {
  const { result } = firstWeek();

  it("先頭ゼロのIDを数値にしない", () => {
    const ids = result.rows.map((r) => r.orderId);
    expect(ids).toContain("0012");
    expect(ids).not.toContain("12");
  });

  it("返金のマイナスを直さず、そのまま集計する", () => {
    const refund = result.rows.find((r) => r.orderId === "0015");
    // 円は小数を持たないので、最小単位はそのまま円。
    expect(refund?.amount).toEqual({
      minorUnits: -5000,
      scale: 0,
      currency: "JPY",
    });
  });

  it("0円の行を読み飛ばさない", () => {
    const zero = result.rows.find((r) => r.orderId === "0016");
    expect(zero?.amount?.minorUnits).toBe(0);
  });

  it("円の小数は、勝手に丸めずに理由を言って止める", () => {
    // 12345.50 円という値は存在しない。切り上げるか切り捨てるかは人が決める
    // ことで、ツールが黙って選んでよいことではない。
    const decimal = result.problems.find((p) => p.raw.includes("12345.50"));
    expect(decimal?.reason).toContain("小数点以下 0 桁");
  });

  it("引用符の中のカンマで列がずれない", () => {
    const quoted = result.rows.find((r) => r.orderId === "0014");
    expect(quoted?.productName).toBe("レポート作成, 月次");
  });

  it("セル内改行を含む商品名を保持する", () => {
    const multiline = result.rows.find((r) => r.orderId === "0018");
    expect(multiline?.productName).toContain("フォーム制作");
    expect(multiline?.productName).toContain("問い合わせ用");
  });

  it("読み取れない3行を、黙って捨てずに報告する", () => {
    // 円で表せない小数、空欄の金額、数字でない金額。
    expect(result.problems).toHaveLength(3);
    expect(
      result.problems.map((p) => p.sourceRow).sort((a, b) => a - b),
    ).toEqual([7, 9, 10]);
    for (const problem of result.problems)
      expect(problem.reason.length).toBeGreaterThan(3);
  });

  it("重複を条件どおりに1件だけ除外し、記録に残す", () => {
    expect(result.totals.duplicatesRemoved).toBe(1);
    expect(
      result.changeLog.filter((c) => c.kind === "duplicate_removed"),
    ).toHaveLength(1);
  });

  it("合計は、集計できた行だけの合計であることを数で示す", () => {
    expect(result.totals.rowsRead).toBe(12);
    expect(result.totals.rowsCounted).toBe(8);
    expect(result.totals.rowsCounted + result.totals.rowsExcluded).toBe(12);
  });
});

describe("2週目：列の順番が違うだけなら、何も聞かない（指示書 §15 必須フロー）", () => {
  it("保存したルールがそのまま当たる", () => {
    const { recipe } = firstWeek();
    const data = parseCsv(week("week2").csv);

    // 列の順番は確かに違う。
    expect(data.headers).not.toEqual(parseCsv(week("week1").csv).headers);
    expect([...data.headers].sort()).toEqual(
      [...parseCsv(week("week1").csv).headers].sort(),
    );

    const fit = fitRecipe(recipe, data, ["10%"]);
    expect(fit.ok).toBe(true);
    if (!fit.ok) return;
    expect(fit.warnings).toEqual([]);
    expect(fit.mapping.amount).toBe("金額");

    const result = computeReport(data, recipe, fit.mapping, NOW);
    // 10 行のうち 1 行は円で表せない小数なので、確認待ちに回る。
    expect(result.totals.rowsCounted).toBe(9);
    expect(result.problems).toHaveLength(1);
    expect(result.provenance.recipeVersion).toBe(1);
  });
});

describe("3週目：新しいものだけを確認する（指示書 §15 必須フロー）", () => {
  const { recipe } = firstWeek();
  const data = parseCsv(week("week3").csv);
  const taxes = [...new Set(data.rows.map((r) => r[5]))];
  const fit = fitRecipe(recipe, data, taxes);

  it("止まる", () => {
    expect(fit.ok).toBe(false);
  });

  it("止まる理由は、知らない列と承認していない税区分の2点だけ", () => {
    if (fit.ok) throw new Error("expected confirmation");
    expect(fit.needsConfirmation.map((c) => c.kind).sort()).toEqual([
      "new_column",
      "new_tax_category",
    ]);
    expect(
      fit.needsConfirmation.find((c) => c.kind === "new_column")?.detail,
    ).toContain("販売チャネル");
    expect(
      fit.needsConfirmation.find((c) => c.kind === "new_tax_category")?.detail,
    ).toContain("軽減8%");
  });

  it("人が決めたら版が上がり、次から止まらない", () => {
    if (fit.ok) throw new Error("expected confirmation");
    const revised = reviseRecipe(recipe, {
      columnRoles: {
        ...recipe.columnRoles,
        販売チャネル: "ignore" as ColumnRole,
      },
      knownTaxCategories: [...recipe.knownTaxCategories, "軽減8%"],
      approvedBy: "所長",
      atIso: NOW,
    });
    expect(revised.version).toBe(2);
    // 前の版は書き換えられていない（過去の集計が説明できなくなるため）。
    expect(recipe.version).toBe(1);

    const again = fitRecipe(revised, data, taxes);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    const result = computeReport(data, revised, again.mapping, NOW);
    expect(result.totals.rowsCounted).toBe(7);
    expect(result.provenance.recipeVersion).toBe(2);
  });
});

describe("読み取れない行を、その場で直せる", () => {
  it("直した行が集計に入り、変更は理由つきで記録される", () => {
    const { data, recipe, result } = firstWeek();
    const blank = result.problems.find((p) => p.sourceRow === 9)!;
    const cells = cellsOf(blank, data.headers);
    expect(cells["金額"]).toBe("");

    const fix: RowFix = {
      sourceRow: 9,
      cells: { 金額: "15000" },
      note: "請求書から確認",
      atIso: NOW,
    };
    const applied = applyFixes(data, upsertFix([], fix));
    expect(applied.applied).toHaveLength(1);
    expect(applied.changeLog[0].detail).toContain("15000");
    expect(applied.changeLog[0].detail).toContain("請求書から確認");

    // 元データは変わっていない。
    expect(data.rows[7][4]).toBe("");

    const fit = fitRecipe(recipe, applied.data, ["10%"]);
    if (!fit.ok) throw new Error("fit");
    const after = computeReport(applied.data, recipe, fit.mapping, NOW);
    expect(after.problems).toHaveLength(2);
    expect(after.totals.rowsCounted).toBe(result.totals.rowsCounted + 1);
  });

  it("別のファイルに持ち越した修正は、当たらないと分かる形で残る", () => {
    const other = parseCsv(week("week3").csv);
    const applied = applyFixes(other, [
      { sourceRow: 999, cells: { 金額: "1" }, note: "", atIso: NOW },
    ]);
    expect(applied.applied).toHaveLength(0);
    expect(applied.orphaned).toHaveLength(1);
  });

  it("同じ行を直し直しても、修正は1件のまま", () => {
    const first: RowFix = {
      sourceRow: 9,
      cells: { 金額: "1" },
      note: "",
      atIso: NOW,
    };
    const second: RowFix = {
      sourceRow: 9,
      cells: { 金額: "2" },
      note: "",
      atIso: NOW,
    };
    const fixes = upsertFix(upsertFix([], first), second);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].cells["金額"]).toBe("2");
  });
});

describe("前回比は、比べたものを書いてから比べる", () => {
  it("1週目と2週目を、根拠つきで比較する", () => {
    const { recipe, result: first } = firstWeek();
    const data = parseCsv(week("week2").csv);
    const fit = fitRecipe(recipe, data, ["10%"]);
    if (!fit.ok) throw new Error("fit");
    const second = computeReport(data, recipe, fit.mapping, NOW);

    const comparison = compareReports(first, second, {
      previous: "1週目",
      current: "2週目",
    });
    expect(comparison.basis).toContain("1週目 → 2週目");
    expect(comparison.basis).toContain("JPY");
    expect(comparison.countChange.previous).toBe(8);
    expect(comparison.countChange.current).toBe(9);

    const summary = summarise(second, comparison);
    expect(summary.observed.join()).toContain("前回比");
    // 原因を断定しない。
    expect(summary.possibleFactors.join()).not.toMatch(/が原因|のせい/);
  });
});

describe("大きなファイルでも、数え方が変わらない", () => {
  it("5,000行を読み、件数と除外の合計が一致する", () => {
    const { recipe } = firstWeek();
    const data = parseCsv(largeSample(5000));
    expect(data.rows).toHaveLength(5000);
    const fit = fitRecipe(recipe, data, ["10%"]);
    if (!fit.ok) throw new Error("fit");
    const result = computeReport(data, recipe, fit.mapping, NOW);
    expect(result.totals.rowsRead).toBe(5000);
    expect(result.totals.rowsCounted + result.totals.rowsExcluded).toBe(5000);
    expect(result.totals.total).not.toBeNull();
  });

  it("上限を超えるファイルは、理由を言って断る", () => {
    expect(() => parseCsv(largeSample(10001))).toThrow(/10,000行/);
  });
});

describe("不正なCSVは、何が悪いかを言って断る", () => {
  const cases: Array<[string, string, RegExp]> = [
    ["閉じていない引用符", 'a,b\n"1,2', /引用符/],
    ["列数が合わない行", "a,b\n1,2,3", /列数/],
    ["重複した列名", "a,a\n1,2", /重複のない列名/],
    ["空の列名", "a,\n1,2", /重複のない列名/],
    ["見出しがない", "", /重複のない列名/],
  ];
  it.each(cases)("%s", (_name, csv, message) => {
    expect(() => parseCsv(csv)).toThrow(message);
  });
});

describe("保存されたルールと履歴", () => {
  function fakeStorage() {
    const map = new Map<string, string>();
    return {
      map,
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    };
  }
  let store: ReturnType<typeof fakeStorage>;
  beforeEach(() => {
    store = fakeStorage();
    vi.stubGlobal("localStorage", store);
  });

  it("壊れたデータは控えを取ってから、空で始める", () => {
    store.map.set(REPORT_STORAGE_KEY, "}}not json{{");
    const { state, note } = loadReportState(NOW);
    expect(note).toContain("控えとして残しています");
    expect(readBackup(REPORT_STORAGE_KEY)?.text).toBe("}}not json{{");
    expect(state.recipes).toEqual([]);
  });

  it("新しい版のデータを上書きしない", () => {
    const future = JSON.stringify({
      schemaVersion: REPORT_SCHEMA_VERSION + 1,
      recipes: [],
      runs: [],
    });
    store.map.set(REPORT_STORAGE_KEY, future);
    const { note } = loadReportState(NOW);
    expect(note).toContain("新しい版");
    expect(readBackup(REPORT_STORAGE_KEY)?.text).toBe(future);
  });

  it("履歴が1件壊れても、ルールは失われない", () => {
    const { recipe } = firstWeek();
    const { state, note } = migrateReport(
      {
        schemaVersion: REPORT_SCHEMA_VERSION,
        recipes: [recipe, { nonsense: true }],
        runs: [{ broken: true }],
      },
      NOW,
    );
    expect(state.recipes).toHaveLength(1);
    expect(state.runs).toHaveLength(0);
    expect(note).toContain("2 件を除いて");
  });

  it("保存できないときは、下書きを先に捨ててルールを守る", () => {
    const { recipe } = firstWeek();
    let calls = 0;
    vi.stubGlobal("localStorage", {
      ...store,
      setItem: (k: string, v: string) => {
        calls += 1;
        // 大きい方（下書きつき）だけ失敗させる。
        if (v.length > 2000) throw new Error("quota");
        store.map.set(k, v);
      },
    });
    const state = {
      ...emptyReportState(NOW, "abc"),
      recipes: [recipe],
      draft: {
        step: "review" as const,
        fileLabel: "big.csv",
        csvText: "x".repeat(5000),
        userSupplied: true,
        recipeId: recipe.recipeId,
        columnRoles: {},
        currency: "JPY",
        dedupeBy: "orderId" as const,
        fixes: [],
        pendingConfirmation: false,
        updatedAtIso: NOW,
      },
    };
    const saved = saveReportState(state);
    expect(saved).toEqual({ ok: false, droppedDraft: true });
    expect(calls).toBe(2);
  });

  it("書き出して読み戻せる。他の体験のファイルは受け取らない", () => {
    const { recipe } = firstWeek();
    const state = { ...emptyReportState(NOW, "abc"), recipes: [recipe] };
    const text = exportReportState(state);
    const back = importReportState(text, NOW);
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.state.recipes[0].recipeId).toBe(recipe.recipeId);

    const foreign = JSON.stringify({ schemaVersion: 1, orders: [], cart: {} });
    expect(importReportState(foreign, NOW).ok).toBe(false);
  });
});
