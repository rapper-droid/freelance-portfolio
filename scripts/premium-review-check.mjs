import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await fs.mkdir("../../outputs/tsudowa-review-images", { recursive: true });
  // Refresh the only route affected by the last narrow-screen tap-target polish.
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(
      `${process.env.QA_BASE_URL || "http://127.0.0.1:3147"}/demos/booking`,
      { waitUntil: "networkidle" },
    );
    await page.evaluate(() => document.fonts.ready);
    for (const extent of ["", "-full"]) {
      const source = `docs/screenshots/premium/after/demos-booking-${width}${extent}.png`;
      await page.screenshot({ path: source, fullPage: extent === "-full" });
      await fs.copyFile(
        source,
        `../../outputs/tsudowa-review-images/after-demos-booking-${width}${extent}.png`,
      );
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(pathToFileURL(path.resolve("docs/PREMIUM_REVIEW.html")).href);
  let checks = 0;
  for (const route of [
    "home",
    "works",
    "works-web",
    "works-automation",
    "demos-cafe",
    "demos-inbox",
    "demos-admin",
    "demos-booking",
  ]) {
    for (const width of ["1440", "390"]) {
      for (const extent of ["", "-full"]) {
        await page.locator("#route").selectOption(route);
        await page.locator("#width").selectOption(width);
        await page.locator("#extent").selectOption(extent);
        await page.evaluate(() =>
          Promise.all([...document.images].map((i) => i.decode())),
        );
        checks += 2;
      }
    }
  }
  await page.locator("#route").selectOption("home");
  await page.locator("#width").selectOption("1440");
  await page.locator("#extent").selectOption("");
  await page.evaluate(() =>
    Promise.all([...document.images].map((i) => i.decode())),
  );
  await page.screenshot({ path: "../../outputs/TSUDOWA_REVIEW_preview.png" });
  console.log(
    JSON.stringify({ comparisonImagesVerified: checks, scriptErrors: errors }),
  );
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
