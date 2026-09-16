import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import { categories, projects } from "../src/lib/portfolio.ts";
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3137";
const routes = [
  "/",
  "/works",
  "/privacy",
  ...categories.map((c) => `/works/${c.id}`),
  ...projects.flatMap((p) => [`/projects/${p.slug}`, `/demos/${p.slug}`]),
];
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const route of routes) {
      const response = await page.goto(origin + route, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => {
        document
          .querySelectorAll(".home-ui > *")
          .forEach((el) => (el.style.contentVisibility = "visible"));
      });
      await page.evaluate(() =>
        Promise.all(
          [...document.images].map((i) => {
            i.loading = "eager";
            return i.decode().catch(() => {});
          }),
        ),
      );
      const axe = await new AxeBuilder({ page }).analyze();
      const failures = axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      }));
      results.push({
        route,
        width,
        status: response.status(),
        violations: failures,
      });
      console.log(
        `${width} ${route}: ${failures.length ? JSON.stringify(failures) : "AXE PASS"}`,
      );
    }
    await context.close();
  }
  await fs.mkdir("docs/screenshots/premium", { recursive: true });
  await fs.writeFile(
    "docs/screenshots/premium/accessibility.json",
    JSON.stringify({ at: new Date().toISOString(), origin, results }, null, 2) +
      "\n",
  );
  if (results.some((r) => r.status !== 200 || r.violations.length))
    process.exitCode = 1;
} finally {
  await browser.close();
}
