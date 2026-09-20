import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { categories, projects } from "../src/lib/portfolio.ts";
import { publishedOffers } from "../src/lib/offers.ts";
const origin = process.env.QA_BASE_URL || "http://localhost:3105";
const server = process.env.QA_BASE_URL
  ? null
  : spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--port", "3105"],
      { stdio: "ignore", windowsHide: true },
    );
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready) throw new Error("QA server unavailable");
  browser = await chromium.launch();
  const page = await browser.newPage();
  const routes = [
    "/",
    "/privacy",
    "/works",
    "/services",
    ...publishedOffers.map((o) => `/services/${o.slug}`),
    "/partners",
    ...categories.map((c) => `/works/${c.id}`),
    ...projects.flatMap((p) => [`/projects/${p.slug}`, `/demos/${p.slug}`]),
  ];
  const links = new Set();
  const ids = new Map();
  for (const route of routes) {
    await page.goto(origin + route);
    const data = await page.evaluate(() => ({
      links: Array.from(document.querySelectorAll("a[href]")).map(
        (a) => a.href,
      ),
      ids: Array.from(document.querySelectorAll("[id]")).map((el) => el.id),
    }));
    ids.set(route, new Set(data.ids));
    for (const link of data.links)
      if (new URL(link).origin === new URL(origin).origin) links.add(link);
  }
  const results = [];
  for (const link of links) {
    const url = new URL(link);
    const response = await page.request.get(link);
    if (!response.ok())
      throw new Error(`Broken link ${url.pathname}: ${response.status()}`);
    if (
      url.hash &&
      !ids.get(url.pathname)?.has(decodeURIComponent(url.hash.slice(1)))
    )
      throw new Error(`Broken anchor ${url.pathname}${url.hash}`);
    results.push({ path: url.pathname + url.hash, status: response.status() });
  }
  await fs.writeFile(
    "docs/link-report.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        routes: routes.length,
        links: results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS ${routes.length} routes, ${links.size} internal links including anchors`,
  );
} finally {
  await browser?.close();
  server?.kill();
}
