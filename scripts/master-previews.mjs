import { chromium } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs/promises";
import { projects } from "../src/lib/portfolio.ts";
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3147";
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname))
  throw Error("Local only");
const out = "../../outputs/master-pass/preview-sources";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const records = [];
try {
  for (const project of projects) {
    for (const [device, width, height] of [
      ["desktop", 1440, 1000],
      ["tablet", 768, 1024],
      ["mobile", 390, 844],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "reduce",
      });
      await context.route("**/*", (r) =>
        new URL(r.request().url()).origin === origin &&
        ["GET", "HEAD"].includes(r.request().method())
          ? r.continue()
          : r.abort(),
      );
      const page = await context.newPage();
      await page.goto(origin + "/experience/" + project.slug, {
        waitUntil: "networkidle",
      });
      if (project.slug === "csv")
        await page.getByRole("button", { name: "サンプルを試す" }).click();
      if (project.slug === "automation")
        await page.getByRole("button", { name: "分類・下書きを実行" }).click();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() =>
        Promise.all(
          [...document.images]
            .filter((i) => i.getBoundingClientRect().top < innerHeight)
            .map((i) => i.decode()),
        ),
      );
      const buffer = await page.screenshot({
        path: out + "/" + project.slug + "-" + device + ".png",
      });
      const dest =
        "public/previews/" + project.slug + "-" + device + "-master-4.webp";
      await sharp(buffer).webp({ quality: 84 }).toFile(dest);
      records.push({
        asset: dest,
        route: "/experience/" + project.slug,
        device,
        bytes: (await fs.stat(dest)).size,
      });
      await context.close();
    }
    console.log("Captured standalone previews: " + project.slug);
  }
  await fs.writeFile(
    out + "/manifest.json",
    JSON.stringify({ at: new Date().toISOString(), records }, null, 2),
  );
} finally {
  await browser.close();
}
