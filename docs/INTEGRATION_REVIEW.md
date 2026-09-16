# 統合確認 — tanebi/works-integration-review

本番branch `codex/portfolio-sales-hub-v2` を基点に、TANEBI WORKS リメイクを統合して再検証した記録です。

**本番は変更していません。** push / merge / Netlify deploy / DNS / redirect / canonical切替、いずれも未実行。

```text
統合branch  tanebi/works-integration-review
HEAD        320ffee
基点        codex/portfolio-sales-hub-v2 @ ce03541（Netlifyの本番配信元）
統合元      tanebi/works-brand-rename @ 6b530a2
差分        37 files changed, 838 insertions(+), 118 deletions(-)
```

---

## 判定

```text
SAFE_TO_MERGE        マージ整合性・既存資産の保全・ビルド・テスト・URL・SEO・a11y
NEEDS_FIX            なし
NEEDS_OWNER_REVIEW   4件（下記）
```

**SAFE_TO_MERGE ですが、自動mergeはしていません。** 本人確認待ちです。

---

## 1. 本番branch側の変更が消えていないこと

これが最重要の確認でした。結論は**消えていません**。

```text
本番branchにだけ存在するcommit          0件（ローカル・origin 両方）
origin/codex/portfolio-sales-hub-v2     ce03541（fetch実施。remoteは動いていない）
merge-base                              ce03541 = 本番branchそのもの
merge conflict                          0件
```

`codex/portfolio-sales-hub-v2` は統合branchの**祖先**です。
つまり本番branchのcommitは1つ残らず含まれており、
「古いから不要」と判断して削除したcommitは**ありません**。

fast-forward できる関係ですが、`--no-ff` で明示的なmerge commitを作りました。
統合したという事実を履歴から消さないためです。

### リポジトリ内の全refを確認

```text
origin/codex/portfolio-sales-hub-v2   統合branchに完全に含まれる
origin/codex/portfolio-final-art-direction   同上
origin/codex/portfolio-figma-sales-ui        同上
origin/main / main                            同上（mainにだけあるcommitは0件）
```

**どのbranchにも、統合branchに無い変更はありません。**

### 削除したファイル（意図的・2件のみ）

```text
src/app/icon.svg        旧ブランドのライム「TW」アイコン
public/brand/tw-mark.svg 同上のSVG
```

`icon.svg` は `sizes="any"` で配信され、ブラウザが新しい `.ico` より優先します。
残すとタブが旧ブランドのままになるため、置き換えではなく削除が必要でした。
これ以外の削除はありません（modified 15 / added 20 / deleted 2）。

---

## 2. 既存資産・identity

```text
categoryId   12件   UNCHANGED
slug         11件   UNCHANGED
price        23件   UNCHANGED
duration     23件   UNCHANGED
materials    12件   UNCHANGED
deliverables        UNCHANGED（改行コード差のみ。内容一致）
limitation   11件   UNCHANGED
```

`src/lib/portfolio.ts` の差分は **+12 / -0**。
追加された12行はすべて `audience:`（向いている依頼）で、**削除行は0**です。

### 設定・経路ファイルは本番branchとバイト単位で同一

```text
src/app/sitemap.ts          identical
src/app/robots.ts           identical
next.config.ts              identical
netlify.toml                identical
src/app/api/contact/route.ts identical
package.json                identical
package-lock.json           identical   ← 依存関係の変更なし
src/lib/sales-ui.ts         identical
```

---

## 3. 検証結果

```text
lint                      PASS
typecheck                 PASS
tests                     50 passed / 8 files
production build          PASS（45ページ生成）
check-production.mjs      PASS（Netlifyのdeploy前ゲート）
```

### URL・SEO

```text
sitemap                   37件。改名前の本番と同一（md5一致）
全37URL                   37/37 が 200
robots.txt                Sitemap: https://tetsuworks.com/sitemap.xml
canonical                 https://tetsuworks.com
og:url / og:image         https://tetsuworks.com（絶対URL）
/#contact                 home に id="contact" あり
/contact                  404（正式導線ではないため、作っていない）
```

### ブランド資産

```text
/favicon.ico                  200 image/x-icon
/icon.png                     200 image/png
/apple-icon.png               200 image/png
/og.png                       200 image/png
/site.webmanifest             200 application/manifest+json
/brand/tanebi-mark.png        200 image/png
/icons/icon-maskable-512.png  200 image/png
```

```text
ビルド後HTML "TANEBI WORKS"       39枚中38枚
ビルド後HTML "A TANEBI SERVICE"   39枚中38枚
ビルド後HTML "TETSU / WORKS"      0件
```

残り1枚は Next.js 内部の `_global-error` ページ（サイトのchromeを持ちません）。

### Visual QA / Accessibility

10ページ × 390 / 768 / 1276 / 1440px = **40チェック、問題0**。

```text
横スクロール無し / タップ対象24px以上 / 見出しレベルの飛びなし
alt欠落なし / 名前の無いボタン・リンクなし / h1は各ページ1つ
ブランド表記あり / 親ブランド表記あり / 旧ブランド0件
```

コントラスト（実測・すべて4.5:1以上）:

```text
17.02:1  header ブランド名
11.98:1  primary button / footer domain
10.39:1  header 親ブランド表記 / 本文 / honesty-note
10.04:1  footer 親ブランド文 / footer small
```

---

## 4. NEEDS_OWNER_REVIEW（4件）

いずれも**このリメイクが原因ではなく**、本人の判断が要る事項です。

### 4.1 本番がfeature branchから配信されている

Netlify の配信元は `codex/portfolio-sales-hub-v2` です。`main` ではありません。
統合branchは本番branchを基点にしているため今回は問題ありませんが、
「本番をどのbranchにするか」は運用judgementです。

なお `main` にだけ存在するcommitは0件なので、**どちらを選んでも失われる変更はありません。**

### 4.2 format:check が repo全体で失敗する（既存・deploy経路外）

```text
統合branch   108 files で失敗
本番branch   108 files で失敗   ← 同一。今回持ち込んだものではない
```

原因は `core.autocrlf` によるCRLFと、prettier既定の `endOfLine: "lf"` の不一致です。
`tsconfig.json` など今回触っていないファイルも失敗します。

**deploy経路には入っていません**（`netlify.toml` → `build:production` → `check-production && next build`）。
`verify` にも含まれず、`verify:all` にのみ含まれます。

修正すると108ファイルが変更され、今回のレビュー差分が埋もれます。
別件として扱うべきと判断し、**触っていません。**

### 4.3 tanebi.jp へのリンクは無効のまま

HQ が未公開のため、親ブランド名はテキストのみでリンクしていません。
`src/lib/brand.ts` の `PARENT_SITE_IS_LIVE` を `true` にすればリンクになります。

### 4.4 ブランド変更そのものの承認

実際に仕事を受けている稼働サイトの見た目とブランド名が変わります。
技術的な検証は通っていますが、**出すかどうかは本人の判断です。**

---

## 5. 本人の確認手順

```bash
# 統合確認ビルド
cd C:\Users\tetsu\tanebi-works-integration
set NEXT_PUBLIC_SITE_URL=https://tetsuworks.com
npx next start -p 3102
```

→ http://127.0.0.1:3102/

リメイクbranch単体のpreviewは http://127.0.0.1:3100/ に維持しています。
両者のビルド出力は一致します（統合branchのtreeは `tanebi/works-brand-rename` と同一）。

---

## 6. していないこと

```text
push                          していない（7 commits が origin に存在しない）
production branch へのmerge    していない
Netlify deploy                していない
DNS変更                        していない
redirect有効化                 していない
canonical domain切替           していない
本番branchのcommit削除          していない（0件）
```
