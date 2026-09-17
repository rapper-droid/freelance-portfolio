import fs from "node:fs/promises";
import sharp from "sharp";
const out = "../../outputs/master-pass";
const before = JSON.parse(
  await fs.readFile(out + "/before/audit.json", "utf8"),
);
const after = JSON.parse(await fs.readFile(out + "/after/audit.json", "utf8"));
const routes = after.results.filter((r) => r.width === 390).map((r) => r.route);
const key = (r) => (r === "/" ? "top" : r.slice(1).replaceAll("/", "-"));
const esc = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
await fs.mkdir(out + "/sheets", { recursive: true });
for (const width of [390, 1440]) {
  for (let start = 0; start < routes.length; start += 12) {
    const chunk = routes.slice(start, start + 12),
      tiles = [],
      tw = 300,
      th = width === 390 ? 680 : 260;
    for (let i = 0; i < chunk.length; i++) {
      const route = chunk[i],
        x = (i % 4) * tw,
        y = Math.floor(i / 4) * th;
      const thumb = await sharp(
        `${out}/after/${key(route)}-${width}-firstview.png`,
      )
        .resize({ width: tw - 12 })
        .png()
        .toBuffer();
      const label = Buffer.from(
        `<svg width="300" height="26"><rect width="300" height="26" fill="#f0eee7"/><text x="8" y="17" font-family="Arial" font-size="12" fill="#222">${esc(route)}</text></svg>`,
      );
      tiles.push(
        { input: label, left: x, top: y },
        { input: thumb, left: x, top: y + 26 },
      );
    }
    await sharp({
      create: {
        width: 1200,
        height: Math.ceil(chunk.length / 4) * th,
        channels: 3,
        background: "#ddd8cf",
      },
    })
      .composite(tiles)
      .png()
      .toFile(`${out}/sheets/all-${width}-${1 + start / 12}.png`);
  }
}
const motion = JSON.parse(
  await fs.readFile(out + "/motion/timings.json", "utf8"),
);
const perf = JSON.parse(
  await fs.readFile(out + "/performance-final/summary.json", "utf8"),
);
const table = routes
  .map(
    (route) =>
      `<details ${["/", "/works", "/demos/cafe", "/demos/inbox", "/demos/admin", "/demos/booking", "/contact"].includes(route) ? "open" : ""}><summary>${esc(route)}</summary><p><a href="http://127.0.0.1:3147${route}">ローカル実画面</a></p>${[390, 768, 1440].map((width) => `<h3>${width}px</h3><div class="pair">${before.results.some((r) => r.route === route) ? `<figure><a href="before/${key(route)}-${width}-full.png"><img loading="lazy" src="before/${key(route)}-${width}-firstview.png" alt="${esc(route)} 変更前 ${width}px"></a><figcaption>BEFORE / 8f57c92 — クリックで全体</figcaption></figure>` : "<p>新規ページ</p>"}<figure><a href="after/${key(route)}-${width}-full.png"><img loading="lazy" src="after/${key(route)}-${width}-firstview.png" alt="${esc(route)} 変更後 ${width}px"></a><figcaption>AFTER — クリックで全体</figcaption></figure></div>`).join("")}</details>`,
  )
  .join("");
const html = `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TSUDOWA — FINAL MASTER OWNER REVIEW</title><style>body{margin:0;background:#171714;color:#e8e1d6;font:15px/1.8 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:60px 24px}h1{font-size:clamp(32px,6vw,72px);line-height:1.1;letter-spacing:-.04em}h2{margin-top:64px}a{color:#efd0a4}summary{cursor:pointer;font-size:22px;padding:22px 0}details{border-top:1px solid #49443a;margin-top:24px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}figure{margin:0}img{max-width:100%;height:auto;display:block;max-height:520px;object-fit:contain;object-position:top left}figcaption{font-size:12px;margin:12px 0 36px}video{width:100%;max-height:650px;background:#000}th,td{text-align:left;padding:10px;border-bottom:1px solid #49443a}li{margin:8px 0}.notice{border-left:3px solid #d4b48c;padding:18px;background:#26251f}@media(max-width:700px){.pair{grid-template-columns:1fr}main{padding:32px 18px}}</style><main><p>LOCAL ONLY / NOT DEPLOYED</p><h1>TSUDOWA<br>FINAL MASTER REVIEW.</h1><p>制作領域・個別デモ・営業受付をまとめて確認する、OWNER専用の比較資料です。</p><p><a href="http://127.0.0.1:3147/">サイトを開く</a> · <a href="FINAL_REPORT.md">30項目の最終報告</a> · <a href="../../work/tsudowa-repo/docs/FINAL_MASTER_AUDIT.md">全ページ監査表</a> · <a href="links-seo.json">リンク・SEO</a> · <a href="after/audit.json">147画面検査</a></p><div class="notice">ローカルではメール送信を無効にしています。成功画面・自動返信はモック検証です。LCP目標2.5秒以下は未達のページがあり、実測値を下に残しています。画面の営業力と写真の細部はOWNERの最終判断です。</div><h2>OWNER CHECKLIST</h2><ul>${["first impression", "premium feel", "realism of imagery", "typography", "spacing", "motion quality", "CTA clarity", "TSUDOWA → TETSU WORKS hierarchy", "mobile quality", "依頼したいと思えるか"].map((x) => `<li><label><input type="checkbox"> ${x}</label></li>`).join("")}</ul><p>チェックはこの表示内だけで、外部へ送信しません。</p><h2>Motion / hover / scroll</h2>${motion.records.map((r) => `<h3>${r.name.toUpperCase()}</h3><video controls preload="none" src="motion/${r.video}"></video>`).join("")}<p><a href="motion/timings.json">CSS時間・transitionイベント・連続フレーム一覧</a>。録画の撮影間隔をアニメーション時間と同一視しません。</p><h2>Mobile simulated performance</h2><table><thead><tr><th>Route</th><th>LCP</th><th>CLS</th><th>TBT</th><th>Score</th></tr></thead><tbody>${perf.results.map((r) => `<tr><td>${r.route}</td><td>${(r.lcp / 1000).toFixed(2)}s</td><td>${r.cls.toFixed(3)}</td><td>${r.tbt.toFixed(0)}ms</td><td>${r.scores.performance}</td></tr>`).join("")}</tbody></table><p>ローカル本番相当・Lighthouse mobile simulation。実ユーザーのCore Web Vitalsではありません。</p><h2>Before / After — 49 routes × 3 sizes</h2><p>初期画面は通常描画。全体画像は撮影時のみcontent-visibilityによる画面外省略を解除し、デコード後に取得。コードのレイアウト変更を隠す加工は行っていません。</p>${table}</main></html>`;
const withContactEvidence = html.replace(
  "<h2>OWNER CHECKLIST</h2>",
  `<h2>営業受付の比較・メール見本</h2><p>ここは架空の入力・モック成功結果です。メールは送信していません。</p><ul><li>旧TOP内フォーム: <a href="before/contact-390-top-ending.png">390px</a> / <a href="before/contact-1440-top-ending.png">1440px</a></li><li>新フォーム: <a href="after/contact-390-full.png">390px全体</a> / <a href="after/contact-1440-full.png">1440px全体</a></li><li>成功画面: <a href="contact-success-mobile.png">390px</a> / <a href="contact-success-tablet.png">768px</a> / <a href="contact-success-desktop.png">1440px</a></li><li><a href="email/owner-notification.txt">OWNER受付票</a> / <a href="email/visitor-receipt.html">相談者の自動受付メール</a> / <a href="email/envelopes.json">From・To・Reply-To</a></li><li><a href="native-scroll-form.json">通常scroll・フォームfocus・tap target</a> / <a href="integrity.json">既存成果・format debtの保全</a> / <a href="FINAL_CHECKPOINT.json">最終HEADとの証拠対応</a></li></ul><h2>OWNER CHECKLIST</h2>`,
);
await fs.writeFile(out + "/OWNER_REVIEW.html", withContactEvidence);
console.log("Owner gallery and 10 contact sheets created");
