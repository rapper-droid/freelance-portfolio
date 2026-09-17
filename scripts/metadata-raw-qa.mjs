import fs from "node:fs/promises";
import path from "node:path";
const origin =
  process.argv[2] ||
  "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev";
const phase = process.argv[3] || "before";
if (
  ![
    "https://tsudowa-owner-preview.tetsuyasmile52l.workers.dev",
    "https://tsudowa.com",
    "http://127.0.0.1:3170",
  ].includes(origin) ||
  !/^[a-z0-9-]+$/.test(phase)
)
  throw Error("Invalid QA target");
const out = path.resolve(
  "../../outputs/workers-final-blockers-20260917/metadata",
  phase,
);
await fs.mkdir(out, { recursive: true });
const agents = {
  browser:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  googlebot: "Googlebot/2.1 (+http://www.google.com/bot.html)",
  twitterbot: "Twitterbot/1.0",
  slackbot: "Slackbot-LinkExpanding 1.0",
  bingbot:
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
};
const rows = [];
for (const [agent, userAgent] of Object.entries(agents)) {
  const response = await fetch(origin + "/demos/cafe", {
    headers: { "User-Agent": userAgent },
    signal: AbortSignal.timeout(30000),
  });
  const html = await response.text();
  await fs.writeFile(path.join(out, agent + ".html"), html);
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "";
  const tags = head.match(/<(?:meta|link)\b[^>]*>/gi) || [];
  const attr = (tag, name) =>
    new RegExp("\\b" + name + '="([^"]*)"', "i").exec(tag)?.[1] || "";
  const meta = (name) =>
    tags
      .filter((t) => attr(t, "name") === name || attr(t, "property") === name)
      .map((t) => attr(t, "content"));
  const canonical = tags
    .filter((t) => attr(t, "rel") === "canonical")
    .map((t) => attr(t, "href"));
  const title = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "";
  const checks = {
    title: title.includes("KISSA") && title.includes("TSUDOWA"),
    description:
      meta("description").length === 1 &&
      meta("description")[0].includes("一杯"),
    canonical:
      canonical.length === 1 &&
      canonical[0] === "https://tsudowa.com/demos/cafe",
    ogTitle: meta("og:title").length === 1 && meta("og:title")[0] === title,
    ogDescription:
      meta("og:description").length === 1 &&
      meta("og:description")[0] === meta("description")[0],
    ogImage:
      meta("og:image").length === 1 &&
      meta("og:image")[0] === "https://tsudowa.com/og-hq.png",
    ogUrl: meta("og:url")[0] === "https://tsudowa.com/demos/cafe",
    twitterCard:
      meta("twitter:card").length === 1 &&
      meta("twitter:card")[0] === "summary_large_image",
    twitterTitle:
      meta("twitter:title").length === 1 && meta("twitter:title")[0] === title,
    twitterDescription:
      meta("twitter:description").length === 1 &&
      meta("twitter:description")[0] === meta("description")[0],
    twitterImage:
      meta("twitter:image").length === 1 &&
      meta("twitter:image")[0] === "https://tsudowa.com/og-hq.png",
  };
  rows.push({
    agent,
    status: response.status,
    checks,
    title,
    description: meta("description"),
    canonical,
    headBytes: Buffer.byteLength(head),
    htmlBytes: Buffer.byteLength(html),
    passed: response.status === 200 && Object.values(checks).every(Boolean),
  });
}
await fs.writeFile(
  path.join(out, "report.json"),
  JSON.stringify(
    { origin, phase, checkedAt: new Date().toISOString(), rows },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      phase,
      passed: rows.filter((r) => r.passed).length,
      total: rows.length,
      rows,
    },
    null,
    2,
  ),
);
if (rows.some((r) => !r.passed)) process.exitCode = 1;
