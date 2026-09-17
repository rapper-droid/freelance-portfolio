import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
const out = path.resolve("../../outputs/master-hq");
const audit = JSON.parse(
  await fs.readFile(path.join(out, "after/audit.json"), "utf8"),
);
const results = [];
for (const record of audit.results.filter((r) =>
  [390, 1440].includes(r.width),
)) {
  if (
    ["/", "/works", "/lab", "/history", "/contact/general"].includes(
      record.route,
    )
  )
    continue;
  const name =
    record.route.slice(1).replaceAll("/", "-") +
    "-" +
    record.width +
    "-firstview.png";
  const previous = path.resolve("../../outputs/master-pass/after", name);
  try {
    await fs.access(previous);
  } catch {
    results.push({
      route: record.route,
      width: record.width,
      baseline: "missing",
    });
    continue;
  }
  const [before, after] = await Promise.all(
    [previous, path.join(out, "after", name)].map((p) =>
      sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ),
  );
  const sameSize =
    before.info.width === after.info.width &&
    before.info.height === after.info.height;
  if (!sameSize) {
    results.push({ route: record.route, width: record.width, sameSize });
    continue;
  }
  let sum = 0,
    changed = 0;
  for (let i = 0; i < before.data.length; i += 4) {
    let delta = 0;
    for (let c = 0; c < 3; c++)
      delta += Math.abs(before.data[i + c] - after.data[i + c]);
    sum += delta;
    if (delta > 36) changed++;
  }
  const pixels = before.info.width * before.info.height;
  results.push({
    route: record.route,
    width: record.width,
    sameSize,
    meanChannelDifference: sum / (pixels * 3),
    changedPixelFraction: changed / pixels,
  });
}
await fs.writeFile(
  path.join(out, "legacy-visual-comparison.json"),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      note: "Read-only pixel comparison against previous MASTER PASS first views. Intentional new HQ/WORKS composition and new routes excluded; rendering differences are evidence for inspection, not an automatic design verdict.",
      results,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    comparisons: results.length,
    exact: results.filter((r) => r.meanChannelDifference === 0).length,
    changedOverFivePercent: results
      .filter((r) => r.changedPixelFraction > 0.05)
      .map((r) => ({
        route: r.route,
        width: r.width,
        fraction: r.changedPixelFraction,
      })),
  }),
);
