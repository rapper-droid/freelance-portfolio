import { selectExtractor, type ExtractorChoice } from "../extract/registry";
import { displayValue, fieldLabel } from "../display";
import { hash, idempotencyKey, runId as makeRunId } from "../ids";
import { payloadHashOf } from "../approval";
import type {
  ActionPlan,
  ExecutionMode,
  MissingField,
  PlannedAction,
  ProcessingKind,
  Run,
  Warning,
} from "../types";
import { applyMessage, matchCase, newCase, type CaseRecord } from "./case";
import { composeReply, type ReplyDraft } from "./reply";

/**
 * RELAY end to end (指示書 §07).
 *
 * received → extract → resolve against rules → match the case → draft →
 * plan → (person approves) → execute → reconcile.
 *
 * Two things are deliberately *not* here. Sending is not here: this builds a
 * plan, and `gateway.executePlan` is the only thing that acts on one. And the
 * acknowledgement email is not here either — the existing contact route
 * already sends it, and a second "we received your message" is a worse
 * experience than none (指示書 §07-1).
 */

export const RELAY_POLICY_VERSION = "relay-2026.09.22";

export const RELAY_FIELDS = [
  "intent",
  "currentTools",
  "cadence",
  "volume",
  "durationMinutes",
  "bufferMinutes",
  "staffing",
  "availabilityNote",
] as const;

export type RelayInquiry = {
  /** Stable per inquiry. The same id must never create a second case (R03). */
  inquiryId: string;
  tenantId: string;
  receivedAtIso: string;
  name: string;
  company: string;
  email: string;
  text: string;
  /** The TSW-… number the existing contact route already issued, when present. */
  receipt?: string;
  caseRef?: string;
};

export type RelayResult = {
  run: Run;
  plan: ActionPlan;
  caseRecord: CaseRecord;
  reply: ReplyDraft;
  /** Payloads keyed by action id, for the gateway. */
  payloads: Record<string, unknown>;
  /** Weak identity candidates for a person to resolve. Never auto-applied. */
  identityCandidates: Array<{ caseId: string; reason: string }>;
  /**
   * What the extractor read, and how. The business screens do not need this;
   * the technical console shows each field beside the span of the source it
   * came from, which is the only way to check a claim without re-reading the
   * whole message (指示書 §17).
   */
  extraction: {
    extractorVersion: string;
    processing: ProcessingKind;
    fields: Record<string, { value: unknown; evidenceIds: string[] }>;
  };
};

export async function runRelay(
  inquiry: RelayInquiry,
  options: {
    mode: ExecutionMode;
    extractor: ExtractorChoice;
    existingCases: readonly CaseRecord[];
    signature: string;
    env?: Record<string, string | undefined>;
    budgetCheck?: () => Promise<boolean> | boolean;
  },
): Promise<RelayResult> {
  const { extractor, processing } = selectExtractor({
    mode: options.mode,
    choice: options.extractor,
    env: options.env,
    budgetCheck: options.budgetCheck,
  });

  const sourceRef = `inquiry:${inquiry.inquiryId}`;
  const extraction = await extractor.extract({
    sourceRef,
    text: inquiry.text,
    receivedAtIso: inquiry.receivedAtIso,
    expectedFields: RELAY_FIELDS,
  });

  const warnings: Warning[] = [...extraction.warnings];
  const missing: MissingField[] = [...extraction.missing];

  // Identity: exact identifiers only. Anything weaker is handed back.
  const identity = matchCase(
    {
      email: inquiry.email,
      name: inquiry.name,
      receipt: inquiry.receipt,
      caseRef: inquiry.caseRef,
    },
    options.existingCases,
  );
  warnings.push(...identity.warnings);

  const existing = identity.matchedCaseId
    ? options.existingCases.find((c) => c.caseId === identity.matchedCaseId)!
    : null;

  const messageFields: Record<string, { value: string; evidenceId?: string }> =
    {};
  for (const [name, field] of Object.entries(extraction.fields))
    messageFields[name] = {
      value: Array.isArray(field.value)
        ? field.value.join("、")
        : String(field.value),
      evidenceId: field.evidenceIds[0],
    };

  const base =
    existing ??
    newCase({
      tenantId: inquiry.tenantId,
      email: inquiry.email,
      name: inquiry.name,
      company: inquiry.company,
      title: titleFor(
        messageFields.intent?.value,
        inquiry.company || inquiry.name,
      ),
      atIso: inquiry.receivedAtIso,
      seed: inquiry.inquiryId,
      receipt: inquiry.receipt,
    });

  const applied = applyMessage(base, {
    atIso: inquiry.receivedAtIso,
    sourceRef,
    fields: messageFields,
    receipt: inquiry.receipt,
    summary: `${processing === "ai" ? "実AI" : "ルール処理"}で ${Object.keys(messageFields).length} 項目を抽出しました。`,
  });
  let caseRecord = applied.record;

  // Questions already answered in this case are not asked again (R04).
  const stillMissing = missing.filter((m) => !caseRecord.knownFields[m.field]);
  caseRecord = {
    ...caseRecord,
    openQuestions: Array.from(
      new Set([
        ...caseRecord.openQuestions,
        ...stillMissing.map((m) => m.field),
      ]),
    ),
  };

  const understood = Object.entries(caseRecord.knownFields).map(
    ([field, value]) => ({
      label: fieldLabel(field),
      value: displayValue(field, value.value),
      evidenceIds: value.evidenceId ? [value.evidenceId] : [],
    }),
  );

  const reply = composeReply({
    recipientName: inquiry.name,
    understood,
    missing: stillMissing,
    warnings,
    signature: options.signature,
  });

  const runIdValue = makeRunId("relay", {
    tenantId: inquiry.tenantId,
    inquiryId: inquiry.inquiryId,
  });
  const inputHash = hash({
    text: inquiry.text,
    receivedAt: inquiry.receivedAtIso,
  });

  const casePayload = {
    caseId: caseRecord.caseId,
    title: caseRecord.title,
    knownFields: caseRecord.knownFields,
    openQuestions: caseRecord.openQuestions,
  };
  const replyPayload = {
    to: inquiry.email,
    subject: reply.subject,
    body: reply.body,
  };

  const actions: PlannedAction[] = [
    plannedAction({
      tenantId: inquiry.tenantId,
      runId: runIdValue,
      id: "case-upsert",
      kind: "case.upsert",
      targetRef: `internal:case/${caseRecord.caseId}`,
      payload: casePayload,
      summary: `案件「${caseRecord.title}」を作成・更新します（内部記録）。`,
    }),
    plannedAction({
      tenantId: inquiry.tenantId,
      runId: runIdValue,
      id: "reply-draft",
      kind: "reply.draft",
      targetRef: `internal:draft/${caseRecord.caseId}`,
      payload: replyPayload,
      summary: `${inquiry.name} 様への返信案を作成します（送信しません）。`,
    }),
    plannedAction({
      tenantId: inquiry.tenantId,
      runId: runIdValue,
      id: "reply-send",
      kind: "mail.send",
      targetRef: `mail:${inquiry.email}`,
      payload: replyPayload,
      summary: `承認後に ${inquiry.email} へ返信を送信します。`,
    }),
  ];

  const blocking = warnings.some((w) => w.severity === "blocking");
  const plan: ActionPlan = {
    tenantId: inquiry.tenantId,
    runId: runIdValue,
    version: 1,
    inputHash,
    policyVersion: `${RELAY_POLICY_VERSION}/${extraction.extractorVersion}`,
    mode: options.mode,
    evidence: extraction.evidence,
    missingFields: stillMissing,
    warnings,
    actions,
  };

  const run: Run = {
    tenantId: inquiry.tenantId,
    runId: runIdValue,
    mode: options.mode,
    workflow: "relay",
    status:
      blocking || stillMissing.length ? "needs_info" : "awaiting_approval",
    inputSource: options.mode === "sample" ? "sample" : "approved_web_form",
    createdAt: inquiry.receivedAtIso,
    updatedAt: inquiry.receivedAtIso,
    plan,
    approvals: [],
    effects: [],
    timeline: [
      {
        at: inquiry.receivedAtIso,
        event: "received",
        detail: `受付 ${inquiry.receipt ?? inquiry.inquiryId}`,
      },
      {
        at: inquiry.receivedAtIso,
        event: "extracted",
        detail: `${processing === "ai" ? "実AI" : "ルール処理"}：${Object.keys(extraction.fields).length} 項目抽出、${stillMissing.length} 項目が未確認。`,
      },
      {
        at: inquiry.receivedAtIso,
        event: "planned",
        detail: `${actions.length} 件の操作を計画しました（送信は未実行）。`,
      },
    ],
  };

  return {
    run,
    plan,
    caseRecord,
    reply,
    payloads: {
      "case-upsert": casePayload,
      "reply-draft": replyPayload,
      "reply-send": replyPayload,
    },
    identityCandidates: identity.candidates.map(({ caseId, reason }) => ({
      caseId,
      reason,
    })),
    extraction: {
      extractorVersion: extraction.extractorVersion,
      processing,
      fields: Object.fromEntries(
        Object.entries(extraction.fields).map(([name, field]) => [
          name,
          { value: field.value, evidenceIds: field.evidenceIds },
        ]),
      ),
    },
  };
}

function plannedAction(opts: {
  tenantId: string;
  runId: string;
  id: string;
  kind: PlannedAction["kind"];
  targetRef: string;
  payload: unknown;
  summary: string;
}): PlannedAction {
  const payloadHash = payloadHashOf(opts.payload);
  return {
    id: opts.id,
    kind: opts.kind,
    targetRef: opts.targetRef,
    payloadHash,
    // Proposed only. `authoriseAction` recomputes the value that is obeyed.
    requiresApproval:
      opts.kind !== "case.upsert" && opts.kind !== "reply.draft",
    idempotencyKey: idempotencyKey({
      tenantId: opts.tenantId,
      runId: opts.runId,
      actionId: opts.id,
      payloadHash,
    }),
    summary: opts.summary,
  };
}

const INTENT_TITLES: Record<string, string> = {
  booking: "予約・日程調整のご相談",
  quote: "お見積りのご相談",
  incident: "不具合のご連絡",
  billing: "請求に関するご連絡",
  contract: "ご契約に関するご相談",
};

const titleFor = (intent: string | undefined, who: string) =>
  `${who} / ${(intent && INTENT_TITLES[intent]) || "お問い合わせ"}`;
