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
    "/report",
    "/automation",
    "/daybook",
    // The two heaviest, most interactive routes on the site had never been
    // measured: they carry a catalogue, a provider and a sandbox read.
    "/kissa",
    "/kissa/menu",
    "/kissa/menu/latte",
    "/forme",
    "/forme/items",
    "/forme/items/tumbler",
  ];

  /**
   * What a run has to clear, and what it only records.
   *
   * Lighthouse's performance score moves several points between runs on a
   * loaded machine — twenty runs back to back cost the home page fourteen
   * points here, and it measured 87–90 alone a minute later. So the score is
   * recorded with a floor low enough that only a real regression trips it,
   * while the deterministic things are held exactly.
   */
  const BUDGET = {
    // A smoke floor, not a target. Measured 71 on /works while the machine was
    // finishing twenty other Lighthouse runs, and 84 alone; anything tighter
    // would fail on CI's mood rather than on a change.
    performance: 60,
    // Deterministic, so these are held exactly.
    accessibility: 100,
    "best-practices": 95,
    seo: 100,
    cls: 0.05,
    // The real regression guard: transferred script per route. It comes from
    // the build, not from how busy the machine is, so it catches a heavy
    // import on the day it lands instead of when someone notices the score.
    jsBytes: 320_000,
  };

  /**
   * The public demos are deliberately `noindex, follow` and absent from the
   * sitemap, which Lighthouse scores as an SEO failure. It is the isolation
   * working, so the SEO budget does not apply to them — stated here, with the
   * reason, rather than silently lowering the number for everyone.
   */
  const noIndex = (route) =>
    route.startsWith("/kissa") ||
    route.startsWith("/forme") ||
    route.startsWith("/daybook");

  const failures = [];
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

    const check = (name, actual, limit, ok) =>
      ok || failures.push(`${route}: ${name} ${actual} (budget ${limit})`);

    check(
      "performance",
      record.scores.performance,
      `>= ${BUDGET.performance}`,
      record.scores.performance >= BUDGET.performance,
    );
    check(
      "accessibility",
      record.scores.accessibility,
      BUDGET.accessibility,
      record.scores.accessibility === BUDGET.accessibility,
    );
    check(
      "best-practices",
      record.scores["best-practices"],
      `>= ${BUDGET["best-practices"]}`,
      record.scores["best-practices"] >= BUDGET["best-practices"],
    );
    check(
      "cls",
      record.cls.toFixed(3),
      `<= ${BUDGET.cls}`,
      record.cls <= BUDGET.cls,
    );
    check(
      "jsBytes",
      record.jsBytes,
      `<= ${BUDGET.jsBytes}`,
      (record.jsBytes ?? 0) <= BUDGET.jsBytes,
    );
    if (!noIndex(route))
      check(
        "seo",
        record.scores.seo,
        BUDGET.seo,
        record.scores.seo === BUDGET.seo,
      );
  }
  await fs.writeFile(
    requested.length
      ? "docs/performance/summary-targeted.json"
      : "docs/performance/summary.json",
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        note: "Local production build; Lighthouse mobile simulated throttling. Not field Core Web Vitals.",
        budget: BUDGET,
        seoExempt:
          "/kissa/*, /forme/* and /daybook/* are noindex on purpose; the SEO budget does not apply to them.",
        failures,
        results: summary,
      },
      null,
      2,
    ) + "\n",
  );
  if (failures.length) {
    console.error(["", ...failures].join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`\nPASS ${summary.length} routes within budget`);
  }
} finally {
  await browser?.close();
  server?.kill();
}
