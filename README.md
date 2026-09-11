# WORKS — Portfolio Sales Hub v2

設計・制作・実装・テスト・納品までを、実際に操作できる制作例で伝える営業用Webアプリです。クラウドワークス・ランサーズ等の応募では、依頼内容に合うカテゴリURLを1本案内できます。

**全作品は SELF-INITIATED DEMO / 自主制作。** 架空企業・商品・顧客データは実案件や成果実績ではありません。公開ページに直接連絡先は掲載せず、相談文をコピーしてご利用中のクラウドソーシングサービス内で進める構成です。

![WORKS desktop](docs/screenshots/home-desktop-firstview.png)

## 案件別URL

| 依頼内容                | URL                  |
| ----------------------- | -------------------- |
| Webサイト制作           | `/works/web`         |
| LP制作                  | `/works/lp`          |
| HTML / CSS / JavaScript | `/works/coding`      |
| TypeScript / Next.js    | `/works/nextjs`      |
| レスポンシブ            | `/works/responsive`  |
| 既存サイト修正・改善    | `/works/improvement` |
| EC・商品ページ          | `/works/ec`          |
| Webアプリ・管理画面     | `/works/apps`        |
| API・外部連携           | `/works/api`         |
| AI・業務自動化          | `/works/automation`  |
| デザイン・コンテンツ    | `/works/design`      |
| テスト・QA・納品        | `/works/qa`          |

## 作品と実装範囲

詳細は `/projects/{slug}`、操作は `/demos/{slug}`。11作品のうち主要8作品を営業画像セットの対象としています。

| slug        | 作品                         | 実際に操作できる内容                     |
| ----------- | ---------------------------- | ---------------------------------------- |
| cafe        | KOMOREBI / カフェ公式サイト  | Coffee・Foodメニュー切替、セクションナビ |
| saas        | FOLIO / SaaS LP              | 月・年額比較、FAQ開閉                    |
| ec          | FORM / 商品LP                | 色・数量・小計、カート確認・削除         |
| automation  | RELAY / AI問い合わせ導入想定 | ローカル分類、下書き編集、確認・差戻し   |
| booking     | DAYBOOK / 予約管理           | 日付・検索・追加・枠競合検証・取消確認   |
| improvement | REFINE / 改善比較            | 同じ情報のBefore / After切替             |
| creative    | STILL / 広告制作             | 3方向性・3比率、SVGダウンロード          |
| qa          | SHIP / CHECK / 納品工程      | チェック・進捗・デモマニフェスト出力     |
| csv         | CSV AUTOMATOR（既存）        | 入出力・整形・重複除去・検索・集計       |
| inbox       | SMART INBOX（既存）          | 分類・担当・状況・返信案編集・コピー     |
| admin       | ADMIN DASHBOARD（既存）      | 顧客CRUD・保存・検索・履歴               |

AI API・メール送信・決済・実予約はありません。RELAYはAI連携を検討するための**固定ルール・定型文によるシミュレーション**です。FOLIOのプロダクト画面はLP内のデザインプレビューです。QAのチェックは手動操作デモであり、自動テストの実行・成功を意味しません。

## 技術構成

Next.js 16 App Router / React 19 / TypeScript / Tailwind CSS 4 + CSS / Lucide / Vitest / Playwright / axe-core。依存バージョンの実体はpackage-lock.jsonに固定。任意のブラウザ監視にSentry公式SDKを使用します。外部フォント・有料素材・3Dライブラリは不要です。

基本はServer Components。フィルタ・相談欄・デモ操作・任意計測だけをClient Componentsにしています。CSS/SVGのオリジナル素材と、Playwrightで撮影したWebPを使用します。

## ローカル起動・検証

Node.js 24推奨。Windows PowerShellでは`npm.cmd` / `npx.cmd`も使用できます。

```bash
npm ci
npm run dev
# http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

```bash
npx playwright install chromium
npm run verify            # lint + typecheck + Vitest + production build
npm run test:e2e          # 自動サーバー起動: port 3100
npm run screenshots      # 自動サーバー起動: port 3101
npm run qa:visual        # 自動サーバー起動: port 3102
npm run qa:performance   # Lighthouseのモバイル実測: port 3104
npm run format:check
npm run verify:all       # verify + format + E2E + screenshots + Visual QA
```

外部サービスの環境変数なしで動作します。画像がまだない新規作品を追加した場合は、build → screenshots → buildの順で画像を生成・取り込みしてください。既存のプレビュー画像はGit管理しています。

E2EはChromiumのDesktop 1440×1000 / Tablet 768×1024 / Mobile 390×664で実行。Visual QAは320 / 390 / 768 / 1440pxで全35コンテンツルートを確認します。実機Safari/Androidの検証とは区別してください。

## スクリーンショット

`npm run screenshots`で主要8作品×5枚＝40枚を`docs/screenshots/portfolio/`に生成します。

- `{slug}-desktop-firstview.png`
- `{slug}-desktop-full.png`
- `{slug}-mobile-firstview.png`
- `{slug}-desktop-feature.png`
- `{slug}-desktop-case-study.png`

加えて11作品×3サイズ＝33枚を`public/previews/*.webp`へ生成し、作品詳細のデバイスプレビューに使用。`manifest.json`に生成枚数を記録、`contact-sheet.png`は画面レビュー用の一覧です。スクリーンショットのモバイルサイズは390×844です。`QA_BASE_URL`指定時は既存サーバーを使用し、自動サーバーを起動しません。

## データ駆動の追加方法

1. `src/lib/portfolio.ts`の`projects`に`Project`型の情報を追加します。slugは一意な英数字・ハイフンにします。
2. カテゴリID、想定依頼、課題、解決、コンセプト、機能、技術、料金・期間、納品物、QA、制約を記入。実案件でない作品は必ず自主制作として扱います。
3. 操作デモは`src/components/showcase-demos.tsx`に追加し、`src/app/demos/[slug]/page.tsx`のデモ対応表に登録。既存デモの静的ルート方式も利用可能です。
4. `src/components/project-art.tsx`とCSSでカード用アートを設定。新規カタログだけでカテゴリ表示・詳細・metadata・sitemapへ反映されます。
5. build、screenshots、verify:allを実行します。

新規カテゴリは同ファイルの`categories`にID・営業説明・参考料金・期間・素材・技術を追加し、最低1作品にタグ付けします。`CategoryId`は自動で更新され、ルートと営業セクションは共通テンプレートから生成されます。12カテゴリ固定のテストは仕様変更時に更新してください。

## 環境変数

`.env.example`を`.env.local`へコピー。秘密情報はGitへ追加しません。

| 変数                          | 用途                                 | 未設定時             |
| ----------------------------- | ------------------------------------ | -------------------- |
| NEXT_PUBLIC_SITE_URL          | 公開HTTPSオリジン                    | localhost:3000       |
| NEXT_PUBLIC_ANALYTICS_ENABLED | `true`で計測送信を有効化             | 無効                 |
| POSTHOG_PROJECT_KEY           | PostHogのProject token（サーバー用） | 無効                 |
| POSTHOG_HOST                  | US/EU ingestion origin               | 不正・未設定なら無効 |
| NEXT_PUBLIC_SENTRY_DSN        | 公開DSN、ブラウザエラー監視          | SDKもロードしない    |

`NEXT_PUBLIC_*`はビルド時に確定するので、変更後は再ビルド・再デプロイしてください。SITE_URLは末尾パスなしのHTTPSオリジンを設定。canonical・OGP・Twitter Card・sitemap・robotsが同じ設定に追従します。未設定のlocalhost URLを営業で配布しないでください。

## PostHog接続

1. 利用者のPostHogプロジェクトを作成し、Project tokenとUS/EUリージョンを確認。
2. 公開先に`POSTHOG_PROJECT_KEY`、`POSTHOG_HOST`、`NEXT_PUBLIC_ANALYTICS_ENABLED=true`を設定して再ビルド。
3. カテゴリ閲覧→作品閲覧→Live Demo→納品情報表示→相談文コピーを操作し、PostHogのEventsで確認します。

イベントは`portfolio_category_view` / `portfolio_project_open` / `portfolio_live_demo_click` / `portfolio_delivery_info_view` / `portfolio_copy_contact_message`。自由入力、連絡先、URLクエリ、参照元、Cookie、永続ID、リプレイを送信しません。イベントごとにランダムIDを生成し、人物プロファイルを作りません。このためユニークユーザーやセッションをまたぐファネルの計測は目的にしていません。

ブラウザ→同一オリジンの`/api/analytics`→PostHogの経路。サーバーは既知イベント・カタログIDのみ再構築し、訪問者IPやブラウザヘッダーを転送しません。IP属性は0.0.0.0、GeoIP無効。DNT/GPCでは送信しません。ネットワーク障害時も操作を妨げません。ホスティング自体のアクセスログは別管理です。

[公式Capture API](https://posthog.com/docs/api/capture)。実アカウントでの受信確認は接続後に利用者が実施します。

## Sentry接続

1. 利用者のSentryでBrowser JavaScriptプロジェクトを作成。
2. `NEXT_PUBLIC_SENTRY_DSN`を公開先へ設定し、本番ビルドを再デプロイ。
3. 検証用Preview環境のブラウザコンソールで`setTimeout(() => { throw new Error('portfolio-monitoring-check'); }, 0)`を一度実行し、Sentryで受信確認。

SDKは設定時のみ動的import。既定の統合は無効にしてglobal error / unhandled rejectionだけを捕捉。beforeSendでイベントを作り直し、エラー本文・利用者・リクエスト・URL・breadcrumbs・extraを除外します。Nextの静的チャンクのファイル名・行番号は残します。リプレイ・トレース・セッション収集は追加していません。

**対応範囲は本番ブラウザの未処理エラーです。** サーバー監視・ソースマップのアップロード・Reactで処理済みのエラーはこの構成の対象外。サーバーエラーは公開先ログで確認します。ソースマップ導入時の認証Tokenはサーバー/CIの秘密変数へ設定してください。実アカウント受信は未検証です。

## デプロイ / Vercel

1. GitHubからこのリポジトリをインポート。Framework: Next.js、Node.js 24、Install: `npm ci`、Build: `npm run build`。
2. まず作業ブランチのPreviewを作成し、`NEXT_PUBLIC_SITE_URL`をそのHTTPS URLへ設定して再ビルド。
3. 全カテゴリ・作品・画像・コピー・404・metadataを確認。任意サービスは必要なものだけ接続。
4. 利用者が承認した後にProductionを公開。ブランチのmainへのmergeは自動で行いません。

営業用途のため、Vercelの[Hobbyは非商用用途限定](https://vercel.com/docs/plans/hobby)という条件を確認し、商用利用に適したプランを選んでください。アカウント作成・プラン購入・カード登録・DNS変更は利用者側の操作です。

## Cloudflare / 独自ドメイン

最小変更なら**Cloudflare DNS + Vercelホスティング**。Vercelに独自ドメインを登録し、そこで提示されたDNSレコードをCloudflare側へ設定します。特定のIPやCNAMEをコードに固定しません。TLS発行を確認し、SITE_URLを独自ドメインへ変更して再ビルドしてください。

Cloudflare Workers単独でホストする場合は、[現行Next.jsガイド](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)に従い、vinext等の現在の対応ランタイムへ適合させてください。2026-09-11確認時の公式推奨はvinextで、OpenNextは別経路として記載されています。本変更ではNext.jsの既存構成を維持し、**Cloudflare専用ランタイムへの移植・実行検証は行っていません**。移行時はRoute Handler、画像最適化、環境変数、SSG/404をWorkers Previewで再検証します。`.next`をそのままPagesへアップロードする構成ではありません。

ドメインを変えたら、HTTPS・正規URL・canonical・OGP画像・sitemapのホストを確認。www有無は公開先で一方へリダイレクトします。

## 品質・安全性

- 全デモの入力はローカル処理。相談文の外部送信なし。
- CSV: UTF-8 / 2MB / 10,000行 / 50列、引用符検証、BOM付き出力、Excel数式対策。`.xlsx`・Shift_JISは非対応。集計は全データ、出力は加工後全件。
- inbox / automation: キーワード分類・固定返信、人による確認。再読み込みで初期化、メール送信なし。
- admin: 最大1,000顧客、売上は0〜999,999,999円の整数。localStorage破損時・保存不可時の通知。複数端末同期・認証・共有DB・バックアップ・監査証跡は非対応。
- booking / ec: 画面内状態のみ、実予約・決済なし。
- キーボード・focus-visible・semantic HTML・native dialog・フォームラベル・reduced motion。
- 色・間隔・半径のトークンは`hub.css`、作品別CSSは`showcase.css`。Figmaレビュー手順は[DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)。

最新の実測結果・制限は[QA記録](docs/QA.md)。企画の根拠は[仕様書](docs/PORTFOLIO_SALES_HUB_V2.md)と[Issue #1](https://github.com/rapper-droid/freelance-portfolio/issues/1)、調査・設計は[IMPLEMENTATION_V2.md](docs/IMPLEMENTATION_V2.md)。
