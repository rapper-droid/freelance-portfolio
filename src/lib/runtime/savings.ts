/**
 * The time-saving estimate (指示書 §19).
 *
 * One formula, stated where it is used:
 *
 *   月の純削減時間 = 件数 ×（従来の人手時間 − 導入後の通常確認時間）
 *                    − 例外対応時間 − 月次運用時間
 *
 * The subtractions are the honest part. Counting only "件数 × 短縮分" produces
 * a number that ignores the exceptions somebody still handles and the upkeep
 * the system itself needs, and that number is always too good.
 *
 * What this is not: a measurement. It is arithmetic over figures the visitor
 * typed. `isEstimate` travels with the result so a screen cannot present it as
 * an observed outcome, and setup time is reported separately rather than
 * amortised into the monthly figure.
 */

export type SavingsInput = {
  /** Cases per month. */
  volume: number;
  /** Minutes a person spends on one case today. */
  currentMinutes: number;
  /** Minutes a person spends reviewing one case afterwards. */
  reviewMinutes: number;
  /** Share of cases that still need manual handling, 0–1. */
  exceptionRate: number;
  /** Minutes an exception costs, on top of the review. */
  exceptionMinutes: number;
  /** Monthly upkeep: rule changes, checking, fixing. */
  operationMinutes: number;
  /** One-off setup, reported on its own and never folded into the monthly net. */
  setupMinutes: number;
  /** Optional. The visitor's own figure; no default rate is assumed. */
  hourlyRateYen?: number;
};

export type SavingsResult = {
  isEstimate: true;
  /** Minutes, before the deductions. */
  grossSavedMinutes: number;
  exceptionCostMinutes: number;
  operationMinutes: number;
  netSavedMinutes: number;
  netSavedHours: number;
  setupMinutes: number;
  /** Months of net saving needed to cover setup; null when there is no saving. */
  setupPaybackMonths: number | null;
  /** Null unless the visitor supplied a rate. */
  monthlyValueYen: number | null;
  /** Rendered assumptions, so the number is never shown bare. */
  assumptions: string[];
  /** Stated when the arithmetic produces no saving. */
  caveats: string[];
};

export const SAVINGS_DEFAULTS: SavingsInput = {
  volume: 200,
  currentMinutes: 8,
  reviewMinutes: 2,
  exceptionRate: 0.1,
  exceptionMinutes: 6,
  operationMinutes: 60,
  setupMinutes: 240,
};

const clamp = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;

/** Normalises -0, which would otherwise render as "-0分" on screen. */
const round = (n: number) => {
  const r = Math.round(n);
  return r === 0 ? 0 : r;
};

export function estimateSavings(raw: SavingsInput): SavingsResult {
  const volume = Math.round(clamp(raw.volume, 0, 100_000));
  const currentMinutes = clamp(raw.currentMinutes, 0, 480);
  const reviewMinutes = clamp(raw.reviewMinutes, 0, 480);
  const exceptionRate = clamp(raw.exceptionRate, 0, 1);
  const exceptionMinutes = clamp(raw.exceptionMinutes, 0, 480);
  const operationMinutes = clamp(raw.operationMinutes, 0, 100_000);
  const setupMinutes = clamp(raw.setupMinutes, 0, 100_000);

  const grossSavedMinutes = round(volume * (currentMinutes - reviewMinutes));
  const exceptionCostMinutes = round(volume * exceptionRate * exceptionMinutes);
  const netSavedMinutes = round(
    grossSavedMinutes - exceptionCostMinutes - operationMinutes,
  );

  const caveats: string[] = [];
  if (currentMinutes <= reviewMinutes)
    caveats.push(
      "導入後の確認時間が従来の作業時間以上です。この条件では時間は減りません。",
    );
  if (netSavedMinutes <= 0)
    caveats.push(
      "例外対応と運用を差し引くと、この条件では純削減になりません。対象を絞るか、例外の割合を下げる必要があります。",
    );

  const hourlyRateYen =
    typeof raw.hourlyRateYen === "number" && raw.hourlyRateYen > 0
      ? Math.round(clamp(raw.hourlyRateYen, 0, 1_000_000))
      : null;

  return {
    isEstimate: true,
    grossSavedMinutes,
    exceptionCostMinutes,
    operationMinutes,
    netSavedMinutes,
    netSavedHours: round((netSavedMinutes / 60) * 10) / 10,
    setupMinutes,
    setupPaybackMonths:
      netSavedMinutes > 0
        ? round((setupMinutes / netSavedMinutes) * 10) / 10
        : null,
    monthlyValueYen:
      hourlyRateYen && netSavedMinutes > 0
        ? round((netSavedMinutes / 60) * hourlyRateYen)
        : null,
    assumptions: [
      `件数：月 ${volume.toLocaleString("ja-JP")} 件`,
      `従来の人手時間：1件 ${currentMinutes} 分`,
      `導入後の確認時間：1件 ${reviewMinutes} 分`,
      `例外：${Math.round(exceptionRate * 100)}% が 1件 ${exceptionMinutes} 分`,
      `月次運用：${operationMinutes} 分`,
      `初期設定：${setupMinutes} 分（月次の計算には含めていません）`,
    ],
    caveats,
  };
}

export const formatMinutes = (minutes: number) => {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return hours
    ? `${sign}${hours}時間${rest ? `${rest}分` : ""}`
    : `${sign}${rest}分`;
};
