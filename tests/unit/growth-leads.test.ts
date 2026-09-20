import { describe, expect, it } from "vitest";
import {
  counts,
  failedGates,
  scoreTotal,
  toCwApplyOsImport,
  validateLead,
  verdict,
  type Lead,
} from "../../src/lib/growth/leads";

const openGates = {
  stillOpen: "TRUE",
  contactAllowed: "TRUE",
  withinCapability: "TRUE",
  messageFirstOk: "TRUE",
  noDuplicate: "TRUE",
  notOptedOut: "TRUE",
} as const;
const score = {
  version: 1 as const,
  fit: 30,
  clarity: 20,
  budget: 15,
  messageFirst: 15,
  schedule: 5,
  freshness: 10,
  reasons: {
    fit: "W01 と一致",
    clarity: "入出力が明記",
    budget: "予算が公開",
    messageFirst: "メッセージ可と明記",
    schedule: "締切まで2週間",
    freshness: "本日確認",
  },
};
const lead = (over: Partial<Lead> = {}): Lead => ({
  id: "L-001",
  sourceType: "open_request",
  sourceUrl: "https://crowdworks.jp/public/jobs/123456",
  title: "スマホ表示の崩れ修正",
  fetchedAt: "2026-09-20T09:00:00+09:00",
  observedFacts: ["対象は1ページ", "予算 5,000〜10,000円と記載"],
  unknowns: ["使用しているCMS"],
  offerIds: ["W01"],
  gates: { ...openGates },
  score,
  state: "SCREENED",
  ...over,
});

describe("lead gates and scoring (G17, G18, G19)", () => {
  it("treats UNKNOWN as a failed gate, never as a pass", () => {
    expect(failedGates(lead())).toEqual([]);
    const unsure = lead({
      gates: { ...openGates, messageFirstOk: "UNKNOWN" },
    });
    expect(failedGates(unsure)).toEqual(["会議・常駐が必須、または不明"]);
    expect(verdict(unsure)).toEqual({
      decision: "blocked",
      reasons: ["会議・常駐が必須、または不明"],
    });
  });
  it("keeps a high score from bypassing a gate", () => {
    const blocked = lead({ gates: { ...openGates, notOptedOut: "FALSE" } });
    expect(scoreTotal(blocked.score!)).toBe(95);
    expect(verdict(blocked).decision).toBe("blocked");
  });
  it("sorts survivors into priority / needs_review / drop", () => {
    expect(verdict(lead()).decision).toBe("priority");
    expect(
      verdict(lead({ score: { ...score, fit: 15, clarity: 10 } })).decision,
    ).toBe("needs_review");
    expect(
      verdict(lead({ score: { ...score, fit: 5, clarity: 5, budget: 0 } }))
        .decision,
    ).toBe("drop");
    expect(verdict(lead({ score: undefined })).decision).toBe("unscored");
  });
  it("refuses records without a primary source, facts or a reason for points", () => {
    expect(validateLead(lead())).toEqual([]);
    expect(validateLead(lead({ sourceUrl: "crowdworks.jp/jobs/1" }))).toContain(
      "sourceUrl が https の一次情報でない",
    );
    expect(validateLead(lead({ observedFacts: [] }))).toContain(
      "observedFacts（確認した事実）が空",
    );
    expect(
      validateLead(
        lead({ score: { ...score, reasons: { ...score.reasons, fit: "" } } }),
      ),
    ).toContain("score.fit に根拠がない");
    expect(validateLead(lead({ score: { ...score, fit: 40 } }))).toContain(
      "score.fit が 0〜30 の範囲にない",
    );
    expect(validateLead(lead({ state: "SENT" }))).toContain(
      "SENT なのに送信の記録がない",
    );
  });
  it("counts surveyed, blocked and fitting separately", () => {
    const list = [
      lead(),
      lead({ id: "L-002", gates: { ...openGates, stillOpen: "FALSE" } }),
      lead({ id: "L-003", score: { ...score, fit: 10, clarity: 10 } }),
    ];
    expect(counts(list)).toMatchObject({
      total: 3,
      blocked: 1,
      priority: 1,
      needsReview: 1,
      dropped: 0,
    });
  });
  it("hands CrowdWorks jobs to CW APPLY OS and keeps other leads out", () => {
    const text = toCwApplyOsImport([
      lead(),
      lead({ id: "L-004", sourceUrl: "https://example.test/recruit" }),
    ]);
    expect(text).toContain("https://crowdworks.jp/public/jobs/123456");
    expect(text).not.toContain("example.test");
    expect(text.split("\n---\n")).toHaveLength(1);
  });
});
