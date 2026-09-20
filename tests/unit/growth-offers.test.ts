import { afterEach, describe, expect, it, vi } from "vitest";
import {
  offers,
  publishedOffers,
  getOffer,
  offerForDemo,
  offerHeading,
} from "../../src/lib/offers";
import { offerRoutes } from "../../src/lib/offer-routes";
import { briefText } from "../../src/lib/brief";
import { categories, getProject } from "../../src/lib/portfolio";
import {
  categoryKinds,
  contactContext,
  contactKinds,
} from "../../src/lib/contact-options";
import { validateContact } from "../../src/lib/contact";
import { DRAFT_KEY, writeBriefDraft } from "../../src/lib/contact-draft";
import {
  currentPlatform,
  platformFromSearch,
  rememberPlatform,
} from "../../src/lib/visit-source";
import { safeEvent, posthogPayload } from "../../src/lib/analytics";
import sitemap from "../../src/app/sitemap";

afterEach(() => {
  vi.unstubAllGlobals();
});
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("offer master (G04, G05, G06, G42, G45)", () => {
  it("keeps the client route index equal to the published offers", () => {
    expect(Object.keys(offerRoutes).sort()).toEqual(
      publishedOffers.map((o) => o.slug).sort(),
    );
    for (const o of publishedOffers) {
      const route = offerRoutes[o.slug as keyof typeof offerRoutes];
      expect(route.category).toBe(o.category);
      expect(route.title).toBe(o.shortTitle);
    }
  });
  it("publishes only verified offers with unique ids and slugs", () => {
    expect(publishedOffers.length).toBeGreaterThanOrEqual(2);
    expect(publishedOffers.every((o) => o.state === "verified")).toBe(true);
    expect(new Set(offers.map((o) => o.id)).size).toBe(offers.length);
    expect(new Set(offers.map((o) => o.slug)).size).toBe(offers.length);
    expect(getOffer("does-not-exist")).toBeUndefined();
  });
  it("states scope, exclusions, preparation, acceptance and 3-5 FAQs", () => {
    for (const o of publishedOffers) {
      expect(o.deliverables.length).toBeGreaterThan(0);
      expect(o.exclusions.length).toBeGreaterThan(0);
      expect(o.prerequisites.length).toBeGreaterThan(0);
      expect(o.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(o.faqs.length).toBeGreaterThanOrEqual(3);
      expect(o.faqs.length).toBeLessThanOrEqual(5);
      expect(o.brief.filter((q) => q.required)).toHaveLength(1);
      expect(categories.some((c) => c.id === o.category)).toBe(true);
    }
  });
  it("links every offer to a real demo whose project points back to it", () => {
    for (const o of publishedOffers) {
      expect(getProject(o.demo.slug)).toBeDefined();
      expect(offerForDemo(o.demo.slug)).toBe(o);
      for (const e of o.evidence)
        if (e.href)
          expect(e.href).toMatch(/^\/(demos|projects|works|history)\//);
    }
  });
  it("shows only a price the owner approved, and always tax-included", () => {
    // Approved by the owner on 2026-09-21 for these exact scopes
    // (docs/growth/OFFER_REVIEW.md). Anything else must not carry a number.
    const approved: Record<string, string> = {
      W01: "5,500円（税込）",
      W02: "16,500円（税込）",
    };
    const published = new Set<string>(categories.map((c) => c.price));
    for (const o of publishedOffers) {
      if (o.price.status === "fixed") {
        expect(o.price.displayLabel).toBe(approved[o.id]);
        expect(o.price.displayLabel).toContain("税込");
        // A fixed price only means anything with the scope beside it.
        expect(o.price.note).toMatch(/範囲/);
      } else if (o.price.status === "reference")
        expect(published.has(o.price.displayLabel)).toBe(true);
      else expect(o.price.displayLabel).not.toMatch(/\d/);
      // Prices the owner has not approved (W03-W06) never reach the site.
      expect(JSON.stringify(o)).not.toMatch(/22,000|33,000|55,000/);
    }
    // Every published offer carries one of the three states, nothing else.
    for (const o of publishedOffers)
      expect(["fixed", "reference", "quote_required"]).toContain(
        o.price.status,
      );
  });
  it("makes no unbacked promise (G28)", () => {
    const copy = JSON.stringify(publishedOffers);
    for (const word of [
      "必ず",
      "保証します",
      "即納",
      "24時間対応",
      "売上アップ",
      "AIが分析",
      "実績多数",
    ])
      expect(copy).not.toContain(word);
  });
});

describe("brief builder output (G11, G20)", () => {
  it("lists every question, marks blanks as 未記入 and adds timing/budget", () => {
    const o = publishedOffers[0];
    const text = briefText(
      offerHeading(o),
      o.brief,
      { [o.brief[0].id]: "  スマホで表がはみ出す  " },
      { timing: "1か月以内", budget: "〜3万円" },
    );
    const lines = text.split("\n");
    expect(lines[0]).toBe(`【相談したいこと】${o.shortTitle}（${o.id}）`);
    expect(lines[1]).toBe(`【${o.brief[0].label}】スマホで表がはみ出す`);
    expect(lines).toHaveLength(o.brief.length + 3);
    expect(text).toContain("未記入");
    expect(text).toContain("【希望時期】1か月以内");
    expect(text).not.toMatch(/https?:\/\/(?!\S*tsudowa\.com)/);
  });
});

describe("contact context for offers and the partner desk", () => {
  it("accepts /services/<published> with its category and rejects others", () => {
    expect(contactContext("/services/web-fix")).toEqual({
      page: "/services/web-fix",
      category: "improvement",
      project: "",
      demo: "",
    });
    expect(contactContext("/services/csv-routine")?.category).toBe(
      "automation",
    );
    for (const page of [
      "/services/unknown",
      "/services/web-fix?x=1",
      "/services/../contact",
      "/services/Web-Fix",
    ])
      expect(contactContext(page)).toBeNull();
    for (const page of ["/services", "/partners", "/rescue"])
      expect(contactContext(page)).toEqual({
        page,
        category: "",
        project: "",
        demo: "",
      });
  });
  it("lets the server accept an inquiry sent from an offer page", () => {
    const body = {
      name: "架空 太郎",
      email: "fixture@example.test",
      detail: "【相談したいこと】表示崩れの修正 1か所（W01）",
      token: "t",
      id: "8f14e45f-ceea-467a-9b2b-1234567890ab",
      consent: true,
      website: "",
      page: "/services/web-fix",
      kind: categoryKinds.improvement,
    };
    expect(validateContact(body)).toMatchObject({
      page: "/services/web-fix",
      category: "improvement",
      kind: contactKinds[4],
    });
    expect(validateContact({ ...body, category: "automation" })).toBeNull();
  });
});

describe("brief hand-off to the contact form (G13, G50)", () => {
  it("writes a session draft the form restores, keeping typed reply details", () => {
    const storage = memoryStorage({
      [DRAFT_KEY]: JSON.stringify({
        fields: { name: "架空", company: "", email: "a@example.test" },
        savedAt: 1_000,
      }),
    });
    vi.stubGlobal("sessionStorage", storage);
    expect(
      writeBriefDraft(
        "/services/web-fix",
        {
          kind: contactKinds[4],
          detail: "x".repeat(2500),
          budget: "〜3万円",
          timing: "存在しない時期",
          reference: "https://example.test/page",
        },
        2_000,
      ),
    ).toBe(true);
    const saved = JSON.parse(storage.data.get(DRAFT_KEY)!);
    expect(saved.page).toBe("/services/web-fix");
    expect(saved.origin).toBe("brief");
    expect(saved.fields.detail).toHaveLength(2000);
    expect(saved.fields.timing).toBe("未定");
    expect(saved.fields.budget).toBe("〜3万円");
    expect(saved.fields.name).toBe("架空");
    expect(saved.fields.email).toBe("a@example.test");
    expect(
      Object.values(saved.fields).every((v) => typeof v === "string"),
    ).toBe(true);
  });
  it("refuses unknown pages and survives unavailable storage", () => {
    vi.stubGlobal("sessionStorage", memoryStorage());
    expect(
      writeBriefDraft("/services/nope", { kind: "その他", detail: "x" }),
    ).toBe(false);
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(writeBriefDraft("/partners", { kind: "その他", detail: "x" })).toBe(
      false,
    );
  });
});

describe("marketplace memory (G16, G30)", () => {
  it("recognises only known marketplaces from utm_source", () => {
    expect(platformFromSearch("?utm_source=crowdworks")).toBe("crowdworks");
    expect(platformFromSearch("?utm_source=lancers&x=1")).toBe("lancers");
    expect(platformFromSearch("?utm_source=coconala")).toBe("coconala");
    expect(platformFromSearch("?utm_source=__proto__")).toBeNull();
    expect(platformFromSearch("?utm_source=evil")).toBeNull();
    expect(platformFromSearch("")).toBeNull();
  });
  it("stores only the marketplace id and expires after 12 hours", () => {
    const storage = memoryStorage();
    vi.stubGlobal("sessionStorage", storage);
    vi.stubGlobal("location", {
      search: "?utm_source=crowdworks&name=private",
    });
    expect(rememberPlatform(0)).toBe("crowdworks");
    expect(JSON.parse(storage.data.get("tsudowa-platform")!)).toEqual({
      platform: "crowdworks",
      at: 0,
    });
    vi.stubGlobal("location", { search: "" });
    expect(currentPlatform(11 * 3600000)).toBe("crowdworks");
    expect(currentPlatform(13 * 3600000)).toBeNull();
  });
});

describe("growth events stay inside the allowlist (G08, G31)", () => {
  it("accepts the new events with a known offer id only", () => {
    for (const event of [
      "service_view",
      "brief_created",
      "consultation_cta_clicked",
    ])
      expect(safeEvent({ event, offer: "web-fix" })).toEqual({
        event,
        offer: "web-fix",
      });
    expect(safeEvent({ event: "service_view", offer: "free text" })).toBeNull();
    expect(
      safeEvent({ event: "tool_completed", project: "csv" })?.project,
    ).toBe("csv");
    expect(safeEvent({ event: "inquiry_accepted" })).toBeNull();
  });
  it("forwards the offer id but never brief text", () => {
    const payload = posthogPayload(
      { event: "brief_created", offer: "csv-routine", detail: "秘密の本文" },
      "key",
      "id",
    );
    expect(payload?.properties).toMatchObject({ offer: "csv-routine" });
    expect(JSON.stringify(payload)).not.toContain("秘密の本文");
  });
});

describe("sitemap (G29)", () => {
  it("lists the offer pages and the partner desk once each", () => {
    const urls = sitemap().map((e) => new URL(e.url).pathname);
    for (const path of [
      "/services",
      "/partners",
      "/rescue",
      ...publishedOffers.map((o) => `/services/${o.slug}`),
    ])
      expect(urls.filter((u) => u === path)).toHaveLength(1);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
