/**
 * Money as integers (指示書 §09-2).
 *
 * Every amount is carried as an integer count of minor units with an explicit
 * scale, because 0.1 + 0.2 is not 0.3 in binary floating point and a report
 * that is off by a yen is a report nobody trusts. Parsing is strict: a cell
 * that cannot be read as a number is reported as unreadable rather than
 * coerced to zero, since a silent zero quietly lowers a total.
 */

export type Money = {
  /** Integer. 1234 at scale 0 is ¥1,234; 123456 at scale 2 is $1,234.56. */
  minorUnits: number;
  /** Decimal places the currency uses. JPY is 0. */
  scale: number;
  currency: string;
};

export type ParsedAmount =
  { ok: true; money: Money } | { ok: false; reason: string; raw: string };

const CURRENCY_SCALES: Record<string, number> = {
  JPY: 0,
  USD: 2,
  EUR: 2,
  GBP: 2,
};

export const scaleFor = (currency: string) => CURRENCY_SCALES[currency] ?? 2;

/** Symbols we recognise. An unknown symbol is reported, never assumed to be yen. */
const SYMBOLS: Array<[RegExp, string]> = [
  [/[¥￥]|円/, "JPY"],
  [/\$|USD/i, "USD"],
  [/€|EUR/i, "EUR"],
  [/£|GBP/i, "GBP"],
];

export function detectCurrency(raw: string): string | null {
  for (const [pattern, code] of SYMBOLS) if (pattern.test(raw)) return code;
  return null;
}

/**
 * Reads one cell as an amount in a declared currency.
 *
 * Refuses rather than guesses when the cell carries a *different* currency
 * from the one declared — a column holding both ¥ and $ is a question for a
 * person, not something to average (指示書 C06).
 */
export function parseAmount(raw: string, currency: string): ParsedAmount {
  const text = raw.normalize("NFKC").trim();
  if (!text) return { ok: false, reason: "空欄です。", raw };

  const found = detectCurrency(text);
  if (found && found !== currency)
    return {
      ok: false,
      reason: `${found} の表記が ${currency} の列に含まれています。`,
      raw,
    };

  const cleaned = text
    .replace(/[¥￥$€£]|円|USD|EUR|GBP|JPY/gi, "")
    .replace(/,/g, "")
    .replace(/\s/g, "");

  // Parentheses are the accounting convention for a negative number.
  const negative = /^\(.*\)$/.test(cleaned) || cleaned.startsWith("-");
  const digits = cleaned.replace(/^\(|\)$/g, "").replace(/^-/, "");
  if (!/^\d+(?:\.\d+)?$/.test(digits))
    return { ok: false, reason: "数値として読み取れません。", raw };

  const scale = scaleFor(currency);
  const [whole, fraction = ""] = digits.split(".");
  if (fraction.length > scale)
    return {
      ok: false,
      reason: `${currency} は小数点以下 ${scale} 桁までです（入力: ${digits}）。`,
      raw,
    };

  const padded = fraction.padEnd(scale, "0");
  const minorUnits = Number(whole) * 10 ** scale + Number(padded || "0");
  if (!Number.isSafeInteger(minorUnits))
    return { ok: false, reason: "金額が大きすぎます。", raw };

  return {
    ok: true,
    money: { minorUnits: negative ? -minorUnits : minorUnits, scale, currency },
  };
}

/** Refuses to add different currencies rather than producing a meaningless sum. */
export function sumMoney(values: readonly Money[]): Money | null {
  if (!values.length) return null;
  const { currency, scale } = values[0];
  if (values.some((v) => v.currency !== currency)) return null;
  return {
    minorUnits: values.reduce((total, v) => total + v.minorUnits, 0),
    scale,
    currency,
  };
}

export function formatMoney(money: Money): string {
  const sign = money.minorUnits < 0 ? "-" : "";
  const abs = Math.abs(money.minorUnits);
  const divisor = 10 ** money.scale;
  const whole = Math.floor(abs / divisor).toLocaleString("en-US");
  const fraction = money.scale
    ? "." + String(abs % divisor).padStart(money.scale, "0")
    : "";
  const prefix = money.currency === "JPY" ? "¥" : money.currency + " ";
  return `${sign}${prefix}${whole}${fraction}`;
}

/**
 * Percentage change in basis points, to avoid a second float.
 *
 * A previous value of zero has no percentage change — reporting "+100%" or
 * "∞" there is a made-up number (指示書 C10), so it returns null and the
 * caller states the absolute change instead.
 */
export function changeBasisPoints(
  previous: number,
  current: number,
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 10_000);
}

export const formatBasisPoints = (bp: number) =>
  `${bp >= 0 ? "+" : ""}${(bp / 100).toFixed(1)}%`;
