import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "jsonc-parser";
const root = new URL("../", import.meta.url);
const secretNames = [
  "RESEND_API_KEY",
  "TURNSTILE_SECRET",
  "RATE_LIMIT_SALT",
  // The PostHog project key is read server-side at runtime; it stays a Worker
  // secret so it never lands in this public repository.
  "POSTHOG_PROJECT_KEY",
];
const analyticsHosts = ["https://us.i.posthog.com", "https://eu.i.posthog.com"];
const errors = [];
const source = parse(
  fs.readFileSync(new URL("wrangler.production.jsonc", root), "utf8"),
  errors,
  { allowTrailingComma: true },
);
if (errors.length) throw new Error("Invalid production config");
function guard(config) {
  if (
    config.name !== "tsudowa-production" ||
    config.account_id !== "403d3196e2006bbfb76edb1eba214acf" ||
    config.routes?.length !== 0 ||
    config.route ||
    config.env ||
    config.workers_dev !== true ||
    config.vars?.OWNER_REVIEW !== "false" ||
    config.vars?.CONTACT_ENABLED !== "true" ||
    config.vars?.CONTACT_ORIGIN ||
    config.vars?.HOSTING_PLATFORM !== "cloudflare" ||
    config.vars?.STATE_BACKEND !== "durable-objects" ||
    config.vars?.NEXT_PUBLIC_SITE_URL !== "https://tsudowa.com" ||
    config.vars?.CONTACT_FROM_EMAIL !== "no-reply@tsudowa.com" ||
    config.vars?.CONTACT_TO_EMAIL !== "contact@tsudowa.com" ||
    config.vars?.NEXT_PUBLIC_TURNSTILE_SITE_KEY !==
      "0x4AAAAAAE6gUHBs1hey6e76" ||
    config.assets?.run_worker_first !== true ||
    !["true", "false"].includes(config.vars?.NEXT_PUBLIC_ANALYTICS_ENABLED) ||
    // The browser switch and the Worker switch must agree: one decides whether
    // events are sent, the other whether they are forwarded.
    config.vars?.ANALYTICS_ENABLED !==
      config.vars?.NEXT_PUBLIC_ANALYTICS_ENABLED ||
    // With analytics on, the ingest host must be one the route accepts; with
    // it off, no host may be configured at all.
    (config.vars?.ANALYTICS_ENABLED === "true"
      ? !analyticsHosts.includes(config.vars?.POSTHOG_HOST)
      : !!config.vars?.POSTHOG_HOST) ||
    Object.keys(config.vars ?? {}).some(
      (name) =>
        secretNames.includes(name) || name.startsWith("OWNER_DIAGNOSTICS"),
    )
  )
    throw new Error(
      "Production candidate boundary failed; no deployment performed",
    );
}
guard(source);
const env = {
  ...process.env,
  ...source.vars,
  TSUDOWA_WORKERS_TARGET: "production",
  WRANGLER_WRITE_LOGS: "false",
  WRANGLER_LOG_SANITIZE: "true",
};
for (const name of [
  ...secretNames,
  "CONTACT_ORIGIN",
  "OWNER_DIAGNOSTICS_ENABLED",
])
  delete env[name];
function run(entry, args, commandEnv = env) {
  const r = spawnSync(process.execPath, [entry, ...args], {
    cwd: root,
    env: commandEnv,
    stdio: "inherit",
  });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const action = process.argv[2];
if (action === "build") {
  // Both contact and analytics keep their credentials in Cloudflare, so the
  // build-time check validates public metadata only. The runtime fails closed
  // without them: /api/contact reports disabled and /api/analytics returns 204.
  run("scripts/check-production.mjs", [], {
    ...env,
    CONTACT_ENABLED: "false",
    NEXT_PUBLIC_ANALYTICS_ENABLED: "false",
    ANALYTICS_ENABLED: "false",
  });
  run("scripts/generate-responsive-images.mjs", []);
  run("node_modules/vinext/dist/cli.js", ["build"]);
  guard(
    JSON.parse(
      fs.readFileSync(new URL("dist/server/wrangler.json", root), "utf8"),
    ),
  );
  const headersPath = new URL("dist/client/_headers", root);
  if (
    fs.existsSync(headersPath) &&
    /noindex/i.test(fs.readFileSync(headersPath, "utf8"))
  )
    throw new Error("Preview noindex leaked into production assets");
} else if (action === "deploy-candidate") {
  guard(
    JSON.parse(
      fs.readFileSync(new URL("dist/server/wrangler.json", root), "utf8"),
    ),
  );
  // No Custom Domain or DNS is attached by this script. Missing credentials
  // leave contact fail-closed; separate secret/runtime preflight gates cutover.
  run("node_modules/wrangler/bin/wrangler.js", [
    "deploy",
    "--keep-vars",
    "--config",
    "dist/server/wrangler.json",
  ]);
} else
  throw new Error(
    "Use build or deploy-candidate; Custom Domain requires separate cutover approval/preflight",
  );
