import { afterEach, expect, it, vi } from "vitest";
import { clientBucket, fingerprint } from "../../src/lib/abuse";
afterEach(() => vi.unstubAllEnvs());
it("trusts Cloudflare's overwritten connection header only in its explicit host mode", () => {
  vi.stubEnv("RATE_LIMIT_SALT", "test-only-salt-".repeat(4));
  vi.stubEnv("NETLIFY", "false");
  const request = new Request("https://test.invalid", {
    headers: { "cf-connecting-ip": "192.0.2.10", "x-forwarded-for": "spoofed" },
  });
  vi.stubEnv("HOSTING_PLATFORM", "cloudflare");
  expect(clientBucket(request)).toBe(fingerprint("192.0.2.10"));
  vi.stubEnv("HOSTING_PLATFORM", "unknown");
  expect(clientBucket(request)).toBe(fingerprint("shared-untrusted-host"));
});
it("keeps Netlify's trusted header and does not trust Cloudflare headers there", () => {
  vi.stubEnv("RATE_LIMIT_SALT", "test-only-salt-".repeat(4));
  vi.stubEnv("NETLIFY", "true");
  vi.stubEnv("HOSTING_PLATFORM", "cloudflare");
  const request = new Request("https://test.invalid", {
    headers: {
      "x-nf-client-connection-ip": "192.0.2.20",
      "cf-connecting-ip": "spoofed",
    },
  });
  expect(clientBucket(request)).toBe(fingerprint("192.0.2.20"));
});
