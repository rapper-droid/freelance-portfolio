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
it("blocks deployment without a real HTTPS origin", () => {
  for (const url of [
    "",
    "http://example.test",
    "https://localhost",
    "https://example.test/path",
    "https://example.test?private",
    "https://user:password@example.test",
  ])
    expect(check({ NEXT_PUBLIC_SITE_URL: url })).not.toBe(0);
  expect(
    check({ NEXT_PUBLIC_SITE_URL: "https://portfolio.example.test" }),
  ).toBe(0);
});
it("blocks enabled integrations with incomplete configuration", () => {
  expect(
    check({
      NEXT_PUBLIC_SITE_URL: "https://portfolio.example.test",
      CONTACT_ENABLED: "true",
      RESEND_API_KEY: "",
    }),
  ).not.toBe(0);
  expect(
    check({
      NEXT_PUBLIC_SITE_URL: "https://portfolio.example.test",
      NEXT_PUBLIC_ANALYTICS_ENABLED: "true",
      POSTHOG_PROJECT_KEY: "",
    }),
  ).not.toBe(0);
});
