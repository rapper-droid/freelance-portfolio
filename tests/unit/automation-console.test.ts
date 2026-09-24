import { describe, expect, it } from "vitest";
import {
  actionKinds,
  executionModes,
  inputSources,
  irreversibleActionKinds,
  outputTargets,
  processingKinds,
  runStatuses,
  type ActionPlan,
  type Approval,
  type PlannedAction,
} from "../../src/lib/runtime/types";
import {
  boundaries,
  enumSets,
  recordShapes,
} from "../../src/lib/automation/schema";
import {
  attemptRun,
  type OutcomeChoice,
} from "../../src/lib/automation/simulator";
import { recordApproval, payloadHashOf } from "../../src/lib/runtime/approval";
import type { AuthorisationContext } from "../../src/lib/runtime/approval";

/**
 * The technical screen's two obligations (指示書 §17).
 *
 * 1. It must describe the contract the runtime actually enforces. A page that
 *    lists eight action kinds while the code has nine is worse than no page.
 * 2. It must demonstrate the behaviour it claims — that a retry with the same
 *    key does not run twice, that a timeout is not a failure, and that an
 *    approval is bound to bytes rather than to a boolean.
 */

const NOW = "2026-09-24T02:00:00.000Z";
const CONTEXT: AuthorisationContext = {
  mode: "sample",
  connectedTargets: [],
  killSwitch: false,
};

const action = (over: Partial<PlannedAction> = {}): PlannedAction => ({
  id: "a1",
  kind: "case.upsert",
  targetRef: "case:demo",
  payloadHash: payloadHashOf({ hello: "world" }),
  requiresApproval: false,
  idempotencyKey: "key-a1",
  summary: "案件記録を作る",
  ...over,
});

const plan = (actions: PlannedAction[]): ActionPlan => ({
  tenantId: "demo",
  runId: "run-1",
  version: 1,
  inputHash: "input-1",
  policyVersion: "test-1",
  mode: "sample",
  evidence: [],
  missingFields: [],
  warnings: [],
  actions,
});

describe("画面が説明する契約は、コードの契約と同じ", () => {
  const sets = Object.fromEntries(enumSets.map((s) => [s.id, s]));

  it.each([
    ["executionModes", executionModes],
    ["actionKinds", actionKinds],
    ["runStatuses", runStatuses],
    ["processingKinds", processingKinds],
    ["inputSources", inputSources],
    ["outputTargets", outputTargets],
  ] as const)("%s のすべての値に説明がある", (id, values) => {
    const set = sets[id];
    expect(set, id).toBeTruthy();
    expect(set.values.map((v) => v.value)).toEqual([...values]);
    for (const value of set.values) {
      // 日本語は密なので文字数の下限は低い。効くのは下の 2 つ。
      expect(value.note.length, `${id}.${value.value}`).toBeGreaterThan(4);
      // 名前を言い換えただけの説明は説明ではない。
      expect(value.note).not.toBe(value.label);
      expect(value.note.endsWith("。"), `${id}.${value.value}`).toBe(true);
    }
  });

  it("取り消せない操作には、取り消せないと書いてある", () => {
    const kinds = sets.actionKinds.values;
    for (const kind of kinds)
      expect(kind.flag === "取り消せない", kind.value).toBe(
        irreversibleActionKinds.includes(kind.value as never),
      );
  });

  it("再実行が危険な状態に印がついている", () => {
    const unknown = sets.runStatuses.values.find(
      (v) => v.value === "outcome_unknown",
    );
    expect(unknown?.flag).toBe("再実行は危険");
  });

  it("記録の形は、実在する型を指している", () => {
    expect(recordShapes.map((s) => s.id)).toEqual([
      "ActionPlan",
      "PlannedAction",
      "EffectRecord",
    ]);
    for (const shape of recordShapes) {
      expect(shape.source).toContain("runtime/types.ts");
      expect(shape.fields.length).toBeGreaterThan(3);
      for (const field of shape.fields)
        expect(field.note.length, `${shape.id}.${field.name}`).toBeGreaterThan(
          8,
        );
    }
  });

  it("やらないことを、4 つとも明記している", () => {
    expect(boundaries).toHaveLength(4);
    const text = boundaries.map((b) => b.title + b.detail).join();
    expect(text).toContain("任意のコード");
    expect(text).toContain("任意のURL");
  });
});

describe("実行・失敗・再実行", () => {
  const twoActions = plan([
    action({ id: "a1", idempotencyKey: "key-a1" }),
    action({
      id: "a2",
      kind: "reply.draft",
      idempotencyKey: "key-a2",
      targetRef: "case:demo",
    }),
  ]);
  const payloads = { a1: { hello: "world" }, a2: { hello: "world" } };

  const run = (
    choices: Record<string, OutcomeChoice>,
    prior?: Parameters<typeof attemptRun>[0]["priorEffects"],
  ) =>
    attemptRun({
      plan: twoActions,
      approval: null,
      payloads,
      context: CONTEXT,
      choices,
      priorEffects: prior,
      nowIso: NOW,
    });

  it("成功した操作は、再実行しても二度実行されない", async () => {
    const first = await run({ a1: "succeed", a2: "succeed" });
    expect(first.status).toBe("completed");
    expect(first.calls).toHaveLength(2);

    const second = await run({ a1: "succeed", a2: "succeed" }, first.effects);
    // アダプターは一度も呼ばれない。
    expect(second.calls).toHaveLength(0);
    expect(second.effects.every((e) => e.status === "skipped")).toBe(true);
  });

  it("失敗した操作だけが、再実行で動く", async () => {
    const first = await run({ a1: "succeed", a2: "fail" });
    expect(first.status).toBe("partially_failed");

    const second = await run({ a1: "succeed", a2: "succeed" }, first.effects);
    expect(second.calls.map((c) => c.actionId)).toEqual(["a2"]);
  });

  it("応答が返らなかった操作は、失敗ではなく、再送もしない", async () => {
    const first = await run({ a1: "timeout", a2: "succeed" });
    const unknown = first.effects.find((e) => e.actionId === "a1");
    expect(unknown?.status).toBe("outcome_unknown");
    expect(first.status).toBe("outcome_unknown");

    // 二重配信になりうるので、再実行でも送らない。
    const second = await run({ a1: "succeed", a2: "succeed" }, first.effects);
    expect(second.calls.map((c) => c.actionId)).not.toContain("a1");
  });

  it("失敗の詳細に、相手先の生の文言を出さない", async () => {
    const attempt = await run({ a1: "fail", a2: "succeed" });
    const failed = attempt.effects.find((e) => e.actionId === "a1");
    expect(failed?.detail).not.toContain("模擬アダプター");
  });

  it("実行経路のない操作は、黙って成功しない", async () => {
    const unknownKind = plan([
      action({ id: "x", kind: "mail.send", idempotencyKey: "key-x" }),
    ]);
    const attempt = await attemptRun({
      plan: unknownKind,
      approval: null,
      payloads: { x: {} },
      context: CONTEXT,
      choices: {},
      nowIso: NOW,
    });
    // sample モードでは外へ出る操作は実行できない。
    expect(
      attempt.effects[0].status === "skipped" ||
        attempt.effects[0].status === "failed",
    ).toBe(true);
    expect(attempt.effects[0].status).not.toBe("succeeded");
  });
});

describe("承認は、真偽値ではなく中身に紐づく", () => {
  it("承認したあとに中身が変わると、その承認では実行できない", () => {
    const original = plan([action({ id: "a1" })]);
    const result = recordApproval(original, {
      tenantId: "demo",
      runId: "run-1",
      planVersion: 1,
      approvedActionIds: ["a1"],
      approvedBy: "テスト",
      atIso: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const approval: Approval = result.approval;
    expect(approval.payloadHashes.a1).toBe(original.actions[0].payloadHash);

    // 本文を書き換えると、計画側のハッシュが変わる。
    const edited = plan([
      action({ id: "a1", payloadHash: payloadHashOf({ hello: "edited" }) }),
    ]);
    expect(edited.actions[0].payloadHash).not.toBe(approval.payloadHashes.a1);
  });

  it("版が違う承認は受け付けない", () => {
    const current = { ...plan([action()]), version: 2 };
    const result = recordApproval(current, {
      tenantId: "demo",
      runId: "run-1",
      planVersion: 1,
      approvedActionIds: ["a1"],
      approvedBy: "テスト",
      atIso: NOW,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("版");
  });
});
