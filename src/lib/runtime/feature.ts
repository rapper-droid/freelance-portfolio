/**
 * The switch that takes the new experience back out (指示書 D06).
 *
 * A release needs a way back that is not a revert and a redeploy. When
 * `NEXT_PUBLIC_REAL_UTILITY` is `off`, `/flow` stops existing and `/works`
 * renders exactly as it did before this change — the gallery, the categories
 * and the offers are untouched either way, because the new section only ever
 * sits above them.
 *
 * Default is on. An unset variable must not silently disable a shipped
 * feature, and a typo should fail visibly rather than quietly hide a page.
 */
export function realUtilityEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.NEXT_PUBLIC_REAL_UTILITY !== "off";
}

/** The limits the CSV path actually enforces, for display (指示書 C02). */
export const CSV_LIMITS = {
  encoding: "UTF-8",
  maxBytes: 256 * 1024,
  maxRows: 10_000,
  maxColumns: 50,
  formats: ["CSV"],
  /** Stated so nobody expects a converter that does not exist. */
  unsupported: ["XLSX", "Shift_JIS"],
} as const;

export const csvLimitsLabel = () =>
  `対応形式：${CSV_LIMITS.formats.join("・")}（${CSV_LIMITS.encoding}）／` +
  `上限：${(CSV_LIMITS.maxBytes / 1024).toFixed(0)}KB・` +
  `${CSV_LIMITS.maxRows.toLocaleString("ja-JP")}行・${CSV_LIMITS.maxColumns}列。` +
  `${CSV_LIMITS.unsupported.join("・")}は未対応です（変換して読み込む機能はありません）。`;
