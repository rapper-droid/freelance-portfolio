import fs from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const base = "8f57c9276e43bfeb75837180bedc90b875c662f0";
const out = "../../outputs/master-pass";
const git = (...a) =>
  execFileSync("git", a, { encoding: "utf8", windowsHide: true }).trim();
const changed = [
  ...new Set(
    [
      ...git("diff", "--name-only", base).split("\n"),
      ...git("ls-files", "--others", "--exclude-standard").split("\n"),
    ].filter(Boolean),
  ),
];
const format = spawnSync(
  process.execPath,
  ["node_modules/prettier/bin/prettier.cjs", "--list-different", "."],
  { encoding: "utf8", windowsHide: true },
);
const warnings = (format.stdout || "").trim().split(/\r?\n/).filter(Boolean);
const prior = JSON.parse(
  await fs.readFile(
    "../../outputs/owner-review-8f57c92/FORMAT_TECH_DEBT.json",
    "utf8",
  ),
);
const old = new Set(prior.files.map((f) => f.file));
const formatReport = {
  at: new Date().toISOString(),
  baseline: base,
  baselineCount: 69,
  warningCount: warnings.length,
  intersection: warnings.filter((f) => changed.includes(f)),
  newWarnings: warnings.filter((f) => !old.has(f)),
  resolvedOriginalWarnings: [...old].filter((f) => !warnings.includes(f)),
  remaining: warnings.map((file) => ({
    file,
    unchanged: git("hash-object", file) === git("rev-parse", base + ":" + file),
  })),
  prettierExit: format.status,
};
const manifest = JSON.parse(
  await fs.readFile(
    "../../outputs/owner-review-8f57c92/CAPTURE_MANIFEST.json",
    "utf8",
  ),
);
const artifacts = [];
function walk(v) {
  if (!v || typeof v !== "object") return;
  if (v.file && v.sha256) artifacts.push(v);
  for (const x of Object.values(v)) if (typeof x === "object") walk(x);
}
walk(manifest);
const mismatches = [];
for (const artifact of artifacts) {
  const data = await fs.readFile(
    "../../outputs/owner-review-8f57c92/" + artifact.file,
  );
  if (createHash("sha256").update(data).digest("hex") !== artifact.sha256)
    mismatches.push(artifact.file);
}
const protectedBlob = git("hash-object", "src/lib/portfolio.ts");
const report = {
  at: new Date().toISOString(),
  base,
  head: git("rev-parse", "HEAD"),
  branch: git("branch", "--show-current"),
  status: git("status", "--short"),
  productRegistry: {
    baseline: git("rev-parse", base + ":src/lib/portfolio.ts"),
    current: protectedBlob,
    unchanged:
      protectedBlob === git("rev-parse", base + ":src/lib/portfolio.ts"),
  },
  oldReviewArtifactsChecked: artifacts.length,
  oldReviewMismatches: mismatches,
  format: formatReport,
};
await fs.writeFile(out + "/integrity.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      productRegistry: report.productRegistry,
      oldArtifacts: artifacts.length,
      mismatches,
      format: formatReport,
    },
    null,
    2,
  ),
);
if (
  mismatches.length ||
  !report.productRegistry.unchanged ||
  formatReport.intersection.length ||
  formatReport.newWarnings.length ||
  formatReport.remaining.some((r) => !r.unchanged)
)
  process.exitCode = 1;
