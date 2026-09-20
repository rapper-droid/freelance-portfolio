// Checks every outbound draft in artifacts/growth-public against
// docs/growth/CHANNEL_POLICY.md. Text only: nothing is sent or published.
import fs from "node:fs/promises";
import path from "node:path";
import { lintDraft } from "../src/lib/growth/draft-lint.ts";
import { categories } from "../src/lib/portfolio.ts";
import { publishedOffers } from "../src/lib/offers.ts";

const root = process.argv[2] || "artifacts/growth-public";
const prices = [
  ...categories.map((c) => c.price),
  ...publishedOffers.map((o) => o.price.displayLabel),
  "30,000円〜",
  "50,000円〜",
];
async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith(".md") && entry.name !== "README.md")
      yield full;
  }
}
let errors = 0;
let files = 0;
for await (const file of walk(root)) {
  const findings = lintDraft(await fs.readFile(file, "utf8"), prices);
  files++;
  for (const f of findings) {
    if (f.level === "error") errors++;
    console.log(`${f.level.toUpperCase()} ${file} [${f.rule}] ${f.detail}`);
  }
}
console.log(
  errors
    ? `FAIL ${errors} 件の要修正（${files} ファイル）`
    : `PASS ${files} ファイル、要修正なし`,
);
process.exit(errors ? 1 : 0);
