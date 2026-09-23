import { describe, expect, it } from "vitest";
import {
  estimateSavings,
  formatMinutes,
  SAVINGS_DEFAULTS,
} from "@/lib/runtime/savings";

/** 受け入れ基準 U09, U10（指示書 §19）。 */

describe("estimateSavings — 試算は実績ではない", () => {
  it("matches the worked example in the specification", () => {
    // 月200件、従来8分、導入後2分、例外・運用に月120分 → 純削減 1,080分 = 18時間。
    const result = estimateSavings({
      volume: 200,
      currentMinutes: 8,
      reviewMinutes: 2,
      exceptionRate: 0.1,
      exceptionMinutes: 3, // 200 × 0.1 × 3 = 60分
      operationMinutes: 60, // 合計 120分
      setupMinutes: 240,
    });
    expect(result.grossSavedMinutes).toBe(1200);
    expect(result.exceptionCostMinutes).toBe(60);
    expect(result.netSavedMinutes).toBe(1080);
    expect(result.netSavedHours).toBe(18);
  });

  it("subtracts exceptions and upkeep rather than reporting the gross figure", () => {
    const result = estimateSavings(SAVINGS_DEFAULTS);
    expect(result.netSavedMinutes).toBeLessThan(result.grossSavedMinutes);
    expect(result.netSavedMinutes).toBe(
      result.grossSavedMinutes -
        result.exceptionCostMinutes -
        result.operationMinutes,
    );
  });

  it("always marks itself as an estimate", () => {
    expect(estimateSavings(SAVINGS_DEFAULTS).isEstimate).toBe(true);
  });

  it("keeps setup time out of the monthly figure and reports it separately", () => {
    const withSetup = estimateSavings({
      ...SAVINGS_DEFAULTS,
      setupMinutes: 600,
    });
    const withoutSetup = estimateSavings({
      ...SAVINGS_DEFAULTS,
      setupMinutes: 0,
    });
    expect(withSetup.netSavedMinutes).toBe(withoutSetup.netSavedMinutes);
    expect(withSetup.setupMinutes).toBe(600);
  });

  it("says so when the conditions produce no saving — U09", () => {
    const result = estimateSavings({
      ...SAVINGS_DEFAULTS,
      currentMinutes: 2,
      reviewMinutes: 2,
    });
    expect(result.netSavedMinutes).toBeLessThanOrEqual(0);
    expect(result.caveats.length).toBeGreaterThan(0);
    expect(result.setupPaybackMonths).toBeNull();
  });

  it("warns when exceptions and upkeep swallow the saving", () => {
    const result = estimateSavings({
      ...SAVINGS_DEFAULTS,
      exceptionRate: 1,
      exceptionMinutes: 60,
    });
    expect(result.caveats.join(" ")).toContain("純削減になりません");
  });

  it("converts to money only when the visitor supplied a rate", () => {
    expect(estimateSavings(SAVINGS_DEFAULTS).monthlyValueYen).toBeNull();
    const priced = estimateSavings({
      ...SAVINGS_DEFAULTS,
      hourlyRateYen: 3000,
    });
    expect(priced.monthlyValueYen).toBe(
      Math.round((priced.netSavedMinutes / 60) * 3000),
    );
  });

  it("lists every assumption behind the number", () => {
    const { assumptions } = estimateSavings(SAVINGS_DEFAULTS);
    expect(assumptions.join(" ")).toContain("件数");
    expect(assumptions.join(" ")).toContain("例外");
    expect(assumptions.join(" ")).toContain("初期設定");
  });

  it("clamps impossible inputs instead of producing a nonsense figure", () => {
    const result = estimateSavings({
      ...SAVINGS_DEFAULTS,
      volume: -50,
      exceptionRate: 5,
      currentMinutes: Number.NaN,
    });
    expect(result.grossSavedMinutes).toBe(0);
    expect(Number.isFinite(result.netSavedMinutes)).toBe(true);
  });

  it("formats minutes as hours and minutes", () => {
    expect(formatMinutes(1080)).toBe("18時間");
    expect(formatMinutes(90)).toBe("1時間30分");
    expect(formatMinutes(45)).toBe("45分");
  });
});
