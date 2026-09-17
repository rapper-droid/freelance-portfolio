import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("FAQ opens and closes with keyboard, exposes answers and retains visible focus", async ({
  page,
}) => {
  await page.goto("/works#faq");
  const entries = page.locator("#faq details");
  await expect(entries).toHaveCount(10);
  await entries.first().locator("summary").focus();
  for (const entry of await entries.all()) {
    const summary = entry.locator("summary");
    await expect(summary).toBeFocused();
    expect(
      await summary.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(entry).toHaveAttribute("open", "");
    await expect(entry.locator("p")).toBeVisible();
    await page.keyboard.press("Space");
    await expect(entry).not.toHaveAttribute("open");
    await expect(entry.locator("p")).toBeHidden();
    await page.keyboard.press("Tab");
  }
  for (const summary of await page.locator("#faq summary").all())
    await summary.click();
  expect(
    (await new AxeBuilder({ page }).include("#faq").analyze()).violations,
  ).toEqual([]);
  await page.locator(".footer-cta").click();
  await expect(page).toHaveURL(/\/contact/);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("TSUDOWA brand assets, responsive composition and reduced motion remain consistent", async ({
  page,
  request,
}) => {
  const mark = await request.get("/brand/tsudowa-mark.svg");
  expect(mark.ok()).toBe(true);
  expect(await mark.text()).toContain("TSUDOWA");
  expect((await request.get("/icon.png")).ok()).toBe(true);
  expect((await request.get("/site.webmanifest")).ok()).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator(".hq-header .brand-mark")).toBeVisible();
    await expect(page.locator(".hq-header .hq-logo")).toContainText("TSUDOWA");
    await page.evaluate(() =>
      document.querySelectorAll<HTMLElement>(".home-ui > *").forEach((el) => {
        el.style.contentVisibility = "visible";
      }),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator("h1 > span")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
    for (const element of await page
      .locator(
        ".hq-header a:visible, .hq-mobile-menu summary:visible, .hq-footer-bottom a",
      )
      .all())
      expect((await element.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});
