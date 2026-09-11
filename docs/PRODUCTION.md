# 本番運用と接続手順

2026-09-11。最新運用仕様は本書。過去のHANDOFF_V2は前回時点の記録です。

最終アートディレクションの公開対象候補は `codex/portfolio-final-art-direction`。実装・ローカルQAは [FINAL_ART_QA.md](FINAL_ART_QA.md) を参照。今回、main統合・本番Deploy・本番環境変数・DNS・ドメイン設定は変更していません。以下の旧ブランチ名を今回の作業ブランチへ読み替え、GitHubの差分・CIとNetlifyのPreviewを確認したうえで、ご本人が公開対象へ統合／反映してください。既存の安全設定を維持し、公開後に実URLの表示・canonical・OGP・相談導線を確認します。新しい秘密情報や契約はこのUI更新に不要です。

## 現状と公開方式

今回の開始状態: `codex/portfolio-sales-hub-v2` / `b3c1781915feb660f0b7659b9f7b917d83042243`、未コミット0、fetch後のorigin/mainに対して13 commit先行・0遅れ。ここから `codex/portfolio-figma-sales-ui` を作成し、直前の変更、12カテゴリ・11作品・既存テストを保持。mainは `8ace0697e7eaf5450bd66cf328a1f154c5ae495b` から変更していません。

Next.js 16をそのまま維持し、Netlify Free + 自動OpenNext adapterを採用。`netlify.toml`はNode 24 / npm ci（lockfile自動検出）/ `npm run build:production` / `.next`。このリポジトリをGitからインポートし、公開ブランチに現在の作業ブランチを指定できるので、公開のためだけのmain統合は不要です。HTMLのドラッグ＆ドロップ公開ではAPIが動きません。

2026-09-11更新: 既存本番URLは **https://tetsu-works.netlify.app**。HTTPSのHTTP 200とNetlify応答・セキュリティヘッダーを確認しました。今回のFigma UI変更は新規ブランチ `codex/portfolio-figma-sales-ui` に保存し、Netlify設定・本番シークレット・mainは変更しません。公開URLが存在することと、この新UIが反映済みであることは別です。

## ACTION REQUIRED — 新UIの本番反映

1. GitHubの `codex/portfolio-figma-sales-ui` の差分・CI・画面QAを確認してください。NetlifyでこのブランチのBranch deployまたはDeploy Previewを確認し、現在の公開対象ブランチへの統合／公開切替を本人判断で行います。自動公開設定・契約は今回変更していません。
2. 既存の `NEXT_PUBLIC_SITE_URL=https://tetsu-works.netlify.app`、`CONTACT_ENABLED`、`NEXT_PUBLIC_ANALYTICS_ENABLED` とサーバー環境変数を保持し、`npm run build:production`で公開。新規サービス登録・新規キーはこのUI更新に不要。公開後に下記の接続後チェックを行います。

## 任意サービスを未接続の場合のみ

以下はフォーム・計測を有効にする場合の従来手順です。接続済みの設定を作り直さないでください。クラウドソーシングでの相談文コピーは、接続しなくても利用できます。

3. Resend Freeで送信用APIキーと通知を受け取るメールを設定。初回はResendアカウント所有者への通知のみ、公式のonboarding送信元で受信検証できます。自分のドメインから送る場合は、所有ドメインの送信元認証（Resend提示のDNS）が必要です。任意宛先へ送れると誤解しないでください。
4. Cloudflare Turnstile FreeでManaged widgetを作成。許可hostnameは実際の本番hostnameだけ。site keyを `NEXT_PUBLIC_TURNSTILE_SITE_KEY`、secretを `TURNSTILE_SECRET` に設定。サーバーはSITE_URLのhostnameとaction=contactを厳密検証します。
5. Upstash Redis Freeを1つ作りREST URL/tokenを設定。本文保存用ではなく、インスタンス共通の上限・重複制御専用です。`RATE_LIMIT_SALT` は32文字以上の新しいランダム値。秘密値はホストの環境変数設定へ入力し、チャットやGitには貼らないでください。
6. `CONTACT_FROM` / `CONTACT_TO` / `RESEND_API_KEY`をホストのサーバー環境変数へ設定し、`CONTACT_ENABLED=true`で再デプロイ。Turnstile・メールの成功と失敗・再送を検証します。送信元のクリック/開封トラッキングは無効にします。
7. PostHogとSentryを使う場合は無料プロジェクトを作成し、`.env.example`の対応する値を設定。両者とも有料利用や追加課金を有効にしません。計測ONには共有Redis設定も必要です。

APIキー発行・本人認証・決済・ドメイン購入は本人操作。独自ドメインは後日でよく、必須ではありません。既存サービスのアカウントと料金全体はここから確認できていません。

## 環境変数

全項目は [.env.example](../.env.example)。`NEXT_PUBLIC_*`は公開される識別子であり秘密を置きません。変更時は再ビルド。Resend key、送信元/送信先、Redis token、salt、Turnstile secret、PostHog project key、server Sentry DSNはサーバー専用です。BuildとFunctionsの両スコープへ必要な値を設定します。Previewには本番の秘密変数を渡さず、別サービス/テストキーか無効設定を使用してください。

`build:production`は未設定/不正なSITE_URLと、有効にした機能の設定不足で失敗します。ローカル`build`は外部設定なしで検証できます。CONTACT_ENABLED=falseは「受付停止」であり成功を返しません。GET `/api/contact` は有効/無効と公開widget keyだけを返し、秘密値は返しません。

## 問い合わせの処理と上限

JSONのストリームを16KBで制限、本文10〜2,000文字、メール254文字、consent必須、honeypot、同一公開Originを検証。Turnstileはサーバー側siteverifyでsuccess / hostname / actionを検証。トークンは毎試行後に更新します。

Netlifyが上書きする `x-nf-client-connection-ip` のHMACに対して5回/10分。Netlify以外では偽装可能なX-Forwarded-Forを信用せず全利用者で同じ保守的バケットを共有します。ホスト移行時は信頼できるIP取得を見直してください。Redis障害時は送信を停止します。

固定時間窓で全体50回/UTC日、900回/30日窓。境界では窓が切り替わるためローリング窓ではありません。再送も予算を消費します。日次は無料100通より低く、30日窓が月境界で重なっても月3,000通を下回る設定です。メール以外の用途とResendアカウントを共有する場合はアカウント全体の利用も監視してください。

同じ送信内容はブラウザ内で同じUUID、Redisの原子的SET NX、60秒lease、24時間のpayload hash/成功記録、Resendの24時間Idempotency-Keyで重複を防ぎます。24時間超の再送や別タブ・変更後の入力は別の相談になり得ます。timeout後は1分以上待ち、入力を変えず再試行。ロックはTTLで自動解放します。

メール本文はtext形式、件名と宛先固定。入力メールはreply_toにのみ使用。ユーザーへの自動返信はスパム踏み台防止のため行いません。成功はResendの受付ID確認後のみで、メールボックスへの到達保証とは異なります。失敗時は入力を保持してコピー導線へ戻れます。アプリログは固定の状態コードのみ。

## 分析の見方

`portfolio_visit`（ルート表示）→`portfolio_category_view`→`portfolio_project_open`→`portfolio_price_view`→`portfolio_contact_open`→`portfolio_contact_submit`→`portfolio_contact_success`。既存のlive_demo_click / delivery_info_view / copy_contact_messageも維持。

PostHogで上記のファネルを30分窓で作成し、`source`をbreakdown。カテゴリから直接入った訪問は作品閲覧からの短いファネルでも確認してください。案件サイト内メッセージはコピーイベントまでしか追跡できず、実際の応募・受注と同一視しません。

`?utm_source=crowdworks` / `?utm_source=lancers`のみ分類に利用。未指定direct、その他other。utm_campaignやURLクエリそのものは送信しません。タブ内sessionStorageに30分のランダムUUIDとsourceだけを保存し、匿名セッション内でイベントをつなぎます。永続Cookie/人物プロフィール/autocapture/replayはなし。DNT/GPCでは送信・保存しません。分析の上限は120回/10分/IPバケット、全体20,000回/30日窓。IPはPostHogへ送らず0.0.0.0、GeoIP無効。

## 障害監視

ブラウザの未処理例外・unhandled rejection、React error boundary、Nextのinstrumentation.onRequestError、問い合わせ/分析の依存先エラーを検出。`SENTRY_DSN`でNode SDK、`NEXT_PUBLIC_SENTRY_DSN`でBrowser SDKを設定。イベントはallowlistで再構築し、本文・メール・request・URL・breadcrumbs・任意extraを除外します。サーバーは固定コード、ブラウザは静的chunk名と行番号だけ。replay/tracing/logs転送なし。ソースマップは未公開です。

Sentry側の無料uptime monitor（1件）にトップURLを設定するとサイト停止も検出できます。アプリ内エラー検知だけではホスト全体の停止は分かりません。無料枠に達すると観測できないためUsageを定期確認。サーバーSDKの送信待ちは最大1.5秒で、監視失敗はフォームの応答を壊しません。

## 接続後チェック / 運用

- 公開URLをログアウト状態とスマートフォンで開き、Private保護が残っていないことを確認。
- HTTPS、canonical/OGP、`/og.png`、`/icon.svg`、`/robots.txt`、`/sitemap.xml`、存在しないURLの404。
- 自分の返信先で1通送信し、受信箱と迷惑メールを確認。返信先が適切で、本文/キーがPostHog/Sentryに存在しないことを確認。ResendダッシュボードのDelivered/Bouncedも確認。
- 新しいTurnstile tokenで成功、同じtoken再利用で拒否、ネットワーク失敗時に成功表示しないことを確認。
- PostHogで応募元別のイベント、Sentry Previewで固定文の検証エラーの受信を確認。
- `QA_BASE_URL=https://公開URL npm run qa:visual` と `qa:links` は読み取り検査。E2Eは外部メールを送らないローカルモック検証用。
- 月1回と大量応募前に公開URL・相談・Usageを確認。Netlify 50/75/90%通知を有効にし、Freeは上限でサイト停止するため残量を監視。必要になったら本人判断でPersonal $9へ変更、auto rechargeはOFFを維持。
- 障害時はNetlifyの直前成功deployへロールバック。フォームだけの障害ならCONTACT_ENABLED=falseに戻して再デプロイし、コピー導線を維持。
- 独自ドメインはNetlifyのDomain managementで追加して提示されたDNSだけを設定。TLS確認後SITE_URL変更・再ビルド。www有無は一方へ集約。コード内URLの変更は不要。
