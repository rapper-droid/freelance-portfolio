import { sha256Hex } from "./sha256";

/**
 * Hashing and key derivation for the runtime. Everything here is
 * deterministic: the same input always produces the same key, which is what
 * makes a retry safe to run twice (指示書 §15).
 *
 * The digest comes from `./sha256` rather than from `node:crypto`, because
 * these keys are computed in the browser too — cart lines, order references,
 * payment idempotency — and `node:crypto` is not there. The deployed build
 * failed exactly that way: adding to cart threw
 * `createHash is not a function` and the cart stayed empty, while the dev
 * server was happy. The values are identical, so nothing already derived
 * changes.
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
  return sha256Hex(canonical(value)).slice(0, 32);
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
