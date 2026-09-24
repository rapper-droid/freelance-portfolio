import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  actionKinds,
  runStatuses,
  irreversibleActionKinds,
} from "../../src/lib/runtime/types";

/**
 * The Automation / API technical console (指示書 §17).
 *
 * The spec's demand is negative — *nodeを線でつなぐだけのフローチャートで
 * 終わらせない* — so these check the things a flowchart cannot show: what an
 * approval is bound to, which effects cannot be taken back, and what pressing
 * the button twice does after a timeout.
 */

const ready = (page: Page) =>
  page.locator(".auto-console").waitFor({ timeout: 25000 });

async function plan(page: Page) {
  await page.goto("/automation");
  await ready(page);
  await page.getByRole("button", { name: "抽出して計画を作る" }).click();
  await page.locator('[aria-labelledby="plan-h"]').waitFor({ timeout: 30000 });
}

test("契約は、コードの閉じた集合をそのまま出す", async ({ page }) => {
  await page.goto("/automation");
  await ready(page);

  // 境界（やらないこと）が先に来る。
  const boundaries = page.locator(".auto-boundaries > div");
  await expect(boundaries).toHaveCount(4);
  await expect(page.locator(".auto-boundaries")).toContainText("任意のコード");
  await expect(page.locator(".auto-boundaries")).toContainText("任意のURL");

  await expect(page.locator(".auto-enum")).toHaveCount(6);

  // 操作の種類を開くと、コードの 8 種類がそのまま並ぶ。
  await page.getByRole("button", { name: /操作の種類/ }).click();
  const body = page.locator(".auto-enum-body");
  for (const kind of actionKinds) await expect(body).toContainText(kind);
  for (const kind of irreversibleActionKinds)
    await expect(
      body.locator("li", { hasText: kind }).locator(".auto-tag"),
    ).toHaveText("取り消せない");

  // 実行の状態も同じく、失敗と結果不明が別の値として出る。
  await page.getByRole("button", { name: /実行の状態/ }).click();
  const statuses = page.locator(".auto-enum-body");
  for (const status of runStatuses)
    await expect(statuses).toContainText(status);
});

test("マッピングは、項目の根拠を原文の上で示す", async ({ page }) => {
  await plan(page);

  const fields = page.locator(".auto-fields button:not([disabled])");
  expect(await fields.count()).toBeGreaterThan(0);
  await expect(page.locator(".auto-source-text mark")).toHaveCount(0);

  await fields.first().click();
  await expect(page.locator(".auto-source-text mark")).not.toHaveCount(0);
  // 位置と引用が、言い換えではなく原文の切り出しとして出る。
  await expect(page.locator(".auto-source")).toContainText("「");

  // 根拠のない項目は押せず、規則から導いたと書いてある。
  const derived = page.locator(".auto-fields button[disabled]");
  if ((await derived.count()) > 0)
    await expect(derived.first()).toContainText("規則から導出");
});

test("計画は、提案された承認と実際の可否を両方見せる", async ({ page }) => {
  await plan(page);

  const rows = page.locator('[aria-labelledby="plan-h"] tbody tr');
  expect(await rows.count()).toBeGreaterThan(1);

  // ハッシュと冪等キーが出ている。
  await expect(page.locator('[aria-labelledby="plan-h"]')).toContainText(
    "payloadHash",
  );
  await expect(page.locator('[aria-labelledby="plan-h"]')).toContainText(
    "idempotencyKey",
  );

  // 取り消せない操作は印がつき、sample では実行不可だと書く。
  const irreversible = page.locator('tr[data-irreversible="true"]');
  await expect(irreversible).not.toHaveCount(0);
  await expect(irreversible.first()).toContainText("実行不可");
});

test("承認は中身に紐づき、外へ出る操作は既定で選ばれない", async ({ page }) => {
  await plan(page);

  // mail.send は決定なので、最初からチェックは入らない。
  const mail = page.locator(".auto-approve li", { hasText: "mail.send" });
  await expect(mail.locator("input")).not.toBeChecked();

  await page.getByRole("button", { name: /件を承認する/ }).click();
  const approved = page.locator(".auto-subpanel", { hasText: "承認済み" });
  await expect(approved).toBeVisible();
  // 何に紐づいたかが、真偽値ではなくハッシュで出る。
  await expect(approved).toContainText("紐づけたハッシュ");
  await expect(approved.locator("code").first()).toContainText(":");
});

test("失敗と結果不明は別で、再実行しても二重に実行されない", async ({
  page,
}) => {
  await plan(page);
  await page.getByRole("button", { name: /件を承認する/ }).click();

  // 2 つ目の操作だけ、応答が返らない設定にする。
  const selects = page.locator('[aria-labelledby="exec-h"] select');
  await selects.nth(1).selectOption("timeout");
  await page.getByRole("button", { name: "承認した操作を実行する" }).click();

  const first = page.locator('[aria-labelledby="exec-h"] .auto-outcome');
  await expect(first.first()).toBeVisible();
  const attempt1 = await first.allInnerTexts();
  expect(attempt1).toContain("成功");
  expect(attempt1).toContain("結果不明");

  // 再実行：成功した操作も、結果が分からなかった操作も、もう一度は実行しない。
  await page.getByRole("button", { name: /再実行/ }).click();
  const log = page.locator('[aria-labelledby="log-h"] tbody tr');
  await expect(log).not.toHaveCount(0);
  await expect(page.locator('[aria-labelledby="log-h"]')).toContainText(
    "再実行しません",
  );
  await expect(page.locator('[aria-labelledby="exec-h"]')).toContainText(
    "同じ idempotencyKey",
  );
});

test("ログは実ファイルとして書き出せる", async ({ page }) => {
  await plan(page);
  await page.getByRole("button", { name: /件を承認する/ }).click();
  await page.getByRole("button", { name: "承認した操作を実行する" }).click();
  await page.locator('[aria-labelledby="log-h"] tbody tr').first().waitFor();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "ログを書き出す" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^automation-log-.*\.json$/);
  const path = await download.path();
  expect(path).toBeTruthy();
});

test("技術画面にアクセシビリティ違反がない", async ({ page }) => {
  await plan(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("業務側の画面と、互いに行き来できる", async ({ page }) => {
  await page.goto("/automation");
  await ready(page);
  await page.getByRole("link", { name: "RELAY のデモ" }).first().click();
  await expect(page).toHaveURL(/\/demos\/automation$/);
});
