import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * REPORT FLOW in a browser (指示書 §15).
 *
 * The spec makes one flow mandatory — *set up week one, run week two without
 * being asked anything, stop on week three only for what is new* — and that is
 * what the first test walks, end to end, with real clicks.
 *
 * The rest are the states a tool gets judged on: a file that will not parse, a
 * file with five thousand rows, a correction, an empty history, and coming
 * back to a tab that was closed mid-way.
 */

const ready = (page: Page) =>
  page.locator(".report-steps").waitFor({ timeout: 25000 });

const totals = (page: Page) =>
  page.locator(".report-totals").first().waitFor({ timeout: 25000 });

async function setUpWeekOne(page: Page, label = "週次売上") {
  await page.goto("/report");
  await ready(page);
  await page.getByRole("button", { name: "1週目（最初の設定）" }).click();
  await page.locator(".report-map").waitFor({ timeout: 25000 });
  await page.getByLabel("ルールの名前").fill(label);
  await page.getByRole("button", { name: "ルールを保存して集計する" }).click();
  await totals(page);
}

test("必須の三連続フロー：設定 → 質問なし → 新しいものだけ確認", async ({
  page,
}) => {
  // --- 1週目：列の意味を決めて保存する。
  await setUpWeekOne(page);
  await expect(page.locator(".report-provenance").first()).toContainText(
    "週次売上",
  );
  const week1 = await page.locator(".report-totals").first().innerText();
  expect(week1).toContain("12 件"); // 読み込んだ行
  await page.getByRole("button", { name: "この結果を履歴に記録する" }).click();
  await expect(page.locator(".report-facts")).toBeVisible();

  // --- 2週目：列の順番だけが違う。何も聞かれてはいけない。
  await page.goto("/report");
  await ready(page);
  await page.getByRole("button", { name: "取込" }).click();
  await page.getByRole("button", { name: "2週目（列の順番だけ違う）" }).click();
  await totals(page);
  await expect(page.locator(".report-changes")).toHaveCount(0);
  // そして前回との差が、比較の前提つきで出る。
  await expect(page.locator(".report-basis")).toContainText("1週目");
  await expect(page.locator(".report-basis")).toContainText("JPY");
  await page.getByRole("button", { name: "この結果を履歴に記録する" }).click();

  // --- 3週目：知らない列と税区分。その2点だけを聞く。
  await page.goto("/report");
  await ready(page);
  await page.getByRole("button", { name: "取込" }).click();
  await page
    .getByRole("button", { name: "3週目（知らない列と税区分）" })
    .click();
  const changes = page.locator(".report-changes li");
  await expect(changes).toHaveCount(2);
  await expect(changes.nth(0)).toContainText("販売チャネル");
  await expect(changes.nth(1)).toContainText("軽減8%");
  // 増えた列は表の中でも目印がつく。
  await expect(page.locator('.report-map tr[data-new="true"]')).toHaveCount(1);

  await page
    .getByRole("button", {
      name: "この内容でルールを更新する（版が上がります）",
    })
    .click();
  await totals(page);

  // --- 版が上がり、前の版は消えていない。
  await page.goto("/report/recipes");
  await expect(page.locator(".report-recipe-list > li")).toHaveCount(1);
  await expect(page.locator(".report-provenance").first()).toContainText(
    "版 2",
  );
  await expect(page.locator(".report-panel").first()).toContainText("軽減8%");
});

test("読み取れない行を、表計算を開かずに直せる", async ({ page }) => {
  await setUpWeekOne(page, "修正テスト");

  const problems = page.locator(".report-problems > li");
  await expect(problems).toHaveCount(3);
  const before = await page.locator(".report-totals").first().innerText();

  await problems
    .filter({ hasText: "9 行目" })
    .getByRole("button", { name: "この行を直す" })
    .click();
  await page
    .locator(".report-fix-editor")
    .getByLabel("金額", { exact: true })
    .fill("15000");
  await page.getByLabel("修正の理由（記録に残ります）").fill("請求書から確認");
  await page.getByRole("button", { name: "直して再計算する" }).click();

  await expect(problems).toHaveCount(2);
  await expect(page.locator(".report-fixed li")).toHaveCount(1);
  // 記録には、変えた列だけが残る。
  const fixed = await page.locator(".report-fixed li").innerText();
  expect(fixed).toContain("金額=15000");
  expect(fixed).not.toContain("商品=");
  expect(fixed).toContain("請求書から確認");
  expect(await page.locator(".report-totals").first().innerText()).not.toBe(
    before,
  );

  // 取り消すと元に戻る。
  await page.getByRole("button", { name: "取り消す" }).click();
  await expect(problems).toHaveCount(3);
});

test("合計は、集計した行だけの合計だと画面で言う", async ({ page }) => {
  await setUpWeekOne(page, "件数テスト");
  const panel = page.locator(".report-panel").first();
  await expect(panel).toContainText("合計は、読み取れた");
  // 集計対象にならなかった行は、明細でも見分けがつく。
  await expect(
    page.locator('.report-rows tr[data-counted="false"]'),
  ).not.toHaveCount(0);
});

test("壊れたCSVは、何が悪いかと直し方を出す", async ({ page }) => {
  await page.goto("/report");
  await ready(page);
  await page.evaluate(() => {
    const key = "tsudowa-report-sandbox-v1";
    localStorage.setItem(
      key,
      JSON.stringify({
        schemaVersion: 1,
        sandboxId: "test",
        recipes: [],
        runs: [],
        draft: {
          step: "map",
          fileLabel: "壊れた.csv",
          csvText: 'a,b\n"1,2',
          userSupplied: true,
          recipeId: null,
          columnRoles: {},
          currency: "JPY",
          dedupeBy: "orderId",
          fixes: [],
          pendingConfirmation: false,
          updatedAtIso: new Date().toISOString(),
        },
        createdAtIso: new Date().toISOString(),
        updatedAtIso: new Date().toISOString(),
      }),
    );
  });
  await page.reload();
  await ready(page);
  await expect(page.locator(".report-error")).toContainText(
    "読み込めませんでした",
  );
  await expect(page.locator(".report-error-reason")).toContainText("引用符");
  await expect(page.locator(".report-hints li")).not.toHaveCount(0);
  await page.getByRole("button", { name: "別のファイルを選ぶ" }).click();
  await expect(page.locator(".report-sources")).toBeVisible();
});

test("5,000行でも、表を全部描かない", async ({ page }) => {
  await page.goto("/report");
  await ready(page);
  await page.getByRole("button", { name: "5,000行で試す" }).click();
  await page.locator(".report-map").waitFor({ timeout: 25000 });
  await page.getByLabel("ルールの名前").fill("大きいファイル");
  await page.getByRole("button", { name: "ルールを保存して集計する" }).click();
  await totals(page);

  await expect(page.locator(".report-totals").first()).toContainText("5000 件");
  // 一度に描くのは 50 行まで。
  await expect(page.locator(".report-rows tbody tr")).toHaveCount(50);
  await page.getByRole("button", { name: /次の 50 件を表示/ }).click();
  await expect(page.locator(".report-rows tbody tr")).toHaveCount(100);

  // 絞り込みは全件に効く。
  await page.getByRole("searchbox", { name: "絞り込み" }).fill("000123");
  await expect(page.locator(".report-rows tbody tr")).toHaveCount(1);
});

test("タブを閉じて戻っても、途中から続けられる", async ({ page }) => {
  await setUpWeekOne(page, "再訪テスト");
  await page.goto("about:blank");
  await page.goto("/report");
  await ready(page);
  // 同じファイル、同じルール、同じ集計のまま。
  await totals(page);
  await expect(page.locator(".report-provenance").first()).toContainText(
    "再訪テスト",
  );
});

test("記録が何もないときは、空だと書いて次の一手を出す", async ({ page }) => {
  for (const route of ["/report/recipes", "/report/history"]) {
    await page.goto(route);
    await expect(page.locator(".report-panel").first()).toContainText(
      "まだありません",
    );
    await expect(
      page.getByRole("link", { name: "CSVを読み込む" }),
    ).toBeVisible();
  }
});

test("REPORT FLOW の3画面にアクセシビリティ違反がない", async ({ page }) => {
  await setUpWeekOne(page, "a11y");
  for (const route of ["/report", "/report/recipes", "/report/history"]) {
    await page.goto(route);
    await page.locator(".report-nav").waitFor({ timeout: 25000 });
    expect(
      (await new AxeBuilder({ page }).analyze()).violations,
      route,
    ).toEqual([]);
  }
});

test("制作例から、道具そのものへ行ける", async ({ page }) => {
  await page.goto("/projects/csv");
  const panel = page.locator(".demo-live");
  await expect(panel).toBeVisible();
  // 架空の店舗ではないので、その但し書きは出ない。
  await expect(panel).not.toContainText("架空の店舗です");
  await expect(panel).toContainText("この端末から出ず");
  await panel.getByRole("link", { name: /REPORT FLOW を開く/ }).click();
  await expect(page).toHaveURL(/\/report$/);
});
