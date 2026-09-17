import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import type { Page } from "@playwright/test";
async function prepareScreenshot(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    document
      .querySelectorAll(".table-scroll")
      .forEach((el) => el.scrollTo(0, 0));
    window.scrollTo(0, 0);
  });
}
test("home: navigation, copy, responsive layout and accessibility", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("BUILD.");
  await page.keyboard.press("Tab");
  await expect(page.getByText("本文へスキップ")).toBeFocused();
  await page
    .locator(".hq-hero-actions")
    .getByRole("link", { name: /制作を頼む/ })
    .click();
  await expect(page).toHaveURL(/\/works$/);
  await page.getByRole("link", { name: "CSV AUTOMATOR", exact: true }).click();
  await expect(page).toHaveURL(/projects\/csv/);
  await page.getByRole("link", { name: "Live Demoを操作する" }).click();
  await expect(page).toHaveURL(/demos\/csv/);
  await page.getByRole("link", { name: "制作デモに戻る" }).click();
  await page
    .getByLabel("ご相談内容", { exact: false })
    .fill("毎週CSVの整理をしています");
  await page.locator(".intake-copy summary").click();
  await page.getByRole("button", { name: "相談内容をコピー" }).click();
  await expect(page.locator(".intake-copy").getByRole("status")).toContainText(
    "コピーしました",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "毎週CSV",
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
  await page.goto("/");
  await prepareScreenshot(page);
  await page.screenshot({
    path: `../../outputs/master-hq/e2e-screenshots/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
test("CSV: sample, clean, aggregate, search, sort and download", async ({
  page,
}, testInfo) => {
  await page.goto("/demos/csv");
  await page.getByRole("button", { name: "サンプルを試す" }).click();
  await expect(page.getByRole("status")).toContainText("125件");
  await page.getByRole("button", { name: "加工を実行" }).click();
  await expect(page.getByRole("status")).toContainText("98件、重複27件");
  await expect(page.getByText("1,201,000", { exact: true })).toBeVisible();
  await page.getByLabel("CSV内を検索").fill("ORD-098");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("CSV内を検索").clear();
  await page.getByRole("button", { name: "注文ID" }).click();
  await expect(page.locator("tbody tr").first()).toContainText("ORD-098");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV出力" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const content = await fs.readFile(path!, "utf8");
  expect(content.split("\r\n")).toHaveLength(99);
  expect(content).toContain("サンプル顧客1");
  await prepareScreenshot(page);
  await page.screenshot({
    path: `../../outputs/master-hq/e2e-screenshots/csv-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "加工結果をリセット" }).click();
  await expect(page.getByRole("button", { name: "CSV出力" })).toBeDisabled();
});
test("CSV: upload validation, quoted values, empty removal and zero results", async ({
  page,
}) => {
  await page.goto("/demos/csv");
  const input = page.getByLabel("CSVファイル", { exact: true });
  await input.setInputFiles({
    name: "bad.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("A,B\n1"),
  });
  await expect(page.locator('.error-message[role="alert"]')).toContainText(
    "列数",
  );
  await input.setInputFiles({
    name: "valid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('名前,金額\n"架空,商店",1000\n空欄,\n"架空,商店",1000'),
  });
  await page.getByLabel("空欄を含む行を除去").check();
  await page.getByRole("button", { name: "加工を実行" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("CSV内を検索").fill("見つからない");
  await expect(page.getByText("該当するデータがありません。")).toBeVisible();
});
test("inbox: filter, detail, assignment, draft and status", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/demos/inbox");
  await page.getByLabel("緊急度", { exact: true }).selectOption("高");
  await expect(page.locator(".ticket")).toHaveCount(1);
  await page.locator(".ticket").click();
  await expect(page.locator(".ticket-detail")).toContainText(
    "フォームが動かない",
  );
  await page.getByLabel("担当者", { exact: true }).selectOption("担当B");
  await page.getByLabel("対応状況", { exact: true }).selectOption("対応中");
  await page.getByRole("button", { name: "返信案を生成" }).click();
  await expect(page.getByLabel("返信案を編集")).toContainText("操作手順");
  await page.getByLabel("返信案を編集").fill("確認して改めてご連絡します。");
  await page.getByRole("button", { name: "返信案をコピー" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "確認して改めてご連絡します。",
  );
  await prepareScreenshot(page);
  await page.screenshot({
    path: `../../outputs/master-hq/e2e-screenshots/inbox-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "リセット", exact: true }).click();
  await page.getByLabel("問い合わせを検索").fill("請求");
  await expect(page.locator(".ticket")).toHaveCount(1);
  await page.getByLabel("カテゴリ", { exact: true }).selectOption("契約");
  await expect(
    page.getByText("該当する問い合わせがありません。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "絞り込みを解除" }).click();
  await expect(page.locator(".ticket")).toHaveCount(6);
});
test("admin: CRUD, persistence, filter, history, cancel and reset", async ({
  page,
}, testInfo) => {
  await page.goto("/demos/admin");
  await page.getByRole("button", { name: "顧客を追加" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("顧客名").fill("テスト顧客");
  await dialog.getByLabel("担当者名").fill("テスト担当");
  await dialog.getByLabel("累計売上（円）").fill("18000");
  await dialog.getByRole("button", { name: "追加する" }).click();
  await expect(page.getByRole("status")).toContainText("追加");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "テスト顧客を編集" }),
  ).toBeVisible();
  await page.getByLabel("顧客を検索").fill("テスト");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "テスト顧客を編集" }).click();
  await dialog.getByLabel("ステータス", { exact: true }).selectOption("取引中");
  await dialog.getByRole("button", { name: "変更を保存" }).click();
  await expect(page.locator("tbody tr")).toContainText("取引中");
  await page.getByLabel("顧客を検索").clear();
  await prepareScreenshot(page);
  await page.screenshot({
    path: `../../outputs/master-hq/e2e-screenshots/admin-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "テスト顧客を削除" }).click();
  await dialog.getByRole("button", { name: "キャンセル" }).click();
  await expect(
    page.getByRole("button", { name: "テスト顧客を編集" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "テスト顧客を削除" }).click();
  await dialog.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "テスト顧客を編集" }),
  ).toHaveCount(0);
  await expect(page.locator(".history-section")).toContainText("削除しました");
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await page
    .getByLabel("ステータス", { exact: true })
    .first()
    .selectOption("休止");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "サンプルに戻す" }).click();
  await dialog.getByRole("button", { name: "初期状態に戻す" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await expect(page.locator(".history-section")).toContainText(
    "まだ操作履歴はありません",
  );
});
test("admin: corrupt storage and keyboard modal cancellation", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("works-admin-v1", "{bad"),
  );
  await page.goto("/demos/admin");
  await expect(page.locator('.error-message[role="alert"]')).toContainText(
    "読み込めません",
  );
  await page.getByRole("button", { name: "顧客を追加" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("404 and metadata", async ({ page }) => {
  const response = await page.goto("/not-a-real-page");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "ページが見つかりませんでした。" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "TSUDOWAへ戻る →" }).click();
  await expect(page).toHaveTitle(/TSUDOWA/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /TSUDOWA/,
  );
});

test("storage and clipboard failures remain usable", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage blocked", "QuotaExceededError");
    };
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Unavailable");
        },
      },
    });
  });
  await page.goto("/demos/admin");
  await page.getByRole("button", { name: "顧客を追加" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("顧客名").fill("保存テスト");
  await dialog.getByLabel("担当者名").fill("デモ担当");
  await dialog.getByRole("button", { name: "追加する" }).click();
  await expect(page.locator('.error-message[role="alert"]')).toContainText(
    "保存できません",
  );
  await expect(
    page.getByRole("button", { name: "保存テストを編集" }),
  ).toBeVisible();
  await page.goto("/contact");
  await page.locator(".intake-copy summary").click();
  await page.getByRole("button", { name: "相談内容をコピー" }).click();
  await expect(page.getByLabel("コピー用の相談内容")).toBeVisible();
  await expect(page.getByLabel("コピー用の相談内容")).toHaveValue(
    /【相談内容】/,
  );
});
