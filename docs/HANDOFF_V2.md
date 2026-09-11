# Portfolio Sales Hub v2 — 納品・運用引継ぎ

> これは前回実装時点の記録です。最新の問い合わせ送信・分析・監視・Netlify公開手順は [PRODUCTION.md](PRODUCTION.md)、最新品質結果は [RELEASE_QA.md](RELEASE_QA.md) を参照してください。

## 1. 実装内容

案件別URLをそのまま応募に貼れる営業ハブへ刷新。カテゴリ選択、作品フィルタ、ケーススタディ、料金・期間・納品物・QA、10段階の制作フロー、サービス内メッセージ用の相談文コピーを実装しました。直接連絡先・虚偽の取引実績は掲載していません。

## 2. 新規ページ

12カテゴリ `/works/{web,lp,coding,nextjs,responsive,improvement,ec,apps,api,automation,design,qa}` と11作品詳細 `/projects/{slug}`。固有metadata・canonical・OGP・Twitter Card・sitemapを整備し、公開オリジンを環境変数で切替可能です。

## 3. 新規DEMO

カフェ / SaaS LP / EC商品LP / 問い合わせ自動化シミュレーション / 予約管理 / Before・After / 広告クリエイティブ / QA・納品工程の8作品。すべてブラウザ上で操作できます。

## 4. 既存DEMO

CSV・inbox・adminを保持。ケーススタディ、カテゴリへの導線、3デバイスプレビュー、注意書きと操作領域を改善。既存のCSV入力・保存失敗・ダイアログ等のテストも継続しています。

## 5. テスト

lint・typecheck・22単体テスト・build・format・54 E2Eが成功。全35ルート×4幅=140画面の表示検査が成功。詳細は [QA.md](QA.md)。

## 6. Visual QA

生成画像を表示し、PC・スマートフォン・8デモ一覧・作品詳細を確認。320pxの横はみ出し、カフェの重なり、QAチェック欄と改行を修正。axe対象画面の違反0。実機Safari/Android検証は未実施です。

## 7. スクリーンショット

主要8作品×5枚=40枚。加えて作品内のPC/Tablet/Mobileプレビュー33枚とトップ・既存デモの画像を収録。`npm run screenshots`で再生成可能。

## 8. PostHog

5イベントを任意接続可能。未設定は無効。許可されたカタログIDのみをサーバー経由で送信し、本文・利用者IP・Cookie・永続IDを送信しません。実アカウントへの接続と受信確認は利用者側で実施します。

## 9. Sentry

公式Browser SDKによる本番未処理エラー監視を任意接続可能。未設定はSDKも読み込みません。本文・個人情報を削除。サーバー監視・ソースマップ公開は対象外です。

## 10. デプロイ状態

本番ビルドとローカル起動を検証済み。本番公開・mainへのmerge・DNS変更は未実施。VercelのNext.js構成で公開する手順を用意しています。Cloudflare DNSは利用可能ですが、Workers専用ランタイムへの移植は別作業です。

## 11. 利用者側で残る作業

1. 公開先アカウント・商用利用に適したプランを選び、GitHubからインポート。
2. `NEXT_PUBLIC_SITE_URL`を公開HTTPS URLに設定して再ビルド。
3. 必要な場合のみPostHog/Sentryのプロジェクトを作成し、環境変数を設定・受信確認。
4. 独自ドメインを取得し、公開先が指定するDNSとTLSを設定。
5. Previewを確認してmainへのmerge・本番公開を判断。営業では公開後の案件別URLを使用。

## 12. 費用

今回の購入・課金は0円。有料素材は不要。ホスティング・独自ドメインは契約先の現行価格で別途、許容予算1〜3万円の範囲で選択してください。外部サービスは必要なものだけ接続します。

## 13. ドメイン候補

`tetsu-works.jp` / `tetsu-build.com` / `build-with-tetsu.com`。名称案であり、空き状況・商標・取得価格は未確認です。

## 14. 次に追加すると強い作品

認証・権限・共有DBまで動く管理アプリ、Stripe TESTの購入フロー、実AI APIを用いた人の確認付き業務処理。実案件として公開許可が得られた場合は、捏造せず実際の依頼条件・納品範囲を記録します。

## 15. Git

作業ブランチ: `codex/portfolio-sales-hub-v2`。設計・デモ・任意監視・性能改善・検査・成果画像・ドキュメントの単位でコミットしています。全件は `git log --oneline origin/main..HEAD` で確認できます。mainへ自動mergeしません。

関連: [README](../README.md) / [応募用ガイド](SALES_GUIDE.md) / [接続手順](EXTERNAL_SERVICES.md) / [デザイン/Figmaレビュー](DESIGN_SYSTEM.md) / [画像一覧](screenshots/portfolio/manifest.json)。
