import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { services, selectedSlugs, caseLabels } from "../../src/lib/sales-ui";
import { projects } from "../../src/lib/portfolio";

test("TETSU WORKS preserves services, complete catalogue, prices and message-first delivery", async ({
  page,
}) => {
  await page.goto("/works");
  const structuredData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(structuredData).toMatchObject({
    "@type": "WebSite",
    name: "TSUDOWA",
    alternateName: "ツドワ",
  });
  await expect(page.locator(".site-header .brand")).toContainText("TSUDOWA");
  await expect(page.locator(".works-byline")).toContainText(
    "TETSU WORKS / CLIENT SERVICES BY TSUDOWA",
  );
  await expect(page.locator("[data-service]")).toHaveCount(8);
  for (const service of services)
    await expect(
      page.locator(`[data-service="${service.id}"]`),
    ).toHaveAttribute("href", `/works/${service.id}`);
  expect(
    await page
      .locator("[data-project]")
      .evaluateAll((es) => es.map((e) => e.getAttribute("data-project"))),
  ).toEqual(projects.map((p) => p.slug));
  for (const project of projects) {
    const card = page.locator(`[data-project="${project.slug}"]`);
    await expect(card).toContainText("SELF-INITIATED DEMO");
    await expect(card).toContainText(project.price);
    await expect(card).toContainText(project.duration);
    await expect(card.locator("[data-live-demo]")).toHaveAttribute(
      "href",
      `/demos/${project.slug}`,
    );
    await expect(card.locator("img")).toHaveCount(2);
  }
  await expect(page.locator("#pricing")).toContainText("5,000円〜 / 1ページ");
  await expect(page.locator("#delivery")).toContainText("ソース・画像・設定");
  await expect(page.locator(".message-offer")).toContainText(
    "Zoom / Google Meetは必須ではありません",
  );
  await expect(page.locator("#process")).toBeAttached();
  await expect(page.locator("#faq details")).toHaveCount(10);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("mobile keeps vertical sales categories, full-width targets and complete case studies", async ({
  page,
}, testInfo) => {
  await page.goto("/works");
  if (testInfo.project.name === "mobile") {
    const cards = await page.locator("[data-service]").evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }),
    );
    for (let index = 0; index < cards.length; index++) {
      expect(cards[index].height).toBeGreaterThanOrEqual(78);
      expect(cards[index].width).toBeGreaterThan(280);
      expect(cards[index].x).toBe(cards[0].x);
      if (index) expect(cards[index].y).toBeGreaterThan(cards[index - 1].y);
    }
  }
  for (const slug of selectedSlugs) {
    await page.goto(`/projects/${slug}`);
    await expect(page.locator("h1")).toContainText(caseLabels[slug]);
    await expect(page.locator(".case-facts")).toContainText("参考価格");
    await expect(page.locator(".case-main-visual img")).toBeVisible();
    await expect(page.locator(".message-offer")).toContainText(
      "MESSAGE-ONLY OK",
    );
    if (testInfo.project.name === "mobile") {
      const first = await page.locator(".device-grid figure").evaluateAll(
        (elements) =>
          elements
            .map((element) => ({
              y: element.getBoundingClientRect().top,
              text: element.textContent,
            }))
            .sort((a, b) => a.y - b.y)[0],
      );
      expect(first.text).toContain("Mobile Preview");
    }
  }
});
