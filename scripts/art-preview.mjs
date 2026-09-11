import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch();
try {
  await fs.mkdir("docs/screenshots/art-direction", { recursive: true });
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto(process.env.QA_BASE_URL || "http://localhost:3106");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/screenshots/art-direction/home-${width}.png`,
    });
    console.log(
      width,
      await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        title: getComputedStyle(document.querySelector("h1")).fontSize,
      })),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
