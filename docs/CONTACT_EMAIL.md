# 問い合わせ → メール送信

フォーム送信が TANEBI 側のメールアドレスへ実際に届くまでの構成と、
本人が設定する必要がある項目です。

---

## 状態

```text
実装        完了（この構成は元から動く形で入っていました）
不足        credential のみ
現在の挙動   credential が無いため「送信できない」と明示し、送信させない
```

**`NEEDS_OWNER_CONFIG`** — 下の環境変数が入るまで、フォームは送信を受け付けません。

---

## 経路

```text
ブラウザ
  ↓ POST /api/contact（同一オリジンのみ）
Next.js Route Handler（runtime: nodejs）
  ↓ ① 設定チェック      未設定なら 503。ここで止まる
  ↓ ② Origin 照合       違えば 403
  ↓ ③ 入力検証          型・長さ・形式・honeypot・同意
  ↓ ④ レート制限        IP単位 5回 / 10分（Upstash）
  ↓ ⑤ Turnstile 検証    success / action / hostname を全て確認
  ↓ ⑥ 冪等性            同一IDの重複送信を防ぐ。内容が違えば 409
  ↓ ⑦ 送信上限          50通/日・900通/30日（Resend Freeの下）
  ↓ ⑧ Resend REST API   Idempotency-Key 付き
TANEBI のメールボックス
```

SDKは使っていません。Resend の REST API を直接呼ぶため、**依存パッケージは増えていません。**

---

## 届くメールの中身

```text
件名: TANEBI WORKS: Webのご相談（山田 太郎様）

お名前: 山田 太郎
メール: taro@example.com
会社・屋号: サンプル商店
相談種別: Web
ご予算: 30万円以内

--- ご相談内容 ---
（本文）

--- 受付情報 ---
送信元ページ: /works/web
受信日時: 2026-09-16T12:34:56.789Z
受付番号: b37ae8a2-411a-4f03-963b-00e6ae6f8fca

このメールにそのまま返信すると、送信者へ届きます。
```

**Reply-To に送信者のアドレスが入っています。** 届いたメールへ普通に返信すれば相談者へ返ります。

件名には相談種別と名前が入りますが、**改行を除去**してから組み立てています
（件名はヘッダーなので、ユーザー入力の改行がそのまま入ると分割される可能性があるため）。

受付番号は送信者側にも表示される番号と同じで、後からの問い合わせと突き合わせられます。

---

## 本人が設定する環境変数

Netlify の **Site configuration → Environment variables** で設定します。
`.env.example` に同じ一覧があります。**値はリポジトリに入れないでください。**

| 変数                             | 内容                                          |
| -------------------------------- | --------------------------------------------- |
| `CONTACT_ENABLED`                | `true` にして初めて受付が開きます             |
| `RESEND_API_KEY`                 | Resend の API キー（server専用）              |
| `CONTACT_FROM`                   | 送信元。**検証済みドメイン**のアドレス        |
| `CONTACT_TO`                     | 受信先。実際に読むメールアドレス              |
| `TURNSTILE_SECRET`               | Cloudflare Turnstile の secret（server専用）  |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile の site key（公開して問題ないもの） |
| `NEXT_PUBLIC_SITE_URL`           | `https://tetsuworks.com`                      |
| `UPSTASH_REDIS_REST_URL`         | レート制限・冪等性の保存先                    |
| `UPSTASH_REDIS_REST_TOKEN`       | 同上                                          |
| `RATE_LIMIT_SALT`                | 32文字以上のランダム文字列。使い回さない      |

`NEXT_PUBLIC_` が付くものだけがブラウザへ出ます。
**それ以外を `NEXT_PUBLIC_` にしないでください。** 鍵が公開されます。

### Resend 側で必要なこと

```text
1. 送信ドメインの verification（SPF / DKIM の DNS レコード）
   → 未検証のドメインからは送れません
2. CONTACT_FROM をそのドメインのアドレスにする
3. CONTACT_TO は受信できる実アドレス
```

ドメイン検証には DNS 設定が伴います。**今回は DNS を触っていません。**

### Turnstile 側で必要なこと

```text
本番ホスト名（tetsuworks.com）をウィジェットに登録
action 名を "contact" にする（サーバー側で照合しています）
```

---

## 検証済みの挙動

`credential が無い状態` で実測:

```text
GET  /api/contact              {"enabled": false}
POST /api/contact              503 {"code":"unavailable"}
別オリジンからの POST           503（設定チェックが先に止める）
```

**「送れたふり」は実装上できません。** Resend が id を返さない限り成功を返しません。

ユニットテスト 51件で以下を固定しています:

```text
未設定時に送信しない / 別オリジンを拒否 / 巨大bodyとJSON不正を依存前に拒否
レート制限が検証・送信より先 / Turnstileの success・action・hostname を全て要求
宛先固定・Reply-To・Idempotency-Key / captcha token をメールへ含めない
上流失敗・タイムアウト・Redis障害で成功を返さない / 送信上限で停止
同時送信を弾く / 再送で二重送信しない / 内容が変わった再送を弾く
ヘッダーインジェクション・honeypot・同意なしを拒否
件名に改行が入らない / 返信に必要な情報がすべて本文にある
```

---

## 実メール到達テスト（未実施）

指示書13章は「実際の credential がある場合のみ、安全なテストメールを1件送って確認して構わない」
としています。

**この環境に credential は1つもありません。**

```text
RESEND_API_KEY     not set
CONTACT_TO         not set
CONTACT_FROM       not set
TURNSTILE_SECRET   not set
UPSTASH_*          not set
CONTACT_ENABLED    not set
```

値を推測して作ることはしていません。**設定後に1通送るところだけが残っています。**

設定後の確認手順:

```bash
# 本番と同じ設定でローカル起動し、フォームから1件送る
npm run build && npx next start -p 3100
# 期待: 200 + 受信箱に届く + 返信で送信者へ返る
```
