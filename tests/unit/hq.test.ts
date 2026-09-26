import { describe, expect, it } from "vitest";
import {
  buildRecords,
  buildYears,
  dateLabel,
  hqBrands,
  hqConcept,
  hqUpdatedAt,
  labPublication,
  selectedHqProjects,
} from "../../src/lib/hq";
describe("HQ editorial contract", () => {
  it("lists only the present brands and curated, existing self-initiated projects", () => {
    expect(hqConcept).toBe("集まり、つくり、次へ広がる。");
    expect(hqBrands.map((b) => b.name)).toEqual([
      "TETSU WORKS",
      "TSUDOWA MUSIC",
      "TSUKUTTA LAB",
    ]);
    expect(hqBrands.map((b) => b.href)).toEqual([
      "/works",
      "https://music.tsudowa.com",
      "/lab",
    ]);
    // A brand that lives on another host is rendered as a plain external link, and a brand
    // that is not finished says which stage it is at rather than implying a full release.
    for (const brand of hqBrands) {
      expect(brand.external ?? false).toBe(brand.href.startsWith("http"));
      if (brand.external) expect(brand.href.startsWith("https://")).toBe(true);
    }
    const music = hqBrands.find((b) => b.id === "tsudowa-music");
    expect(music?.stage).toBe("Public Beta");
    expect(music?.state).toBe("Public Beta");
    expect(music?.statement).toBe("気持ちを書く。曲になる。自由に鳴らす。");
    // Public Beta must not be advertised as something you can buy or as finished singing.
    expect(music?.description).not.toMatch(/購入|販売|円|AIが歌|完成版/);
    expect(selectedHqProjects).toHaveLength(3);
    expect(new Set(selectedHqProjects.map((p) => p.slug)).size).toBe(3);
    for (const p of selectedHqProjects) {
      expect(p.project.slug).toBe(p.slug);
      expect(p.project.limitation.length).toBeGreaterThan(0);
      expect(p.problem.length).toBeGreaterThan(0);
      expect(p.result).not.toMatch(/%|売上|受注|導入企業/);
    }
  });
  it("keeps history source-backed, date-explicit and extensible without fake live state", () => {
    expect(hqUpdatedAt).toBe("2026-09-24");
    expect(new Set(buildRecords.map((r) => r.id)).size).toBe(
      buildRecords.length,
    );
    for (const r of buildRecords) {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.source.ref).toMatch(/^[a-f0-9]{7,40}$/);
      expect(r.href).toMatch(/^\//);
    }
    expect(
      buildYears([
        ...buildRecords,
        { ...buildRecords[0], id: "future-fixture-only", date: "2030-01-01" },
      ]),
    ).toEqual(["2030", "2026"]);
    expect(dateLabel("2026-09-17")).toBe("2026.09.17");
  });
  it("does not silently enable an unverified LAB destination", () => {
    expect(labPublication.state).toBe("public-url-unverified");
    expect(labPublication.verifiedPublicUrl).toBeNull();
  });
});
