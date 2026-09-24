import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

/**
 * KISSA end-to-end check (指示書 §11–§13, §21).
 *
 * Walks the shop the way a visitor does — menu, cart, pickup, payment, table,
 * change, operator console — and asserts on what the screens actually did, not
 * on whether they rendered. A page that paints and then ignores every click is
 * the failure this exists to catch.
 *
 * Run it against `localhost`. `127.0.0.1` is a different origin to `next dev`,
 * which blocks it and then serves a page that never hydrates: every element
 * present, nothing working.
 */

const origin = process.env.QA_BASE_URL || "http://localhost:3000";
const widths = [390, 768, 1440];
const routes = [
  "/kissa",
  "/kissa/menu",
  "/kissa/menu/latte",
  "/kissa/reserve",
  "/kissa/order",
  "/kissa/my",
  "/kissa/admin",
];

const results = [];

/** Records one check. The detail is kept either way, so a pass is evidence. */
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

const ignorable = (text) =>
  text.includes("/_next/hmr") || text.includes("react-devtools");

const outDir = "artifacts/kissa-qa";

/**
 * Waits for the shop's own evidence that React took over.
 *
 * `goto` resolves on load, which is before hydration. Asserting that a button
 * is disabled at that moment reads the server's markup, and would call a
 * working guard broken — or, worse, a broken one working.
 */
const hydrated = (page) =>
  page.waitForFunction(
    () =>
      document
        .querySelector(".kissa-cart-link .sr-only")
        ?.textContent?.includes("カートに"),
    null,
    { timeout: 10000 },
  );

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
      await page.goto(origin + route, { waitUntil: "networkidle" });
      let ready = true;
      await hydrated(page).catch(() => {
        ready = false;
      });
      check(`hydrate ${route} @${width}`, ready, ready ? "" : "never readied");

      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        // A wide table inside a scroller is not a broken layout; it is the
        // scroller doing its job. Only content the page itself cannot
        // contain counts.
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

async function walkTheShop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  await page.goto(`${origin}/kissa/menu/latte`);
  await hydrated(page);
  // 560 base, +80 for the large, +60 for the oat milk.
  await page.getByRole("radio", { name: "ICED" }).check();
  await page.getByRole("radio", { name: /ラージ/ }).check();
  await page.getByRole("checkbox", { name: /オーツミルク/ }).check();
  const price = await page
    .locator(".kissa-detail-price .kissa-price")
    .innerText();
  check("variant pricing", price === "¥700", price);

  await page.getByRole("button", { name: "カートに入れる" }).click();
  const badge = await page.locator(".kissa-cart-link .sr-only").innerText();
  check("cart badge", badge.includes("1"), badge);

  await page.goto(`${origin}/kissa/order`);
  await hydrated(page);
  await page.getByRole("button", { name: "受取時間を選ぶ" }).click();
  const slots = await page.locator(".kissa-slot").count();
  check("pickup slots offered", slots > 0, `${slots} slots`);

  await page.locator(".kissa-slot input:not(:disabled)").first().click();
  await page.getByRole("button", { name: "内容を確認する" }).click();
  await page.getByRole("button", { name: "この内容で注文する" }).click();
  const reference = await page.locator(".kissa-reference").innerText();
  check("order placed", /^K-/.test(reference), reference);

  // Declined, then approved, then replayed: three different outcomes.
  await page.getByRole("radio", { name: "拒否される" }).check();
  await page.getByRole("button", { name: "この結果で試す" }).click();
  const declined = await page.locator(".kissa-done").innerText();
  check(
    "payment decline recorded",
    declined.includes("拒否"),
    declined.replace(/\n/g, " "),
  );

  await page.getByRole("radio", { name: "承認される" }).check();
  await page.getByRole("button", { name: "この結果で試す" }).click();
  await page.getByRole("button", { name: "この結果で試す" }).click();
  const note = await page
    .locator(".kissa-payment .kissa-note")
    .last()
    .innerText();
  check("payment replay refused", note.includes("再実行しません"), note);

  const events = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("tsudowa-kissa-sandbox-v1"),
      ).orders[0].history.filter((h) => h.event === "payment").length,
  );
  check("replay writes no extra history", events === 2, `${events} events`);

  // A table, then moving it.
  await page.goto(`${origin}/kissa/reserve`);
  await hydrated(page);
  // A fixed index only worked while the day still had nine free slots: run
  // this in the afternoon and it waited thirty seconds for a slot that had
  // already passed. The first free one is as good, and the count is checked
  // rather than assumed — the reservation is moved to another slot later, so
  // one is not enough.
  const freeSlots = page.locator(".kissa-slot input:not(:disabled)");
  const freeCount = await freeSlots.count();
  check(
    "reservation slots available",
    freeCount >= 2,
    `${freeCount} free slots`,
  );
  if (freeCount < 2)
    throw new Error("no bookable slot left today; the walk cannot continue");
  await freeSlots.first().click();
  await page.locator(".kissa-seat-list button:not([disabled])").first().click();
  await page.locator('input[type="text"]').fill("テスト太郎");
  await page.getByRole("button", { name: "この内容で予約する" }).click();
  const booking = await page.locator(".kissa-reference").innerText();
  check("table booked", /^R-/.test(booking), booking);

  await page.goto(`${origin}/kissa/my`);
  await hydrated(page);
  await page.getByRole("tab", { name: /予約/ }).click();
  const before = await page.locator(".kissa-record-head p").first().innerText();
  await page.getByRole("button", { name: "日時を変更する" }).click();
  await page.locator(".kissa-slot input:not(:disabled)").nth(2).click();
  await page.locator(".kissa-seat-list button:not([disabled])").first().click();
  await page.getByRole("button", { name: "この内容に変更する" }).click();
  const after = await page.locator(".kissa-record-head p").first().innerText();
  check("booking moved", after !== before, after.replace(/\n/g, " "));

  // The operator's side writes to the record the customer reads.
  await page.goto(`${origin}/kissa/admin`);
  await hydrated(page);
  await page.getByRole("button", { name: "調理を始める" }).click();
  await page.getByRole("button", { name: "受取待ちにする" }).click();
  await page.getByRole("tab", { name: /販売状態/ }).click();
  await page.getByLabel("カフェラテの販売状態").selectOption("sold_out");

  await page.goto(`${origin}/kissa/menu/latte`);
  await hydrated(page);
  const blocked = await page
    .getByRole("button", { name: "カートに入れる" })
    .isDisabled();
  check("sold out reaches the menu", blocked);

  await page.goto(`${origin}/kissa/my`);
  await hydrated(page);
  const status = await page.locator(".kissa-badge").first().innerText();
  check("kitchen status reaches the customer", status === "受取待ち", status);

  await context.close();
}

async function main() {
  const browser = await chromium.launch();
  await mkdir(outDir, { recursive: true });
  try {
    await checkLayout(browser);
    await walkTheShop(browser);
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
