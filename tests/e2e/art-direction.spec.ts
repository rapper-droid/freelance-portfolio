import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("FAQ opens and closes with keyboard, exposes answers and retains visible focus", async ({
  page,
}) => {
  await page.goto("/#faq");
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
  await expect(page.locator("#contact")).toBeInViewport();
});

test("brand asset, responsive composition and reduced motion remain consistent", async ({
  page,
  request,
}) => {
  expect(await (await request.get("/icon.svg")).text()).toBe(
    await (await request.get("/brand/tw-mark.svg")).text(),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator(".site-header .brand-mark")).toBeVisible();
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
    for (const el of await page
      .locator(".site-header a:visible, #faq summary, .footer-bottom a")
      .all()) {
      expect((await el.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  }
});
