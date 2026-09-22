import {
  approvalCovers,
  authoriseAction,
  type AuthorisationContext,
} from "./approval";
import type {
  ActionPlan,
  Approval,
  EffectRecord,
  PlannedAction,
} from "./types";

/**
 * The single place an effect leaves the system (指示書 §13 EffectGateway).
 *
 * Everything funnels through `executePlan` so there is exactly one answer to
 * "what did we actually do, and can it happen twice?". Three properties are
 * load-bearing:
 *
 * - **Already-done stays done.** A completed effect is skipped on replay by
 *   its idempotency key, so a run that failed after sending mail but before
 *   writing its ledger does not send again when it resumes (指示書 O03 / R10).
 * - **Unknown is not failed.** A timeout produces `outcome_unknown`. Nothing
 *   retries it automatically; the record carries the key needed to check with
 *   the provider first (指示書 O04).
 * - **Authorisation is re-derived here.** Even a correctly signed approval
 *   cannot execute an action the environment forbids.
 */

export type EffectHandler = (
  action: PlannedAction,
  payload: unknown,
) => Promise<{ externalId?: string; detail: string }>;

export type GatewayOptions = {
  context: AuthorisationContext;
  nowIso: string;
  /** Handlers by action kind. A kind with no handler cannot run. */
  handlers: Partial<Record<PlannedAction["kind"], EffectHandler>>;
  /** Payloads by action id, hashed into the plan and re-checked here. */
  payloads: Record<string, unknown>;
  /** Effects already recorded for this run, used to skip completed work. */
  priorEffects?: readonly EffectRecord[];
};

export type ExecutionOutcome = {
  effects: EffectRecord[];
  /** Aggregate, computed from the effects rather than tracked alongside them. */
  status: "completed" | "partially_failed" | "outcome_unknown" | "failed";
};

export async function executePlan(
  plan: ActionPlan,
  approval: Approval | null,
  options: GatewayOptions,
): Promise<ExecutionOutcome> {
  const { context, nowIso, handlers, payloads } = options;
  const prior = options.priorEffects ?? [];
  const effects: EffectRecord[] = [];

  for (const action of plan.actions) {
    const done = prior.find(
      (e) =>
        e.idempotencyKey === action.idempotencyKey &&
        (e.status === "succeeded" || e.status === "outcome_unknown"),
    );
    if (done) {
      // Replaying a run must not repeat an effect that already left, and must
      // not "retry" one whose outcome we never learned.
      effects.push({
        ...done,
        status: "skipped",
        detail:
          done.status === "succeeded"
            ? `実行済みのため再実行しません（${done.externalId ?? "記録あり"}）。`
            : "前回の結果が不明のため、自動での再実行はしません。",
        at: nowIso,
      });
      continue;
    }

    const authorisation = authoriseAction(action, context);
    if (!authorisation.executable) {
      effects.push({
        actionId: action.id,
        kind: action.kind,
        idempotencyKey: action.idempotencyKey,
        status: "skipped",
        detail: authorisation.reason,
        at: nowIso,
      });
      continue;
    }

    if (authorisation.requiresApproval) {
      if (!approval) {
        effects.push({
          actionId: action.id,
          kind: action.kind,
          idempotencyKey: action.idempotencyKey,
          status: "skipped",
          detail: "承認がないため実行しません。",
          at: nowIso,
        });
        continue;
      }
      const covered = approvalCovers(approval, action, plan, nowIso);
      if (!covered.ok) {
        effects.push({
          actionId: action.id,
          kind: action.kind,
          idempotencyKey: action.idempotencyKey,
          status: "skipped",
          detail: covered.reason,
          at: nowIso,
        });
        continue;
      }
    }

    const handler = handlers[action.kind];
    if (!handler) {
      effects.push({
        actionId: action.id,
        kind: action.kind,
        idempotencyKey: action.idempotencyKey,
        status: "skipped",
        detail: `${action.kind} の実行経路が未接続です。`,
        at: nowIso,
      });
      continue;
    }

    try {
      const result = await handler(action, payloads[action.id]);
      effects.push({
        actionId: action.id,
        kind: action.kind,
        idempotencyKey: action.idempotencyKey,
        status: "succeeded",
        externalId: result.externalId,
        detail: result.detail,
        at: nowIso,
      });
    } catch (error) {
      // A timeout means the request may well have arrived. Recording it as a
      // failure would invite a retry that sends twice.
      const unknown =
        error instanceof Error &&
        /timeout|abort|network|unknown/i.test(error.name + error.message);
      effects.push({
        actionId: action.id,
        kind: action.kind,
        idempotencyKey: action.idempotencyKey,
        status: unknown ? "outcome_unknown" : "failed",
        detail: unknown
          ? "結果が確認できませんでした。相手先の記録と照合するまで再送しません。"
          : errorDetail(error),
        at: nowIso,
      });
    }
  }

  return { effects, status: aggregate(effects) };
}

function errorDetail(error: unknown): string {
  // Never surface a provider's raw error text: it can carry request echoes.
  return error instanceof Error && error.message === "rejected"
    ? "実行先に拒否されました。"
    : "実行に失敗しました。";
}

function aggregate(
  effects: readonly EffectRecord[],
): ExecutionOutcome["status"] {
  if (effects.some((e) => e.status === "outcome_unknown"))
    return "outcome_unknown";
  const failed = effects.filter((e) => e.status === "failed").length;
  if (!failed) return "completed";
  return effects.some((e) => e.status === "succeeded")
    ? "partially_failed"
    : "failed";
}

/**
 * The handler set used wherever nothing is connected: it records what *would*
 * be done and returns no external id, so a dry run can never be mistaken for a
 * delivery. Used by the public sample and by any environment missing a
 * connector.
 */
export function dryRunHandlers(): GatewayOptions["handlers"] {
  const refuse: EffectHandler = async (action) => {
    throw new Error(`${action.kind} は未接続のため実行できません。`);
  };
  return {
    "mail.send": refuse,
    "calendar.hold": refuse,
    "calendar.confirm": refuse,
    "calendar.update": refuse,
  };
}
