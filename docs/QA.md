# QA記録 — Portfolio Sales Hub v2

> 前回時点の記録です。今回の45単体テスト・60 E2E・144画面・Lighthouse結果は [RELEASE_QA.md](RELEASE_QA.md) を参照してください。

確認日: 2026-09-11。ローカルの本番ビルドを対象に検証しました。外部サービス受信や本番公開の検証とは区別します。

## 検証対象

トップ、12カテゴリ、11作品詳細、11操作デモの計35コンテンツルート。既存CSV / inbox / adminの安全対策と操作テストも継続しています。

- Windows / Node.js 24 / Next.js 16 / React 19 / TypeScript 6
- Playwright Chromium: Desktop 1440×1000、Tablet 768×1024、Mobile 390×664
- 横幅スイープ: 320 / 390 / 768 / 1440px × 35ルート = 140画面
- 営業画像: Desktop 1440×1000、Tablet 768×1024、Mobile 390×844

## 最終結果

| 検証                     | 結果                                                |
| ------------------------ | --------------------------------------------------- |
| lint / typecheck / build | 成功                                                |
| Vitest                   | 22件成功                                            |
| Prettier                 | 成功                                                |
| Playwright E2E           | 54件成功（18シナリオ × 3サイズ）                    |
| axe-core                 | テスト対象画面・操作状態で違反0                     |
| 全ルート表示             | 140画面成功、横はみ出し・画像欠落・JS実行エラーなし |
| スクリーンショット生成   | 主要8作品 × 5枚 = 40枚、デバイスプレビュー33枚      |
| npm audit                | 依存追加時の検査で0 vulnerabilities                 |

再実行: `npm run verify:all`。性能検査は別途 `npm run qa:performance`。

## 操作・安全性の確認

- 全カテゴリの作品所属、料金・納品情報、canonical / OGP。全作品の自主制作表記・プレビュー・Live Demo。
- トップのフィルタと案件別URL、相談文コピー、Clipboard非対応時の手動コピー。
- カフェのメニュー、SaaSの課金周期表示とFAQ、ECの色・数量・カート・削除・Esc・フォーカス復帰。
- 問い合わせ分類・下書き・確認・差戻し。編集後に再確認が必要なこと、外部送信しないこと。
- 予約の枠競合・追加・検索・取消確認・初期化。改善Before/After、クリエイティブSVG出力、QAチェックによる出力制御。
- CSVの引用符・BOM・行列上限・重複処理・数式対策、inboxの分類、adminのCRUD・localStorage破損/保存不可時の復旧。
- 未知URLの404、sitemap、reduced motion、直接連絡リンクなし。
- analytics未設定時の無通信、入力の許可リスト再構築、foreign origin拒否、サイズ制限、上流障害。Sentryの本文・個人情報除去は単体テスト。

axeはトップ、カテゴリ共通テンプレートの代表、全11詳細、全11デモの主要状態（ECカート・予約フォームを含む）を3サイズで検査しています。すべての状態に対する適合保証ではありません。

## Visual QAと修正

生成画像を実際に表示して、トップPC/モバイル、主要8デモ一覧、カフェ・QAのモバイル、作品紹介を確認しました。余白・文字組み・カード・CTA・画像の切り取り・チェック欄を確認し、次を修正しています。

- 320px幅でヒーローの最小列幅と大見出しが横にはみ出す問題を解消。
- カフェのアーチ内の重複見出しを整理、モバイルのカップと文字の重なりを調整。
- QAチェックボックスに汎用input幅が適用される問題を修正。
- 既存デモの注意書き・操作領域を調整し、ケーススタディへ戻れる導線を追加。
- トップの共有タイトルからブランド名が抜ける問題を共通metadataで修正。
- プロジェクトカードをServer Componentsへ移し、ブラウザへ渡すカタログ情報を削減。

画像: [8作品一覧](screenshots/portfolio/contact-sheet.png) / [PCトップ](screenshots/home-desktop-firstview.png) / [モバイルトップ](screenshots/home-mobile-firstview.png)。自動検査の全明細は [visual-report.json](screenshots/portfolio/visual-report.json)、画像一覧は [manifest.json](screenshots/portfolio/manifest.json)。

## Performance

Lighthouseのローカル本番ビルド・モバイル回線/CPUシミュレーション。2026-09-11測定。実ユーザーのCore Web Vitalsではありません。

| ページ         | Performance | Accessibility | Best Practices | SEO | LCP    | CLS | TBT   |
| -------------- | ----------- | ------------- | -------------- | --- | ------ | --- | ----- |
| /              | 98          | 100           | 100            | 100 | 2.27秒 | 0   | 102ms |
| /works/lp      | 96          | 100           | 100            | 100 | 2.08秒 | 0   | 192ms |
| /projects/cafe | 98          | 100           | 100            | 100 | 1.57秒 | 0   | 145ms |
| /demos/booking | 99          | 100           | 100            | 100 | 1.66秒 | 0   | 112ms |

測定詳細: [summary.json](performance/summary.json)。トップの初回計測ではPerformance 87だったため、カードのServer Component化で改善しました。公開先のレイテンシ・端末・キャッシュで数値は変わります。

## 未実施の範囲

実機iOS/Android、Safari/Firefox、実アカウントのPostHog/Sentry受信、公開ドメインでのOGPキャッシュ、Cloudflare Workers専用ランタイムは未検証です。本番デプロイ・DNS変更・有料購入は実行していません。Webアプリの認証・共有DB・決済・実予約・本物のAI APIは本デモの対象外で、公開画面にも明記しています。
