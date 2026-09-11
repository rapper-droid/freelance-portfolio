import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
const origin = process.env.QA_BASE_URL || "http://localhost:3105";
const server = process.env.QA_BASE_URL
  ? null
  : spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--port", "3105"],
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
  if (!ready) throw new Error("Design QA server did not start");
  await fs.mkdir("docs/screenshots/sales-ui", { recursive: true });
  browser = await chromium.launch();
  const checks = [];
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 700 ? 844 : 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    for (const route of [
      "/",
      "/works",
      "/projects/cafe",
      "/projects/saas",
      "/projects/ec",
      "/projects/inbox",
    ]) {
      await page.goto(origin + route);
      await page.evaluate(() => document.fonts.ready);
      // Exercise the real scroll-reveal path before the full-page axe/capture.
      // content-visibility is an app optimization, never an exemption from QA.
      for (const section of await page.locator(".home-ui > *").all()) {
        await section.scrollIntoViewIfNeeded();
        const revealed = (await new AxeBuilder({ page }).analyze()).violations;
        if (revealed.length)
          throw new Error(JSON.stringify({ width, route, revealed }));
      }
      await page.evaluate(() => {
        document.querySelectorAll(".home-ui > *").forEach((el) => {
          el.style.contentVisibility = "visible";
        });
        window.scrollTo(0, 0);
      });
      await page.evaluate(() =>
        Promise.all(
          [...document.images].map((i) => {
            i.loading = "eager";
            return i.decode().catch(() => {});
          }),
        ),
      );
      const failures = (await new AxeBuilder({ page }).analyze()).violations;
      if (failures.length)
        throw new Error(JSON.stringify({ width, route, failures }));
      const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      await page.screenshot({
        path: `docs/screenshots/sales-ui/${slug}-${width}-firstview.png`,
      });
      if (width === 390 || width === 1440) {
        if (await page.locator(".visual-story").count()) {
          await page.locator(".visual-story").screenshot({
            path: `docs/screenshots/sales-ui/${slug}-${width}-visual-story.png`,
          });
        }
        await page.screenshot({
          path: `docs/screenshots/sales-ui/${slug}-${width}-full.png`,
          fullPage: true,
        });
        if (route === "/")
          for (const id of [
            "services",
            "works",
            "pricing",
            "delivery",
            "qa",
            "contact",
          ]) {
            await page.locator(`#${id}`).screenshot({
              path: `docs/screenshots/sales-ui/${id}-${width}.png`,
            });
          }
      }
      // Keyboard focus is visible, not hidden behind sticky chrome.
      await page.goto(origin + route);
      await page.keyboard.press("Tab");
      const focus = await page.locator(":focus").evaluate((el) => ({
        text: el.textContent,
        outline: getComputedStyle(el).outlineStyle,
      }));
      if (!focus.text?.includes("本文へスキップ") || focus.outline === "none")
        throw new Error(`Focus failure ${route}`);
      checks.push({ width, route, axeViolations: 0, keyboardFocus: true });
    }
    if (errors.length) throw new Error(errors.join("\n"));
    await context.close();
    console.log(`Design QA ${width}px: 6 routes, axe/focus/runtime passed`);
  }
  await fs.writeFile(
    "docs/screenshots/sales-ui/report.json",
    JSON.stringify({ checkedAt: new Date().toISOString(), checks }, null, 2) +
      "\n",
  );
} finally {
  await browser?.close();
  server?.kill();
}
