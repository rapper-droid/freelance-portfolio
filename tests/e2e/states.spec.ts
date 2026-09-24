import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/** Read rather than imported: Playwright's loader wants an import attribute. */
const contracts = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "docs/rebuild/PAGE_CONTRACTS.json"),
    "utf8",
  ),
) as {
  counts: { templates: number; entities: number };
  contracts: Array<{
    template: string;
    states: Record<string, { applies: boolean; reason?: string }>;
  }>;
};

/**
 * P5: the states the ledger claims apply, actually exist.
 *
 * PAGE_CONTRACTS.md says which of the twenty-three contract states each screen
 * has to handle. A ledger that nobody checks is a list of intentions, so the
 * ones a visitor is most likely to hit — nothing yet, nothing matched, the
 * form refusing — are opened here and read.
 *
 * The states already covered elsewhere are not repeated: sold-out and
 * disabled live in kissa.spec/forme.spec, migration and the storage faults in
 * sandbox.spec, approval revocation in ops.spec, and `validation error` in
 * contact.spec — which stubs `/api/contact` so the submit button is really
 * enabled, something a test written here could only fake.
 */

const stateOf = (template: string, state: string) =>
  contracts.contracts.find((c) => c.template === template)?.states?.[state];

/** The ledger and the test have to agree before the test means anything. */
function claims(template: string, state: string) {
  const record = stateOf(template, state);
  expect(
    record,
    `${template} / ${state} missing from PAGE_CONTRACTS`,
  ).toBeTruthy();
  expect(
    record?.applies,
    `PAGE_CONTRACTS says ${state} does not apply to ${template}`,
  ).toBe(true);
}

const fresh = async (page: Page, route: string) => {
  await page.goto(route);
  await page.evaluate(() => localStorage.clear());
  await page.goto(route);
};

test("空: 何もしていない訪問者には、どのタブでも空だと書く", async ({
  page,
}) => {
  claims("/kissa/my", "空");
  await fresh(page, "/kissa/my");
  await expect(page.locator(".kissa-empty")).toContainText(
    "この端末からのご注文はまだありません。",
  );
  // Each empty state sits behind its own tab, so both are opened.
  await page.getByRole("tab", { name: /予約/ }).click();
  await expect(page.locator(".kissa-empty")).toContainText(
    "この端末からのご予約はまだありません。",
  );

  claims("/forme/my", "空");
  await fresh(page, "/forme/my");
  await expect(page.locator(".forme-empty")).toContainText(
    "この端末からのご注文はまだありません。",
  );
  await page.getByRole("tab", { name: /お気に入り/ }).click();
  await expect(page.locator(".forme-empty")).toContainText(
    "お気に入りはまだありません。",
  );
});

test("検索0件: 条件に合わないとき、空の棚を見せない", async ({ page }) => {
  claims("/forme/items", "検索0件");
  await page.goto("/forme/items");

  // Narrow until nothing matches, using the real control rather than a URL.
  await page
    .getByRole("searchbox", { name: /商品を探す/ })
    .fill("存在しないZZZ");
  const empty = page.locator(".forme-empty");
  await expect(empty).toContainText("条件に合う商品がありませんでした。");

  // And the way out is on the screen, not in the back button.
  const clear = empty.getByRole("button", { name: "条件をすべて外す" });
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(page.locator(".forme-grid > li")).toHaveCount(6);
});

test("再訪: 閉じて戻っても、途中のカートは残っている", async ({ page }) => {
  claims("/kissa/menu/[productId]", "再訪");
  await page.goto("/kissa/menu/latte");
  await page.getByRole("button", { name: "カートに入れる" }).click();
  await expect(page.locator(".kissa-cart-count")).toHaveText("1");

  // A new navigation is the closest a test gets to closing the tab.
  await page.goto("about:blank");
  await page.goto("/kissa/order");
  await expect(page.locator(".kissa-lines li")).toHaveCount(1);
});

test("台帳が主張する状態の数と、N/A の理由が揃っている", () => {
  // Every N/A carries a reason; no screen is left with an empty cell.
  for (const contract of contracts.contracts)
    for (const [state, record] of Object.entries(contract.states))
      if (!record.applies)
        expect(
          record.reason?.length ?? 0,
          `${contract.template} / ${state}`,
        ).toBeGreaterThan(3);

  // And the ledger covers every template the inventory served.
  expect(contracts.counts.templates).toBe(contracts.contracts.length);
});
