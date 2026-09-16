import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import sharp from "sharp";
import { projects } from "../src/lib/portfolio.ts";
import { previewPath } from "../src/lib/preview.ts";
// Next scans public paths at startup. Register a new revision before starting
// the server; each file is replaced by the real capture before case-page QA.
for (const project of projects) {
  for (const device of ["desktop", "tablet", "mobile"]) {
    const destination = `public${previewPath(project.slug, device)}`;
    try {
      await fs.access(destination);
    } catch {
      await fs.copyFile(
        `public/previews/${project.slug}-${device}.webp`,
        destination,
      );
    }
  }
}
const origin = process.env.QA_BASE_URL || "http://localhost:3101";
const server = process.env.QA_BASE_URL
  ? null
  : spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--port", "3101"],
      { stdio: "ignore", windowsHide: true },
    );
let browser;
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready) throw new Error("Screenshot server did not start");
  await fs.mkdir("docs/screenshots/portfolio", { recursive: true });
  await fs.mkdir("public/previews", { recursive: true });
  browser = await chromium.launch();
  const devices = {
    desktop: { width: 1440, height: 1000 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 390, height: 844 },
  };
  async function prepare(page, slug) {
    if (slug === "csv")
      await page.getByRole("button", { name: "サンプルを試す" }).click();
    if (slug === "automation")
      await page.getByRole("button", { name: "分類・下書きを実行" }).click();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((image) => {
          image.loading = "eager";
          return image.decode();
        }),
      ),
    );
  }
  const captures = [];
  for (const p of projects) {
    for (const [device, viewport] of Object.entries(devices)) {
      const page = await browser.newPage({
        viewport,
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      await page.goto(`${origin}/demos/${p.slug}`);
      await prepare(page, p.slug);
      // Preview the deliverable itself, not the surrounding portfolio header.
      await page.evaluate((slug) => {
        const target = document.querySelector(
          ["inbox", "admin", "csv"].includes(slug)
            ? ".tool-panel"
            : ".showcase",
        );
        if (target)
          window.scrollTo(
            0,
            target.getBoundingClientRect().top + window.scrollY,
          );
      }, p.slug);
      const buffer = await page.screenshot();
      await sharp(buffer)
        .webp({ quality: 84 })
        .toFile(`public/previews/${p.slug}-${device}.webp`);
      await fs.copyFile(
        `public/previews/${p.slug}-${device}.webp`,
        `public${previewPath(p.slug, device)}`,
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      if (p.featured && device !== "tablet") {
        const name = `${p.slug}-${device}-firstview.png`;
        await page.screenshot({ path: `docs/screenshots/portfolio/${name}` });
        captures.push(name);
      }
      if (p.featured && device === "desktop") {
        for (const [suffix, options] of [
          ["full", { fullPage: true }],
          ["feature", {}],
        ]) {
          const name = `${p.slug}-desktop-${suffix}.png`;
          if (suffix === "feature") {
            await page
              .locator("[data-feature]")
              .first()
              .scrollIntoViewIfNeeded();
          }
          await page.screenshot({
            path: `docs/screenshots/portfolio/${name}`,
            ...options,
          });
          captures.push(name);
        }
      }
      await page.close();
    }
    console.log(`Captured ${p.slug}: desktop / tablet / mobile`);
  }
  for (const p of projects.filter((p) => p.featured)) {
    const page = await browser.newPage({
      viewport: devices.desktop,
      reducedMotion: "reduce",
    });
    await page.goto(`${origin}/projects/${p.slug}`);
    await page.locator(".case-stories").scrollIntoViewIfNeeded();
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((i) => {
          i.loading = "eager";
          return i.decode();
        }),
      ),
    );
    const name = `${p.slug}-desktop-case-study.png`;
    await page.screenshot({ path: `docs/screenshots/portfolio/${name}` });
    captures.push(name);
    await page.close();
  }
  for (const [device, viewport] of Object.entries(devices)) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    await page.goto(origin);
    await page.screenshot({
      path: `docs/screenshots/home-${device}-firstview.png`,
    });
    await page.evaluate(async () => {
      document.querySelectorAll(".home-ui > *").forEach((element) => {
        element.style.contentVisibility = "visible";
      });
      await Promise.all(
        Array.from(document.images).map((image) => {
          image.loading = "eager";
          return image.decode().catch(() => {});
        }),
      );
    });
    await page.screenshot({
      path: `docs/screenshots/home-${device}.png`,
      fullPage: true,
    });
    await page.close();
  }
  await fs.writeFile(
    "docs/screenshots/portfolio/manifest.json",
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "local production build / Playwright Chromium",
        salesImageCount: captures.length,
        previewImageCount: projects.length * 3,
        files: captures,
      },
      null,
      2,
    ) + "\n",
  );
  const thumbs = await Promise.all(
    projects
      .filter((p) => p.featured)
      .map(async (p, i) => ({
        input: await sharp(
          `docs/screenshots/portfolio/${p.slug}-desktop-firstview.png`,
        )
          .resize(480, 334)
          .png()
          .toBuffer(),
        left: (i % 2) * 480,
        top: Math.floor(i / 2) * 334,
      })),
  );
  await sharp({
    create: { width: 960, height: 1336, channels: 3, background: "#e9eee3" },
  })
    .composite(thumbs)
    .png()
    .toFile("docs/screenshots/portfolio/contact-sheet.png");
  console.log(
    `Sales images: ${captures.length}; responsive previews: ${projects.length * 3}`,
  );
} finally {
  await browser?.close();
  server?.kill();
}
