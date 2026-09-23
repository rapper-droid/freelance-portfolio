import { describe, expect, it } from "vitest";
import {
  ageInDays,
  evidence,
  formatStamp,
  STALE_AFTER_DAYS,
  STATUS_LABELS,
  SUITE_STATUSES,
  summarise,
  type QaEvidence,
} from "@/lib/qa-evidence";

/** 受け入れ基準 U08（SHA・日時つきの実テスト結果）／指示書 §10。 */

const suite = (over: Partial<QaEvidence["suites"][number]> = {}) => ({
  id: "unit",
  label: "ユニットテスト",
  scope: "automated" as const,
  status: "passed" as const,
  detail: "35 ファイル / 412 テスト",
  checkedAt: "2026-09-23T02:00:00.000Z",
  total: 412,
  failed: 0,
  ...over,
});

const record = (over: Partial<QaEvidence> = {}): QaEvidence => ({
  schema: 1,
  commit: "3d86412".padEnd(40, "0"),
  commitShort: "3d86412",
  committedAt: "2026-09-23T01:00:00.000Z",
  generatedAt: "2026-09-23T02:00:00.000Z",
  dirty: false,
  suites: [suite()],
  ...over,
});

describe("committed evidence — 実際に生成されたファイル", () => {
  it("carries the commit it belongs to", () => {
    expect(evidence.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(evidence.commitShort.length).toBeGreaterThanOrEqual(7);
  });

  it("carries a generation timestamp", () => {
    expect(Number.isFinite(Date.parse(evidence.generatedAt))).toBe(true);
  });

  it("uses only the statuses the page knows how to render", () => {
    for (const s of evidence.suites) expect(SUITE_STATUSES).toContain(s.status);
  });

  it("names every suite, including the ones that did not run", () => {
    expect(evidence.suites.length).toBeGreaterThan(3);
    for (const s of evidence.suites) {
      expect(s.label.length).toBeGreaterThan(0);
      // A suite that did not run must say why, not just go quiet.
      if (s.status === "not_run") expect(s.reason?.length).toBeGreaterThan(0);
      else expect(s.detail?.length).toBeGreaterThan(0);
    }
  });

  it("records the E2E suite as not run rather than omitting it", () => {
    const e2e = evidence.suites.find((s) => s.id === "e2e");
    expect(e2e?.status).toBe("not_run");
  });

  it("leaks no secret, path or environment value", () => {
    const text = JSON.stringify(evidence);
    for (const forbidden of [
      "RESEND_API_KEY",
      "TURNSTILE_SECRET",
      "RATE_LIMIT_SALT",
      "ANTHROPIC_API_KEY",
      "C:\\Users",
      "/home/runner",
      "sk-",
    ])
      expect(text).not.toContain(forbidden);
  });
});

describe("summarise — 未実施を PASS に数えない", () => {
  it("counts each status separately", () => {
    const data = record({
      suites: [
        suite({ id: "a", status: "passed" }),
        suite({ id: "b", status: "failed", failed: 3 }),
        suite({ id: "c", status: "not_run", detail: undefined, reason: "x" }),
        suite({ id: "d", status: "measured" }),
      ],
    });
    const s = summarise(data);
    expect(s).toMatchObject({
      passed: 1,
      failed: 1,
      notRun: 1,
      measured: 1,
      total: 4,
    });
  });

  it("never folds a not-run suite into the passed count — O10", () => {
    const data = record({
      suites: [suite({ id: "a", status: "not_run", reason: "未実行" })],
    });
    expect(summarise(data).passed).toBe(0);
    expect(summarise(data).notRun).toBe(1);
  });

  it("flags a record taken with uncommitted changes", () => {
    expect(summarise(record({ dirty: true })).dirty).toBe(true);
    expect(summarise(record({ dirty: false })).dirty).toBe(false);
  });

  it("flags a record that has gone stale", () => {
    const now = Date.parse("2026-09-23T02:00:00.000Z");
    const fresh = summarise(record(), now);
    expect(fresh.stale).toBe(false);
    expect(fresh.ageInDays).toBe(0);

    const old = summarise(
      record({ generatedAt: "2026-06-01T02:00:00.000Z" }),
      now,
    );
    expect(old.stale).toBe(true);
    expect(old.ageInDays).toBeGreaterThan(STALE_AFTER_DAYS);
  });
});

describe("表示のための整形", () => {
  it("renders every status as a word, not only a colour — U04", () => {
    for (const status of SUITE_STATUSES)
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
    expect(STATUS_LABELS.not_run).toBe("未実施");
  });

  it("formats a timestamp in JST", () => {
    // 2026-09-23T02:00Z is 11:00 the same day in JST.
    expect(formatStamp("2026-09-23T02:00:00.000Z")).toBe(
      "2026-09-23 11:00 JST",
    );
  });

  it("shows a dash rather than an invented date when there is none", () => {
    expect(formatStamp(null)).toBe("—");
    expect(formatStamp("not-a-date")).toBe("—");
  });

  it("returns null for an unreadable age instead of a number", () => {
    expect(ageInDays("not-a-date")).toBeNull();
  });
});
