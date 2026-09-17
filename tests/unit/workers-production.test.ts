import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import { parse } from "jsonc-parser";
const fetchApp = vi.hoisted(() => vi.fn());
const fetchAsset = vi.hoisted(() => vi.fn());
vi.mock("../../src/workers/entry", () => ({ default: { fetch: fetchApp } }));
// Keep Cloudflare globals out of the Next.js typecheck; the real entry is
// separately checked by tsconfig.workers.json. Only its mocked fetch boundary
// is loaded here, not the platform's Durable Object implementation.
const workerModule = "../../src/workers/production-entry";
const {
  default: worker,
}: {
  default: {
    fetch(
      request: Request,
      env: { ASSETS: { fetch: typeof fetchAsset } },
      ctx: object,
    ): Promise<Response>;
  };
} = await import(workerModule);

describe("production Worker boundary", () => {
  beforeEach(() => {
    fetchAsset.mockReset();
    fetchAsset.mockResolvedValue(new Response(null, { status: 404 }));
    fetchApp.mockReset();
    fetchApp.mockResolvedValue(
      new Response("ok", { headers: { "X-Test": "preserved" } }),
    );
  });
  const request = (url: string) =>
    worker.fetch(new Request(url), { ASSETS: { fetch: fetchAsset } }, {});
  it("serves built static assets before invoking Vinext", async () => {
    fetchAsset.mockResolvedValue(
      new Response("body{}", { headers: { "Content-Type": "text/css" } }),
    );
    const r = await request("https://tsudowa.com/_next/static/css/test.css");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("text/css");
    expect(await r.text()).toBe("body{}");
    expect(fetchApp).not.toHaveBeenCalled();
  });
  it("redirects www preserving encoded path and query", async () => {
    const r = await request(
      "https://www.tsudowa.com/works/a%20b?x=1&next=%2Fcontact",
    );
    expect(r.status).toBe(308);
    expect(r.headers.get("location")).toBe(
      "https://tsudowa.com/works/a%20b?x=1&next=%2Fcontact",
    );
    expect(fetchApp).not.toHaveBeenCalled();
  });
  it("does not redirect apex or suffix-lookalike hosts", async () => {
    for (const hostname of ["tsudowa.com", "www.tsudowa.com.example.org"]) {
      const r = await request(`https://${hostname}/works`);
      expect(r.status).toBe(200);
      expect(r.headers.get("location")).toBeNull();
    }
  });
  it("does not add noindex to the public apex", async () => {
    const r = await request("https://tsudowa.com/");
    expect(r.headers.get("x-robots-tag")).toBeNull();
    expect(r.headers.get("x-test")).toBe("preserved");
  });
  it("noindexes the candidate hostname without changing the response", async () => {
    const r = await request(
      "https://tsudowa-production.tetsuyasmile52l.workers.dev/",
    );
    expect(r.headers.get("x-robots-tag")).toContain("noindex");
    expect(r.headers.get("x-test")).toBe("preserved");
    expect(await r.text()).toBe("ok");
  });
  it("keeps production and preview config isolated and secret-free", () => {
    const read = (name: string) =>
      parse(fs.readFileSync(name, "utf8"), [], { allowTrailingComma: true });
    const production = read("wrangler.production.jsonc");
    const preview = read("wrangler.jsonc");
    expect(production.name).toBe("tsudowa-production");
    expect(preview.name).toBe("tsudowa-owner-preview");
    expect(production.routes).toEqual([]);
    expect(production.vars.OWNER_REVIEW).toBe("false");
    expect(preview.vars.OWNER_REVIEW).toBe("true");
    expect(production.vars.CONTACT_ORIGIN).toBeUndefined();
    expect(production.assets.run_worker_first).toBe(true);
    for (const key of [
      "RESEND_API_KEY",
      "TURNSTILE_SECRET",
      "RATE_LIMIT_SALT",
      "OWNER_DIAGNOSTICS_ENABLED",
    ])
      expect(production.vars[key]).toBeUndefined();
  });
});
