import { chromium, devices } from "@playwright/test";
import fs from "node:fs/promises";
const origin = process.env.QA_BASE_URL || "http://localhost:3000";
await fs.mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage(
      width <= 390
        ? { ...devices["iPhone 13"], viewport: { width, height: 800 } }
        : { viewport: { width, height: 900 } },
    );
    for (const route of ["/", "/demos/csv", "/demos/inbox", "/demos/admin"]) {
      await page.goto(origin + route);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      if (overflow)
        throw new Error(`Horizontal overflow at ${width}px: ${route}`);
    }
    await page.goto(origin);
    if (width === 390 || width === 1440) {
      const name = width === 390 ? "mobile" : "desktop";
      await page.screenshot({
        path: `docs/screenshots/home-${name}-firstview.png`,
      });
      if (width === 390)
        await page
          .locator("#contact")
          .screenshot({ path: "docs/screenshots/contact-mobile.png" });
    }
    console.log(`Visual viewport sweep: ${width}px / 4 routes / no overflow`);
    await page.close();
  }
} finally {
  await browser.close();
}
