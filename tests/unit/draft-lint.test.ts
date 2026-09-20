import { describe, expect, it } from "vitest";
import {
  allowedAmounts,
  lintDraft,
  parseDraft,
} from "../../src/lib/growth/draft-lint";

const prices = ["5,000円〜", "30,000円〜", "サンプル確認後にお見積り"];
const draft = (meta: string, body: string) =>
  `<!-- growth-draft\n${meta}\n-->\n${body}`;
const rules = (text: string) => lintDraft(text, prices).map((f) => f.rule);

describe("outbound draft lint (G16, G20, G26)", () => {
  it("requires a valid metadata block", () => {
    expect(parseDraft("本文だけ").error).toContain("メタデータ");
    expect(rules("本文だけ")).toEqual(["meta"]);
    expect(rules(draft("channel: unknown\nstatus: template", "x"))).toEqual([
      "meta",
    ]);
    expect(
      parseDraft(draft("channel: coconala\nstatus: template", "本文")).meta,
    ).toEqual({ channel: "coconala", status: "template", urlApproved: false });
  });
  it("allows placeholders in templates but not in a draft meant to be pasted", () => {
    const body = "【対応可能な範囲】を実装します。";
    expect(rules(draft("channel: lancers\nstatus: template", body))).toEqual(
      [],
    );
    expect(
      rules(draft("channel: lancers\nstatus: ready_for_owner", body)),
    ).toContain("placeholder");
    // Bracketed labels that are part of the brief format are not placeholders.
    expect(
      rules(
        draft(
          "channel: lancers\nstatus: ready_for_owner",
          "【相談内容】毎週のCSV整理を自動化したい",
        ),
      ),
    ).toEqual([]);
  });
  it("blocks unbacked claims and unapproved amounts", () => {
    const text = draft(
      "channel: lancers\nstatus: ready_for_owner",
      "必ず売上が上がります。16,500円で承ります。5,000円〜の修正も可能です。",
    );
    const found = lintDraft(text, prices);
    expect(found.filter((f) => f.rule === "claim").length).toBeGreaterThan(0);
    expect(found.filter((f) => f.rule === "price")).toHaveLength(1);
    expect(found.find((f) => f.rule === "price")?.detail).toContain("16,500");
    expect(allowedAmounts(prices).has("5,000")).toBe(true);
  });
  it("keeps marketplace drafts free of contact details and off-platform hints", () => {
    const body =
      "ご相談は contact@example.test へ。直接ご連絡いただければ対応します。";
    expect(rules(draft("channel: crowdworks\nstatus: template", body))).toEqual(
      expect.arrayContaining(["contact", "off_platform"]),
    );
    expect(rules(draft("channel: internal\nstatus: template", body))).toEqual(
      [],
    );
  });
  it("applies each marketplace's URL rule", () => {
    const body = "実績: https://tsudowa.com/services/web-fix";
    expect(rules(draft("channel: coconala\nstatus: template", body))).toContain(
      "url",
    );
    expect(
      rules(draft("channel: crowdworks\nstatus: template", body)),
    ).toContain("url");
    expect(
      rules(
        draft(
          "channel: crowdworks\nstatus: template\nurl_approved: true",
          body,
        ),
      ),
    ).toEqual([]);
    expect(rules(draft("channel: lancers\nstatus: template", body))).toEqual(
      [],
    );
    expect(
      lintDraft(
        draft("channel: lancers\nstatus: template", "https://example.test/x"),
        prices,
      ).map((f) => f.level),
    ).toEqual(["warn"]);
  });
});
