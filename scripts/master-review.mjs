import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { categories, projects } from "../src/lib/portfolio.ts";

const phase = process.argv[2] || "after";
if (!["before", "after"].includes(phase)) throw new Error("Unknown phase");
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3147";
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname))
  throw new Error("Local QA only");
const out = path.resolve(
  process.env.MASTER_OUTPUT || "../../outputs/master-pass",
  phase,
);
await fs.mkdir(out, { recursive: true });
const routes = [
  "/",
  "/privacy",
  "/works",
  ...categories.map((c) => `/works/${c.id}`),
  ...projects.flatMap((p) => [`/projects/${p.slug}`, `/demos/${p.slug}`]),
  ...(phase === "after"
    ? ["/contact", ...projects.map((p) => `/experience/${p.slug}`)]
    : []),
];
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      reducedMotion: "reduce",
    });
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      return url.origin === origin &&
        ["GET", "HEAD"].includes(route.request().method())
        ? route.continue()
        : route.abort();
    });
    const page = await context.newPage();
    for (const route of routes) {
      const errors = [];
      const onError = (e) => errors.push(e.message);
      page.on("pageerror", onError);
      const response = await page.goto(origin + route, {
        waitUntil: "networkidle",
      });
      const slug = route === "/" ? "top" : route.slice(1).replaceAll("/", "-");
      const before = await page.evaluate(() =>
        Array.from(document.querySelector("main").children).map((el) => ({
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          y: Math.round(el.getBoundingClientRect().top + scrollY),
          height: Math.round(el.getBoundingClientRect().height),
          visibility: getComputedStyle(el).contentVisibility,
        })),
      );
      await page.screenshot({
        path: path.join(out, `${slug}-${width}-firstview.png`),
      });
      if (route === "/" && width === 1440)
        await page.screenshot({
          path: path.join(out, "top-1440-native-full.png"),
          fullPage: true,
        });
      // Natural scroll first: record whether apparently empty offscreen sections
      // paint correctly. Only the final full-page evidence disables virtualization.
      for (
        let y = 0;
        y < (await page.evaluate(() => document.body.scrollHeight));
        y += 850
      )
        await page.evaluate(
          (y) => scrollTo({ top: y, behavior: "instant" }),
          y,
        );
      await page.evaluate(async () => {
        document
          .querySelectorAll(".home-ui > *")
          .forEach((el) => (el.style.contentVisibility = "visible"));
        await Promise.all(
          Array.from(document.images).map((i) => {
            i.loading = "eager";
            return i.decode().catch(() => {});
          }),
        );
        scrollTo({ top: 0, behavior: "instant" });
      });
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        brokenImages: Array.from(document.images)
          .filter((i) => !i.naturalWidth)
          .map((i) => i.alt),
        sections: Array.from(document.querySelectorAll("main section")).map(
          (el) => ({
            heading: el.querySelector("h2,h3")?.textContent?.trim(),
            id: el.id,
            height: Math.round(el.getBoundingClientRect().height),
            opacity: getComputedStyle(el).opacity,
          }),
        ),
        h1: document.querySelectorAll("h1").length,
        title: document.title,
      }));
      await page.screenshot({
        path: path.join(out, `${slug}-${width}-full.png`),
        fullPage: true,
      });
      const axe =
        phase === "after" ? await new AxeBuilder({ page }).analyze() : null;
      results.push({
        route,
        width,
        status: response.status(),
        errors,
        ...metrics,
        before,
        violations: axe?.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
      page.off("pageerror", onError);
      console.log(
        `${phase} ${width} ${route}: ${response.status()}, overflow=${metrics.overflow}, images=${metrics.brokenImages.length}, axe=${axe?.violations.length ?? "not-run"}`,
      );
    }
    await context.close();
  }
  await fs.writeFile(
    path.join(out, "audit.json"),
    JSON.stringify(
      {
        head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        at: new Date().toISOString(),
        origin,
        phase,
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
