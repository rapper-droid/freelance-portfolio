/**
 * The data contract every TETSU WORKS workflow shares (指示書 §14).
 *
 * Two rules hold this file together and are enforced by the modules that
 * import it:
 *
 * 1. Extraction and authorisation are different layers. An `Extractor` may
 *    propose `requiresApproval: false`; `authoriseAction` in `approval.ts`
 *    recomputes it from the environment, the action kind and the target, and
 *    the recomputed value is the only one an `EffectGateway` reads.
 * 2. Nothing here describes what *did* happen externally. `EffectRecord` does,
 *    and it distinguishes "failed" from "we do not know" on purpose.
 */

/** Where a run is allowed to reach. Ordered from least to most reach. */
export const executionModes = [
  "sample",
  "private_pilot",
  "customer_live",
] as const;
export type ExecutionMode = (typeof executionModes)[number];

export const runStatuses = [
  "received",
  "queued",
  "processing",
  "needs_info",
  "awaiting_approval",
  "executing",
  "completed",
  "partially_failed",
  "outcome_unknown",
  "failed",
  "cancelled",
] as const;
export type RunStatus = (typeof runStatuses)[number];

/** A closed set on purpose: a planner can never invent a new kind of effect. */
export const actionKinds = [
  "case.upsert",
  "reply.draft",
  "mail.send",
  "calendar.hold",
  "calendar.confirm",
  "calendar.update",
  "report.generate",
  "artifact.store",
] as const;
export type ActionKind = (typeof actionKinds)[number];

/**
 * Effects that leave the system and cannot be taken back. Everything else is
 * an internal record we can compensate. `gateway.ts` refuses to execute any of
 * these outside `customer_live` with a live connector.
 */
export const irreversibleActionKinds: readonly ActionKind[] = [
  "mail.send",
  "calendar.confirm",
  "calendar.update",
];

/** How a value reached the plan. Shown per step in the UI (指示書 §06). */
export const processingKinds = ["deterministic", "ai", "replay"] as const;
export type ProcessingKind = (typeof processingKinds)[number];

export const inputSources = [
  "sample",
  "user_file",
  "approved_web_form",
  "connected_mailbox",
] as const;
export type InputSource = (typeof inputSources)[number];

export const outputTargets = [
  "browser",
  "test_area",
  "connected_tool",
] as const;
export type OutputTarget = (typeof outputTargets)[number];

/**
 * Where a piece of extracted information came from, as a span of the source
 * text. `quote` is kept so a reviewer can check the claim without re-reading
 * the whole message; it is a slice of the source, never a paraphrase.
 */
export type Evidence = {
  id: string;
  sourceRef: string;
  start: number;
  end: number;
  quote: string;
};

/** A value that knows where it came from and how confident we are allowed to be. */
export type Sourced<T> = {
  value: T;
  evidenceIds: string[];
  /** `derived` = computed by rules from other sourced values, not read off the text. */
  origin: "quoted" | "derived" | "default";
};

export type MissingField = {
  field: string;
  label: string;
  /** Why we cannot fill it ourselves. Shown to the reviewer verbatim. */
  reason: string;
};

export type Warning = {
  code: string;
  message: string;
  /** `blocking` warnings force `needs_info`; `advisory` ones do not. */
  severity: "advisory" | "blocking";
  evidenceIds?: string[];
};

export type PlannedAction = {
  id: string;
  kind: ActionKind;
  targetRef: string;
  payloadHash: string;
  /** Proposed by the planner; `authoriseAction` recomputes the effective value. */
  requiresApproval: boolean;
  idempotencyKey: string;
  /** Human-readable one-liner shown on the approval card. */
  summary: string;
};

export type ActionPlan = {
  tenantId: string;
  runId: string;
  version: number;
  inputHash: string;
  policyVersion: string;
  mode: ExecutionMode;
  evidence: Evidence[];
  missingFields: MissingField[];
  warnings: Warning[];
  actions: PlannedAction[];
};

export type Approval = {
  tenantId: string;
  runId: string;
  planVersion: number;
  /** Binds the approval to the exact bytes that were reviewed. */
  payloadHashes: Record<string, string>;
  approvedActionIds: string[];
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
};

/**
 * What actually happened at the boundary. `outcome_unknown` exists because a
 * timed-out send is not a failed send: re-sending it may deliver twice
 * (指示書 §15).
 */
export type EffectRecord = {
  actionId: string;
  kind: ActionKind;
  idempotencyKey: string;
  status: "succeeded" | "failed" | "outcome_unknown" | "skipped";
  /** The provider's own id, when we got one. The only safe basis for reconciliation. */
  externalId?: string;
  detail: string;
  at: string;
};

export type Run = {
  tenantId: string;
  runId: string;
  mode: ExecutionMode;
  workflow: "relay" | "daybook" | "report";
  status: RunStatus;
  inputSource: InputSource;
  createdAt: string;
  updatedAt: string;
  plan?: ActionPlan;
  approvals: Approval[];
  effects: EffectRecord[];
  /** Append-only. Every status change and every human decision lands here. */
  timeline: Array<{ at: string; event: string; detail: string }>;
};

export const isIrreversible = (kind: ActionKind) =>
  irreversibleActionKinds.includes(kind);
