import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * RELAY, SMART INBOX and ADMIN as one record (指示書 §14).
 *
 * These three screens used to hold three unrelated arrays. What is worth
 * testing is not that each renders, but that something done on one of them is
 * visible on the other two — and that an approval does not survive an edit.
 */

/** The shared record is read after mount, so the count is the ready signal. */
async function ready(page: Page) {
  await expect(page.locator(".ticket").first()).toBeVisible();
}

test("RELAY が確認した問い合わせが SMART INBOX に届く", async ({ page }) => {
  await page.goto("/demos/automation");
  await page
    .getByLabel("テスト用の問い合わせ")
    .fill("請求書の宛名を変更してください。至急お願いします。");
  await page.getByLabel("お客様名").fill("受け入れテスト商会");
  await page.getByRole("button", { name: /分類・下書きを実行/ }).click();

  // The verdict comes from the text, so changing the text changes it.
  await expect(page.locator(".relay-result")).toContainText("請求");
  await expect(page.locator(".relay-result")).toContainText("高");

  await page.getByRole("button", { name: "内容を確認済みにする" }).click();
  const reference = await page.locator(".relay-filed b").innerText();
  expect(reference).toMatch(/^T-[0-9A-F]{6}$/);

  await page.getByRole("link", { name: /SMART INBOX で見る/ }).click();
  await expect(page).toHaveURL(/\/demos\/inbox$/);
  await ready(page);

  // Seven: the six samples plus the one RELAY filed.
  await expect(page.locator(".ticket")).toHaveCount(7);
  await expect(page.locator(".ticket").first()).toContainText(
    "受け入れテスト商会",
  );
  await expect(page.locator(".ticket-detail")).toContainText(reference);
  await expect(page.locator(".ticket-detail .badge.approved")).toBeVisible();
});

test("確認済みの返信を書き換えると確認は外れる", async ({ page }) => {
  await page.goto("/demos/inbox");
  await ready(page);
  await page.locator(".ticket").first().click();
  await page.getByRole("button", { name: "返信案を生成" }).click();
  await page.getByRole("button", { name: "確認済みにする" }).click();
  await expect(page.locator(".ticket-detail .badge.approved")).toBeVisible();

  await page.getByLabel("返信案を編集").fill("やはり明日ご連絡します。");
  await expect(page.locator(".ticket-detail .badge.approved")).toHaveCount(0);
  await expect(page.locator(".case-history")).toContainText("解除");
});

test("対応状況と担当は再読み込みしても残る", async ({ page }) => {
  await page.goto("/demos/inbox");
  await ready(page);
  await page.locator(".ticket").first().click();
  const subject = await page.locator(".ticket-detail h3").innerText();

  await page.getByLabel("対応状況", { exact: true }).selectOption("対応中");
  await page.getByLabel("担当者", { exact: true }).selectOption("担当C");

  await page.reload();
  await ready(page);
  await expect(page.locator(".ticket-detail h3")).toHaveText(subject);
  await expect(page.getByLabel("対応状況", { exact: true })).toHaveValue(
    "対応中",
  );
  await expect(page.getByLabel("担当者", { exact: true })).toHaveValue("担当C");
});

test("ADMIN は同じ問い合わせを顧客に紐づけられる", async ({ page }) => {
  await page.goto("/demos/admin");
  const unlinked = page.locator(".case-link-list li");
  await expect(unlinked).toHaveCount(6);

  const first = unlinked.first();
  const select = first.getByRole("combobox");
  await select.selectOption({ index: 1 });
  const customer = await select.inputValue();
  expect(customer).not.toBe("");

  await first.getByRole("button", { name: /紐づける/ }).click();
  await expect(unlinked).toHaveCount(5);
  await expect(page.locator(".case-count").first()).toContainText("1 件");

  // The join survives a reload because it is stored on the case, not here.
  await page.reload();
  await expect(page.locator(".case-link-list li")).toHaveCount(5);
  await expect(page.locator(".case-count").first()).toContainText("1 件");
  await expect(page.locator(".case-link [aria-live]")).toBeAttached();

  expect(
    (await new AxeBuilder({ page }).include(".case-link").analyze()).violations,
  ).toEqual([]);
});

test("問い合わせから顧客を追加すると一覧と履歴の両方に出る", async ({
  page,
}) => {
  await page.goto("/demos/admin");
  const first = page.locator(".case-link-list li").first();
  const name = await first.locator("b").innerText();

  await first.getByRole("button", { name: /顧客として追加/ }).click();
  await expect(page.locator(".case-link-list li")).toHaveCount(5);
  await expect(page.locator("tbody")).toContainText(name);
  await expect(page.locator(".history-section")).toContainText(
    "問い合わせから追加",
  );
});
