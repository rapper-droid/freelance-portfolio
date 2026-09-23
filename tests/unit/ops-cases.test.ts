import { describe, expect, it } from "vitest";
import {
  approveDraft,
  assign,
  caseTotals,
  emptyOpsState,
  fromTicket,
  linkCustomer,
  mergedCases,
  newCase,
  receivedLabel,
  saveDraft,
  ticketArrivalIso,
  seedCases,
  setStatus,
  suggestDraft,
  withdrawApproval,
} from "@/lib/ops/cases";
import { migrateOps, OPS_SCHEMA_VERSION } from "@/lib/ops/store";
import type { OpsCase } from "@/lib/ops/types";

/** 受け入れ基準 Q18, Q35（指示書 §14, §18）。 */

const NOW = "2026-09-23T01:00:00.000Z";
const LATER = "2026-09-23T02:00:00.000Z";

const anEnquiry = (over: Partial<Parameters<typeof newCase>[0]> = {}) =>
  newCase({
    customerName: "サンプル商店",
    subject: "フォームが動かない",
    body: "本日から送信時にエラーが出ています。至急確認をお願いします。",
    receivedAtIso: NOW,
    source: "relay",
    ...over,
  });

describe("classification — 文面から決まり、入力では決まらない", () => {
  it("reads the category and urgency out of the text", () => {
    const urgent = anEnquiry();
    expect(urgent.category).toBe("不具合");
    expect(urgent.urgency).toBe("高");

    const billing = anEnquiry({
      subject: "請求書の宛名変更",
      body: "先月の請求書の宛名を変更してください。",
    });
    expect(billing.category).toBe("請求");
    expect(billing.urgency).toBe("通常");
  });

  it("files a new case unowned, unanswered and unapproved", () => {
    const filed = anEnquiry();
    expect(filed.owner).toBe("未割当");
    expect(filed.status).toBe("未対応");
    expect(filed.draft).toBe("");
    expect(filed.approvedAtIso).toBeUndefined();
    expect(filed.reference).toMatch(/^T-[0-9A-F]{6}$/);
  });
});

describe("approval — 編集したら確認済みは外れる", () => {
  it("refuses to approve nothing", () => {
    const result = approveDraft(anEnquiry(), LATER);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("下書きがありません");
  });

  it("approves a draft a person wrote", () => {
    const drafted = saveDraft(anEnquiry(), "確認して折り返します。", NOW);
    const result = approveDraft(drafted, LATER);
    expect(result.ok).toBe(true);
    expect(result.case.approvedAtIso).toBe(LATER);
  });

  it("drops the approval the moment the draft changes", () => {
    // The whole point of the record: an approved reply that was then edited
    // has not been approved, and must not be presented as though it was.
    const approved = approveDraft(
      saveDraft(anEnquiry(), "確認して折り返します。", NOW),
      LATER,
    ).case;
    const edited = saveDraft(approved, "やはり明日ご連絡します。", LATER);
    expect(edited.approvedAtIso).toBeUndefined();
    expect(edited.history.at(-1)?.detail).toContain("確認済みを解除");
  });

  it("collapses a run of edits into one entry", () => {
    // Typing is one edit. Forty history rows for one sentence would make the
    // record unreadable, which is the only thing it is for.
    let c = anEnquiry();
    for (const text of ["確", "確認", "確認し", "確認します。"])
      c = saveDraft(c, text, LATER);
    expect(c.draft).toBe("確認します。");
    expect(c.history.filter((h) => h.event === "draft")).toHaveLength(1);
  });

  it("keeps the entry that revoked an approval", () => {
    const approved = approveDraft(
      saveDraft(anEnquiry(), "案", NOW),
      LATER,
    ).case;
    const edited = saveDraft(approved, "案を直した", LATER);
    const again = saveDraft(edited, "案をもう一度直した", LATER);
    const drafts = again.history.filter((h) => h.event === "draft");
    expect(drafts).toHaveLength(3);
    expect(drafts[1].detail).toContain("解除");
  });

  it("never approves what the rules wrote on their own", () => {
    const suggested = suggestDraft(anEnquiry(), NOW);
    expect(suggested.draft).not.toBe("");
    expect(suggested.approvedAtIso).toBeUndefined();
  });

  it("can be withdrawn, and says so", () => {
    const approved = approveDraft(
      saveDraft(anEnquiry(), "下書き", NOW),
      LATER,
    ).case;
    const back = withdrawApproval(approved, LATER);
    expect(back.approvedAtIso).toBeUndefined();
    expect(back.history.at(-1)?.event).toBe("withdrawn");
  });
});

describe("status and ownership — 変更は記録に残る", () => {
  it("allows reopening a finished case", () => {
    const done = setStatus(anEnquiry(), "完了", NOW).case;
    expect(setStatus(done, "対応中", LATER).ok).toBe(true);
    // But not straight back to untouched: that would erase that it was worked.
    expect(setStatus(done, "未対応", LATER).ok).toBe(false);
  });

  it("does not record a change that did not happen", () => {
    const filed = anEnquiry();
    expect(setStatus(filed, "未対応", LATER).case.history).toHaveLength(1);
    expect(assign(filed, "未割当", LATER).history).toHaveLength(1);
  });

  it("records who took it", () => {
    const owned = assign(anEnquiry(), "担当B", LATER);
    expect(owned.owner).toBe("担当B");
    expect(owned.history.at(-1)?.detail).toContain("担当B");
  });
});

describe("the customer list and the inbox are the same record", () => {
  it("links a case to a customer row", () => {
    const linked = linkCustomer(anEnquiry(), "C007", "新規サンプル", LATER);
    expect(linked.customerId).toBe("C007");
    expect(linked.customerName).toBe("新規サンプル");
  });

  it("counts once, for every screen", () => {
    const cases: OpsCase[] = [
      anEnquiry(),
      assign(anEnquiry({ subject: "契約更新" }), "担当A", NOW),
      setStatus(anEnquiry({ subject: "領収書" }), "完了", NOW).case,
      saveDraft(anEnquiry({ subject: "見積もり" }), "下書き", NOW),
    ];
    const totals = caseTotals(cases);
    expect(totals.total).toBe(4);
    expect(totals.open).toBe(3);
    expect(totals.awaitingApproval).toBe(1);
    expect(totals.unassigned).toBe(3);
  });
});

describe("the sample and the visitor's own work merge", () => {
  it("shows the sample when nothing has been done", () => {
    const state = emptyOpsState(NOW, "s1");
    expect(mergedCases(state, NOW)).toHaveLength(seedCases(NOW).length);
  });

  it("keeps a seeded case's identity across reloads", () => {
    // The stamp moves with the calendar; the id must not, or every reload
    // would orphan the edits made to it.
    const a = seedCases("2026-09-23T01:00:00.000Z")[0];
    const b = seedCases("2027-01-05T01:00:00.000Z")[0];
    expect(a.caseId).toBe(b.caseId);
    expect(receivedLabel(a, NOW)).not.toBe(receivedLabel(b, NOW));
  });

  it("replaces a sample case with the edited copy rather than showing both", () => {
    const seeded = seedCases(NOW)[0];
    const edited = assign(seeded, "担当C", LATER);
    const state = { ...emptyOpsState(NOW, "s1"), cases: [edited] };
    const merged = mergedCases(state, NOW);
    expect(merged).toHaveLength(seedCases(NOW).length);
    expect(merged.find((c) => c.caseId === seeded.caseId)?.owner).toBe("担当C");
  });

  it("puts what the visitor filed above the sample", () => {
    const filed = anEnquiry();
    const state = { ...emptyOpsState(NOW, "s1"), cases: [filed] };
    const merged = mergedCases(state, NOW);
    expect(merged[0].caseId).toBe(filed.caseId);
    expect(merged).toHaveLength(seedCases(NOW).length + 1);
  });

  it("keeps a dismissed sample case dismissed", () => {
    const seeded = seedCases(NOW)[0];
    const state = {
      ...emptyOpsState(NOW, "s1"),
      dismissedSeedIds: [seeded.caseId],
    };
    expect(mergedCases(state, NOW)).toHaveLength(seedCases(NOW).length - 1);
  });
});

describe("sandbox storage — 更新で保存を消さない", () => {
  it("carries a visitor's work across a schema bump", () => {
    const filed = anEnquiry();
    const stored = {
      schemaVersion: OPS_SCHEMA_VERSION - 1,
      sandboxId: "abc",
      cases: [filed],
      dismissedSeedIds: [],
      createdAtIso: NOW,
      updatedAtIso: NOW,
    };
    const result = migrateOps(stored, LATER);
    expect(result.state.cases).toHaveLength(1);
    expect(result.state.sandboxId).toBe("abc");
    expect(result.note).toContain("引き継いで");
  });

  it("says nothing about an empty sandbox it migrated", () => {
    const result = migrateOps(
      {
        schemaVersion: 0,
        cases: [],
        dismissedSeedIds: [],
      },
      NOW,
    );
    expect(result.note).toBeUndefined();
  });

  it("does not rewrite data a newer build wrote", () => {
    const result = migrateOps(
      { schemaVersion: OPS_SCHEMA_VERSION + 1, cases: [anEnquiry()] },
      NOW,
    );
    expect(result.state.cases).toHaveLength(0);
    expect(result.note).toContain("新しい版");
  });

  it("replaces unreadable data instead of throwing on every render", () => {
    for (const junk of ["nonsense", null, 42, [], { cases: "no" }]) {
      const result = migrateOps(junk, NOW);
      expect(result.state.cases).toEqual([]);
      expect(result.state.schemaVersion).toBe(OPS_SCHEMA_VERSION);
      expect(result.state.sandboxId).not.toBe("");
    }
  });
});

describe("fromTicket — 見本の並びを崩さない", () => {
  it("keeps the sample's own status and owner", () => {
    const ticket = {
      id: 1005,
      name: "デモラボ",
      subject: "領収書の発行について",
      body: "支払済みの料金について領収書を発行いただけますか。",
      date: "09/21 11:15",
      status: "完了" as const,
      owner: "担当B",
    };
    const c = fromTicket(ticket, NOW);
    expect(c.status).toBe("完了");
    expect(c.owner).toBe("担当B");
    expect(c.category).toBe("請求");
    expect(receivedLabel(c, NOW)).toBe("09/21 11:15");
    expect(c.receivedAtIso).toBe("2026-09-21T02:15:00.000Z");
  });

  it("says 本日 for something that arrived today", () => {
    const c = fromTicket(
      {
        id: 1,
        name: "本日の見本",
        subject: "確認",
        body: "確認をお願いします。",
        date: "09/23 10:30",
        status: "未対応" as const,
        owner: "未割当",
      },
      NOW,
    );
    expect(receivedLabel(c, NOW)).toBe("本日 10:30");
  });

  it("reads December, seen on New Year's Day, as last year", () => {
    // Dating it in the current year would put the whole sample eleven
    // months in the future.
    const newYear = "2027-01-01T01:00:00.000Z";
    expect(ticketArrivalIso("12/28 09:00", newYear)).toBe(
      "2026-12-28T00:00:00.000Z",
    );
  });

  it("keeps a stamp later the same day as today", () => {
    // The sample's times are fixed, so before 10:30 the 10:30 ticket is
    // slightly ahead of now. That is still today, not a year ago.
    const morning = "2026-09-22T23:00:00.000Z"; // 08:00 JST
    expect(ticketArrivalIso("09/23 10:30", morning)).toBe(
      "2026-09-23T01:30:00.000Z",
    );
  });

  it("falls back to now rather than to an invalid date", () => {
    expect(ticketArrivalIso("nonsense", NOW)).toBe(NOW);
    expect(ticketArrivalIso("", NOW)).toBe(NOW);
  });
});
