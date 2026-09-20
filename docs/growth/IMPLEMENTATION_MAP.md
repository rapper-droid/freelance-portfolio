# IMPLEMENTATION_MAP — 指示書の各章と、実装先・再利用先・保留理由

更新: 2026-09-20 / コミット `b8c0bbe` 時点
判定: REUSE（既存をそのまま）/ IMPROVE（既存を強化）/ NEW / DEFERRED（P1以降）/ BLOCKED

| 章  | 要件の要点                      | 判定                              | 実装先・根拠                                                                                                                                                                 |
| --- | ------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | 3サービスの役割を壊さない       | REUSE                             | TSUDOWA(`/`)・WORKS(`/works`)・LAB(`/lab`) の構造と文言は変更なし。追加ページは WORKS 側だけ                                                                                 |
| 02  | 現況の確認                      | NEW                               | `docs/growth/CURRENT_STATE.md`                                                                                                                                               |
| 03  | 自律実行の境界                  | —                                 | 可逆なローカル実装のみ実施。外部操作は `ACTION_MANIFEST.md`                                                                                                                  |
| 04  | P0 の一筆書き導線               | NEW                               | `/services` → `/services/<id>` → デモ → `#brief` → `/contact`（またはコピー）                                                                                                |
| 05  | 顧客像・コピー・配布先          | IMPROVE                           | 顧客像A（制作者）= `/partners`、顧客像B（小規模事業者）= W02 + CSVツール。配布原稿は P1                                                                                      |
| 06  | 新サービスを足さず既存をつなぐ  | REUSE                             | 商品マスターは `src/lib/portfolio.ts` + `src/lib/offers.ts`（同一 repo）。別DB・別APIなし。営業データは repo 外                                                              |
| 07  | 中核6商品                       | NEW(2) / DEFERRED(3) / BLOCKED(1) | `src/lib/offers.ts`。判定理由は `OFFER_REVIEW.md`                                                                                                                            |
| 08  | ページと導線                    | NEW                               | `src/app/services/page.tsx`, `src/app/services/[slug]/page.tsx`, `src/app/partners/page.tsx`、`/works` の `OfferStrip`、`demo-frame.tsx` と `projects/[slug]` の関連メニュー |
| 09  | デモ→実証事例                   | IMPROVE                           | 各メニューの「できることの根拠」欄（デモ・自動テスト・自主運営サイトの記録）。事例ページ3本は DEFERRED                                                                       |
| 10  | 無料ツール最大3本               | IMPROVE(T01) / DEFERRED(T02,T03)  | T01 = `/demos/csv`：整形オプションの分離、変更セル数と例の表示、数式無害化の改善、関連メニュー導線                                                                           |
| 11  | 会議不要の相談フロー            | REUSE + IMPROVE                   | 既存 `/contact`（Turnstile/Resend/受付番号/本文非保存）。案件サイト経由の分離を追加                                                                                          |
| 12  | パートナー窓口 / レスキュー窓口 | NEW / DEFERRED                    | `/partners` 実装。`/rescue` は T03 と同時に P1                                                                                                                               |
| 13  | SCOUT                           | REUSE + DEFERRED                  | CrowdWorks 案件は CW APPLY OS（既存）へ渡す。協業候補の調査は P1                                                                                                             |
| 14  | 提案文の生成と送信管理          | DEFERRED                          | 原稿テンプレートと未置換検査は P1。送信機能は実装しない                                                                                                                      |
| 15  | 案件サイト展開                  | DEFERRED                          | `artifacts/growth-public/listings/`（下書き）、`CHANNEL_POLICY.md`                                                                                                           |
| 16  | コンテンツ化                    | DEFERRED                          | `CONTENT_PLAN.md`                                                                                                                                                            |
| 17  | 検索流入                        | DEFERRED                          | 解説ページ4本以内は P1。今回は新4ページのメタデータ・sitemap のみ                                                                                                            |
| 18  | 完成品販売                      | DEFERRED                          | D01/D02 は P1                                                                                                                                                                |
| 19  | 再訪・紹介・再依頼              | DEFERRED                          | 納品まとめ・事例許諾・紹介文の原稿は P1                                                                                                                                      |
| 20  | リード管理・TODAY_BRIEF         | DEFERRED                          | repo 外のローカル台帳として P1。HQ の brief API は手入力を受け付けないため接続しない                                                                                         |
| 21  | 計測                            | IMPROVE                           | `src/lib/analytics.ts` に5イベント追加（許可リスト方式）。**本番は未計測**（A-03）                                                                                           |
| 22  | 配布実験                        | DEFERRED                          | `EXPERIMENTS.md` に枠（仮説/準備/配布/観測/結果）                                                                                                                            |
| 23  | 追加費用0円                     | PASS                              | 依存追加0・新規契約0・課金変更0                                                                                                                                              |
| 24  | デザインと操作品質              | IMPROVE                           | 既存トークン（`tokens.css`）と `.sales-ui` の変数のみ使用。4幅で検証（`QA_REPORT.md`）                                                                                       |
| 25  | セキュリティ・メール・公開情報  | REUSE                             | 受付の検証・レート制限・本文非保存を維持。外部URL取得は実装しない（P2）                                                                                                      |
| 26  | 受入テスト                      | NEW                               | `QA_REPORT.md` の G01–G60                                                                                                                                                    |
| 27  | 実行計画                        | —                                 | 実行日 2026-09-20 を起点に P0 を実施。以降は `TASK_STATE.json`                                                                                                               |
| 28  | 追加施策                        | DEFERRED                          | 反応が出てから判断                                                                                                                                                           |
| 29  | 実行・分担・自己レビュー        | —                                 | 兄弟リポジトリの調査のみ subagent、実装は単一セッション。同一ファイルの同時編集なし                                                                                          |
| 30  | 実行ログ・再開                  | NEW                               | `docs/growth/` 一式 + `HANDOFF.md`                                                                                                                                           |
| 31  | 最終報告                        | —                                 | セッションの最終報告で使用                                                                                                                                                   |

## 新規ファイル（この repo）

```text
src/lib/offers.ts          商品マスター（公開判定・価格方針・根拠・FAQ・相談文の質問）
src/lib/offer-routes.ts    公開商品のslug→カテゴリ（クライアントに商品全文を送らないため）
src/lib/brief.ts           相談文の組み立て（純粋関数）
src/lib/contact-draft.ts   相談文 → 既存フォームへの引き継ぎ（sessionStorage のみ）
src/lib/visit-source.ts    流入元（案件サイト）の記憶。許可リスト方式・12時間
src/components/offer-brief.tsx    相談文メーカー（送信しない）
src/components/offer-strip.tsx    /works のメニュー帯
src/components/platform-memory.tsx 流入元の記録（計測とは分離）
src/components/offers.css / offer-related.css
src/app/services/…, src/app/partners/…
tests/unit/growth-offers.test.ts, tests/unit/csv-edges.test.ts
tests/e2e/growth.spec.ts
scripts/growth-visual-qa.mjs
```
