# QA_REPORT — 実行したコマンドと受入項目

対象コミット: `ef702be`（branch `claude/growth-p0-20260920` = `tsudowa/cloudflare-workers-candidate`）
実行日: 2026-09-20〜21 / 実行環境: Windows 11, Node v24.19.0, npm 11.17.0
本番反映: **実施済み**。A-01（導線）= version `ab261d93`、A-02（承認価格の公開）= version `6ce20d6f`（現在稼働中）

## 1. 実行したコマンドと結果

| コマンド                                                                                     | 結果                                                                                |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run lint`                                                                               | exit 0                                                                              |
| `npm run typecheck`                                                                          | exit 0                                                                              |
| `npx vitest run`                                                                             | **178 / 178**（22ファイル）                                                         |
| `npm run build`                                                                              | exit 0                                                                              |
| `npm run verify`                                                                             | exit 0                                                                              |
| `npm run typecheck:workers`                                                                  | exit 0                                                                              |
| `npm run check:workers`（vinext）                                                            | exit 0（imports 5/5 supported）                                                     |
| `npx playwright test`（Next build、mobile/tablet/desktop）                                   | **165 / 165**                                                                       |
| `npx playwright test --config playwright.workers.*`（**本番成果物**を local workerd で実行） | **165 / 165**                                                                       |
| `npm run growth:lint`                                                                        | 10ファイル 要修正なし（警告2件＝ローカルURLと example.com の記入例）                |
| `npx prettier --check --end-of-line auto .`                                                  | All matched files use Prettier code style                                           |
| `npm audit --omit=dev`                                                                       | 0 vulnerabilities / 依存の追加・更新 0                                              |
| 差分の秘密情報・`eval`・`innerHTML` 検査（`78f04e9`以降）                                    | 0件                                                                                 |
| `node scripts/growth-visual-qa.mjs`（15ルート×6幅=90チェック）                               | local / preview / production の3回とも、本番反映前のベースラインと同一の既知2件のみ |
| 機能フロー検査（相談文引継ぎ・案件サイト分離・rescue・CSV・未送信確認）                      | preview **19/19**、production **19/19**                                             |
| axe + metadata（8ルート、390px）                                                             | preview / production とも violations 0、canonical・単一h1 正常                      |

証拠: `../outputs/growth-qa-20260920`（local）、`../outputs/growth-qa-preview`、
`../outputs/growth-qa-production`、`../outputs/growth-qa-baseline-prod`（反映前）。
いずれもリポジトリ外。

## 1b. 本番反映の記録

| 項目                         | 値                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| preview version              | `42187a28-acf1-4f80-ba8f-a4f810107aed`（noindex 確認済み）                                                                   |
| production version           | `ab261d93-a048-42b3-8632-0ffec7631cbe` / deployment `833ca8c7-b19e-40ac-be5d-6477f5862690`                                   |
| ロールバック先               | `e41e0535-a084-4d74-9eff-cf69e040323e`                                                                                       |
| 本番ルート                   | 新規5ルート 200、既存13ルート 200、未知の商品slug 404、http→https 301、www→apex 308                                          |
| 受付                         | `GET /api/contact` → `enabled:true`、Turnstile 表示。**実送信は行っていない**（A-04 未承認）                                 |
| メール・DNS                  | 反映前後でハッシュ一致（DNS 11件 / メール9件）。Email Routing enabled・ready                                                 |
| 性能（反映前→後、中央値3回） | `/` LCP 756→804ms / `/works` 1148→1272ms / `/contact` 568→676ms / `/services` 816ms、CLS すべて 0.000、TTFB は全ルートで改善 |

## 2. 受入項目（指示書 §26）

証拠のない項目は PASS にしていない。今回の対象外は理由つきで N/A。

| ID  | 結果     | 根拠                                                                                                                   |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| G01 | PASS     | repo/branch/HEAD/dirty を CURRENT_STATE §1 に記録。他 worktree・他 repo の差分は監査前後で不変                         |
| G02 | PASS     | `~/tsukutta-lab` への書き込み 0。未コミット差分 15 件は監査前後で同数                                                  |
| G03 | PASS     | E2E 162 件（既存150含む）と `qa:links` 対象ルートで既存リンク・料金・受付経路に変更なし                                |
| G04 | PASS     | `tests/unit/growth-offers.test.ts`：商品↔デモ↔カテゴリの相互参照、`offerRoutes` と公開商品の一致                       |
| G05 | PASS     | 未承認価格（5,500/16,500 ほか）が商品データに出ないことをテストで確認。`state!=="verified"` は生成されない             |
| G06 | PASS     | 各メニューに納品物・対象外・準備物・検収・修正・納期を表示（E2E で見出しの存在を確認）                                 |
| G07 | PASS     | `tests/unit/csv-edges.test.ts`：引用符・セル内改行・BOM・50列/10,000行上限・数式無害化・負数の保持・空入力             |
| G08 | PASS     | CSVはブラウザ内処理のまま。計測イベントは許可リスト方式で、本文・ファイル名を送る経路がないことをテストで確認          |
| G09 | PASS     | 相談文メーカーの必須未入力・空選択・上限2000字を単体/E2Eで確認。T02（数値シミュレーター）は未実装のため対象外          |
| G10 | N/A      | T02（削減シミュレーター）未実装。実装時に数式と前提表示の一致を検証する                                                |
| G11 | PASS     | コピー失敗時は相談文を選択状態にして手動コピーへ誘導。文言は「コピー」で、送信済みと表示しない                         |
| G12 | PASS     | 既存実装を維持（受付停止時は停止を表示し、コピーのみ提供）。`contact.spec.ts` が継続 PASS                              |
| G13 | PASS     | 受付の成否と確認メール成功を別状態にする既存実装を維持。相談文の引き継ぎは sessionStorage のみで、サーバーに保存しない |
| G14 | PASS     | 既存の冪等キー・再送・タイムアウト処理に変更なし（`contact.spec.ts`）                                                  |
| G15 | PASS     | Turnstile・レート制限・origin 検査は既存のまま。新経路から送信する導線は追加していない                                 |
| G16 | PASS     | 案件サイト経由の来訪者には自社フォーム送信を提示せず、コピーのみ。E2E で「この内容で相談する」が存在しないことを確認   |
| G17 | DEFERRED | 実在候補の調査は P1（SCOUT）。現時点で候補0件、捏造なし                                                                |
| G18 | DEFERRED | 同上。未実施を「0件」と表示していない                                                                                  |
| G19 | DEFERRED | 同上                                                                                                                   |
| G20 | PASS     | `npm run growth:lint`：未置換の差し込み・未承認金額・根拠のない表現を検出（`tests/unit/draft-lint.test.ts`）           |
| G21 | PASS     | 送信・応募・出品・投稿を実行する経路は実装していない。ACTION_MANIFEST に未実施と明記                                   |
| G22 | N/A      | 送信承認の仕組みは P1。現時点で送信機能なし                                                                            |
| G23 | PASS     | Resend の用途は既存の受付通知・受付確認のみ。営業送信の経路を追加していない                                            |
| G24 | PASS     | 外部入力（相談本文・URL）は既存どおりサーバー検証・本文非保存。新規の外部入力取り込みなし                              |
| G25 | PASS     | 公開APIは `/api/contact`・`/api/analytics` のみ（変更なし）。営業データは repo 外のローカル                            |
| G26 | PASS     | ココナラ原稿はURL・連絡先なしで作成し、lint で機械的に検査。AI生成イラストを使わない方針を記録                         |
| G27 | PASS     | 全メニュー・デモに「自主制作」表示。顧客実績の記載なし                                                                 |
| G28 | PASS     | 効果の数値を書いていない。根拠のある事実（53ページ×8幅の検査結果、自動テストの対象）だけを記載                         |
| G29 | PASS     | 新4ページに title/description/canonical/OGP を設定、sitemap に追加（重複なしをテスト）。旧ブランド表記なし             |
| G30 | PASS     | 流入元は許可リスト（crowdworks/lancers/coconala）のみ。URLに個人情報を入れない。不明は「direct」                       |
| G31 | PASS     | `brief_created`（相談文の作成）と `contact_success`（受付）を別イベントに分離。コピーは受付に数えない                  |
| G32 | N/A→記録 | 本番は計測未接続。分母0・未計測・実測0の区別は台帳側（P1）で扱う                                                       |
| G33 | PASS     | 360/390/768/1440 で9ルート、はみ出し0・画面外要素0・12px未満の日本語0                                                  |
| G34 | PASS     | axe 違反0（新3ページ）、キーボード操作とフォーカス可視、`prefers-reduced-motion` で画像の拡大を停止                    |
| G35 | PASS     | 追加の有料API・課金変更・広告・常時サーバーなし。依存関係の追加 0                                                      |
| G36 | PASS     | 計測は未接続でも動作（送信しない）。相談フォームは受付停止時にコピー方式へ退避                                         |
| G37 | PASS     | §1 のコマンドを実際に実行                                                                                              |
| G38 | PASS     | E2E 165 + Workers E2E 165 + 実画面の撮影と目視（§1）                                                                   |
| G39 | PASS     | 既存テストの削除・閾値の緩和なし。失敗した新規E2Eは実装側の契約に合わせて修正（記録あり）                              |
| G40 | PASS     | 未公開・承認待ち・未計測を本書と ACTION_MANIFEST に明記                                                                |
| G41 | PASS     | 全章の対応は `IMPLEMENTATION_MAP.md`                                                                                   |
| G42 | PASS     | W01・W02 それぞれに対象者・デモ・相談導線がそろっている（配布原稿は P1）                                               |
| G43 | PASS     | 案件サイト経由は案件サイトへ、作品目的は LAB/制作記録へ。TSUDOWA 経由を強制しない                                      |
| G44 | PASS     | 既存デザイントークンに統合。既存CSSの上書き・巻き戻しなし（`git diff` は追加のみ）                                     |
| G45 | PASS     | 価格・受付可否を推測で補完しない。未確定は「確認後にお見積り」と表示                                                   |
| G46 | N/A      | T02 未実装                                                                                                             |
| G47 | N/A      | 本番集計が未接続。接続時にデモ・E2E・管理者を除外する                                                                  |
| G48 | DEFERRED | 有効相談の判定は台帳（P1）                                                                                             |
| G49 | PASS     | 匿名の計測（PostHog経路）と営業データ（repo外ローカル）を分離                                                          |
| G50 | PASS     | 相談文はURLに入れず sessionStorage で受け渡し。UTMは定型値のみ                                                         |
| G51 | PASS     | 制作記録は手動更新のまま。日付を捏造していない                                                                         |
| G52 | PASS     | 相談の同意を宣伝メールに転用しない（メール登録機能を追加していない）                                                   |
| G53 | DEFERRED | 納品・事例許諾・紹介の原稿は未作成（次の作業）                                                                         |
| G54 | PASS     | `EXPERIMENTS.md` が仮説／準備／配布／観測／結果を分離（どちらも未配布と明記）                                          |
| G55 | PASS     | 成功率・最適化完了の宣言なし。未配布・未計測と明記                                                                     |
| G56 | PASS     | 兄弟リポジトリの機能が無い場合の代替（CW APPLY OS への受け渡し、ローカル台帳）を設計に反映                             |
| G57 | PASS     | `HANDOFF.md`                                                                                                           |
| G58 | PASS     | 公開データから営業原稿・承認記録に到達する経路なし（営業データは repo 外）                                             |
| G59 | PASS     | 実行日 2026-09-20 を起点に、指示書の 9/19・9/20 分を実施。過去日の作業を実施済みにしていない                           |
| G60 | PASS     | P0 の公開承認セット（A-01）を P1 の完成を待たずに切り出し                                                              |

## 3. 未検証・既知の限界

- **実機検証なし**（iPhone / Android 実機、Safari・WebKit）。Chromium エミュレーションのみ。
- 本番の**計測は未接続**（A-03 未承認）のため、導線の効果は現時点で「未計測」。
- 本番・preview・ローカルに共通して残る既知の2件（いずれも**反映前の本番にも同一に存在**）:
  1. トップページの `.hq-works-window` 内の画像が 320〜390px で数px はみ出す（ページ自体は横スクロールしない）
  2. トップページのラボ図解のラベルが 320px で 7px（日本語の可読下限 12px 未満）
     どちらも既存のアートディレクション側の事象で、今回の変更に由来しない。改善する場合は
     デザイン側の判断が要るため、所長へ申し送りとして残す。
- 本番・preview で観測される `%c%d font-size:0;color:transparent` のコンソール出力は、
  反映前の本番でも同一に出ている（デプロイ版バンドル由来）。アプリのエラーではない。
