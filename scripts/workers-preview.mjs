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
    config.vars?.CONTACT_ENABLED !== "false" ||
    config.vars?.OWNER_REVIEW !== "true" ||
    config.vars?.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false" ||
    config.vars?.NEXT_PUBLIC_SITE_URL !== "https://tsudowa.com"
  ) {
    throw new Error("Owner-preview boundary failed; no deployment performed.");
  }
}
guard(source);
const action = process.argv[2];
const env = { ...process.env, ...source.vars };
const run = (entry, args) => {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
if (action === "build") {
  run("scripts/check-production.mjs", []);
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
  run("node_modules/wrangler/bin/wrangler.js", [
    "deploy",
    "--config",
    "dist/server/wrangler.json",
  ]);
} else
  throw new Error(
    "Use build or deploy. Production domains are deliberately unsupported.",
  );
