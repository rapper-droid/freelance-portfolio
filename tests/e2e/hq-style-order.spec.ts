import { expect, test } from "@playwright/test";
import { projects } from "../../src/lib/portfolio";

test("all eight showcase demos retain 44px context links and original launch spacing", async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const project of projects.filter((entry) => entry.featured)) {
    await page.goto("/demos/" + project.slug);
    const contextLink = page.locator(".demo-notice-bar > a");
    await expect(contextLink).toBeVisible();
    expect(
      (await contextLink.boundingBox())!.height,
      project.slug + " context link",
    ).toBeGreaterThanOrEqual(44);
    await expect(page.locator(".demo-mode-actions")).toHaveCSS(
      "margin-top",
      "14px",
    );
    for (const link of await page.locator(".demo-mode-actions > a").all()) {
      expect(
        (await link.boundingBox())!.height,
        project.slug + " launch link",
      ).toBeGreaterThanOrEqual(44);
    }
  }
});
