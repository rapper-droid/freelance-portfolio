import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const out = "../../outputs/master-pass/working";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const route of [
      "/",
      "/works",
      "/demos/cafe",
      "/demos/inbox",
      "/demos/admin",
      "/demos/booking",
      "/contact",
      "/experience/cafe",
    ]) {
      await page.goto("http://127.0.0.1:3147" + route, {
        waitUntil: "networkidle",
      });
      await page.screenshot({
        path:
          out +
          "/" +
          (route === "/" ? "top" : route.slice(1).replaceAll("/", "-")) +
          "-" +
          width +
          ".png",
      });
      const axe = await new AxeBuilder({ page }).analyze();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      const record = {
        route,
        width,
        overflow,
        violations: axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            html: n.html,
            summary: n.failureSummary,
          })),
        })),
      };
      console.log(JSON.stringify(record));
      results.push(record);
    }
    await page.close();
  }
  await fs.writeFile(out + "/smoke.json", JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
