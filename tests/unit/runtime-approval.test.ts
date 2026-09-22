import { describe, expect, it, vi } from "vitest";
import {
  approvalCovers,
  authoriseAction,
  payloadHashOf,
  recordApproval,
} from "@/lib/runtime/approval";
import { executePlan } from "@/lib/runtime/gateway";
import { idempotencyKey } from "@/lib/runtime/ids";
import { mergeEffects, statusAfterEffects } from "@/lib/runtime/store";
import type {
  ActionPlan,
  EffectRecord,
  PlannedAction,
} from "@/lib/runtime/types";

/** 受け入れ基準 R09, R10, S06, S08, O03, O04, O08, O10。 */

const NOW = "2026-09-22T01:00:00.000Z";
const LATER = "2026-09-22T02:00:00.000Z";

const action = ({
  payloadHash: givenHash,
  ...over
}: Partial<PlannedAction> & {
  id: string;
  kind: PlannedAction["kind"];
}): PlannedAction => {
  // The key is always derived from the hash actually in use, so an edited
  // payload can never reuse the original send's idempotency window.
  const payloadHash = givenHash ?? payloadHashOf({ body: "初版" });
  return {
    targetRef: "mail:client@example.com",
    requiresApproval: true,
    summary: "テスト操作",
    ...over,
    payloadHash,
    idempotencyKey: idempotencyKey({
      tenantId: "t1",
      runId: "r1",
      actionId: over.id,
      payloadHash,
    }),
  };
};

const plan = (actions: PlannedAction[], version = 1): ActionPlan => ({
  tenantId: "t1",
  runId: "r1",
  version,
  inputHash: "hash",
  policyVersion: "test",
  mode: "customer_live",
  evidence: [],
  missingFields: [],
  warnings: [],
  actions,
});

const liveContext = {
  mode: "customer_live" as const,
  connectedTargets: ["mail:", "calendar:"],
  killSwitch: false,
};

describe("authoriseAction — 認可はサーバー側で再判定する", () => {
  it("ignores a plan that claims an external send needs no approval", () => {
    const sneaky = action({
      id: "a1",
      kind: "mail.send",
      requiresApproval: false,
    });
    const auth = authoriseAction(sneaky, liveContext);
    expect(auth.requiresApproval).toBe(true);
    expect(auth.executable).toBe(true);
  });

  it("lets internal records run without approval", () => {
    const auth = authoriseAction(
      action({ id: "a2", kind: "case.upsert", targetRef: "internal:case/c1" }),
      liveContext,
    );
    expect(auth.requiresApproval).toBe(false);
    expect(auth.executable).toBe(true);
  });

  it("never executes an external action in the public sample — S04", () => {
    const auth = authoriseAction(action({ id: "a3", kind: "mail.send" }), {
      ...liveContext,
      mode: "sample",
    });
    expect(auth.executable).toBe(false);
    expect(auth.reason).toContain("公開サンプル");
  });

  it("refuses an unconnected target instead of showing it as connected — A07", () => {
    const auth = authoriseAction(action({ id: "a4", kind: "mail.send" }), {
      ...liveContext,
      connectedTargets: [],
    });
    expect(auth.executable).toBe(false);
    expect(auth.reason).toContain("未接続");
  });

  it("keeps irreversible actions out of the pilot environment", () => {
    const auth = authoriseAction(action({ id: "a5", kind: "mail.send" }), {
      ...liveContext,
      mode: "private_pilot",
    });
    expect(auth.executable).toBe(false);
  });

  it("stops everything when the kill switch is on — O08", () => {
    const internal = action({
      id: "a6",
      kind: "case.upsert",
      targetRef: "internal:case/c1",
    });
    const auth = authoriseAction(internal, {
      ...liveContext,
      killSwitch: true,
    });
    expect(auth.executable).toBe(false);
  });
});

describe("recordApproval / approvalCovers — R09 承認は内容に紐づく", () => {
  const send = action({ id: "send", kind: "mail.send" });
  const current = plan([send]);

  it("binds an approval to the exact payload that was reviewed", () => {
    const result = recordApproval(current, {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["send"],
      approvedBy: "owner",
      atIso: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(approvalCovers(result.approval, send, current, NOW).ok).toBe(true);
  });

  it("refuses to send after the body was edited — R09", () => {
    const approved = recordApproval(current, {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["send"],
      approvedBy: "owner",
      atIso: NOW,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;

    const edited = action({
      id: "send",
      kind: "mail.send",
      payloadHash: payloadHashOf({ body: "編集後" }),
    });
    const editedPlan = plan([edited], 2);
    const verdict = approvalCovers(approved.approval, edited, editedPlan, NOW);
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("版");
  });

  it("refuses an approval for a different tenant — S06", () => {
    const approved = recordApproval(current, {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["send"],
      approvedBy: "owner",
      atIso: NOW,
    });
    if (!approved.ok) throw new Error("setup");
    const otherTenant = { ...current, tenantId: "t2" };
    expect(approvalCovers(approved.approval, send, otherTenant, NOW).ok).toBe(
      false,
    );
  });

  it("expires", () => {
    const approved = recordApproval(current, {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["send"],
      approvedBy: "owner",
      atIso: NOW,
      validForMinutes: 30,
    });
    if (!approved.ok) throw new Error("setup");
    const after = "2026-09-22T02:00:00.000Z"; // 60 minutes later
    expect(approvalCovers(approved.approval, send, current, after).ok).toBe(
      false,
    );
  });

  it("refuses to approve an action that is not in the plan", () => {
    const result = recordApproval(current, {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["nonexistent"],
      approvedBy: "owner",
      atIso: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("refuses an approval aimed at a stale plan version", () => {
    const result = recordApproval(plan([send], 3), {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["send"],
      approvedBy: "owner",
      atIso: NOW,
    });
    expect(result.ok).toBe(false);
  });
});

describe("executePlan — S08 承認なしに実行しない", () => {
  it("skips an approval-requiring action when no approval exists", async () => {
    const send = action({ id: "send", kind: "mail.send" });
    const handler = vi.fn();
    const outcome = await executePlan(plan([send]), null, {
      context: liveContext,
      nowIso: NOW,
      handlers: { "mail.send": handler },
      payloads: { send: {} },
    });
    expect(handler).not.toHaveBeenCalled();
    expect(outcome.effects[0].status).toBe("skipped");
    expect(outcome.effects[0].detail).toContain("承認");
  });

  it("runs internal records without an approval", async () => {
    const upsert = action({
      id: "case",
      kind: "case.upsert",
      targetRef: "internal:case/c1",
    });
    const handler = vi.fn(async () => ({ detail: "案件を更新しました。" }));
    const outcome = await executePlan(plan([upsert]), null, {
      context: liveContext,
      nowIso: NOW,
      handlers: { "case.upsert": handler },
      payloads: { case: {} },
    });
    expect(handler).toHaveBeenCalledOnce();
    expect(outcome.status).toBe("completed");
  });

  it("sends once when approved", async () => {
    const send = action({ id: "send", kind: "mail.send" });
    const current = plan([send]);
    const approved = recordApproval(current, {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["send"],
      approvedBy: "owner",
      atIso: NOW,
    });
    if (!approved.ok) throw new Error("setup");
    const handler = vi.fn(async () => ({
      externalId: "msg-1",
      detail: "送信しました。",
    }));
    const outcome = await executePlan(current, approved.approval, {
      context: liveContext,
      nowIso: NOW,
      handlers: { "mail.send": handler },
      payloads: { send: {} },
    });
    expect(handler).toHaveBeenCalledOnce();
    expect(outcome.effects[0].status).toBe("succeeded");
    expect(outcome.effects[0].externalId).toBe("msg-1");
  });
});

describe("executePlan — R10/O03 再開しても二重送信しない", () => {
  const send = action({ id: "send", kind: "mail.send" });
  const current = plan([send]);
  const approval = (() => {
    const r = recordApproval(current, {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["send"],
      approvedBy: "owner",
      atIso: NOW,
    });
    if (!r.ok) throw new Error("setup");
    return r.approval;
  })();

  it("does not re-send an effect that already succeeded", async () => {
    const prior: EffectRecord[] = [
      {
        actionId: "send",
        kind: "mail.send",
        idempotencyKey: send.idempotencyKey,
        status: "succeeded",
        externalId: "msg-1",
        detail: "送信済み",
        at: NOW,
      },
    ];
    const handler = vi.fn();
    const outcome = await executePlan(current, approval, {
      context: liveContext,
      nowIso: LATER,
      handlers: { "mail.send": handler },
      payloads: { send: {} },
      priorEffects: prior,
    });
    expect(handler).not.toHaveBeenCalled();
    expect(outcome.effects[0].status).toBe("skipped");
    expect(outcome.effects[0].detail).toContain("実行済み");
  });

  it("does not automatically retry an effect whose outcome is unknown — O04", async () => {
    const prior: EffectRecord[] = [
      {
        actionId: "send",
        kind: "mail.send",
        idempotencyKey: send.idempotencyKey,
        status: "outcome_unknown",
        detail: "タイムアウト",
        at: NOW,
      },
    ];
    const handler = vi.fn();
    const outcome = await executePlan(current, approval, {
      context: liveContext,
      nowIso: LATER,
      handlers: { "mail.send": handler },
      payloads: { send: {} },
      priorEffects: prior,
    });
    expect(handler).not.toHaveBeenCalled();
    expect(outcome.effects[0].detail).toContain("結果が不明");
  });

  it("records a timeout as outcome_unknown, not as a failure", async () => {
    const handler = vi.fn(async () => {
      const error = new Error("The operation timed out");
      error.name = "TimeoutError";
      throw error;
    });
    const outcome = await executePlan(current, approval, {
      context: liveContext,
      nowIso: NOW,
      handlers: { "mail.send": handler },
      payloads: { send: {} },
    });
    expect(outcome.effects[0].status).toBe("outcome_unknown");
    expect(outcome.status).toBe("outcome_unknown");
  });

  it("resumes the ledger write after mail already went out", async () => {
    const upsert = action({
      id: "case",
      kind: "case.upsert",
      targetRef: "internal:case/c1",
    });
    const both = plan([send, upsert]);
    const approvedBoth = recordApproval(both, {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["send"],
      approvedBy: "owner",
      atIso: NOW,
    });
    if (!approvedBoth.ok) throw new Error("setup");

    const mail = vi.fn();
    const caseHandler = vi.fn(async () => ({ detail: "案件を更新しました。" }));
    const outcome = await executePlan(both, approvedBoth.approval, {
      context: liveContext,
      nowIso: LATER,
      handlers: { "mail.send": mail, "case.upsert": caseHandler },
      payloads: { send: {}, case: {} },
      priorEffects: [
        {
          actionId: "send",
          kind: "mail.send",
          idempotencyKey: send.idempotencyKey,
          status: "succeeded",
          externalId: "msg-1",
          detail: "送信済み",
          at: NOW,
        },
      ],
    });
    expect(mail).not.toHaveBeenCalled();
    expect(caseHandler).toHaveBeenCalledOnce();
    // The already-sent mail keeps its provider id, and the ledger write that
    // failed last time now succeeds.
    expect(outcome.effects.find((e) => e.actionId === "send")).toMatchObject({
      status: "skipped",
      externalId: "msg-1",
    });
    expect(outcome.effects.find((e) => e.actionId === "case")?.status).toBe(
      "succeeded",
    );
  });

  it("reports a partial failure rather than a completion — O10", async () => {
    const upsert = action({
      id: "case",
      kind: "case.upsert",
      targetRef: "internal:case/c1",
    });
    const both = plan([upsert, send]);
    const approvedBoth = recordApproval(both, {
      tenantId: "t1",
      runId: "r1",
      planVersion: 1,
      approvedActionIds: ["send"],
      approvedBy: "owner",
      atIso: NOW,
    });
    if (!approvedBoth.ok) throw new Error("setup");
    const outcome = await executePlan(both, approvedBoth.approval, {
      context: liveContext,
      nowIso: NOW,
      handlers: {
        "case.upsert": async () => ({ detail: "更新しました。" }),
        "mail.send": async () => {
          throw new Error("rejected");
        },
      },
      payloads: { case: {}, send: {} },
    });
    expect(outcome.status).toBe("partially_failed");
  });

  it("does not leak a provider's raw error text", async () => {
    const outcome = await executePlan(current, approval, {
      context: liveContext,
      nowIso: NOW,
      handlers: {
        "mail.send": async () => {
          throw new Error("API key sk-live-SECRET is invalid");
        },
      },
      payloads: { send: {} },
    });
    expect(outcome.effects[0].detail).not.toContain("sk-live");
  });
});

describe("effect bookkeeping", () => {
  const base: EffectRecord = {
    actionId: "send",
    kind: "mail.send",
    idempotencyKey: "k1",
    status: "succeeded",
    externalId: "msg-1",
    detail: "送信済み",
    at: NOW,
  };

  it("never overwrites a succeeded effect with a later skip", () => {
    const merged = mergeEffects(
      [base],
      [{ ...base, status: "skipped", detail: "再実行しません", at: LATER }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe("succeeded");
  });

  it("replaces a failed effect when a retry succeeds", () => {
    const failed: EffectRecord = { ...base, status: "failed" };
    const merged = mergeEffects([failed], [{ ...base, at: LATER }]);
    expect(merged[0].status).toBe("succeeded");
  });

  it("derives the run status from the effects", () => {
    expect(statusAfterEffects([])).toBe("awaiting_approval");
    expect(statusAfterEffects([base])).toBe("completed");
    expect(
      statusAfterEffects([
        base,
        { ...base, idempotencyKey: "k2", status: "failed" },
      ]),
    ).toBe("partially_failed");
    expect(statusAfterEffects([{ ...base, status: "outcome_unknown" }])).toBe(
      "outcome_unknown",
    );
    expect(statusAfterEffects([{ ...base, status: "skipped" }])).toBe(
      "awaiting_approval",
    );
  });
});
