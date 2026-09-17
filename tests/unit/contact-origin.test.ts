import { afterEach, describe, it, expect, vi } from "vitest";
import { contactOrigin } from "../../src/lib/contact";
afterEach(() => vi.unstubAllEnvs());
describe("preview contact origin", () => {
  it("keeps canonical origin by default", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tsudowa.com");
    vi.stubEnv("CONTACT_ORIGIN", "");
    expect(contactOrigin()?.origin).toBe("https://tsudowa.com");
  });
  it("allows only the explicitly approved Cloudflare owner preview", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tsudowa.com");
    vi.stubEnv("HOSTING_PLATFORM", "cloudflare");
    vi.stubEnv("OWNER_REVIEW", "true");
    vi.stubEnv(
      "CONTACT_ORIGIN",
      "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev",
    );
    expect(contactOrigin()?.hostname).toBe(
      "tsudowa-owner-preview.tetsuyasmile52l.workers.dev",
    );
  });
  it.each([
    "https://evil.invalid",
    "http://127.0.0.1:3170",
    "https://tsudowa.com",
    "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev.evil.invalid",
  ])("rejects unapproved override %s", (origin) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tsudowa.com");
    vi.stubEnv("HOSTING_PLATFORM", "cloudflare");
    vi.stubEnv("OWNER_REVIEW", "true");
    vi.stubEnv("CONTACT_ORIGIN", origin);
    expect(contactOrigin()).toBeNull();
  });
  it("never activates the override for Netlify or production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tsudowa.com");
    vi.stubEnv(
      "CONTACT_ORIGIN",
      "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev",
    );
    vi.stubEnv("HOSTING_PLATFORM", "netlify");
    vi.stubEnv("OWNER_REVIEW", "true");
    expect(contactOrigin()).toBeNull();
    vi.stubEnv("HOSTING_PLATFORM", "cloudflare");
    vi.stubEnv("OWNER_REVIEW", "false");
    expect(contactOrigin()).toBeNull();
  });
});
