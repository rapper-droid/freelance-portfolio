import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

/**
 * Each case spawns a real `node scripts/check-production.mjs`, which is the
 * point — the guard is a process that exits non-zero, not a function we can
 * call. Eight spawns do not fit vitest's 5s default on a machine that is also
 * running a browser suite, and it failed exactly that way. The assertions are
 * unchanged; only the time allowed for starting processes is.
 */
const SPAWN_TIMEOUT = 30_000;

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

it(
  "allows only the approved production HTTPS origin",
  () => {
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
  },
  SPAWN_TIMEOUT,
);

it(
  "blocks enabled integrations with incomplete or wrong configuration",
  () => {
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
  },
  SPAWN_TIMEOUT,
);

it(
  "accepts the approved TSUDOWA contact shape without exposing values",
  () => {
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
  },
  SPAWN_TIMEOUT,
);
