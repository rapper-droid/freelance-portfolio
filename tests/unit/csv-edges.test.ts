import { describe, expect, it } from "vitest";
import {
  cleanCsv,
  exportCsv,
  neutralizeCell,
  parseCsv,
} from "../../src/lib/csv";

describe("CSV tool edge cases (G07)", () => {
  it("keeps plain numbers, including negatives, but neutralises formulas", () => {
    expect(neutralizeCell("-500")).toBe("-500");
    expect(neutralizeCell("+81")).toBe("+81");
    expect(neutralizeCell("12.5")).toBe("12.5");
    expect(neutralizeCell("-2+3")).toBe("'-2+3");
    expect(neutralizeCell('=HYPERLINK("x")')).toBe('\'=HYPERLINK("x")');
    expect(neutralizeCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(neutralizeCell("\tcmd")).toBe("'\tcmd");
    expect(neutralizeCell("\r=1")).toBe("'\r=1");
    expect(neutralizeCell(" =1")).toBe("' =1");
    expect(neutralizeCell("00123")).toBe("00123");
    expect(neutralizeCell("a-b")).toBe("a-b");
  });
  it("round-trips leading zeros, quotes, commas and line breaks", () => {
    const data = {
      headers: ["ID", "メモ"],
      rows: [
        ["00123", 'a,"b"\nc'],
        ["-500", "+81 90"],
      ],
    };
    expect(parseCsv(exportCsv(data)).rows).toEqual([
      ["00123", 'a,"b"\nc'],
      ["-500", "'+81 90"],
    ]);
  });
  it("separates whitespace cleanup from full-width folding", () => {
    const data = parseCsv("コード,名前\nＡ１２, 山田 \nA12,山田");
    const spaceOnly = cleanCsv(data, true, true, false, false);
    expect(spaceOnly.rows).toEqual([
      ["Ａ１２", "山田"],
      ["A12", "山田"],
    ]);
    expect(spaceOnly.duplicates).toBe(0);
    const folded = cleanCsv(data, true, true, false, true);
    expect(folded.rows).toEqual([["A12", "山田"]]);
    expect(folded.duplicates).toBe(1);
  });
  it("counts changed cells and shows a few examples without touching the source", () => {
    const data = parseCsv('名前,備考\n" 架空 ","一行目\n二行目"\n架空,メモ');
    const before = JSON.stringify(data);
    const result = cleanCsv(data, false, true, false, false);
    expect(result.changed).toBe(2);
    expect(result.examples).toEqual([
      { column: "名前", before: " 架空 ", after: "架空" },
      { column: "備考", before: "一行目\n二行目", after: "一行目 二行目" },
    ]);
    expect(JSON.stringify(data)).toBe(before);
    expect(cleanCsv(data, false, false, false, false).changed).toBe(0);
  });
  it("preserves zero, decimals and Japanese text through a full round trip", () => {
    const data = parseCsv(
      '商品コード,数量,単価,備考\n00123,0,-12.5,"日本語の備考、テスト"\nABC,10,0.0,ふりがな',
    );
    const cleaned = cleanCsv(data, true, true, false, false);
    expect(cleaned.rows).toEqual([
      ["00123", "0", "-12.5", "日本語の備考、テスト"],
      ["ABC", "10", "0.0", "ふりがな"],
    ]);
    expect(cleaned.changed).toBe(0);
    const round = parseCsv(exportCsv(cleaned));
    expect(round.rows).toEqual(cleaned.rows);
    expect(round.headers).toEqual(["商品コード", "数量", "単価", "備考"]);
    // Nothing gained an apostrophe: they are all plain values.
    expect(exportCsv(cleaned)).not.toContain("'");
  });
  it("leaves values untouched when every option is off", () => {
    const data = parseCsv("コード,名前\nＡ１２, 山田 \nA12,山田");
    const untouched = cleanCsv(data, false, false, false, false);
    expect(untouched.rows).toEqual([
      ["Ａ１２", " 山田 "],
      ["A12", "山田"],
    ]);
    expect(untouched.changed).toBe(0);
    expect(untouched.examples).toEqual([]);
    expect(untouched.duplicates).toBe(0);
  });
  it("keeps the documented limits: 50 columns and 10,000 rows", () => {
    const header = Array.from({ length: 50 }, (_, i) => `h${i}`).join(",");
    expect(
      parseCsv(header + "\n" + "x,".repeat(49) + "x").headers,
    ).toHaveLength(50);
    const rows = Array.from({ length: 10001 }, () => "1").join("\n");
    expect(() => parseCsv("A\n" + rows)).toThrow("10,000行");
    expect(parseCsv("A\n" + rows.slice(2)).rows).toHaveLength(10000);
  });
  it("treats blank input and header-only files predictably", () => {
    expect(() => parseCsv("")).toThrow();
    expect(parseCsv("A,B").rows).toEqual([]);
    expect(parseCsv("A,B\n\n\n").rows).toEqual([]);
  });
});
