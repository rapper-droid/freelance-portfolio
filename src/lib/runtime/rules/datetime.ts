import type { MissingField, Warning } from "../types";

/**
 * Japanese date and time resolution for booking requests (指示書 §08-2).
 *
 * An extractor may *notice* that a message mentions a time. It never decides
 * what that time is: this module does, from the message's own received
 * timestamp, with ordinary arithmetic. "来週の水曜" has no meaning without
 * knowing when it was written, and a model that guesses the year books the
 * wrong day.
 *
 * Time zone: Japan has no daylight saving and has been UTC+9 since 1951, so a
 * fixed +09:00 offset is exact here and avoids depending on a tz database at
 * the edge. Anything outside JST is out of scope and is reported as such
 * rather than silently converted.
 */
export const JST_OFFSET_MINUTES = 9 * 60;
const DAY_MS = 86_400_000;

export type JstParts = {
  year: number;
  month: number;
  day: number;
  weekday: number; // 0 = Sunday
  hour: number;
  minute: number;
};

export function toJst(iso: string): JstParts {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) throw new Error("invalid_datetime");
  const d = new Date(ms + JST_OFFSET_MINUTES * 60_000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

export function fromJst(p: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
}): string {
  const ms =
    Date.UTC(p.year, p.month - 1, p.day, p.hour ?? 0, p.minute ?? 0) -
    JST_OFFSET_MINUTES * 60_000;
  return new Date(ms).toISOString();
}

export const jstDateKey = (iso: string) => {
  const p = toJst(iso);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
};

/** Calendar-correct: rejects 2026-02-30 instead of rolling it into March. */
export function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export const WEEKDAY_LABELS = [
  "日",
  "月",
  "火",
  "水",
  "木",
  "金",
  "土",
] as const;

/** Formats the way a confirmation message has to read it back (指示書 §08-2). */
export function formatJst(
  iso: string,
  opts: { withTime?: boolean } = {},
): string {
  const p = toJst(iso);
  const base = `${p.year}年${p.month}月${p.day}日（${WEEKDAY_LABELS[p.weekday]}）`;
  return opts.withTime === false
    ? base
    : `${base} ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export type TimeHint =
  | { kind: "point"; minuteOfDay: number; approximate: boolean }
  | { kind: "range"; label: string; fromMinute: number; toMinute: number }
  | { kind: "same_as_previous" }
  | { kind: "unknown" };

export type DateResolution = {
  date: { year: number; month: number; day: number } | null;
  time: TimeHint;
  warnings: Warning[];
  missing: MissingField[];
  /** Character spans of the source text that produced the values above. */
  spans: Array<{ start: number; end: number; quote: string }>;
};

const NAMED_RANGES: Array<[RegExp, string, number, number]> = [
  [/午前中/, "午前中", 9 * 60, 12 * 60],
  [/午前/, "午前", 9 * 60, 12 * 60],
  [/午後/, "午後", 12 * 60, 18 * 60],
  [/夕方/, "夕方", 16 * 60, 19 * 60],
  [/夜/, "夜", 18 * 60, 21 * 60],
  [/朝/, "朝", 8 * 60, 11 * 60],
  [/昼/, "昼", 11 * 60, 14 * 60],
];

/**
 * Both notations people actually write: 「水曜日」 and the parenthesised
 * 「（水）」 that follows a date. A bare 水 is not matched — it is a word.
 */
const WEEKDAY_PATTERN =
  /([日月火水木金土])曜(?:日)?|[（(]\s*([日月火水木金土])\s*[)）]/;

function span(text: string, match: RegExpMatchArray | null) {
  if (!match || match.index === undefined) return null;
  return {
    start: match.index,
    end: match.index + match[0].length,
    quote: match[0],
  };
}

/**
 * Resolves the date and time a Japanese booking message is asking for.
 *
 * Every branch either produces a concrete JST date or records why it could
 * not. Nothing is filled in by assumption: "午後" stays a range, "同じ時間"
 * stays a reference to a conversation this function was not given, and a date
 * whose weekday does not match the one written next to it is reported as a
 * conflict rather than resolved to whichever one looks more likely.
 */
export function resolveJapaneseDateTime(
  text: string,
  receivedAtIso: string,
): DateResolution {
  const now = toJst(receivedAtIso);
  const warnings: Warning[] = [];
  const missing: MissingField[] = [];
  const spans: DateResolution["spans"] = [];

  let date: DateResolution["date"] = null;
  let statedWeekday: number | null = null;
  let weekdayQuote = "";

  const wd = text.match(WEEKDAY_PATTERN);
  if (wd) {
    statedWeekday = WEEKDAY_LABELS.indexOf(
      (wd[1] ?? wd[2]) as (typeof WEEKDAY_LABELS)[number],
    );
    weekdayQuote = wd[0];
    const s = span(text, wd);
    if (s) spans.push(s);
  }

  // 1. A fully written date wins over anything relative.
  const full = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  const partial = text.match(/(?<!\d)(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  const slash = text.match(/(?<![\d/])(\d{1,2})\s*\/\s*(\d{1,2})(?![\d/])/);
  const dayOnly = text.match(/(?<![\d年月/])(\d{1,2})\s*日(?!間|後|前)/);

  const relativeDay = text.match(/本日|今日|明日|明後日|翌日/);
  const relativeWeek = text.match(/今週|来週|再来週/);

  if (full) {
    const y = Number(full[1]);
    const m = Number(full[2]);
    const d = Number(full[3]);
    if (!isRealDate(y, m, d)) {
      warnings.push({
        code: "impossible_date",
        message: `${full[0]} は実在しない日付です。`,
        severity: "blocking",
      });
    } else date = { year: y, month: m, day: d };
    const s = span(text, full);
    if (s) spans.push(s);
  } else if (partial || slash) {
    const source = (partial ?? slash) as RegExpMatchArray;
    const m = Number(source[1]);
    const d = Number(source[2]);
    // Pick the nearest occurrence that has not passed: a request written in
    // December naming "1月10日" means next year, not ten months ago.
    if (!isRealDate(now.year, m, d) && !isRealDate(now.year + 1, m, d)) {
      warnings.push({
        code: "impossible_date",
        message: `${source[0]} は実在しない日付です。`,
        severity: "blocking",
      });
    } else {
      const thisYearHasPassed =
        m < now.month || (m === now.month && d < now.day);
      const year =
        thisYearHasPassed || !isRealDate(now.year, m, d)
          ? now.year + 1
          : now.year;
      date = isRealDate(year, m, d)
        ? { year, month: m, day: d }
        : { year: now.year, month: m, day: d };
    }
    const s = span(text, source);
    if (s) spans.push(s);
  } else if (relativeDay) {
    const offset = /明後日/.test(relativeDay[0])
      ? 2
      : /明日|翌日/.test(relativeDay[0])
        ? 1
        : 0;
    const base = new Date(
      Date.UTC(now.year, now.month - 1, now.day) + offset * DAY_MS,
    );
    date = {
      year: base.getUTCFullYear(),
      month: base.getUTCMonth() + 1,
      day: base.getUTCDate(),
    };
    const s = span(text, relativeDay);
    if (s) spans.push(s);
  } else if (relativeWeek && statedWeekday !== null) {
    // "来週の水曜": the week starts on Monday, which is how the phrase is used.
    const weeksAhead = /再来週/.test(relativeWeek[0])
      ? 2
      : /来週/.test(relativeWeek[0])
        ? 1
        : 0;
    const mondayOffset = (now.weekday + 6) % 7;
    const thisMonday =
      Date.UTC(now.year, now.month - 1, now.day) - mondayOffset * DAY_MS;
    const dayIndex = (statedWeekday + 6) % 7; // Monday = 0
    const target = new Date(thisMonday + (weeksAhead * 7 + dayIndex) * DAY_MS);
    date = {
      year: target.getUTCFullYear(),
      month: target.getUTCMonth() + 1,
      day: target.getUTCDate(),
    };
    const s = span(text, relativeWeek);
    if (s) spans.push(s);
  } else if (statedWeekday !== null) {
    // A bare weekday means the next one that has not happened yet, but the
    // sender may well have meant the one after. Always a question.
    const ahead = (statedWeekday - now.weekday + 7) % 7 || 7;
    const target = new Date(
      Date.UTC(now.year, now.month - 1, now.day) + ahead * DAY_MS,
    );
    date = {
      year: target.getUTCFullYear(),
      month: target.getUTCMonth() + 1,
      day: target.getUTCDate(),
    };
    warnings.push({
      code: "weekday_only",
      message: `「${weekdayQuote}」だけでは週が特定できないため、直近の${weekdayQuote}として扱いました。確認してください。`,
      severity: "blocking",
    });
  } else if (dayOnly) {
    const d = Number(dayOnly[1]);
    let year = now.year;
    let month = now.month;
    if (d < now.day) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    if (!isRealDate(year, month, d)) {
      warnings.push({
        code: "impossible_date",
        message: `${month}月に${d}日はありません。`,
        severity: "blocking",
      });
    } else {
      date = { year, month, day: d };
      warnings.push({
        code: "month_assumed",
        message: `「${dayOnly[0]}」に月の記載がないため ${month}月${d}日 として扱いました。確認してください。`,
        severity: "blocking",
      });
    }
    const s = span(text, dayOnly);
    if (s) spans.push(s);
  }

  // 2. A written weekday that disagrees with the written date is never resolved
  //    by preferring one of them (指示書 §08-2 / B04).
  if (date && statedWeekday !== null && !relativeWeek && !relativeDay) {
    const actual = weekdayOf(date.year, date.month, date.day);
    if (actual !== statedWeekday) {
      warnings.push({
        code: "weekday_conflict",
        message: `${date.month}月${date.day}日は${WEEKDAY_LABELS[actual]}曜日で、記載の「${weekdayQuote}」と一致しません。`,
        severity: "blocking",
      });
    }
  }

  // 3. Time.
  let time: TimeHint = { kind: "unknown" };
  const sameTime = text.match(/同じ時間|いつもの時間|前回と同じ/);
  const half = text.match(/(\d{1,2})\s*時半/);
  const clock = text.match(/(\d{1,2})\s*(?::|時)\s*(\d{1,2})?\s*分?/);
  const approximate = /ごろ|頃|くらい|あたり/.test(text);
  const pm = /午後|夕方|夜/.test(text);
  const am = /午前|朝/.test(text);

  if (sameTime) {
    time = { kind: "same_as_previous" };
    missing.push({
      field: "startTime",
      label: "開始時刻",
      reason:
        "「同じ時間」は過去のやりとりを参照しています。対象の予約を特定してください。",
    });
    const s = span(text, sameTime);
    if (s) spans.push(s);
  } else if (half) {
    let h = Number(half[1]);
    if (pm && h < 12) h += 12;
    if (h > 23) {
      warnings.push({
        code: "impossible_time",
        message: `${half[0]} は時刻として解釈できません。`,
        severity: "blocking",
      });
    } else {
      time = { kind: "point", minuteOfDay: h * 60 + 30, approximate };
    }
    const s = span(text, half);
    if (s) spans.push(s);
  } else if (clock) {
    let h = Number(clock[1]);
    const m = clock[2] ? Number(clock[2]) : 0;
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    if (h > 23 || m > 59) {
      warnings.push({
        code: "impossible_time",
        message: `${clock[0]} は時刻として解釈できません。`,
        severity: "blocking",
      });
    } else {
      time = { kind: "point", minuteOfDay: h * 60 + m, approximate };
    }
    const s = span(text, clock);
    if (s) spans.push(s);
  } else {
    for (const [pattern, label, from, to] of NAMED_RANGES) {
      const m = text.match(pattern);
      if (!m) continue;
      time = { kind: "range", label, fromMinute: from, toMinute: to };
      const s = span(text, m);
      if (s) spans.push(s);
      break;
    }
  }

  if (time.kind === "unknown" && !sameTime) {
    missing.push({
      field: "startTime",
      label: "希望時刻",
      reason: "本文から希望の時間帯を特定できませんでした。",
    });
  }
  if (!date) {
    missing.push({
      field: "startDate",
      label: "希望日",
      reason: "本文から希望日を特定できませんでした。",
    });
  }

  // 4. A date already past at the moment of writing is always a question.
  if (date) {
    const requested = Date.UTC(date.year, date.month - 1, date.day);
    const today = Date.UTC(now.year, now.month - 1, now.day);
    if (requested < today) {
      warnings.push({
        code: "past_date",
        message: `${date.year}年${date.month}月${date.day}日 は受信時点（${now.year}年${now.month}月${now.day}日）より前です。`,
        severity: "blocking",
      });
    }
  }

  return { date, time, warnings, missing, spans };
}
