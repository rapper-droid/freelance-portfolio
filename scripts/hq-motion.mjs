import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3160";
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname))
  throw Error("Local only");
const out = path.resolve("../../outputs/master-hq/motion");
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const records = [];
try {
  for (const width of [1440, 390]) {
    const height = width === 390 ? 844 : 900;
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
      recordVideo: { dir: out, size: { width, height } },
    });
    await context.route("**/*", (r) =>
      new URL(r.request().url()).origin === origin &&
      ["GET", "HEAD"].includes(r.request().method())
        ? r.continue()
        : r.abort(),
    );
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__hqEvents = [];
      for (const type of [
        "animationstart",
        "animationend",
        "transitionrun",
        "transitionend",
      ])
        document.addEventListener(type, (e) =>
          window.__hqEvents.push({
            type,
            at: performance.now(),
            elapsed: e.elapsedTime,
            property: e.animationName || e.propertyName,
            target:
              typeof e.target.className === "string"
                ? e.target.className
                : "svg",
          }),
        );
    });
    const frames = [],
      events = [];
    async function frame(label) {
      const name =
        "top-" +
        width +
        "-" +
        String(frames.length + 1).padStart(2, "0") +
        "-" +
        label +
        ".png";
      await page.screenshot({ path: path.join(out, name) });
      frames.push({ name, url: page.url() });
    }
    async function scroll(selector) {
      const target = await page
        .locator(selector)
        .first()
        .evaluate((e) => e.getBoundingClientRect().top + scrollY - 30);
      const start = await page.evaluate(() => scrollY);
      for (let i = 1; i <= 8; i++) {
        await page.mouse.wheel(0, (target - start) / 8);
        await page.waitForTimeout(90);
      }
      await page.waitForTimeout(250);
    }
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await frame("initial");
    await page.waitForTimeout(400);
    await frame("arrival");
    await page.waitForTimeout(1600);
    await frame("settled");
    const grammar = await page
      .locator(".hq-button,.hq-world-link,.hq-works-window img")
      .evaluateAll((es) =>
        es.map((e) => ({
          selector: e.className || e.tagName,
          duration: getComputedStyle(e).transitionDuration,
          delay: getComputedStyle(e).transitionDelay,
        })),
      );
    await page.locator(".hq-hero-actions a").first().hover();
    await page.waitForTimeout(240);
    await frame("cta-hover");
    await scroll("#brands");
    await frame("brands");
    await page.locator(".hq-world-works .hq-world-link").hover();
    await page.waitForTimeout(600);
    await frame("works-hover");
    events.push(...(await page.evaluate(() => window.__hqEvents)));
    await page.locator(".hq-world-works .hq-world-link").click();
    await page.waitForLoadState("networkidle");
    await frame("works-entry");
    await page.goBack({ waitUntil: "networkidle" });
    await page.locator(".hq-world-lab .hq-world-link").click();
    await page.waitForLoadState("networkidle");
    await frame("lab-entry");
    await page.goBack({ waitUntil: "networkidle" });
    await scroll("#activity");
    await frame("build-log");
    await scroll("#contact");
    await frame("contact-choice");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    if (width === 390) {
      await page.locator(".hq-mobile-menu summary").click();
      await frame("navigation");
      await page.keyboard.press("Escape");
    } else {
      await page
        .locator(".hq-nav")
        .getByRole("link", { name: "BUILD LOG", exact: true })
        .hover();
      await frame("navigation");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reduced = await page.evaluate(() => ({
      running: document.getAnimations().filter((a) => a.playState === "running")
        .length,
      arrival: document
        .querySelector(".hq-assembly")
        .hasAttribute("data-arrival"),
    }));
    const video = page.video();
    await context.close();
    const videoName = "top-" + width + "-owner-review.webm";
    await video.saveAs(path.join(out, videoName));
    await video.delete();
    records.push({ width, frames, grammar, events, reduced, video: videoName });
    console.log(
      JSON.stringify({
        width,
        frames: frames.length,
        events: events.length,
        reduced,
        video: videoName,
      }),
    );
  }
  await fs.writeFile(
    path.join(out, "timings.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        note: "Frame timing includes capture overhead. CSS durations and actual animation events are recorded separately. Local only, no external POST.",
        records,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
