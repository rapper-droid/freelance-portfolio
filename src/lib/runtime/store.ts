import type { EffectRecord, Run, RunStatus } from "./types";

/**
 * Run persistence (指示書 §14, O01–O03).
 *
 * A run has to survive the browser closing. It is stored on the state backend
 * the contact form already uses — Upstash REST on Netlify, a Durable Object on
 * Workers — rather than in a new database, so this repository keeps one
 * persistence story instead of two (指示書 §13).
 *
 * `localStorage` is never the record of a real customer's work. The sample
 * mode uses `MemoryRunStore` because a sample is not real work; anything above
 * `sample` uses the backend.
 */

export interface RunStore {
  get(tenantId: string, runId: string): Promise<Run | null>;
  put(run: Run): Promise<void>;
  /**
   * Appends effects and recomputes status. Separate from `put` because it must
   * be safe to call twice: a resumed run replays this with effects it has
   * already recorded.
   */
  appendEffects(
    tenantId: string,
    runId: string,
    effects: readonly EffectRecord[],
    status: RunStatus,
    atIso: string,
  ): Promise<Run | null>;
  list(tenantId: string, limit?: number): Promise<Run[]>;
}

const key = (tenantId: string, runId: string) => `tw:run:${tenantId}:${runId}`;
const indexKey = (tenantId: string) => `tw:runs:${tenantId}`;

/** Runs are kept for 30 days, matching the retention stated to users. */
export const RUN_TTL_SECONDS = 30 * 86_400;

export type StateCommand = (
  ...command: (string | number)[]
) => Promise<unknown>;

/**
 * Backed by the shared state provider. Values are JSON; nothing here writes a
 * message body or an address into a log line.
 */
export class StateBackedRunStore implements RunStore {
  constructor(private readonly command: StateCommand) {}

  async get(tenantId: string, runId: string): Promise<Run | null> {
    const raw = await this.command("GET", key(tenantId, runId));
    if (!raw) return null;
    try {
      return JSON.parse(String(raw)) as Run;
    } catch {
      // A corrupt record is reported as absent rather than crashing a page;
      // the run can be rebuilt from its input.
      return null;
    }
  }

  async put(run: Run): Promise<void> {
    await this.command(
      "SET",
      key(run.tenantId, run.runId),
      JSON.stringify(run),
      "EX",
      RUN_TTL_SECONDS,
    );
    await this.command("LPUSH", indexKey(run.tenantId), run.runId);
    await this.command("LTRIM", indexKey(run.tenantId), 0, 199);
    await this.command("EXPIRE", indexKey(run.tenantId), RUN_TTL_SECONDS);
  }

  async appendEffects(
    tenantId: string,
    runId: string,
    effects: readonly EffectRecord[],
    status: RunStatus,
    atIso: string,
  ): Promise<Run | null> {
    const run = await this.get(tenantId, runId);
    if (!run) return null;
    const merged = mergeEffects(run.effects, effects);
    const next: Run = {
      ...run,
      effects: merged,
      status,
      updatedAt: atIso,
      timeline: [
        ...run.timeline,
        {
          at: atIso,
          event: "executed",
          detail: describeEffects(effects),
        },
      ],
    };
    await this.put(next);
    return next;
  }

  async list(tenantId: string, limit = 20): Promise<Run[]> {
    const ids = await this.command("LRANGE", indexKey(tenantId), 0, limit - 1);
    if (!Array.isArray(ids)) return [];
    const runs: Run[] = [];
    for (const id of ids) {
      const run = await this.get(tenantId, String(id));
      if (run && !runs.some((r) => r.runId === run.runId)) runs.push(run);
    }
    return runs;
  }
}

/** For the public sample and for tests. Nothing here outlives the process. */
export class MemoryRunStore implements RunStore {
  private readonly runs = new Map<string, Run>();

  async get(tenantId: string, runId: string): Promise<Run | null> {
    return this.runs.get(key(tenantId, runId)) ?? null;
  }

  async put(run: Run): Promise<void> {
    this.runs.set(key(run.tenantId, run.runId), run);
  }

  async appendEffects(
    tenantId: string,
    runId: string,
    effects: readonly EffectRecord[],
    status: RunStatus,
    atIso: string,
  ): Promise<Run | null> {
    const run = await this.get(tenantId, runId);
    if (!run) return null;
    const next: Run = {
      ...run,
      effects: mergeEffects(run.effects, effects),
      status,
      updatedAt: atIso,
      timeline: [
        ...run.timeline,
        { at: atIso, event: "executed", detail: describeEffects(effects) },
      ],
    };
    await this.put(next);
    return next;
  }

  async list(tenantId: string, limit = 20): Promise<Run[]> {
    return [...this.runs.values()]
      .filter((r) => r.tenantId === tenantId)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, limit);
  }
}

/**
 * Merges by idempotency key, keeping the earlier record.
 *
 * A `succeeded` effect is never overwritten by a later `skipped` replay of the
 * same key: the first record is the one that describes what reached the
 * outside world, and losing it would make a resumed run look like it never
 * sent anything (指示書 O03).
 */
export function mergeEffects(
  existing: readonly EffectRecord[],
  incoming: readonly EffectRecord[],
): EffectRecord[] {
  const merged = [...existing];
  for (const effect of incoming) {
    const at = merged.findIndex(
      (e) => e.idempotencyKey === effect.idempotencyKey,
    );
    if (at === -1) {
      merged.push(effect);
      continue;
    }
    const kept = merged[at];
    if (kept.status === "succeeded" || kept.status === "outcome_unknown")
      continue;
    merged[at] = effect;
  }
  return merged;
}

const describeEffects = (effects: readonly EffectRecord[]) => {
  const counts = new Map<string, number>();
  for (const e of effects)
    counts.set(e.status, (counts.get(e.status) ?? 0) + 1);
  return (
    [...counts.entries()]
      .map(([status, n]) => `${STATUS_LABELS[status] ?? status} ${n} 件`)
      .join("、") || "実行対象なし"
  );
};

const STATUS_LABELS: Record<string, string> = {
  succeeded: "実行済み",
  failed: "失敗",
  outcome_unknown: "結果不明",
  skipped: "未実行",
};

/**
 * The status a run should carry after a round of execution. Derived from the
 * effects rather than tracked separately, so the two cannot drift apart
 * (指示書 O10: 失敗・未実施を隠して完了率を上げない).
 */
export function statusAfterEffects(
  effects: readonly EffectRecord[],
): RunStatus {
  if (!effects.length) return "awaiting_approval";
  if (effects.some((e) => e.status === "outcome_unknown"))
    return "outcome_unknown";
  const failed = effects.some((e) => e.status === "failed");
  const succeeded = effects.some((e) => e.status === "succeeded");
  if (failed) return succeeded ? "partially_failed" : "failed";
  if (effects.every((e) => e.status === "skipped")) return "awaiting_approval";
  return "completed";
}
