import { hash } from "@/lib/runtime/ids";
import { classify, replyDraft, ticketsFor, type Ticket } from "@/lib/inbox";
import type {
  CaseCategory,
  CaseStatus,
  CaseUrgency,
  OpsCase,
  OpsState,
} from "./types";
import { OPS_SCHEMA_VERSION } from "./types";

/**
 * What can happen to an enquiry (指示書 §14).
 *
 * Pure functions over the record. The screens decide what to show; these
 * decide what is allowed, and they are the only place that decides it, so
 * RELAY and SMART INBOX cannot disagree about whether a draft was approved.
 */

const STATUSES: Record<CaseStatus, readonly CaseStatus[]> = {
  未対応: ["対応中", "完了"],
  対応中: ["完了", "未対応"],
  // Reopening is a real thing a support desk does, so it is allowed and
  // recorded rather than quietly prevented.
  完了: ["対応中"],
};

export const canSetStatus = (from: CaseStatus, to: CaseStatus) =>
  from === to || STATUSES[from].includes(to);

const event = (at: string, name: string, detail: string) => ({
  at,
  event: name,
  detail,
});

const touch = (
  base: OpsCase,
  atIso: string,
  name: string,
  detail: string,
  patch: Partial<OpsCase> = {},
): OpsCase => ({
  ...base,
  ...patch,
  updatedAtIso: atIso,
  history: [...base.history, event(atIso, name, detail)],
});

/** The classifier's verdict, typed. It reads text and nothing else. */
export function classifyCase(text: string): {
  category: CaseCategory;
  urgency: CaseUrgency;
} {
  const result = classify(text);
  return {
    category: result.category as CaseCategory,
    urgency: result.urgency as CaseUrgency,
  };
}

export function newCase(input: {
  customerName: string;
  subject: string;
  body: string;
  receivedAtIso: string;
  source: OpsCase["source"];
  owner?: string;
  status?: CaseStatus;
}): OpsCase {
  const { category, urgency } = classifyCase(input.subject + input.body);
  const caseId =
    "case-" +
    hash({
      body: input.body,
      subject: input.subject,
      at: input.receivedAtIso,
      name: input.customerName,
    }).slice(0, 14);

  return {
    caseId,
    reference: "T-" + hash(caseId).slice(0, 6).toUpperCase(),
    source: input.source,
    customerName: input.customerName,
    subject: input.subject,
    body: input.body,
    receivedAtIso: input.receivedAtIso,
    category,
    urgency,
    status: input.status ?? "未対応",
    owner: input.owner ?? "未割当",
    draft: "",
    updatedAtIso: input.receivedAtIso,
    history: [
      event(
        input.receivedAtIso,
        "received",
        `${category}・緊急度${urgency}として受け付けました。`,
      ),
    ],
  };
}

/** The sample inbox as cases, dated from the given moment. */
export function seedCases(nowIso: string): OpsCase[] {
  return ticketsFor(nowIso).map((ticket) => fromTicket(ticket, nowIso));
}

/**
 * Converts a seeded ticket into a case.
 *
 * The id is derived from the ticket's own id so a seeded case keeps the same
 * identity across reloads even though its displayed date moves with the
 * calendar; deriving it from the date would make every reload a new case and
 * every edit disappear.
 */
export function fromTicket(ticket: Ticket, nowIso: string): OpsCase {
  const { category, urgency } = classifyCase(ticket.subject + ticket.body);
  const caseId = `case-seed-${ticket.id}`;
  return {
    caseId,
    reference: "T-" + hash(caseId).slice(0, 6).toUpperCase(),
    source: "seed",
    customerName: ticket.name,
    subject: ticket.subject,
    body: ticket.body,
    receivedAtIso: nowIso,
    // The seed's own display stamp, kept so the list reads like an inbox.
    category,
    urgency,
    status: ticket.status,
    owner: ticket.owner,
    draft: "",
    updatedAtIso: nowIso,
    history: [event(nowIso, "received", `${ticket.date} に受け付けました。`)],
  };
}

/** The stamp the inbox shows. Seeded cases keep the sample's own wording. */
export const receivedLabel = (c: OpsCase, nowIso: string): string => {
  if (c.source === "seed") {
    const first = c.history.find((h) => h.event === "received");
    const stamp = first?.detail.match(/^(\d{2}\/\d{2} \d{2}:\d{2})/)?.[1];
    if (stamp) return stamp;
  }
  const at = new Date(Date.parse(c.receivedAtIso) + 9 * 3600_000);
  const same =
    at.toISOString().slice(0, 10) ===
    new Date(Date.parse(nowIso) + 9 * 3600_000).toISOString().slice(0, 10);
  const time = at.toISOString().slice(11, 16);
  return same
    ? `本日 ${time}`
    : `${at.toISOString().slice(5, 10).replace("-", "/")} ${time}`;
};

export function setStatus(
  c: OpsCase,
  to: CaseStatus,
  atIso: string,
): { ok: boolean; reason?: string; case: OpsCase } {
  if (c.status === to) return { ok: true, case: c };
  if (!canSetStatus(c.status, to))
    return {
      ok: false,
      reason: `${c.status}から${to}へは変更できません。`,
      case: c,
    };
  return {
    ok: true,
    case: touch(c, atIso, "status", `対応状況を${to}にしました。`, {
      status: to,
    }),
  };
}

export function assign(c: OpsCase, owner: string, atIso: string): OpsCase {
  if (c.owner === owner) return c;
  return touch(c, atIso, "assign", `担当を${owner}にしました。`, { owner });
}

/**
 * Writes a draft reply.
 *
 * Any edit clears the approval. A reply someone signed off and then changed
 * has not been signed off, and carrying the approval across would be the one
 * mistake this whole record exists to prevent (指示書 §14).
 */
export function saveDraft(c: OpsCase, draft: string, atIso: string): OpsCase {
  if (c.draft === draft) return c;
  const wasApproved = Boolean(c.approvedAtIso);
  const detail = wasApproved
    ? "下書きを編集したため、確認済みを解除しました。"
    : "返信の下書きを更新しました。";

  // Typing is one edit, not forty. Consecutive draft events collapse into the
  // latest so the history stays something a person can read — but an edit
  // that revoked an approval is kept, because that is a different fact.
  const last = c.history.at(-1);
  const collapsible =
    last?.event === "draft" && !wasApproved && !last.detail.includes("解除");

  const history = collapsible
    ? [...c.history.slice(0, -1), event(atIso, "draft", detail)]
    : [...c.history, event(atIso, "draft", detail)];

  return {
    ...c,
    draft: draft.slice(0, 4000),
    approvedAtIso: undefined,
    updatedAtIso: atIso,
    history,
  };
}

/** Generates a draft from the rules. It never approves what it writes. */
export function suggestDraft(c: OpsCase, atIso: string): OpsCase {
  const ticket: Ticket = {
    id: 0,
    name: c.customerName,
    subject: c.subject,
    body: c.body,
    date: "",
    status: c.status,
    owner: c.owner,
  };
  return saveDraft(c, replyDraft(ticket), atIso);
}

export function approveDraft(
  c: OpsCase,
  atIso: string,
): { ok: boolean; reason?: string; case: OpsCase } {
  if (!c.draft.trim())
    return { ok: false, reason: "下書きがありません。", case: c };
  if (c.approvedAtIso) return { ok: true, case: c };
  return {
    ok: true,
    case: touch(c, atIso, "approved", "担当者が内容を確認しました。", {
      approvedAtIso: atIso,
    }),
  };
}

export function withdrawApproval(c: OpsCase, atIso: string): OpsCase {
  if (!c.approvedAtIso) return c;
  return touch(c, atIso, "withdrawn", "確認を差し戻しました。", {
    approvedAtIso: undefined,
  });
}

/** Ties a case to a row in the customer list. */
export function linkCustomer(
  c: OpsCase,
  customerId: string,
  customerName: string,
  atIso: string,
): OpsCase {
  if (c.customerId === customerId) return c;
  return touch(c, atIso, "linked", `顧客「${customerName}」と紐づけました。`, {
    customerId,
    customerName,
  });
}

export type CaseTotals = {
  total: number;
  open: number;
  urgent: number;
  unassigned: number;
  awaitingApproval: number;
};

/** The counts the three screens quote. One function, so they cannot differ. */
export function caseTotals(cases: readonly OpsCase[]): CaseTotals {
  return {
    total: cases.length,
    open: cases.filter((c) => c.status !== "完了").length,
    urgent: cases.filter((c) => c.urgency === "高" && c.status !== "完了")
      .length,
    unassigned: cases.filter((c) => c.owner === "未割当").length,
    awaitingApproval: cases.filter((c) => c.draft.trim() && !c.approvedAtIso)
      .length,
  };
}

export const emptyOpsState = (nowIso: string, sandboxId: string): OpsState => ({
  schemaVersion: OPS_SCHEMA_VERSION,
  sandboxId,
  cases: [],
  dismissedSeedIds: [],
  createdAtIso: nowIso,
  updatedAtIso: nowIso,
});

/**
 * The list the screens show: today's seed, plus this visitor's own work.
 *
 * Seeded cases the visitor has edited are replaced by their edited copy rather
 * than shown twice, and ones they dismissed stay gone. Merging here rather
 * than storing the whole seed means a build that changes the sample does not
 * leave old copies in everyone's browser.
 */
export function mergedCases(state: OpsState, nowIso: string): OpsCase[] {
  const own = new Map(state.cases.map((c) => [c.caseId, c]));
  const merged: OpsCase[] = [];

  for (const seeded of seedCases(nowIso)) {
    if (state.dismissedSeedIds.includes(seeded.caseId)) continue;
    merged.push(own.get(seeded.caseId) ?? seeded);
    own.delete(seeded.caseId);
  }
  // Anything the visitor created, newest first, above the sample.
  const created = [...own.values()].sort(
    (a, b) => Date.parse(b.receivedAtIso) - Date.parse(a.receivedAtIso),
  );
  return [...created, ...merged];
}
