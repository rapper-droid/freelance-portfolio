import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDraft, sendableText } from "../../src/lib/growth/draft-lint";

const dir = "artifacts/growth-public/listings";
const draft = (name: string) => {
  const parsed = parseDraft(fs.readFileSync(`${dir}/${name}`, "utf8"));
  expect(parsed.meta, `${name}: ${parsed.error}`).not.toBeNull();
  return { meta: parsed.meta!, sendable: sendableText(parsed.body) };
};

describe("marketplace listings, ready to paste (A-04)", () => {
  it("states the approved price and a delivery time that is not same-day", () => {
    // The owner's decision of 2026-09-21: list at the site's own price on every
    // marketplace and absorb the fee. A listing quoting a different number
    // would undercut or contradict the published offer.
    const listed: [string, string, string][] = [
      ["coconala/service-web-fix.md", "5,500円", "5日"],
      ["lancers/package-web-fix.md", "5,500円", "7日"],
      ["lancers/package-csv-routine.md", "16,500円", "14日"],
    ];
    for (const [name, price, lead] of listed) {
      const file = fs.readFileSync(`${dir}/${name}`, "utf8");
      expect(draft(name).meta.status, name).toBe("ready_for_owner");
      // Price and delivery live in the owner's settings table, not in the
      // pasted copy, so assert against the whole file. The delivery figure is
      // days, never same-day; promising speed in the copy itself is caught by
      // the draft lint's unbacked-claim list, not here.
      expect(file, name).toContain(price);
      expect(file, name).toContain(`**${lead}**`);
      expect(Number.parseInt(lead, 10), name).toBeGreaterThanOrEqual(5);
    }
  });
  it("keeps every trace of the site out of what is pasted into Coconala", () => {
    // Coconala bans linking to a site that has a contact form, naming it, or
    // telling people to search for it. tsudowa.com has a contact form, so the
    // NG example "個人のポートフォリオサイトはこちらです http://XXX" applies
    // directly. (help.coconala.com/hc/ja/articles/9517266871193, 2026-09-21)
    const { sendable } = draft("coconala/service-web-fix.md");
    for (const trace of ["http", "tsudowa", "tetsuworks", "と検索", "QR"])
      expect(sendable, `Coconala copy contains ${trace}`).not.toContain(trace);
  });
  it("shows the Lancers demo as evidence attached to a described scope", () => {
    // Lancers bans inducement that leaves the listing's content unclear
    // (art.31(1)(14)); a link offered after the scope is spelled out is not
    // that. The link must still be our own and must stay next to the wording
    // that explains what it shows.
    for (const name of [
      "lancers/package-web-fix.md",
      "lancers/package-csv-routine.md",
    ]) {
      const { sendable } = draft(name);
      const urls = [...sendable.matchAll(/https?:\/\/\S+/g)].map((m) => m[0]);
      expect(urls, name).toHaveLength(1);
      expect(urls[0], name).toMatch(/^https:\/\/tsudowa\.com\/demos\//);
      expect(sendable, name).toContain("確認できる制作例");
      expect(sendable, name).toContain("自主制作");
    }
  });
  it("has a thumbnail on disk for every listing, free of AI illustration", () => {
    // Drawn by scripts/growth-listing-images.mjs from type and rectangles:
    // Coconala bans AI-generated illustration and QR codes in images.
    for (const image of [
      "coconala-web-fix",
      "lancers-web-fix",
      "lancers-csv-routine",
    ])
      expect(
        fs.statSync(`${dir}/images/${image}-1130x760.png`).size,
        image,
      ).toBeGreaterThan(1000);
    const script = fs.readFileSync("scripts/growth-listing-images.mjs", "utf8");
    expect(script).not.toMatch(/qr|<image|xlink:href/i);
  });
});
