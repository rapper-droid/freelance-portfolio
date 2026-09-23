import {
  contactBudgets,
  contactTimings,
  contactContext,
} from "./contact-options";

/** Session-only draft shared by the contact form and the brief builders. */
export const DRAFT_KEY = "tsudowa-contact-draft-v2";
export const DRAFT_TTL = 2 * 3600000;
export const draftFieldKeys = [
  "kind",
  "detail",
  "budget",
  "stage",
  "timing",
  "reference",
  "supplement",
  "name",
  "company",
  "email",
] as const;
export type DraftFields = Record<(typeof draftFieldKeys)[number], string>;
export const MAX_BRIEF = 2000;

/**
 * Hand a brief to the contact form in this tab. The reply details a visitor
 * may already have typed (name, company, e-mail) are kept; everything else
 * comes from the brief. Returns false when storage is unavailable, so the
 * caller can fall back to copying.
 */
export type DraftOrigin = "brief" | "flow";

export function writeBriefDraft(
  page: string,
  brief: {
    kind: string;
    detail: string;
    budget?: string;
    timing?: string;
    reference?: string;
  },
  now = Date.now(),
  /** Which surface handed this over; only the restore note differs. */
  origin: DraftOrigin = "brief",
): boolean {
  if (!contactContext(page)) return false;
  try {
    let keep = { name: "", company: "", email: "" };
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
    if (saved?.fields && now - saved.savedAt < DRAFT_TTL)
      keep = {
        name: String(saved.fields.name ?? "").slice(0, 80),
        company: String(saved.fields.company ?? "").slice(0, 80),
        email: String(saved.fields.email ?? "").slice(0, 254),
      };
    const fields: DraftFields = {
      kind: brief.kind,
      detail: brief.detail.slice(0, MAX_BRIEF),
      budget:
        brief.budget &&
        (contactBudgets as readonly string[]).includes(brief.budget)
          ? brief.budget
          : "未定",
      stage: "相談しながら決めたい",
      timing:
        brief.timing &&
        (contactTimings as readonly string[]).includes(brief.timing)
          ? brief.timing
          : "未定",
      reference: brief.reference ?? "",
      supplement: "",
      ...keep,
    };
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ fields, page, origin, savedAt: now }),
    );
    return true;
  } catch {
    return false;
  }
}
