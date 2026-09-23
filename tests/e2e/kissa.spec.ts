import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * KISSA, the operable shop demo (指示書 §10–§13).
 *
 * `npm run qa:kissa` walks the whole shop in one visitor's sandbox; this file
 * covers what belongs in CI: that each screen is reachable, accessible, and
 * that the two sides of the shop are one record rather than two lists that
 * happen to look alike.
 */

const routes = [
  "/kissa",
  "/kissa/menu",
  "/kissa/menu/latte",
  "/kissa/reserve",
  "/kissa/order",
  "/kissa/my",
  "/kissa/admin",
];

/**
 * Waits for the shop's own signal that React has taken over.
 *
 * Without it a test can assert against server markup and pass while every
 * control on the page is inert.
 */
async function ready(page: Page) {
  await expect(page.locator(".kissa-cart-link .sr-only")).toContainText(
    "カートに",
  );
}

test.describe("KISSA", () => {
  for (const route of routes) {
    test(`${route} は操作できる状態で表示される`, async ({ page }) => {
      await page.goto(route);
      await ready(page);
      await expect(page.locator(".kissa-demo-banner")).toContainText("架空");
      await expect(page.locator("h1")).toBeVisible();

      const violations = (
        await new AxeBuilder({ page }).include(".kissa").analyze()
      ).violations;
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.length}`),
        JSON.stringify(violations.map((v) => v.id)),
      ).toEqual([]);
    });
  }

  test("架空の店舗は検索結果に出さない", async ({ page }) => {
    for (const route of ["/kissa/my", "/kissa/admin", "/kissa/order"]) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    }
  });

  test("運営の操作が客側の画面に届く", async ({ page }) => {
    await page.goto("/kissa/admin");
    await ready(page);
    await page.getByRole("tab", { name: /販売状態/ }).click();
    await page.getByLabel("カフェラテの販売状態").selectOption("sold_out");

    await page.goto("/kissa/menu/latte");
    await ready(page);
    await expect(
      page.getByRole("button", { name: "カートに入れる" }),
    ).toBeDisabled();
    await expect(page.locator(".kissa-error")).toContainText("売り切れ");

    // And back again: the override is a record, not a one-way switch.
    await page.goto("/kissa/admin");
    await ready(page);
    await page.getByRole("tab", { name: /販売状態/ }).click();
    await page.getByLabel("カフェラテの販売状態").selectOption("on_sale");
    await page.goto("/kissa/menu/latte");
    await ready(page);
    await expect(
      page.getByRole("button", { name: "カートに入れる" }),
    ).toBeEnabled();
  });

  test("カートに入れた商品が注文画面に残る", async ({ page }) => {
    await page.goto("/kissa/menu/latte");
    await ready(page);
    await page.getByRole("button", { name: "カートに入れる" }).click();
    await expect(page.locator(".kissa-cart-count")).toHaveText("1");

    await page.goto("/kissa/order");
    await ready(page);
    await expect(page.locator(".kissa-lines li")).toHaveCount(1);
    await expect(page.locator(".kissa-lines")).toContainText("カフェラテ");
  });

  test("制作例のページから操作できる版へ行ける", async ({ page }) => {
    await page.goto("/demos/cafe");
    const live = page.locator(".demo-live");
    await expect(live).toBeVisible();
    await live.getByRole("link", { name: /店舗サイトを開く/ }).click();
    await expect(page).toHaveURL(/\/kissa$/);
    await ready(page);
  });
});
