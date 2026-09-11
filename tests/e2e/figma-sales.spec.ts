import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { services, selectedSlugs, caseLabels } from "../../src/lib/sales-ui";
import { projects } from "../../src/lib/portfolio";

test("sales home: eight service links, four complete cards and message-first delivery", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".site-header .brand")).toHaveText("TETSU / WORKS");
  await expect(page.locator(".trust-panel")).toContainText("READY TO SHIP");
  await expect(page.locator("[data-service]")).toHaveCount(8);
  for (const s of services)
    await expect(page.locator(`[data-service="${s.id}"]`)).toHaveAttribute(
      "href",
      `/works/${s.id}`,
    );
  expect(
    await page
      .locator("[data-project]")
      .evaluateAll((es) => es.map((e) => e.getAttribute("data-project"))),
  ).toEqual([...selectedSlugs]);
  for (const slug of selectedSlugs) {
    const card = page.locator(`[data-project="${slug}"]`);
    const project = projects.find((p) => p.slug === slug)!;
    await expect(card).toContainText(caseLabels[slug]);
    await expect(card).toContainText("SELF-INITIATED DEMO");
    await expect(card).toContainText(project.price);
    await expect(card).toContainText(project.duration);
    await expect(card.locator("[data-live-demo]")).toHaveAttribute(
      "href",
      `/demos/${slug}`,
    );
    await expect(card.locator("img")).toHaveCount(2);
  }
  await expect(page.locator("#pricing")).toContainText("5,000円〜 / 1ページ");
  await expect(page.locator("#delivery")).toContainText("ソース・画像・設定");
  await expect(page.locator(".message-offer")).toContainText(
    "Zoom / Google Meetは必須ではありません",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "ALL WORKS", exact: true }).click();
  await expect(page).toHaveURL(/\/works$/);
  await expect(page.locator("[data-project]")).toHaveCount(11);
  expect(
    await page
      .locator("[data-project]")
      .evaluateAll((es) => es.map((e) => e.getAttribute("data-project"))),
  ).toEqual(projects.map((p) => p.slug));
});

test("mobile has one hero CTA, vertical categories and full-width tap targets", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await expect(page.locator(".hero-secondary")).toBeHidden();
    await expect(page.locator(".trust-files")).toBeHidden();
    const cards = await page.locator("[data-service]").evaluateAll((es) =>
      es.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    for (let i = 0; i < cards.length; i++) {
      expect(cards[i].height).toBeGreaterThanOrEqual(78);
      expect(cards[i].width).toBeGreaterThan(280);
      expect(cards[i].x).toBe(cards[0].x);
      if (i) expect(cards[i].y).toBeGreaterThan(cards[i - 1].y);
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
        (es) =>
          es
            .map((e) => ({
              y: e.getBoundingClientRect().top,
              text: e.textContent,
            }))
            .sort((a, b) => a.y - b.y)[0],
      );
      expect(first.text).toContain("Mobile Preview");
    }
  }
});
