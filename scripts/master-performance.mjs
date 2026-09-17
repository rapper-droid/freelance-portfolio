import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
const phase = process.argv[2] || "after",
  routes = process.argv.slice(3);
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3147";
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname))
  throw Error("Local only");
const out = path.resolve("../../outputs/master-pass/performance-" + phase);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--remote-debugging-port=9224"],
});
const results = [];
try {
  for (const route of routes.length
    ? routes
    : [
        "/",
        "/works",
        "/demos/cafe",
        "/demos/inbox",
        "/demos/admin",
        "/demos/booking",
        "/contact",
      ]) {
    const { lhr } = await lighthouse(origin + route, {
      port: 9224,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    if (lhr.runtimeError) throw Error(lhr.runtimeError.message);
    const items = lhr.audits["resource-summary"].details.items;
    const record = {
      route,
      scores: Object.fromEntries(
        Object.entries(lhr.categories).map(([k, v]) => [
          k,
          Math.round(v.score * 100),
        ]),
      ),
      lcp: lhr.audits["largest-contentful-paint"].numericValue,
      cls: lhr.audits["cumulative-layout-shift"].numericValue,
      tbt: lhr.audits["total-blocking-time"].numericValue,
      requests: lhr.audits["network-requests"].details.items.length,
      longTasks: lhr.audits["long-tasks"]?.details?.items || [],
      images: items.find((v) => v.resourceType === "image"),
      css: items.find((v) => v.resourceType === "stylesheet"),
      blocking: lhr.audits["render-blocking-insight"],
      lcpDetails: lhr.audits["lcp-breakdown-insight"],
    };
    results.push(record);
    console.log(JSON.stringify(record));
    await fs.writeFile(
      path.join(
        out,
        (route === "/" ? "home" : route.slice(1).replaceAll("/", "-")) +
          ".json",
      ),
      JSON.stringify(lhr, null, 2),
    );
  }
  await fs.writeFile(
    path.join(out, "summary.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        note: "Local production / mobile simulated throttling, not field CWV or DevTools MCP",
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
