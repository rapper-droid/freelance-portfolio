# TSUDOWA 本番準備・接続手順

更新日: 2026-09-20

## 現在地

2026-09-20 時点の本番は Cloudflare Workers（`tsudowa-production`、version `e41e0535`、Visual Polish 反映済み）です。現在の状態・rollback 手順・確認結果の正本は [production status](production-status.md) です。以下の手順と状態表示は、Workers 移行前（2026-09-17）の記録として残しています。

```text
BRAND                 TSUDOWA / ツドワ
OFFICIAL_ORIGIN        https://tsudowa.com
CLIENT_SERVICES        TETSU WORKS
CONTACT_INBOX          contact@tsudowa.com
CONTACT_SENDER         no-reply@tsudowa.com
MIGRATION_STATE        READY_FOR_OWNER_REVIEW   (2026-09-17 時点)
PRODUCTION_STATE       NOT_DEPLOYED_BY_THIS_UNIT (2026-09-17 時点)
```

この文書は、TSUDOWA移行ブランチを本番へ接続する際の正本です。このUnitでは、main統合、本番deploy、DNS、Cloudflare、Resend、Turnstile、Redis、Netlify、メールルーティング、秘密情報を変更しません。公開URLや外部サービスが既に存在していても、このブランチが反映済みとはみなしません。

## 本番前のオーナー確認

1. Git差分、コミット、CI、全ページのPreviewを確認する。
2. `https://tsudowa.com` のDNSとTLSが公開先を指すことを、公開作業の担当者が確認する。
3. Cloudflare Email Routingで `contact@tsudowa.com` の実受信を確認する。
4. Resendで `tsudowa.com` の送信ドメインと `no-reply@tsudowa.com` を確認する。
5. ホスティング先に必要な環境変数を設定する。秘密値はチャット、Git、ログへ貼らない。
6. Branch deployまたはDeploy Previewで表示、404、フォーム、canonical、OGP、robots、sitemapを検証する。
7. オーナー承認後にのみ本番公開する。

## 必須環境変数

公開オリジン:

```text
NEXT_PUBLIC_SITE_URL=https://tsudowa.com
```

問い合わせを有効化する場合:

```text
CONTACT_ENABLED=true
CONTACT_FROM_EMAIL=no-reply@tsudowa.com
CONTACT_TO_EMAIL=contact@tsudowa.com
RESEND_API_KEY=<server secret>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<public widget key>
TURNSTILE_SECRET=<server secret>
UPSTASH_REDIS_REST_URL=<server setting>
UPSTASH_REDIS_REST_TOKEN=<server secret>
RATE_LIMIT_SALT=<32 characters or more, server secret>
```

`NEXT_PUBLIC_*`以外の秘密値はサーバー専用です。Previewへ本番シークレットを渡さず、無効設定または分離した検証環境を使います。`CONTACT_ENABLED=false`は安全な受付停止であり、APIは成功を装いません。

`npm run build:production` は公開オリジン、問い合わせ有効時の必須値、正式な送受信アドレスを検査し、不一致なら失敗します。

## 問い合わせの安全仕様

- 送信元: `TSUDOWA <no-reply@tsudowa.com>`
- 送信先: `contact@tsudowa.com`
- 利用者のメールアドレスは `Reply-To` にだけ設定する。
- 件名、本文、受信者をサーバー側で組み立て、任意ヘッダーを受け付けない。
- 16KB上限、入力検証、同一Origin、honeypot、consent、Turnstile、Redis rate limit、重複抑止を必須にする。
- Redisまたは外部検証が失敗した場合は送信を止める。
- ユーザーへの自動返信は行わない。
- 成功表示はResendの受付ID取得後だけ。到達保証とは区別する。
- 本文、メール、APIキー、Turnstile tokenを分析・障害ログへ送らない。

## 公開後の実送信テスト

公開と秘密設定のオーナー承認後、1通だけ実施します。

1. `https://tsudowa.com/#contact` を開く。
2. テスト用の実在する返信先、すべての必須項目、同意を入力する。
3. 送信中表示、二重送信抑止、成功表示を確認する。
4. `contact@tsudowa.com` の転送先で受信、迷惑メール、件名、本文、Reply-To、source、submission ID、timestampを確認する。
5. Resendで Accepted / Delivered / Bounced を確認する。
6. 失敗系、再送、Turnstile token再利用が成功扱いにならないことを確認する。

このUnitのローカルE2Eは外部メールを送らないモック検証です。実送信結果がない場合は `NEEDS_OWNER_CONFIG` または `NEEDS_OWNER_REVIEW` と報告し、成功を推測しません。

## SEO・静的配信チェック

- canonicalと`og:url`が `https://tsudowa.com` を指す。
- `og:image`、favicon、Apple icon、manifestがTSUDOWA資産を返す。
- `/robots.txt` と `/sitemap.xml` が正式ドメインを使う。
- www / apex、HTTP / HTTPSは選んだ正規URLへ一方向で集約する。
- 存在しないURLが404になる。

## ロールバック

- 表示障害: ホスティングの直前成功deployへ戻す。
- フォーム障害: `CONTACT_ENABLED=false`へ戻して再deployし、コピー導線を維持する。
- DNS・メール障害: アプリと切り分け、最後に確認済みのDNSレコードへ戻す。変更前の値を必ず保存する。
- 不明点がある状態でDNS、MX、SPF、DKIM、DMARCを上書きしない。

## ローカル確認コマンド

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run qa:design
npm.cmd run qa:visual
npm.cmd run qa:links
npm.cmd run qa:performance
```

外部URLへ `qa:visual` / `qa:links` を実行する場合は読み取り検査として扱います。E2Eを本番URLへ向けて外部送信しません。
