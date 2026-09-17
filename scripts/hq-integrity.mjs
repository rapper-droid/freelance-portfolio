import fs from "node:fs/promises";
import * as prettier from "prettier";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
const baseline = "220b6f7aaa078a87f596085bb16a2444321f3d70";
const out = path.resolve("../../outputs/master-hq");
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
await fs.mkdir(out, { recursive: true });
const protectedFiles = [
  "src/lib/portfolio.ts",
  "src/lib/showcase.ts",
  "src/app/api/contact/route.ts",
  "src/lib/contact.ts",
  "src/lib/contact-mail.ts",
  "src/lib/abuse.ts",
  "public/brand/tsudowa-mark.svg",
  "src/app/icon.png",
  "src/app/apple-icon.png",
  "public/site.webmanifest",
  "package-lock.json",
];
const protectedResults = [];
for (const file of protectedFiles) {
  const old = execFileSync("git", ["show", baseline + ":" + file]);
  const current = execFileSync("git", ["hash-object", file], {
    encoding: "utf8",
  }).trim();
  const blob = git("rev-parse", baseline + ":" + file);
  protectedResults.push({
    file,
    unchanged: current === blob,
    baselineBlob: blob,
    currentBlob: current,
    baselineSha256: sha(old),
  });
}
const changed = git("diff", "--name-only", baseline)
  .split("\n")
  .filter(Boolean);
const added = git("ls-files", "--others", "--exclude-standard")
  .split("\n")
  .filter(Boolean);
let formatOutput = "",
  formatStatus = 0;
try {
  formatOutput = execFileSync(
    process.execPath,
    ["node_modules/prettier/bin/prettier.cjs", "--list-different", "."],
    { encoding: "utf8", maxBuffer: 5e6 },
  );
} catch (error) {
  formatStatus = error.status;
  formatOutput = String(error.stdout || "");
  if (formatStatus !== 1) throw error;
}
const warnings = formatOutput
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((p) => p.replaceAll("\\", "/"));
const overlap = warnings.filter(
  (p) => changed.includes(p) || added.includes(p),
);
const warningEvidence = [];
for (const file of warnings) {
  const baselineText = execFileSync("git", ["show", baseline + ":" + file], {
    encoding: "utf8",
  });
  const options = { ...(await prettier.resolveConfig(file)), filepath: file };
  const canonicalWarning = !(await prettier.check(
    baselineText.replaceAll("\r\n", "\n"),
    options,
  ));
  warningEvidence.push({
    file,
    unchangedSinceBaseline:
      git("hash-object", file) === git("rev-parse", baseline + ":" + file),
    canonicalWarning,
    checkoutLineEndingOnly: !canonicalWarning,
  });
}
const envNames = (await fs.readdir(".")).filter((p) => /^\.env/.test(p));
const report = {
  at: new Date().toISOString(),
  baseline,
  head: git("rev-parse", "HEAD"),
  branch: git("branch", "--show-current"),
  status: git("status", "--short"),
  trackedMain: git("rev-parse", "origin/main"),
  trackingNote: "Local tracking ref only; no fetch/push performed.",
  comparedToTrackedMain: git(
    "rev-list",
    "--left-right",
    "--count",
    "origin/main...HEAD",
  ),
  protectedResults,
  changed,
  added,
  format: {
    status: formatStatus,
    count: warnings.length,
    canonicalWarnings: warningEvidence.filter((r) => r.canonicalWarning).length,
    checkoutLineEndingOnly: warningEvidence.filter(
      (r) => r.checkoutLineEndingOnly,
    ).length,
    overlap,
    warningEvidence,
  },
  localEnvFileNamesOnly: envNames,
  externalWrites: "None performed by this QA script",
};
await fs.writeFile(
  path.join(out, "integrity.json"),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    head: report.head,
    protectedFiles: protectedResults.length,
    protectedUnchanged: protectedResults.every((r) => r.unchanged),
    formatWarnings: warnings.length,
    overlap,
    baselineWarningsUnchanged: warningEvidence.every(
      (r) => r.unchangedSinceBaseline,
    ),
  }),
);
if (
  protectedResults.some((r) => !r.unchanged) ||
  overlap.length ||
  warningEvidence.some((r) => !r.unchangedSinceBaseline)
)
  process.exitCode = 1;
