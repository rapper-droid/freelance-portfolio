import { chromium } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs/promises";
import { categories, projects } from "../src/lib/portfolio.ts";

const phase = process.argv[2] || "after";
if (!["before", "after"].includes(phase))
  throw new Error("Expected before or after");
const origin = process.env.QA_BASE_URL || "http://127.0.0.1:3137";
const folder = `docs/screenshots/premium/${phase}`;
const routes = [
  "/",
  "/works",
  "/privacy",
  ...categories.map((c) => `/works/${c.id}`),
  ...projects.map((p) => `/projects/${p.slug}`),
  ...projects.map((p) => `/demos/${p.slug}`),
];
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch();
const report = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      reducedMotion: "reduce",
    });
    const tiles = [];
    for (const [index, route] of routes.entries()) {
      const errors = [];
      const onError = (error) => errors.push(error.message);
      page.on("pageerror", onError);
      const response = await page.goto(origin + route, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => document.fonts.ready);
      await page.locator("main").waitFor();
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        title: document.title,
      }));
      const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      const file = `${folder}/${slug}-${width}.png`;
      await page.screenshot({ path: file });
      if (
        [
          "/",
          "/works",
          "/works/web",
          "/works/automation",
          "/demos/cafe",
          "/demos/inbox",
          "/demos/admin",
          "/demos/booking",
        ].includes(route)
      ) {
        for (const el of await page.locator("main > *, .cafe-demo > *").all())
          await el.scrollIntoViewIfNeeded();
        await page.evaluate(() => {
          document.querySelectorAll(".home-ui > *").forEach((el) => {
            el.style.contentVisibility = "visible";
          });
          window.scrollTo(0, 0);
        });
        await page.screenshot({
          path: `${folder}/${slug}-${width}-full.png`,
          fullPage: true,
        });
      }
      const image = await sharp(file)
        .resize(360, 260, { fit: "contain", background: "#151515" })
        .png()
        .toBuffer();
      const label = Buffer.from(
        `<svg width="360" height="30"><rect width="360" height="30" fill="#202020"/><text x="10" y="20" font-family="Arial" font-size="13" fill="white">${route}</text></svg>`,
      );
      tiles.push({
        input: image,
        left: (index % 4) * 360,
        top: Math.floor(index / 4) * 290 + 30,
      });
      tiles.push({
        input: label,
        left: (index % 4) * 360,
        top: Math.floor(index / 4) * 290,
      });
      report.push({
        route,
        width,
        status: response.status(),
        errors,
        ...layout,
      });
      page.off("pageerror", onError);
      console.log(`${phase} ${width} ${route}: ${response.status()}`);
    }
    await sharp({
      create: {
        width: 1440,
        height: Math.ceil(routes.length / 4) * 290,
        channels: 3,
        background: "#151515",
      },
    })
      .composite(tiles)
      .png()
      .toFile(`${folder}/contact-sheet-${width}.png`);
    await page.close();
  }
  await fs.writeFile(
    `${folder}/report.json`,
    JSON.stringify(
      { at: new Date().toISOString(), phase, origin, report },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
