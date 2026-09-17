import { test, expect } from "@playwright/test";

test("overview reflects live inquiry status instead of decorative counts", async ({
  page,
}) => {
  await page.goto("/demos/inbox");
  const meter = page.getByRole("meter", { name: "完了した対応の割合" });
  await expect(meter).toHaveAttribute("value", "1");
  await expect(meter).toHaveAttribute("max", "6");
  await page.getByLabel("対応状況", { exact: true }).selectOption("完了");
  await expect(meter).toHaveAttribute("value", "2");
  await expect(page.locator(".operations-meter")).toContainText("未対応 2件");
  await page.getByRole("button", { name: "リセット", exact: true }).click();
  await expect(meter).toHaveAttribute("value", "1");
  await page.locator(".demo-context summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".demo-context")).toHaveAttribute("open", "");
  await expect(page.locator(".demo-description")).toBeVisible();
});

test("customer chart updates, persists and returns after deleting a customer", async ({
  page,
}) => {
  await page.goto("/demos/admin");
  await expect(page.locator(".revenue-main > b")).toHaveText("¥80,000");
  await page.getByRole("button", { name: "顧客を追加" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("顧客名").fill("概況テスト顧客");
  await dialog.getByLabel("担当者名").fill("架空担当");
  await dialog.getByLabel("累計売上（円）").fill("40000");
  await dialog.getByRole("button", { name: "追加する" }).click();
  await expect(page.locator(".revenue-main > b")).toHaveText("¥120,000");
  await expect(page.getByRole("meter").first()).toHaveAccessibleName(
    "概況テスト顧客の売上",
  );
  await expect(page.getByRole("meter").first()).toHaveAttribute(
    "value",
    "40000",
  );
  await page.reload();
  await expect(page.locator(".revenue-main > b")).toHaveText("¥120,000");
  await page.getByRole("button", { name: "概況テスト顧客を削除" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "削除する", exact: true })
    .click();
  await expect(page.locator(".revenue-main > b")).toHaveText("¥80,000");
  await expect(
    page.getByRole("meter", { name: "概況テスト顧客の売上" }),
  ).toHaveCount(0);
});

test("booking week is keyboard operable and stays synchronized with filters", async ({
  page,
}) => {
  await page.goto("/demos/booking");
  const day19 = page.getByRole("button", { name: "9月19日を表示" });
  await day19.focus();
  await page.keyboard.press("Enter");
  await expect(day19).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("combobox", { name: "表示日", exact: true }),
  ).toHaveValue("2026-09-19");
  const count = await page.locator(".booking-list article").count();
  await expect(day19).toContainText(`${count}件`);
  await page
    .getByRole("combobox", { name: "表示日", exact: true })
    .selectOption("2026-09-24");
  await expect(
    page.getByRole("button", { name: "9月24日を表示" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(day19).toHaveAttribute("aria-pressed", "false");
});

test("cafe menu photographs follow the selected menu without hiding prices", async ({
  page,
}) => {
  await page.goto("/demos/cafe");
  await expect(page.locator(".cafe-menu-editorial img")).toHaveAttribute(
    "src",
    /kissa-drip-v2/,
  );
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await expect(page.locator(".cafe-menu-editorial img")).toHaveAttribute(
    "src",
    /kissa-food-v2/,
  );
  await expect(page.locator(".menu-grid .menu-card")).toHaveCount(6);
  await expect(
    page.locator(".menu-grid .menu-card-foot b").first(),
  ).toContainText("¥");
  await page.getByRole("button", { name: "Coffee", exact: true }).click();
  await expect(page.locator(".cafe-menu-editorial img")).toHaveAttribute(
    "src",
    /kissa-drip-v2/,
  );
});

test("booking days retain 44px touch targets on narrow screens", async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/demos/booking");
    for (const day of await page.locator(".booking-week button").all()) {
      const box = await day.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("button", { name: "9月24日を表示" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("combobox", { name: "表示日", exact: true }),
    ).toHaveValue("2026-09-24");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("client navigation registers new reveals and reduced motion keeps content readable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page
    .getByRole("link", { name: "すべての制作例を見る", exact: false })
    .click();
  await expect(page).toHaveURL(/\/works$/);
  await page
    .getByRole("button", { name: "Webサイト制作", exact: false })
    .click();
  await page.getByRole("link", { name: "この仕事の料金・納品物" }).click();
  await expect(page.locator(".category-exhibit")).toHaveClass(/is-in/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).not.toHaveAttribute("data-reveal-ready");
  await expect(page.locator(".category-exhibit")).toBeVisible();
  expect(
    await page
      .locator(".category-exhibit")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
});
