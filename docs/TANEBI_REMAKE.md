# TANEBI WORKS — FULL REMAKE

TETSU / WORKS を TANEBI の制作・受託部門 **TANEBI WORKS** として作り直した記録です。

**本番は変更していません。** merge / push / deploy / DNS / redirect / MX、いずれも未実行。

---

## 完了状態（指示書24章）

```text
TANEBI_MASTER_BRAND_ICON        IMPLEMENTED
TANEBI_WORKS_BRAND              IMPLEMENTED
HQ_DESIGN_DNA_APPLIED           PASS
TOP_PAGE_REDESIGN               IMPLEMENTED
SERVICE_PRESENTATION            IMPLEMENTED
PORTFOLIO_CLASSIFICATION        PASS
RESPONSIVE                      PASS
ACCESSIBILITY                   PASS
VISUAL_QA                       PASS
FAVICON_ICON_SET                PASS
OGP                             PASS
EXISTING_37_URLS                PASS
PRODUCT_IDENTITIES              UNCHANGED
CONTACT_FLOW                    PASS
SEO_CURRENT_DOMAIN              PASS
WORKS_TANEBI_MIGRATION          READY_NOT_LIVE
PRODUCTION                      NOT_CHANGED
ADDITIONAL_SPEND                0
```

---

## 何が変わったか

### 1. ブランドアイコン

**変更前**: faviconが存在しない。app iconは前ブランドのライムグリーンの「TW」SVG。

**変更後**: TANEBI MASTER BRAND ICON に統一。詳細は [BRAND_ICON.md](./BRAND_ICON.md)。

原本1枚から crop / resize / padding / format変換 **のみ** で全サイズを生成しています。
描き直しはしていません。2つ目の絵は2つ目のブランドになるからです。

旧 `icon.svg` は「置き換え」ではなく**削除**が必要でした。`sizes="any"` で配信され、
ブラウザが新しい `.ico` より優先するため、残すとタブはライムのままでした。

### 2. 配色 — ライムグリーンから ember へ

TANEBI HQ は暖色のaccentを1つだけ持ちます。WORKS は寒色のライムでした。
同じ人が運営する、別ブランドに見えていました。

accentは3種類（`#b7f36b` / `#c7ff63` / `#d8ed9e`）が混在していましたが、
**原本から実測した** `#fcbe69` 1色に統合しました（地の色に対し 11.6:1）。

置換31箇所はすべてブランドchromeの4ファイルに閉じています。
`project-visuals.css` と `showcase.css` には**該当色が0件**のため、
制作例の見た目は一切変わっていません。

### 3. TANEBIとの関係

**変更前**: TANEBI WORKS が TANEBI に属することを示す記述が**どこにもありませんでした。**

**変更後**:

```text
header   TANEBI WORKS  A TANEBI SERVICE
footer   TANEBI WORKS は TANEBI の制作・受託部門です。
```

`tanebi.jp` へは**リンクしていません。** HQ が未公開だからです。
実際の問い合わせを受けるサイトが、応答しないドメインへの外部リンクを出すべきではありません。
`src/lib/brand.ts` の `PARENT_SITE_IS_LIVE` を true にすればリンクになります。

ヒーローの三語は `WEB / AI / AUTOMATION` に統一しました。
これは HQ が WORKS を説明するときに使っている語と同じです。

### 4. サービスの見せ方

指示書8章の9項目のうち、7項目は既にありました。欠けていた2つを追加:

| 追加           | 根拠                                                     |
| -------------- | -------------------------------------------------------- |
| 向いている依頼 | 各カテゴリの既存 scope / description の言い換え          |
| 含まれないもの | 既存の「必要素材」= お客様がご用意するもの、の論理的帰結 |

**価格・納期・納品内容・修正条件は1つも新設していません。** すべて既存の商品定義が正本です。
「対象外」を創作することは契約条件を創作することなので、行っていません。

### 5. Accessibility

計測して見つけた不具合を修正:

| 不具合                 | 実測           | 修正後          |
| ---------------------- | -------------- | --------------- |
| headerの親ブランド表記 | 2.08:1         | 10.39:1         |
| footerの親ブランド文   | 2.01:1（9px）  | 10.04:1（12px） |
| 本文中テキストリンク   | 高さ20〜22px   | min-height 28px |
| skip link              | 旧パレットの緑 | ember           |

最初の2つは**今回の作業で作り込んだ不具合**です。`--hub-muted` を使いましたが、
header と footer は `.sales-ui` の**外**にあり、そこではライトテーマ側の
`#4a423a` に解決されていました。CSSを読むだけでは見つかりません。

---

## 検証

```text
lint / typecheck / 50 tests / production build     すべて成功
sitemap                                            37件（本番と一致・増減なし）
全37URLのランタイム応答                             37/37 が 200
ビルド後HTML "TANEBI WORKS"                        39枚中38枚（残り1枚はNext.js内部の500ページ）
ビルド後HTML "TETSU / WORKS"                       0件
"A TANEBI SERVICE"                                 38枚
Visual QA 8ページ × 390/768/1276/1440              32チェック・問題0
```

Visual QA の内訳（各ページ・各幅で確認）:

```text
横スクロール無し / タップ対象24px以上 / 見出しレベルの飛びなし
alt欠落なし / 名前の無いボタン・リンクなし / h1はページに1つ
ブランド表記あり / 親ブランド表記あり / 旧ブランド0件
```

スクリーンショット: `docs/screenshots/tanebi-remake/`

### 触っていないもの

```text
productId / serviceId / categoryId / slug    無変更
既存37URL・URL構造                            無変更
価格・納期・修正条件・納品物                    無変更
問い合わせ経路（/#contact）                    無変更。/contact は404のまま
sitemap.ts / robots.ts / api/contact          無変更
デモ画面の配色・操作                           無変更（作品そのものなので）
TSUKUTTA LAB                                  無関係・未変更
TANEBI HQ                                     読み取りのみ
```

---

## 実測した幅での注意点（意図的な挙動・未変更）

```text
390px ヒーローの "AUTOMATE." が右余白いっぱいに達する
  → 左端揃えの大型タイポとして意図的。切れていない
390px 制作例カードのデスクトップ画像が右で切れる
  → .project-preview の overflow:hidden。スマホモックを重ねる構図
デモ画面のfocusリングが緑
  → 作品ごとのデザイン言語。:focus-within で可視。変更すると作品が変わる
```

---

## 本人が次にすること

1. ローカルpreviewで確認（下記command）
2. `tanebi/works-brand-rename` をレビュー
3. 取り込み先は **`codex/portfolio-sales-hub-v2`**（Netlifyの本番配信元。`main` ではありません）

```bash
cd C:\Users\tetsu\tanebi-works-rename
set NEXT_PUBLIC_SITE_URL=https://tetsuworks.com
npm run build
npx next start -p 3100
```

→ http://127.0.0.1:3100/

`NEXT_PUBLIC_SITE_URL` を省くと canonical と sitemap が localhost になります。
本番同等の確認には必ず指定してください（Netlifyは環境変数で供給しています）。
