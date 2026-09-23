import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * The four showcase demos §17 names, after the work (指示書 §17, Q27–Q29).
 *
 * Each of these used to be a picture of a thing. What is tested here is the
 * part that makes it not a picture: the design exports what is on screen, the
 * comparison is fair and inspectable, the quality page separates what ran
 * from what did not, and the service page produces a real file.
 */

test.describe("STILL / STUDIO", () => {
  test("価格を変えると三つの比率すべてが変わる", async ({ page }) => {
    await page.goto("/demos/creative");
    await expect(page.locator(".creative-all img")).toHaveCount(3);

    await page.getByLabel("価格").fill("¥5,500");
    const sources = await page
      .locator(".creative-all img")
      .evaluateAll((els) =>
        els.map((el) => decodeURIComponent(el.getAttribute("src") ?? "")),
      );
    // The failure §17 names is a price current in one image and stale in
    // another. All three are rendered from one record, so neither happens.
    expect(sources.every((s) => s.includes("5,500"))).toBe(true);
    expect(sources.some((s) => s.includes("3,800"))).toBe(false);
  });

  test("書き出したファイルは画面の内容を持ち、補助線を持たない", async ({
    page,
  }) => {
    await page.goto("/demos/creative");
    await page.getByLabel("見出し").fill("SLOW DAYS.");
    await page.getByLabel("価格").fill("¥7,200");

    const wait = page.waitForEvent("download");
    await page.getByRole("button", { name: "この比率を書き出す" }).click();
    const download = await wait;
    const path = await download.path();
    const { readFileSync } = await import("node:fs");
    const svg = readFileSync(path, "utf8");

    expect(svg).toContain("¥7,200");
    expect(svg).toContain("SLOW DAYS.");
    // The safe-area guides are an editor aid and must never reach the file.
    expect(svg).not.toContain("stroke-dasharray");
  });

  test("長すぎる見出しは書き出す前に断られる", async ({ page }) => {
    await page.goto("/demos/creative");
    await page.getByLabel("見出し").fill("x".repeat(48));
    // Scoped: Next's route announcer is also role="alert".
    await expect(page.locator(".creative-problems")).toContainText("見出し");
    await expect(
      page.getByRole("button", { name: "この比率を書き出す" }),
    ).toBeDisabled();
  });
});

test.describe("REFINE", () => {
  test("Before と After は同じリンクを持ち、順番だけが違う", async ({
    page,
  }) => {
    await page.goto("/demos/improvement");
    await page.getByRole("button", { name: "並べて" }).click();
    await page.getByLabel("フォーカス順を表示").check();

    const lists = await page.locator(".refine-focus-list").allInnerTexts();
    expect(lists).toHaveLength(2);

    const names = lists.map((list) =>
      list
        .split("\n")
        .map((line) => line.replace(/^\d+\s*/, "").trim())
        .filter(Boolean)
        .sort(),
    );
    // Same destinations in both: the comparison is about order, not content.
    expect(names[0]).toEqual(names[1]);
    // And the order really does differ.
    expect(lists[0]).not.toBe(lists[1]);
  });

  test("読み順の表示は実際のDOM順を数える", async ({ page }) => {
    await page.goto("/demos/improvement");
    await page.getByLabel("読み順を表示").check();
    const markers = await page.locator(".refine-marker").allInnerTexts();
    expect(markers).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  });

  test("画面幅を切り替えられる", async ({ page }) => {
    await page.goto("/demos/improvement");
    await page.getByLabel("画面幅").selectOption("360");
    await expect(page.locator(".refine-viewport")).toHaveAttribute(
      "style",
      /360px/,
    );
  });

  test("測定していないことを、測定していないと書く", async ({ page }) => {
    await page.goto("/demos/improvement");
    const conditions = page.locator("#refine-conditions");
    await expect(conditions).toContainText("測定していないもの");
    await expect(conditions).toContainText("CVR");
    // No improvement percentage anywhere: there is no measurement behind one.
    await expect(page.locator("body")).not.toContainText(
      /\d+% *(改善|向上|増)/,
    );
  });
});

test.describe("SHIP / CHECK", () => {
  test("保存済みの記録であることと、再現手順を書く", async ({ page }) => {
    await page.goto("/demos/qa");
    await expect(page.locator(".qa-evidence-saved")).toContainText(
      "保存済みの記録",
    );
    const rows = page.locator(".qa-evidence-table tbody tr");
    expect(await rows.count()).toBeGreaterThan(4);

    // Every row carries the command that reproduces it.
    const commands = await rows
      .locator('td[data-label="再現手順"]')
      .allInnerTexts();
    expect(commands.every((c) => c.trim().length > 1)).toBe(true);
  });

  test("未実施は失敗ではなく、PASS にも数えない", async ({ page }) => {
    await page.goto("/demos/qa");
    const notRun = page.locator('.qa-evidence-table tr[data-status="not_run"]');
    expect(await notRun.count()).toBeGreaterThan(0);
    await expect(notRun.first()).toContainText("未実施");
    await expect(page.locator(".qa-evidence-note")).toContainText(
      "PASS\n        には数えていません",
    );
  });

  test("チェックを入れても自動検査の結果は動かない", async ({ page }) => {
    await page.goto("/demos/qa");
    const before = await page.locator(".qa-evidence-table").innerText();
    await page.locator(".qa-checklist input").first().check();
    const after = await page.locator(".qa-evidence-table").innerText();
    expect(after).toBe(before);
  });
});

test.describe("FLOWSTATE", () => {
  test("実際に開けるファイルを書き出す", async ({ page }) => {
    await page.goto("/demos/saas");
    const wait = page.waitForEvent("download");
    await page.getByRole("button", { name: "今週のまとめを書き出す" }).click();
    const download = await wait;
    expect(download.suggestedFilename()).toBe("flowstate-weekly-sample.md");

    const { readFileSync } = await import("node:fs");
    const markdown = readFileSync(await download.path(), "utf8");
    expect(markdown.startsWith("# ")).toBe(true);
    expect(markdown).toContain("T-101");
    expect(markdown).toContain("架空SaaSのデモ");
  });

  test("つないでいないものを、つないでいないと書く", async ({ page }) => {
    await page.goto("/demos/saas");
    const scope = page.locator("#folio-scope");
    await expect(scope).toBeVisible();
    await expect(scope.locator('tr[data-connected="false"]')).not.toHaveCount(
      0,
    );
    await expect(scope).toContainText("未接続");
  });

  test("架空の料金だと、料金のとなりに書く", async ({ page }) => {
    await page.goto("/demos/saas");
    await expect(page.locator(".flowstate-price-warning")).toContainText(
      "架空の想定価格",
    );
    await expect(page.locator(".flowstate-price-warning")).toContainText(
      "登録・課金・契約はできません",
    );
  });

  test("実際に操作できる画面へ行ける", async ({ page }) => {
    await page.goto("/demos/saas");
    await page.locator(".flowstate-real").getByRole("link").first().click();
    await expect(page).toHaveURL(/\/demos\/automation$/);
  });
});

test("四つのデモにアクセシビリティ違反がない", async ({ page }) => {
  for (const route of [
    "/demos/creative",
    "/demos/improvement",
    "/demos/qa",
    "/demos/saas",
  ]) {
    await page.goto(route);
    const violations = (await new AxeBuilder({ page }).analyze()).violations;
    expect(
      violations.map((v) => `${route} ${v.id}`),
      JSON.stringify(violations.map((v) => v.id)),
    ).toEqual([]);
  }
});
