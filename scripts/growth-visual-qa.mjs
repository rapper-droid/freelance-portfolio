/**
 * Growth routes, rendered and inspected at every width the design system
 * claims to support. Run against a local `npm run start`, a preview Worker or
 * production by setting QA_BASE_URL.
 *
 *   node scripts/growth-visual-qa.mjs                       # localhost:3210
 *   QA_BASE_URL=https://tsudowa.com node scripts/growth-visual-qa.mjs
 *
 * Fails (exit 1) on: non-200, horizontal overflow, an element escaping the
 * viewport, clipped text, a broken image, Japanese text below the 12px
 * legibility floor, a stand-alone tap target under 24px, or a console /
 * runtime error. Screenshots and the report go outside the repository.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3210";
const out = process.env.QA_OUT || "../outputs/growth-qa-20260920";
const widths = (process.env.QA_WIDTHS || "320,360,390,768,1440,1920")
  .split(",")
  .map(Number);
const routes = (
  process.env.QA_ROUTES ||
  [
    "/services",
    "/services/web-fix",
    "/services/csv-routine",
    "/partners",
    "/rescue",
    "/works",
    "/demos/csv",
    "/demos/improvement",
    "/projects/csv",
    "/contact",
    "/contact/general",
    "/",
    "/privacy",
    "/history",
    "/lab",
  ].join(",")
).split(",");

await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const findings = [];
const problems = [];
let checks = 0;

for (const width of widths) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  for (const route of routes) {
    // A deployed origin keeps connections open, so "networkidle" never
    // settles there; wait for load and let the page paint instead.
    const response = await page.goto(origin + route, {
      waitUntil: origin.startsWith("http://127.0.0.1") ? "networkidle" : "load",
      timeout: 60000,
    });
    const status = response?.status() ?? 0;
    if (!origin.startsWith("http://127.0.0.1")) await page.waitForTimeout(1200);
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((image) => {
          image.loading = "eager";
          return image.decode().catch(() => {});
        }),
      ),
    );
    const result = await page.evaluate(() => {
      const doc = document.documentElement;
      const all = Array.from(document.querySelectorAll("body *"));
      const name = (el) =>
        (typeof el.className === "string" && el.className) || el.tagName;
      const ownText = (el) =>
        Array.from(el.childNodes)
          .filter((node) => node.nodeType === 3)
          .map((node) => node.textContent.trim())
          .join("");
      return {
        overflow: doc.scrollWidth > doc.clientWidth,
        broken: Array.from(document.images)
          .filter((image) => !image.complete || !image.naturalWidth)
          .map((image) => image.alt || image.currentSrc),
        escaping: all
          .filter((el) => {
            const box = el.getBoundingClientRect();
            return (
              box.width > 0 &&
              (box.right > doc.clientWidth + 1 || box.left < -1)
            );
          })
          .slice(0, 3)
          .map(name),
        // Elements collapsed on purpose (screen-reader text, the wordmark
        // the header hides on narrow screens) are hidden, not clipped.
        clipped: all
          .filter((el) => {
            const style = getComputedStyle(el);
            if (!/hidden|clip/.test(style.overflow)) return false;
            if (el.scrollWidth <= el.clientWidth + 1) return false;
            if (el.clientWidth <= 2 || el.clientHeight <= 2) return false;
            if (el.closest(".sr-only") || el.classList.contains("sr-only"))
              return false;
            return !!ownText(el);
          })
          .slice(0, 3)
          .map(name),
        small: all
          .filter((el) => {
            const text = ownText(el);
            return (
              !!text &&
              /[ぁ-んァ-ヶ一-龠]/.test(text) &&
              parseFloat(getComputedStyle(el).fontSize) < 12
            );
          })
          .slice(0, 3)
          .map((el) => name(el) + ":" + getComputedStyle(el).fontSize),
        // Links inside running text are excluded: a 44px inline link would
        // break the paragraph it sits in.
        tiny: Array.from(document.querySelectorAll("a[href], button, summary"))
          .filter((el) => {
            const box = el.getBoundingClientRect();
            return (
              box.width > 0 &&
              box.height > 0 &&
              box.height < 24 &&
              !el.closest(
                "p, li, dd, label, .honesty-note, .intake-help, .intake-source",
              )
            );
          })
          .slice(0, 3)
          .map(
            (el) =>
              name(el) + ":" + Math.round(el.getBoundingClientRect().height),
          ),
      };
    });
    checks++;
    findings.push({ width, route, status, ...result });
    if (
      status !== 200 ||
      result.overflow ||
      result.broken.length ||
      result.escaping.length ||
      result.clipped.length ||
      result.small.length ||
      result.tiny.length
    )
      problems.push({ width, route, status, ...result });
    await page.screenshot({
      path: `${out}/${route.replace(/\W+/g, "_") || "_root"}-${width}.png`,
      fullPage: true,
    });
  }
  if (errors.length) problems.push({ width, route: "(console)", errors });
  await page.close();
}
await browser.close();
await fs.writeFile(
  `${out}/report.json`,
  JSON.stringify(
    { origin, checkedAt: new Date().toISOString(), findings },
    null,
    2,
  ),
);
console.log(
  `origin ${origin} / ${routes.length} routes x ${widths.length} widths = ${checks} checks`,
);
console.log(
  problems.length
    ? "FAIL\n" + JSON.stringify(problems, null, 1)
    : "PASS status 200, no overflow / escaping element / clipped text / broken image / sub-12px Japanese / tiny target / console error",
);
process.exit(problems.length ? 1 : 0);
