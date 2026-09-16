import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

function check(extra: Record<string, string>) {
  return spawnSync(process.execPath, ["scripts/check-production.mjs"], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: "",
      CONTACT_ENABLED: "false",
      NEXT_PUBLIC_ANALYTICS_ENABLED: "false",
      ...extra,
    },
    stdio: "ignore",
    windowsHide: true,
  }).status;
}

it("allows only the approved production HTTPS origin", () => {
  for (const url of [
    "",
    "http://tsudowa.com",
    "https://localhost",
    "https://tsudowa.com/path",
    "https://tsudowa.com?private",
    "https://user:password@tsudowa.com",
    "https://portfolio.example.test",
  ])
    expect(check({ NEXT_PUBLIC_SITE_URL: url })).not.toBe(0);
  expect(check({ NEXT_PUBLIC_SITE_URL: "https://tsudowa.com" })).toBe(0);
});

it("blocks enabled integrations with incomplete or wrong configuration", () => {
  expect(
    check({
      NEXT_PUBLIC_SITE_URL: "https://tsudowa.com",
      CONTACT_ENABLED: "true",
      RESEND_API_KEY: "",
    }),
  ).not.toBe(0);
  expect(
    check({
      NEXT_PUBLIC_SITE_URL: "https://tsudowa.com",
      CONTACT_ENABLED: "true",
      RESEND_API_KEY: "test-only",
      CONTACT_FROM_EMAIL: "wrong@example.test",
      CONTACT_TO_EMAIL: "wrong@example.test",
      TURNSTILE_SECRET: "test-only",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "test-only",
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "test-only",
      RATE_LIMIT_SALT: "x".repeat(32),
    }),
  ).not.toBe(0);
  expect(
    check({
      NEXT_PUBLIC_SITE_URL: "https://tsudowa.com",
      NEXT_PUBLIC_ANALYTICS_ENABLED: "true",
      POSTHOG_PROJECT_KEY: "",
    }),
  ).not.toBe(0);
});

it("accepts the approved TSUDOWA contact shape without exposing values", () => {
  expect(
    check({
      NEXT_PUBLIC_SITE_URL: "https://tsudowa.com",
      CONTACT_ENABLED: "true",
      RESEND_API_KEY: "test-only",
      CONTACT_FROM_EMAIL: "no-reply@tsudowa.com",
      CONTACT_TO_EMAIL: "contact@tsudowa.com",
      TURNSTILE_SECRET: "test-only",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "test-only",
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "test-only",
      RATE_LIMIT_SALT: "x".repeat(32),
    }),
  ).toBe(0);
});
