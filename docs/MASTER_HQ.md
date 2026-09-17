# TSUDOWA MASTER HQ

Baseline: `220b6f7aaa078a87f596085bb16a2444321f3d70`

Branch: `tsudowa/master-hq-build`

Scope: local implementation, verification and commits only.

## 目的と情報設計

TSUDOWA（ツドワ）の思想は「集まり、つくり、次へ広がる。」。
英語の軸は GATHER. BUILD. EXPAND.。
Web制作会社の営業ページではなく、仕事・プロダクト・実験・記録をつなぐ親ブランドの入口にする。

| URL              | 役割                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| /                | ブランド体験、2ブランドへの入口、厳選作品、制作記録、問い合わせの振り分け               |
| /works           | TETSU WORKS。全11制作例、12カテゴリ、8サービス、既存の参考料金・納品・進め方・FAQ・相談 |
| /lab             | TSUKUTTA LABの取り組みを説明する独立したgateway                                         |
| /history         | 日付と根拠を持つ手動更新の制作記録。年単位で拡張                                        |
| /contact         | TETSU WORKSの制作相談                                                                   |
| /contact/general | TSUDOWA全体・掲載内容・コラボレーション等の連絡                                         |
| /projects/*      | 既存11件の制作背景・参考条件                                                            |
| /demos/*         | 既存11件のポートフォリオ枠付き操作デモ                                                  |
| /experience/*    | 既存11件の独立デモ。noindex、canonicalは対応する/demos/*                                |

合計52の人向けURL。架空の第三事業、部署、社員、顧客、法人、実売上は追加しない。
TOPから価格表と長い営業フォームを外し、削除せずWORKSへ移した。
旧TOPの選択的作品一覧はHQ用の3作品に置き換えたが、全作品と価格の正本は変更していない。

## アートディレクション

- dark forest-charcoal / warm paper / creation signalとしてのamber。炎の比喩には戻さない。
- 大きな3行の英語、短い日本語、左右の強弱、2ブランドの段差、紙面色のselected work、罫線ベースのログでリズムを作る。
- 全セクションを均一カードにしない。ブランドは代表ビジュアル・役割・状態・CTAを持つ別々の世界として扱う。
- TETSU WORKSは実際の業務画面。LABは明示的なCONCEPT / APP LIFE図。図を稼働中の製品画面に見せない。
- 見た目の正本はrepositoryのReact / CSS / SVG。Figma、Canva、v0は今回使用していない。既存ロゴと実画面を直接構成できるため、別ツールの探索物を納品物に混在させない。
- 新たなAI写真・AI抽象アートは生成していない。KISSAの既存AI生成・架空店舗写真は自主制作と明示して継続。

## Heroとmotion

現行4開口markを核に、IDEAS / CODE / PEOPLE、輪、WORKSの実画面、LABのconceptを構成。
初回はmarkが集まり、WORKS/LABの面が開く。1.45–1.5秒、1.65秒で終了状態を片づける。
内容・h1・CTAをopacity:0やintro待機で隠さない。

同じタブの再訪ではarrivalを繰り返さない。sessionStorageが使えない場合は完成した静止画。
reduced-motionの初期値と実行中の変更に対応。hoverは主に200–220ms、press140ms、代表画面550–600ms。
モバイルメニューはnative details。JavaScriptなしでも開閉・移動でき、Escapeと移動時に閉じる。

## 事実の正本と将来拡張

`src/lib/hq.ts` がブランド、選択作品、制作記録の小さな編集モデル。
日付・種別・ブランド・説明・遷移先・git根拠を持つ。ライブフィードとは表示しない。

| 記録                               | 根拠                                     | 日付       |
| ---------------------------------- | ---------------------------------------- | ---------- |
| 11の独立デモ                       | 8e777db815e9ede4b8890bff26e6b160275ace2b | 2026-09-17 |
| 構造化された相談と確認メールの実装 | 3b794050378f92a916df3d09e44ad1970a004bec | 2026-09-17 |
| 親ブランド構造                     | 41f9068                                  | 2026-09-17 |

日付は当該commitの実日時を照合した。公開・売上・法人設立の履歴とは言っていない。
将来のGitHub / Notion連携はこのモデルへの入力として追加可能。今回は外部連携や自動更新を装わない。

## LAB公開先の扱い

関連リポジトリの公開interaction decisionに `https://tsukuttalab.com/` の記録がある。
2026-09-17、この環境でHEADリクエストを試みたが名前解決できなかった。
これは世界中からアクセス不能という断定ではない。
稼働確認済みの外部リンクを作らず、`verifiedPublicUrl: null` として meaningful なローカルgatewayを設けた。

LABのソース、設定、DNS、公開先には一切変更を加えない。
正式なLAB本体リンクの有効化にはOWNERによる公開先確認が必要。

## 問い合わせ

両窓口は同じ既存送信処理、Turnstile、レート制限、2通の配送契約、receipt、再送制御を利用。
generalは既存の「その他」種別と固定の `/contact/general` 文脈で扱う。
制作向けの価格・種別選択を出さず、問い合わせ内容・参考URL・返信先に集中する。
下書きのsessionStorage keyを制作用と総合用で分離し、互いの入力を復元しない。

API・mail renderer・abuse制御の本体はbaselineから変更していない。
確認画面へのfocusはReactのstate反映後に移動する。描画前のrequestAnimationFrameに依存せず、成功・部分成功の表示とキーボード位置を一致させる。
新しい文脈はallowlistに追加した3つの固定パスのみ。外部URLやPII付きqueryは受け付けない。
ユーザー入力・メールアドレス・secretをanalyticsやURLへ送らない。

ローカルは `CONTACT_ENABLED=false`、`ANALYTICS_ENABLED=false`。
実secretがないのに送信成功とは表示しない。E2Eの成功画面は明示的なmock fixtureであり実配送証明ではない。
ユーザーの既存配送確認を、この変更版の実配送テストへ読み替えない。今回、メール外部設定も実送信も行わない。

## SEOと資産

- 正式originは `https://tsudowa.com` をbuild環境に明示。ローカルserve先は別。
- title、canonical、OG、Twitter、sitemap、robots、WebSite JSON-LDを検証。OrganizationやInc.の架空claimなし。
- 新しい1200×630 OGPは `scripts/hq-assets.mjs` から再生成可能。既存markと実デモ画面から作ったnative composition。
- ロゴ、favicon、apple icon、manifest、既存写真、デモpreview、商品データ、lockfileは保護対象。
- HQの基本CSSはrootの小さなcoreと専用hq.css。営業・デモの既存10レイヤーは順序を維持してroute側へ移設。
- HQ Linkの自動先読みを止め、初期表示で別ブランドのCSS/JSを取り込まない。Heroの実画面だけeager / high priority。
- rootのcoreにはTailwind全体を重複importしない。画像の自然比率とpseudo elementのbox-sizingは小さなresetに明示。404も最小構成とし、HQのCSSを全既存ページへ混入させない。
- デモへの直接アクセスではportfolio基盤をdemo-identitiesより先に読む。旧8デモの上部リンクを44px、操作入口の上余白を14pxに保つ。順序変更による退行をred/greenのE2Eで確認した。

## Gitと外部状態の境界

開始時は親ブランド移行worktreeの220b6f7、専用HQ branchを同じSHAから作成した。
2026-09-17 04:08 UTC、`git ls-remote origin refs/heads/main`で現在のmain SHAのみを読み取り確認。
`8ace0697e7eaf5450bd66cf328a1f154c5ae495b`でローカルtracking refと一致した。fetchやremote更新はしていない。
これはGitのmain照合であり、productionに何が公開されているかの実測証明ではない。
最終commit、差分、dirty state、build fingerprintはOWNER evidenceのcheckpoint/integrityを参照。

## QAと証跡

保存先は外側の `outputs/master-hq/`。既存 `outputs/master-pass/` と `owner-review-8f57c92/` は上書きしない。
実行結果・性能・画像・リンク・motion・保護ファイル・format debtの詳細はこのフォルダのJSONとOWNER_REVIEW.htmlを正本とする。

- 全52 URLを390 / 768 / 1440pxで取得。主要11 URLは1024 / 1920pxも追加。
- initial/full capture、画像decode、横はみ出し、h1、pageerror、axe。
- 全E2E: 既存デモ操作、両問い合わせ窓口、一般/制作draft分離、partial success、同ID再送、無効化時のfail-closed。
- TOP録画: 初期、arrival、scroll、hover、WORKS移動、LAB移動、nav、contact。
- Lighthouse: localhostのproduction buildをmobile simulatedで計測。実フィールドCWVや実機測定ではない。
- 既存format warningは全体整形で消さない。今回の差分との交差とbaseline blobの一致を機械確認する。

## OWNERに残すもの

「依頼したい」「また見たい」と感じるかはOWNERの判断。
実機iOS/Android、実スクリーンリーダー、外部LAB公開先、新しい窓口の実配送は今回の自動QAと分ける。
merge / push / deploy / Cloudflare / DNS / Resend / mail routingは実施しない。
既存比較用127.0.0.1:3147を維持し、新HQは127.0.0.1:3160で確認する。
