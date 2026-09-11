# Figma営業UI / 2026-09-11

基準: [Portfolio Sales UI — Tetsu Works](https://www.figma.com/design/bv0O39N0hmW8bxMSYlwY0n)。MCPで実ファイルのページを読み込み、`get_design_context`のコード・画像・色・座標を確認して実装。Figmaファイルは編集していません。

## 対応表

| Figma frame                                         | 実装                                 |
| --------------------------------------------------- | ------------------------------------ |
| 1:3 / 1:110 Desktop・Mobile Hero + Service Selector | `/` のHero・Trust Panel・8カテゴリ   |
| 3:2 / 3:142 Featured Works                          | `/` の代表4作品、2列／1列カード      |
| 3:122 What you get                                  | `/` のDELIVERY・料金・メッセージ進行 |
| 4:3 / 4:233 KISSA                                   | `/projects/cafe`                     |
| 4:56 / 4:268 FLOWSTATE                              | `/projects/saas`                     |
| 4:111 / 4:305 FORME                                 | `/projects/ec`                       |
| 4:165 / 4:341 SMART INBOX                           | `/projects/inbox`                    |

最初のmetadata取得ではPage 1のみ見えたため、ページを明示的にロードして実フレームを取得。想像での代替実装ではありません。

## デザインと営業上の判断

- 背景 `#0b0d0c`、パネル `#121512`、文字 `#f3f1e9`、補足 `#a6aaa2`、アクセント `#b7f36b`、境界 `#2a302a`。英語Hero・ブランド・カテゴリ見出しにはInterをローカルWOFF2で配信。日本語本文は既存のシステムゴシック体を使い、不要なフォント切替を抑えます。
- Desktopは最大1440px、左右80px、Hero 82px、4列カテゴリ、2列作品、20〜28pxの角丸。Mobileは左右20px、Hero46px前後、単一Hero CTA、圧縮Trust、縦カテゴリ、スマートフォンプレビュー優先。
- ケースごとのFigma配色を維持: KISSA 深緑＋暖色、FLOWSTATE 黒＋ライム、FORME 明色＋深緑、SMART INBOX 濃紺＋シアン。共通サイトの構造と各制作物の世界観を分離。
- Figmaの固定座標による文字の重なり・クリップは再現せず、内容に応じて伸びるGrid/Flexへ変換。日本語改行・最低44pxの主要タップ領域・focus・reduced motionを維持。
- Figmaの模擬ブラウザ図は、既存デモの実画面WebPへ置換。Figmaから画像素材を再描画したものではありません。実際に操作できる内容とカードを一致させます。
- Trust内の「QA 100」は保証と誤解されるため使わず、納品ファイルと確認結果を表示。期限が切れる「9月中納品」も使わず、仕様・素材確認後の参考納期を表示。
- ECの価格とAIの納期は、Figmaの固定価格／日数より今回の明示指示を優先し、内容・要件で見積としています。
- SMART INBOXはAI導入時の業務設計例。固定ルール・定型文のローカル処理であり、実AIやメール送信を装いません。

## URLとデータ

`src/lib/portfolio.ts`が11作品と12カテゴリの正本。slug変更なし。`src/lib/sales-ui.ts`の`selectedSlugs`でトップの4作品だけを選定し、従来の8作品の撮影fixtureは維持します。

`/works`を全作品・全カテゴリの一覧として追加。既存12カテゴリはそのままです。トップの8分類は web / lp / ec / apps / automation / api / design / qa に対応。残りのcoding / nextjs / responsive / improvementも全一覧からアクセス可能。

料金と納品情報はそれぞれ `data-price-info` / `data-delivery-info` で実際の閲覧を計測。各イベントはページ表示につき一度。カテゴリURLと一覧フィルタでcategory_view、詳細URLでproject_open、Live Demoリンクでlive_demo_clickを記録します。サーバーallowlist・匿名source・OFF/DNT/GPC・共有上限は維持。本文や連絡先は計測へ渡しません。

## 維持した境界

Netlify設定、環境変数名、productionチェック、contact API、Resend・Turnstile・Redisの保護、Sentryの秘匿化、PostHogのサーバー転送を変更していません。CONTACT_ENABLED=falseでも相談文コピーが使えます。新規課金・外部サービス・直接連絡先の追加はありません。

`sales-ui.css`の営業用配色は`.sales-ui`内に限定。共有ヘッダー／フッターのブランドのみ更新し、CSV・inbox・admin等の操作領域とロジックを保持。

## 再検証

`npm run verify`、`npm run test:e2e`、`npm run screenshots`、`npm run qa:visual`、`npm run qa:design`、`npm run qa:links`、`npm run qa:performance`、`npm run format:check`。

`qa:design`はトップ・全一覧・代表4詳細を320/390/768/1440pxでaxe、focus、console/runtime検査し、Desktop/Mobileの各セクションも撮影します。Figma画像と実装画像を目視比較し、形・情報順・余白を確認。ピクセル一致の自動テストではありません。

文字やナビ変更に伴い既存E2Eのトップ→全一覧→CSV詳細の操作を更新。12カテゴリの正確な作品集合・11詳細・すべてのデモ操作・フォーム安全性のassertionは維持。新テストは4作品・8カテゴリ・価格・納品物・モバイル順序を追加検査します。

性能は[Next.jsのローカルフォント機構](https://nextjs.org/docs/app/getting-started/fonts)を使用。Lighthouseは[公式のスコア説明](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)どおり測定条件で変動するため、ローカルのラボ計測と本番実トラフィックを区別します。最終数値は[RELEASE_QA](RELEASE_QA.md)を参照。

ホームの画面外セクションには `content-visibility: auto` を使用。QAでは実際に各セクションへスクロールしてaxeを実行した後、全要素を描画して画像欠落・overflow・full-page画像を確認します。分析OFF/DNT/GPC時にはイベント送信に加え、DOM監視も開始しません。
