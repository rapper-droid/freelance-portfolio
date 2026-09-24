import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

/**
 * DAYBOOK end-to-end check (指示書 §14).
 *
 * The Playwright suite runs against `next start`. This one exists to run
 * against whatever is actually being shipped — the Workers preview, or
 * production — because the last release taught that a bundle can pass every
 * local test and still be broken at the edge. `runtime/ids.ts` imported
 * `node:crypto`, which does not exist in a Worker, and the shop's cart was
 * empty on production while green everywhere else. DAYBOOK computes its
 * request and booking ids through the same function.
 *
 * So: walk the mandatory flow with real clicks, against a real origin.
 */

const origin = process.env.QA_BASE_URL || "http://localhost:3000";
const widths = [390, 768, 1440];
const routes = ["/daybook", "/daybook/admin"];
const outDir = "artifacts/daybook-qa";
const results = [];

const check = (name, ok, detail = "") => results.push({ name, ok, detail });

const ignorable = (text) =>
  text.includes("/_next/hmr") || text.includes("react-devtools");

/** The desk only renders once the store has been read, so this is hydration. */
const ready = (page) =>
  page.locator(".daybook-desk").waitFor({ timeout: 20000 });

async function checkLayout(browser) {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error" && !ignorable(m.text())) errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    for (const route of routes) {
      await page.goto(origin + route, { waitUntil: "domcontentloaded" });
      let hydrated = true;
      await ready(page).catch(() => {
        hydrated = false;
      });
      check(
        `hydrate ${route} @${width}`,
        hydrated,
        hydrated ? "" : "never readied",
      );

      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        const scrolls = (el) => {
          for (let n = el.parentElement; n; n = n.parentElement)
            if (/auto|scroll/.test(getComputedStyle(n).overflowX)) return true;
          return false;
        };
        return [...document.querySelectorAll("body *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0) return false;
            if (r.right <= de.clientWidth + 1 && r.left >= -1) return false;
            return !scrolls(el);
          })
          .slice(0, 5)
          .map((el) => el.tagName + "." + String(el.className).slice(0, 40));
      });
      check(
        `layout ${route} @${width}`,
        overflow.length === 0,
        overflow.join(", "),
      );

      if (width === 1440)
        await page.screenshot({
          path: `${outDir}/${route.slice(1).replace(/\//g, "-")}.png`,
          fullPage: true,
        });
    }

    check(
      `console @${width}`,
      errors.length === 0,
      errors.slice(0, 3).join(" | "),
    );
    await context.close();
  }
}

async function walkTheBooking(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  // --- The time they asked for is taken, so alternatives are offered.
  await page.goto(`${origin}/daybook`);
  await ready(page);
  await page.getByRole("button", { name: /希望の枠が埋まっている/ }).click();
  await page.getByRole("button", { name: "この内容で相談する" }).click();

  const record = page.locator(".daybook-record").first();
  await record.waitFor({ timeout: 20000 });
  // An id at all means the hash ran, which is the thing the edge broke before.
  const requestId = await record.locator(".daybook-record-id").innerText();
  check(
    "request id computed in this runtime",
    /^REQ-[0-9A-F]{6}$/.test(requestId),
    requestId,
  );

  const slots = record.locator(".daybook-slot input");
  const offered = await slots.count();
  check(
    "alternatives offered for a taken slot",
    offered > 0,
    `${offered} slots`,
  );

  await record.getByText("この依頼の記録").click();
  const why = await record.locator(".daybook-timeline").innerText();
  check(
    "the refusal names a reason",
    why.includes("希望の日時は取れません"),
    why.split("\n").slice(0, 3).join(" "),
  );

  // --- Taking one holds it. A hold is not a booking.
  await slots.first().click();
  await page.getByRole("button", { name: "この日時を仮押さえする" }).click();
  const held = await record.locator(".daybook-record-when").innerText();
  const badge = await record.locator(".daybook-badge").innerText();
  check(
    "slot held, not booked",
    badge.includes("仮押さえ"),
    `${badge} ${held}`,
  );

  // --- One signature is refused, and the refusal is recorded.
  await page.goto(`${origin}/daybook/admin`);
  await ready(page);
  const decision = page.locator(".daybook-record").first();
  await decision.getByRole("button", { name: "承認して確定する" }).click();
  const notice = await page.locator(".daybook-notice").innerText();
  check(
    "confirming without the requester's agreement is refused",
    notice.includes("予約者の日程合意"),
    notice.replace(/\n/g, " ").slice(0, 80),
  );
  const stillWaiting = await decision.locator(".daybook-badge").innerText();
  check(
    "and the booking is not confirmed",
    stillWaiting.includes("合意待ち"),
    stillWaiting,
  );

  // --- Both signatures confirm it.
  await page.goto(`${origin}/daybook`);
  await ready(page);
  await page
    .locator(".daybook-record")
    .first()
    .getByRole("button", { name: "この日時で確定を依頼する" })
    .click();
  await page.goto(`${origin}/daybook/admin`);
  await ready(page);
  await page
    .locator(".daybook-record")
    .first()
    .getByRole("button", { name: "承認して確定する" })
    .click();

  await page.goto(`${origin}/daybook`);
  await ready(page);
  const confirmed = page.locator(".daybook-record").first();
  const confirmedBadge = await confirmed.locator(".daybook-badge").innerText();
  check(
    "two signatures confirm it",
    confirmedBadge.includes("確定"),
    confirmedBadge,
  );
  const kept = await confirmed.locator(".daybook-record-when").innerText();
  check(
    "and it kept the time that was held",
    kept === held,
    `${kept} vs ${held}`,
  );

  // --- A change shows only what changes, and does not release the old slot.
  await confirmed.getByRole("button", { name: "日時を変更したい" }).click();
  const alternatives = confirmed.locator(".daybook-slot input");
  await alternatives.first().waitFor({ timeout: 20000 });
  await alternatives.first().click();
  await page
    .getByRole("button", { name: "この日時への変更を依頼する" })
    .click();

  const diff = page.locator(".daybook-diff").first();
  const from = await diff.locator("s").innerText();
  const to = await diff.locator("strong").innerText();
  check(
    "the change shows old and new, and nothing else",
    from === held && to !== held,
    `${from} -> ${to}`,
  );

  await page.goto(`${origin}/daybook/admin`);
  await ready(page);
  const calendar = await page.locator(".daybook-calendar").innerText();
  check(
    "the old slot is still blocked while the change waits",
    calendar.includes("この枠は押さえたまま"),
    "",
  );
  check(
    "somebody else's entry is read, not managed",
    calendar.includes("他システムの予定"),
    "",
  );

  // --- Approving moves it, and only then is the old time free.
  await page
    .locator(".daybook-record")
    .first()
    .getByRole("button", { name: "変更を承認して確定する" })
    .click();
  await page.goto(`${origin}/daybook`);
  await ready(page);
  const moved = page.locator(".daybook-record").first();
  const after = await moved.locator(".daybook-record-when").innerText();
  check("the booking moved", after === to, `${after} (wanted ${to})`);
  await moved.getByText("この依頼の記録").click();
  const log = await moved.locator(".daybook-timeline").innerText();
  check(
    "and the release of the old slot is recorded",
    log.includes("元の枠はこの時点で解放されました"),
    "",
  );

  // --- It survives a reload, which is the whole reason the store exists.
  await page.reload();
  await ready(page);
  const reloaded = await page
    .locator(".daybook-record .daybook-record-when")
    .first()
    .innerText();
  check("it survives a reload", reloaded === after, `${reloaded} vs ${after}`);

  await context.close();
}

async function main() {
  const browser = await chromium.launch();
  await mkdir(outDir, { recursive: true });
  try {
    await checkLayout(browser);
    await walkTheBooking(browser);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  await writeFile(
    `${outDir}/report.json`,
    JSON.stringify(
      { origin, checkedAtIso: new Date().toISOString(), results },
      null,
      2,
    ) + "\n",
  );
  for (const r of failed) console.log(`FAIL  ${r.name} — ${r.detail}`);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed`,
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
