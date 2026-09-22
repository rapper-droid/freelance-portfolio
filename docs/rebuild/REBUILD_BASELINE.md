# REBUILD_BASELINE — 着手前の実測記録

記録日: 2026-09-22（Asia/Tokyo）／入力指示書:
`TSUDOWA_WORKS_REAL_UTILITY_MASTER_20260922.md`（v1.0, 764行を読了）

この文書は **変更前の事実** だけを書く。秘密値は書かず、設定名と有無だけを残す。

## 1. 実装基点の決定

候補ブランチを全て照合した結果（`git for-each-ref` + `docs/production-status.md`）:

| branch                                           | 最終commit       | 判定                                             |
| ------------------------------------------------ | ---------------- | ------------------------------------------------ |
| `claude/growth-p0-20260920` `d85c531`            | 2026-09-22 00:46 | **採用（基点）**。他の全ブランチを含む最新       |
| `tsudowa/cloudflare-workers-candidate` `d5bad13` | 2026-09-21 23:02 | growth-p0 の 3 commit 前。本番デプロイ済みの系列 |
| `claude/visual-polish-20260918` `78f04e9`        | 2026-09-20       | growth-p0 に内包済み                             |
| `codex/portfolio-sales-hub-v2` `ce03541`         | 2026-09-11       | Codex 所有。tetsuworks.com の Netlify ビルド元   |
| `main` `8ace069`                                 | 2026-09-09       | 古い                                             |

`claude/growth-p0-20260920` は `codex/portfolio-sales-hub-v2` より **72 commit
先行・0 遅れ**。既存成果を一つも落とさない基点はこれ。

- 作業 worktree: `C:/Users/tetsu/tanebi-works-real-utility`
- 作業 branch: `claude/real-utility-20260922`（`origin/claude/growth-p0-20260920` から分岐）
- 本番 checkout `C:/Users/tetsu/freelance-portfolio`（`codex/portfolio-sales-hub-v2`）は **未変更**。
  他 worktree（`tanebi-works-integration` / `tanebi-works-rename`）も未変更。

## 2. 公開URLの実測（2026-09-22）

| URL                                    | 実測                   | 配信                                                            |
| -------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| `https://tsudowa.com/works`            | 200 / 1.12s            | Cloudflare Worker `tsudowa-production`（この repo が正本）      |
| `https://tsudowa.com/demos/automation` | 200 / 0.77s            | 同上                                                            |
| `https://tsudowa.com/api/contact`      | 200 `{"enabled":true}` | 受付は **稼働中**。Turnstile siteKey は公開値                   |
| `https://tetsuworks.com/`              | 200 / 1.91s            | **別配信（Netlify）**。ビルド元は Codex の branch。今回触らない |

→ 指示書 S01〜S12 の `/demos/*` は `tsudowa.com` 側に存在する。本書と実装は
`docs/growth/CURRENT_STATE.md` の方針どおり **tsudowa.com を営業正本**として扱う。

## 3. 着手前の verify（変更前の実測）

```
npm ci        → added 615 packages
npm run verify → EXIT 0
  lint      OK
  typecheck OK（✓ Types generated successfully）
  test      Test Files 25 passed (25) / Tests 192 passed (192) / 3.28s
  build     ✓ Compiled successfully / 静的ページ 65/65 生成
```

この 192 テスト・65 ルートが **壊してはいけない既存成果** の下限。

## 4. 既存資産の棚卸し（再利用したもの / しなかったもの）

| 領域             | 既存実装                                                                                        | 判定                                                |
| ---------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 作品・カテゴリ   | `src/lib/portfolio.ts`（12カテゴリ + 11作品、料金・納期つき）                                   | REUSE。改名も削除もしない                           |
| デモ本体         | `src/components/showcase-demos.tsx`（1253行, 8デモ）＋ `csv-demo` / `inbox-demo` / `admin-demo` | REUSE。**既存デモは残す**（旧URL保全）              |
| デモ枠           | `src/components/demo-frame.tsx` + `demo-frame.css`                                              | REUSE。新体験も同じ枠に載せる                       |
| CSV 処理         | `src/lib/csv.ts`（RFC4180パーサ・数式注入対策 `neutralizeCell`・UTF-8/10,000行/50列制限）       | **REUSE（REPORT FLOW の土台）**                     |
| 分類・下書き     | `src/lib/inbox.ts`（`classify` / `replyDraft`、固定キーワード）                                 | REUSE（決定的抽出の初期ルールとして）               |
| 相談受付         | `src/app/api/contact/route.ts` 216行。Turnstile + Resend + 冪等キー + ロック + 受付番号 `TSW-…` | **REUSE。壊さない。**RELAY の入力イベント源         |
| レート制限・状態 | `src/lib/abuse.ts` / `src/lib/state-provider.ts`（Upstash REST or Durable Objects）             | **REUSE（永続ジョブの保存先）**。新規DBを導入しない |
| 計測             | `src/lib/analytics.ts`（許可リスト式イベント名、DNT/GPC 尊重、サーバ経由）                      | REUSE + イベント追加                                |
| QA               | `qa:visual`(4幅) / `qa:links` / `qa:seo` / E2E                                                  | REUSE + 新ルート追加                                |

## 5. 無かったもの（= 今回の新規実装対象）

- **永続ジョブ / ワークフロー機構**。既存は「画面内 state」か「リクエスト内で完結する受付」だけ。
- **AI プロバイダー接続**。`.env.example` にも repo 内にも `ANTHROPIC_*` / `OPENAI_*` は
  **存在しない**（`grep -rn` 実施、0件）。実行環境の shell env にも無い。
  → 実AI は **この環境では BLOCKED**。鍵なしでの「AI成功」偽装はしない（指示書 §06）。
- **ActionPlan / 承認 / 外部操作ゲート / 結果照合** の分離レイヤー（指示書 §13-15）。
- **日時の業務ルール**（営業時間・準備時間・曜日矛盾・仮保持期限）。既存 BookingDemo は
  同時間帯の重複チェックのみで、営業時間も準備時間も持たない。
- **処理レシピの保存と再利用**（REPORT FLOW の「二回目」）。既存 CSV デモは毎回手操作。

## 6. 安全制約（着手時に確認したもの）

- `~/.claude/CLAUDE.md` の承認ゲート、`tsudowa-registry.json` の TETSU WORKS 項を読了。
- **本番デプロイ・push 先**: `codex/portfolio-sales-hub-v2` への push は Netlify 本番ビルド
  ＝承認ゲート。今回は触らない。`main` への push・force push・PR マージも承認ゲート。
- **実メール送信**: `RESEND_API_KEY` は本番側にのみ存在。ローカルには無い。
  今回の実装は **送信しない**（EffectGateway の既定は dry-run）。
- **支出**: 新規契約・有料 API 呼び出しは 0 件。
- `reset --hard` / `clean` / 既存ファイル削除は使用しない。

## 7. 既存デモURL（保全対象）

`/demos/cafe` `/demos/saas` `/demos/ec` `/demos/automation` `/demos/booking`
`/demos/improvement` `/demos/creative` `/demos/qa` `/demos/csv` `/demos/inbox`
`/demos/admin` と、対応する `/projects/[slug]` `/experience/[slug]`
`/works/[category]`（12カテゴリ）。**いずれも削除・リダイレクトしない。**
