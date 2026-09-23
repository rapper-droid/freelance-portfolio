import { describe, expect, it } from "vitest";
import {
  CSV_LIMITS,
  csvLimitsLabel,
  realUtilityEnabled,
} from "@/lib/runtime/feature";

/** 受け入れ基準 C02, D06。 */

describe("realUtilityEnabled — 切り戻せること", () => {
  it("is on when the variable is unset", () => {
    expect(realUtilityEnabled({})).toBe(true);
  });

  it("is off only for the exact opt-out value", () => {
    expect(realUtilityEnabled({ NEXT_PUBLIC_REAL_UTILITY: "off" })).toBe(false);
  });

  it("stays on for anything else, so a typo cannot hide a shipped page", () => {
    for (const value of ["OFF", "false", "0", "", "on", "disabled"])
      expect(realUtilityEnabled({ NEXT_PUBLIC_REAL_UTILITY: value })).toBe(
        true,
      );
  });
});

describe("csvLimitsLabel — 実装どおりの制限を表示する", () => {
  it("states the limits the parser actually enforces", () => {
    const label = csvLimitsLabel();
    expect(label).toContain("UTF-8");
    expect(label).toContain("256KB");
    expect(label).toContain("10,000行");
    expect(label).toContain("50列");
  });

  it("names the formats that are not supported rather than implying they are", () => {
    const label = csvLimitsLabel();
    expect(label).toContain("XLSX");
    expect(label).toContain("Shift_JIS");
    expect(label).toContain("未対応");
  });

  it("keeps the stated row and column caps in step with lib/csv", () => {
    // These are the numbers parseCsv throws on; if one moves, both move.
    expect(CSV_LIMITS.maxRows).toBe(10_000);
    expect(CSV_LIMITS.maxColumns).toBe(50);
  });
});
