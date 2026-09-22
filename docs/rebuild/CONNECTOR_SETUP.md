# CONNECTOR_SETUP — 依存・起動・停止・復旧と、接続に必要なもの

更新日: 2026-09-23（Asia/Tokyo）／branch `claude/real-utility-20260922`

**秘密の値はこの文書に書かない。** 設定名と、その有無・用途だけを書く。

## 1. 依存と起動

```
node  >= 22.12（実測 v24.19.0）
npm   11.17.0
npm ci                 # 615 packages
npm run dev            # 開発サーバー
npm run build          # 本番ビルド
npm run start          # ビルド済みを配信
```

検証コマンド:

```
npm run verify         # lint → typecheck → vitest(397) → build
npm run test:e2e       # Playwright 3 プロファイル
npm run qa:visual      # 320/390/768/1440px × 43 ルート、横溢れ検査
npm run qa:flow        # /flow の操作後の状態を 4 幅で検査（今回追加）
```

## 2. 停止と切り戻し

| やりたいこと                 | 方法                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 新体験だけ止める（切り戻し） | `NEXT_PUBLIC_REAL_UTILITY=off` で再ビルド。`/flow` と `/api/flow` が 404、`/works` は 200 のままギャラリー保持（実測済み） |
| 処理を即時停止する           | `RUNTIME_KILL_SWITCH=true`。`/api/flow` が 503、外部操作も内部更新も行わない                                               |
| 既存サイトへ完全に戻す       | この branch を merge しない。既存 `/works` は `WorksLead` を挟む前の構成に戻る                                             |

`NEXT_PUBLIC_REAL_UTILITY` は `off` のときだけ無効になる。
打ち間違い（`OFF` `false` `0`）では無効にならない設計で、単体テストで固定している。

## 3. いま設定されている環境変数（名前のみ）

既存分（`.env.example` にあるもの、今回変更なし）:

```
NEXT_PUBLIC_SITE_URL / CONTACT_ENABLED / NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET / RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN / RATE_LIMIT_SALT
NEXT_PUBLIC_ANALYTICS_ENABLED / POSTHOG_PROJECT_KEY / POSTHOG_HOST
NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN
```

今回追加した分（いずれも任意。未設定でも公開サンプルは動く）:

| 名前                       | 用途                         | 未設定時の挙動                     |
| -------------------------- | ---------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_REAL_UTILITY` | 新体験の切り戻しスイッチ     | 有効（既定）                       |
| `RUNTIME_KILL_SWITCH`      | 緊急停止                     | 停止しない（既定）                 |
| `ANTHROPIC_API_KEY`        | 実AI抽出。**サーバー側のみ** | 実AIは未稼働と表示。代替実行しない |

`ANTHROPIC_API_KEY` を `NEXT_PUBLIC_` 付きにしない。ブラウザへ出る。

## 4. PRIVATE PILOT へ進むために所有者が必要とするもの

順に必要。**いずれも所長が 1 度だけ行う操作で、この環境では代行できない。**

### 4-1. 実AIの検証（指示書 §06, §20）

1. Anthropic のコンソールで API キーを発行する。
2. デプロイ先（Cloudflare Workers または Netlify）の**サーバー側**シークレットに
   `ANTHROPIC_API_KEY` として登録する。値はコード・ログ・Slack に貼らない。
3. 上限を決める。既定は run 4 回 / 日 200 回 / 月 2,000 回、入力 4,000 文字
   （`runtime/budget.ts` の `DEFAULT_LIMITS`）。合わなければ数値を指定する。
4. 1 回あたりの原価は契約の単価で測る。**本リポジトリに単価の固定値を持たない。**

キーを入れた時点で自動的に課金対象の呼び出しが始まるわけではない。
公開サンプルは `selectExtractor` が sample モードでの AI 使用を拒否するため、
実AIを使うには PRIVATE PILOT 経路を別途つなぐ必要がある（未実装）。

### 4-2. 実送信の検証（指示書 §15）

`RESEND_API_KEY` は本番に設定済みだが、RELAY からの送信経路は**接続していない**。
つなぐときに決めることが 3 つある。

1. 送信元・宛先（既存の `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL` を流用するか）。
2. 冪等キーの保持期間を超えた再送をどう扱うか（自前の実行記録は `runtime/store.ts`）。
3. 承認の有効期限（既定 30 分）。

**メールは取り消せないものとして扱う。** 「元に戻す」は用意しない。

### 4-3. カレンダー連携（指示書 §17）

Google Calendar の空き照会は Freebusy で足りるが、**予約確定のロックではない**。
Gmail の本文読み取りは restricted scope に当たり、一般公開アプリでは審査が要る。
初期は所有者の許可済みテストカレンダー 1 本に限定することを勧める。

接続先 ID は利用者が明示選択する設計にする（同名カレンダーを推測して書かない）。

### 4-4. 受信 Webhook を作る場合（指示書 §16 / S01）

今回は実装していない。実装するなら、

- 署名検証は**生のリクエスト本文**で行う。パース後の JSON で検証しない。
- 再送・リプレイを検出する（イベント ID と受信時刻を保存する）。
- 署名が正しくても、差出人や業務上の承認権限が保証されたとは扱わない。

## 5. 復旧

| 症状                         | 対処                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| `/flow` が 500 を返す        | `RUNTIME_KILL_SWITCH=true` で受付を止め、ログを確認する                 |
| 実AIが `BUDGET_EXHAUSTED`    | 上限に達している。上限の見直しは費用の判断なので所長が決める            |
| 実AIが `RATE_LIMITED`        | 上限つきで再試行する（`retryDelayMs`、既定 2 回まで）。無限再試行しない |
| 送信結果が `outcome_unknown` | **自動再送しない。** 相手先の記録と照合してから判断する                 |
| 新体験が原因の不具合         | `NEXT_PUBLIC_REAL_UTILITY=off` で切り戻す。既存機能は影響を受けない     |

## 6. このリポジトリが依存していないもの

- 新規の DB・新規テーブル・マイグレーションは**作っていない**。
- 新しい有料サービスの契約は**していない**。
- 既存の依存パッケージを一括更新して**いない**（`npm audit` 0 件）。
