import { createHash } from "node:crypto";

/**
 * Hashing and key derivation for the runtime. Everything here is
 * deterministic: the same input always produces the same key, which is what
 * makes a retry safe to run twice (指示書 §15).
 */

/** Stable stringify: object key order never changes a hash. */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object")
    return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return (
    "{" +
    entries.map(([k, v]) => JSON.stringify(k) + ":" + canonical(v)).join(",") +
    "}"
  );
}

export function hash(value: unknown): string {
  return createHash("sha256")
    .update(canonical(value))
    .digest("hex")
    .slice(0, 32);
}

/**
 * The key an EffectGateway hands to the provider. It deliberately includes the
 * payload hash: editing an approved reply produces a different key, so the
 * edited version cannot ride on the original send's idempotency window.
 */
export function idempotencyKey(parts: {
  tenantId: string;
  runId: string;
  actionId: string;
  payloadHash: string;
}): string {
  return "tw-" + hash(parts);
}

/** Run ids carry the workflow so a stray id is obvious in a log. */
export function runId(workflow: string, seed: unknown): string {
  return workflow + "-" + hash(seed).slice(0, 16);
}

export function evidenceId(
  sourceRef: string,
  start: number,
  end: number,
): string {
  return "ev-" + hash({ sourceRef, start, end }).slice(0, 12);
}
