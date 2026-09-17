import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { categories, projects } from "../src/lib/portfolio.ts";

const phase = process.argv[2] || "after";
if (!["before", "after", "spot"].includes(phase)) throw Error("Unknown phase");
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3160";
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname))
  throw Error("Local only");
const out = path.resolve("../../outputs/master-hq", phase);
await fs.mkdir(out, { recursive: true });
const representatives = [
  "/",
  "/works",
  "/lab",
  "/history",
  "/contact",
  "/contact/general",
  "/projects/inbox",
  "/demos/cafe",
  "/demos/inbox",
  "/demos/admin",
  "/demos/booking",
];
const all = [
  "/",
  "/works",
  "/lab",
  "/history",
  "/contact",
  "/contact/general",
  "/privacy",
  ...categories.map((c) => "/works/" + c.id),
  ...projects.flatMap((p) => [
    "/projects/" + p.slug,
    "/demos/" + p.slug,
    "/experience/" + p.slug,
  ]),
];
const browser = await chromium.launch();
const results = [];
try {
  for (const width of phase === "before"
    ? [390, 1440]
    : phase === "spot"
      ? [390, 1440]
      : [390, 768, 1024, 1440, 1920]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      reducedMotion: "reduce",
    });
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === origin &&
      ["GET", "HEAD"].includes(route.request().method())
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    const routes =
      phase === "before"
        ? ["/"]
        : phase === "spot"
          ? ["/", "/lab", "/contact/general"]
          : [1024, 1920].includes(width)
            ? representatives
            : all;
    for (const route of routes) {
      const errors = [];
      const error = (e) => errors.push(e.message);
      page.on("pageerror", error);
      const response = await page.goto(origin + route, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => document.fonts.ready);
      const slug = route === "/" ? "top" : route.slice(1).replaceAll("/", "-");
      await page.screenshot({
        path: path.join(out, slug + "-" + width + "-firstview.png"),
      });
      for (
        let y = 0;
        y < (await page.evaluate(() => document.body.scrollHeight));
        y += 750
      ) {
        await page.evaluate(
          (y) => scrollTo({ top: y, behavior: "instant" }),
          y,
        );
      }
      await page.evaluate(async () => {
        document
          .querySelectorAll(".home-ui > *")
          .forEach((el) => (el.style.contentVisibility = "visible"));
        await Promise.all(
          [...document.images].map((i) => {
            i.loading = "eager";
            return i.decode().catch(() => {});
          }),
        );
        scrollTo({ top: 0, behavior: "instant" });
      });
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        h1: document.querySelectorAll("h1").length,
        title: document.title,
        brokenImages: [...document.images]
          .filter((i) => !i.naturalWidth)
          .map((i) => ({ src: i.currentSrc, alt: i.alt })),
        images: [...document.images].map((i) => ({
          src: i.currentSrc,
          alt: i.alt,
          w: i.naturalWidth,
          h: i.naturalHeight,
        })),
        headings: [...document.querySelectorAll("main h1,main h2")].map((i) =>
          i.textContent.trim(),
        ),
        hrefs: [...document.querySelectorAll("a[href]")].map((a) =>
          a.getAttribute("href"),
        ),
        ids: [...document.querySelectorAll("[id]")].map((el) => el.id),
        css: [...document.styleSheets].map((s) => s.href).filter(Boolean),
      }));
      await page.screenshot({
        path: path.join(out, slug + "-" + width + "-full.png"),
        fullPage: true,
      });
      const axe =
        phase === "before" ? null : await new AxeBuilder({ page }).analyze();
      const violations =
        axe?.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })) || [];
      results.push({
        route,
        width,
        status: response.status(),
        errors,
        ...metrics,
        violations,
      });
      await fs.writeFile(
        path.join(out, "audit.json"),
        JSON.stringify(
          {
            at: new Date().toISOString(),
            head: execFileSync("git", ["rev-parse", "HEAD"], {
              encoding: "utf8",
            }).trim(),
            origin,
            phase,
            results,
          },
          null,
          2,
        ),
      );
      console.log(
        JSON.stringify({
          route,
          width,
          status: response.status(),
          overflow: metrics.overflow,
          brokenImages: metrics.brokenImages.length,
          errors,
          violations: violations.map((v) => v.id),
        }),
      );
      page.off("pageerror", error);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
if (
  results.some(
    (r) =>
      r.status !== 200 ||
      r.overflow ||
      r.h1 !== 1 ||
      r.errors.length ||
      r.brokenImages.length ||
      r.violations.length,
  )
)
  process.exitCode = 1;
