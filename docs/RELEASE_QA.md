# Figma営業UI — 品質記録

2026-09-11。対象ブランチ `codex/portfolio-figma-sales-ui`。開始点 `b3c1781` の既存機能・テストを引き継ぎ、Figma実ファイルを読んで営業UIを更新しました。

## 実行結果

| 検証                               | 結果                                                                  |
| ---------------------------------- | --------------------------------------------------------------------- |
| prettier / format:check            | 成功                                                                  |
| ESLint / Next typegen / TypeScript | 成功                                                                  |
| Vitest                             | 50件・8ファイル、全成功（既存45件を保持）                             |
| Next production build              | 成功。公開URL・contact/analytics OFFで本番用設定検査も成功            |
| Playwright E2E                     | 66件、全成功（既存60件の機能検査を保持）                              |
| Visual QA                          | 37ルート × 320/390/768/1440px = 148画面                               |
| 画像・console・runtime・横はみ出し | 148画面で欠落/エラー/overflow 0                                       |
| Figma対応UIのaxe / focus           | トップ・全一覧・代表4詳細 × 4幅 = 24画面、違反0                       |
| 内部リンク                         | 120リンク/アンカー、全正常                                            |
| 画像                               | 主要8作品40枚・11作品×3幅のプレビュー33枚、営業UIセクション画像を生成 |
| npm audit --omit=dev               | vulnerabilities 0                                                     |
| Git diff --check                   | 成功                                                                  |

実行レポートは下記リンクを参照。E2Eはdesktop/tablet/mobileのChromium、Visual QAは実機相当viewportです。実機Safari/Androidでの検証とは区別します。問い合わせの送信系はモックで検証し、実メール到達・CAPTCHA接続は今回実行していません。

## 維持した機能・安全性

- 11作品、12カテゴリURL、CSV/inbox/adminを含む全デモと操作テストを保持。
- Netlify設定、環境変数、セキュリティヘッダー、contact API、入力検証、Turnstile、共有rate limit、送信上限、idempotency、失敗時の入力保持は変更なし。
- CONTACT_ENABLED=falseでも相談文コピーを提供。公開ページに連絡先や外部直接契約フォームを追加していません。
- PostHogの匿名イベント・許可されたsource分類・サーバーallowlist、Sentryの秘密情報除去を維持。料金と納品情報の表示を別々に計測し、OFF/DNT/GPC時にはDOM監視も開始しません。
- メタデータ・canonical・OGP・robots・sitemapを保持し、全一覧URLを追加。

## Figma / Visual確認

Hero、8カテゴリ、代表4作品、ケーススタディ、料金、納品物を、FigmaのDesktop/Mobileフレームと実装の撮影画像で目視比較。固定座標による文字重なりは再現せず、可変高・44px以上の主要タップ領域へ変換しました。

修正点: 暗い背景の戻るリンクのcontrast、狭い画面の料金見出しの折返し、プレビューの旧ブランドキャッシュを修正。実デモを撮影したバージョン付きWebPを使用し、Figmaの模擬図と実際の機能を混同しません。画面外のcontent-visibility最適化は、スクロールしてaxeを検査した後、全要素を描画して欠損検査・full-page撮影します。

テスト削除・skip追加・閾値緩和なし。トップの全件表示をALL WORKSへ移したため、既存の操作経路と文言を合理的に更新し、全11件・12カテゴリの正確な集合の検証は維持しています。

## Lighthouse（Windows・ローカル本番ビルド）

| ページ            | Performance | Accessibility | Best Practices | SEO | LCP    | CLS | TBT   |
| ----------------- | ----------- | ------------- | -------------- | --- | ------ | --- | ----- |
| `/`               | 81          | 100           | 100            | 100 | 2.11秒 | 0   | 742ms |
| `/works`          | 95          | 100           | 100            | 100 | 2.81秒 | 0   | 125ms |
| `/works/lp`       | 93          | 100           | 100            | 100 | 2.98秒 | 0   | 112ms |
| `/projects/cafe`  | 92          | 100           | 100            | 100 | 2.81秒 | 0   | 208ms |
| `/projects/saas`  | 96          | 100           | 100            | 100 | 2.68秒 | 0   | 77ms  |
| `/projects/ec`    | 93          | 100           | 100            | 100 | 2.68秒 | 0   | 226ms |
| `/projects/inbox` | 95          | 100           | 100            | 100 | 2.78秒 | 0   | 105ms |
| `/demos/booking`  | 96          | 100           | 100            | 100 | 2.69秒 | 0   | 38ms  |

[最終8ページ計測](performance/summary.json)。既存のLighthouseモバイル標準条件を変更せず計測。全ページでA/BP/SEO 100、CLS 0。Performance 95+は全ページでは達成していません。特にホームの初期レイアウトとメインスレッド処理が残るため、目標達成とは報告しません。英語見出しのローカルフォント配信、画面外描画の遅延、不要な分析監視の停止まで実施しました。

CIにも同一8ページ計測と生レポートのartifact保存を追加。WindowsローカルとLinux CIの値は混ぜず、実際のNetlify配信・実トラフィックのCore Web Vitalsとも区別します。外部SDK有効時のネットワーク負荷は未測定です。

## 証跡と公開境界

- [Figmaフレーム・実装対応表](FIGMA_SALES_UI.md)
- [148画面記録](screenshots/portfolio/visual-report.json)
- [営業UI 24画面・axe/focus記録](screenshots/sales-ui/report.json)
- [120リンク記録](link-report.json)
- [Desktop Hero](screenshots/sales-ui/home-1440-firstview.png) / [Mobile Hero](screenshots/sales-ui/home-390-firstview.png)
- [Desktop全体](screenshots/sales-ui/home-1440-full.png) / [Mobile全体](screenshots/sales-ui/home-390-full.png)
- [公開運用・ACTION REQUIRED](PRODUCTION.md)

既存本番 https://tetsu-works.netlify.app はHTTP 200を確認。新UIは作業ブランチとして提供し、本番反映・main統合・Netlify設定変更は行いません。追加サービス契約・課金は0円です。
