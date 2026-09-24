import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * P5: the data a visitor builds up is theirs, and it stays separated.
 *
 * Three sandboxes share one browser. These check the things a unit test
 * cannot: that the panel is really on the page, that a real file round-trips
 * through a real file input, and that using one shop leaves the other two
 * exactly as they were.
 */

const KISSA = "tsudowa-kissa-sandbox-v1";
const FORME = "tsudowa-forme-sandbox-v1";
const OPS = "tsudowa-ops-sandbox-v1";

/** The sandbox is read after mount, so the panel is the ready signal. */
const panelOf = (page: Page) => page.locator(".sandbox-data");

const readKey = (page: Page, key: string) =>
  page.evaluate((k) => localStorage.getItem(k), key);

test("a KISSA order can be written out and read back into an empty browser", async ({
  page,
}) => {
  await page.goto("/kissa/menu/latte");
  await page.getByRole("button", { name: "カートに入れる" }).click();
  await expect(page.locator(".kissa-cart-count")).toHaveText("1");

  await page.goto("/kissa/my");
  const panel = panelOf(page);
  await expect(panel).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    panel.getByRole("button", { name: "注文と予約を書き出す" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^kissa-\d{8}-\d{4}\.json$/);
  const path = await download.path();
  expect(path).toBeTruthy();

  // A browser with nothing in it takes the file and has the cart back.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(panelOf(page)).toBeVisible();
  await page.locator('.sandbox-data input[type="file"]').setInputFiles(path!);
  await expect(page.locator(".sandbox-data-message")).toContainText(
    "読み込みました",
  );
  await expect(page.locator(".kissa-cart-count")).toHaveText("1");

  const after = JSON.parse((await readKey(page, KISSA)) ?? "{}");
  expect(after.cart.lines).toHaveLength(1);
});

test("a FORME file is refused by KISSA instead of being half-read", async ({
  page,
}) => {
  await page.goto("/forme/my");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    panelOf(page)
      .getByRole("button", { name: "注文とお気に入りを書き出す" })
      .click(),
  ]);
  const path = await download.path();

  await page.goto("/kissa/my");
  await page.locator('.sandbox-data input[type="file"]').setInputFiles(path!);
  const message = page.locator(".sandbox-data-message");
  await expect(message).toHaveText("この体験の保存データではないようです。");
  await expect(message).toHaveClass(/is-error/);
});

test("data from a newer build is kept, not overwritten", async ({ page }) => {
  await page.goto("/kissa");
  await page.evaluate(
    (k) =>
      localStorage.setItem(
        k,
        JSON.stringify({ schemaVersion: 99, orders: [{ id: "future" }] }),
      ),
    KISSA,
  );
  await page.goto("/kissa/my");

  // The screen offers the copy back rather than only apologising for it.
  const backup = page.locator(".sandbox-data-backup");
  await expect(backup).toBeVisible();
  await expect(backup).toContainText("控え");

  const kept = JSON.parse((await readKey(page, `${KISSA}--backup`)) ?? "{}");
  expect(kept.text).toContain("future");
  expect(kept.reason).toContain("99");

  // And the demo still works: the sandbox that replaced it is usable.
  await page.goto("/kissa/menu/latte");
  await page.getByRole("button", { name: "カートに入れる" }).click();
  await expect(page.locator(".kissa-cart-count")).toHaveText("1");
});

test("unreadable data is quarantined and the visitor can take it away", async ({
  page,
}) => {
  await page.goto("/kissa");
  await page.evaluate((k) => localStorage.setItem(k, "{{ not json"), KISSA);
  await page.goto("/kissa/my");

  const backup = page.locator(".sandbox-data-backup");
  await expect(backup).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    backup.getByRole("button", { name: "控えを書き出す" }).click(),
  ]);
  expect(download.suggestedFilename()).toContain("kissa-backup-");

  await backup.getByRole("button", { name: "控えを削除する" }).click();
  await expect(backup).toHaveCount(0);
  expect(await readKey(page, `${KISSA}--backup`)).toBeNull();
});

test("using one shop does not touch the other two sandboxes", async ({
  page,
}) => {
  await page.goto("/forme/items/tumbler");
  await page.getByRole("button", { name: "カートに入れる" }).click();

  await page.goto("/demos/automation");
  await page.getByLabel("テスト用の問い合わせ").fill("在庫の相談があります。");
  await page.getByLabel("お客様名").fill("隔離テスト商会");
  await page.getByRole("button", { name: /分類・下書きを実行/ }).click();
  await page.getByRole("button", { name: "内容を確認済みにする" }).click();

  const formeBefore = await readKey(page, FORME);
  const opsBefore = await readKey(page, OPS);
  expect(formeBefore).toBeTruthy();
  expect(opsBefore).toBeTruthy();

  await page.goto("/kissa/menu/latte");
  await page.getByRole("button", { name: "カートに入れる" }).click();
  await page.goto("/kissa/my");
  await panelOf(page)
    .getByRole("button", { name: "この端末のデータを初期化する" })
    .click();

  expect(JSON.parse((await readKey(page, KISSA)) ?? "{}").cart.lines).toEqual(
    [],
  );
  expect(await readKey(page, FORME)).toBe(formeBefore);
  expect(await readKey(page, OPS)).toBe(opsBefore);
});

test("the data panel is reachable and accessible on all three screens", async ({
  page,
}) => {
  for (const route of ["/kissa/my", "/forme/my", "/demos/inbox"]) {
    await page.goto(route);
    const panel = panelOf(page);
    await expect(panel, route).toBeVisible();

    // Real buttons, not labels pretending. Chromium reports a file input as a
    // button too, so this counts elements rather than roles.
    const buttons = panel.locator("button");
    expect(await buttons.count(), route).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < (await buttons.count()); i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box?.height ?? 0, `${route} #${i}`).toBeGreaterThanOrEqual(44);
    }
    expect(
      (await new AxeBuilder({ page }).include(".sandbox-data").analyze())
        .violations,
      route,
    ).toEqual([]);
  }
});
