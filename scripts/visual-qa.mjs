import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { categories, projects } from "../src/lib/portfolio.ts";
const origin = process.env.QA_BASE_URL || "http://localhost:3102";
const server = process.env.QA_BASE_URL
  ? null
  : spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--port", "3102"],
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
  if (!ready) throw new Error("Visual server did not start");
  browser = await chromium.launch();
  const routes = [
    "/",
    "/privacy",
    "/works",
    ...categories.map((c) => `/works/${c.id}`),
    ...projects.flatMap((p) => [`/projects/${p.slug}`, `/demos/${p.slug}`]),
  ];
  const findings = [];
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of routes) {
      const response = await page.goto(origin + route);
      if (response?.status() !== 200)
        throw new Error(`${route}: ${response?.status()}`);
      await page.evaluate(() => {
        document.querySelectorAll(".home-ui > *").forEach((el) => {
          el.style.contentVisibility = "visible";
        });
      });
      await page.evaluate(() =>
        Promise.all(
          Array.from(document.images).map((i) => {
            i.loading = "eager";
            return i.decode().catch(() => {});
          }),
        ),
      );
      const result = await page.evaluate(() => ({
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        brokenImages: Array.from(document.images)
          .filter((i) => !i.complete || !i.naturalWidth)
          .map((i) => i.getAttribute("alt")),
      }));
      if (result.overflow || result.brokenImages.length)
        throw new Error(`${width}px ${route}: ${JSON.stringify(result)}`);
      findings.push({
        width,
        route,
        status: 200,
        overflow: false,
        brokenImages: 0,
      });
    }
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(
      `PASS ${width}px / ${routes.length} routes / no overflow, missing images or runtime errors`,
    );
    await page.close();
  }
  await fs.writeFile(
    "docs/screenshots/portfolio/visual-report.json",
    JSON.stringify({ checkedAt: new Date().toISOString(), findings }, null, 2) +
      "\n",
  );
} finally {
  await browser?.close();
  server?.kill();
}
