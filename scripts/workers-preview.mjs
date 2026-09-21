import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "jsonc-parser";
const root = new URL("../", import.meta.url);
const errors = [];
const source = parse(
  fs.readFileSync(new URL("wrangler.jsonc", root), "utf8"),
  errors,
  { allowTrailingComma: true },
);
if (errors.length)
  throw new Error("Invalid Wrangler JSONC; no deployment performed.");
function guard(config) {
  if (
    config.name !== "tsudowa-owner-preview" ||
    config.account_id !== "403d3196e2006bbfb76edb1eba214acf" ||
    (config.routes?.length ?? 0) !== 0 ||
    config.route ||
    config.env ||
    config.workers_dev !== true ||
    config.vars?.CONTACT_ENABLED !== "true" ||
    config.vars?.CONTACT_ORIGIN !==
      "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev" ||
    config.vars?.HOSTING_PLATFORM !== "cloudflare" ||
    config.vars?.STATE_BACKEND !== "durable-objects" ||
    config.vars?.CONTACT_FROM_EMAIL !== "no-reply@tsudowa.com" ||
    config.vars?.CONTACT_TO_EMAIL !== "contact@tsudowa.com" ||
    ["RESEND_API_KEY", "TURNSTILE_SECRET", "RATE_LIMIT_SALT"].some((name) =>
      Object.hasOwn(config.vars ?? {}, name),
    ) ||
    config.vars?.OWNER_REVIEW !== "true" ||
    config.vars?.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false" ||
    config.vars?.ANALYTICS_ENABLED !== "false" ||
    config.vars?.NEXT_PUBLIC_SITE_URL !== "https://tsudowa.com"
  ) {
    throw new Error("Owner-preview boundary failed; no deployment performed.");
  }
}
guard(source);
const action = process.argv[2];
const env = { ...process.env, ...source.vars };
// Runtime secrets remain in Cloudflare; never pass local copies to the compiler.
for (const name of ["RESEND_API_KEY", "TURNSTILE_SECRET", "RATE_LIMIT_SALT"])
  delete env[name];
env.WRANGLER_WRITE_LOGS = "false";
env.WRANGLER_LOG_SANITIZE = "true";
const run = (entry, args, commandEnv = env) => {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd: root,
    env: commandEnv,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
if (action === "build") {
  // Check public build metadata without requiring remote-only credentials locally.
  // The actual build remains enabled; deployment and the runtime fail closed.
  run("scripts/check-production.mjs", [], { ...env, CONTACT_ENABLED: "false" });
  run("scripts/generate-responsive-images.mjs", []);
  run("node_modules/vinext/dist/cli.js", ["build"]);
  fs.writeFileSync(
    new URL("dist/client/_headers", root),
    "/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n",
  );
} else if (action === "deploy") {
  const built = JSON.parse(
    fs.readFileSync(new URL("dist/server/wrangler.json", root), "utf8"),
  );
  guard(built);
  const secrets = spawnSync(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "secret",
      "list",
      "--config",
      "dist/server/wrangler.json",
    ],
    { cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (secrets.error || secrets.status !== 0)
    throw new Error(
      "Preview secret-name preflight failed; no deployment performed.",
    );
  let names;
  try {
    names = JSON.parse(secrets.stdout);
  } catch {
    throw new Error("Invalid secret-name response; no deployment performed.");
  }
  if (
    !["RESEND_API_KEY", "TURNSTILE_SECRET", "RATE_LIMIT_SALT"].every((name) =>
      names.some(
        (secret) => secret.name === name && secret.type === "secret_text",
      ),
    )
  )
    throw new Error(
      "Required preview secrets missing; no deployment performed.",
    );
  console.log("Preview secret-name preflight passed (values not accessed).");
  run("node_modules/wrangler/bin/wrangler.js", [
    "deploy",
    "--keep-vars",
    "--config",
    "dist/server/wrangler.json",
  ]);
} else
  throw new Error(
    "Use build or deploy. Production domains are deliberately unsupported.",
  );
