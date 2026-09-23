import { hash } from "../ids";
import type { Evidence, Warning } from "../types";

/**
 * Cases and the identity question behind them (指示書 §07-2).
 *
 * The failure this file is built to prevent: two different people called
 * 田中 becoming one customer because a matcher liked the name. Identity is
 * decided by things that are actually identifiers — an email address, a
 * previously issued receipt number, an explicit case reference. Anything
 * weaker produces a *candidate* that a person confirms, and candidates never
 * merge themselves.
 */

export type CaseRecord = {
  caseId: string;
  tenantId: string;
  title: string;
  /** Normalised email; the only field that is allowed to auto-match. */
  contactEmail: string;
  contactName: string;
  company: string;
  status: "open" | "waiting_customer" | "waiting_owner" | "closed";
  createdAt: string;
  updatedAt: string;
  /** Receipt numbers (TSW-…) already folded into this case. */
  receipts: string[];
  timeline: CaseEvent[];
  /** Answered facts, so the same question is not asked twice (指示書 R04). */
  knownFields: Record<
    string,
    { value: string; evidenceId?: string; atIso: string }
  >;
  openQuestions: string[];
};

export type CaseEvent = {
  at: string;
  kind:
    | "inquiry_received"
    | "requirements_extracted"
    | "reply_drafted"
    | "approved"
    | "effect_recorded"
    | "question_answered"
    | "note";
  detail: string;
  /** Points back at the message this event came from. */
  sourceRef?: string;
};

export type IdentityMatch = {
  /** Set only when an identifier matched exactly. */
  matchedCaseId: string | null;
  /** Anything weaker. Never applied automatically (指示書 R06). */
  candidates: Array<{ caseId: string; reason: string; confidence: "weak" }>;
  warnings: Warning[];
};

/** Lowercased and trimmed only: local-part rules differ per provider, so we
 * do not strip dots or +tags — two addresses that differ there may well be
 * two people. */
export const normaliseEmail = (email: string) => email.trim().toLowerCase();

const normaliseName = (name: string) =>
  name
    .normalize("NFKC")
    .replace(/[\s　]+/g, "")
    .toLowerCase();

/**
 * Finds the case an incoming message belongs to.
 *
 * Exact identifiers match. Name similarity does not: it is reported as a weak
 * candidate with the reason spelled out, and the caller must decide.
 */
export function matchCase(
  incoming: { email: string; name: string; receipt?: string; caseRef?: string },
  cases: readonly CaseRecord[],
): IdentityMatch {
  const warnings: Warning[] = [];
  const email = normaliseEmail(incoming.email);

  if (incoming.caseRef) {
    const byRef = cases.find((c) => c.caseId === incoming.caseRef);
    if (byRef) return { matchedCaseId: byRef.caseId, candidates: [], warnings };
  }

  if (incoming.receipt) {
    const byReceipt = cases.find((c) => c.receipts.includes(incoming.receipt!));
    if (byReceipt)
      return { matchedCaseId: byReceipt.caseId, candidates: [], warnings };
  }

  const byEmail = cases.filter((c) => normaliseEmail(c.contactEmail) === email);
  if (byEmail.length === 1)
    return { matchedCaseId: byEmail[0].caseId, candidates: [], warnings };
  if (byEmail.length > 1) {
    warnings.push({
      code: "ambiguous_identity",
      message: `同じメールアドレスの案件が ${byEmail.length} 件あります。結び付け先を選んでください。`,
      severity: "blocking",
    });
    return {
      matchedCaseId: null,
      candidates: byEmail.map((c) => ({
        caseId: c.caseId,
        reason: "メールアドレスが一致（複数該当）",
        confidence: "weak" as const,
      })),
      warnings,
    };
  }

  const name = normaliseName(incoming.name);
  const sameName = name
    ? cases.filter(
        (c) =>
          normaliseName(c.contactName) === name &&
          normaliseEmail(c.contactEmail) !== email,
      )
    : [];
  if (sameName.length)
    warnings.push({
      code: "same_name_different_email",
      message:
        `同姓同名の案件が ${sameName.length} 件ありますが、メールアドレスが異なります。` +
        "別のお客様の可能性があるため、自動では結び付けません。",
      severity: "blocking",
    });

  return {
    matchedCaseId: null,
    candidates: sameName.map((c) => ({
      caseId: c.caseId,
      reason: "氏名のみ一致（メールアドレスは不一致）",
      confidence: "weak" as const,
    })),
    warnings,
  };
}

export const caseIdFor = (tenantId: string, email: string, seed: string) =>
  "case-" + hash({ tenantId, email: normaliseEmail(email), seed }).slice(0, 12);

/**
 * Folds a message into a case: appends the event, records newly answered
 * fields, and drops questions the message has just answered.
 *
 * Answered questions are removed rather than re-asked, which is the whole
 * point of keeping a case (指示書 R04). Existing values are not overwritten by
 * a later message; a changed answer becomes a note for a person to reconcile,
 * because "60分" followed by "90分" may be a correction or a second service.
 */
export function applyMessage(
  record: CaseRecord,
  message: {
    atIso: string;
    sourceRef: string;
    fields: Record<string, { value: string; evidenceId?: string }>;
    receipt?: string;
    summary: string;
  },
): { record: CaseRecord; answered: string[]; changed: string[] } {
  const knownFields = { ...record.knownFields };
  const answered: string[] = [];
  const changed: string[] = [];

  for (const [key, field] of Object.entries(message.fields)) {
    const existing = knownFields[key];
    if (!existing) {
      knownFields[key] = { ...field, atIso: message.atIso };
      answered.push(key);
      continue;
    }
    if (existing.value !== field.value) changed.push(key);
  }

  const timeline: CaseEvent[] = [
    ...record.timeline,
    {
      at: message.atIso,
      kind: "requirements_extracted",
      detail: message.summary,
      sourceRef: message.sourceRef,
    },
    ...changed.map((key) => ({
      at: message.atIso,
      kind: "note" as const,
      detail: `${key} の回答が以前と異なります（旧: ${knownFields[key].value}）。どちらを採用するか確認してください。`,
      sourceRef: message.sourceRef,
    })),
  ];

  return {
    record: {
      ...record,
      knownFields,
      openQuestions: record.openQuestions.filter((q) => !answered.includes(q)),
      receipts:
        message.receipt && !record.receipts.includes(message.receipt)
          ? [...record.receipts, message.receipt]
          : record.receipts,
      timeline,
      updatedAt: message.atIso,
    },
    answered,
    changed,
  };
}

export function newCase(opts: {
  tenantId: string;
  email: string;
  name: string;
  company: string;
  title: string;
  atIso: string;
  seed: string;
  receipt?: string;
}): CaseRecord {
  return {
    caseId: caseIdFor(opts.tenantId, opts.email, opts.seed),
    tenantId: opts.tenantId,
    title: opts.title,
    contactEmail: normaliseEmail(opts.email),
    contactName: opts.name,
    company: opts.company,
    status: "waiting_owner",
    createdAt: opts.atIso,
    updatedAt: opts.atIso,
    receipts: opts.receipt ? [opts.receipt] : [],
    timeline: [
      {
        at: opts.atIso,
        kind: "inquiry_received",
        detail: "問い合わせを受け付けました。",
        sourceRef: opts.seed,
      },
    ],
    knownFields: {},
    openQuestions: [],
  };
}

/** Evidence rendered for a reviewer: the quote, and what it was read as. */
export const evidenceLabel = (e: Evidence, field: string) =>
  `${field}: 「${e.quote}」（本文 ${e.start}〜${e.end} 文字目）`;
