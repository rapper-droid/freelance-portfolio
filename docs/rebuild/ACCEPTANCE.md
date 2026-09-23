# ACCEPTANCE — 受け入れ基準 80 項目の判定

判定日: 2026-09-23（Asia/Tokyo）
対象 branch: `claude/real-utility-20260922`（`origin/claude/growth-p0-20260920` = `d85c531` から分岐）
判定: **PASS / FAIL / BLOCKED / N/A**。**BLOCKED と FAIL を PASS に数えていない。**

証拠の種類:

- `unit` … `npm run verify`（vitest）。36 ファイル / 426 テスト、exit 0。
- `e2e` … `tests/e2e/flow.spec.ts`（11 本 × 3 プロファイル = 33）。
- `qa:flow` … `npm run qa:flow`。320 / 390 / 768 / 1440px で 3 経路 7 段階を実操作。
- `qa:visual` … `npm run qa:visual`。4 幅 × 43 ルート。
- `manual` … 本文中に実測値を記載。

## 集計

80 項目すべてに判定を付けた（判定表から機械的に集計）。

| 判定    | 件数 | 項目               |
| ------- | ---: | ------------------ |
| PASS    |   69 |                    |
| FAIL    |    3 | A05, R01, O07      |
| BLOCKED |    4 | B06, O01, O02, O09 |
| N/A     |    4 | S01, S09, D05, D09 |
| 合計    |   80 |                    |

**BLOCKED と FAIL を PASS に数えていない。合計 7 項目が未完了。**

これとは別に、80 項目には番号が振られていないが未検証のままの能力が 2 つある。

- **実AIによる抽出**：`ANTHROPIC_API_KEY` がこの環境に無く、1 度も呼び出していない（指示書 §06）。
  ルール処理の結果を AI の成果として表示する経路は実装していない。
- **外部送信・カレンダー登録**：接続先も送信許可も無く、1 度も実行していない（指示書 §15）。

---

## 商品とサイト

| #   | 判定 | 根拠                                                                                                                                                                                                                             |
| --- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | PASS | `/works` は `WorksLead`（「入力する仕事を、減らす。」）をギャラリーより前に描画。`e2e`「works: the lead section precedes the gallery」                                                                                           |
| A02 | PASS | 主役は 返信の準備 / 日程調整 / 定期報告 の 3 つ。`e2e` 同上                                                                                                                                                                      |
| A03 | PASS | 12 カテゴリの `PortfolioGrid` と「制作例から探す」は保持。`e2e` 同上、`qa:visual` で `/works/[category]` 12 本が 200                                                                                                             |
| A04 | PASS | 旧 URL の一覧を `REBUILD_BASELINE.md` §7 に記録。**リダイレクト・削除は 0 件**。`qa:visual` 43 ルート全て 200                                                                                                                    |
| A05 | FAIL | 新 3 経路は共通 runtime を使うが、**既存 `/demos/inbox` `/demos/admin` は未統合**。旧実装をそのまま残した（破壊回避を優先）                                                                                                      |
| A06 | PASS | 入力元／処理／出力先／外部操作の 4 表示。`qa:flow` が全幅・全段階で 4 件を確認、`e2e` が「架空サンプル」「通常プログラム」を確認                                                                                                 |
| A07 | PASS | `modeNotice` は環境変数から生成。未接続を「連携済み」と書く経路がない。`unit` runtime-relay（registry）/ runtime-approval                                                                                                        |
| A08 | PASS | `works-lead` に「自主制作の検証であり、顧客導入の実績ではありません」。既存デモの自主制作バッジも保持                                                                                                                            |
| A09 | PASS | 体験前にログイン・接続の UI が存在しない。`e2e`「three entries」がサインイン系ボタン 0 件を確認                                                                                                                                  |
| A10 | PASS | `/flow` の結果の下で困りごと・道具・頻度・希望結果を受け取り、session storage 経由で `/contact` へ引き継ぐ（URL に含めない）。種別も自動選択。`unit` runtime-handoff 15 本 + `e2e`「hands its answers to the consultation form」 |

## RELAY

| #   | 判定 | 根拠                                                                                                                            |
| --- | ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| R01 | FAIL | **実フォームの受付イベントとの接続は未実装。** サンプル経路は手動転記なしで起動するが、`/api/contact` から RELAY を呼んでいない |
| R02 | PASS | `/api/contact` `contact.ts` `contact-mail.ts` は **1 行も変更していない**（`git diff` で確認）。受付・通知は現状維持            |
| R03 | PASS | 同一 `inquiryId` の再配信で run ID・案件 ID が一致。`unit` runtime-relay「same run and case ids for a re-delivered event」      |
| R04 | PASS | 2 通目が同じ案件に紐づき、既出質問が消える。`unit` runtime-relay / `e2e`「the second message does not repeat」                  |
| R05 | PASS | 全項目が本文の文字範囲を引用。`validateExtraction` が偽の引用を拒否。`unit` runtime-relay 3 本                                  |
| R06 | PASS | 同姓・別アドレスは候補止まり。`unit`「refuses to merge a namesake」                                                             |
| R07 | PASS | 返信案と案件記録が実生成。`e2e` が本文「山田太郎 様」と案件 ID を確認                                                           |
| R08 | PASS | 禁止表現（お約束／確定金額／必ず間に合／受注を承り）を出力に含めない。`unit` + `e2e`                                            |
| R09 | PASS | 承認は payloadHash に紐づき、編集後は旧承認で送れない。`unit` runtime-approval「refuses to send after the body was edited」     |
| R10 | PASS | 成功済み effect は再実行せず skip。`unit`「does not re-send an effect that already succeeded」「resumes the ledger write」      |

## DAYBOOK

| #   | 判定    | 根拠                                                                                                                     |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| B01 | PASS    | 日時・所要時間・不明点を抽出。`unit` runtime-datetime 23 本 / runtime-daybook                                            |
| B02 | PASS    | JST 固定オフセットで受信時刻基準。`unit`「reads a UTC instant as the JST wall clock」ほか                                |
| B03 | PASS    | 営業日・休業日・準備時間・既存予定を検証。`unit` runtime-availability（10:00 不可 / 10:15 可 など）                      |
| B04 | PASS    | 曜日矛盾・月なし日付・曖昧曜日を blocking に。`unit` runtime-datetime 6 本                                               |
| B05 | PASS    | `confirmBooking` は予約者合意なしで確定しない。`unit` + `e2e`「予約者の日程合意」表示                                    |
| B06 | BLOCKED | 重なり判定（バッファ込み）は実装・検証済み。ただし**予約台帳の永続化が未接続のため、同時予約の排他制御は未実装・未検証** |
| B07 | PASS    | 外部予定は `external_conflict` として検出し、書き換えない。`unit`                                                        |
| B08 | PASS    | 期限切れ仮保持を解放し、候補から除外。`unit` 3 本                                                                        |
| B09 | PASS    | 変更時に旧リマインドの停止対象を返す。`unit` + 画面表示                                                                  |
| B10 | PASS    | `managedByUs: false` の予定は変更・削除しない。`unit`「refuses to touch a booking this service did not create」          |

## REPORT FLOW

| #   | 判定 | 根拠                                                                                                           |
| --- | ---- | -------------------------------------------------------------------------------------------------------------- |
| C01 | PASS | 原本は変更しない。`unit`「keeps the source rows untouched」                                                    |
| C02 | PASS | `csvLimitsLabel()` が実装値（UTF-8 / 256KB / 10,000 行 / 50 列、XLSX・Shift_JIS 未対応）を表示。`unit` + `e2e` |
| C03 | PASS | 同名・同額・同日だけでは消さない。`unit`「keeps two different order ids that look alike」                      |
| C04 | PASS | 合計・件数・平均が期待値と一致（整数最小単位）。`unit` runtime-report 3 本                                     |
| C05 | PASS | 列順が変わってもレシピ再利用、合計一致。`unit` + `e2e` 2 週目                                                  |
| C06 | PASS | 新列・税区分・通貨混在で確認待ち。`unit` 3 本 + `e2e` 3 週目                                                   |
| C07 | PASS | 比較条件（期間・通貨・レシピ版・件数）を明示。`unit` + `e2e`「比較条件：」                                     |
| C08 | PASS | 加工済み CSV と変更ログを実ファイルで取得。`e2e`「hands back real files」が 2 件の download を確認             |
| C09 | PASS | 数式注入を `neutralizeCell` で無害化。出力は同じ exporter を経由。`unit`                                       |
| C10 | PASS | 要約は「確認できた変化 / 考えられる要因 / 追加で必要なデータ」を分離し、原因を断定しない。`unit` 2 本          |

## 安全と権限

| #   | 判定 | 根拠                                                                                                          |
| --- | ---- | ------------------------------------------------------------------------------------------------------------- |
| S01 | N/A  | **今回の範囲に受信 Webhook を実装していない。** 実装時に署名検証を必須とする（`CONNECTOR_SETUP.md`）          |
| S02 | PASS | 形式・長さ・バイト数・制御文字を検証し、契約外は拒否。`unit` runtime-request 10 本 + `e2e`                    |
| S03 | PASS | 本文中の指示 5 種を blocking 警告にし、権限を変えない。`unit` runtime-relay 6 本                              |
| S04 | PASS | sample モードは外部操作不可（`authoriseAction`）。`/api/flow` は入力を保存しない。`unit` + `e2e`              |
| S05 | PASS | 「外部のAIには送信しません」の表示と実動作が一致（AI 呼び出し 0 件）。`aiCredentialPresent` が false          |
| S06 | PASS | tenant 境界を承認と保存の両方で検証。`unit`「refuses an approval for a different tenant」「keeps runs apart」 |
| S07 | PASS | 新規コードに秘密値なし（grep 実施）。AI 鍵はサーバー側のみ参照、`NEXT_PUBLIC_` 化していない                   |
| S08 | PASS | 承認なしでは実行しない。`GET /api/flow` は表示情報のみ返す。`unit` + `e2e`                                    |
| S09 | N/A  | **解除すべき外部接続が存在しない。** 代替として緊急停止（`RUNTIME_KILL_SWITCH`）を実装・検証                  |
| S10 | PASS | sample は保存なし（画面表示）。`RunStore` の保持期間は 30 日（`RUN_TTL_SECONDS`）。`unit`                     |

## 復旧と原価

| #   | 判定    | 根拠                                                                                                           |
| --- | ------- | -------------------------------------------------------------------------------------------------------------- |
| O01 | BLOCKED | `StateBackedRunStore` / `MemoryRunStore` を実装・単体検証済み。**稼働経路に未接続**（sample は保存しない設計） |
| O02 | BLOCKED | 同上。再表示での状態復元は単体テストのみ                                                                       |
| O03 | PASS    | 途中失敗から再開しても完了済みを繰り返さない。`unit` runtime-approval 2 本                                     |
| O04 | PASS    | `outcome_unknown` と `failed` を区別し、自動再送しない。`unit` 2 本                                            |
| O05 | PASS    | 再試行は上限つき（`retryDelayMs`）。AI 無効出力は `INVALID_OUTPUT` で停止。`unit`                              |
| O06 | PASS    | run / 日 / 月の上限を `checkBudget` が判定。`unit` runtime-daybook 6 本                                        |
| O07 | FAIL    | **管理者向けの停滞・期限切れ通知が未実装。** 監視画面も未作成                                                  |
| O08 | PASS    | 緊急停止が新規入力と外部実行の双方に効く。`unit` + `/api/flow` が 503                                          |
| O09 | BLOCKED | `costRecord()` を実装済みだが、**実 AI 呼び出しが 0 件のため実原価の記録実績なし**                             |
| O10 | PASS    | 状態は effect から導出し、失敗・未実施を隠さない。`unit`「derives the run status from the effects」            |

## 体験と品質

| #   | 判定 | 根拠                                                                                                                                                                |
| --- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U01 | PASS | 320 / 390px で 3 経路 7 段階を完走。`qa:flow`                                                                                                                       |
| U02 | PASS | 320 / 390 / 768 / 1440px で横溢れなし。`qa:visual`(43 ルート) + `qa:flow`(操作後の状態)                                                                             |
| U03 | PASS | キーボードのみで選択・実行、`role="status" aria-live="polite"`、フォーカス輪郭あり。`e2e`「keyboard alone」                                                         |
| U04 | PASS | `prefers-reduced-motion` をトークンで吸収。状態は「選択中」「要確認」「参考」の文字でも区別                                                                         |
| U05 | PASS | 実行中は busy 表示、失敗時も入力を保持（`catch` で text を消さない）。`e2e` + 実装                                                                                  |
| U06 | PASS | 2 回目はレシピ再利用で再説明なし。`e2e` 2 週目                                                                                                                      |
| U07 | PASS | 3 週目は変わった 1 点だけ確認。`e2e`「前回から変わった点だけ確認」                                                                                                  |
| U08 | PASS | `/demos/qa` が `docs/qa-evidence.json`（対象 commit・記録日時・件数・未実施）を表示。手動チェックとは別の欄。`npm run qa:evidence` で生成。`unit` qa-evidence 14 本 |
| U09 | PASS | 架空の稼働数・精度・売上成果なし。試算は「試算（実績ではありません）」と明示。`unit` + `e2e`                                                                        |
| U10 | PASS | 初期設定・例外・運用を分けて計算。`unit` runtime-savings 10 本（指示書 §19 の計算例と一致）                                                                         |

## 引き継ぎと公開

| #   | 判定 | 根拠                                                                                                            |
| --- | ---- | --------------------------------------------------------------------------------------------------------------- |
| D01 | PASS | `verify`(397) / `test:e2e` / `qa:visual` / `qa:flow` を実行。`qa:links` の失敗は**着手前から同一**（後述）      |
| D02 | PASS | 未接続・未検証を本書と `WORKFLOW_STATUS.md` に BLOCKED として明示                                               |
| D03 | PASS | 依存・起動・停止・復旧を `CONNECTOR_SETUP.md` に記載                                                            |
| D04 | PASS | 旧 URL の回帰: `standalone.spec.ts`(11 デモ) と `sales-hub.spec.ts`(全 project ルート) が desktop で 26 件 PASS |
| D05 | N/A  | **DB スキーマ変更なし。** 新規テーブルも移行もない                                                              |
| D06 | PASS | `NEXT_PUBLIC_REAL_UTILITY=off` で `/flow` と `/api/flow` が 404、`/works` は 200 でギャラリー保持（実測）       |
| D07 | PASS | commit / push / merge / deploy を分けて報告（`RELEASE_EVIDENCE.md`）                                            |
| D08 | PASS | 支出 0 円、実送信 0 件、予定変更 0 件、本番公開 0 件                                                            |
| D09 | N/A  | **未デプロイ。** 公開していないため本番 URL の検証対象がない                                                    |
| D10 | PASS | 所有者に残る操作を `OWNER_ACTIONS.md` に 1 本化                                                                 |

---

## 未完了の 7 項目

### FAIL 3 件（実装すれば満たせるが、まだやっていない）

1. **A05** — `/demos/inbox` `/demos/admin` を共通 runtime へ統合していない。
   新しい 3 経路は 1 つの runtime を共有するが、旧デモは旧実装のまま残した
   （既存成果を壊さないことを優先）。
2. **R01** — 実フォームの受付イベントから RELAY を起動していない。
   `/api/contact` は 1 行も変更していないため、実際の問い合わせは処理対象外。
3. **O07** — 停滞・接続期限切れを管理者へ知らせる仕組みがない。監視画面も無い。

### BLOCKED 4 件（権限・接続が無いため検証できない）

1. **B06** — 重なり判定はバッファ込みで実装・検証済みだが、予約台帳の永続化が
   未接続のため、**同時予約の排他制御は未実装・未検証**。
2. **O01 / O02** — `StateBackedRunStore` は実装し単体検証済みだが、稼働経路に
   未接続（公開サンプルは設計上そもそも保存しない）。ブラウザを閉じた後の復元は
   単体テストでしか確認していない。
3. **O09** — 実 AI 呼び出しが 0 件のため、実原価の記録実績が無い。
   `costRecord()` は実装済みで、単価は契約に基づき所有者が設定する前提。

### 着手前から存在した失敗（今回の変更が原因ではない）

- `npm run qa:links` が `Broken anchor /history#independent-demos` で失敗する。
  **基点 `d85c531` を checkout し直して同一の失敗を再現済み。**
- `npm run test:e2e` のうち 15 件（5 テスト × 3 プロファイル）が
  `ENOENT: C:\Users\outputs\master-hq\...` で失敗する。
  原因はテストが書き出す相対パス `../../outputs/`（`tests/e2e/portfolio.spec.ts` ほか）で、
  リポジトリが 2 階層深い場所にある前提。**基点でも同一の 5 件が失敗することを実測済み。**
  新規の `tests/e2e/flow.spec.ts` はこのパスを使わないため影響を受けない。
