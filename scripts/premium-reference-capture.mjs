import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const folder = "../premium-references";
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const [name, url] of [
    ["linear", "https://linear.app/"],
    ["pentagram", "https://www.pentagram.com/work"],
    ["kurasu", "https://kurasu.kyoto/"],
    ["cal", "https://cal.com/"],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 35000,
      });
      await page
        .locator("h1")
        .first()
        .waitFor({ state: "visible", timeout: 15000 })
        .catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${folder}/${name}.png` });
      results.push({
        name,
        url,
        status: response?.status(),
        title: await page.title(),
      });
    } catch (error) {
      results.push({ name, url, error: error.message });
    }
    await page.close();
  }
  await fs.writeFile(
    `${folder}/manifest.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        note: "Internal visual reference only. Not licensed for reuse; never copy to public assets.",
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
