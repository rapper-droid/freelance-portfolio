import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
const required = [
  "RESEND_API_KEY",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
  "TURNSTILE_SECRET",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RATE_LIMIT_SALT",
];
const base = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: "https://tsudowa.com",
  CONTACT_ENABLED: "false",
  NEXT_PUBLIC_ANALYTICS_ENABLED: "false",
  ...Object.fromEntries(required.map((k) => [k, ""])),
};
const synthetic = {
  ...Object.fromEntries(required.map((k) => [k, "synthetic-not-a-secret"])),
  RATE_LIMIT_SALT: "synthetic-qa-salt-with-at-least-32-characters",
  CONTACT_FROM_EMAIL: "no-reply@tsudowa.com",
  CONTACT_TO_EMAIL: "contact@tsudowa.com",
};
const cases = [
  ["closed local review", {}, 0],
  [
    "wrong public origin",
    { NEXT_PUBLIC_SITE_URL: "https://wrong.example.test" },
    1,
  ],
  ["enabled with missing secrets", { CONTACT_ENABLED: "true" }, 1],
  [
    "wrong sender identity",
    {
      ...synthetic,
      CONTACT_ENABLED: "true",
      CONTACT_FROM_EMAIL: "wrong@example.test",
    },
    1,
  ],
  [
    "synthetic complete configuration",
    { ...synthetic, CONTACT_ENABLED: "true" },
    0,
  ],
];
const results = cases.map(([name, env, expected]) => {
  const r = spawnSync(process.execPath, ["scripts/check-production.mjs"], {
    env: { ...base, ...env },
    encoding: "utf8",
    windowsHide: true,
  });
  return { name, expected, exit: r.status, pass: expected === r.status };
});
await fs.writeFile(
  "../../outputs/master-pass/production-checks.json",
  JSON.stringify(
    {
      at: new Date().toISOString(),
      note: "Local configuration checker only. Synthetic values; no network requests and no live configuration verification.",
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.pass)) process.exitCode = 1;
