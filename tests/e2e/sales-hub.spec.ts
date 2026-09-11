import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { categories, projects, projectsFor } from "../../src/lib/portfolio";
test("all category routes: exact project membership, sales information and metadata", async ({
  page,
}) => {
  test.setTimeout(180000);
  for (const c of categories) {
    const response = await page.goto(`/works/${c.id}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(c.name);
    expect(
      await page
        .locator("[data-project]")
        .evaluateAll((els) => els.map((e) => e.getAttribute("data-project"))),
    ).toEqual(projectsFor(c.id).map((p) => p.slug));
    await expect(page.locator("#delivery")).toContainText("納品可能物");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/works/${c.id}$`),
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      new RegExp(c.name.split(" /")[0]),
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("all project routes: honest case studies, live demos, previews and accessibility", async ({
  page,
}) => {
  test.setTimeout(180000);
  for (const p of projects) {
    const response = await page.goto(`/projects/${p.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toContainText("自主制作");
    await expect(page.locator("#delivery")).toContainText(p.price);
    await expect(page.locator("#delivery")).toContainText("QA内容");
    await expect(page.locator(".device-grid img")).toHaveCount(3);
    await expect(page.locator("[data-live-demo]")).toHaveAttribute(
      "href",
      `/demos/${p.slug}`,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/projects/${p.slug}$`),
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});
test("home filtering exposes only matching projects and a category permalink", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "LP制作", exact: true }).click();
  await expect(page.locator("[data-project]")).toHaveCount(
    projectsFor("lp").length,
  );
  await page.getByRole("link", { name: "この仕事の料金・納品物" }).click();
  await expect(page).toHaveURL(/works\/lp/);
  await page.goto("/");
  await page.getByRole("button", { name: "AI業務自動化", exact: true }).click();
  expect(
    await page
      .locator("[data-project]")
      .evaluateAll((es) => es.map((e) => e.getAttribute("data-project"))),
  ).toEqual(projectsFor("automation").map((p) => p.slug));
});
test("cafe menu and SaaS pricing are interactive", async ({ page }) => {
  await page.goto("/demos/cafe");
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await expect(page.locator(".menu-items")).toContainText("季節のタルト");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/demos/saas");
  await page.getByRole("button", { name: "年額", exact: true }).click();
  await expect(page.locator(".recommended")).toContainText("¥980");
  await expect(page.locator(".recommended")).toContainText("¥11,760");
  await page
    .getByText("これは利用できるサービスですか？", { exact: true })
    .click();
  await expect(page.locator("details[open]")).toContainText(
    "登録・課金はありません",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("EC color, quantity, cart and keyboard cancellation", async ({ page }) => {
  await page.goto("/demos/ec");
  await page.getByRole("button", { name: "サンド", exact: true }).click();
  await page.getByLabel("数量").selectOption("3");
  await page.getByRole("button", { name: "デモカートに追加" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("サンド");
  await expect(dialog).toContainText("¥11,400");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "デモカートに追加" }),
  ).toBeFocused();
  await page.getByRole("button", { name: /カート \(3\)/ }).click();
  await page.getByRole("button", { name: "商品を削除" }).click();
  await expect(dialog).toContainText("カートは空です");
});
test("automation requires a fresh review after editing and never sends", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost")) external.push(r.url());
  });
  await page.goto("/demos/automation");
  await page.getByRole("button", { name: "分類・下書きを実行" }).click();
  await expect(page.locator(".relay-result")).toContainText("不具合");
  await expect(page.locator(".relay-result")).toContainText("高");
  await page.getByRole("button", { name: "内容を確認済みにする" }).click();
  await expect(page.getByRole("status")).toContainText(
    "メールは送信されません",
  );
  await page.getByLabel("返信下書き", { exact: true }).fill("再確認する返信案");
  await expect(
    page.getByRole("button", { name: "内容を確認済みにする" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "差し戻す" }).click();
  await expect(page.getByRole("status")).toContainText("差し戻し");
  expect(external).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("booking validates collisions, creates, filters, cancels and resets on reload", async ({
  page,
}) => {
  await page.goto("/demos/booking");
  await page.getByRole("button", { name: "予約を追加" }).click();
  await page.getByLabel("予約名", { exact: true }).fill("テスト予約");
  await page.getByRole("button", { name: "予約を保存" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "予約があります",
  );
  await page.getByLabel("開始時間").selectOption("12:00");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "予約を保存" }).click();
  await page.getByLabel("予約名で検索").fill("テスト予約");
  await expect(page.locator(".booking-list article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "テスト予約の予約を取り消す" })
    .click();
  await page.getByRole("button", { name: "戻る", exact: true }).click();
  await expect(page.locator(".booking-list article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "テスト予約の予約を取り消す" })
    .click();
  await page.getByRole("button", { name: "取消を確定" }).click();
  await expect(page.locator(".booking-list")).toContainText(
    "該当する予約はありません",
  );
  await page.reload();
  await expect(page.locator(".booking-list article")).toHaveCount(2);
});
test("improvement and creative export", async ({ page }) => {
  await page.goto("/demos/improvement");
  await page.getByRole("button", { name: "Before", exact: true }).click();
  await expect(page.locator(".comparison-site")).toHaveClass(/is-before/);
  await page.getByRole("button", { name: "After", exact: true }).click();
  await expect(page.locator(".comparison-site")).toHaveClass(/is-after/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/demos/creative");
  await page.getByRole("button", { name: /SLOW DAYS/ }).click();
  await page.getByLabel("フォーマット").selectOption("portrait");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVGをダウンロード" }).click();
  expect((await dl).suggestedFilename()).toBe("still-2-portrait.svg");
  await expect(page.locator(".creative-preview img")).toHaveAttribute(
    "height",
    "1920",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("QA checklist gates delivery output", async ({ page }) => {
  await page.goto("/demos/qa");
  const output = page.getByRole("button", { name: "納品マニフェストを出力" });
  await expect(output).toBeDisabled();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await expect(output).toBeEnabled();
  const dl = page.waitForEvent("download");
  await output.click();
  expect((await dl).suggestedFilename()).toBe("delivery-manifest-demo.json");
  await page.getByRole("button", { name: "チェックをリセット" }).click();
  await expect(output).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("invalid routes, sitemap, reduced motion and disabled analytics", async ({
  page,
  request,
}) => {
  for (const route of ["/works/missing", "/projects/missing", "/demos/missing"])
    expect((await page.goto(route))?.status()).toBe(404);
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const p of projects) expect(xml).toContain(`/projects/${p.slug}`);
  for (const c of categories) expect(xml).toContain(`/works/${c.id}`);
  expect(
    (
      await request.post("/api/analytics", {
        data: { event: "portfolio_project_open" },
      })
    ).status(),
  ).toBe(204);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page
      .locator(".project-card")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await expect(page.locator('a[href^="mailto:"],a[href^="tel:"]')).toHaveCount(
    0,
  );
});
