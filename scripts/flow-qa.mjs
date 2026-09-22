import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";

/**
 * Visual and accessibility QA for the parts of /flow that only exist after
 * someone presses a button.
 *
 * `qa:visual` loads every route and checks the page as delivered. That cannot
 * see the three result panels, the approval card or the warning list, because
 * none of them are in the document until a run completes. This script drives
 * the real interaction at four widths and checks the state that results.
 *
 * Fails loudly: any horizontal overflow, console error, serious axe violation
 * or missing panel stops the run with a non-zero exit.
 */

const origin = process.env.QA_BASE_URL || "http://localhost:3104";
const server = process.env.QA_BASE_URL
  ? null
  : spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--port", "3104"],
      { stdio: "ignore", windowsHide: true },
    );

const WIDTHS = [320, 390, 768, 1440];
// `id` names the screenshot file: the Japanese labels collapse to identical
// underscore runs, which silently overwrote one track's evidence with another's.
const TRACKS = [
  { id: "relay", label: "見積の相談が届いた", steps: 2 },
  { id: "daybook", label: "予約の相談が届いた", steps: 2 },
  { id: "report", label: "今週の売上ファイルが届いた", steps: 3 },
];

let browser;
let failures = 0;
const evidence = [];

try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready) throw new Error("Flow QA server did not start");

  await fs.mkdir("artifacts/flow-qa", { recursive: true });
  browser = await chromium.launch();

  for (const width of WIDTHS) {
    // axe-core/playwright requires a context-backed page, not browser.newPage().
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    for (const track of TRACKS) {
      await page.goto(origin + "/flow", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: new RegExp(track.label) }).click();

      for (let step = 0; step < track.steps; step++) {
        const button =
          step === 0
            ? page.getByRole("button", { name: /仕事が進むところを見る/ })
            : page.getByRole("button", { name: /^次：/ });
        await button.click();
        // The panels appear on the response, so wait for the heading itself
        // rather than a fixed delay.
        await page
          .getByRole("heading", { name: "あなたが確認すること" })
          .waitFor({ state: "visible", timeout: 20_000 });

        const state = await page.evaluate(() => ({
          overflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
          panels: document.querySelectorAll(".flow-panel").length,
          stages: document.querySelectorAll(".flow-stages li").length,
          // Nothing may claim an external effect happened in the sample.
          claimsExecuted: Array.from(
            document.querySelectorAll(".flow-stages li"),
          ).some((li) => li.textContent?.includes("実行済み")),
        }));

        const label = `${width}-${track.id}-step${step + 1}`;
        if (state.overflow) {
          console.error(`FAIL ${label}: horizontal overflow`);
          failures++;
        }
        if (state.panels !== 3) {
          console.error(
            `FAIL ${label}: expected 3 panels, saw ${state.panels}`,
          );
          failures++;
        }
        if (state.stages !== 4) {
          console.error(
            `FAIL ${label}: expected 4 stage labels, saw ${state.stages}`,
          );
          failures++;
        }
        if (state.claimsExecuted) {
          console.error(`FAIL ${label}: sample claims an external effect ran`);
          failures++;
        }
        evidence.push({ width, track: track.label, step: step + 1, ...state });

        if (width === 390 || width === 1440)
          await page.screenshot({
            path: `artifacts/flow-qa/${label}.png`,
            fullPage: true,
          });
      }

      // Accessibility on the fully populated result, not the empty page.
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      const serious = axe.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      if (serious.length) {
        for (const v of serious)
          console.error(
            `FAIL a11y ${width}px ${track.label}: ${v.id} — ${v.help} (${v.nodes.length} nodes)`,
          );
        failures += serious.length;
      }
    }

    if (errors.length) {
      console.error(`FAIL ${width}px console errors:\n${errors.join("\n")}`);
      failures += errors.length;
    }
    if (!failures)
      console.log(
        `PASS ${width}px / 3 tracks / 7 steps / no overflow, 3 panels, 4 stage labels, no a11y violation`,
      );
    await page.close();
    await context.close();
  }

  await fs.writeFile(
    "artifacts/flow-qa/report.json",
    JSON.stringify(
      { checkedAt: new Date().toISOString(), failures, evidence },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  server?.kill();
}

if (failures) {
  console.error(`\nflow QA failed with ${failures} finding(s).`);
  process.exit(1);
}
console.log("\nflow QA passed.");
