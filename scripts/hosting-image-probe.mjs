import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
const phase = process.argv[2] || "baseline";
if (!/^[a-z0-9-]+$/.test(phase)) throw Error("Invalid phase");
const out = path.resolve(
  "../../outputs/workers-performance-contact-20260917",
  phase,
);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch(),
  results = [];
try {
  for (const [host, origin] of Object.entries({
    netlify: "https://tsudowa.com",
    workers: "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev",
  })) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
    });
    for (const route of [
      "/",
      "/works",
      "/demos/cafe",
      "/demos/inbox",
      "/contact",
    ]) {
      await page.goto(origin + route, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 70));
        }
        scrollTo(0, 0);
      });
      await page.waitForLoadState("networkidle");
      const images = await page.evaluate(() =>
        [...document.images]
          .filter((i) => i.currentSrc && !i.currentSrc.startsWith("data:"))
          .map((i) => ({
            src: i.currentSrc,
            alt: i.alt,
            renderedWidth: i.getBoundingClientRect().width,
            renderedHeight: i.getBoundingClientRect().height,
            naturalWidth: i.naturalWidth,
            naturalHeight: i.naturalHeight,
          })),
      );
      for (const image of images) {
        if (new URL(image.src).origin !== origin) continue;
        const r = await page.request.get(image.src);
        const bytes = await r.body();
        let decoded;
        try {
          const m = await sharp(bytes).metadata();
          decoded = { width: m.width, height: m.height, format: m.format };
        } catch {
          decoded = null;
        }
        results.push({
          host,
          route,
          ...image,
          status: r.status(),
          finalUrl: r.url(),
          encodedBodyBytes: bytes.length,
          decoded,
          strategy: r.headers()["x-image-strategy"] || null,
        });
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile(
  path.join(out, "images.json"),
  JSON.stringify(
    {
      note: "Separate image body/decode probe after scrolling, NOT navigation timing; browser mobile DPR2. Encoded body bytes exclude headers.",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    images: results.length,
    failed: results.filter((r) => r.status !== 200).length,
  }),
);
