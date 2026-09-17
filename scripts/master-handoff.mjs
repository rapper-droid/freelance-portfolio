import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const out = "../../outputs/master-pass";
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", windowsHide: true }).trim();
const files = [
  ...new Set(
    [
      ...git(
        "ls-files",
        "src",
        "public",
        "package.json",
        "package-lock.json",
        "next.config.ts",
      ).split("\n"),
      ...git(
        "ls-files",
        "--others",
        "--exclude-standard",
        "src",
        "public",
      ).split("\n"),
    ].filter(Boolean),
  ),
].sort();
const hashes = {};
for (const file of files)
  hashes[file] = createHash("sha256")
    .update(await fs.readFile(file))
    .digest("hex");
const digest = createHash("sha256")
  .update(JSON.stringify(hashes))
  .digest("hex");
const current = {
  at: new Date().toISOString(),
  head: git("rev-parse", "HEAD"),
  buildId: (await fs.readFile(".next/BUILD_ID", "utf8")).trim(),
  appSourceDigest: digest,
  files: hashes,
};
if (process.argv[2] === "freeze") {
  await fs.writeFile(
    out + "/APP_SOURCE_FREEZE.json",
    JSON.stringify(current, null, 2),
  );
  console.log("Frozen application source: " + digest);
} else {
  const frozen = JSON.parse(
    await fs.readFile(out + "/APP_SOURCE_FREEZE.json", "utf8"),
  );
  if (frozen.appSourceDigest !== digest || frozen.buildId !== current.buildId)
    throw Error("Application or build changed since final QA began");
  const checkpoint = {
    ...current,
    tree: git("rev-parse", "HEAD^{tree}"),
    branch: git("branch", "--show-current"),
    status: git("status", "--porcelain=v1"),
    commits: git("log", "--oneline", "8f57c92..HEAD").split("\n"),
    baseline: "8f57c9276e43bfeb75837180bedc90b875c662f0",
    frozenAt: frozen.at,
    note: "After captures were made from the frozen working tree, then committed without changing application files. Capture JSON HEAD values record the old HEAD at capture time; this receipt binds the final commit to that same application/build.",
    origin: "http://127.0.0.1:3147",
    deployed: false,
  };
  await fs.writeFile(
    out + "/FINAL_CHECKPOINT.json",
    JSON.stringify(checkpoint, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        head: checkpoint.head,
        status: checkpoint.status,
        sameAppAndBuild: true,
        commits: checkpoint.commits,
      },
      null,
      2,
    ),
  );
}
