import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import { categories, projects } from "../src/lib/portfolio.ts";
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3147";
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname))
  throw Error("Local only");
const routes = [
  "/",
  "/works",
  "/privacy",
  "/contact",
  ...categories.map((c) => "/works/" + c.id),
  ...projects.flatMap((p) => [
    "/projects/" + p.slug,
    "/demos/" + p.slug,
    "/experience/" + p.slug,
  ]),
];
const out = "../../outputs/master-pass";
const browser = await chromium.launch();
const context = await browser.newContext();
await context.route("**/*", (r) =>
  new URL(r.request().url()).origin === origin &&
  ["GET", "HEAD"].includes(r.request().method())
    ? r.continue()
    : r.abort(),
);
const page = await context.newPage();
const records = [],
  links = new Set(),
  ids = new Map(),
  errors = [];
try {
  for (const route of routes) {
    const response = await page.goto(origin + route, {
      waitUntil: "networkidle",
    });
    const data = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      og: document.querySelector('meta[property="og:url"]')?.content,
      robots: document.querySelector('meta[name="robots"]')?.content,
      structured: [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].map((x) => JSON.parse(x.textContent)),
      h1: document.querySelectorAll("h1").length,
      ids: [...document.querySelectorAll("[id]")].map((x) => x.id),
      links: [...document.querySelectorAll("a[href]")].map((x) => x.href),
    }));
    ids.set(route, new Set(data.ids));
    for (const href of data.links)
      if (new URL(href).origin === origin) links.add(href);
    const canonical =
      "https://tsudowa.com" +
      (route === "/" ? "" : route.replace("/experience/", "/demos/"));
    if (
      response.status() !== 200 ||
      data.h1 !== 1 ||
      new URL(data.canonical).href !== new URL(canonical).href ||
      data.og !== canonical ||
      !data.title.includes("TSUDOWA") ||
      !data.description ||
      !data.structured.some(
        (x) => x["@type"] === "WebSite" && x.name === "TSUDOWA",
      )
    )
      errors.push({ route, reason: "metadata", data });
    if (route.startsWith("/experience/") && !data.robots?.includes("noindex"))
      errors.push({ route, reason: "standalone must be noindex" });
    records.push({
      route,
      status: response.status(),
      title: data.title,
      canonical: data.canonical,
      robots: data.robots,
      h1: data.h1,
    });
  }
  const checked = [];
  for (const href of links) {
    const u = new URL(href);
    const r = await context.request.get(href);
    if (
      !r.ok() ||
      (u.hash && !ids.get(u.pathname)?.has(decodeURIComponent(u.hash.slice(1))))
    )
      errors.push({ href, status: r.status(), reason: "link or anchor" });
    checked.push({ path: u.pathname + u.search + u.hash, status: r.status() });
  }
  const sitemap = await (
    await context.request.get(origin + "/sitemap.xml")
  ).text();
  const robots = await (
    await context.request.get(origin + "/robots.txt")
  ).text();
  for (const route of routes.filter((r) => !r.startsWith("/experience/")))
    if (!sitemap.includes("https://tsudowa.com" + (route === "/" ? "" : route)))
      errors.push({ route, reason: "sitemap missing" });
  if (
    sitemap.includes("/experience/") ||
    !robots.includes("https://tsudowa.com/sitemap.xml")
  )
    errors.push({ reason: "robots/sitemap" });
  const home = await context.request.get(origin);
  for (const name of [
    "content-security-policy",
    "x-content-type-options",
    "referrer-policy",
    "x-frame-options",
  ])
    if (!home.headers()[name]) errors.push({ reason: "missing header", name });
  const config = await (
    await context.request.get(origin + "/api/contact")
  ).json();
  if (config.enabled !== false || Object.keys(config).length !== 1)
    errors.push({ reason: "local contact not fail closed" });
  const report = {
    at: new Date().toISOString(),
    routes: records,
    links: checked,
    errors,
    contactConfig: config,
  };
  await fs.writeFile(out + "/links-seo.json", JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      { routes: records.length, links: checked.length, errors },
      null,
      2,
    ),
  );
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
