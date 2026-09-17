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
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tsudowa.com");
    vi.stubEnv("CONTACT_ENABLED", "true");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("STATE_BACKEND", "durable-objects");
    vi.stubEnv("HOSTING_PLATFORM", "cloudflare");
    expect(contactConfigured()).toBe(true);
    vi.stubEnv("HOSTING_PLATFORM", "netlify");
    expect(contactConfigured()).toBe(false);
    vi.stubEnv("HOSTING_PLATFORM", "cloudflare");
    for (const required of [
      "RESEND_API_KEY",
      "TURNSTILE_SECRET",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "RATE_LIMIT_SALT",
      "CONTACT_FROM_EMAIL",
      "CONTACT_TO_EMAIL",
      "NEXT_PUBLIC_SITE_URL",
    ]) {
      const previous = process.env[required]!;
      vi.stubEnv(required, "");
      expect(contactConfigured(), required + " must fail closed").toBe(false);
      vi.stubEnv(required, previous);
    }
  });
});
