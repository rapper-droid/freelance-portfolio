import { executePlan, type GatewayOptions } from "../runtime/gateway";
import type { AuthorisationContext } from "../runtime/approval";
import type {
  ActionKind,
  ActionPlan,
  Approval,
  EffectRecord,
  PlannedAction,
} from "../runtime/types";

/**
 * The adapters the technical console executes against (指示書 §17).
 *
 * The point of the screen is the three outcomes an engineer has to design for,
 * and only one of them is success:
 *
 *   succeeded       — it happened, and we have the provider's id.
 *   failed          — it did not happen. Safe to try again.
 *   outcome_unknown — the request went out and nothing came back. Trying again
 *                     may deliver twice, so the gateway refuses to.
 *
 * Nothing here reaches the network. These are in-process functions chosen from
 * a fixed list; there is no way to hand the console a URL or a script.
 */

export type OutcomeChoice = "succeed" | "fail" | "timeout";

export type SimulatedCall = {
  actionId: string;
  kind: ActionKind;
  idempotencyKey: string;
  choice: OutcomeChoice;
  at: string;
};

/** Every call the handlers made, so the screen can show what was attempted. */
export type CallLog = { calls: SimulatedCall[] };

const message: Record<OutcomeChoice, string> = {
  succeed: "模擬アダプターが受け付けました。",
  fail: "模擬アダプターが拒否しました（安全に再実行できます）。",
  timeout:
    "応答がありませんでした。届いたかどうか分かりません（再実行は二重になりえます）。",
};

/**
 * Builds handlers for exactly the kinds in the plan.
 *
 * A kind with no handler cannot run — that is the gateway's rule, and it is
 * the reason this takes the plan rather than registering everything.
 */
export function simulatedHandlers(
  plan: ActionPlan,
  choices: Record<string, OutcomeChoice>,
  log: CallLog,
  nowIso: string,
): GatewayOptions["handlers"] {
  const handlers: GatewayOptions["handlers"] = {};
  const kinds = new Set(plan.actions.map((a) => a.kind));

  for (const kind of kinds)
    handlers[kind] = async (action: PlannedAction) => {
      const choice = choices[action.id] ?? "succeed";
      log.calls.push({
        actionId: action.id,
        kind: action.kind,
        idempotencyKey: action.idempotencyKey,
        choice,
        at: nowIso,
      });

      if (choice === "fail") throw new Error(message.fail);
      if (choice === "timeout") {
        // Thrown with the word the gateway looks for, so it records
        // `outcome_unknown` rather than `failed`. A timeout is not a refusal.
        const error = new Error(message.timeout);
        error.name = "TimeoutError";
        throw error;
      }
      return {
        externalId: `sim-${action.idempotencyKey.slice(-8)}`,
        detail: message.succeed,
      };
    };

  return handlers;
}

export type RunAttempt = {
  effects: EffectRecord[];
  status: "completed" | "partially_failed" | "outcome_unknown" | "failed";
  calls: SimulatedCall[];
  /** Actions the gateway skipped because a prior effect already covered them. */
  skipped: string[];
};

/**
 * One attempt. Pass the previous attempt's effects back in as `priorEffects`
 * and the gateway will refuse to repeat what already left — which is what the
 * retry button is demonstrating.
 */
export async function attemptRun(opts: {
  plan: ActionPlan;
  approval: Approval | null;
  payloads: Record<string, unknown>;
  context: AuthorisationContext;
  choices: Record<string, OutcomeChoice>;
  priorEffects?: readonly EffectRecord[];
  nowIso: string;
}): Promise<RunAttempt> {
  const log: CallLog = { calls: [] };
  const outcome = await executePlan(opts.plan, opts.approval, {
    context: opts.context,
    nowIso: opts.nowIso,
    handlers: simulatedHandlers(opts.plan, opts.choices, log, opts.nowIso),
    payloads: opts.payloads,
    priorEffects: opts.priorEffects,
  });

  const attempted = new Set(log.calls.map((c) => c.actionId));
  return {
    effects: outcome.effects,
    status: outcome.status,
    calls: log.calls,
    // An action with an effect but no call never reached the adapter: it was
    // either already done, or refused before it got there.
    skipped: outcome.effects
      .filter((e) => !attempted.has(e.actionId))
      .map((e) => e.actionId),
  };
}

export const outcomeLabel: Record<EffectRecord["status"], string> = {
  succeeded: "成功",
  failed: "失敗",
  outcome_unknown: "結果不明",
  skipped: "実行せず",
};

export const choiceLabel: Record<OutcomeChoice, string> = {
  succeed: "成功する",
  fail: "失敗する",
  timeout: "応答が返らない",
};
