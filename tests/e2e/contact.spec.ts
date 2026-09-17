import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const receipt = "TSW-260917-ABCDEF0123";
async function configured(
  page: Page,
  statuses: { status: number; code: string }[] = [
    { status: 200, code: "accepted" },
  ],
) {
  const attempts: Record<string, unknown>[] = [];
  await page.route("**/api/contact", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: { enabled: true, siteKey: "test-public-widget" },
      });
    attempts.push(route.request().postDataJSON());
    const answer = statuses[Math.min(attempts.length - 1, statuses.length - 1)];
    return route.fulfill({
      status: answer.status,
      json: {
        code: answer.code,
        receipt,
        ...(answer.code === "accepted" ? { confirmation: "sent" } : {}),
      },
    });
  });
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.turnstile={render:(el,o)=>{window.testTurnstileOptions=o;o.callback('fresh-token');return 'widget';},reset:()=>window.testTurnstileOptions.callback('refreshed-token'),remove:()=>{}};",
    }),
  );
  return attempts;
}
async function fill(page: Page) {
  await page.getByLabel("お名前", { exact: false }).fill("テスト 太郎");
  await page
    .getByLabel("返信先メールアドレス", { exact: false })
    .fill("visitor@example.test");
  await page
    .getByLabel("ご相談内容", { exact: false })
    .fill("会社の紹介ページを作りたいので相談です。");
  await page.getByRole("checkbox", { name: /送信に同意/ }).check();
}
test("sales intake validates, preserves draft through reload, retries same ID, confirms both emails", async ({
  page,
}, info) => {
  const attempts = await configured(page, [
    { status: 503, code: "unavailable" },
    { status: 200, code: "accepted" },
  ]);
  await page.goto("/contact");
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.getByLabel("お名前", { exact: false })).toBeFocused();
  await expect(page.locator("#error-detail")).toContainText("10文字以上");
  await fill(page);
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.locator(".intake-error")).toContainText(
    "送信を確認できませんでした",
  );
  const id = attempts[0].id;
  await page.reload();
  await expect(page.getByLabel("ご相談内容", { exact: false })).toHaveValue(
    "会社の紹介ページを作りたいので相談です。",
  );
  await expect(page.getByLabel("お名前", { exact: false })).toHaveValue(
    "テスト 太郎",
  );
  await page.getByRole("checkbox", { name: /送信に同意/ }).check();
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.locator(".intake-success")).toContainText(receipt);
  await expect(page.locator(".intake-success")).toContainText(
    "visitor@example.test",
  );
  await expect(page.locator(".intake-success")).toBeFocused();
  await expect(page.getByRole("button", { name: "受付済み" })).toBeDisabled();
  expect(attempts).toHaveLength(2);
  expect(attempts[1].id).toBe(id);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("tsudowa-contact-draft-v2"),
    ),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem("tsudowa-contact-draft-v2")),
  ).toBeNull();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.locator("#contact").screenshot({
    path:
      "../../outputs/master-pass/contact-success-" + info.project.name + ".png",
  });
});
test("unsafe URL and invalid email are adjacent, accessible validation errors", async ({
  page,
}) => {
  const attempts = await configured(page);
  await page.goto("/contact");
  await fill(page);
  await page.locator(".intake-options summary").click();
  await page.getByLabel("参考URL", { exact: true }).fill("javascript:alert(1)");
  await page
    .getByLabel("返信先メールアドレス", { exact: false })
    .fill("not-an-email");
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.locator("#error-reference")).toContainText("https://");
  await expect(
    page.getByLabel("返信先メールアドレス", { exact: false }),
  ).toHaveAttribute("aria-invalid", "true");
  expect(attempts).toHaveLength(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("partial acceptance is honest and retry keeps the same receipt identity", async ({
  page,
}) => {
  const attempts = await configured(page, [
    { status: 503, code: "receipt_pending" },
    { status: 200, code: "accepted" },
  ]);
  await page.goto("/contact");
  await fill(page);
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.locator(".intake-error")).toContainText("ご相談は受付済み");
  await expect(page.locator(".intake-error")).toContainText(receipt);
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.locator(".intake-success")).toBeVisible();
  expect(attempts[0].id).toBe(attempts[1].id);
});
test("contact prefill follows the actual source and remains editable", async ({
  page,
}) => {
  await configured(page);
  await page.goto("/works/automation");
  await page.locator(".site-header .nav-cta").click();
  await expect(page).toHaveURL(/contact\?from=%2Fworks%2Fautomation/);
  await expect(
    page.getByRole("radio", { name: "AI / 自動化", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("radio", { name: "まだ決まっていない", exact: true })
    .check();
  await fill(page);
  await expect(
    page.getByRole("radio", { name: "まだ決まっていない", exact: true }),
  ).toBeChecked();
});
test("demo source is retained as context, with no user text in the URL", async ({
  page,
}) => {
  const attempts = await configured(page);
  await page.goto("/demos/inbox");
  await page
    .locator(".demo-mode-actions")
    .getByRole("link", { name: /相談する/ })
    .click();
  await expect(
    page.getByRole("radio", { name: "UI / 業務ツール", exact: true }),
  ).toBeChecked();
  await fill(page);
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.locator(".intake-success")).toBeVisible();
  expect(attempts[0]).toMatchObject({
    page: "/demos/inbox",
    demo: "inbox",
    category: "apps",
  });
  expect(page.url()).not.toContain("visitor");
});
test("network interruption retains input and the user can retry", async ({
  page,
}) => {
  const attempts = await configured(page);
  let first = true;
  await page.route("**/api/contact", async (route) => {
    if (route.request().method() === "POST" && first) {
      first = false;
      return route.abort();
    }
    return route.fallback();
  });
  await page.goto("/contact");
  await fill(page);
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.locator(".intake-error")).toContainText("通信が中断");
  await expect(page.getByLabel("ご相談内容", { exact: false })).not.toHaveValue(
    "",
  );
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.locator(".intake-success")).toBeVisible();
  expect(attempts).toHaveLength(1);
});
test("production headers and disabled integration stay fail closed", async ({
  request,
  page,
}) => {
  const response = await request.get("/");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect((await request.post("/api/contact", { data: {} })).status()).toBe(503);
  await page.goto("/contact");
  await expect(
    page.getByRole("button", { name: "相談を送信する" }),
  ).toBeDisabled();
  await expect(page.locator(".intake-config")).toContainText("準備中");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/privacy");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
