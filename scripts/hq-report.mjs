import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
const out = path.resolve("../../outputs/master-hq");
const json = async (file) =>
  JSON.parse(await fs.readFile(path.join(out, file), "utf8"));
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const [audit, links, integrity, perf, before, motion, e2e] = await Promise.all(
  [
    "after/audit.json",
    "links.json",
    "integrity.json",
    "performance-after/summary.json",
    "performance-before/summary.json",
    "motion/timings.json",
    "e2e-final.json",
  ].map(json),
);
if (
  audit.results.length !== 178 ||
  audit.results.some(
    (r) =>
      r.status !== 200 ||
      r.overflow ||
      r.h1 !== 1 ||
      r.brokenImages.length ||
      r.errors.length ||
      r.violations.length,
  ) ||
  links.failures.length ||
  integrity.format.overlap.length ||
  integrity.protectedResults.some((r) => !r.unchanged) ||
  e2e.stats.unexpected ||
  e2e.stats.skipped ||
  motion.records.length !== 2
)
  throw Error("Owner evidence is incomplete or has failures");
execFileSync("git", [
  "diff",
  "--exit-code",
  audit.head,
  "HEAD",
  "--",
  "src",
  "public",
  "package.json",
  "package-lock.json",
  "next.config.ts",
]);
const head = git("rev-parse", "HEAD"),
  branch = git("branch", "--show-current"),
  buildId = (await fs.readFile(".next/BUILD_ID", "utf8")).trim();
const sourceFiles = git(
  "ls-files",
  "src",
  "public",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.mjs",
).split("\n");
const sourceHash = crypto.createHash("sha256");
for (const file of sourceFiles) {
  sourceHash.update(file + "\0");
  sourceHash.update(git("hash-object", file));
}
const checkpoint = {
  at: new Date().toISOString(),
  baseline: integrity.baseline,
  head,
  branch,
  buildId,
  runtimeFingerprint: sourceHash.digest("hex"),
  status: git("status", "--short"),
  origin: "http://127.0.0.1:3160",
  reviewOrigin: "http://127.0.0.1:3162",
  comparison: "http://127.0.0.1:3147",
  routes: 52,
  viewportChecks: audit.results.length,
  e2e: e2e.stats,
  unitTests: 101,
  externalChanges: false,
  commits: git("log", "--format=%h %s", integrity.baseline + "..HEAD").split(
    "\n",
  ),
};
await fs.writeFile(
  path.join(out, "checkpoint.json"),
  JSON.stringify(checkpoint, null, 2),
);
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const performanceRows = perf.results
  .map((r) => {
    const prev = before.results.find((p) => p.route === r.route);
    return (
      "<tr><th>" +
      escape(r.route) +
      "</th><td>" +
      r.scores.performance +
      "</td><td>" +
      r.scores.accessibility +
      "</td><td>" +
      r.scores["best-practices"] +
      "</td><td>" +
      r.scores.seo +
      "</td><td>" +
      (r.lcp / 1000).toFixed(2) +
      "s" +
      (prev ? " <small>← " + (prev.lcp / 1000).toFixed(2) + "s</small>" : "") +
      "</td><td>" +
      r.cls.toFixed(3) +
      "</td></tr>"
    );
  })
  .join("");
const routeData = [...new Set(audit.results.map((r) => r.route))].map(
  (route) => ({
    route,
    slug: route === "/" ? "top" : route.slice(1).replaceAll("/", "-"),
    widths: audit.results.filter((r) => r.route === route).map((r) => r.width),
  }),
);
const checks = [
  "First impression / TSUDOWA全体の入口と伝わるか",
  "Premium feel / 強さと落ち着き",
  "Realism of imagery / 自主制作の説得力",
  "Typography / 日本語と英語の読みやすさ",
  "Spacing / 幅ごとの余白・密度",
  "Motion quality / 内容を邪魔しないか",
  "CTA clarity / 制作依頼・LAB・総合連絡",
  "TSUDOWA → TETSU WORKS hierarchy",
  "Mobile quality / 390pxの最初の画面",
  "依頼したいと思えるか",
  "また見に来たいと思えるか",
];
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>TSUDOWA / OWNER REVIEW</title><style>
*{box-sizing:border-box}body{margin:0;background:#101411;color:#eeeae2;font:15px/1.8 Arial,"Yu Gothic",Meiryo,sans-serif}a{color:#ffd28f;text-underline-offset:4px}main{max-width:1280px;margin:auto;padding:36px 28px 90px}header{padding-bottom:36px;border-bottom:1px solid #536049}h1{font-size:clamp(38px,5vw,72px);letter-spacing:-.04em;line-height:1.05;margin:24px 0}h2{margin:0 0 24px;font-size:28px}h3{font-size:18px}section{padding:44px 0;border-bottom:1px solid #394334}p{max-width:900px}.eyebrow{font-size:12px;letter-spacing:.12em;color:#c4cdbb}.status{color:#162014;background:#cce5b2;padding:8px 12px;display:inline-block;font-weight:700}.links{display:flex;flex-wrap:wrap;gap:12px 24px}.links a,button,select{min-height:44px;display:inline-flex;align-items:center}code{overflow-wrap:anywhere;color:#d2d9c9}.compare,.video-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}img{display:block;max-width:100%;height:auto}figure{margin:0}figcaption{font-size:12px;margin:10px 0;color:#c4cdbb}.compare figure img{width:100%}.compare.mobile figure{max-width:390px;margin:auto}video{display:block;width:100%;max-height:720px;background:#090d09}label{display:block;margin:12px 0}input{margin-right:12px}select,button{background:#283522;color:#f0ece1;border:1px solid #758767;padding:8px 13px;font:inherit}button:focus-visible,a:focus-visible,select:focus-visible{outline:3px solid #f1b761;outline-offset:4px}.controls{display:flex;flex-wrap:wrap;gap:16px;align-items:center}.viewer{max-height:900px;overflow:auto;margin-top:20px;border:1px solid #6a785c;background:#1e291c}.viewer img{width:100%;max-width:1440px;margin:auto}.metrics{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:12px;text-align:left;white-space:nowrap;border-bottom:1px solid #4c5943}small{color:#c1ccb6}.notice{border-left:3px solid #f1b761;padding:14px 20px;background:#222b1e}.og{max-width:750px}.checklist{display:grid;grid-template-columns:1fr 1fr;gap:0 24px}details{padding:18px 0}summary{cursor:pointer;min-height:44px}@media(max-width:700px){main{padding:24px 18px 60px}.compare,.video-grid,.checklist{grid-template-columns:1fr}.compare.mobile{grid-template-columns:1fr 1fr;gap:10px}h2{font-size:24px}.controls{align-items:stretch;flex-direction:column}}
</style></head><body><main><header><p class="eyebrow">TSUDOWA / MASTER HQ / LOCAL OWNER REVIEW</p><h1>GATHER.<br>BUILD. EXPAND.</h1><p>集まり、つくり、次へ広がる。<br>親ブランドの入口・作品・LAB gateway・制作記録・2つの問い合わせ窓口。</p><p class="status">READY_FOR_OWNER_REVIEW / NOT_DEPLOYED</p><p><code>${escape(branch)}</code><br>Before <code>${escape(integrity.baseline)}</code><br>After <code>${escape(head)}</code></p><nav class="links"><a href="http://127.0.0.1:3160/">TOPを開く</a><a href="http://127.0.0.1:3160/works">WORKS</a><a href="http://127.0.0.1:3160/lab">LAB gateway</a><a href="http://127.0.0.1:3160/history">BUILD LOG</a><a href="http://127.0.0.1:3160/contact">制作相談</a><a href="http://127.0.0.1:3160/contact/general">総合窓口</a></nav></header>
<section><h2>まず、全体の違いを見る。</h2><div class="compare"><figure><a href="before/top-1440-full.png"><img src="before/top-1440-firstview.png" alt="旧TOPの1440px初期画面"></a><figcaption>BEFORE / 1440px — クリックで全体</figcaption></figure><figure><a href="after/top-1440-full.png"><img src="after/top-1440-firstview.png" alt="新しいTSUDOWA HQの1440px初期画面"></a><figcaption>AFTER / 1440px — クリックで全体</figcaption></figure></div></section>
<section id="mobile"><h2>390px。スマホの最初の印象。</h2><div class="compare mobile"><figure><a href="before/top-390-full.png"><img loading="lazy" src="before/top-390-firstview.png" alt="旧TOP 390px"></a><figcaption>BEFORE</figcaption></figure><figure><a href="after/top-390-full.png"><img loading="lazy" src="after/top-390-firstview.png" alt="新HQ 390px"></a><figcaption>AFTER</figcaption></figure></div><p>ここは実際の390pxキャプチャです。ライブサイトのモバイル表示はブラウザ幅を390pxにして同じTOP URLで確認できます。</p></section>
<section><h2>動きと、2つの世界への移動。</h2><div class="video-grid"><figure><video controls preload="metadata" src="motion/top-1440-owner-review.webm"></video><figcaption>1440px / 初期・arrival・scroll・hover・WORKS・LAB・nav・contact</figcaption></figure><figure><video controls preload="metadata" src="motion/top-390-owner-review.webm"></video><figcaption>390px / 同じ導線とモバイルMENU</figcaption></figure></div><p>到着演出は初回のタブだけ、約1.5秒。reduced-motionでは静止表示。動画にはキャプチャ時の待機時間も含まれます。</p></section>
<section><h2>52 URLの保存済み画面。</h2><div class="controls"><select id="route" aria-label="確認するページ">${routeData.map((r) => '<option value="' + escape(r.route) + '">' + escape(r.route) + "</option>").join("")}</select><select id="width" aria-label="画面幅"></select><select id="mode" aria-label="キャプチャ範囲"><option value="full">ページ全体</option><option value="firstview">最初の画面</option></select><a id="original" href="after/top-390-full.png">元画像を開く</a></div><div class="viewer"><img id="shot" loading="lazy" src="after/top-390-full.png" alt="選択したページの保存済み画面"></div><p>全52 URLは390 / 768 / 1440px。主要11 URLは1024 / 1920pxも確認。178 viewport、356枚のafter画像。</p></section>
<section><h2>確認結果。</h2><p>Unit 101 PASS / E2E ${e2e.stats.expected} PASS / リンク ${links.checked}件 / 画像decode・横はみ出し・pageerror・axe違反は178条件で0。</p><p>既存の料金・作品データ、メール基盤、ロゴ、アイコン、lockfileは開始時と一致。format warningは今回差分との交差0。</p><div class="metrics"><table><thead><tr><th>Route</th><th>Perf</th><th>A11y</th><th>BP</th><th>SEO</th><th>LCP</th><th>CLS</th></tr></thead><tbody>${performanceRows}</tbody></table></div><p>localhost production build / Lighthouse mobile simulated。実測の現場CWVではありません。旧TOPなどの比較はこの環境で取得した単発値で、測定ばらつきを含みます。</p></section>
<section><h2>Social preview</h2><img loading="lazy" class="og" src="http://127.0.0.1:3160/og-hq.png" alt="TSUDOWAの新OGP：GATHER BUILD EXPANDとWORKS/LABの2つの世界"></section>
<section><h2>OWNERの目で確認すること。</h2><p>以下は未承認のチェック項目です。自動テストでブランドの好みや営業成果を保証するものではありません。チェックは送信・保存されません。</p><div class="checklist">${checks.map((c) => '<label><input type="checkbox">' + escape(c) + "</label>").join("")}</div><div class="notice"><strong>公開前に残すgate</strong><p>LAB本体の公開URL確認。実機iOS / Android・実スクリーンリーダー。必要な承認環境でのgeneral contact実配送。今回のフォーム成功E2Eはmockで、実送信は行っていません。</p><p>push / merge / deploy / DNS / Cloudflare / Resend / mail外部設定変更は未実施。比較用3147も維持しています。</p></div></section><footer><p>TSUDOWA / OWNER REVIEW<br>生成 ${escape(checkpoint.at)} / Build <code>${escape(buildId)}</code></p></footer></main>
<script>
const routes=${JSON.stringify(routeData).replaceAll("<", "\\u003c")},route=document.getElementById("route"),width=document.getElementById("width"),mode=document.getElementById("mode"),shot=document.getElementById("shot"),original=document.getElementById("original");
function render(reset){const r=routes.find(r=>r.route===route.value);if(reset){const previous=width.value;width.replaceChildren(...r.widths.map(w=>{const o=document.createElement("option");o.value=w;o.textContent=w+"px";return o}));if(r.widths.includes(Number(previous)))width.value=previous}const src="after/"+r.slug+"-"+width.value+"-"+mode.value+".png";shot.src=src;shot.style.maxWidth=width.value+"px";shot.alt=r.route+" / "+width.value+"px";original.href=src}
route.addEventListener("change",()=>render(true));width.addEventListener("change",()=>render(false));mode.addEventListener("change",()=>render(false));render(true);
</script></body></html>`;
await fs.writeFile(path.join(out, "OWNER_REVIEW.html"), html);
const performanceMd = perf.results
  .map(
    (r) =>
      "| " +
      r.route +
      " | " +
      r.scores.performance +
      " | " +
      r.scores.accessibility +
      " | " +
      r.scores["best-practices"] +
      " | " +
      r.scores.seo +
      " | " +
      (r.lcp / 1000).toFixed(3) +
      "s | " +
      r.cls +
      " |",
  )
  .join("\n");
const md =
  "# TSUDOWA MASTER HQ — OWNER REVIEW\n\nREADY_FOR_OWNER_REVIEW / NOT_DEPLOYED\n\nBefore: " +
  integrity.baseline +
  "\n\nAfter: " +
  head +
  "\n\nBranch: " +
  branch +
  "\n\nTOP: http://127.0.0.1:3160/\n\nReview: http://127.0.0.1:3162/OWNER_REVIEW.html\n\n101 unit / " +
  e2e.stats.expected +
  " E2E / " +
  audit.results.length +
  " viewport checks / " +
  links.checked +
  " internal links. Full evidence and screenshots in this folder.\n\n| Route | Perf | A11y | BP | SEO | LCP | CLS |\n| --- | --- | --- | --- | --- | --- | --- |\n" +
  performanceMd +
  "\n\nLimitations: local simulated measurements; LAB public URL unverified; no new live email delivery; no real-device screen-reader validation; OWNER approval still required.\n\nCommits:\n\n" +
  checkpoint.commits.map((c) => "- " + c).join("\n") +
  "\n";
await fs.writeFile(path.join(out, "RESULTS.md"), md);
console.log(
  JSON.stringify({
    head,
    buildId,
    html: "OWNER_REVIEW.html",
    checks: audit.results.length,
    links: links.checked,
    e2e: e2e.stats.expected,
  }),
);
