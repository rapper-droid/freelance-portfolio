import { SCENARIOS, type ScenarioId } from "./scenarios";

/**
 * Input validation for the flow endpoint.
 *
 * The public sample takes free text from anyone, so the shape, the size and
 * the character set are all checked before the runtime sees them. Anything
 * unexpected is refused rather than coerced — a request that does not fit the
 * contract is not a request to repair (指示書 §13, §16).
 */

export const MAX_TEXT_LENGTH = 2000;
export const MAX_CSV_BYTES = 256 * 1024;

export type FlowRequest = {
  scenario: ScenarioId;
  /** Free text for relay/daybook; the visitor may edit the sample. */
  text?: string;
  /** CSV contents for report flows. */
  csv?: string;
  /** A recipe carried from an earlier step, so week 2 reuses week 1. */
  recipe?: unknown;
  /** Accepting the changes week 3 asks about. */
  acceptChanges?: boolean;
};

export type ValidationResult =
  | { ok: true; value: FlowRequest }
  | { ok: false; code: string; message: string };

/**
 * Rejects C0/C1 control characters, keeping tab, newline and carriage return.
 *
 * Written as a code-point test rather than a regex character class on purpose:
 * the escaped form collapses into literal control bytes when the file is
 * formatted, which leaves an unreadable source file and a fragile range.
 */
function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (code === 0x09 || code === 0x0a || code === 0x0d) continue;
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

export function validateFlowRequest(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return {
      ok: false,
      code: "invalid",
      message: "リクエストの形式が不正です。",
    };
  const v = input as Record<string, unknown>;

  const scenario = v.scenario;
  if (typeof scenario !== "string" || !SCENARIOS.some((s) => s.id === scenario))
    return { ok: false, code: "unknown_scenario", message: "対象が不明です。" };

  const result: FlowRequest = { scenario: scenario as ScenarioId };

  if (v.text !== undefined) {
    if (typeof v.text !== "string")
      return { ok: false, code: "invalid", message: "本文の形式が不正です。" };
    if (v.text.length > MAX_TEXT_LENGTH)
      return {
        ok: false,
        code: "too_long",
        message: `本文は${MAX_TEXT_LENGTH}文字以内で入力してください。`,
      };
    if (hasControlCharacter(v.text))
      return {
        ok: false,
        code: "invalid",
        message: "本文に使用できない文字が含まれています。",
      };
    result.text = v.text;
  }

  if (v.csv !== undefined) {
    if (typeof v.csv !== "string")
      return { ok: false, code: "invalid", message: "CSVの形式が不正です。" };
    // Byte length, not character count: the limit protects the parser.
    if (new TextEncoder().encode(v.csv).length > MAX_CSV_BYTES)
      return {
        ok: false,
        code: "too_large",
        message: "CSVは256KB以内のファイルをご利用ください。",
      };
    result.csv = v.csv;
  }

  if (v.recipe !== undefined) {
    if (!v.recipe || typeof v.recipe !== "object" || Array.isArray(v.recipe))
      return {
        ok: false,
        code: "invalid",
        message: "レシピの形式が不正です。",
      };
    result.recipe = v.recipe;
  }

  if (v.acceptChanges !== undefined) {
    if (typeof v.acceptChanges !== "boolean")
      return { ok: false, code: "invalid", message: "指定が不正です。" };
    result.acceptChanges = v.acceptChanges;
  }

  return { ok: true, value: result };
}

/**
 * Reads a JSON body with a hard ceiling, without buffering an unbounded
 * request first. Mirrors `lib/abuse.limitedJson`, kept separate so the flow
 * endpoint's limits can differ from the contact form's.
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("invalid_json");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_json");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("body_too_large");
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(merged));
  } finally {
    reader.releaseLock();
  }
}
