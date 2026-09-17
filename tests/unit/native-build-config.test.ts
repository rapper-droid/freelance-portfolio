import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
const settings = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: "https://tsudowa.com",
  CONTACT_ENABLED: "true",
  HOSTING_PLATFORM: "cloudflare",
  STATE_BACKEND: "durable-objects",
  RESEND_API_KEY: "fixture-only",
  CONTACT_FROM_EMAIL: "no-reply@tsudowa.com",
  CONTACT_TO_EMAIL: "contact@tsudowa.com",
  TURNSTILE_SECRET: "fixture-only",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "fixture-only",
  RATE_LIMIT_SALT: "fixture-only-salt-123456789123456789",
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: "",
  NEXT_PUBLIC_ANALYTICS_ENABLED: "false",
};
const run = (env: NodeJS.ProcessEnv) =>
  spawnSync(process.execPath, ["scripts/check-production.mjs"], {
    env,
    encoding: "utf8",
  });
describe("native production configuration validation", () => {
  it("permits native storage without external Redis credentials", () =>
    expect(run(settings).status).toBe(0));
  it("still requires Redis for Netlify", () =>
    expect(run({ ...settings, HOSTING_PLATFORM: "netlify" }).status).not.toBe(
      0,
    ));
  it("still rejects missing secrets or unapproved mail sender", () => {
    expect(run({ ...settings, TURNSTILE_SECRET: "" }).status).not.toBe(0);
    expect(run({ ...settings, RATE_LIMIT_SALT: "short" }).status).not.toBe(0);
    expect(
      run({ ...settings, CONTACT_FROM_EMAIL: "wrong@example.test" }).status,
    ).not.toBe(0);
  });
});
