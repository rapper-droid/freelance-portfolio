/**
 * Cost ceilings and the stop switch (指示書 §20).
 *
 * Nothing that costs money runs without passing through here first. The
 * ceilings are counted per run, per day and per month, and when one is reached
 * the answer is an honest `BUDGET_EXHAUSTED` rather than a slower retry loop.
 *
 * The counters reuse the fixed-window quota already backing the contact form
 * (`lib/abuse`), so there is one rate-limiting mechanism in this codebase
 * rather than two that disagree (指示書 §13).
 */

export type BudgetLimits = {
  /** Model calls allowed inside a single run. */
  perRun: number;
  perDay: number;
  perMonth: number;
  /** Largest input a single call may carry, in characters. */
  maxInputChars: number;
  /** Attempts after the first, for retryable upstream failures. */
  maxRetries: number;
};

export const DEFAULT_LIMITS: BudgetLimits = {
  perRun: 4,
  perDay: 200,
  perMonth: 2000,
  maxInputChars: 4000,
  maxRetries: 2,
};

export type BudgetDecision = {
  allowed: boolean;
  code: "OK" | "BUDGET_EXHAUSTED" | "RATE_LIMITED" | "KILL_SWITCH";
  message: string;
  /** Which ceiling stopped it, for the operator view. */
  limit?: keyof BudgetLimits;
};

export type QuotaFn = (
  key: string,
  maximum: number,
  seconds: number,
) => Promise<boolean>;

export type BudgetGuardOptions = {
  quota: QuotaFn;
  limits?: Partial<BudgetLimits>;
  killSwitch?: boolean;
};

/**
 * Checks every ceiling before a billable call.
 *
 * Order matters: the stop switch is checked first so an operator pressing it
 * takes effect immediately, then the narrowest window, so the message names
 * the ceiling that is actually binding.
 */
export async function checkBudget(
  scope: { tenantId: string; runId: string },
  options: BudgetGuardOptions,
): Promise<BudgetDecision> {
  const limits = { ...DEFAULT_LIMITS, ...options.limits };

  if (options.killSwitch)
    return {
      allowed: false,
      code: "KILL_SWITCH",
      message: "緊急停止が有効です。新規の実AI処理と外部実行を停止しています。",
    };

  const checks: Array<[keyof BudgetLimits, string, number, number]> = [
    ["perRun", `ai-run:${scope.runId}`, limits.perRun, 3600],
    ["perDay", `ai-day:${scope.tenantId}`, limits.perDay, 86_400],
    ["perMonth", `ai-month:${scope.tenantId}`, limits.perMonth, 2_592_000],
  ];

  for (const [limit, key, maximum, seconds] of checks) {
    let within: boolean;
    try {
      within = await options.quota(key, maximum, seconds);
    } catch {
      // A counter we cannot read is not permission to spend.
      return {
        allowed: false,
        code: "RATE_LIMITED",
        message: "利用量を確認できないため、実AI処理を保留しました。",
        limit,
      };
    }
    if (!within)
      return {
        allowed: false,
        code: "BUDGET_EXHAUSTED",
        message: MESSAGES[limit],
        limit,
      };
  }

  return { allowed: true, code: "OK", message: "上限内です。" };
}

const MESSAGES: Record<string, string> = {
  perRun:
    "1つの処理で実AIを呼び出せる回数の上限に達しました。処理を分けてください。",
  perDay: "本日の実AI利用上限に達しました。明日以降に再実行してください。",
  perMonth: "今月の実AI利用上限に達しました。上限の見直しが必要です。",
};

/**
 * Observed cost for one call. Recorded from what actually happened rather than
 * estimated from a price table in this repository: model prices change and a
 * hard-coded rate becomes a wrong number nobody notices (指示書 §20).
 */
export type CostRecord = {
  runId: string;
  tenantId: string;
  at: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  /** Null until the owner records the rate in effect for their contract. */
  estimatedYen: number | null;
  note: string;
};

export function costRecord(opts: {
  runId: string;
  tenantId: string;
  at: string;
  model: string;
  usage?: { input_tokens?: number; output_tokens?: number } | null;
}): CostRecord {
  return {
    runId: opts.runId,
    tenantId: opts.tenantId,
    at: opts.at,
    model: opts.model,
    inputTokens: opts.usage?.input_tokens ?? null,
    outputTokens: opts.usage?.output_tokens ?? null,
    estimatedYen: null,
    note: "単価は契約に基づき所有者が設定します。本リポジトリに固定値を持ちません。",
  };
}

/**
 * Retry policy for upstream failures. Bounded and jittered; an
 * `outcome_unknown` is never retried from here, because the safe response to
 * "we do not know" is to check, not to send again (指示書 O04, O05).
 */
export function retryDelayMs(
  attempt: number,
  limits = DEFAULT_LIMITS,
): number | null {
  if (attempt >= limits.maxRetries) return null;
  const base = 1000 * 2 ** attempt;
  return base + Math.floor(Math.random() * 250);
}
