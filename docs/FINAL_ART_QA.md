# Final Art Direction — QA / Handoff

2026-09-11。`codex/portfolio-final-art-direction`。Windows / Node 24.19.0 / Next.js 16.3.4 / Playwright Chromium。ローカルの最適化ビルドを検証。本番配信・外部サービス受信の検証とは区別します。

## 検証結果

| 項目             | 結果                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| format           | `npm run format` / `format:check` 成功。開始時からあった改行形式の差も統一                                                   |
| lint / typecheck | `npm run verify` 成功                                                                                                        |
| unit             | 8ファイル・50件成功                                                                                                          |
| production build | `next build` 成功、43ページ生成                                                                                              |
| E2E              | 72件成功、既存66件を保持。Desktop / Tablet / Mobile                                                                          |
| 全ルート表示     | 37ルート × 320/390/768/1440 = 148画面、横はみ出し・欠損画像・console/runtimeエラー0                                          |
| 内部リンク       | 37ルート・121リンク／アンカー成功                                                                                            |
| 画像生成         | 主要8作品40枚、11作品×3幅＝33プレビュー。revision `final-art-1`                                                              |
| 新規の操作検証   | FAQ全10項目のTab順序・Enter/Space開閉・フォーカス・全開状態axe、Footer CTA、44pxの対象tap領域、6幅のoverflow／reduced motion |

詳細Visual QAは6ルート × 320/390/768/1024/1440/1920 = 36画面で成功。axe違反0、keyboard focus成功、横はみ出し0、欠損画像0。Homeは各セクションと代表4作品も個別に撮影し、実画像を目視レビューしました。

## Visual review

Figma Final Desktop / Mobile / Brand Boardと、実ブラウザで撮影した画像を比較。HTMLの自動検査だけでなく、画像を開いてHero・Services・Selected Works・Price・Process・FAQ・Footer、4作品の詳細と世界観を確認しました。

- Desktop: 150pxのHeroと小さな補助ラベル、低コントラストのTW背景、細い罫線と作品写真の大きさを確認。
- Mobile: Heroを幅に合わせて拡大。320pxでもAUTOMATEが収まり、CTAを1つに集約。FAQの見出しに既存CSSが勝つ問題とブランドリンクのtap領域を修正して再撮影。
- KISSA: 店内とコーヒー、茶／creamの組合せ。FORME: 大きな商品と質感の寄り。AI生成の架空イメージという表示を維持。
- FLOWSTATE: 青／neutralのLPと精密なworkspaceへ統一し、実画面を再撮影。SMART INBOX: 読める業務フローと実UI、固定ルール／自動送信なしの説明。
- 同じ角丸カードに揃えず、写真主体・左右反転・商品主体・フロー主体で緩急をつけました。

## Lighthouse

ローカルproduction build / Lighthouse 13.4.1 / mobile simulated throttling。8ページを順番に測定し、HomeとFORMEは初期レイアウト時間の揺れを調べるため、コードを変更せず再測定しました。実ユーザーのCore Web Vitalsではありません。

| ページ       | Performance 初回 / 再測定 | Accessibility | Best Practices | SEO |
| ------------ | ------------------------- | ------------- | -------------- | --- |
| Home         | 80 / 84                   | 100           | 100            | 100 |
| Works        | 94                        | 100           | 100            | 100 |
| LPカテゴリ   | 94                        | 100           | 100            | 100 |
| KISSA        | 95                        | 100           | 100            | 100 |
| FLOWSTATE    | 96                        | 100           | 100            | 100 |
| FORME        | 85 / 94                   | 100           | 100            | 100 |
| SMART INBOX  | 99                        | 100           | 100            | 100 |
| Booking demo | 98                        | 100           | 100            | 100 |

全測定でCLS 0。初回8ページのLCPは1.95〜2.96秒。HomeのTBTは649→517ms、FORMEは556→139msと変動し、traceの主な長時間処理は初期Style/LayoutとReactの実行でした。Homeの従来記録は81で、今回80〜84。転送JSは159,169 bytes（従来157,519 bytes）で、重い描画ライブラリ・外部フォント・FAQ用JSは追加していません。既存content-visibility・画像遅延読込を維持。HomeのCPU負荷には改善余地が残りますが、デモ機能・検査基準の削除や品質を落とす変更は行っていません。

[初回8ページ](performance/summary.json) / [再測定](performance/summary-targeted.json)。初回の詳細は `home-initial.json` / `projects-ec-initial.json`、再測定の詳細は `home.json` / `projects-ec.json` に保存し、低い値も保持しています。

## 検査環境の切り分け

複数のローカルNextサーバーを同一ビルドで並行利用した際、3105番の画像最適化リクエスト1件（automationの640px）が応答待ちとなり、リンク検査と画像decodeが停止。素材のSharpによるdecode／resizeは正常、独立した3108番では同じURLが正常応答し、37ルート・121リンクが成功しました。共有プロセスの待ち状態と判断し、終了してVisual QAを独立サーバーで再実行。画像待ちに15秒の失敗上限を追加しました。assertionの削除、skip、閾値緩和はありません。

## 証跡

- [最終デザインとFigma対応表](FINAL_ART_IMPLEMENTATION.md)
- [Hero Desktop](screenshots/sales-ui/home-1440-firstview.png) / [Hero Mobile](screenshots/sales-ui/home-390-firstview.png)
- [Home全体 Desktop](screenshots/sales-ui/home-1440-full.png) / [Mobile](screenshots/sales-ui/home-390-full.png)
- [Services](screenshots/sales-ui/services-1440.png) / [Selected Works](screenshots/sales-ui/works-1440.png) / [FAQ](screenshots/sales-ui/faq-390.png) / [Footer](screenshots/sales-ui/footer-1440.png)
- [6幅のaxe・focus・画像・overflow](screenshots/sales-ui/report.json)
- [148画面の表示検査](screenshots/portfolio/visual-report.json) / [リンク](link-report.json) / [Lighthouse](performance/summary.json)

## 維持した境界と公開

12カテゴリ、11作品と各デモ、contact API、Turnstile、Resend、共有rate limiting、analytics、Sentry、metadata/canonical、sitemap/robots、Netlify構成を保持。CONTACT_ENABLEDを有効化していません。既存テスト・作品カタログ・分析処理の差分は改行形式のみで、ロジック変更なしも確認しました。

mainは開始時の `8ace0697e7eaf5450bd66cf328a1f154c5ae495b` を維持。mainへのmerge、本番Deploy、DNS、ドメイン、環境変数、サービス契約の操作はしていません。

本番反映時は、GitHubの作業ブランチの差分とCI、Netlify Previewを確認し、ご本人が公開対象へ統合／反映してください。既存の安全設定を保持し、公開URLで表示・OGP・canonical・相談コピーを確認。直接フォームを有効にしている環境では、本人のテスト送信による受信確認も別途必要です。[運用手順](PRODUCTION.md)。

実機iOS/Android・Safari/Firefox、外部サービスの実受信、公開ドメインのOGPキャッシュと実ユーザー性能は未検証です。
