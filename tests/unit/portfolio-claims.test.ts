import { describe, it, expect } from "vitest";
import { getProject, projects } from "../../src/lib/portfolio";
import { liveRoutes, workingEntry } from "../../src/lib/working-versions";

/**
 * What the catalogue is allowed to say.
 *
 * P1–P3 changed what four of these demos actually do, and the descriptions
 * kept claiming the old behaviour: that the inbox forgets on reload, that the
 * cafe takes no reservations, that the shop takes no orders. Every one of
 * those was true when written and false by the time it shipped.
 *
 * These are the two failures worth catching automatically. A demo must not
 * deny something a visitor can do two clicks later, and the sales boundary —
 * every price, every delivery estimate, and the fact that all of it is
 * self-initiated and fictional — must not move because someone was rewriting
 * a sentence next to it.
 */

/** Pinned deliberately. A copy pass must not move a number. */
const SALES_BOUNDARY: Record<string, [price: string, duration: string]> = {
  cafe: ["50,000円〜", "7〜14営業日"],
  saas: ["30,000円〜", "5〜10営業日"],
  ec: ["内容により見積", "5〜10営業日"],
  automation: ["要件により見積", "要件確定後に提示"],
  booking: ["要件により見積", "要件確定後に提示"],
  improvement: ["5,000円〜 / 1ページ", "1〜2営業日〜"],
  creative: ["5,000円〜 / 1点", "1〜3営業日〜"],
  qa: ["要件により見積", "対象範囲確認後に提示"],
  csv: ["要件により見積", "仕様確認後に提示"],
  inbox: ["要件により見積", "仕様確認後に提示"],
  admin: ["要件により見積", "仕様確認後に提示"],
};

describe("sales boundary", () => {
  it("keeps every price and delivery estimate exactly as published", () => {
    expect(Object.keys(SALES_BOUNDARY).sort()).toEqual(
      projects.map((p) => p.slug).sort(),
    );
    for (const p of projects)
      expect([p.price, p.duration]).toEqual(SALES_BOUNDARY[p.slug]);
  });

  it("still says of every demo that it is fictional, self-initiated or local", () => {
    // None of the eleven is client delivery, and every limitation has to say
    // so one way or another: the business is invented, the build is our own,
    // or nothing leaves the visitor's browser.
    for (const p of projects)
      expect(p.limitation, p.slug).toMatch(
        /架空|自主制作|シミュレーション|ブラウザ/,
      );
  });
});

describe("working versions", () => {
  it("points only at demos that exist, with unique routes under this site", () => {
    const seen = new Set<string>();
    for (const [slug, live] of Object.entries(liveRoutes)) {
      expect(getProject(slug), slug).toBeTruthy();
      expect(live.routes.length).toBeGreaterThan(1);
      for (const route of live.routes) {
        expect(route.href).toMatch(/^\/[a-z]/);
        expect(seen.has(route.href)).toBe(false);
        seen.add(route.href);
        expect(route.label.length).toBeGreaterThan(0);
        expect(route.detail.length).toBeGreaterThan(0);
      }
    }
  });

  it("offers a card the front door, and nothing for a demo without one", () => {
    expect(workingEntry("cafe")?.href).toBe("/kissa");
    expect(workingEntry("ec")?.href).toBe("/forme");
    expect(workingEntry("inbox")).toBeNull();
    expect(workingEntry("nope")).toBeNull();
  });
});

describe("no demo denies what it can do", () => {
  // The claims that were true before P1–P3 and false after. Each is written as
  // the phrase a visitor would read, not as a regex over the whole document,
  // so a rewrite that means the same thing still trips it.
  const FORBIDDEN: Record<string, RegExp[]> = {
    // KISSA takes orders and books tables.
    cafe: [/来店予約[^。]*行いません/, /注文[^。]*(ありません|できません)/],
    // FORME takes orders, and the order survives a reload.
    ec: [
      /注文[^。]*(ありません|できません)/,
      /再読み込み[^。]*初期化/,
      /カート[^。]*ありません/,
    ],
    // CSV AUTOMATOR became REPORT FLOW: it saves rules and keeps a history.
    csv: [/再読み込み[^。]*初期化/, /保存[^。]*できません/],
    // The operations record persists, and reaches the other two screens.
    inbox: [/再読み込み[^。]*初期化/],
    automation: [/再読み込み[^。]*初期化/],
    admin: [/再読み込み[^。]*初期化/],
  };

  for (const [slug, patterns] of Object.entries(FORBIDDEN)) {
    it(`${slug}: the limitation does not contradict the demo`, () => {
      const p = getProject(slug)!;
      const text = [p.summary, p.solution, p.limitation, ...p.features].join(
        " ",
      );
      for (const pattern of patterns) expect(text).not.toMatch(pattern);
    });
  }

  it("DAYBOOK still states the reset, because DAYBOOK still resets", () => {
    // The one demo that deliberately keeps nothing. Saying so is the honest
    // claim here, so this is the inverse of the checks above.
    expect(getProject("booking")!.limitation).toMatch(/初期化/);
  });

  it("names the operable experiences where a visitor is told what persists", () => {
    for (const slug of ["cafe", "ec", "csv"]) {
      const p = getProject(slug)!;
      expect(p.limitation).toMatch(/ブラウザ|保存|発生しません/);
    }
  });
});
