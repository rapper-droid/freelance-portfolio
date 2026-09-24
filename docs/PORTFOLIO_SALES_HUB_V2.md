# Portfolio Sales Hub v2 — Implementation Brief

## Mission

クラウドワークス／ランサーズ等の「制作して納品」型案件の受注率を上げるため、現行ポートフォリオを単なる作品集ではなく、案件カテゴリ別に最適化された営業Webアプリへ強化する。

最終目標は、応募文にURLを1本貼るだけで「この人なら設計→制作→実装→テスト→納品まで任せられる」と判断してもらえる状態。

途中確認は原則不要。合理的な判断は自律的に行い、調査→設計→実装→QA→修正→ドキュメントまで一気通貫で進める。

## Existing baseline

現行リポジトリには `/demos/csv`、`/demos/inbox`、`/demos/admin` の実動デモ、Playwright、Vitest、axe-core、スクリーンショット自動取得、README/QAがある。これらを壊さず、再利用・強化する。

## Required category routes

以下の固有URLを実装する。

- `/works/web`
- `/works/lp`
- `/works/coding`
- `/works/nextjs`
- `/works/responsive`
- `/works/improvement`
- `/works/ec`
- `/works/apps`
- `/works/api`
- `/works/automation`
- `/works/design`
- `/works/qa`

トップページでもカテゴリ選択・フィルタリングが可能で、各固有URLでは該当作品のみを表示する。

## Capability catalog

サイト全体で以下を明確に訴求する。

- Webサイト / LP制作
- HTML / CSS / JavaScript
- TypeScript / Next.js
- レスポンシブ対応
- 既存サイトの修正 / 改善
- ECサイト / 商品ページ制作
- Webアプリ / 管理画面制作
- API / 外部サービス連携
- AIを活用した業務自動化
- 各種デザイン / コンテンツ制作
- テスト / 動作確認 / 修正
- 必要に応じたソースコード、設定ファイル、README等の整理・納品

## Initial portfolio projects

既存3デモを活かしつつ、最終的に以下8作品相当を揃える。

1. 高級カフェ公式Webサイト
2. SaaSサービスLP
3. EC商品販売LP
4. AI問い合わせ自動化システム
5. 予約管理ダッシュボード
6. Webサイト改善 Before / After
7. SNS / 広告クリエイティブ集
8. QA / 納品工程DEMO

すべて `SELF-INITIATED DEMO / 自主制作` と明示し、架空実績を実案件のように表現しない。架空データ・想定Briefは利用可。

1作品を複数カテゴリへタグ付けできるデータ駆動構造にする。新規作品追加時にルーティングやUIへ大規模な変更が不要な構成を優先する。

## Project detail requirements

各作品詳細に最低限以下を表示する。

- Overview
- Assumed Client Brief
- Challenge
- Solution
- Desktop Preview
- Mobile Preview
- Tech Stack
- 対応範囲
- 制作期間目安
- 価格目安
- Deliverables
- QA内容
- Live Demo（可能な作品）

価格・期間は保証ではなく参考目安であることを明記する。

## Visual direction

- 高級感・信頼感・技術力が一瞬で伝わる
- “テンプレ感”を避ける
- 過剰な3Dや重い演出より、タイポグラフィ、余白、グリッド、階層、質の高いMotionを優先
- PC / Tablet / Mobileすべて高品質
- 日本語中心、英語ラベルをアクセントに利用
- ダーク一辺倒にせず、営業サイトとして可読性と信頼感を優先
- カテゴリ選択で作品カードが滑らかにフィルタリング
- 作品カードからDesktop/Mobileや作品の特徴を直感的に理解できる
- reduced-motion対応

トップの主メッセージ例:

> BUILD. AUTOMATE. DELIVER.
>
> WebサイトからAI業務自動化まで。設計・制作・実装・テスト・納品まで一貫対応。

文言は最終UIに合わせて改善可。

## “What can you order?” sales block

各カテゴリに「この種類の仕事を依頼した場合」に相当する営業ブロックを表示する。

表示内容:

- できること
- 参考価格
- 制作期間目安
- 納品可能物
- 使用技術の例
- 進め方

Web制作系の参考目安の初期値:

- トップページ: 30,000円〜 / 3〜5営業日
- 下層ページ: 5,000円〜 / 1ページ / 1〜2営業日
- LP: 30,000円〜 / 5〜10営業日
- Webサイト一式: 50,000円〜 / 7〜14営業日

案件内容で変動する旨を必ず表示する。

## Contact / platform-safe CTA

クラウドソーシング応募用のため、公開ページに以下の直接連絡先を掲載しない。

- メールアドレス
- 電話番号
- LINE
- Discord
- SNS DM等の直接契約導線

CTAは「ご利用中のクラウドソーシングサービスのメッセージからご連絡ください」という趣旨にする。

現行の“相談内容を生成してコピーするだけ”の仕組みは有用なら維持・改善し、外部送信はしない。

## External integrations

### PostHog

匿名アクセス解析を導入可能な構成にする。環境変数が未設定なら完全に無効化され、ビルド・ローカル実行に影響しないようにする。

最低イベント例:

- `portfolio_category_view`
- `portfolio_project_open`
- `portfolio_live_demo_click`
- `portfolio_working_version_click`（KISSA / FORME の操作できる版へ進んだ数。
  showcase デモのクリックとは別に数える）
- `portfolio_delivery_info_view`
- `portfolio_copy_contact_message`

個人情報・自由入力本文を分析イベントへ送信しない。

### Sentry

本番エラー監視を導入可能にする。環境変数が未設定なら安全に無効化される構成にする。

### Figma

デザインシステム／主要画面のブラッシュアップに使えるよう、色・typography・spacing・radius・shadow等のtokenをコード側でも整理する。

### Hosting

独自ドメイン接続を前提に、CloudflareまたはVercelへデプロイ可能にする。特定ベンダーへの不要なロックインは避ける。

## Screenshots / sales assets

Playwright等で営業用スクリーンショットを自動生成する。

各作品につき最低4〜5枚:

1. Desktop first view
2. Desktop long/full view
3. Mobile view
4. Feature / interaction view
5. Project summary card

`docs/screenshots/portfolio/` 等へ規則的に整理する。

ファイル名から作品・viewport・用途が分かるようにする。

## QA

既存QAを拡張し、可能な限り1コマンドで以下を検証する。

- lint
- format check
- typecheck
- unit test
- build
- Playwright E2E
- axe accessibility
- Desktop / Tablet / Mobile visual screenshot
- 主要ルート404なし
- 横スクロール検知
- keyboard navigation
- reduced-motion
- sitemap / metadata
- invalid project/category route

`npm run verify` または同等の統合コマンドで主要検証を実行できること。

## SEO / metadata

- category/project固有title・description
- OGP
- canonical
- sitemap
- robots
- semantic HTML
- structured dataが合理的なら採用

ただし架空実績を実クライアント実績のように検索エンジンへ表現しない。

## Performance

- 不要な巨大JSを避ける
- 画像最適化
- 遅延読み込み
- Font / animationコスト抑制
- モバイルでの操作性を優先
- Lighthouse指標を確認し、営業用途として十分高速にする

## Security / honesty constraints

- APIキーや秘密情報をcommitしない
- 外部サービスのキーがなくても主要デモとbuildが動く
- 実績・顧客・売上・導入企業数を捏造しない
- DEMO内の顧客、注文、売上等は架空データと明示
- “AI”と表示する機能が固定ロジックの場合、その事実を誤魔化さない
- 実装済み機能と“対応可能／相談可能”をUI上で区別する

## Implementation preference

- Next.js / TypeScriptの現行構成を尊重
- 既存3デモとテストを維持
- まず現状を調査してから再設計
- data-driven project/category definitions
- reusable components
- typed content model
- route generationの重複を避ける
- dependency追加は価値が明確なものだけ
- UIを壊すだけの全面書き換えは避ける

## Deliverables

完了時に以下を揃える。

- 12カテゴリURL
- 8作品相当
- 作品詳細ページ
- トップカテゴリフィルタ
- Desktop / Mobile previews
- pricing / delivery guidance
- PostHog optional integration
- Sentry optional integration
- automated screenshots
- updated sitemap / metadata
- updated tests
- updated README
- env example
- deployment guide
- project追加手順
- 最終QA記録

## Definition of Done

- 12カテゴリURLが存在し、関連作品のみ表示される
- 8作品相当が揃う
- 各作品にPC/モバイル、技術、期間、価格、納品物、QAが表示される
- 主要デモを実際に操作できる
- Playwrightで営業用スクリーンショットが生成できる
- 主要自動検証が全て緑
- READMEだけでローカル起動・作品追加・公開設定が分かる
- 外部サービスのキーなしでもbuild/test可能
- 本番公開直前まで完成している

## Autonomy instruction

途中で細かな判断をユーザーへ逐一確認しない。既存コード、テスト、README、Issue #1を読み、合理的な選択は自律的に決定する。

必要な変更を最後まで実装し、失敗したテストやビルドは原因を修正して再検証する。未完了項目が残る場合は、単に“できなかった”で止めず、何がブロックしているかと、安全に完了する最短手順を明記する。
