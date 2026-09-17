import { afterEach, describe, it, expect, vi } from "vitest";
import { contactConfigured } from "../../src/lib/contact";
afterEach(() => vi.unstubAllEnvs());
describe("native contact configuration", () => {
  it("requires secrets but no Upstash only in explicit Cloudflare-native mode", () => {
    for (const name of [
      "RESEND_API_KEY",
      "CONTACT_FROM_EMAIL",
      "CONTACT_TO_EMAIL",
      "TURNSTILE_SECRET",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "RATE_LIMIT_SALT",
    ])
      vi.stubEnv(name, "fixture");
    vi.stubEnv("CONTACT_ENABLED", "true");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("STATE_BACKEND", "durable-objects");
    vi.stubEnv("HOSTING_PLATFORM", "cloudflare");
    expect(contactConfigured()).toBe(true);
    vi.stubEnv("HOSTING_PLATFORM", "netlify");
    expect(contactConfigured()).toBe(false);
    vi.stubEnv("HOSTING_PLATFORM", "cloudflare");
    vi.stubEnv("TURNSTILE_SECRET", "");
    expect(contactConfigured()).toBe(false);
  });
});
