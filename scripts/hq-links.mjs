import fs from "node:fs/promises";
import path from "node:path";
const out = path.resolve("../../outputs/master-hq");
const audit = JSON.parse(
  await fs.readFile(path.join(out, "after/audit.json"), "utf8"),
);
const origin = new URL(audit.origin);
if (!["127.0.0.1", "localhost"].includes(origin.hostname))
  throw Error("Local only");
const routes = new Map(
  audit.results.filter((r) => r.width === 390).map((r) => [r.route, r]),
);
const links = new Map(),
  external = new Set(),
  failures = [];
for (const r of routes.values()) {
  const ids = new Set();
  for (const id of r.ids) {
    if (ids.has(id)) failures.push({ route: r.route, duplicateId: id });
    ids.add(id);
  }
  for (const href of r.hrefs) {
    const url = new URL(href, origin.origin + r.route);
    if (["mailto:", "tel:", "blob:", "data:"].includes(url.protocol)) {
      external.add(href);
      continue;
    }
    if (![origin.origin, "https://tsudowa.com"].includes(url.origin)) {
      external.add(href);
      continue;
    }
    const key = url.pathname + url.search + url.hash;
    if (!links.has(key)) links.set(key, new Set());
    links.get(key).add(r.route);
  }
}
const results = [];
for (const [href, sources] of links) {
  const url = new URL(href, origin);
  const source = [...sources];
  let target = routes.get(url.pathname);
  let status = target?.status;
  if (!status)
    status = (
      await fetch(new URL(url.pathname + url.search, origin), {
        method: "GET",
        redirect: "manual",
      })
    ).status;
  const anchor = decodeURIComponent(url.hash.slice(1));
  const anchorExists = !anchor || target?.ids.includes(anchor) || false;
  const result = {
    href,
    source,
    status,
    anchorExists: anchor ? anchorExists : null,
  };
  results.push(result);
  if (status !== 200 || (anchor && !anchorExists)) failures.push(result);
}
await fs.writeFile(
  path.join(out, "links.json"),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      checked: results.length,
      routes: routes.size,
      results,
      externalNotOpened: [...external],
      failures,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    routes: routes.size,
    checked: results.length,
    failures,
    externalNotOpened: [...external],
  }),
);
if (failures.length) process.exitCode = 1;
