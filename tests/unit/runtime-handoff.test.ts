import { describe, expect, it } from "vitest";
import { contactKinds, contactContext } from "@/lib/contact-options";
import {
  cleanAnswer,
  composeHandoff,
  MAX_ANSWER,
  troubleLabel,
  type HandoffAnswers,
} from "@/lib/runtime/handoff";

/** 受け入れ基準 A10（体験→相談の引き継ぎ）／指示書 §11。 */

const answers = (over: Partial<HandoffAnswers> = {}): HandoffAnswers => ({
  workflow: "relay",
  tools: "Gmail、Googleカレンダー",
  cadence: "月に80件ほど",
  outcome: "返信の下書きまで用意されていてほしい",
  ...over,
});

describe("contactContext — /flow が相談の出所として認められる", () => {
  it("accepts /flow, so a handoff from the sample is not discarded", () => {
    expect(contactContext("/flow")).toEqual({
      page: "/flow",
      category: "",
      project: "",
      demo: "",
    });
  });

  it("still refuses a page that is not on the list", () => {
    expect(contactContext("/flow/../admin")).toBeNull();
    expect(contactContext("/not-a-page")).toBeNull();
  });
});

describe("composeHandoff — 聞いたことだけを引き継ぐ", () => {
  it("carries the chosen trouble and the three answers", () => {
    const { detail } = composeHandoff(answers());
    expect(detail).toContain("【相談したいこと】問い合わせ対応（返信の準備）");
    expect(detail).toContain("【いま使っている道具】Gmail、Googleカレンダー");
    expect(detail).toContain("【頻度・件数】月に80件ほど");
    expect(detail).toContain(
      "【こうなったら助かること】返信の下書きまで用意されていてほしい",
    );
  });

  it("maps each trouble to the kind the existing catalogue already uses", () => {
    // automation → "AI / 自動化", booking(api) → "API / システム連携".
    expect(composeHandoff(answers({ workflow: "relay" })).kind).toBe(
      contactKinds[2],
    );
    expect(composeHandoff(answers({ workflow: "report" })).kind).toBe(
      contactKinds[2],
    );
    expect(composeHandoff(answers({ workflow: "daybook" })).kind).toBe(
      contactKinds[3],
    );
  });

  it("leaves unanswered questions out instead of carrying blank headings", () => {
    const { detail, answered } = composeHandoff(
      answers({ cadence: "", outcome: "" }),
    );
    expect(answered).toBe(1);
    expect(detail).toContain("【いま使っている道具】");
    expect(detail).not.toContain("【頻度・件数】");
    expect(detail).not.toContain("【こうなったら助かること】");
  });

  it("still produces a usable inquiry when nothing was answered", () => {
    const { detail, answered } = composeHandoff(
      answers({ tools: "", cadence: "", outcome: "" }),
    );
    expect(answered).toBe(0);
    expect(detail).toContain("【相談したいこと】");
    expect(detail).toContain("書き足してください");
    // The server requires at least 10 characters of detail.
    expect(detail.trim().length).toBeGreaterThan(10);
  });

  it("says where the inquiry came from, so a reply has context", () => {
    expect(composeHandoff(answers()).detail).toContain(
      "体験から引き継ぎました",
    );
  });

  it("names the trouble the visitor actually watched", () => {
    expect(troubleLabel("daybook")).toBe("日程調整");
    expect(troubleLabel("report")).toBe("定期報告（集計）");
  });
});

describe("cleanAnswer — フォームとサーバーの検証を先に満たす", () => {
  it("folds newlines and tabs into single spaces", () => {
    const LF = String.fromCharCode(10);
    const TAB = String.fromCharCode(9);
    expect(cleanAnswer("Gmail" + LF + TAB + "カレンダー")).toBe(
      "Gmail カレンダー",
    );
  });

  it("drops control characters the server would reject", () => {
    const NUL = String.fromCharCode(0);
    const ESC = String.fromCharCode(0x1b);
    const cleaned = cleanAnswer("Gmail" + NUL + ESC + "予約");
    expect(cleaned).toBe("Gmail予約");
    for (const character of cleaned)
      expect(character.codePointAt(0)!).toBeGreaterThan(0x1f);
  });

  it("collapses runs of whitespace and trims", () => {
    expect(cleanAnswer("  月に   80件  ")).toBe("月に 80件");
  });

  it("caps a long answer rather than letting it reach the form", () => {
    expect(cleanAnswer("あ".repeat(MAX_ANSWER + 200))).toHaveLength(MAX_ANSWER);
  });

  it("returns an empty string for whitespace only", () => {
    expect(cleanAnswer("   ")).toBe("");
  });
});

describe("引き継ぎに含めないもの（指示書 §11）", () => {
  it("carries no field other than the trouble and the three answers", () => {
    const { detail } = composeHandoff(
      answers({ tools: "ツール", cadence: "頻度", outcome: "結果" }),
    );
    // The fictional sample body must never appear in a real inquiry.
    expect(detail).not.toContain("撮影予約のメール対応");
    expect(detail).not.toContain("サンプル");
    expect(detail).not.toContain("山田太郎");
  });

  it("keeps the composed detail inside the form's own limit", () => {
    const long = "あ".repeat(MAX_ANSWER);
    const { detail } = composeHandoff(
      answers({ tools: long, cadence: long, outcome: long }),
    );
    expect(detail.length).toBeLessThanOrEqual(2000);
  });
});
