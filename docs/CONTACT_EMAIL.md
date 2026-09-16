# TSUDOWA問い合わせメール

## 正式経路

```text
受信  contact@tsudowa.com
      → Cloudflare Email Routing
      → OWNER Gmail

送信  TSUDOWA <no-reply@tsudowa.com>
      → Resend
      Reply-To: 相談者のメールアドレス
```

Cloudflare Email RoutingとResend domainのDKIM/SPF/Return-PathはOWNER確認済みです。
このリポジトリのUnitではDNSや外部サービス設定を変更していません。

## production環境変数

```text
NEXT_PUBLIC_SITE_URL=https://tsudowa.com
CONTACT_ENABLED=true
CONTACT_TO_EMAIL=contact@tsudowa.com
CONTACT_FROM_EMAIL=no-reply@tsudowa.com
RESEND_API_KEY=(server secret)
```

加えてTurnstile、Upstash、RATE_LIMIT_SALTが必要です。secretはrepository、client bundle、
ログ、文書へ保存しません。未設定なら`GET /api/contact`はdisabled、POSTは503でfail closedします。

## メール内容

```text
件名: TSUDOWA: Webのご相談（山田 太郎様）

お名前
会社名・屋号
メールアドレス
問い合わせ種類
ご予算
お問い合わせ内容
送信元ページ
受信日時（ISO 8601）
受付番号（request ID）
```

Reply-Toへ相談者のアドレスを設定するため、通知メールへ通常返信すると相談者へ届きます。
件名のユーザー入力は改行除去後に使用します。

## 防御と再送

- 同一Origin
- JSON形式・16KiB上限・入力長/型
- honeypot・同意
- IP単位rate limit
- Turnstile success/action/hostname
- Redis lockとpayload digest
- Resend Idempotency-Key
- 日次/30日上限
- upstream/Redis/timeout時に成功を返さない
- 失敗時は入力とrequest IDを保持し、安全にretry

## 実送信

このUnitのローカル環境にserver secretがない場合、実送信は行いません。
mock経路でReply-To、宛先、From表示、本文、duplicate/retry/errorを検証し、
実到達1件は`NEEDS_OWNER_CONFIG`としてpreview/production環境で行います。
