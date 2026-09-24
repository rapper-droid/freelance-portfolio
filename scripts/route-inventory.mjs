import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

/**
 * Builds the route inventory the rebuild is managed against (指示書 §04).
 *
 * Built from what the application actually serves, not from parsing source:
 * the generated sitemap supplies every dynamic entity, and each route is then
 * requested so the recorded status is observed rather than assumed. Parsing
 * TypeScript for id lists was the first attempt and it silently merged two
 * exports, reporting 23 category pages where twelve exist.
 *
 * Error routes stay in the inventory as routes that are *supposed* to answer
 * 404. Making them return 200 so a table looks green is the failure this
 * inventory exists to prevent.
 */

const ROOT = process.cwd();
const PORT = process.env.INVENTORY_PORT || "3501";
const ORIGIN = `http://127.0.0.1:${PORT}`;

/** Routes that serve something other than an HTML page. */
const ASSETS = ["/sitemap.xml", "/robots.txt", "/icon.png", "/apple-icon.png"];
const APIS = ["/api/contact", "/api/analytics", "/api/flow"];

/**
 * The two shop demos. Noindex by design, so the sitemap never mentions them.
 *
 * The product pages are not listed: two of fourteen were, which made the
 * ledger claim a template had two entities when it has fourteen. They are read
 * off the live listing page instead, the same way the sitemap supplies every
 * other dynamic entity (指示書 §04 — 全実体を含める).
 */
const FORME = [
  "/forme",
  "/forme/items",
  "/forme/cart",
  "/forme/my",
  "/forme/admin",
];

const KISSA = [
  "/kissa",
  "/kissa/menu",
  "/kissa/reserve",
  "/kissa/order",
  "/kissa/my",
  "/kissa/admin",
];

/** Every product link the listing page actually renders. */
async function entitiesOn(origin, listing, prefix) {
  const html = await (await fetch(origin + listing)).text();
  const found = [
    ...html.matchAll(new RegExp(`href="(${prefix}/[a-z0-9-]+)"`, "g")),
  ].map((m) => m[1]);
  const routes = [...new Set(found)].sort();
  if (routes.length === 0)
    throw new Error(`no entities found under ${prefix} — parser out of date`);
  return routes;
}
/**
 * REPORT FLOW's record screens. The tool itself is in the sitemap; these two
 * are per-visitor and would be indexed empty, so they are listed here instead
 * of being advertised — but they are still routes, and still inventoried.
 */
const REPORT = ["/report/recipes", "/report/history"];

/** Requested to confirm the 404 boundary still answers 404. */
const ERROR_PROBE = "/__inventory_probe_404";
/** Endpoints whose correct answer to a GET is not 200. */
const API_EXPECTED = { "/api/analytics": 405 };

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--port", PORT],
  { stdio: "ignore", windowsHide: true, cwd: ROOT },
);

const templateOf = (route) => {
  for (const [pattern, template] of [
    [/^\/works\/[^/]+$/, "/works/[category]"],
    [/^\/projects\/[^/]+$/, "/projects/[slug]"],
    [/^\/demos\/[^/]+$/, "/demos/[slug]"],
    [/^\/experience\/[^/]+$/, "/experience/[slug]"],
    [/^\/services\/[^/]+$/, "/services/[slug]"],
    [/^\/kissa\/menu\/[^/]+$/, "/kissa/menu/[productId]"],
    [/^\/forme\/items\/[^/]+$/, "/forme/items/[productId]"],
  ])
    if (pattern.test(route)) return template;
  return route;
};

try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(ORIGIN)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready) throw new Error("inventory server did not start");

  const sitemap = await (await fetch(ORIGIN + "/sitemap.xml")).text();
  const fromSitemap = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(
    (m) => new URL(m[1]).pathname,
  );

  const pages = [...new Set(fromSitemap)].sort();
  const routes = [];

  for (const route of pages) {
    const response = await fetch(ORIGIN + route, { redirect: "manual" });
    const template = templateOf(route);
    routes.push({
      kind: "page",
      template,
      route,
      entity: template === route ? null : route.split("/").pop(),
      status: response.status,
      inSitemap: true,
    });
  }

  // /experience/* is deliberately absent from the sitemap (standalone views of
  // the same demos) but the routes exist and must be inventoried, or a whole
  // template disappears from the ledger.
  for (const demo of pages.filter((p) => p.startsWith("/demos/"))) {
    const route = demo.replace("/demos/", "/experience/");
    const response = await fetch(ORIGIN + route, { redirect: "manual" });
    routes.push({
      kind: "page",
      template: "/experience/[slug]",
      route,
      entity: route.split("/").pop(),
      status: response.status,
      inSitemap: false,
    });
  }

  // KISSA is noindex by design — a fictional shop must not be indexed as a
  // real one — so it never reaches the sitemap. The routes exist and are
  // inventoried here, or the whole shop is invisible to the ledger.
  const shopRoutes = [
    ...REPORT,
    ...KISSA,
    ...(await entitiesOn(ORIGIN, "/kissa/menu", "/kissa/menu")),
    ...FORME,
    ...(await entitiesOn(ORIGIN, "/forme/items", "/forme/items")),
  ];

  for (const route of shopRoutes) {
    const response = await fetch(ORIGIN + route, { redirect: "manual" });
    routes.push({
      kind: "page",
      template: templateOf(route),
      route,
      entity: templateOf(route) === route ? null : route.split("/").pop(),
      status: response.status,
      inSitemap: false,
      // The shops are noindex by design; REPORT FLOW's record screens are
      // simply not advertised, which is a different thing and recorded as one.
      noindex: !route.startsWith("/report"),
    });
  }

  for (const route of APIS) {
    const response = await fetch(ORIGIN + route, { redirect: "manual" });
    routes.push({
      kind: "api",
      template: route,
      route,
      entity: null,
      status: response.status,
      inSitemap: false,
      // /api/analytics accepts POST only; 405 on GET is the contract, not a
      // defect, and is recorded so a future 200 would stand out.
      expectedStatus: API_EXPECTED[route] ?? 200,
    });
  }

  for (const route of ASSETS) {
    const response = await fetch(ORIGIN + route, { redirect: "manual" });
    routes.push({
      kind: "asset",
      template: route,
      route,
      entity: null,
      status: response.status,
      inSitemap: false,
    });
  }

  const probe = await fetch(ORIGIN + ERROR_PROBE, { redirect: "manual" });
  routes.push({
    kind: "error",
    template: "/_not-found",
    route: ERROR_PROBE,
    entity: null,
    status: probe.status,
    inSitemap: false,
    // Recorded as the expected answer, so a future 200 here reads as a defect.
    expectedStatus: 404,
  });

  const byTemplate = {};
  for (const r of routes)
    byTemplate[r.template] = (byTemplate[r.template] ?? 0) + 1;
  const counts = {};
  for (const r of routes) counts[r.kind] = (counts[r.kind] ?? 0) + 1;

  const unexpected = routes.filter(
    (r) => r.status !== (r.expectedStatus ?? 200),
  );

  fs.mkdirSync(path.join(ROOT, "docs/rebuild"), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, "docs/rebuild/ROUTE_INVENTORY.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        counts,
        byTemplate,
        unexpected: unexpected.map((r) => ({
          route: r.route,
          status: r.status,
        })),
        routes,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(
    `route inventory: ${routes.length} entries — ` +
      Object.entries(counts)
        .map(([k, v]) => `${k} ${v}`)
        .join(", "),
  );
  for (const [template, n] of Object.entries(byTemplate).sort())
    console.log(`  ${template.padEnd(26)} ${n}`);
  if (unexpected.length) {
    console.error("\nunexpected status:");
    for (const r of unexpected) console.error(`  ${r.route} -> ${r.status}`);
    process.exitCode = 1;
  }
} finally {
  server.kill();
}
