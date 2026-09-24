import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

/**
 * Finds controls that do nothing (指示書 §19).
 *
 * A demo is judged by whether its buttons work, and a button that changes
 * nothing is worse than an absent one: it tells a visitor the thing is built
 * and then proves it is not. This clicks every control on every demo route
 * and reports the ones that leave the page byte-identical.
 *
 * It reports candidates, not verdicts. A copy button writes to the clipboard,
 * a reset on already-reset state is correctly a no-op, and a download hands
 * over a file — all legitimately silent. The list is short enough to read.
 */

const origin = process.env.QA_BASE_URL || "http://localhost:3000";

const routes = [
  "/demos/cafe",
  "/demos/saas",
  "/demos/ec",
  "/demos/automation",
  "/demos/booking",
  "/demos/improvement",
  "/demos/creative",
  "/demos/qa",
  "/demos/inbox",
  "/demos/admin",
  "/demos/csv",
  "/flow",
  "/works",
  "/services",
  "/rescue",
  "/partners",
  "/contact",
  "/forme",
  "/forme/items",
  "/forme/items/tumbler",
  "/forme/cart",
  "/forme/my",
  "/forme/admin",
  // REPORT FLOW: the record screens carry the sandbox panel, and the tool
  // itself is measured after a file is loaded by the E2E suite.
  "/automation",
  "/report",
  "/report/recipes",
  "/report/history",
  "/kissa",
  "/kissa/menu",
  "/kissa/menu/latte",
  "/kissa/reserve",
  "/kissa/order",
  "/kissa/my",
  "/kissa/admin",
];

/** Controls whose silence is expected, so they are not worth reporting. */
const EXPECTED_SILENT = [
  /コピー/,
  /copy/i,
  /ダウンロード/,
  /download/i,
  /リセット/,
  /初期化/,
  /印刷/,
  /送信/,
];

/**
 * A fingerprint of what the page is currently showing.
 *
 * The markup is hashed rather than measured: an earlier version compared its
 * length and called three working controls inert, because flipping one
 * `aria-pressed` from true to false while another goes false to true leaves
 * the length untouched, as does swapping two titles of the same length.
 */
const signature = (page) =>
  page.evaluate(() => {
    const html = document.querySelector("main")?.innerHTML ?? "";
    let hash = 0;
    for (let i = 0; i < html.length; i++)
      hash = (Math.imul(31, hash) + html.charCodeAt(i)) | 0;
    return {
      url: location.pathname + location.search,
      html: `${html.length}:${hash}`,
      text: (document.querySelector("main")?.innerText ?? "").slice(0, 4000),
    };
  });

async function auditRoute(context, route) {
  const page = await context.newPage();
  const findings = [];
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(origin + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const buttons = page.locator(
    'main button:not([disabled]), main [role="button"]:not([aria-disabled="true"])',
  );
  const total = await buttons.count();

  for (let i = 0; i < total; i++) {
    // The page is reloaded between clicks so each control is judged from the
    // same starting state; otherwise the second click of a toggle looks inert.
    await page.goto(origin + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);

    const control = page
      .locator(
        'main button:not([disabled]), main [role="button"]:not([aria-disabled="true"])',
      )
      .nth(i);
    const label = ((await control.innerText().catch(() => "")) || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);

    if (!(await control.isVisible().catch(() => false))) continue;
    if (EXPECTED_SILENT.some((re) => re.test(label))) continue;

    const before = await signature(page);
    await control.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(350);
    const after = await signature(page);

    const changed =
      before.url !== after.url ||
      before.html !== after.html ||
      before.text !== after.text;

    if (!changed) findings.push({ route, index: i, label: label || "(無題)" });
  }

  await page.close();
  return { route, total, findings, errors };
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });

  const report = [];
  for (const route of routes) {
    const result = await auditRoute(context, route);
    report.push(result);
    const flag = result.findings.length ? "!" : " ";
    console.log(
      `${flag} ${route.padEnd(24)} ${String(result.total).padStart(3)} controls, ${result.findings.length} inert`,
    );
    for (const f of result.findings) console.log(`      → "${f.label}"`);
    for (const e of result.errors) console.log(`      ✖ ${e.slice(0, 120)}`);
  }

  await browser.close();
  await mkdir("artifacts/inert-controls", { recursive: true });
  await writeFile(
    "artifacts/inert-controls/report.json",
    JSON.stringify(
      { origin, checkedAtIso: new Date().toISOString(), routes: report },
      null,
      2,
    ) + "\n",
  );

  const inert = report.reduce((n, r) => n + r.findings.length, 0);
  const controls = report.reduce((n, r) => n + r.total, 0);
  console.log(`\n${controls} controls checked, ${inert} candidates to triage`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
