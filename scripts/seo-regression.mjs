import { spawn } from "node:child_process";
import { categories, projects } from "../src/lib/portfolio.ts";

const localOrigin = process.env.QA_BASE_URL || "http://localhost:3106";
const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://tsudowa.com";
const server = process.env.QA_BASE_URL
  ? null
  : spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--port", "3106"],
      { stdio: "ignore", windowsHide: true },
    );

const routes = [
  "/",
  "/privacy",
  "/works",
  ...categories.map((category) => `/works/${category.id}`),
  ...projects.flatMap((project) => [
    `/projects/${project.slug}`,
    `/demos/${project.slug}`,
  ]),
];

function publicUrl(route) {
  return route === "/"
    ? new URL(publicOrigin).origin
    : new URL(route, publicOrigin).href;
}

function attribute(html, relation, name) {
  const tag = html.match(
    new RegExp(
      `<(?:link|meta)[^>]+(?:rel|property)=["']${relation}["'][^>]*>`,
      "i",
    ),
  )?.[0];
  if (!tag) return "";
  return tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1] ?? "";
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      if ((await fetch(localOrigin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error("SEO regression server did not start");

  for (const route of routes) {
    const response = await fetch(new URL(route, localOrigin));
    if (response.status !== 200)
      throw new Error(`${route}: expected 200, received ${response.status}`);
    const html = await response.text();
    if (/TANEBI WORKS|tanebi\.jp|tanebi-mark/i.test(html))
      throw new Error(`${route}: legacy public brand leaked into HTML`);
    if (!/<title>[^<]*TSUDOWA[^<]*<\/title>/i.test(html))
      throw new Error(`${route}: title does not identify TSUDOWA`);
    const canonical = attribute(html, "canonical", "href");
    const expectedCanonical = publicUrl(route);
    if (canonical !== expectedCanonical)
      throw new Error(
        `${route}: canonical ${canonical || "missing"} != ${expectedCanonical}`,
      );
    if (attribute(html, "og:url", "content") !== expectedCanonical)
      throw new Error(`${route}: og:url does not match canonical`);
  }

  const home = await (await fetch(localOrigin)).text();
  const jsonLd = home.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i,
  )?.[1];
  if (!jsonLd) throw new Error("Home WebSite JSON-LD is missing");
  const structuredData = JSON.parse(jsonLd);
  if (
    structuredData["@type"] !== "WebSite" ||
    structuredData.name !== "TSUDOWA" ||
    structuredData.alternateName !== "ツドワ" ||
    structuredData.url !== publicOrigin
  )
    throw new Error("Home WebSite JSON-LD does not match TSUDOWA");

  const robots = await (await fetch(`${localOrigin}/robots.txt`)).text();
  if (!robots.includes(`${publicOrigin}/sitemap.xml`))
    throw new Error("robots.txt sitemap does not use the public origin");
  const sitemap = await (await fetch(`${localOrigin}/sitemap.xml`)).text();
  for (const route of routes)
    if (!sitemap.includes(publicUrl(route)))
      throw new Error(`sitemap.xml is missing ${route}`);

  const manifestResponse = await fetch(`${localOrigin}/site.webmanifest`);
  const manifest = await manifestResponse.json();
  if (manifest.name !== "TSUDOWA" || manifest.short_name !== "TSUDOWA")
    throw new Error("Web manifest does not match TSUDOWA");
  for (const asset of [
    "/og.png",
    "/icon.png",
    "/apple-icon.png",
    "/brand/tsudowa-mark.svg",
  ])
    if (!(await fetch(`${localOrigin}${asset}`)).ok)
      throw new Error(`Brand asset unavailable: ${asset}`);

  console.log(
    `PASS ${routes.length} routes: TSUDOWA title/canonical/OG, WebSite JSON-LD, robots, sitemap, manifest and brand assets`,
  );
} finally {
  server?.kill();
}
