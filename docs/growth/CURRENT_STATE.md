# CURRENT_STATE — 集客・受注導線の現況監査

実行日: 2026-09-20（Asia/Tokyo）／監査は read-only で実施。
入力: `TSUDOWA_GROWTH_ALL_IN_ONE_20260919.md`
（文書ID `TSUDOWA-GROWTH-ALL-IN-ONE-20260919-v2.0`、SHA-256
`3c6eeb7d4d2ecef85db68a554a75c6b981d74ad9837da2473e3e574481b8f922`、全1467行を読了）

## 1. 正本と作業環境

| 項目                 | 実測値                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| repo                 | `rapper-droid/freelance-portfolio`（GitHub **public**）。作業 worktree: `…/work/tsudowa-visual-polish`                                                                          |
| 監査時 branch / HEAD | `claude/visual-polish-20260918` / `78f04e9`（dirty 0）                                                                                                                          |
| 本作業 branch        | `claude/growth-p0-20260920`（`78f04e9` から分岐）                                                                                                                               |
| package manager      | npm 11.17.0 / Node v24.19.0（`engines` は ^22.12 \|\| ^24 \|\| >=26）                                                                                                           |
| verify               | `npm run verify` = lint → typecheck → unit(vitest) → build。E2E は `npm run test:e2e`（Playwright 3 プロファイル）                                                              |
| 併走                 | 同 repo の他 worktree（`tsudowa-repo` / `tsudowa-cloudflare` / `tsudowa-hq` / `tsudowa-release-20260917`）は今回**未変更**。LAB・HQ・CW APPLY OS も未変更（read-only 監査のみ） |

**重要な差分（Registry との食い違い）**: `~/.claude/tsudowa-registry.json` は
「tsudowa.com を配信しているソースは未特定」としているが、実際は**この repo が
tsudowa.com の本番ソース**。`docs/production-status.md` のとおり、Worker
`tsudowa-production` が `claude/visual-polish-20260918` = `8b0f7ee` を配信し、
Custom Domain `tsudowa.com` / `www.tsudowa.com` がバインド済み。Registry の
`tsudowa.sourceOfLiveSite` / `repoNote` は更新が必要（所長の確認事項）。

## 2. 公開URLの実測（2026-09-20）

| URL                                                               | 状態                    | 中身                                                                                                                                                                                                                     |
| ----------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `https://tsudowa.com/`                                            | 200                     | TSUDOWA（親ブランド）+ TETSU WORKS。title「集まり、つくり、次へ広がる \| TSUDOWA」                                                                                                                                       |
| `https://tsudowa.com/works`, `/demos/csv`, `/lab`, `/api/contact` | 200                     | 受付は `enabled: true`                                                                                                                                                                                                   |
| `https://tetsuworks.com/`                                         | 200                     | **別配信（Netlify）**。title「Web制作からAI業務自動化まで \| TETSU / WORKS」、canonical `https://tetsuworks.com`、`X-Nextjs-Date: 2026-09-17`。本番ビルド元は `codex/portfolio-sales-hub-v2`（Codex 所有・触っていない） |
| `https://www.tetsuworks.com/`                                     | 301 → apex              |                                                                                                                                                                                                                          |
| LAB `https://tsukuttalab.com`                                     | 未接続（apex DNS なし） | 稼働は `tsukutta-lab-site.tetsuyasmile52l.workers.dev`（静的な概要ページのみ。`/about` `/history` `/works` は 404）                                                                                                      |

→ **同じ内容の WORKS が 2 つのドメインに存在**している（tsudowa.com/works と
tetsuworks.com）。営業URLをどちらに統一するかは所長判断（ACTION_MANIFEST A-05）。
本書と実装は `docs/SALES_GUIDE.md` の方針どおり `tsudowa.com` を正本として扱う。

## 3. 既存機能の棚卸し（再利用したもの）

| 領域         | 既存実装                                                                                                                                 | 判定                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 商品カタログ | `src/lib/portfolio.ts`：12カテゴリ（料金・期間・必要素材つき）＋11作品                                                                   | REUSE。新メニューは既存カテゴリに紐づけ、価格も既存公開値を使用                 |
| デモ         | `/demos/*` 11本（CSV・inbox・admin・cafe ほか）、`/experience/*` 単独表示                                                                | REUSE（W01→improvement、W02→csv）                                               |
| 相談受付     | `/contact`・`/contact/general`、Turnstile + Resend + Durable Objects、受付番号 `TSW-…`、本文非保存、レート制限・冪等性・再送・コピー方式 | REUSE。**本番で実送受信テスト済み**（`TSW-260919-B9B38B38AF`、2026-09-19）      |
| 相談文コピー | `contact-send.tsx` の「案件サイトのメッセージで相談したい方へ」                                                                          | IMPROVE（案件サイト経由の来訪者に既定表示）                                     |
| 計測         | PostHog 送信路・許可リスト・サーバ経由（`/api/analytics`）、DNT/GPC 尊重                                                                 | REUSE + 追加イベント。**本番は `NEXT_PUBLIC_ANALYTICS_ENABLED=false` = 未計測** |
| エラー監視   | Sentry（任意接続）                                                                                                                       | 現状維持                                                                        |
| QA           | `qa:visual`（4幅）・`qa:links`・`qa:seo`・E2E 150本                                                                                      | REUSE + 新ルートを追加                                                          |
| 制作記録     | `/history`（`src/lib/hq.ts` の手動更新）、`/lab`                                                                                         | REUSE                                                                           |

## 4. 無かったもの（今回の新規 = NEW）

- 範囲・対象外・準備物・検収を明記した**定額メニュー**（→ `/services`）
- **制作パートナー窓口**（→ `/partners`）
- **相談文メーカー**（→ 各メニューと `/partners` の `#brief`）
- 案件サイト経由と自社直接の**導線の分離**（→ 流入元の記憶と表示切替）
- 営業台帳・TODAY_BRIEF 相当（→ repo 外のローカル運用。§6）

## 5. 兄弟リポジトリの営業資産（read-only 監査の結論）

| repo                                      | 使えるもの                                                                                              | 無いもの                                                                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `~/tanebi-hq`（main `3d72734`, dirty 5）  | `DailyBrief` / `TaskItem` 型、`/command/today` 画面、`POST /command/api/brief/generate`                 | LEAD ENGINE / SCOUT は `DEFERRED_SCOPE`。brief API の `sourceKind` は GMAIL/CALENDAR/GITHUB のみで**手入力を受け付けない**（拡張は別柱の変更 = 今回しない） |
| `~/cw-apply-os`（master, 未コミット20件） | CrowdWorks 案件の 100点評価・約25個の足切り・手数料/実効時給計算・応募文生成・JSON/CSV/テキスト取り込み | 汎用リード管理ではない。CW 以外は対象外                                                                                                                     |
| `~/tsukutta-lab`                          | `packages/works` の prospect 型・送信ブロック・DRY_RUN 承認（参考）、`checkCaseStudies`                 | 公開できる制作記録ページなし。LAB は今回 read-only                                                                                                          |

→ **CrowdWorks 案件は CW APPLY OS に渡す**（二重実装しない）。それ以外の
リード（協業募集・直接相談）は repo 外のローカル台帳で最小運用する（§6）。

## 6. 非公開データの置き場所

repo は **public** のため、営業先・見積・連絡先を repo に置かない。
ローカル領域（既定 `~/.tsudowa-growth/`、`GROWTH_DATA_DIR` で変更可）を使う。
`docs/growth/` と `artifacts/growth-public/` には、公開して差し支えない
設計・原稿・記録だけを置く。

## 7. 費用と権限

- 追加の有料契約・API・広告: **0円**（新規購入なし）。
- 既存: Cloudflare Workers（tsudowa-production / owner-preview）、Resend、
  Turnstile、Upstash（Netlify 側の保持構成）、PostHog（未接続）、Sentry（任意）。
  いずれも本作業で設定変更していない。
- 本番反映・価格公開・送信・出品・投稿は未実施（→ `ACTION_MANIFEST.md`）。

## 8. 要件分類（章 → 判定）

| 章    | 要件                            | 判定                                                                                        |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| 06    | 商品マスターは WORKS 側         | REUSE（`portfolio.ts` + 新 `offers.ts`）                                                    |
| 07    | 中核商品                        | W01・W02 = NEW（公開済み）。W03/W05/W06 = 準備中（OFFER_REVIEW）。W04 = BLOCKED（実証なし） |
| 08    | ページと導線                    | `/services`・`/services/<id>`・`/partners` = NEW、`/demos`・`/contact` = IMPROVE            |
| 09    | デモ → 実証事例                 | IMPROVE（メニューへの導線と根拠表示）。事例ページ3本は P1                                   |
| 10    | 無料ツール最大3本               | T01 = 既存CSVツールを IMPROVE。T02/T03 = P1                                                 |
| 11    | 会議不要の相談フロー            | REUSE + IMPROVE（案件サイト経由の分離）                                                     |
| 12    | パートナー窓口 / レスキュー窓口 | `/partners` = NEW、`/rescue` = P1                                                           |
| 13    | SCOUT                           | CW は CW APPLY OS へ REUSE。協業候補は P1                                                   |
| 14    | 提案文                          | P1（テンプレートと検査）                                                                    |
| 15    | 案件サイト展開                  | P1（媒体別原稿は下書きまで。公開は承認）                                                    |
| 16-18 | コンテンツ・SEO・完成品         | P1                                                                                          |
| 19    | 再訪・紹介・再依頼              | P1                                                                                          |
| 20    | リード管理・TODAY_BRIEF         | ローカル最小版 = P1                                                                         |
| 21    | 計測                            | イベントは実装済み。**本番は未計測**（有効化は承認事項）                                    |
| 23    | 追加費用0円                     | 遵守                                                                                        |
| 24    | デザイン・操作品質              | 既存トークンに統合、4幅で検証済み                                                           |
| 25    | セキュリティ                    | 既存方針を維持（本文非保存・サーバ検証・許可リスト）                                        |
| 26    | 受入テスト                      | `QA_REPORT.md`                                                                              |

## 9. 触っていないもの（保護）

他リポジトリは読むだけで、1バイトも書いていない。監査時（2026-09-20）の
未コミット差分の件数は、監査の前後で変わっていない。

- `~/tsukutta-lab`（LAB 本体・戦闘・セーブ・認証・DB）: 未コミット 15 件のまま（他エージェントの作業。触らない）。
- `~/tanebi-hq`: 5 件のまま。`~/cw-apply-os`: 20 件のまま。
- `~/freelance-portfolio`（TETSU WORKS 本番 checkout・Codex 所有）: 0 件のまま。
- `codex/*` ブランチ、他 worktree の未コミット差分: 変更なし。
- DNS・Cloudflare zone・Email Routing・Resend 設定・本番 Worker: 変更なし。
