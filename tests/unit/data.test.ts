import { describe, it, expect } from "vitest";
import { parseCsv, cleanCsv, exportCsv, sampleCsv } from "../../src/lib/csv";
import { classify, replyDraft, tickets } from "../../src/lib/inbox";
import { isAdminData, initialAdmin } from "../../src/lib/admin";
describe("CSV processing", () => {
  it("processes the sample from 125 to 98 rows", () => {
    const data = parseCsv(sampleCsv);
    expect(data.rows).toHaveLength(125);
    const result = cleanCsv(data, true, true, false);
    expect(result.rows).toHaveLength(98);
    expect(result.duplicates).toBe(27);
    expect(result.rows[0][1]).toBe("サンプル顧客1");
  });
  it("parses BOM, commas, escaped quotes and multiline values", () => {
    expect(
      parseCsv('\uFEFF名前,備考\r\n"A,B","一行目\n""二行目"""\r\n').rows,
    ).toEqual([["A,B", '一行目\n"二行目"']]);
  });
  it("rejects invalid headers and row shapes", () => {
    for (const text of [
      "",
      ",A\n1,2",
      "A,A\n1,2",
      "A,B\n1",
      'A\n"unclosed',
      'A\n"x"junk',
    ])
      expect(() => parseCsv(text)).toThrow();
  });
  it("removes incomplete rows only when opted in and deduplicates after normalization", () => {
    const data = parseCsv("名前,額\n Ａ ,１００\nA,100\nB,");
    const result = cleanCsv(data, true, true, true);
    expect(result.rows).toEqual([["A", "100"]]);
    expect(result.duplicates).toBe(1);
    expect(result.empty).toBe(1);
    expect(cleanCsv(data, false, false, false).rows).toHaveLength(3);
  });
  it("exports round-trippable Japanese data with BOM and protects spreadsheet formulas", () => {
    const data = {
      headers: ["名前", "備考"],
      rows: [
        ["架空", 'a,"b"\nc'],
        ["=SUM(A1)", " @cmd"],
      ],
    };
    const output = exportCsv(data);
    expect(output.startsWith("\uFEFF")).toBe(true);
    expect(parseCsv(output).rows).toEqual([
      ["架空", 'a,"b"\nc'],
      ["'=SUM(A1)", "' @cmd"],
    ]);
  });
  it("rejects over-limit columns", () =>
    expect(() =>
      parseCsv(Array.from({ length: 51 }, (_, i) => `h${i}`).join(",")),
    ).toThrow());
});
describe("inbox rules", () => {
  it("classifies urgency and category independently", () => {
    expect(classify("至急 請求の確認")).toEqual({
      category: "請求",
      urgency: "高",
    });
    expect(classify("エラー確認")).toEqual({
      category: "不具合",
      urgency: "中",
    });
    expect(classify("契約更新")).toEqual({ category: "契約", urgency: "通常" });
    expect(classify("見積もりをお願いします")).toEqual({
      category: "お問い合わせ",
      urgency: "通常",
    });
  });
  it("generates a relevant draft without promising completed action", () => {
    expect(replyDraft(tickets[0])).toContain("請求番号");
    expect(replyDraft(tickets[1])).toContain("操作手順");
    expect(replyDraft(tickets[2])).toContain("プラン");
  });
});
describe("persisted customer validation", () => {
  it("rejects fractional revenue and invalid history dates", () => {
    expect(
      isAdminData({
        ...initialAdmin,
        customers: [{ ...initialAdmin.customers[0], revenue: 0.5 }],
      }),
    ).toBe(false);
    expect(
      isAdminData({
        ...initialAdmin,
        history: [{ id: "h1", text: "test", at: "invalid" }],
      }),
    ).toBe(false);
  });
  it("accepts the sample", () => expect(isAdminData(initialAdmin)).toBe(true));
  it("rejects invalid persisted data", () => {
    for (const value of [
      null,
      {},
      { customers: [], history: [{}] },
      {
        ...initialAdmin,
        customers: [{ ...initialAdmin.customers[0], revenue: -1 }],
      },
      {
        ...initialAdmin,
        customers: [{ ...initialAdmin.customers[0], status: "unexpected" }],
      },
      {
        ...initialAdmin,
        customers: [initialAdmin.customers[0], initialAdmin.customers[0]],
      },
    ])
      expect(isAdminData(value)).toBe(false);
  });
});
