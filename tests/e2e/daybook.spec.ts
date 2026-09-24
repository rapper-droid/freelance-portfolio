import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * DAYBOOK in a browser (指示書 §14).
 *
 * The spec makes one flow mandatory — *希望枠が埋まっている → 代替候補 →
 * 確定 → 後から変更依頼 → 差分だけ確認 → 関連記録更新* — and the first test
 * walks exactly that, with real clicks, across the two screens.
 *
 * Nothing here selects a slot by index. The studio's calendar moves with the
 * clock, so a fixed `nth()` passes in the morning and fails after lunch; the
 * walk takes whichever candidate the page offered.
 */

const ready = (page: Page) =>
  page.locator(".daybook-desk").waitFor({ timeout: 25000 });

/** Sends the sample whose requested time is deliberately taken. */
async function askForATakenSlot(page: Page) {
  await page.goto("/daybook");
  await ready(page);
  await page.getByRole("button", { name: /希望の枠が埋まっている/ }).click();
  await page.getByRole("button", { name: "この内容で相談する" }).click();
  await page.locator(".daybook-record").first().waitFor({ timeout: 25000 });
}

/** Takes the first candidate on offer and holds it. */
async function holdFirstCandidate(page: Page) {
  const slots = page.locator(".daybook-record .daybook-slot input");
  await slots.first().waitFor({ timeout: 25000 });
  await slots.first().click();
  await page.getByRole("button", { name: "この日時を仮押さえする" }).click();
}

test("必須フロー：埋まっている → 候補 → 仮押さえ → 合意 → 承認 → 変更 → 差分 → 確定", async ({
  page,
}) => {
  // --- 1. 希望の枠が埋まっている。理由が出る。
  await askForATakenSlot(page);
  const record = page.locator(".daybook-record").first();
  await expect(record.locator(".daybook-badge")).toContainText("候補を選ぶ");
  await record.getByRole("group", { name: "候補の日時" }).waitFor();

  await record.getByText("この依頼の記録").click();
  await expect(record.locator(".daybook-timeline")).toContainText(
    "希望の日時は取れません",
  );

  // --- 2. 候補を取ると、仮押さえであって予約ではない。
  await holdFirstCandidate(page);
  await expect(record.locator(".daybook-badge")).toContainText("仮押さえ中");
  await expect(record).toContainText("まだ予約は成立していません");
  const held = await record.locator(".daybook-record-when").innerText();

  // --- 3. 合意だけでは確定しない。運用側が承認して初めて確定する。
  await record
    .getByRole("button", { name: "この日時で確定を依頼する" })
    .click();
  await expect(record.locator(".daybook-badge")).toContainText(
    "お店の承認待ち",
  );

  await page.goto("/daybook/admin");
  await ready(page);
  const decision = page.locator(".daybook-record").first();
  await expect(decision.locator(".daybook-signatures li").first()).toHaveClass(
    /is-signed/,
  );
  await expect(decision.locator(".daybook-signatures li").last()).toHaveClass(
    /is-missing/,
  );
  await decision.getByRole("button", { name: "承認して確定する" }).click();

  // 予約者側にも同じ結果が届いている。
  await page.goto("/daybook");
  await ready(page);
  await expect(
    page.locator(".daybook-record").first().locator(".daybook-badge"),
  ).toContainText("確定");
  expect(
    await page
      .locator(".daybook-record .daybook-record-when")
      .first()
      .innerText(),
  ).toBe(held);

  // --- 4. あとから変更を頼む。
  await page
    .locator(".daybook-record")
    .first()
    .getByRole("button", { name: "日時を変更したい" })
    .click();
  const alternatives = page.locator(".daybook-record .daybook-slot input");
  await alternatives.first().waitFor({ timeout: 25000 });
  await alternatives.first().click();
  await page
    .getByRole("button", { name: "この日時への変更を依頼する" })
    .click();

  // --- 5. 変わるところだけが出る。旧 → 新。
  const diff = page.locator(".daybook-diff").first();
  await expect(diff).toBeVisible();
  await expect(diff).toContainText("承認されるまで元の予約はそのまま残ります");
  await expect(diff.locator("s")).toHaveText(held);
  const moveTo = await diff.locator("strong").innerText();
  expect(moveTo).not.toBe(held);

  // --- 6. 承認前は、まだ元の枠が押さえられている。
  await page.goto("/daybook/admin");
  await ready(page);
  await expect(page.locator(".daybook-calendar")).toContainText(
    "変更の承認待ち（この枠は押さえたまま）",
  );

  // --- 7. 承認すると日時が移り、関連する記録が更新される。
  await page
    .locator(".daybook-record")
    .first()
    .getByRole("button", { name: "変更を承認して確定する" })
    .click();

  await page.goto("/daybook");
  await ready(page);
  const after = page.locator(".daybook-record").first();
  await expect(after.locator(".daybook-badge")).toContainText("確定");
  await expect(after.locator(".daybook-record-when")).toHaveText(moveTo);
  await after.getByText("この依頼の記録").click();
  await expect(after.locator(".daybook-timeline")).toContainText(
    "元の枠はこの時点で解放されました",
  );
  await expect(after.locator(".daybook-diff")).toHaveCount(0);
});

test("合意がないまま承認すると、断られた理由が記録に残る", async ({ page }) => {
  await askForATakenSlot(page);
  await holdFirstCandidate(page);

  await page.goto("/daybook/admin");
  await ready(page);
  const decision = page.locator(".daybook-record").first();
  await expect(decision.locator(".daybook-badge")).toContainText("合意待ち");
  await expect(decision).toContainText("いま承認しても確定しません");

  // 押せる。押した結果が「確定しない」ことと、その理由が残ること。
  await decision.getByRole("button", { name: "承認して確定する" }).click();
  await expect(page.locator(".daybook-notice")).toContainText(
    "予約者の日程合意が記録されていません",
  );
  await decision.getByText("この依頼の記録").click();
  await expect(decision.locator(".daybook-timeline")).toContainText(
    "確定できず",
  );
  await expect(decision.locator(".daybook-badge")).toContainText("合意待ち");
});

test("日時のない文面には、決めつけずに候補と足りない項目を出す", async ({
  page,
}) => {
  await page.goto("/daybook");
  await ready(page);
  await page.getByRole("button", { name: /日時が書かれていない/ }).click();
  await page.getByRole("button", { name: "この内容で相談する" }).click();

  const record = page.locator(".daybook-record").first();
  await expect(record.locator(".daybook-record-when")).toContainText(
    "日時は未定",
  );
  await record.getByText("この依頼の記録").click();
  await expect(record.locator(".daybook-timeline")).toContainText(
    "文面から日時を特定できませんでした",
  );
  // 決めつけない、で終わらせない。候補は出る。
  await expect(record.locator(".daybook-slot").first()).toBeVisible();
});

test("営業時間外は、断る理由を営業条件として説明する", async ({ page }) => {
  await page.goto("/daybook");
  await ready(page);
  await page.getByRole("button", { name: /営業時間外を希望している/ }).click();
  await page.getByRole("button", { name: "この内容で相談する" }).click();

  const record = page.locator(".daybook-record").first();
  await record.getByText("この依頼の記録").click();
  await expect(record.locator(".daybook-timeline")).toContainText(
    "希望の日時は取れません",
  );
  await expect(record.locator(".daybook-slot").first()).toBeVisible();
});

test("自分が作っていない予定は、読むだけで触らない", async ({ page }) => {
  await page.goto("/daybook/admin");
  await ready(page);
  const external = page.locator(".daybook-entry.is-external").first();
  await expect(external).toContainText("他システムの予定");
  await expect(external).toContainText("変更も削除もしません");
  // その行にボタンはない。
  await expect(external.locator("button")).toHaveCount(0);
});

test("再読み込みしても、仮押さえも確定も残る", async ({ page }) => {
  await askForATakenSlot(page);
  await holdFirstCandidate(page);
  const before = await page
    .locator(".daybook-record .daybook-record-when")
    .first()
    .innerText();

  await page.reload();
  await ready(page);
  await expect(
    page.locator(".daybook-record .daybook-record-when").first(),
  ).toHaveText(before);
  await expect(
    page.locator(".daybook-record .daybook-badge").first(),
  ).toContainText("仮押さえ中");
});

test("空の状態でも、何をすればよいかが書いてある", async ({ page }) => {
  await page.goto("/daybook");
  await ready(page);
  await expect(page.locator(".daybook-empty").first()).toContainText(
    "まだ相談はありません",
  );
  await page.goto("/daybook/admin");
  await ready(page);
  await expect(page.locator(".daybook-empty").first()).toContainText(
    "いま判断が要るものはありません",
  );
  // 予定そのものは空ではない。台帳には先約がある。
  await expect(page.locator(".daybook-entry").first()).toBeVisible();
});

test("手元のデータを書き出して、初期化して、読み戻せる", async ({ page }) => {
  await askForATakenSlot(page);
  await holdFirstCandidate(page);
  const held = await page
    .locator(".daybook-record .daybook-record-when")
    .first()
    .innerText();

  // 書き出しの中身は、画面が保存しているものそのもの。
  const exported = await page.evaluate(
    () => window.localStorage.getItem("tsudowa-daybook-sandbox-v1") ?? "",
  );
  expect(exported).toContain("REQ-");

  await page
    .getByRole("button", { name: "この端末のデータを初期化する" })
    .click();
  await expect(page.locator(".daybook-record")).toHaveCount(0);
  await expect(page.locator(".daybook-empty").first()).toContainText(
    "まだ相談はありません",
  );

  await page.getByLabel("相談と予約のファイルを選ぶ").setInputFiles({
    name: "daybook.json",
    mimeType: "application/json",
    buffer: Buffer.from(exported, "utf-8"),
  });
  await expect(
    page.locator(".daybook-record .daybook-record-when").first(),
  ).toHaveText(held);
});

test("よその体験の保存ファイルは、理由を言って断る", async ({ page }) => {
  await page.goto("/daybook");
  await ready(page);
  await page.getByLabel("相談と予約のファイルを選ぶ").setInputFiles({
    name: "kissa.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ schemaVersion: 1, orders: [], cart: [] }),
      "utf-8",
    ),
  });
  await expect(page.locator(".sandbox-data-message")).toContainText(
    "この体験の保存データではないようです",
  );
});

for (const path of ["/daybook", "/daybook/admin"]) {
  test(`${path} に重大なアクセシビリティ違反がない`, async ({ page }) => {
    await page.goto(path);
    await ready(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
