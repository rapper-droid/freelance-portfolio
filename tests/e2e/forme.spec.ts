import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * FORME, the objects shop (指示書 §16, Q26).
 *
 * `npm run qa:forme` walks the whole shop in one visitor's sandbox; this
 * covers what belongs in CI: each screen reachable and accessible, and the
 * three rules that separate a shop from a picture of one — the selection
 * drives everything, stock is finite, and nothing ships unpaid.
 */

const routes = [
  "/forme",
  "/forme/items",
  "/forme/items/tumbler",
  "/forme/items/care-kit",
  "/forme/cart",
  "/forme/my",
  "/forme/admin",
];

/** The shop's own signal that React has taken over. */
async function ready(page: Page) {
  await expect(page.locator(".forme-cart-link .sr-only")).toContainText(
    "カートに",
  );
}

test.describe("FORME", () => {
  for (const route of routes) {
    test(`${route} は操作できる状態で表示される`, async ({ page }) => {
      await page.goto(route);
      await ready(page);
      await expect(page.locator(".forme-demo-banner")).toContainText("架空");
      await expect(page.locator("h1")).toBeVisible();

      const violations = (
        await new AxeBuilder({ page }).include(".forme").analyze()
      ).violations;
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.length}`),
        JSON.stringify(violations.map((v) => v.id)),
      ).toEqual([]);
    });
  }

  test("架空の店舗は検索結果に出さない", async ({ page }) => {
    for (const route of ["/forme", "/forme/cart", "/forme/admin"]) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    }
  });

  test("色とサイズが画像・価格・在庫を動かす", async ({ page }) => {
    await page.goto("/forme/items/tumbler");
    await ready(page);

    const photo = page.locator(".forme-detail-main img");
    const sage = await photo.getAttribute("src");
    await page.getByRole("radio", { name: /チャコール/ }).check();
    await expect(photo).not.toHaveAttribute("src", String(sage));

    await expect(page.locator(".forme-detail-price .forme-price")).toHaveText(
      "¥3,800",
    );
    await page.getByRole("radio", { name: /500ml/ }).check();
    await expect(page.locator(".forme-detail-price .forme-price")).toHaveText(
      "¥4,400",
    );

    // Sand 500ml is the combination with nothing on the shelf.
    await page.getByRole("radio", { name: /サンド/ }).check();
    await expect(page.locator(".forme-stock")).toContainText("在庫切れ");
    await expect(
      page.getByRole("button", { name: "カートに入れる" }),
    ).toBeDisabled();
  });

  test("在庫は有限で、取り消すと戻る", async ({ page }) => {
    await page.goto("/forme/items/tumbler");
    await ready(page);
    await page.getByRole("radio", { name: /サンド/ }).check();
    await page.getByRole("radio", { name: /350ml/ }).check();
    await expect(page.locator(".forme-stock")).toContainText("残り 2 点");

    await page.getByLabel("数量").fill("2");
    await page.getByRole("button", { name: "カートに入れる" }).click();

    await page.goto("/forme/cart");
    await ready(page);
    await page.getByRole("button", { name: "受け取り方法へ" }).click();
    await page.getByRole("button", { name: "内容を確認する" }).click();
    await page.getByRole("button", { name: "この内容で注文する" }).click();
    await expect(page.locator(".forme-reference")).toHaveText(
      /^F-[0-9A-F]{6}$/,
    );

    await page.goto("/forme/items/tumbler");
    await ready(page);
    await page.getByRole("radio", { name: /サンド/ }).check();
    await page.getByRole("radio", { name: /350ml/ }).check();
    await expect(page.locator(".forme-stock")).toContainText("在庫切れ");

    await page.goto("/forme/my");
    await ready(page);
    await page.getByRole("button", { name: "この注文を取り消す" }).click();

    await page.goto("/forme/items/tumbler");
    await ready(page);
    await page.getByRole("radio", { name: /サンド/ }).check();
    await page.getByRole("radio", { name: /350ml/ }).check();
    await expect(page.locator(".forme-stock")).toContainText("残り 2 点");
  });

  test("未払いの配送は発送できない", async ({ page }) => {
    await page.goto("/forme/items/care-kit");
    await ready(page);
    await page.getByRole("button", { name: "カートに入れる" }).click();

    await page.goto("/forme/cart");
    await ready(page);
    await page.getByRole("button", { name: "受け取り方法へ" }).click();
    await page.getByRole("button", { name: "内容を確認する" }).click();
    await page.getByRole("button", { name: "この内容で注文する" }).click();

    await page.goto("/forme/admin");
    await ready(page);
    await page.getByRole("button", { name: "準備を始める" }).click();
    await expect(page.locator(".forme-record .forme-note")).toContainText(
      "発送できません",
    );
    await expect(page.getByRole("button", { name: "発送した" })).toBeDisabled();

    // Pay, and the same button becomes available.
    await page.goto("/forme/my");
    await ready(page);
    await page.getByRole("button", { name: "お支払いに進む" }).click();
    await page.getByRole("radio", { name: "承認される" }).check();
    await page.getByRole("button", { name: "この結果で試す" }).click();
    await expect(page.locator(".forme-record .forme-summary")).toContainText(
      "支払済み",
    );

    await page.goto("/forme/admin");
    await ready(page);
    await expect(page.getByRole("button", { name: "発送した" })).toBeEnabled();
  });

  test("運営の在庫変更が商品ページに届く", async ({ page }) => {
    await page.goto("/forme/admin");
    await ready(page);
    await page.getByRole("tab", { name: /在庫/ }).click();
    await page.getByLabel(/マグ（サンド）の在庫/).fill("1");

    await page.goto("/forme/items/mug");
    await ready(page);
    await expect(page.locator(".forme-stock")).toContainText("残り 1 点");

    // And taking it off sale removes it from the list entirely.
    await page.goto("/forme/admin");
    await ready(page);
    await page.getByRole("tab", { name: /商品/ }).click();
    await page
      .locator("tbody tr", { hasText: "マグ" })
      .getByRole("button", { name: "取り扱いを止める" })
      .click();

    await page.goto("/forme/items");
    await ready(page);
    await expect(page.locator(".forme-card", { hasText: "マグ" })).toHaveCount(
      0,
    );
  });

  test("制作例のページから操作できる版へ行ける", async ({ page }) => {
    await page.goto("/demos/ec");
    const live = page.locator(".demo-live");
    await expect(live).toBeVisible();
    await live.getByRole("link", { name: /店舗サイトを開く/ }).click();
    await expect(page).toHaveURL(/\/forme$/);
    await ready(page);
  });
});
