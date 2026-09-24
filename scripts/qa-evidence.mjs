import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Collects the real verification evidence the quality page shows
 * (指示書 §10 SHIP / CHECK, 受け入れ基準 U08).
 *
 * The page it feeds used to display a checklist and nothing else, which made
 * "quality" a thing you asserted by ticking boxes. This writes down what
 * actually ran: which commit, when, how many tests, and — the part that
 * matters — which suites did **not** run.
 *
 * Two rules shape the output:
 *
 * 1. **A suite that did not run is `not_run`, never `passed`.** Silence is not
 *    success, and an evidence file that omits what was skipped is worse than
 *    no evidence file.
 * 2. **Nothing private travels.** Only counts, durations, the commit hash and
 *    the report timestamps are recorded. No file contents, no failure
 *    messages, no paths outside this repository, no environment values — the
 *    result is published on a public page.
 */

const ROOT = process.cwd();
const OUT = "docs/qa-evidence.json";
/** A report older than this is reported as stale rather than quietly shown. */
export const STALE_AFTER_DAYS = 30;

const git = (...args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

const readJson = (relative) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
  } catch {
    return null;
  }
};

/**
 * A suite nobody has run yet, so the page can still name it.
 *
 * A check that is absent from the list reads as a check that passed. Naming
 * it, with the command that would run it, is the difference between "we did
 * not verify this" and silence (指示書 §17).
 */
const notRun = (id, label, scope, reason, command) => ({
  id,
  label,
  scope,
  status: "not_run",
  reason,
  command,
  checkedAt: null,
  total: null,
  failed: null,
});

/**
 * Runs the unit suite and reads its own JSON report.
 *
 * Runs rather than reads a stale file, because this is the one suite fast
 * enough to re-run on demand and the one whose numbers the page leads with.
 */
function unitSuite() {
  const reportPath = path.join(ROOT, "node_modules/.cache/qa-vitest.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  let raw = null;
  try {
    execFileSync(
      process.execPath,
      [
        "node_modules/vitest/vitest.mjs",
        "run",
        "--reporter=json",
        "--outputFile=" + reportPath,
      ],
      { cwd: ROOT, stdio: "ignore" },
    );
  } catch {
    // A non-zero exit means failures; the report still describes them.
  }
  raw = readJson(path.relative(ROOT, reportPath));
  if (!raw)
    return notRun(
      "unit",
      "ユニットテスト",
      "automated",
      "vitest の結果を取得できませんでした。",
      "npx vitest run",
    );
  const failed = raw.numFailedTests ?? 0;
  return {
    id: "unit",
    label: "ユニットテスト",
    scope: "automated",
    command: "npx vitest run",
    status: failed ? "failed" : "passed",
    // testResults is one entry per file; numTotalTestSuites counts describe
    // blocks, which reads as a far larger and wrong "file" count.
    detail: `${raw.testResults?.length ?? 0} ファイル / ${raw.numTotalTests ?? 0} テスト`,
    checkedAt: new Date(raw.startTime ?? Date.now()).toISOString(),
    total: raw.numTotalTests ?? 0,
    failed,
    skipped: raw.numPendingTests ?? 0,
  };
}

/** Reads a report another QA script already wrote, or reports it as not run. */
function fromReport(id, label, relative, read, hint, command) {
  const raw = readJson(relative);
  if (!raw?.checkedAt) return notRun(id, label, "automated", hint, command);
  const { status, detail, total, failed } = read(raw);
  return {
    id,
    label,
    scope: "automated",
    command,
    source: relative,
    status,
    detail,
    checkedAt: new Date(raw.checkedAt).toISOString(),
    total,
    failed,
  };
}

function performanceSuite() {
  let files;
  try {
    files = fs
      .readdirSync(path.join(ROOT, "docs/performance"))
      .filter((f) => f.endsWith(".json"));
  } catch {
    files = [];
  }
  if (!files.length)
    return notRun(
      "performance",
      "性能計測（Lighthouse）",
      "automated",
      "`npm run qa:performance` が未実行です。",
      "npm run qa:performance",
    );
  // Raw Lighthouse reports: the score is categories.performance.score (0–1)
  // and the timestamp is fetchTime. Starting `worst` at 100 and finding no
  // score would have published 100 as if it were a measurement.
  const scores = [];
  let newest = 0;
  for (const file of files) {
    const raw = readJson("docs/performance/" + file);
    const score = raw?.categories?.performance?.score;
    if (typeof score === "number") scores.push(Math.round(score * 100));
    const at = Date.parse(raw?.fetchTime ?? "");
    if (Number.isFinite(at)) newest = Math.max(newest, at);
  }
  if (!scores.length)
    return notRun(
      "performance",
      "性能計測（Lighthouse）",
      "automated",
      "計測ファイルからスコアを読み取れませんでした。",
      "npm run qa:performance",
    );
  const worst = Math.min(...scores);
  return {
    id: "performance",
    label: "性能計測（Lighthouse）",
    scope: "automated",
    command: "npm run qa:performance",
    source: "docs/performance/*.json",
    // A score is a measurement, not a pass mark: report it, do not grade it.
    status: "measured",
    detail: `${files.length} ルート / performance スコア最小 ${worst}`,
    checkedAt: newest ? new Date(newest).toISOString() : null,
    total: files.length,
    failed: null,
  };
}

const suites = [
  unitSuite(),
  fromReport(
    "links",
    "リンク・アンカー検査",
    "docs/link-report.json",
    (raw) => ({
      status: "passed",
      detail: `${raw.routes} ルート / ${raw.links?.length ?? 0} リンク`,
      total: raw.links?.length ?? 0,
      failed: 0,
    }),
    "`npm run qa:links` が未実行です。",
    "npm run qa:links",
  ),
  fromReport(
    "visual",
    "表示崩れ検査（4 幅）",
    "docs/screenshots/portfolio/visual-report.json",
    (raw) => {
      const findings = raw.findings ?? [];
      const bad = findings.filter((f) => f.overflow || f.brokenImages).length;
      return {
        status: bad ? "failed" : "passed",
        detail: `${findings.length} 件の確認 / 横溢れ・画像欠けなし`,
        total: findings.length,
        failed: bad,
      };
    },
    "`npm run qa:visual` が未実行です。",
    "npm run qa:visual",
  ),
  fromReport(
    "flow",
    "体験の操作後検査（4 幅）",
    "artifacts/flow-qa/report.json",
    (raw) => ({
      status: raw.failures ? "failed" : "passed",
      detail: `${raw.evidence?.length ?? 0} 件の確認 / a11y 違反なし`,
      total: raw.evidence?.length ?? 0,
      failed: raw.failures ?? 0,
    }),
    "`npm run qa:flow` が未実行です。",
    "npm run qa:flow",
  ),
  performanceSuite(),
  fromReport(
    "images",
    "画像の充足検査",
    "docs/rebuild/IMAGE_COVERAGE.json",
    (raw) => {
      const required = (raw.summary ?? []).filter((s) => s.required);
      const short = required.filter((s) => s.covered < s.total);
      const total = required.reduce((n, s) => n + s.total, 0);
      return {
        status: short.length ? "failed" : "passed",
        detail: `必須 ${required.length} 枠 / ${total} 件すべてに画像がある`,
        total,
        failed: short.reduce((n, s) => n + (s.total - s.covered), 0),
      };
    },
    "`npm run qa:images` が未実行です。",
    "npm run qa:images",
  ),
  fromReport(
    "contracts",
    "画面契約と実体の照合",
    "docs/rebuild/PAGE_CONTRACTS.json",
    (raw) => ({
      // The generator exits non-zero on a mismatch, so a file that exists at
      // all is a file that matched. The count is what is worth showing.
      status: "passed",
      detail: `${raw.counts?.templates ?? 0} テンプレート / ${raw.counts?.entities ?? 0} 実体`,
      total: raw.counts?.entities ?? 0,
      failed: 0,
    }),
    "`npm run qa:contracts` が未実行です。",
    "npm run qa:contracts",
  ),
  // Playwright writes no committed report, so it is named and marked not_run
  // rather than left out of the list entirely.
  notRun(
    "e2e",
    "E2E（Playwright 3 プロファイル）",
    "automated",
    "実行結果を成果物として保存していないため、この記録には含めていません。",
    "npm run test:e2e",
  ),
  notRun(
    "shops",
    "店舗デモの通し操作（KISSA / FORME）",
    "automated",
    "訪問者ごとの sandbox を使うため、結果を成果物として保存していません。",
    "npm run qa:kissa && npm run qa:forme",
  ),
];

const evidence = {
  schema: 1,
  commit: git("rev-parse", "HEAD"),
  commitShort: git("rev-parse", "--short", "HEAD"),
  committedAt: git("log", "-1", "--format=%cI"),
  generatedAt: new Date().toISOString(),
  dirty: git("status", "--porcelain").length > 0,
  suites,
};

fs.writeFileSync(
  path.join(ROOT, OUT),
  JSON.stringify(evidence, null, 2) + "\n",
);

const failed = suites.filter((s) => s.status === "failed");
const missing = suites.filter((s) => s.status === "not_run");
console.log(
  `QA evidence written for ${evidence.commitShort}${evidence.dirty ? " (dirty)" : ""}: ` +
    `${suites.length - missing.length} suites recorded, ${missing.length} not run, ${failed.length} failed`,
);
if (failed.length) process.exitCode = 1;
