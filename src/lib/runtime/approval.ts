import { hash } from "./ids";
import {
  isIrreversible,
  type ActionKind,
  type ActionPlan,
  type Approval,
  type ExecutionMode,
  type PlannedAction,
} from "./types";

/**
 * Who may do what, decided server-side (指示書 §15).
 *
 * The planner — and behind it, possibly a model — proposes
 * `requiresApproval`. This module ignores that proposal and recomputes the
 * answer from facts the request cannot influence: the execution mode, the kind
 * of action, and whether the target is actually connected. An extraction that
 * politely asks to skip approval gets the same answer as one that does not.
 */

export type AuthorisationContext = {
  mode: ExecutionMode;
  /** Connectors the owner has actually configured, by target prefix. */
  connectedTargets: readonly string[];
  /** A run-wide stop. Blocks every effect, reversible or not. */
  killSwitch: boolean;
};

export type Authorisation = {
  actionId: string;
  /** The value the gateway reads. The planner's proposal is not consulted. */
  requiresApproval: boolean;
  /** False when the effect cannot run here at all, whatever anyone approves. */
  executable: boolean;
  reason: string;
};

/**
 * Internal records we can compensate. Everything else leaves the system and
 * is treated as permanent (指示書 §15: メールは取り消せないものとして扱う).
 */
const INTERNAL_KINDS: readonly ActionKind[] = [
  "case.upsert",
  "reply.draft",
  "report.generate",
  "artifact.store",
];

export function authoriseAction(
  action: PlannedAction,
  context: AuthorisationContext,
): Authorisation {
  if (context.killSwitch)
    return {
      actionId: action.id,
      requiresApproval: true,
      executable: false,
      reason: "緊急停止が有効です。外部操作も内部更新も行いません。",
    };

  if (INTERNAL_KINDS.includes(action.kind))
    return {
      actionId: action.id,
      requiresApproval: false,
      executable: true,
      reason: "内部記録のため、承認なしで作成します（外部へは出ません）。",
    };

  // Anything past this point reaches outside.
  if (context.mode === "sample")
    return {
      actionId: action.id,
      requiresApproval: true,
      executable: false,
      reason:
        "公開サンプルでは外部操作を実行しません。実行済みとは表示しません。",
    };

  const connected = context.connectedTargets.some((t) =>
    action.targetRef.startsWith(t),
  );
  if (!connected)
    return {
      actionId: action.id,
      requiresApproval: true,
      executable: false,
      reason: `接続先 ${action.targetRef} が未接続です。連携済みとは表示しません。`,
    };

  if (isIrreversible(action.kind) && context.mode !== "customer_live")
    return {
      actionId: action.id,
      requiresApproval: true,
      executable: false,
      reason: "取り消せない操作は、顧客環境（CUSTOMER LIVE）でのみ実行します。",
    };

  return {
    actionId: action.id,
    requiresApproval: true,
    executable: true,
    reason: "人の承認後に実行します。",
  };
}

export function authorisePlan(
  plan: ActionPlan,
  context: AuthorisationContext,
): Authorisation[] {
  return plan.actions.map((a) => authoriseAction(a, context));
}

export type ApprovalRequest = {
  tenantId: string;
  runId: string;
  planVersion: number;
  approvedActionIds: string[];
  approvedBy: string;
  atIso: string;
  /** How long the approval stays usable. Short by design. */
  validForMinutes?: number;
};

/**
 * Records an approval bound to the exact bytes that were reviewed.
 *
 * The payload hashes are copied out of the plan at approval time. If the reply
 * is edited afterwards the plan's hash changes, `approvalCovers` stops
 * matching, and the send is refused — which is criterion R09 and the reason
 * approval is stored as hashes rather than a boolean.
 */
export function recordApproval(
  plan: ActionPlan,
  request: ApprovalRequest,
): { ok: true; approval: Approval } | { ok: false; reason: string } {
  if (plan.tenantId !== request.tenantId || plan.runId !== request.runId)
    return { ok: false, reason: "承認の対象が一致しません。" };
  if (plan.version !== request.planVersion)
    return {
      ok: false,
      reason: `承認対象は版 ${request.planVersion} ですが、現在の版は ${plan.version} です。`,
    };

  const byId = new Map(plan.actions.map((a) => [a.id, a]));
  const payloadHashes: Record<string, string> = {};
  for (const id of request.approvedActionIds) {
    const action = byId.get(id);
    if (!action)
      return {
        ok: false,
        reason: `操作 ${id} は現在の計画に含まれていません。`,
      };
    payloadHashes[id] = action.payloadHash;
  }

  const minutes = request.validForMinutes ?? 30;
  return {
    ok: true,
    approval: {
      tenantId: request.tenantId,
      runId: request.runId,
      planVersion: request.planVersion,
      payloadHashes,
      approvedActionIds: [...request.approvedActionIds],
      approvedBy: request.approvedBy,
      approvedAt: request.atIso,
      expiresAt: new Date(
        Date.parse(request.atIso) + minutes * 60_000,
      ).toISOString(),
    },
  };
}

/**
 * Whether a given action may run right now under a given approval.
 *
 * Checks tenant, run, plan version, membership, payload identity and expiry —
 * in that order, so the reason returned names the first thing that is wrong
 * rather than a generic refusal.
 */
export function approvalCovers(
  approval: Approval,
  action: PlannedAction,
  plan: ActionPlan,
  nowIso: string,
): { ok: boolean; reason: string } {
  if (approval.tenantId !== plan.tenantId)
    return { ok: false, reason: "別テナントの承認です。" };
  if (approval.runId !== plan.runId)
    return { ok: false, reason: "別の処理に対する承認です。" };
  if (approval.planVersion !== plan.version)
    return {
      ok: false,
      reason: `承認は版 ${approval.planVersion} に対するもので、現在は版 ${plan.version} です。承認を取り直してください。`,
    };
  if (!approval.approvedActionIds.includes(action.id))
    return { ok: false, reason: "この操作は承認されていません。" };
  if (approval.payloadHashes[action.id] !== action.payloadHash)
    return {
      ok: false,
      reason: "承認後に内容が変更されています。旧承認では実行できません。",
    };
  if (Date.parse(approval.expiresAt) <= Date.parse(nowIso))
    return { ok: false, reason: "承認の有効期限が切れています。" };
  return { ok: true, reason: "承認済みです。" };
}

/** Editing a payload changes its hash, which is what invalidates an approval. */
export const payloadHashOf = (payload: unknown) => hash(payload);
