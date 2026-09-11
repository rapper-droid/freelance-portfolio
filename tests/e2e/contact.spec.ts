import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("direct contact validates, retains drafts on failure, retries idempotently and prevents repeat success", async ({
  page,
}, testInfo) => {
  await page.route("**/api/contact", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: { enabled: true, siteKey: "test-public-widget" },
      });
    const data = route.request().postDataJSON();
    attempts.push(data);
    await route.fulfill({
      status: attempts.length === 1 ? 503 : 200,
      json: { code: attempts.length === 1 ? "unavailable" : "accepted" },
    });
  });
  const attempts: Record<string, unknown>[] = [];
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile={render:(el,o)=>{window.testTurnstileOptions=o;o.callback('fresh-token');return 'widget';},reset:()=>window.testTurnstileOptions.callback('refreshed-token'),remove:()=>{}};`,
    }),
  );
  await page.goto("/#contact");
  await page.getByRole("button", { name: "メールで相談する" }).click();
  await page.getByLabel("返信先メールアドレス").fill("visitor@example.test");
  await page.getByRole("checkbox", { name: /送信に同意/ }).check();
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(
    page.locator(".direct-contact").getByRole("alert"),
  ).toContainText("10文字以上");
  await page
    .getByLabel("困っていること")
    .fill("会社の紹介ページを作りたいので相談です。");
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(
    page.locator(".direct-contact").getByRole("alert"),
  ).toContainText("送信を確認できませんでした");
  await expect(page.getByLabel("困っていること")).toHaveValue(
    "会社の紹介ページを作りたいので相談です。",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (testInfo.project.name === "mobile") {
    const size = page.viewportSize()!;
    await page.setViewportSize({ width: 320, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".contact-form")
      .screenshot({ path: "docs/screenshots/contact-send-320.png" });
    await page.setViewportSize(size);
  }
  await page.locator(".contact-form").screenshot({
    path: `docs/screenshots/contact-send-${testInfo.project.name}.png`,
  });
  await page.getByRole("button", { name: "相談を送信する" }).click();
  await expect(page.getByRole("button", { name: "受付済み" })).toBeDisabled();
  expect(attempts).toHaveLength(2);
  expect(attempts[0].id).toBe(attempts[1].id);
  expect(attempts[0].token).not.toBe(attempts[1].token);
});
test("production headers, privacy and unavailable API are honest", async ({
  request,
  page,
}) => {
  const response = await request.get("/");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect((await request.post("/api/contact", { data: {} })).status()).toBe(503);
  await page.goto("/privacy");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
