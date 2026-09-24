import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { liveRoutes } from "../../src/lib/working-versions";

/**
 * P4: the catalogue has to lead to the things you can actually operate.
 *
 * KISSA, FORME and now REPORT FLOW were reachable only from their own demo
 * pages, which a visitor reaches after /works, /works/<category> and
 * /projects/<slug>. Every one of those is a place where the strongest thing on
 * the site was invisible.
 */

const OPERABLE = Object.keys(liveRoutes).sort(); // automation, booking, cafe, csv, ec

test("/works names the operable shops and every card that has one offers it", async ({
  page,
}) => {
  await page.goto("/works");

  // Two paragraphs now: the fictional shops, and the tool that takes the
  // visitor's own file. They make different promises, so they are separate.
  const shops = page.locator(".works-operable").first();
  await expect(shops).toContainText("実際の注文・予約・支払いは発生しません");
  await expect(shops.locator("a")).toHaveCount(2);
  await expect(shops.locator('a[href="/kissa"]')).toBeVisible();
  await expect(shops.locator('a[href="/forme"]')).toBeVisible();

  const tool = page.locator(".works-operable").last();
  await expect(tool.locator('a[href="/report"]')).toBeVisible();
  await expect(tool).toContainText("この端末から出ません");

  const working = page.locator("[data-working-version]");
  await expect(working).toHaveCount(OPERABLE.length);
  expect(
    (
      await working.evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-working-version")),
      )
    ).sort(),
  ).toEqual(OPERABLE);

  for (const slug of OPERABLE) {
    const card = page.locator(`[data-project="${slug}"]`);
    // The card keeps everything it had: the demo, the case study and the price.
    await expect(card.locator("[data-live-demo]")).toHaveAttribute(
      "href",
      `/demos/${slug}`,
    );
    await expect(card.locator("[data-working-version]")).toHaveAttribute(
      "href",
      liveRoutes[slug].routes[0].href,
    );
  }

  // The third action must not push the row out of the card at any width.
  for (const slug of OPERABLE) {
    const overflow = await page
      .locator(`[data-project="${slug}"] .project-actions`)
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow, slug).toBeLessThanOrEqual(1);
  }

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("the card's working link reaches something that actually works", async ({
  page,
}) => {
  await page.goto("/works");
  await page.locator('[data-working-version="cafe"]').click();
  await expect(page).toHaveURL(/\/kissa$/);
  // Hydrated and operable, not a picture: the cart announces its own count.
  await expect(page.locator(".kissa-cart-link .sr-only")).toContainText(
    "カートに",
  );

  await page.goto("/works");
  await page.locator('[data-working-version="ec"]').click();
  await expect(page).toHaveURL(/\/forme$/);
  await expect(page.locator("main")).toContainText("架空");

  // REPORT FLOW is a tool, not a fictional shop: it opens ready for a file.
  await page.goto("/works");
  await page.locator('[data-working-version="csv"]').click();
  await expect(page).toHaveURL(/\/report$/);
  await expect(page.locator(".report-sources")).toBeVisible();
});

test("a category page carrying an operable demo offers it too", async ({
  page,
}) => {
  // /works/ec lists FORME; /works/web lists KISSA.
  await page.goto("/works/ec");
  await expect(page.locator('[data-working-version="ec"]')).toHaveAttribute(
    "href",
    "/forme",
  );
  await page.goto("/works/web");
  await expect(page.locator('[data-working-version="cafe"]')).toHaveAttribute(
    "href",
    "/kissa",
  );
});

test("the case study sends a visitor to the working version, and only where one exists", async ({
  page,
}) => {
  for (const slug of OPERABLE) {
    await page.goto(`/projects/${slug}`);
    const panel = page.locator(".demo-live");
    await expect(panel).toBeVisible();
    await expect(panel.locator("a")).toHaveCount(
      liveRoutes[slug].routes.length,
    );
    for (const route of liveRoutes[slug].routes)
      await expect(panel.locator(`a[href="${route.href}"]`)).toBeVisible();
    // The panel must not run off the page on a phone.
    const overflow = await panel.evaluate(
      (el) => el.scrollWidth - el.clientWidth,
    );
    expect(overflow, slug).toBeLessThanOrEqual(1);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }

  // Demos with nothing behind them must not grow a panel that leads nowhere.
  // DAYBOOK left this list when it got /daybook — which is what the check is
  // for: the panel follows the registry, not a hand-kept list of slugs.
  for (const slug of ["inbox", "admin"]) {
    await page.goto(`/projects/${slug}`);
    await expect(page.locator(".demo-live")).toHaveCount(0);
  }
});

test("every working route the site advertises is reachable", async ({
  request,
}) => {
  for (const live of Object.values(liveRoutes))
    for (const route of live.routes)
      expect((await request.get(route.href)).status(), route.href).toBe(200);
});
