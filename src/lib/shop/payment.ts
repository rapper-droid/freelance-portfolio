import { hash } from "@/lib/runtime/ids";
import type { Money } from "@/lib/runtime/rules/money";
import type { PaymentState } from "./types";

/**
 * The payment simulator (指示書 §12「決済の境界」).
 *
 * No card details are collected and no provider is contacted. The point is to
 * make the *states* real — declined, pending, cancelled, outcome unknown — so
 * the screens and the operator console are built against what actually
 * happens rather than only the happy path.
 *
 * It is never described as a Stripe integration. Connecting a real sandbox is
 * a separate, approved step; until then this is what exists, and the UI says
 * so.
 */

export const PAYMENT_OUTCOMES = [
  "approve",
  "decline",
  "pending",
  "cancel",
  "timeout",
] as const;
export type PaymentOutcome = (typeof PAYMENT_OUTCOMES)[number];

export const OUTCOME_LABELS: Record<PaymentOutcome, string> = {
  approve: "承認される",
  decline: "拒否される",
  pending: "保留になる",
  cancel: "利用者が中断する",
  timeout: "結果が返ってこない",
};

export const OUTCOME_NOTES: Record<PaymentOutcome, string> = {
  approve: "支払済みとして記録し、注文は調理へ進めます。",
  decline: "注文は残し、支払だけ失敗として記録します。別の方法を案内します。",
  pending: "結果待ちとして記録します。確定するまで受け渡しはできません。",
  cancel: "支払を中断します。注文は未払いのまま残ります。",
  timeout:
    "結果が確認できない状態として記録します。自動で再実行はしません（二重課金を避けるため）。",
};

export type PaymentAttempt = {
  attemptId: string;
  /** Same key for the same order and amount, so a retry is recognisable. */
  idempotencyKey: string;
  orderId: string;
  amount: Money;
  outcome: PaymentOutcome;
  state: PaymentState;
  reference?: string;
  detail: string;
  atIso: string;
  /** Always false here. A real integration would set this. */
  external: false;
};

const STATE_OF: Record<PaymentOutcome, PaymentState> = {
  approve: "paid",
  decline: "declined",
  pending: "pending",
  cancel: "unpaid",
  timeout: "outcome_unknown",
};

/**
 * Runs one simulated attempt.
 *
 * `previous` matters: replaying the same key after a success returns the
 * original result rather than charging again, which is the behaviour a real
 * integration has to have and therefore the behaviour the screens must be
 * built against.
 */
export function attemptPayment(input: {
  orderId: string;
  amount: Money;
  outcome: PaymentOutcome;
  atIso: string;
  previous?: readonly PaymentAttempt[];
}): PaymentAttempt {
  const idempotencyKey =
    "pay-" +
    hash({
      orderId: input.orderId,
      minorUnits: input.amount.minorUnits,
      currency: input.amount.currency,
    }).slice(0, 16);

  const settled = input.previous?.find(
    (a) =>
      a.idempotencyKey === idempotencyKey &&
      (a.state === "paid" || a.state === "outcome_unknown"),
  );
  if (settled)
    return {
      ...settled,
      attemptId: "replay-" + settled.attemptId,
      atIso: input.atIso,
      detail:
        settled.state === "paid"
          ? "同じ注文・同じ金額の支払は完了済みです。再実行しません。"
          : "前回の結果が不明です。自動での再実行はしません。",
    };

  const state = STATE_OF[input.outcome];
  return {
    attemptId: "att-" + hash({ idempotencyKey, at: input.atIso }).slice(0, 12),
    idempotencyKey,
    orderId: input.orderId,
    amount: input.amount,
    outcome: input.outcome,
    state,
    reference:
      state === "paid"
        ? "SIM-" + hash(idempotencyKey).slice(0, 8).toUpperCase()
        : undefined,
    detail: OUTCOME_NOTES[input.outcome],
    atIso: input.atIso,
    external: false,
  };
}

/** What the screen is allowed to claim about this payment. */
export const PAYMENT_DISCLOSURE =
  "内部シミュレーターです。カード情報は入力せず、外部の決済サービスへは接続していません。実際の請求は発生しません。";
