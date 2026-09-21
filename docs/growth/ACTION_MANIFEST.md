# ACTION_MANIFEST — 所長の承認が要る外部操作

更新: 2026-09-21（A-03 反映後） / 対象 repo: `rapper-droid/freelance-portfolio`
Growth ブランチ: `claude/growth-p0-20260920` = `ef702be`（origin と一致）
本番ソース: `tsudowa/cloudflare-workers-candidate` = `ef702be`（fast-forward、origin と一致）

| 項目                        | 状態                                  |
| --------------------------- | ------------------------------------- |
| A-01 本番反映               | **EXECUTED / COMPLETE**（2026-09-21） |
| A-02 新価格の確定・公開     | **EXECUTED / COMPLETE**（2026-09-21） |
| A-03 計測の有効化           | **EXECUTED / COMPLETE**（2026-09-21） |
| A-04 出品・応募・投稿・送信 | PENDING OWNER APPROVAL（未実行）      |
| A-05 営業URLの統一方針      | PENDING OWNER APPROVAL（未決定）      |

---

## A-01 本番反映 — EXECUTED / COMPLETE

所長の承認（2026-09-21）に基づき実行済み。DNS・Custom Domain・メール・secret・
Turnstile・Durable Objects は一切変更していない。

| 項目                                         | 実績                                                                                                                                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| デプロイしたコミット                         | `ef702be`（`b8c0bbe` を含む。origin の Growth ブランチ・本番ソースブランチと一致）                                                                                                                                                                   |
| 本番 Worker version                          | `ab261d93-a048-42b3-8632-0ffec7631cbe` / deployment `833ca8c7-b19e-40ac-be5d-6477f5862690`（2026-09-20T15:29:30Z = 2026-09-21 00:29 JST）                                                                                                            |
| 直前の本番 version（ロールバック先）         | `e41e0535-a084-4d74-9eff-cf69e040323e` / deployment `3f2dd8cc-dbd4-4629-8496-00fb1d756d31`                                                                                                                                                           |
| preview version                              | `42187a28-acf1-4f80-ba8f-a4f810107aed`（`tsudowa-owner-preview`、noindex）                                                                                                                                                                           |
| 公開されたもの                               | `/services`、`/services/web-fix`、`/services/csv-routine`、`/partners`、`/rescue`、`/works` のメニュー帯とナビ項目、デモ・作品ページの導線と検証記録、`/contact` の案件サイト向け案内、CSVツールの改善、`/privacy` の追記、sitemap への5URL追加      |
| 公開していないもの                           | 新価格（既存の公開値のみ）、未検証商品（W03〜W06）、営業データ（repo 外）                                                                                                                                                                            |
| 追加費用                                     | 0円（既存 Worker の更新のみ）                                                                                                                                                                                                                        |
| 実行前ゲート                                 | lint / typecheck / unit 178 / build / Workers typecheck / vinext check / E2E 165 / Workers E2E 165（本番成果物を workerd で実行）/ growth:lint 10ファイル / Prettier / npm audit 0 / 依存追加0 / 秘密情報・eval・innerHTML 0                         |
| preview QA                                   | 15ルート×6幅=90チェック（本番ベースラインと同一の既知2件のみ）、機能フロー 19/19、axe 0、metadata・canonical 正常、noindex ヘッダあり                                                                                                                |
| 本番 QA                                      | 全19ルートの HTTP（新規5・既存13は200、未知slugは404）、http→https 301、www→apex 308、90チェック（ベースラインと同一）、機能フロー 19/19、axe 0、`GET /api/contact` enabled:true                                                                     |
| 性能（反映前 → 反映後、mobile・3回の中央値） | `/` LCP 756→804ms、`/works` 1148→1272ms、`/contact` 568→676ms、`/services`（新規）816ms。CLS はすべて 0.000。TTFB は 384→226ms、739→266ms、166→127ms                                                                                                 |
| メール・DNS                                  | 反映前後で差分 0。DNS 11件 SHA-256 `3361a0be…`、メール9件 SHA-256 `7015de89…`。Email Routing enabled/ready、contact@ 転送 enabled                                                                                                                    |
| Custom Domain / TLS                          | `tsudowa.com`（1478f107…）`www.tsudowa.com`（4b3993b1…）とも `tsudowa-production` のまま。証明書は advanced 2件・universal 2件が active（2026-12-15〜16 まで）                                                                                       |
| Netlify フォールバック                       | 保持。known-good `https://6aabc4aec1247183915ad890--tsudowa.netlify.app/` は 200                                                                                                                                                                     |
| 戻し方                                       | `npx wrangler rollback e41e0535-a084-4d74-9eff-cf69e040323e --name tsudowa-production`（またはダッシュボードの Deployments > Rollback）。DNS・メールの変更は不要。Worker のロールバックで復旧できない場合だけ、Netlify known-good への切替を別途判断 |

## A-02 商品価格の確定と公開 — EXECUTED / COMPLETE

所長の承認（2026-09-21）: W01 = 5,500円、W02 = 16,500円、**税込（総額表示）**。

| 項目               | 実績                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 公開した価格       | W01「5,500円（税込）」／ W02「16,500円（税込）」。いずれも範囲（対象1ページ・不具合1種類／入力1形式・ルール最大3つ・出力1形式）とセットで表示    |
| 範囲外             | 「範囲を超える場合は着手前に別途お見積り」をページに明記                                                                                         |
| 実装               | `src/lib/offers.ts` の `price.status` を `fixed` に（revision 2）。`tests/unit/growth-offers.test.ts` が承認済み金額・税込表記・範囲の記載を検査 |
| 変更していないもの | 既存カテゴリの参考料金（`/works` の 5,000円〜 など）、W03〜W06 の未承認価格、構造化データ（Offer の価格は出していない）                          |
| 営業原稿           | ココナラ・ランサーズ・CrowdWorks の原稿の価格欄を承認価格に更新（**出品・応募は A-04 未承認のまま**。手数料を乗せるかは所長判断）                |

## A-03 計測の有効化 — EXECUTED / COMPLETE

所長の承認（2026-09-21）に基づき実行し、**PostHog 側で実イベントの受信まで確認**した。

| 項目                 | 実績                                                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 送信先               | PostHog 組織「TSUDOWA」プロジェクト id **619418**（LAB とは別組織・別プロジェクト。無料枠 100万イベント/月）                                                                                                          |
| 実受信の証拠         | 2026-09-21T13:50:43Z `portfolio_visit`（実ブラウザで tsudowa.com/services を1回開いて発生、distinct_id = そのタブのセッションID）／13:50:03Z `service_view`（offer=web-fix）。いずれも本番 `https://tsudowa.com` 由来 |
| 記録されたプロパティ | `source`・`offer`・`$geoip_disable`・`$ip="0.0.0.0"`・`$process_person_profile=false` のみ。**本文・メール・URL・生IP・個人プロファイルはゼロ**                                                                       |
| LAB への混入         | なし（プロジェクト 551024 は同時間帯 0 件）                                                                                                                                                                           |
| 設定                 | `ANALYTICS_ENABLED=true`（サーバー側 runtime var）／`NEXT_PUBLIC_ANALYTICS_ENABLED=true`（ブラウザ側）／`POSTHOG_HOST=https://us.i.posthog.com`。`POSTHOG_PROJECT_KEY` は Worker Secret（repo には書かない）          |
| 応答の意味           | `/api/analytics` は **202=転送・受理／204=未計測／400=payload 不正／502=upstream 異常**。以前は転送成功と未計測がどちらも 204 で、誤設定が健全に見えていた                                                            |
| 上限                 | サーバー側で30日2万件（無料枠の2%）。超過分は送信せず 429                                                                                                                                                             |
| 途中で直した不具合   | ①サーバーの転送判定が build 時 inline される `NEXT_PUBLIC_*` に依存し、ビルド成果物から条件ごと消えていた → runtime var に分離。②Secret が空値で登録されていた（所長が再登録して解消）                                |
| 費用                 | 0円（PostHog 無料プラン、サブスクリプションなし）                                                                                                                                                                     |
| 本番 version         | `5ec6e5ee-19b3-455a-9f3c-87e0275a16b5` / deployment `f54121ff`                                                                                                                                                        |
| ロールバック先       | `2bdd0b86-9067-4348-bc24-fa98d2c4012d`（計測を転送しない版）。DNS・メールの変更は不要                                                                                                                                 |

## A-04 案件サイト・販売先への出品／応募

| 項目       | 内容                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------- |
| 何をする   | ココナラ／ランサーズのサービス出品、CrowdWorks 案件への応募、協業募集への連絡               |
| 現状       | 原稿は `artifacts/growth-public/listings/` に**下書きとして**用意（公開・送信はしていない） |
| 承認の単位 | 媒体・出品1件・宛先1件ごと。本文・リンク・価格・添付を見てから                              |
| 規約       | `CHANNEL_POLICY.md` の確認日時つき記録を参照。未確認項目があるものは公開対象にしない        |

## A-05 営業URLをどちらに統一するか（tsudowa.com / tetsuworks.com）

| 項目           | 内容                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事実           | 同じ WORKS の内容が `tsudowa.com/works`（この repo・Cloudflare）と `tetsuworks.com`（Netlify・`codex/portfolio-sales-hub-v2`）の両方で公開されている |
| 影響           | 営業URL・被リンク・検索評価が割れる。応募文に貼るURLも決まらない                                                                                     |
| 選択肢         | (a) tsudowa.com に統一し tetsuworks.com は転送、(b) tetsuworks.com を WORKS 専用として残し内容を分ける、(c) 現状維持                                 |
| いま必要な操作 | 決定のみ（DNS変更や Codex 側ブランチの変更は、決まってから別途承認）                                                                                 |

## A-06 メール・SNS・紹介の送信

| 項目       | 内容                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 現状       | 送信・投稿は1件も行っていない。原稿だけを用意                                                  |
| 制約       | Resend は未承諾の新規営業（cold outreach）に使わない。協業への連絡は募集で指定された経路を使う |
| 承認の単位 | 宛先・本文・経路ごと。送信直前に募集状態と重複・拒否記録を再確認する                           |

---

## 実行したこと / していないことの確認（2026-09-21 時点）

実行した（A-01・A-02 の範囲内）:

- Growth ブランチと本番ソースブランチの origin への通常 push（force push なし、履歴の書き換えなし）
- `tsudowa-owner-preview` への preview deploy（noindex）
- `tsudowa-production` への deploy（Growth P0: version `ab261d93`、価格公開: 下記）
- 承認済み価格（税込）の公開とそれに伴う再デプロイ

実行していない:

- DNS・zone・Custom Domain・Email Routing・MX・Resend 設定の変更: 未実施（前後のハッシュ一致で確認）
- secret の作成・変更・閲覧: 未実施
- Turnstile 設定・Durable Objects namespace の変更: 未実施
- メール・応募・DM・出品・投稿・本番からの実送信: 未実施（A-04 未承認）
- 新価格の決定・公開: **実施済み**（A-02 承認。W01 5,500円・W02 16,500円、税込）。
  W03〜W06 の未承認価格は引き続き非公開
- 計測の有効化: **実施済み**（A-03 承認。PostHog プロジェクト 619418 で実受信を確認）
- 営業URLの統一（tetsuworks.com 側の変更）: 未実施（A-05 未決定）
- 課金が発生する操作: 未実施（追加支出 0円）
- LAB・HQ・CW APPLY OS・`~/freelance-portfolio` 本番 checkout への書き込み: 未実施
- main / codex ブランチへの push・マージ: 未実施
