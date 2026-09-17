import fs from "node:fs/promises";
import path from "node:path";
const phase = process.argv[2] || "baseline";
if (!/^[a-z0-9-]+$/.test(phase)) throw Error("Invalid phase");
const root = path.resolve(
  "../../outputs/workers-performance-contact-20260917",
  phase,
);
const median = (values) => {
  const n = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  return n.length ? n[Math.floor(n.length / 2)] : null;
};
const routes = ["/", "/works", "/demos/cafe", "/demos/inbox", "/contact"];
const rows = [];
for (const route of routes)
  for (const host of ["netlify", "workers"]) {
    const slug = route === "/" ? "top" : route.slice(1).replaceAll("/", "-");
    const lh = [],
      nav = [];
    for (let n = 1; n <= 3; n++) {
      const l = JSON.parse(
        await fs.readFile(
          path.join(root, `lh-${host}-${slug}-${n}.json`),
          "utf8",
        ),
      );
      if (l.runtimeError) throw Error("Invalid Lighthouse run");
      lh.push(l);
      nav.push(
        JSON.parse(
          await fs.readFile(
            path.join(root, `nav-${host}-${slug}-${n}.json`),
            "utf8",
          ),
        ),
      );
    }
    const metric = (name) => median(lh.map((l) => l.audits[name].numericValue));
    const category = (name) =>
      Math.round(median(lh.map((l) => l.categories[name].score * 100)));
    const navMedian = (cache) => {
      const samples = nav.map((n) => n.samples.find((s) => s.cache === cache));
      return Object.fromEntries(
        [
          "ttfbMs",
          "domContentLoadedMs",
          "loadMs",
          "requestCount",
          "transferBytes",
          "jsBytes",
          "cssBytes",
          "imageBytes",
          "apiMs",
        ].map((k) => [
          k,
          median(
            samples.map(
              (s) => s.navigation[k] ?? (k === "apiMs" ? s.api.ms : s[k]),
            ),
          ),
        ]),
      );
    };
    rows.push({
      host,
      route,
      runs: 3,
      performance: category("performance"),
      accessibility: category("accessibility"),
      bestPractices: category("best-practices"),
      seo: category("seo"),
      lcpMs: metric("largest-contentful-paint"),
      cls: metric("cumulative-layout-shift"),
      tbtMs: metric("total-blocking-time"),
      fcpMs: metric("first-contentful-paint"),
      speedIndexMs: metric("speed-index"),
      lcpRangeMs: lh.map(
        (l) => l.audits["largest-contentful-paint"].numericValue,
      ),
      cold: navMedian("cold"),
      warm: navMedian("warm"),
      lighthouseSettings: lh[0].configSettings,
    });
  }
const comparison = routes.map((route) => {
  const n = rows.find((r) => r.host === "netlify" && r.route === route),
    w = rows.find((r) => r.host === "workers" && r.route === route);
  const delta = w.lcpMs - n.lcpMs,
    transfer = w.cold.transferBytes - n.cold.transferBytes;
  const slower =
    delta > Math.max(300, n.lcpMs * 0.15) ||
    w.tbtMs - n.tbtMs > 150 ||
    w.cls > 0.1 ||
    (transfer > 100000 && transfer > n.cold.transferBytes * 0.25);
  const faster =
    delta < -Math.max(200, n.lcpMs * 0.1) ||
    (n.tbtMs - w.tbtMs > 100 && delta < 300);
  return {
    route,
    verdict: slower
      ? "Workers slower"
      : faster
        ? "Workers faster"
        : "Equivalent",
    lcpDeltaMs: delta,
    transferDeltaBytes: transfer,
  };
});
const result = {
  phase,
  conditions:
    "Lighthouse mobile simulated, fresh browser each run, alternating host order; Navigation 390x844 DPR2 no synthetic throttle, cold fresh context/warm second navigation, idle+2s, no scroll. CDN state and Internet latency uncontrolled. Laboratory measurements, not field CWV.",
  decisionRule:
    "Slower: LCP regression > max(300ms,15%), or TBT >150ms worse, or CLS >0.1, or wire bytes increase >100KB and >25%. Faster: LCP improves >max(200ms,10%) or TBT improves >100ms with LCP regression <300ms. Otherwise Equivalent.",
  rows,
  comparison,
  status: comparison.some((c) => c.verdict === "Workers slower")
    ? "PERFORMANCE_BLOCKED"
    : "PERFORMANCE_READY",
};
await fs.writeFile(
  path.join(root, "summary.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      status: result.status,
      rows: rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).filter(([key]) => key !== "lighthouseSettings"),
        ),
      ),
      comparison,
    },
    null,
    2,
  ),
);
