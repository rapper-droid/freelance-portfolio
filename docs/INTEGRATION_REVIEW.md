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

---

## 7. 追記：TANEBI SIGNATURE EFFECTS 統合後の再検証（V2・26/27章）

演出を実装したあと、同じ統合branchへ取り込んで再検証しました。

```text
統合branch HEAD   10b4152
基点              codex/portfolio-sales-hub-v2 @ ce03541（変わらず）
差分              42 files changed, 1924 insertions(+), 126 deletions(-)
merge conflict    0件
本番branchに取り残されたcommit   0件
```

### 再検証の結果

```text
lint / typecheck / 50 tests / build / check-production   すべて PASS
全37URL                                                  37/37 が 200
sitemap / robots / canonical / OGP / favicon              変化なし
sitemap.ts / robots.ts / next.config.ts / netlify.toml    本番branchと同一
package.json / api/contact                                本番branchと同一
categoryId / slug / price / duration                      UNCHANGED
Visual QA 6ページ × 390/768/1276/1440                     24チェック・問題0
性能（スクロール中）                                       中央値16.7ms / p95 17.1ms / 最悪17.4ms
canvas / 無限ループanimation                               0 / 0
JS無効時のfail-safe                                        data-reveal-ready が0（＝全部表示）
```

### 計測中に見つけて直したこと

`.sales-quality` が**画面内にあるのに opacity 0 のまま留まる瞬間**がありました。
「最終的に全部表示されるか」だけを見ていたら通過していた不具合です。
到着前に発火するよう変更し、再計測で 0回 になっています。

### 計測環境について（判断を誤りかけた点）

一度、ブラウザのレンダラが応答不能になった状態で計測し、
「reveal が一切発火せず price-grid が空白」という**誤った結果**を得ました。
タブを作り直して再計測したところ正常に動作しており、
その後の数値はすべてクリーンな環境で取り直しています。
異常値をそのまま不具合として報告・修正しなかったのは、
同じ測定を別コンテキストで再現できなかったためです。

### 判定（変更なし）

```text
SAFE_TO_MERGE        マージ整合性・既存資産の保全・ビルド・テスト・URL・SEO・a11y・性能
NEEDS_FIX            なし
NEEDS_OWNER_REVIEW   4件（4.1〜4.4）＋ TANEBI_SIGNATURE_FEEL
```

`TANEBI_SIGNATURE_FEEL` は指示書27章の指定により**自己判定していません。**

---

## 8. 追記：図・カフェデモ・実メール送信（品質強化ラウンド）

### 追加した図（すべてサイト内ネイティブ）

| 図                  | 場所                                   | 目的                                                                |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| Pipeline（工程）    | `/` と全カテゴリの「依頼から納品まで」 | 10工程を4フェーズに束ねて全体像を掴めるように                       |
| Pipeline（自動化）  | `/works/automation`                    | 「自動化の流れが分からない」への回答。人が確認する工程をemberで強調 |
| Pipeline（API連携） | `/works/api`                           | 落ちたときにどうするかまで含めた流れ                                |
| Pipeline（QA）      | `/works/qa`                            | 何をどう確認するか                                                  |
| Before → After      | `/works/improvement`                   | 「Before/Afterが分からない」への回答                                |
| Before → After      | `/works/responsive`                    | 同上                                                                |
| 商品アート 12種     | `/demos/cafe`                          | 各メニューの見分け                                                  |
| アクセス概略図      | `/demos/cafe`                          | 駅からの位置関係                                                    |

**画像に文字を焼き込んでいません。** すべて意味のあるHTML（`ol` / `dl` / `figure`）を
図として見えるようにスタイルしたもので、CSSを外しても・読み上げでも情報は残ります。

### カフェデモ

```text
メニュー      3品 → 12品（英名・和名・説明・価格・HOT/ICE・タグ）
おすすめ      新設（大きく見せる1品）
店舗          新設（店内・カウンター）
アクセス      新設（営業時間・住所・席数・電話・概略図）
HERO          営業時間と場所を追加（以前はフッターにしか無し）
```

### 写真について

**実写ストック写真は導入していません。** 出典・ライセンスを記録できる形で
取得する手段が確認できなかったためです。詳細と、本人が入れる場合の手順は
`docs/IMAGE_SOURCES.md` にあります。商品画像はSVGで描いています。

**このラウンドで画像ファイルは1つも増えていません**（`public/` は 6.1MB のまま）。

### 実メール送信

構成は元から完成していました（Resend REST / Turnstile / レート制限 / 冪等性 / 送信上限）。
足したのは**メール本文の中身**です。名前・会社名・送信元ページ・受信日時・受付番号を追加し、
件名は `headerSafe()` を通しています。詳細は `docs/CONTACT_EMAIL.md`。

**credential が無いため実送信テストは未実施**です。値は作っていません（`NEEDS_OWNER_CONFIG`）。

### 他のデモについて

カフェだけ厚くならないよう全11デモを確認しました。結論として**作り分けが必要**です。

```text
csv / inbox / admin / booking   業務ツール。単一画面で操作するもの
                                → dashboard・状態・操作が既にあり、節を増やすのは誤り
saas / ec / creative            ページ型。既に複数節あり
cafe                            集客サイト。内容の厚みが商品そのもの → 今回厚くした
```

booking は日付選択・検索・統計カード・予約一覧・12個の操作要素を持つ実働ダッシュボードで、
ワイヤーフレームではありません。業種に必要な形が違うため、同じ節数には揃えていません。

### 検証

```text
lint / typecheck / 51 tests / build / check-production   PASS
全37URL                                                  37/37 が 200
canonical / robots / sitemap / OGP                       変化なし
categoryId / slug / price / duration / materials         UNCHANGED
sitemap.ts / robots.ts / next.config.ts / netlify.toml   本番branchと同一
package.json / package-lock.json                         同一（依存追加なし）
Visual QA 6ページ × 390/768/1024/1440                    24チェック・問題0
スクロール性能 `/` と `/demos/cafe`                       中央値16.7ms / 最悪17.0ms / longtask 0
```

### 計測で「不具合に見えたが不具合でなかった」もの

```text
画像が壊れている        → 全URLが 200 image/jpeg。iframe計測側の未デコード
ホームの文字重なり      → 片方の実効opacityが0。見えない要素同士
段落の重なり26件        → 折りたたみFAQの回答（clip済み）。実画面は正常
```

いずれも**修正していません。** 存在しない不具合を直すほうが危険なためです。

---

## 9. 追記：visual direction upgrade

### art direction を先に決めた

素材を増やす前に `docs/ART_DIRECTION.md` を作りました。
優先順位は **理解しやすさ > 信用 > TANEBIらしさ > 演出**。
色・余白・角丸・面の扱い・emberの強さ・4種類のビジュアルの役割を固定しています。

### 追加した視覚要素

| 要素                            | 場所                                   | 種類                   |
| ------------------------------- | -------------------------------------- | ---------------------- |
| Phaseカード4枚（アイコン付き）  | `/` と全カテゴリの「依頼から納品まで」 | ネイティブ（HTML+SVG） |
| カテゴリキービジュアル 12枚     | `/works/*` 全12ページ                  | 生成画像（36KB）       |
| Pipeline図 3種                  | automation / api / qa                  | ネイティブ             |
| Before→After図 2種              | improvement / responsive               | ネイティブ             |
| 商品アート 12種・アクセス概略図 | `/demos/cafe`                          | ネイティブSVG          |

### 再設計したセクション

**「依頼から納品まで」** — 細線＋番号＋10項目の羅列から、4枚のカードへ。

```text
before  枠線だけ / 10工程が2回出てくる / 補足文が右上に浮く
after   面のあるカード / 各フェーズが自分の工程を持つ（重複解消）
        「ご確認いただく場面」をemberで明示 / 補足文をリードへ統合
```

一番効いたのは**「枠だけ」をやめて「面」を持たせた**ことです。
資料っぽさの主因はそこでした。

依頼者が動く場面（範囲合意・確認用URL・納品確認）を強調したのは、
「いつ何を確認するのか」がこのセクションの存在理由だからです。

### AI生成・実写・SVGの役割分担

```text
ネイティブ図解   工程・自動化・API・QA・比較   情報を持つもの。画像にしない
生成キービジュアル カテゴリの世界観            装飾。aria-hidden + 空alt
SVG商品アート     カフェのメニュー            架空店舗なので撮影対象が無い
UIモック・写真    制作例・店舗                既存資産
```

**実写ストック写真は今回も導入していません。**
出典・ライセンスを記録できる形で取得できないためです（`docs/IMAGE_SOURCES.md`）。

**有料AI画像生成も使っていません。** 本指示書は生成を許可していますが、
「追加クレジット消費をしない」という継続中の制約が解除されていないため、
**支出を伴う判断は本人に残しました。** 代わりに生成スクリプトで作っています。

### 検証

```text
lint / typecheck / 51 tests / build / check-production   PASS
全37URL                                                  37/37 が 200
categoryId / slug / price / duration / materials         UNCHANGED
sitemap.ts / robots.ts / next.config.ts / netlify.toml   本番branchと同一
package.json / package-lock.json                         同一（依存追加なし）
Visual QA 8ページ × 390/768/1024/1440                    32チェック・問題0
性能 /works/automation                                   中央値16.7ms / 最悪16.8ms
longtask                                                 0件
CLS                                                      0
キービジュアル12枚の合計                                   48KB
```

### 直した不具合

```text
帯の幅が890pxで止まる   aspect-ratio と max-height の併用で
                        幅が高さから逆算されていた。高さを明示して解決（1276/1276）
確認パネルの位置ずれ     フェーズごとの工程数が違い、パネルが揃わなかった。
                        カードをflex columnにして下端固定（569/569/569）
```
