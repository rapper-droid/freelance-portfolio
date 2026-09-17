import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("HQ explains the parent, exposes both worlds and curates honest work without a sales LP", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("GATHER.BUILD.EXPAND.");
  await expect(page.locator(".hq-hero-jp")).toHaveText(
    "集まり、つくり、次へ広がる。",
  );
  await expect(page.locator(".hq-hero-actions a")).toHaveCount(2);
  await expect(page.locator(".hq-hero-actions a").first()).toHaveAttribute(
    "href",
    "/works",
  );
  await expect(page.locator(".hq-hero-actions a").last()).toHaveAttribute(
    "href",
    "/lab",
  );
  await expect(page.locator(".hq-world")).toHaveCount(2);
  await expect(page.locator("#brands")).not.toContainText("NEXT VENTURES");
  await expect(page.locator("[data-hq-project]")).toHaveCount(3);
  await expect(page.locator("[data-hq-project]")).toContainText([
    "自主制作",
    "自主制作",
    "自主制作",
  ]);
  await expect(page.locator("#pricing, #services, .intake-form")).toHaveCount(
    0,
  );
  await expect(page.locator("#contact a").first()).toHaveAttribute(
    "href",
    "/contact?from=%2Fworks",
  );
  await expect(page.locator("#contact a").nth(1)).toHaveAttribute(
    "href",
    "/contact/general",
  );
  await expect(page.locator(".hq-log-foot")).toContainText("手動更新");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("mobile native menu supports keyboard, close-on-navigation and generous touch targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.locator(".hq-mobile-menu");
  const summary = menu.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("open", "");
  for (const a of await menu.locator("a").all())
    expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open");
  await expect(summary).toBeFocused();
  await summary.click();
  await menu.getByRole("link", { name: /LAB 別の世界/ }).click();
  await expect(page).toHaveURL(/\/lab$/);
  await expect(menu).not.toHaveAttribute("open");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("LAB is an honest independent gateway and build records have real, stable detail destinations", async ({
  page,
}) => {
  await page.goto("/lab");
  await expect(page.locator("h1")).toContainText("TSUKUTTA");
  await expect(page.locator("main")).toContainText("開発");
  await expect(page.locator('a[href^="https://tsukuttalab"]')).toHaveCount(0);
  await expect(page.locator(".hq-lab-window")).toContainText("CONCEPT");
  await page.goto("/history");
  await expect(page.locator(".hq-history-entry")).toHaveCount(3);
  for (const entry of await page.locator(".hq-history-entry").all()) {
    await expect(entry.locator("time")).toHaveAttribute(
      "datetime",
      "2026-09-17",
    );
    await expect(entry.locator("a")).toHaveAttribute("href", /^\//);
  }
  await page.goto("/#activity");
  await page.locator(".hq-log-row").first().click();
  await expect(page).toHaveURL(/\/history#independent-demos$/);
  await expect(page.locator("#independent-demos")).toBeInViewport();
});

test("client navigation keeps HQ typography intact after loading portfolio CSS", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const style = () =>
    page.locator("h1").evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        color: s.color,
      };
    });
  const before = await style();
  await page.locator(".hq-hero-actions a").first().click();
  await expect(page).toHaveURL(/\/works$/);
  await expect(page.locator("#pricing")).toBeAttached();
  await page.locator(".site-header .brand").click();
  await expect(page).toHaveURL(/\/$/);
  expect(await style()).toEqual(before);
  await expect(page.locator(".hq-world")).toHaveCount(2);
});

test("arrival is decoration, runs once per tab and stops with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".hq-hero-copy h1")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("tsudowa-hq-arrival-v1")),
    )
    .toBe("seen");
  await expect(page.locator(".hq-assembly")).not.toHaveAttribute(
    "data-arrival",
    { timeout: 4000 },
  );
  await page.reload();
  await expect(page.locator(".hq-assembly")).not.toHaveAttribute(
    "data-arrival",
  );
  await page.evaluate(() => sessionStorage.removeItem("tsudowa-hq-arrival-v1"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".hq-assembly")).not.toHaveAttribute(
    "data-arrival",
  );
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    ),
  ).toBe(0);
});

test("HQ identity and destinations remain available without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(baseURL + "/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".hq-hero-actions a").first()).toBeVisible();
  await page.locator(".hq-mobile-menu summary").click();
  await page
    .locator(".hq-mobile-menu")
    .getByRole("link", { name: /LAB 別の世界/ })
    .click();
  await expect(page).toHaveURL(/\/lab$/);
  await expect(page.locator(".hq-lab-window")).toBeVisible();
  await context.close();
});

test("HQ preview keeps its natural aspect ratio after route-scoped resets", async ({
  page,
}) => {
  await page.goto("/");
  const image = page.locator(".hq-works-window img");
  await image.scrollIntoViewIfNeeded();
  const dimensions = await image.evaluate(async (el: HTMLImageElement) => {
    await el.decode();
    return {
      width: el.clientWidth,
      height: el.clientHeight,
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
    };
  });
  expect(dimensions.naturalWidth).toBeGreaterThan(0);
  expect(dimensions.width / dimensions.height).toBeCloseTo(
    dimensions.naturalWidth / dimensions.naturalHeight,
    1,
  );
});
