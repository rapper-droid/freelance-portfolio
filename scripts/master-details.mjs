import { chromium } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs/promises";
const origin = "http://127.0.0.1:3147",
  out = "../../outputs/master-pass";
const browser = await chromium.launch(),
  observations = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await context.route("**/*", (r) =>
      new URL(r.request().url()).origin === origin &&
      ["GET", "HEAD"].includes(r.request().method())
        ? r.continue()
        : r.abort(),
    );
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: "networkidle" });
    // No injected CSS. Inspect each section after real scrolling into the viewport.
    for (const id of [
      "brands",
      "tetsu-works",
      "services",
      "works",
      "pricing",
      "delivery",
      "qa",
      "faq",
      "contact",
    ]) {
      const target = page.locator("#" + id);
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      observations.push({
        width,
        id,
        ...(await target.evaluate((e) => ({
          height: Math.round(e.getBoundingClientRect().height),
          opacity: getComputedStyle(e).opacity,
          heading: e.querySelector("h1,h2,h3")?.textContent,
          contentVisibility: getComputedStyle(e).contentVisibility,
          onscreen:
            e.getBoundingClientRect().bottom > 0 &&
            e.getBoundingClientRect().top < innerHeight,
        }))),
      });
      if (["pricing", "delivery", "qa", "contact"].includes(id))
        await page.screenshot({ path: `${out}/native-${id}-${width}.png` });
    }
    const baseline = out + `/before/top-${width}-full.png`,
      meta = await sharp(baseline).metadata();
    const height = Math.min(meta.height, width === 390 ? 1800 : 1200);
    await sharp(baseline)
      .extract({
        left: 0,
        top: meta.height - height,
        width: meta.width,
        height,
      })
      .png()
      .toFile(`${out}/before/contact-${width}-top-ending.png`);
    await page.goto(origin + "/contact", { waitUntil: "networkidle" });
    const detail = page.getByLabel("ご相談内容", { exact: false });
    await detail.focus();
    observations.push({
      width,
      formFocus: await detail.evaluate((e) => ({
        focused: document.activeElement === e,
        height: e.getBoundingClientRect().height,
        viewportHeight: innerHeight,
        onscreen:
          e.getBoundingClientRect().top >= 0 &&
          e.getBoundingClientRect().bottom <= innerHeight,
      })),
      tapTargets: await page
        .locator(".intake-choice-grid label")
        .evaluateAll((es) =>
          es.map((e) => ({
            height: e.getBoundingClientRect().height,
            width: e.getBoundingClientRect().width,
          })),
        ),
    });
    await context.close();
  }
  await fs.writeFile(
    out + "/native-scroll-form.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        note: "Unmodified DOM/CSS, actual browser scrolling. Keyboard focus is desktop Chromium emulation, not a physical mobile software keyboard.",
        observations,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
