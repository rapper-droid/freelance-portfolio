import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** The offer funnel never sends anything: assert no request ever leaves. */
async function forbidContactPosts(page: Page) {
  const posts: string[] = [];
  await page.route("**/api/contact", async (route) => {
    if (route.request().method() === "POST") posts.push(route.request().url());
    return route.fulfill({ json: { enabled: false } });
  });
  return posts;
}
const noOverflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  );

test("offer: menu, scope, brief and hand-off to the contact form", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const posts = await forbidContactPosts(page);
  await page.goto("/services");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "その小さな修正",
  );
  await page
    .getByRole("link", { name: "Webページの表示崩れを、1か所直す。" })
    .click();
  await expect(page).toHaveURL(/\/services\/web-fix$/);

  // What you get, what you do not, what to prepare, how it is accepted.
  await expect(
    page.getByRole("heading", { name: "頼むと、こうなる。" }),
  ).toBeVisible();
  for (const heading of [
    "お渡しするもの",
    "このメニューに含まないもの",
    "ご用意いただくもの",
    "完了の確認（検収）",
  ])
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  // The approved fixed price, tax included, next to the scope it covers.
  await expect(page.locator("main")).toContainText("5,500円（税込）");
  await expect(page.locator(".offer-terms")).toContainText("範囲を超える場合");
  // Prices the owner has not approved never appear.
  await expect(page.locator("main")).not.toContainText("22,000円");

  // The brief refuses to run on an empty required answer.
  await page.getByRole("button", { name: "この内容で相談する" }).click();
  await expect(page.locator(".offer-brief-error")).toContainText(
    "困っている表示",
  );
  await expect(page).toHaveURL(/\/services\/web-fix$/);

  await page
    .getByLabel("困っている表示", { exact: false })
    .fill("スマホで料金表が右にはみ出す");
  await page
    .getByLabel("対象ページのURL", { exact: false })
    .fill("https://example.test/price");
  await page.getByLabel("起きる端末・ブラウザ").selectOption("iPhone");
  await page.getByLabel("希望時期").selectOption("1か月以内");
  const brief = page.getByLabel("できあがった相談文", { exact: false });
  await expect(brief).toHaveValue(
    /【困っている表示】スマホで料金表が右にはみ出す/,
  );
  await expect(brief).toHaveValue(/【起きる端末・ブラウザ】iPhone/);
  await expect(brief).toHaveValue(/【希望時期】1か月以内/);
  expect(await noOverflow(page)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: "この内容で相談する" }).click();
  await expect(page).toHaveURL(/\/contact\?from=%2Fservices%2Fweb-fix$/);
  await expect(page.locator(".intake-draft")).toContainText(
    "相談メモを引き継ぎ",
  );
  await expect(page.locator(".intake-source")).toContainText(
    "表示崩れの修正 1か所",
  );
  await expect(page.getByLabel("ご相談内容", { exact: false })).toHaveValue(
    /スマホで料金表が右にはみ出す/,
  );
  await expect(
    page.getByRole("radio", { name: "改修 / レスポンシブ" }),
  ).toBeChecked();
  await expect(page.getByLabel("参考URL")).toHaveValue(
    "https://example.test/price",
  );
  expect(posts).toEqual([]);
  expect(errors).toEqual([]);
});

test("marketplace visitors are kept on the marketplace", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const posts = await forbidContactPosts(page);
  await page.goto("/works/improvement?utm_source=crowdworks");
  // The marketplace is remembered once the landing page hydrates; before that
  // the site simply behaves as it does for a direct visitor.
  await page.waitForFunction(() =>
    sessionStorage.getItem("tsudowa-platform")?.includes("crowdworks"),
  );
  await page.goto("/services/csv-routine");
  await expect(page.locator(".offer-brief-platform")).toContainText(
    "CrowdWorks",
  );
  // No "send from this site" path is offered while a marketplace is active.
  await expect(
    page.getByRole("button", { name: "この内容で相談する" }),
  ).toHaveCount(0);
  await page
    .getByLabel("いま手作業でしていること", { exact: false })
    .fill("毎週CSVの重複を消しています");
  await page.getByRole("button", { name: "相談文をコピー" }).click();
  await expect(page.locator(".offer-brief-status")).toContainText(
    "CrowdWorksのメッセージ欄",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "毎週CSVの重複を消しています",
  );
  await page.goto("/contact");
  await expect(page.locator(".intake-platform-notice")).toContainText(
    "ご契約はCrowdWorksのメッセージで進めます",
  );
  await expect(page.locator(".intake-copy")).toHaveAttribute("open", "");
  expect(posts).toEqual([]);
});

test("partner desk: conditions, brief and no fabricated capacity", async ({
  page,
}) => {
  await page.goto("/partners");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "必要な範囲だけ",
  );
  const main = page.locator("main");
  await expect(main).toContainText("再委託が認められていることを前提");
  await expect(main).toContainText("ご依頼元へ直接営業することはありません");
  await expect(main).not.toContainText("専任チーム");
  await page.getByRole("button", { name: "相談文をコピー" }).click();
  await expect(page.locator(".offer-brief-error")).toContainText("作業の範囲");
  await page
    .getByLabel("作業の範囲", { exact: false })
    .fill("Figmaデザイン1ページの実装");
  await expect(
    page.getByLabel("できあがった相談文", { exact: false }),
  ).toHaveValue(/制作パートナーとしてのご依頼/);
  expect(await noOverflow(page)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("rescue: trouble first, a suggested menu and a copyable brief", async ({
  page,
}) => {
  const posts = await forbidContactPosts(page);
  await page.goto("/rescue");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "まだ決まっていなくても",
  );
  // Not an emergency desk.
  await expect(page.locator("main")).toContainText(
    "緊急対応の窓口ではありません",
  );
  await page
    .getByLabel("いちばん困っていること")
    .selectOption("データ整理を減らしたい");
  const suggestion = page.locator(".offer-brief-suggest");
  await expect(suggestion).toContainText("CSV整形ルーチン 1本");
  await page
    .getByLabel("どんな場面で困っているか", { exact: false })
    .fill("毎週の売上CSVを手で並べ替えています");
  await expect(
    page.getByLabel("できあがった相談文", { exact: false }),
  ).toHaveValue(/【いちばん困っていること】データ整理を減らしたい/);
  // A trouble with no matching menu says so instead of guessing.
  await page
    .getByLabel("いちばん困っていること")
    .selectOption("何を頼むべきか分からない");
  await expect(suggestion).toContainText("今のメニューには当てはまらない");
  await page.getByRole("button", { name: "この内容で相談する" }).click();
  await expect(page).toHaveURL(/\/contact\?from=%2Frescue$/);
  await expect(page.getByLabel("ご相談内容", { exact: false })).toHaveValue(
    /毎週の売上CSVを手で並べ替えています/,
  );
  expect(posts).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("CSV tool: separate normalisation, change report and the routine offer", async ({
  page,
}) => {
  await page.goto("/demos/csv");
  await page.getByRole("button", { name: "サンプルを試す" }).click();
  await expect(
    page.getByLabel("全角の英数字・記号を半角にそろえる"),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "加工を実行" }).click();
  await expect(page.locator(".csv-changes")).toContainText(
    "整形で変わったセル",
  );
  await expect(page.locator(".csv-changes")).toContainText("サンプル顧客");
  const offerLink = page.getByRole("link", {
    name: /CSV整形ルーチンの範囲と進め方/,
  });
  await expect(offerLink.first()).toBeVisible();
  await page.getByRole("button", { name: "加工結果をリセット" }).click();
  await expect(page.locator(".csv-changes")).toHaveCount(0);
  await page
    .locator(".demo-outro")
    .getByRole("link", { name: /CSV整形ルーチン/ })
    .click();
  await expect(page).toHaveURL(/\/services\/csv-routine$/);
});
