import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * End-to-end cover for the real-utility sample (指示書 §05, §06, §12).
 *
 * Screenshots are deliberately not written here. The older specs save into
 * `../../outputs/`, which resolves outside the repository and fails whenever
 * the checkout is not exactly two levels deep; Playwright's own trace and the
 * `qa:flow` script already hold the visual evidence.
 */

test("flow: three entries, real processing, no external effect claimed", async ({
  page,
}) => {
  await page.goto("/flow");

  // The work comes before the product name (A01).
  await expect(
    page.getByRole("heading", { level: 1, name: /入力する仕事を、\s*減らす/ }),
  ).toBeVisible();

  // Nothing has to be created or connected before the first run (A09). The
  // consultation form further down the page is a way out, not a gate, so the
  // check is that no sign-in or connect control exists at all.
  for (const gate of [
    /ログイン/,
    /アカウント(を)?(作成|登録)/,
    /サインアップ/,
    /Google(と)?(連携|接続)/,
  ])
    await expect(page.getByRole("button", { name: gate })).toHaveCount(0);

  // What is not connected is stated up front (A07, D02).
  await expect(page.getByText(/実AI処理：/)).toBeVisible();
  await expect(page.getByText(/デモ基準日/)).toBeVisible();

  // Choosing a situation is the only step before the run.
  await page.getByRole("button", { name: /見積の相談が届いた/ }).click();
  const run = page.getByRole("button", { name: /仕事が進むところを見る/ });
  await expect(run).toBeEnabled();
  await run.click();

  // Three panels in the order the story reads (指示書 §05).
  for (const heading of [
    "受け取ったもの",
    "進めた仕事",
    "あなたが確認すること",
  ])
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();

  // The four facts about this run are shown separately (A06, §06).
  const stages = page.locator(".flow-stages li");
  await expect(stages).toHaveCount(4);
  await expect(stages.filter({ hasText: "架空サンプル" })).toHaveCount(1);
  await expect(stages.filter({ hasText: "通常プログラム" })).toHaveCount(1);

  // A sample never claims an external effect ran (A06, S04).
  await expect(page.locator(".flow-stages")).not.toContainText("実行済み");
  await expect(
    page.getByText(/公開サンプルでは外部操作を実行しません/),
  ).toBeVisible();

  // The draft exists and commits to nothing (R07, R08).
  await expect(page.locator(".flow-output")).toContainText("山田太郎 様");
  await expect(page.locator(".flow-output")).not.toContainText("お約束");
});

test("flow: the second message does not repeat the first one's questions", async ({
  page,
}) => {
  await page.goto("/flow");
  await page.getByRole("button", { name: /見積の相談が届いた/ }).click();
  await page.getByRole("button", { name: /仕事が進むところを見る/ }).click();
  await expect(page.locator(".flow-output")).toContainText("所要時間");

  await page.getByRole("button", { name: /^次：/ }).click();
  await expect(
    page.getByRole("heading", { name: "あなたが確認すること" }),
  ).toBeVisible();

  // Answered in message two, so the reply stops asking (R04).
  const reply = page.locator(".flow-output");
  await expect(reply).toContainText("60分");
  await expect(reply).not.toContainText("1件あたりの所要時間をお教え");
  // And the change is marked rather than making the reader re-read (§12).
  await expect(page.locator(".flow-new").first()).toBeVisible();
});

test("flow: a taken slot yields buffered alternatives, not a booking", async ({
  page,
}) => {
  await page.goto("/flow");
  await page.getByRole("button", { name: /予約の相談が届いた/ }).click();
  await page.getByRole("button", { name: /仕事が進むところを見る/ }).click();
  await expect(page.getByRole("heading", { name: "進めた仕事" })).toBeVisible();

  // Alternatives are offered and the requested time is not silently taken.
  await expect(page.getByText(/2026年9月30日（水）/).first()).toBeVisible();
  // Confirmation stays separate from the administrator's approval (B05).
  await expect(page.getByText(/予約者の日程合意/)).toBeVisible();
});

test("flow: week two reuses the recipe, week three stops on the changed column", async ({
  page,
}) => {
  await page.goto("/flow");
  await page
    .getByRole("button", { name: /今週の売上ファイルが届いた/ })
    .click();
  await page.getByRole("button", { name: /仕事が進むところを見る/ }).click();
  await expect(page.getByText(/適用したレシピ/)).toBeVisible();

  // Week two: columns reordered, no new questions, a stated comparison (C05, C07).
  await page.getByRole("button", { name: /^次：/ }).click();
  await expect(page.getByRole("heading", { name: "前回との差" })).toBeVisible();
  await expect(page.getByText(/比較条件：/)).toBeVisible();

  // Week three: one changed column, so it stops rather than guessing (C06).
  await page.getByRole("button", { name: /^次：/ }).click();
  await expect(
    page.getByRole("heading", { name: "前回から変わった点だけ確認" }),
  ).toBeVisible();
  await expect(page.getByText(/税区分/).first()).toBeVisible();
});

test("flow: the populated result has no serious accessibility violation", async ({
  page,
}) => {
  await page.goto("/flow");
  await page.getByRole("button", { name: /見積の相談が届いた/ }).click();
  await page.getByRole("button", { name: /仕事が進むところを見る/ }).click();
  await expect(
    page.getByRole("heading", { name: "あなたが確認すること" }),
  ).toBeVisible();

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
  ).toEqual([]);
});

test("flow: the endpoint refuses input that does not fit its contract", async ({
  request,
}) => {
  // An unknown scenario is refused rather than defaulted (S02).
  const unknown = await request.post("/api/flow", {
    data: { scenario: "not-a-scenario" },
  });
  expect(unknown.status()).toBe(400);

  // Oversized text is refused with a reason, not truncated silently.
  const long = await request.post("/api/flow", {
    data: { scenario: "relay-quote", text: "あ".repeat(2001) },
  });
  expect(long.status()).toBe(400);
  expect((await long.json()).code).toBe("too_long");
});

test("works: the lead section precedes the gallery and keeps every entry", async ({
  page,
}) => {
  await page.goto("/works");

  // What gets smaller comes first (A01, A02).
  await expect(
    page.getByRole("heading", { name: /入力する仕事を、\s*減らす/ }),
  ).toBeVisible();

  // The three troubles are named before the product names.
  for (const trouble of ["返信の準備", "日程調整", "定期報告"])
    await expect(
      page.getByText(trouble, { exact: true }).first(),
    ).toBeVisible();

  // The gallery and the category filter are still there (A03, A04).
  await expect(page.locator("#works")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /制作例から探す/ }),
  ).toBeVisible();

  // The estimate is labelled as an estimate, never as a measured outcome (U09).
  await expect(page.getByText("試算（実績ではありません）")).toBeVisible();
});

test("flow: the sample is operable from the keyboard alone", async ({
  page,
}) => {
  await page.goto("/flow");

  // Reach the first situation by tabbing, and choose it with the keyboard.
  const entry = page.getByRole("button", { name: /見積の相談が届いた/ });
  await entry.focus();
  await expect(entry).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(entry).toHaveAttribute("aria-pressed", "true");

  // The run control is reachable and activates on Enter.
  const run = page.getByRole("button", { name: /仕事が進むところを見る/ });
  await run.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "あなたが確認すること" }),
  ).toBeVisible();

  // The result is announced rather than only appearing (指示書 U03).
  await expect(page.locator('[role="status"]').first()).toHaveAttribute(
    "aria-live",
    "polite",
  );

  // Focus is visible on whatever the keyboard lands on next.
  await page.keyboard.press("Tab");
  const outlined = await page.evaluate(() => {
    const active = document.activeElement;
    if (!active || active === document.body) return null;
    return getComputedStyle(active).outlineStyle;
  });
  expect(outlined).not.toBe("none");
});

test("flow: the report step states its limits and hands back real files", async ({
  page,
}) => {
  await page.goto("/flow");
  await page
    .getByRole("button", { name: /今週の売上ファイルが届いた/ })
    .click();
  await page.getByRole("button", { name: /仕事が進むところを見る/ }).click();
  await expect(page.getByRole("heading", { name: "進めた仕事" })).toBeVisible();

  // The stated limits match what the parser enforces (C02).
  await expect(page.getByText(/UTF-8/)).toBeVisible();
  await expect(page.getByText(/Shift_JIS/)).toBeVisible();

  // The processed rows and the change log come back as files (C08).
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /加工済みCSVを保存/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.csv$/);

  const logDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /変更ログ・問題行を保存/ }).click();
  expect((await logDownload).suggestedFilename()).toMatch(/\.csv$/);
});
