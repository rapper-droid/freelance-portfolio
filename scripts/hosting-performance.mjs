import fs from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import sharp from "sharp";
const phase = process.argv[2] || "baseline";
if (!/^[a-z0-9-]+$/.test(phase)) throw Error("Invalid phase");
const out = path.resolve(
  "../../outputs/workers-performance-contact-20260917",
  phase,
);
const routes = ["/", "/works", "/demos/cafe", "/demos/inbox", "/contact"];
const hosts = {
  netlify: "https://tsudowa.com",
  workers: "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev",
};
const mode = process.argv[3] || "all";
await fs.mkdir(out, { recursive: true });
const slug = (r) => (r === "/" ? "top" : r.slice(1).replaceAll("/", "-"));
const save = (name, data) =>
  fs.writeFile(path.join(out, name), JSON.stringify(data, null, 2) + "\n");
if (mode !== "navigation")
  for (let run = 1; run <= 3; run++)
    for (const route of routes)
      for (const host of run % 2
        ? ["netlify", "workers"]
        : ["workers", "netlify"]) {
        const file = `lh-${host}-${slug(route)}-${run}.json`;
        try {
          const old = JSON.parse(
            await fs.readFile(path.join(out, file), "utf8"),
          );
          if (!old.runtimeError) continue;
        } catch {}
        const browser = await chromium.launch({
          args: ["--remote-debugging-port=9238"],
        });
        try {
          const { lhr } = await lighthouse(hosts[host] + route, {
            port: 9238,
            output: "json",
            logLevel: "error",
            formFactor: "mobile",
            throttlingMethod: "simulate",
            onlyCategories: [
              "performance",
              "accessibility",
              "best-practices",
              "seo",
            ],
          });
          await save(file, lhr);
          if (lhr.runtimeError) throw Error(lhr.runtimeError.message);
          console.log(
            JSON.stringify({
              kind: "lighthouse",
              host,
              route,
              run,
              performance: lhr.categories.performance.score,
              lcp: lhr.audits["largest-contentful-paint"].numericValue,
              cls: lhr.audits["cumulative-layout-shift"].numericValue,
            }),
          );
        } finally {
          await browser.close();
        }
      }
if (mode !== "lighthouse") {
  const browser = await chromium.launch();
  try {
    for (let run = 1; run <= 3; run++)
      for (const route of routes)
        for (const host of run % 2
          ? ["netlify", "workers"]
          : ["workers", "netlify"]) {
          const file = `nav-${host}-${slug(route)}-${run}.json`;
          try {
            await fs.access(path.join(out, file));
            continue;
          } catch {}
          const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            serviceWorkers: "block",
          });
          const page = await context.newPage();
          await page.addInitScript(() => {
            window.__auditLcp = null;
            new PerformanceObserver((list) => {
              const e = list.getEntries().at(-1);
              window.__auditLcp = {
                url: e.url,
                size: e.size,
                startTime: e.startTime,
                tag: e.element?.tagName,
              };
            }).observe({ type: "largest-contentful-paint", buffered: true });
          });
          const cdp = await context.newCDPSession(page);
          await cdp.send("Network.enable");
          const byId = new Map();
          let active = true;
          cdp.on("Network.requestWillBeSent", (e) => {
            if (active)
              byId.set(e.requestId, {
                id: e.requestId,
                url: e.request.url,
                type: e.type,
                method: e.request.method,
                start: e.timestamp,
                redirect: e.redirectResponse
                  ? {
                      status: e.redirectResponse.status,
                      url: e.redirectResponse.url,
                    }
                  : null,
              });
          });
          cdp.on("Network.responseReceived", (e) => {
            if (active) {
              const r = byId.get(e.requestId);
              if (r)
                Object.assign(r, {
                  status: e.response.status,
                  type: e.type,
                  mime: e.response.mimeType,
                  cache:
                    !!e.response.fromDiskCache ||
                    !!e.response.fromServiceWorker,
                  headers: e.response.headers,
                });
            }
          });
          cdp.on("Network.loadingFinished", (e) => {
            if (active) {
              const r = byId.get(e.requestId);
              if (r)
                Object.assign(r, {
                  wireBytes: e.encodedDataLength,
                  durationMs: (e.timestamp - r.start) * 1000,
                });
            }
          });
          const samples = [];
          for (const cache of ["cold", "warm"]) {
            byId.clear();
            active = true;
            const response = await page.goto(hosts[host] + route, {
              waitUntil: "domcontentloaded",
              timeout: 60000,
            });
            // Real Turnstile can maintain network activity indefinitely. Settle
            // document fonts and visible images, then observe both hosts for 5s.
            await page.evaluate(async () => {
              await document.fonts.ready;
              await Promise.all(
                [...document.images]
                  .filter(
                    (image) =>
                      image.currentSrc &&
                      image.getBoundingClientRect().top < innerHeight,
                  )
                  .map((image) => image.decode().catch(() => {})),
              );
            });
            await page.waitForTimeout(5000);
            active = false;
            const state = await page.evaluate(() => {
              const n = performance.getEntriesByType("navigation")[0];
              return {
                navigation: {
                  ttfbMs: n.responseStart - n.requestStart,
                  documentElapsedToFirstByteMs: n.responseStart,
                  domContentLoadedMs: n.domContentLoadedEventEnd,
                  loadMs: n.loadEventEnd,
                },
                lcp: window.__auditLcp,
                images: [...document.images]
                  .filter((i) => i.currentSrc)
                  .map((i) => ({
                    src: i.currentSrc,
                    alt: i.alt,
                    naturalWidth: i.naturalWidth,
                    naturalHeight: i.naturalHeight,
                    renderedWidth: i.getBoundingClientRect().width,
                    renderedHeight: i.getBoundingClientRect().height,
                    complete: i.complete,
                  })),
              };
            });
            const requests = [...byId.values()];
            for (const image of state.images) {
              const resource = requests.find(
                (r) =>
                  (r.url === image.src || r.redirect?.url === image.src) &&
                  r.type === "Image",
              );
              image.wireBytes = resource?.wireBytes ?? null;
              if (resource)
                try {
                  const body = await cdp.send("Network.getResponseBody", {
                    requestId: resource.id,
                  });
                  const meta = await sharp(
                    Buffer.from(
                      body.body,
                      body.base64Encoded ? "base64" : "utf8",
                    ),
                  ).metadata();
                  image.decoded = {
                    width: meta.width,
                    height: meta.height,
                    format: meta.format,
                  };
                } catch {
                  image.decoded = null;
                }
            }
            const bytes = (type) =>
              requests
                .filter((r) => !type || r.type === type)
                .reduce((s, r) => s + (r.wireBytes || 0), 0);
            const largestImage =
              [...state.images].sort(
                (a, b) => (b.wireBytes || 0) - (a.wireBytes || 0),
              )[0] || null;
            const start = performance.now();
            const api = await page.request.get(hosts[host] + "/api/contact");
            const apiMs = performance.now() - start;
            samples.push({
              cache,
              status: response.status(),
              ...state,
              requestCount: requests.length,
              transferBytes: bytes(),
              jsBytes: bytes("Script"),
              cssBytes: bytes("Stylesheet"),
              imageBytes: bytes("Image"),
              largestImage,
              api: {
                method: "GET",
                path: "/api/contact",
                status: api.status(),
                ms: apiMs,
              },
              requests,
            });
          }
          await context.close();
          await save(file, {
            host,
            route,
            run,
            measuredAt: new Date().toISOString(),
            conditions:
              "Chromium mobile 390x844 DPR2; real network/no artificial throttle; cold=fresh context, warm=second navigation same context; CDN cache uncontrolled; DOMContentLoaded + fonts/visible-image decode + 5s on both hosts; no scrolling; CDP encoded bytes include response overhead, omit unreported redirect overhead; GET contact only",
            samples,
          });
          console.log(
            JSON.stringify({
              kind: "navigation",
              host,
              route,
              run,
              cold: samples[0].navigation.ttfbMs,
              warm: samples[1].navigation.ttfbMs,
            }),
          );
        }
  } finally {
    await browser.close();
  }
}
console.log("PERFORMANCE_COLLECTION_COMPLETE " + phase);
