import { test, expect } from "@playwright/test";
import { projects } from "../../src/lib/portfolio";
test("all eleven standalone experiences preserve demo identity without portfolio chrome", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const p of projects) {
    await page.goto("/demos/" + p.slug);
    const full = page.getByRole("link", {
      name: "OPEN FULL DEMO ↗",
      exact: true,
    });
    await expect(full).toHaveAttribute("href", "/experience/" + p.slug);
    await full.click();
    await expect(page).toHaveURL(new RegExp("/experience/" + p.slug + "$"));
    await expect(
      page.locator(
        ".site-header,.site-footer,.demo-notice-bar,.demo-bottom,.showcase-limit",
      ),
    ).toHaveCount(0);
    await expect(page.locator("h1")).toHaveText(p.title);
    await expect(page.locator(".demo-data-disclosure summary")).toContainText(
      "DEMO DATA",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp("/demos/" + p.slug + "$"),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("standalone support and calendar remain operable", async ({ page }) => {
  await page.goto("/experience/inbox");
  await page.getByLabel("対応状況", { exact: true }).selectOption("完了");
  await expect(
    page.getByRole("meter", { name: "完了した対応の割合" }),
  ).toHaveAttribute("value", "2");
  await page.goto("/experience/booking");
  await page.getByRole("button", { name: "9月24日を表示" }).click();
  await expect(
    page.getByRole("combobox", { name: "表示日", exact: true }),
  ).toHaveValue("2026-09-24");
});
