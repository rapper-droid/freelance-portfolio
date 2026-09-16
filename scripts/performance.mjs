import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
const origin = process.env.QA_BASE_URL || "http://localhost:3104";
const server = process.env.QA_BASE_URL
  ? null
  : spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--port", "3104"],
      { stdio: "ignore", windowsHide: true },
    );
let browser;
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready) throw new Error("Performance server did not start");
  await fs.mkdir("docs/performance", { recursive: true });
  browser = await chromium.launch({ args: ["--remote-debugging-port=9223"] });
  const summary = [];
  const routes = [
    "/",
    "/works",
    "/works/lp",
    "/projects/cafe",
    "/projects/saas",
    "/projects/ec",
    "/projects/inbox",
    "/demos/booking",
    "/demos/cafe",
    "/demos/inbox",
    "/demos/admin",
    "/works/automation",
    "/works/api",
    "/works/qa",
  ];
  const requested = process.argv.slice(2);
  if (requested.some((route) => !routes.includes(route)))
    throw new Error("Unknown performance route");
  for (const route of requested.length ? requested : routes) {
    const result = await lighthouse(origin + route, {
      port: 9223,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    if (!result || result.lhr.runtimeError)
      throw new Error(result?.lhr.runtimeError?.message || "Lighthouse failed");
    const lhr = result.lhr;
    const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
    await fs.writeFile(
      `docs/performance/${slug}.json`,
      JSON.stringify(lhr, null, 2) + "\n",
    );
    const record = {
      route,
      mobile: true,
      scores: Object.fromEntries(
        Object.entries(lhr.categories).map(([k, v]) => [
          k,
          Math.round((v.score ?? 0) * 100),
        ]),
      ),
      lcpMs: lhr.audits["largest-contentful-paint"].numericValue,
      cls: lhr.audits["cumulative-layout-shift"].numericValue,
      tbtMs: lhr.audits["total-blocking-time"].numericValue,
      jsBytes: lhr.audits["resource-summary"].details?.items?.find(
        (item) => item.resourceType === "script",
      )?.transferSize,
    };
    summary.push(record);
    console.log(JSON.stringify(record));
  }
  await fs.writeFile(
    requested.length
      ? "docs/performance/summary-targeted.json"
      : "docs/performance/summary.json",
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        note: "Local production build; Lighthouse mobile simulated throttling. Not field Core Web Vitals.",
        results: summary,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser?.close();
  server?.kill();
}
