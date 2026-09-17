import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const origin = "http://127.0.0.1:3162";
const out = path.resolve("../../outputs/master-hq");
const browser = await chromium.launch();
const results = [];
const assert = (name, passed, detail = null) => {
  results.push({ name, passed, detail });
  if (!passed) throw Error(name + ": " + JSON.stringify(detail));
};
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const external = [],
    errors = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!["http://127.0.0.1:3160", origin].includes(url.origin)) {
      external.push(url.origin);
      await route.abort();
      return;
    }
    await route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(origin + "/OWNER_REVIEW.html");
  assert("review HTTP 200", response.status() === 200);
  await page.locator("#route").selectOption("/lab");
  await page.locator("#width").selectOption("1440");
  await page.locator("#mode").selectOption("firstview");
  await page.waitForFunction(() => {
    const shot = document.querySelector("#shot");
    return (
      shot.complete &&
      shot.naturalWidth === 1440 &&
      shot.src.endsWith("lab-1440-firstview.png")
    );
  });
  assert("route / width / range viewer", true);
  await page.locator("#route").selectOption("/demos/cafe");
  await page.locator("#width").selectOption("390");
  await page.locator("#mode").selectOption("full");
  await page.waitForFunction(() => {
    const shot = document.querySelector("#shot");
    return (
      shot.complete &&
      shot.naturalWidth === 390 &&
      shot.src.endsWith("demos-cafe-390-full.png")
    );
  });
  assert("mobile full image viewer", true);
  const videos = page.locator("video");
  assert("two motion videos", (await videos.count()) === 2);
  for (let index = 0; index < 2; index++) {
    const video = videos.nth(index);
    await video.scrollIntoViewIfNeeded();
    await video.evaluate((node) => {
      node.muted = true;
      return node.play();
    });
    await page.waitForFunction(
      (i) => document.querySelectorAll("video")[i].currentTime > 0.15,
      index,
    );
    const info = await video.evaluate((node) => {
      node.pause();
      return {
        width: node.videoWidth,
        height: node.videoHeight,
        duration: node.duration,
        time: node.currentTime,
        error: node.error?.message || null,
      };
    });
    assert(
      "motion playback " + index,
      info.width > 0 && info.time > 0 && !info.error,
      info,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + "/OWNER_REVIEW.html#mobile");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth + 1,
  );
  assert("review mobile has no horizontal overflow", !overflow);
  assert("no page errors", errors.length === 0, errors);
  assert("no external resources requested", external.length === 0, external);
  for (const [name, url, init, status] of [
    ["reject arbitrary file", "/.git/config", {}, 404],
    ["reject escaped file", "/%2e%2e%2fpackage.json", {}, 404],
    [
      "read only HTTP methods",
      "/OWNER_REVIEW.html",
      { method: "POST", body: "local-read-only-check" },
      405,
    ],
    ["image HEAD", "/after/top-390-firstview.png", { method: "HEAD" }, 200],
    [
      "video byte range",
      "/motion/top-1440-owner-review.webm",
      { headers: { Range: "bytes=0-127" } },
      206,
    ],
    [
      "reject invalid range",
      "/motion/top-1440-owner-review.webm",
      { headers: { Range: "bytes=invalid" } },
      416,
    ],
  ]) {
    const res = await fetch(origin + url, init);
    assert(name, res.status === status, {
      expected: status,
      actual: res.status,
    });
    await res.arrayBuffer();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    path.join(out, "review-viewer-check.json"),
    JSON.stringify({ at: new Date().toISOString(), origin, results }, null, 2),
  );
}
console.log(
  JSON.stringify({
    checks: results.length,
    passed: results.every((r) => r.passed),
  }),
);
