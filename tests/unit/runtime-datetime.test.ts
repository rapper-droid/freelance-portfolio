import { describe, expect, it } from "vitest";
import {
  formatJst,
  fromJst,
  isRealDate,
  jstDateKey,
  resolveJapaneseDateTime,
  toJst,
  weekdayOf,
} from "@/lib/runtime/rules/datetime";

/**
 * 受け入れ基準 B01, B02, B04（指示書 §22）。
 *
 * 期待値は固定。文章の一致ではなく、確定した年月日・警告コード・未確認項目で
 * 判定する（指示書 §23）。
 */

// 2026-09-22(火) 10:00 JST。全ケースの基準時刻。
const RECEIVED = "2026-09-22T01:00:00.000Z";

describe("JST conversion", () => {
  it("reads a UTC instant as the JST wall clock", () => {
    expect(toJst(RECEIVED)).toEqual({
      year: 2026,
      month: 9,
      day: 22,
      weekday: 2, // 火
      hour: 10,
      minute: 0,
    });
  });

  it("round-trips a JST wall clock through UTC", () => {
    const iso = fromJst({
      year: 2026,
      month: 9,
      day: 22,
      hour: 14,
      minute: 30,
    });
    expect(iso).toBe("2026-09-22T05:30:00.000Z");
    expect(toJst(iso).hour).toBe(14);
  });

  it("keeps the JST date when UTC has already rolled over", () => {
    // 2026-09-22 08:00 JST is still 2026-09-21 in UTC.
    expect(jstDateKey("2026-09-21T23:00:00.000Z")).toBe("2026-09-22");
  });

  it("rejects dates that do not exist instead of rolling them over", () => {
    expect(isRealDate(2026, 2, 30)).toBe(false);
    expect(isRealDate(2026, 2, 28)).toBe(true);
    expect(isRealDate(2028, 2, 29)).toBe(true); // leap year
    expect(isRealDate(2026, 13, 1)).toBe(false);
  });

  it("reads the weekday back the way a confirmation has to print it", () => {
    expect(weekdayOf(2026, 9, 22)).toBe(2);
    expect(formatJst("2026-09-22T05:00:00.000Z")).toBe(
      "2026年9月22日（火） 14:00",
    );
  });
});

describe("resolveJapaneseDateTime — B01 希望日時の抽出", () => {
  it("resolves 来週の水曜14時ごろ against the received time", () => {
    const r = resolveJapaneseDateTime(
      "来週の水曜14時ごろに撮影したいです。",
      RECEIVED,
    );
    // Received Tue 2026-09-22; next week's Wednesday is 2026-09-30.
    expect(r.date).toEqual({ year: 2026, month: 9, day: 30 });
    expect(weekdayOf(2026, 9, 30)).toBe(3);
    expect(r.time).toEqual({
      kind: "point",
      minuteOfDay: 14 * 60,
      approximate: true,
    });
    expect(r.warnings).toHaveLength(0);
  });

  it("resolves 明日 and 明後日 from the received date", () => {
    expect(resolveJapaneseDateTime("明日の10時", RECEIVED).date).toEqual({
      year: 2026,
      month: 9,
      day: 23,
    });
    expect(resolveJapaneseDateTime("明後日の10時", RECEIVED).date).toEqual({
      year: 2026,
      month: 9,
      day: 24,
    });
  });

  it("reads 午後3時 as 15:00 rather than 03:00", () => {
    const r = resolveJapaneseDateTime(
      "10月2日の午後3時でお願いします",
      RECEIVED,
    );
    expect(r.time).toEqual({
      kind: "point",
      minuteOfDay: 15 * 60,
      approximate: false,
    });
  });

  it("reads 14時半 as 14:30", () => {
    const r = resolveJapaneseDateTime("10月2日 14時半", RECEIVED);
    expect(r.time).toEqual({
      kind: "point",
      minuteOfDay: 14 * 60 + 30,
      approximate: false,
    });
  });

  it("rolls a month that has already passed into next year", () => {
    // Written in September, "1月10日" means the coming January.
    const r = resolveJapaneseDateTime("1月10日に撮影したい", RECEIVED);
    expect(r.date).toEqual({ year: 2027, month: 1, day: 10 });
  });

  it("keeps a date later this year in this year", () => {
    const r = resolveJapaneseDateTime("12月3日に撮影したい", RECEIVED);
    expect(r.date).toEqual({ year: 2026, month: 12, day: 3 });
  });
});

describe("resolveJapaneseDateTime — B04 矛盾・曖昧は確認待ちにする", () => {
  it("flags a weekday that disagrees with the written date", () => {
    // 2026-10-02 is a Friday, not a Wednesday.
    const r = resolveJapaneseDateTime("10月2日（水）14時", RECEIVED);
    expect(r.date).toEqual({ year: 2026, month: 10, day: 2 });
    expect(r.warnings.map((w) => w.code)).toContain("weekday_conflict");
    expect(
      r.warnings.find((w) => w.code === "weekday_conflict")?.severity,
    ).toBe("blocking");
  });

  it("does not flag a weekday that agrees with the written date", () => {
    // 2026-10-02 is a Friday.
    const r = resolveJapaneseDateTime("10月2日（金）14時", RECEIVED);
    expect(r.warnings.map((w) => w.code)).not.toContain("weekday_conflict");
  });

  it("treats 午後 alone as a range, not a start time", () => {
    const r = resolveJapaneseDateTime("10月2日の午後でお願いします", RECEIVED);
    expect(r.time.kind).toBe("range");
    if (r.time.kind === "range") {
      expect(r.time.label).toBe("午後");
      expect(r.time.fromMinute).toBe(12 * 60);
    }
  });

  it("keeps 同じ時間 as a reference that needs the earlier booking", () => {
    const r = resolveJapaneseDateTime("次回も同じ時間でお願いします", RECEIVED);
    expect(r.time.kind).toBe("same_as_previous");
    expect(r.missing.map((m) => m.field)).toContain("startTime");
  });

  it("asks which month a bare 30日 means", () => {
    const r = resolveJapaneseDateTime("30日の14時はいかがでしょうか", RECEIVED);
    expect(r.date).toEqual({ year: 2026, month: 9, day: 30 });
    expect(r.warnings.map((w) => w.code)).toContain("month_assumed");
  });

  it("moves a bare day that has already passed to next month", () => {
    const r = resolveJapaneseDateTime("5日の14時はいかがでしょうか", RECEIVED);
    expect(r.date).toEqual({ year: 2026, month: 10, day: 5 });
  });

  it("flags a bare weekday as week-ambiguous", () => {
    const r = resolveJapaneseDateTime("水曜の14時でお願いします", RECEIVED);
    expect(r.warnings.map((w) => w.code)).toContain("weekday_only");
    expect(r.date).toEqual({ year: 2026, month: 9, day: 23 });
  });

  it("flags a date that is already in the past", () => {
    const r = resolveJapaneseDateTime("2026年9月1日 14時", RECEIVED);
    expect(r.warnings.map((w) => w.code)).toContain("past_date");
  });

  it("refuses an impossible date instead of rolling it into the next month", () => {
    const r = resolveJapaneseDateTime("2026年2月30日 14時", RECEIVED);
    expect(r.date).toBeNull();
    expect(r.warnings.map((w) => w.code)).toContain("impossible_date");
  });

  it("refuses an impossible time", () => {
    const r = resolveJapaneseDateTime("10月2日 25時", RECEIVED);
    expect(r.warnings.map((w) => w.code)).toContain("impossible_time");
  });

  it("reports both date and time as missing when neither is written", () => {
    const r = resolveJapaneseDateTime("撮影をお願いしたいです。", RECEIVED);
    expect(r.date).toBeNull();
    expect(r.missing.map((m) => m.field).sort()).toEqual([
      "startDate",
      "startTime",
    ]);
  });

  it("points every resolved value at a span of the source text", () => {
    const text = "来週の水曜14時ごろに撮影したいです。";
    const r = resolveJapaneseDateTime(text, RECEIVED);
    expect(r.spans.length).toBeGreaterThan(0);
    for (const s of r.spans) expect(text.slice(s.start, s.end)).toBe(s.quote);
  });
});
