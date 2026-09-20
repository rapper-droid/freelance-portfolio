/**
 * TODAY_BRIEF — 今日、人が見るべきものだけを並べる。
 *
 * 読み書きするのは GROWTH_DATA_DIR（既定 ~/.tsudowa-growth）だけ。
 * このリポジトリ（public）には営業データを一切書かない。送信もしない。
 *
 *   node --experimental-strip-types scripts/growth-brief.mjs         # 表示
 *   node --experimental-strip-types scripts/growth-brief.mjs --init  # 置き場所を作る
 *   node --experimental-strip-types scripts/growth-brief.mjs --cw    # CW APPLY OS 取り込み用
 */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  counts,
  toCwApplyOsImport,
  validateLead,
  verdict,
} from "../src/lib/growth/leads.ts";

const dir =
  process.env.GROWTH_DATA_DIR || path.join(os.homedir(), ".tsudowa-growth");
const leadsPath = path.join(dir, "leads.json");
const resultsPath = path.join(dir, "results.json");
const today = new Date().toISOString().slice(0, 10);

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw new Error(`${file} を読めません: ${error.message}`);
  }
}

if (process.argv.includes("--init")) {
  await fs.mkdir(dir, { recursive: true });
  for (const [file, seed] of [
    [leadsPath, { updatedAt: today, leads: [] }],
    [
      resultsPath,
      {
        updatedAt: today,
        note: "実測だけを書く。未計測は null のままにする。",
        days: [],
      },
    ],
  ]) {
    try {
      await fs.access(file);
      console.log(`既存: ${file}`);
    } catch {
      await fs.writeFile(file, JSON.stringify(seed, null, 2) + "\n");
      console.log(`作成: ${file}`);
    }
  }
  console.log(
    "\nこの場所は Git 管理外です。営業先・連絡先・見積はここにだけ置いてください。",
  );
  process.exit(0);
}

const { leads = [] } = await readJson(leadsPath, {});
const results = await readJson(resultsPath, { days: [] });

const problems = leads.flatMap((lead) =>
  validateLead(lead).map((p) => `${lead.id ?? "(id なし)"}: ${p}`),
);
if (process.argv.includes("--cw")) {
  const text = toCwApplyOsImport(leads);
  console.log(
    text ||
      "CrowdWorks の案件URLを持つ候補はありません（CW案件は CW APPLY OS で扱います）。",
  );
  process.exit(0);
}

const stat = counts(leads);
const byState = (state) => leads.filter((l) => l.state === state);
const line = (s) => console.log(s);
const list = (items, format, empty) => {
  if (!items.length) return line(`  ${empty}`);
  for (const item of items) line(`  - ${format(item)}`);
};

line(`# TODAY_BRIEF ${today}`);
line(`データ: ${leadsPath}`);
if (!leads.length)
  line(
    "\n候補は 0 件です（未着手であり、「適合0件」とは違います）。`--init` の後、候補を手で追加してください。",
  );
if (problems.length) {
  line(`\n## 0. 直すべきレコード（${problems.length}件）`);
  list(problems, (p) => p, "");
}

line("\n## 1. 期限のある返信・納品");
list(
  leads
    .filter((l) => ["REPLIED", "QUALIFIED", "QUOTED", "WON"].includes(l.state))
    .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999")),
  (l) =>
    `${l.dueAt ?? "期日未設定"} ${l.title} — ${l.nextAction ?? "次の行動が未記入"}`,
  "なし",
);

line("\n## 2. 承認待ちの下書き（送信は所長）");
list(
  byState("DRAFT_READY"),
  (l) =>
    `${l.title}（${l.sourceUrl}）— ${l.offerIds.join(", ") || "商品未割当"}`,
  "なし",
);

line("\n## 3. 公開・出品待ちの資材");
line("  - artifacts/growth-public/ の原稿（`npm run growth:lint` で検査）");
line("  - 公開の承認は docs/growth/ACTION_MANIFEST.md");

line("\n## 4. 前日の実測");
const last = results.days?.at(-1);
if (!last) line("  未計測（計測が未接続。実測0件ではありません）");
else
  for (const [key, value] of Object.entries(last))
    line(`  ${key}: ${value === null ? "未計測" : value}`);

line("\n## 5. 候補の内訳");
line(
  `  確認 ${stat.total} / 足切り ${stat.blocked} / 優先 ${stat.priority} / 要確認 ${stat.needsReview} / 見送り ${stat.dropped} / 未採点 ${stat.unscored}`,
);
list(
  leads.filter((l) => verdict(l).decision === "blocked").slice(0, 5),
  (l) => `${l.title}: ${verdict(l).reasons.join(" / ")}`,
  "足切りなし",
);

line("\n## 6. 次に改善する1点");
line(
  stat.total === 0
    ? "  データ不足（候補が未登録）"
    : stat.priority === 0
      ? "  優先候補が0件。商品と募集の当たり先を見直す"
      : "  優先候補の下書きを所長が確認する",
);
