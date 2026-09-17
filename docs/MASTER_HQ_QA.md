# TSUDOWA MASTER HQ — verification and visual audit

基準HEAD: `220b6f7aaa078a87f596085bb16a2444321f3d70`

実行コードの最終commit: `c898ca5f762804467411441a897db59ce6068f6a`

Branch: `tsudowa/master-hq-build`

最終の文書commit、build ID、runtime fingerprint、dirty stateは
`outputs/master-hq/checkpoint.json` と `integrity.json` に記録する。
本書とQAスクリプトを含むcommitの後、capture対象とHEADの `src/`・`public/`・package・Next設定が一致することをreport生成時に強制確認する。

## 実行範囲

最終集計: unit 101 / E2E 141 / viewport 178 / 内部リンク227 / SEO 41。
表示・画像decode・pageerror・axe・リンク失敗はいずれも0。
旧ページの94 firstviewは94件すべて画素一致。OWNER viewerも15項目PASS。
TOP動画は1440pxが8.88秒、390pxが8.36秒。WORKS / LABの実到着URLを確認して記録した。

- `hq-verify.mjs`: lint / typecheck / unit 101件 / production build。最新の4段階すべてexit 0。
- 全E2E: tablet / desktop / mobile、141件PASS、skip・flaky・unexpected各0。実メール配送は含まない。
- capture: 52 URL × 390 / 768 / 1440px、主要11 URL × 1024 / 1920px。178条件、firstview/fullの356枚。
- 各条件でHTTP、h1、画像decode、横はみ出し、pageerror、axeを検査する。最終結果は `after/audit.json`。
- 内部リンクとanchor IDは `links.json`。外部リンク先の稼働は、このリンク検査の成功へ含めない。
- SEO回帰は41のindex対象route。11のstandalone experienceはnoindexで、対応するdemoをcanonicalにする。
- TOPの1440 / 390px動画と各11連続画像。初期、arrival、hover、scroll、WORKS、LAB、CONTACT、navigation。
- Lighthouseはlocal production build / mobile simulatedで10 route。実機やfield CWVの証明ではない。

## 既存表示の保全とred / green

新旧の94 firstview比較は、意図的に構成を変更したTOP・WORKSと新設routeを除外する。
最初の比較で、既存8 showcase demoのnotice linkとlaunch barに差を発見した。

原因は、rootからrouteへCSSを分離した際、demo-identitiesより後にportfolioの既存CSSが評価されたこと。
linkが44pxから28px、操作barの上余白が14pxから0へ戻っていた。

`hq-style-order.spec.ts` を追加し、修正前は3 viewportすべてで44px未満を検出。
portfolio基盤を先に読む2行のimport順序修正後は、8デモ × 3 viewportを同じテストで確認してPASS。
成功条件を緩めていない。デモ本体の画面・写真・データ・業務動作は修正していない。

証跡は `style-order-red.json` / `style-order-green.json` / `e2e-final.json`。
最終の画素比較集計は `legacy-visual-comparison.json`。比較対象が同じサイズであることも検査する。

## Visual audit

評価: A = premiumを妨げる実装上の欠陥、B = 改善余地、C = 今回の実装完了。
この評価は主観的なOWNER承認、営業成果、実機の読み上げ検証を代替しない。

| 対象                          | 判定 | 確認したこと                                                                               |
| ----------------------------- | ---- | ------------------------------------------------------------------------------------------ |
| TOP / Hero                    | C    | 3行の英語、短い日本語、独自mark、実UIとLAB concept。390pxで2つの入口が初期画面に収まる     |
| ブランド階層                  | C    | 親ブランド・受託制作・独立LABを分離。架空の第三事業や法人を足していない                    |
| Selected work                 | C    | Cafe / Inbox / Automationの3件。課題・解き方・操作できる結果・demoを並べる。自主制作と明示 |
| WORKS / 既存デモ              | C    | 既存11作品・12カテゴリ・8サービス・参考料金を維持。CSS順序による退行は修正し回帰テスト化   |
| LAB / 履歴                    | C    | 別世界のgateway、CONCEPT表示、実commitに基づく日付。偽のLIVEや公開済みclaimなし            |
| 問い合わせ                    | C    | 制作 / 総合の役割と下書きを分離。キーボードfocus、部分成功、再送、無効時の停止を検証       |
| Mobile / typography / spacing | C    | 390px専用配置とnative menu。主要routeは1920pxまで確認する。日本語を無理に1行固定しない     |
| Motion / a11y                 | C    | 約1.5秒、タブ初回のみ、内容を隠さない。reduced-motionとJSなしの主要導線を検証              |
| LCPのさらなる短縮             | B    | すべてのrouteを2.5秒以下とは扱わない。既存デモ写真と営業CSSが残るrouteは、実測の要因を別記 |

確認範囲でAの残存は0。Bのうち、閲覧・操作・導線を妨げる重大なものは0。
「依頼したい」「また見たい」と感じるかは `MASTER_HQ_OWNER_CHECKLIST.md` でOWNERが判断する。

## 性能の読み方

最終値は `performance-after/summary.json`、元のLighthouse全結果は同フォルダのroute別JSON。
beforeは3147の3 routeを同環境で計測したもの。単発比較にはCPUやキャッシュ状態のばらつきがある。
HQではrootの重複reset、404経由のCSS混入、WORKS/LABの自動先読みを除き、初期CSSとリクエストを抑えた。
Heroの実UI画像は正しいsizesとeager / high priority、本文と見出しを初期HTMLから表示する。

LCP要素はrouteごとに記録する。

- `/`: `/previews/inbox-desktop-master-4.webp` をNext/Imageで配信するHero内の実UI。
- `/works`: `/previews/saas-desktop-master-4.webp` の代表作品画像。
- `/demos/cafe`: `/visuals/kissa-ritual-v2.webp` の店舗Hero画像。
- Inbox / Admin: demo headingのh1。Booking: introの本文。
- 制作相談: intakeのh1。総合窓口: intakeの説明本文。
- LAB: h1。History: 最新記録の見出し。

画像がLCPでないrouteへ、画像圧縮だけで解消するとは言わない。
既存sales/demoのCSS bundle、main-thread render delay、hydrationも診断対象。
Lighthouseの推定短縮時間と、実際に因果を確認した改善を混同しない。

## 最終Lighthouse値

計測完了: 2026-09-17T04:18:43.074Z。全10 routeでAccessibility / Best Practices / SEOは100、CLSは0。

| Route            | Performance | LCP    | CLS |
| ---------------- | ----------- | ------ | --- |
| /                | 95          | 2.538s | 0   |
| /works           | 95          | 2.930s | 0   |
| /demos/cafe      | 93          | 3.196s | 0   |
| /demos/inbox     | 96          | 2.663s | 0   |
| /demos/admin     | 96          | 2.670s | 0   |
| /demos/booking   | 96          | 2.817s | 0   |
| /contact         | 96          | 2.674s | 0   |
| /contact/general | 96          | 2.767s | 0   |
| /lab             | 98          | 2.440s | 0   |
| /history         | 98          | 2.438s | 0   |

同環境の旧TOPはPerformance 77 / LCP 3.052s、今回TOPは95 / 2.538s。
TOPの初期CSS転送量は39,130→8,535 bytes、総リクエストは27→16。
単発のローカルsimulated比較であり、公開後も同じスコアになるという保証ではない。
WORKS 2.930s / Cafe 3.196sなど、全routeのLCP 2.5s以下は未達として残す。

## Format / tech debt

このWindows checkoutの全体Prettier出力は150ファイルのwarning。
過去の69という件数を今回の実測として再利用しない。
今回の差分との交差は0。`integrity.json` で、150件すべて開始時blobと一致し、LF正本のformat warningが0であることを確認済み。
全体formatがgreenだとは報告せず、checkout改行由来の環境負債として切り分ける。
無関係な150ファイルの整形や、Gitのautocrlf / 改行ポリシー変更はしない。

## 外部サービス・secretの境界

ローカルは `CONTACT_ENABLED=false` / `ANALYTICS_ENABLED=false`。
API、mail renderer、abuse制御、商品データ、mark、icon、manifest、lockfileの11保護ファイルをbaselineと比較する。
メール安全ガイドの再送・部分成功・失敗時停止という観点を適用し、無設定時に成功を偽装しない。
新しいgeneral窓口の実配送、実Turnstile、DNS、メール外部設定は未検証・未変更。
secretをコピー・commit・証跡へ出力していない。

LAB本体の公開URL、実機iOS/Android・実スクリーンリーダー、公開環境での性能と配送は別のOWNER gate。
`git ls-remote`でmain SHAを読み取り照合したが、push / fetch / merge / deployは行わない。
Cloudflare / DNS / Resend / mail routing、TANEBI / tanebi.jp に変更なし。

## 正本となる最終証跡

外側workspaceの `outputs/master-hq/` に保存。

- `OWNER_REVIEW.html`: 新旧比較、390px、全route/幅のviewer、動画、OWNER checklist。
- `RESULTS.md` / `checkpoint.json`: 最終HEAD、build、runtime fingerprint、結果サマリー。
- `verify/summary.json` と4ログ、`e2e-final.json`、`after/audit.json`、`links.json`。
- `performance-before/` / `performance-after/`、`motion/timings.json`。
- `integrity.json`、`remote-reference.json`、`legacy-visual-comparison.json`。
- `review-viewer-check.json`: viewerの画像切替、動画再生、390px、外部リソースなし、読み取り専用HTTPの確認。

`e2e.json`、`performance-initial/`、`spot/`、旧server logは途中の記録で、最終結果として採用しない。
既存の `outputs/master-pass/` と `outputs/owner-review-8f57c92/` は変更しない。

ローカルHQ: `http://127.0.0.1:3160/`。
比較元: `http://127.0.0.1:3147/`。
OWNER viewer: `http://127.0.0.1:3162/OWNER_REVIEW.html`。

READY_FOR_OWNER_REVIEW / NOT_DEPLOYED は、最終証跡の検査後に出す。
