# FINAL MASTER PASS — visual and intake audit

Date: 2026-09-17. Baseline: `8f57c9276e43bfeb75837180bedc90b875c662f0`.
Local only. No push, merge, deploy, DNS, routing, or Resend configuration changes.

## 判断基準と読み方

A = 目的を妨げる明確な未達。B = 効果の明確な改善余地。C = 今回は保持。
これは実装者のデザイン監査であり、OWNERの好み・営業成果を自動テストで承認したという意味ではありません。
既存37 URLの初期画面と全体を390 / 768 / 1440pxで取得。追加12 URLも同条件で検証しました。
最終画面は外側の `outputs/master-pass/OWNER_REVIEW.html`、個別検査は `after/audit.json`。

## 全37 URLと主要セクションの判断

| URL                     | 変更前の主要セクション                                                    | 今回の処理 / 最終判断                                                    |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `/`                     | Hero A / 親子構造 A / works B / process B / pricing C / FAQ C / contact A | 3領域の展示、親1+子2、成果物と確認点、受付体験を修正。視覚C、LCP Bは別記 |
| `/privacy`              | 本文 C / 新受付の保持説明 A                                               | session draft・受付状態・自動返信を追記。C                               |
| `/works`                | Hero B / byline B / filters C / cards B / contact A                       | FLOWSTATE+Admin、文字間隔、実画面33点、共通受付。視覚C、LCP B            |
| `/works/web`            | Hero C / cards B / facts C / contact A                                    | KISSAを適切なWeb文脈だけで継続。新preview・受付。C                       |
| `/works/lp`             | Hero B / cards B / facts C / contact A                                    | FLOWSTATEの実画面を更新。条件は保持。C                                   |
| `/works/coding`         | code図版 C / cards B / facts C / contact A                                | 図版保持、previewと受付のみ更新。C                                       |
| `/works/nextjs`         | Hero B / cards B / facts C / contact A                                    | サービスUI実画面へ更新。C                                                |
| `/works/responsive`     | device図版 B / cards B / facts C / contact A                              | 独立デモのdesktop/mobile実画面を採用。C                                  |
| `/works/improvement`    | 比較図版 B / cards B / facts C / contact A                                | 新REFINE画面。比較仕様は保持。C                                          |
| `/works/ec`             | 商品写真 C / cards B / facts C / contact A                                | FORME素材保持、新画面と受付。C                                           |
| `/works/apps`           | screen B / cards B / facts C / contact A                                  | 新Inbox/Admin/Bookingの違いが見える実画面。C                             |
| `/works/api`            | 接続図版 C / cards B / facts C / contact A                                | 接続の概念図を保持、source-aware受付。C                                  |
| `/works/automation`     | human gate図版 C / cards B / facts C / contact A                          | 実行と確認の順序保持、新RELAY preview。C                                 |
| `/works/design`         | poster図版 C / cards B / facts C / contact A                              | 既存独自図形を保持、STILL画面を更新。C                                   |
| `/works/qa`             | チェック図版 C / cards B / facts C / contact A                            | 装飾的な成功率を追加せず、実画面と受付を更新。C                          |
| `/projects/cafe`        | 表紙 B / concept C / facts C / contact A                                  | KISSA単独画面を額装、既存説明は保持。C                                   |
| `/demos/cafe`           | 写真 C / menu C / access C / portfolio chrome B / LCP B                   | 写真4点を継続。単独表示への導線、高優先度LCP画像。視覚C、LCP B           |
| `/projects/saas`        | 表紙 B / story C / facts C / contact A                                    | FLOWSTATE単独画面に更新。C                                               |
| `/demos/saas`           | LP C / pricing操作 C / portfolio chrome B                                 | LPの青・余白・価格比較を保持。単独表示へ。C                              |
| `/projects/ec`          | 表紙 B / story C / facts C / contact A                                    | FORME単独画面に更新。商品色・値段は保持。C                               |
| `/demos/ec`             | 商品写真 C / 選択 C / cart C / chrome B                                   | 写真追加なし。色・数量・cartを維持して単独表示。C                        |
| `/projects/automation`  | 表紙 B / gate説明 C / facts C / contact A                                 | RELAYの実分類結果を撮影。C                                               |
| `/demos/automation`     | gate C / 編集後再確認 C / chrome B                                        | 操作ロジックを保持、単独表示。外部送信なし。C                            |
| `/projects/booking`     | 表紙 B / story C / facts C / contact A                                    | DAYBOOKの新たな温色UIへpreview更新。C                                    |
| `/demos/booking`        | 見出し A / 日付 A / 独自性 A / 予約操作 C                                 | 自然な2行、64px以上の日付、横scroll/snap、clay色。C                      |
| `/projects/improvement` | 表紙 B / 比較説明 C / facts C / contact A                                 | 新REFINE preview、情報の同一性は保持。C                                  |
| `/demos/improvement`    | 比較操作 C / 注釈 C / chrome B                                            | 比較UIを保持、単独表示。C                                                |
| `/projects/creative`    | 表紙 B / コンセプト C / facts C / contact A                               | 独立STILL画面に更新。C                                                   |
| `/demos/creative`       | 作品 C / 比率 C / SVG出力 C / chrome B                                    | 自作図形と操作を保持、単独表示。C                                        |
| `/projects/qa`          | 表紙 B / 納品説明 C / facts C / contact A                                 | SHIP / CHECK画面更新。実テスト実行と誤認させない。C                      |
| `/demos/qa`             | 受入gate C / manifest C / chrome B                                        | 納品gateを保持、単独表示。C                                              |
| `/projects/csv`         | 表紙 B / 制限説明 C / facts C / contact A                                 | サンプル加工後の実画面をpreviewへ。C                                     |
| `/demos/csv`            | 入力 C / 加工 C / export C / notice B                                     | ブラウザ内処理を保持。小さなDEMO DATAと単独表示。C                       |
| `/projects/inbox`       | 表紙 B / story C / facts C / contact A                                    | support専用色の実画面。C                                                 |
| `/demos/inbox`          | 独自性 A / notice B / filter C / reply C                                  | 青いsupport inbox、短いbadge、状態に連動する集計保持。C                  |
| `/projects/admin`       | 表紙 B / story C / facts C / contact A                                    | analytical dashboard実画面へ。C                                          |
| `/demos/admin`          | 独自性 A / notice B / CRUD C / storage C                                  | navy・角形・tabular数字・密な表、集計と保存を保持。C                     |

新規 `/contact` は受付の本体。`/experience/{11 demo slugs}` は独立デモ。
全て1つのh1を持ち、独立デモは元の `/demos/*` にcanonical、noindex/follow、sitemapから除外。
視覚監査のAは解消。LCPは別の技術Bとして残り、C判定を性能目標達成の意味には使いません。

## 制作判断

- TOP: SMART INBOX、FORME、RELAYの3つ。小サムネの羅列にせず、業務UIを大きく、Webと仕組みを添える構成。
- ブランド: 「集まった想いを、次のかたちへ。」。親TSUDOWAを1段上へ。TETSU WORKSとTSUKUTTA LABの2事業を子として配置。
- NEXT VENTURES: 実在事業と同列のカードは撤去。将来の余地は説明文に限定。商品データは変更しない。
- Process: 各段階の納品物を具体化し、既存の「ご確認いただく場面」を保持。新しい契約・納期を約束しない。
- Logo: 現行vectorは接続点と開口の意味を保てる。target/eyeとの連想を完全に消せる根拠ある代案はなく、好みだけで変更しない。SVGを保持。
- 写真: KISSA4点とFORMEは継続。窓光、木の色、マットな陶器、食器の縁・食品・垂直線を目視。表示サイズで明確な破綻を認めず、追加生成は0。AI生成の架空素材であることは隠さない。
- UI素材: 11デモ×3サイズ=33 WebPを、自分たちの独立デモから新規取得。画像の中にTSUDOWAの外枠や説明が重ならない。

## 参考の使い方

閲覧日: 2026-09-17。ロゴ、写真、文章、コードは転用していません。

| 参考                                                     | 採用した観点                                    |
| -------------------------------------------------------- | ----------------------------------------------- |
| [Pentagram Work](https://www.pentagram.com/work)         | 作品面の大小と短い説明によるeditorial hierarchy |
| [Linear](https://linear.app/)                            | 営業コピーと具体的なproduct UIの隣接            |
| [Stripe Billing](https://stripe.com/billing)             | 集計・数字・業務画面の読み順                    |
| [Cal.com](https://cal.com/)                              | 日付選択の直接性、予約UIの穏やかさ              |
| [Kurasu](https://kurasu.kyoto/)                          | 写真の素材感とhospitalityの余白                 |
| [Instrument Contact](https://www.instrument.com/contact) | 相談開始までの短い導線                          |

## モーションと空白

Hero画像hoverは800→600ms。TOP CTAは実測computed styleで220ms、service card220ms、press140ms。
section/title revealは400ms、crop系tokenは560ms。初期viewportの内容はreveal待ちにしない。
Inbox hover180ms、detail260ms。Cafeは瞬時のCTA色変更と300msのメニュー写真切り替えを保持し、数値を合わせるためだけに遅くしない。
旧録画の1.4–1.7秒は撮影間隔と待機を含み、CSS durationではありません。今回はtransition/animationの実イベントとCSS値を別に保存しています。

TOPの全体キャプチャに出ていた空白は、`content-visibility:auto`による画面外描画省略です。
通常のscrollでセクションが描画され、oversized spacerの追加はありません。
比較用全体画像だけで描画省略を解除し、初期画面と動画は通常状態で取得しました。
新フォームはフォーカス・検査の一貫性のため常に描画します。

## OWNERに残す判断

- 「依頼したい」と感じるか、ブランドの一文・markの受け止め、写真の実在感。
- 個々のデモは自主制作・架空データ。実顧客の納品実績として表示しない。
- 本物のiOS/Android、実ソフトウェアキーボード、スクリーンリーダーでの読み上げは未実施。Chromiumのviewport/keyboard/axeとは分ける。
- 現行フォーム版の実配送は未実施。基盤のOWNER確認済み情報を、新版2通フローの実配送実証へすり替えない。
- モバイルLCP2.5秒目標は未達。詳細は `FINAL_MASTER_QA.md` と性能JSON。
