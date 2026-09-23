import type { Ticket } from "@/lib/inbox";

/**
 * One enquiry, from arrival to whatever happened to it (指示書 §14).
 *
 * RELAY, SMART INBOX and ADMIN were three screens holding three unrelated
 * arrays: a reply approved in RELAY reached nobody, and the customer list knew
 * nothing about the enquiries it was supposedly the record of. This is the
 * record all three now read and write.
 *
 * It deliberately does not model a support product. It models the handful of
 * facts the three screens actually disagree about: who wrote in, what it was
 * about, who holds it, what the draft says, and whether a person approved it.
 */

export const OPS_SCHEMA_VERSION = 1;

/**
 * The instant the server renders the sample from.
 *
 * Fixed, so the server and the client produce the same markup; the client
 * re-derives from the real clock after mount. Without it the three screens
 * would render empty until JavaScript arrived.
 */
export const OPS_REFERENCE_ISO = "2026-09-23T01:00:00.000Z";

/** Where the enquiry came from. Kept because it changes what is trustworthy. */
export type CaseSource = "seed" | "relay" | "form";

export type CaseStatus = "未対応" | "対応中" | "完了";

/** Set by the rules engine, never typed in. */
export type CaseCategory = "請求" | "不具合" | "契約" | "お問い合わせ";
export type CaseUrgency = "高" | "中" | "通常";

export type CaseEvent = {
  at: string;
  event: string;
  detail: string;
};

export type OpsCase = {
  caseId: string;
  /** Short enough to read out, stable for the life of the case. */
  reference: string;
  source: CaseSource;
  customerName: string;
  /** Set once the case is matched to a row in the customer list. */
  customerId?: string;
  subject: string;
  body: string;
  receivedAtIso: string;
  category: CaseCategory;
  urgency: CaseUrgency;
  status: CaseStatus;
  owner: string;
  /** The current reply draft. Empty until something writes one. */
  draft: string;
  /** Set only by a person pressing approve, never by the classifier. */
  approvedAtIso?: string;
  updatedAtIso: string;
  history: CaseEvent[];
};

export type OpsState = {
  schemaVersion: number;
  sandboxId: string;
  cases: OpsCase[];
  /** Ids of the seeded cases this visitor has deleted, so a reset can differ
   *  from "never had them". */
  dismissedSeedIds: string[];
  createdAtIso: string;
  updatedAtIso: string;
};

export const OWNERS = ["未割当", "担当A", "担当B", "担当C"] as const;

/** The seeded inbox, expressed as cases. */
export type SeedTicket = Ticket;
