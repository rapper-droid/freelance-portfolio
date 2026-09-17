import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3147";
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname))
  throw Error("Local only");
const out = "../../outputs/master-pass/motion";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const records = [];
try {
  for (const [name, route] of [
    ["top", "/"],
    ["cafe", "/demos/cafe"],
    ["inbox", "/demos/inbox"],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "no-preference",
      recordVideo: { dir: out, size: { width: 1440, height: 900 } },
    });
    await context.route("**/*", (r) =>
      new URL(r.request().url()).origin === origin &&
      ["GET", "HEAD"].includes(r.request().method())
        ? r.continue()
        : r.abort(),
    );
    const page = await context.newPage(),
      events = [],
      frames = [],
      styles = [];
    await page.goto(origin + route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      window.__motionEvents = [];
      for (const type of [
        "transitionrun",
        "transitionstart",
        "transitionend",
        "animationstart",
        "animationend",
      ])
        document.addEventListener(type, (e) =>
          window.__motionEvents.push({
            type,
            at: performance.now(),
            elapsed: e.elapsedTime,
            property: e.propertyName || e.animationName,
            target: e.target.className,
          }),
        );
    });
    async function frame(label) {
      const file = `${name}-${String(frames.length + 1).padStart(2, "0")}-${label}.png`;
      await page.screenshot({ path: out + "/" + file });
      frames.push(file);
    }
    async function style(selector) {
      const data = await page
        .locator(selector)
        .first()
        .evaluate((e) => {
          const c = getComputedStyle(e);
          return {
            transition: c.transitionDuration,
            delay: c.transitionDelay,
            animation: c.animationDuration,
            animationName: c.animationName,
            opacity: c.opacity,
            transform: c.transform,
          };
        });
      styles.push({ selector, ...data });
    }
    async function transition(label, action) {
      await frame(label + "-before");
      await action();
      await page.waitForTimeout(70);
      await frame(label + "-early");
      await page.waitForTimeout(170);
      await frame(label + "-middle");
      await page.waitForTimeout(600);
      await frame(label + "-settled");
    }
    async function scroll(selector) {
      const target = await page
        .locator(selector)
        .first()
        .evaluate((e) => e.getBoundingClientRect().top + scrollY - 120);
      const start = await page.evaluate(() => scrollY);
      for (let i = 1; i <= 7; i++) {
        await page.mouse.wheel(0, (target - start) / 7);
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(600);
      await frame("scroll");
    }
    await frame("firstview");
    if (name === "top") {
      await style(".master-web img");
      await style(".sales-hero .button");
      await transition("photo-hover", () =>
        page.locator(".master-web").hover(),
      );
      await page.mouse.move(5, 880);
      await scroll("#tetsu-works");
      await scroll("#services");
      await style(".service-selector-grid a");
      await transition("service-hover", () =>
        page.locator(".service-selector-grid a").first().hover(),
      );
      await style("#tetsu-works [data-reveal]");
    } else if (name === "cafe") {
      await scroll(".cafe-hero");
      await style(".cafe-hero-actions a");
      await transition("cta-hover", () =>
        page.locator(".cafe-hero-actions a").first().hover(),
      );
      await scroll("#cafe-menu");
      await transition("food", () =>
        page.getByRole("button", { name: "Food", exact: true }).click(),
      );
      await style(".cafe-menu-editorial img");
      await transition("coffee", () =>
        page.getByRole("button", { name: "Coffee", exact: true }).click(),
      );
      await scroll(".cafe-pick");
    } else {
      await scroll(".inbox-workspace");
      await style(".ticket");
      await transition("ticket-hover", () =>
        page.locator(".ticket").nth(1).hover(),
      );
      await transition("ticket-select", () =>
        page.locator(".ticket").nth(1).click(),
      );
      await style(".ticket-detail");
      await scroll(".inbox-stats");
      await transition("pending", () =>
        page
          .locator(".stat-button")
          .filter({ has: page.locator("span", { hasText: /^未対応$/ }) })
          .click(),
      );
    }
    events.push(...(await page.evaluate(() => window.__motionEvents)));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => !document.documentElement.dataset.revealReady,
    );
    const reduced = await page.evaluate(() => ({
      animations: document
        .getAnimations()
        .filter((a) => a.playState === "running").length,
      revealReady: document.documentElement.dataset.revealReady || null,
    }));
    const video = page.video();
    await context.close();
    await video.saveAs(out + "/" + name + "-hover-scroll-transition.webm");
    // Remove only the recorder-owned, random-name source after a verified save.
    await video.delete();
    records.push({
      name,
      route,
      styles,
      events,
      reduced,
      frames,
      video: name + "-hover-scroll-transition.webm",
    });
    console.log("MOTION " + name + " " + frames.length + " frames");
  }
  await fs.writeFile(
    out + "/timings.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        note: "CSS durations and browser animation/transition events are the timings. Screenshot spacing includes capture/wait overhead and is not an animation duration.",
        records,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
