import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3210";
const out = process.env.QA_OUT || "../outputs/growth-qa-20260920";
const routes = [
  "/services",
  "/services/web-fix",
  "/services/csv-routine",
  "/partners",
  "/works",
  "/demos/csv",
  "/demos/improvement",
  "/projects/csv",
  "/contact",
];
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const findings = [];
for (const width of [360, 390, 768, 1440]) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of routes) {
    const response = await page.goto(origin + route, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((i) => {
          i.loading = "eager";
          return i.decode().catch(() => {});
        }),
      ),
    );
    const result = await page.evaluate(() => {
      const doc = document.documentElement;
      const escaping = Array.from(document.querySelectorAll("body *"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1);
        })
        .slice(0, 5)
        .map((el) => el.className || el.tagName);
      const small = Array.from(document.querySelectorAll("body *"))
        .filter((el) => {
          if (!el.childNodes.length) return false;
          const text = Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.trim())
            .join("");
          if (!text || !/[ぁ-んァ-ヶ一-龠]/.test(text)) return false;
          return parseFloat(getComputedStyle(el).fontSize) < 12;
        })
        .slice(0, 5)
        .map((el) => el.className + ":" + getComputedStyle(el).fontSize);
      const taps = Array.from(
        document.querySelectorAll("a[href], button, summary, input, select"),
      )
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.height < 24;
        })
        .slice(0, 5)
        .map(
          (el) =>
            (el.className || el.tagName) +
            ":" +
            Math.round(el.getBoundingClientRect().height),
        );
      return {
        status: 200,
        overflow: doc.scrollWidth > doc.clientWidth,
        broken: Array.from(document.images)
          .filter((i) => !i.complete || !i.naturalWidth)
          .map((i) => i.alt),
        escaping,
        small,
        taps,
      };
    });
    findings.push({ width, route, status: response?.status(), ...result });
    await page.screenshot({
      path: `${out}/${route.replace(/\W+/g, "_")}-${width}.png`,
      fullPage: true,
    });
  }
  if (errors.length) findings.push({ width, errors });
  await page.close();
}
await browser.close();
await fs.writeFile(`${out}/report.json`, JSON.stringify(findings, null, 2));
const bad = findings.filter(
  (f) =>
    f.errors ||
    f.status !== 200 ||
    f.overflow ||
    f.broken?.length ||
    f.escaping?.length ||
    f.small?.length ||
    f.taps?.length,
);
console.log(
  bad.length ? JSON.stringify(bad, null, 2) : `PASS ${findings.length} checks`,
);
