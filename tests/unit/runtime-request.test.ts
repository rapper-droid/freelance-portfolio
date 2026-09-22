import { describe, expect, it } from "vitest";
import {
  MAX_CSV_BYTES,
  MAX_TEXT_LENGTH,
  validateFlowRequest,
} from "@/lib/runtime/request";

/** 受け入れ基準 S02（不正な入力を安全に扱う）／指示書 §13, §16。 */

const valid = { scenario: "relay-quote" };

describe("validateFlowRequest — 契約に合わない入力は直さず拒否する", () => {
  it("accepts a known scenario", () => {
    expect(validateFlowRequest(valid).ok).toBe(true);
  });

  it("rejects an unknown scenario rather than falling back to a default", () => {
    const result = validateFlowRequest({ scenario: "../../etc/passwd" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("unknown_scenario");
  });

  it("rejects a non-object body", () => {
    for (const body of [null, "text", 42, [], undefined])
      expect(validateFlowRequest(body).ok).toBe(false);
  });

  it("rejects text over the limit", () => {
    const result = validateFlowRequest({
      ...valid,
      text: "あ".repeat(MAX_TEXT_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("too_long");
  });

  it("accepts text at exactly the limit", () => {
    expect(
      validateFlowRequest({ ...valid, text: "あ".repeat(MAX_TEXT_LENGTH) }).ok,
    ).toBe(true);
  });

  it("rejects control characters while keeping ordinary whitespace", () => {
    // Built with fromCharCode rather than written as escapes: a literal
    // backslash-u escape in this file collapses into a raw control byte when
    // the file is formatted, which makes the source unreadable.
    const control = (code: number) => String.fromCharCode(code);
    const NUL = control(0x00);
    const ESC = control(0x1b);
    const DEL = control(0x7f);
    const TAB = control(0x09);
    const LF = control(0x0a);
    const CR = control(0x0d);

    // None of these is ever part of a written inquiry.
    expect(validateFlowRequest({ ...valid, text: "問い合わせ" + NUL }).ok).toBe(
      false,
    );
    expect(validateFlowRequest({ ...valid, text: ESC + "[31m赤" }).ok).toBe(
      false,
    );
    expect(validateFlowRequest({ ...valid, text: "削除" + DEL }).ok).toBe(
      false,
    );

    // Tab, newline and carriage return are how people write paragraphs.
    expect(
      validateFlowRequest({
        ...valid,
        text: "一行目" + LF + "二行目" + TAB + "タブ" + CR + LF,
      }).ok,
    ).toBe(true);
  });

  it("measures the CSV ceiling in bytes, not characters", () => {
    // Multi-byte characters must not slip past a character-count limit.
    const overByBytes = "あ".repeat(Math.ceil(MAX_CSV_BYTES / 3) + 10);
    expect(new TextEncoder().encode(overByBytes).length).toBeGreaterThan(
      MAX_CSV_BYTES,
    );
    const result = validateFlowRequest({
      scenario: "report-week1",
      csv: overByBytes,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("too_large");
  });

  it("rejects a recipe that is not an object", () => {
    for (const recipe of ["recipe", 1, []])
      expect(validateFlowRequest({ scenario: "report-week2", recipe }).ok).toBe(
        false,
      );
  });

  it("rejects a non-boolean acceptChanges", () => {
    expect(validateFlowRequest({ ...valid, acceptChanges: "yes" }).ok).toBe(
      false,
    );
  });

  it("drops fields the contract does not define", () => {
    const result = validateFlowRequest({
      ...valid,
      text: "本文",
      tenantId: "someone-elses-tenant",
      mode: "customer_live",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Nothing a caller invents can widen what the run is allowed to do.
    expect(Object.keys(result.value).sort()).toEqual(["scenario", "text"]);
  });
});
