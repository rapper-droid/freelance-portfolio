import fs from "node:fs";
import vm from "node:vm";
import { parse } from "jsonc-parser";
import { describe, expect, it } from "vitest";

const script = fs.readFileSync("scripts/workers-preview.mjs", "utf8");
const guardSource = script.slice(
  script.indexOf("function guard(config)"),
  script.indexOf("guard(source);"),
);
const guard = vm.runInNewContext(`(${guardSource.trim()})`) as (
  config: Record<string, unknown>,
) => void;
const baseline = () =>
  parse(fs.readFileSync("wrangler.jsonc", "utf8"), [], {
    allowTrailingComma: true,
  });

describe("preview deployment boundary", () => {
  it("permits only the enabled owner preview profile", () => {
    expect(() => guard(baseline())).not.toThrow();
  });
  it.each([
    ["name", "tsudowa-production"],
    ["account_id", "another-account"],
    ["routes", [{ pattern: "tsudowa.com", custom_domain: true }]],
    ["route", "tsudowa.com/*"],
    ["env", { production: {} }],
    ["workers_dev", false],
  ])("rejects changed boundary %s", (key, value) => {
    const config = baseline();
    config[key] = value;
    expect(() => guard(config)).toThrow("Owner-preview boundary failed");
  });
  it.each([
    ["CONTACT_ENABLED", "false"],
    ["CONTACT_ORIGIN", "https://tsudowa.com"],
    ["HOSTING_PLATFORM", "netlify"],
    ["STATE_BACKEND", "memory"],
    ["OWNER_REVIEW", "false"],
    ["NEXT_PUBLIC_ANALYTICS_ENABLED", "true"],
    ["NEXT_PUBLIC_SITE_URL", "https://example.invalid"],
    ["CONTACT_FROM_EMAIL", "other@example.invalid"],
    ["CONTACT_TO_EMAIL", "other@example.invalid"],
    ["RESEND_API_KEY", ""],
    ["TURNSTILE_SECRET", ""],
    ["RATE_LIMIT_SALT", ""],
  ])("rejects changed or secret var %s", (key, value) => {
    const config = baseline();
    config.vars[key] = value;
    expect(() => guard(config)).toThrow("Owner-preview boundary failed");
  });
});
