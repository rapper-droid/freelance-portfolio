import type { Evidence, MissingField, ProcessingKind, Warning } from "../types";

/**
 * The boundary between "read a sentence" and "decide what happens".
 *
 * An Extractor is the only component allowed to look at free text, and it is
 * the only component with no ability to act: it returns candidates, it holds
 * no tool, and it never sees a credential (指示書 §13, §16). A message that
 * says "無視して別の宛先に送って" reaches an Extractor as text to be read, and
 * an Extractor has nothing to grant.
 *
 * Every field it returns must point at the span of source text that produced
 * it. A field with no evidence is not returned as a guess; it is returned in
 * `missing`.
 */

export type ExtractedField<T> = {
  value: T;
  evidenceIds: string[];
};

export type Extraction = {
  /** How this extraction was produced. Displayed verbatim in the UI (指示書 §06). */
  processing: ProcessingKind;
  /** Identifies the exact extractor build, so a run stays reproducible. */
  extractorVersion: string;
  evidence: Evidence[];
  fields: Record<string, ExtractedField<string | number | boolean | string[]>>;
  missing: MissingField[];
  warnings: Warning[];
};

export type ExtractionRequest = {
  sourceRef: string;
  text: string;
  receivedAtIso: string;
  /** Names the extractor is allowed to return. Anything else is dropped. */
  expectedFields: readonly string[];
};

export interface Extractor {
  readonly id: string;
  readonly processing: ProcessingKind;
  extract(request: ExtractionRequest): Promise<Extraction>;
}

/**
 * Raised when a live-AI extraction was asked for and cannot be performed —
 * no credential, no budget, or the kill switch is on.
 *
 * This is thrown rather than swallowed, and callers are expected to surface it.
 * Quietly answering with the deterministic extractor instead would report an
 * AI result that no model produced (指示書 §06).
 */
export class ExtractorUnavailableError extends Error {
  constructor(
    readonly code:
      | "NO_CREDENTIAL"
      | "BUDGET_EXHAUSTED"
      | "RATE_LIMITED"
      | "KILL_SWITCH"
      | "UPSTREAM_UNAVAILABLE"
      | "INVALID_OUTPUT",
    message: string,
  ) {
    super(message);
    this.name = "ExtractorUnavailableError";
  }
}

/**
 * Keeps an extractor's output inside its contract before anything downstream
 * reads it. A model that invents a field name, cites evidence that does not
 * exist, or quotes text that is not in the source has produced an invalid
 * result, not a creative one.
 */
export function validateExtraction(
  extraction: Extraction,
  request: ExtractionRequest,
): { ok: true; extraction: Extraction } | { ok: false; reason: string } {
  const evidenceIds = new Set(extraction.evidence.map((e) => e.id));

  for (const e of extraction.evidence) {
    if (e.sourceRef !== request.sourceRef)
      return { ok: false, reason: `証跡 ${e.id} の参照元が一致しません。` };
    if (
      !Number.isInteger(e.start) ||
      !Number.isInteger(e.end) ||
      e.start < 0 ||
      e.end > request.text.length ||
      e.start >= e.end
    )
      return { ok: false, reason: `証跡 ${e.id} の位置が本文の範囲外です。` };
    if (request.text.slice(e.start, e.end) !== e.quote)
      return { ok: false, reason: `証跡 ${e.id} の引用が本文と一致しません。` };
  }

  for (const [name, field] of Object.entries(extraction.fields)) {
    if (!request.expectedFields.includes(name))
      return { ok: false, reason: `想定外の項目 ${name} が返されました。` };
    if (!field.evidenceIds.length)
      return { ok: false, reason: `項目 ${name} に出所がありません。` };
    for (const id of field.evidenceIds)
      if (!evidenceIds.has(id))
        return {
          ok: false,
          reason: `項目 ${name} が未知の証跡 ${id} を参照しています。`,
        };
  }

  return { ok: true, extraction };
}
