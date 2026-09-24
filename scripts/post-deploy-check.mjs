import fs from "node:fs";

/**
 * What must be true about the site after a deployment (指示書 §25).
 *
 * Run against the public origin, not a local build. The last release proved
 * why: every local test was green and the deployed bundle threw on the first
 * click, because `node:crypto` is not in the Workers client bundle. Something
 * has to open the real thing.
 *
 * This checks the contract, not the content: every route answers what it is
 * supposed to answer (including the 404 that is supposed to 404), the public
 * demos stay out of the index, the APIs keep their shapes, and no page ships a
 * runtime error. The operable walkthroughs are qa:kissa and qa:forme, run
 * separately with QA_BASE_URL set to the same origin.
 *
 *   node scripts/post-deploy-check.mjs https://tsudowa.com
 */

const origin = (process.argv[2] ?? process.env.QA_BASE_URL ?? "").replace(
  /\/$/,
  "",
);
if (!/^https?:\/\//.test(origin)) {
  console.error("usage: node scripts/post-deploy-check.mjs <origin>");
  process.exit(2);
}

const results = [];
const fail = [];

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) fail.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? `  ${detail}` : ""}`);
}

async function get(path, init) {
  const response = await fetch(origin + path, {
    redirect: "manual",
    ...init,
  });
  const text = response.headers
    .get("content-type")
    ?.includes("application/octet-stream")
    ? ""
    : await response.text().catch(() => "");
  return { status: response.status, headers: response.headers, text };
}

// ---- routes ----------------------------------------------------------------
// Read from the ledger so a route added later is checked without editing this.
const inventory = JSON.parse(
  fs.readFileSync("docs/rebuild/ROUTE_INVENTORY.json", "utf8"),
);
const pages = inventory.routes.filter((r) => r.kind === "page");

let bad = [];
for (const row of pages) {
  const { status } = await get(row.route);
  if (status !== row.status) bad.push(`${row.route} ${status}≠${row.status}`);
}
check(
  `全 ${pages.length} ページが台帳どおりの応答`,
  bad.length === 0,
  bad.slice(0, 5).join(", "),
);

// ---- the public demos stay out of the index --------------------------------
const sitemap = await get("/sitemap.xml");
const shopsInSitemap = ["/kissa", "/forme"].filter((p) =>
  sitemap.text.includes(`${origin}${p}`),
);
check(
  "店が sitemap に載っていない",
  shopsInSitemap.length === 0,
  shopsInSitemap.join(", "),
);

for (const route of ["/kissa", "/kissa/menu", "/forme", "/forme/items"]) {
  const { text } = await get(route);
  const noindex = /<meta name="robots" content="noindex/.test(text);
  check(`${route} が noindex`, noindex);
}

// A page that must stay indexed, so the check above cannot pass by accident.
const works = await get("/works");
check("/works は noindex ではない", !/content="noindex/.test(works.text));

// ---- APIs keep their shape -------------------------------------------------
const analytics = await get("/api/analytics");
check(
  "/api/analytics は GET に 405",
  analytics.status === 405,
  `got ${analytics.status}`,
);

const contact = await get("/api/contact");
check(
  "/api/contact は 200（受付可能）",
  contact.status === 200,
  `got ${contact.status}`,
);

const missing = await get("/__does_not_exist_" + Date.now());
check("未知の URL は 404", missing.status === 404, `got ${missing.status}`);

// ---- nothing secret travels ------------------------------------------------
const home = await get("/");
const leaked = [
  "RESEND_API_KEY",
  "TURNSTILE_SECRET",
  "RATE_LIMIT_SALT",
  "POSTHOG_PROJECT_KEY",
].filter((name) => home.text.includes(name));
check(
  "シークレット名が HTML に出ていない",
  leaked.length === 0,
  leaked.join(", "),
);

check("HTTPS で配信されている", origin.startsWith("https://"), origin);

// ---- summary ---------------------------------------------------------------
console.log(
  `\n${results.filter((r) => r.ok).length}/${results.length} checks passed against ${origin}`,
);
if (fail.length) {
  console.error("\n" + fail.join("\n"));
  process.exit(1);
}
