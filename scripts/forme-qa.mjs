import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

/**
 * FORME end-to-end check (指示書 §16, Q26).
 *
 * The acceptance criterion is that selection, stock, checkout, history and the
 * back office are one connected thing. So this walks it: choose a colour and
 * watch the picture and the price follow, buy the last two of something and
 * watch the shelf empty, cancel and watch it come back, then try to ship
 * something nobody paid for.
 *
 * Run against `localhost`. `next dev` blocks `127.0.0.1` and serves a page
 * that renders perfectly and hydrates never.
 */

const origin = process.env.QA_BASE_URL || "http://localhost:3000";
const widths = [390, 768, 1440];
const routes = [
  "/forme",
  "/forme/items",
  "/forme/items/tumbler",
  "/forme/items/care-kit",
  "/forme/cart",
  "/forme/my",
  "/forme/admin",
];

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

const ignorable = (text) =>
  text.includes("/_next/hmr") || text.includes("react-devtools");

const outDir = "artifacts/forme-qa";

/** The shop's own evidence that React took over. */
const hydrated = (page) =>
  page.waitForFunction(
    () =>
      document
        .querySelector(".forme-cart-link .sr-only")
        ?.textContent?.includes("カートに"),
    null,
    { timeout: 15000 },
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
        // Content inside a horizontal scroller is the scroller working.
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

  // --- selection drives picture, price and stock ------------------------
  await page.goto(`${origin}/forme/items/tumbler`);
  await hydrated(page);
  const sagePhoto = await page
    .locator(".forme-detail-main img")
    .getAttribute("src");
  await page.getByRole("radio", { name: /チャコール/ }).check();
  const charcoalPhoto = await page
    .locator(".forme-detail-main img")
    .getAttribute("src");
  check(
    "colour changes the photograph",
    sagePhoto !== charcoalPhoto,
    String(charcoalPhoto).slice(-40),
  );

  await page.getByRole("radio", { name: /500ml/ }).check();
  const priced = await page
    .locator(".forme-detail-price .forme-price")
    .innerText();
  check("size changes the price", priced === "¥4,400", priced);

  await page.getByRole("radio", { name: /サンド/ }).check();
  const outOfStock = await page.locator(".forme-stock").innerText();
  const disabled = await page
    .getByRole("button", { name: "カートに入れる" })
    .isDisabled();
  check(
    "an empty shelf cannot be bought",
    outOfStock.includes("在庫切れ") && disabled,
    outOfStock,
  );

  // --- buying the last two ---------------------------------------------
  // Sand 350ml has two. Taking both must empty the shelf everywhere.
  await page.getByRole("radio", { name: /350ml/ }).check();
  const before = await page.locator(".forme-stock").innerText();
  check(
    "a low shelf says how many are left",
    before.includes("残り 2 点"),
    before,
  );

  await page.getByLabel("数量").fill("2");
  await page.getByRole("button", { name: "カートに入れる" }).click();
  const badge = await page.locator(".forme-cart-link .sr-only").innerText();
  check("cart badge counts what went in", badge.includes("2"), badge);

  await page.goto(`${origin}/forme/cart`);
  await hydrated(page);
  const shipping = await page.locator(".forme-summary.totals").innerText();
  check(
    "shipping is charged below the threshold",
    shipping.includes("¥600"),
    shipping.replace(/\n/g, " "),
  );

  await page.getByRole("button", { name: "受け取り方法へ" }).click();
  await page.getByRole("radio", { name: "店頭受け取り" }).check();
  const pickup = await page.locator(".forme-summary.totals").innerText();
  check(
    "collection costs nothing to ship",
    pickup.includes("無料"),
    pickup.replace(/\n/g, " "),
  );

  await page.getByRole("radio", { name: "配送" }).check();
  await page.getByLabel("お届け地域").selectOption("九州・沖縄");
  const surcharged = await page.locator(".forme-summary.totals").innerText();
  check(
    "the regional surcharge is applied",
    surcharged.includes("¥900"),
    surcharged.replace(/\n/g, " "),
  );

  await page.getByRole("button", { name: "内容を確認する" }).click();
  await page.getByRole("button", { name: "この内容で注文する" }).click();
  const reference = await page.locator(".forme-reference").innerText();
  check("order placed", /^F-[0-9A-F]{6}$/.test(reference), reference);

  // --- the shelf moved --------------------------------------------------
  await page.goto(`${origin}/forme/items/tumbler`);
  await hydrated(page);
  await page.getByRole("radio", { name: /サンド/ }).check();
  await page.getByRole("radio", { name: /350ml/ }).check();
  const emptied = await page.locator(".forme-stock").innerText();
  check(
    "buying the last two empties the shelf",
    emptied.includes("在庫切れ"),
    emptied,
  );

  // --- unpaid does not ship ---------------------------------------------
  await page.goto(`${origin}/forme/admin`);
  await hydrated(page);
  await page.getByRole("button", { name: "準備を始める" }).click();
  const blocked = await page.locator(".forme-record .forme-note").innerText();
  const shipDisabled = await page
    .getByRole("button", { name: "発送した" })
    .isDisabled();
  check(
    "an unpaid delivery cannot ship",
    blocked.includes("発送できません") && shipDisabled,
    blocked,
  );

  // --- pay from the order, not only from the checkout -------------------
  // A customer who closed the tab must still be able to pay, so the
  // simulator lives on the order rather than inside the flow that made it.
  await page.goto(`${origin}/forme/my`);
  await hydrated(page);
  await page.getByRole("button", { name: "お支払いに進む" }).click();
  await page.getByRole("radio", { name: "承認される" }).check();
  await page.getByRole("button", { name: "この結果で試す" }).click();
  const paid = await page.locator(".forme-record .forme-summary").innerText();
  // The detail is kept as-is; a newline in it is not worth a backslash.
  check("payment recorded", paid.includes("支払済み"), paid);

  await page.goto(`${origin}/forme/admin`);
  await hydrated(page);
  const shipNow = await page
    .getByRole("button", { name: "発送した" })
    .isDisabled();
  check("a paid delivery may ship", !shipNow);

  // --- cancelling gives the stock back ----------------------------------
  await page.getByRole("button", { name: "取り消す" }).click();
  await page.goto(`${origin}/forme/items/tumbler`);
  await hydrated(page);
  await page.getByRole("radio", { name: /サンド/ }).check();
  await page.getByRole("radio", { name: /350ml/ }).check();
  const restocked = await page.locator(".forme-stock").innerText();
  check(
    "cancelling puts the stock back",
    restocked.includes("残り 2 点"),
    restocked,
  );

  // --- the operator's stock edit reaches the shop -----------------------
  await page.goto(`${origin}/forme/admin`);
  await hydrated(page);
  await page.getByRole("tab", { name: /在庫/ }).click();
  await page.getByLabel(/マグ（サンド）の在庫/).fill("1");
  await page.goto(`${origin}/forme/items/mug`);
  await hydrated(page);
  const mug = await page.locator(".forme-stock").innerText();
  check("an operator's count reaches the shop", mug.includes("残り 1 点"), mug);

  // --- unpublishing removes it from the list ----------------------------
  await page.goto(`${origin}/forme/admin`);
  await hydrated(page);
  await page.getByRole("tab", { name: /商品/ }).click();
  await page
    .locator("tbody tr", { hasText: "マグ" })
    .getByRole("button", { name: "取り扱いを止める" })
    .click();
  await page.goto(`${origin}/forme/items`);
  await hydrated(page);
  const listed = await page.locator(".forme-card").count();
  const hasMug = await page.locator(".forme-card", { hasText: "マグ" }).count();
  check(
    "unpublishing removes it from the list",
    hasMug === 0,
    `${listed} cards`,
  );

  // --- favourites -------------------------------------------------------
  await page.locator(".forme-card").first().getByRole("button").first().click();
  await page.goto(`${origin}/forme/my`);
  await hydrated(page);
  await page.getByRole("tab", { name: /お気に入り/ }).click();
  const favourites = await page.locator(".forme-grid .forme-card").count();
  check("favourites are kept", favourites === 1, `${favourites}`);

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
