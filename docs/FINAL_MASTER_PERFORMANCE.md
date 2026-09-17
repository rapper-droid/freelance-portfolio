# FINAL MASTER — performance evidence

2026-09-17。実端末のfield CWVではなく、localhostの本番相当NextビルドをLighthouseのmobile simulationで測定。
Windows / Node 24.19 / Chromium headless / Lighthouse 13.4.1。性能計測中は他のブラウザQAを並行させていません。
単回比較を改善率の保証や実運用SLAに用いません。詳細値・LCP element・long tasks・request一覧は各JSONに保存。

## 同じ環境で取り直した主要6ページのbefore / after

| Route            | Before LCP | Final LCP | Final CLS | Final TBT | Perf score |
| ---------------- | ---------: | --------: | --------: | --------: | ---------: |
| `/`              |     3.063s |    2.843s |         0 |      40ms |         95 |
| `/works`         |     3.345s |    2.998s |         0 |      36ms |         94 |
| `/demos/cafe`    |     3.042s |    3.122s |         0 |    26.5ms |         94 |
| `/demos/inbox`   |     2.836s |    2.677s |         0 |    28.5ms |         97 |
| `/demos/admin`   |     2.818s |    2.673s |         0 |      26ms |         97 |
| `/demos/booking` |     2.821s |    2.828s |         0 |    29.5ms |         95 |
| `/contact` 新規  |          — |    2.668s |         0 |    23.5ms |         97 |

LCP 2.5秒以下の目標は主要7ページで未達です。Cafeは約80ms悪化、Bookingは約7ms差であり、両者を改善済みと報告しません。
TOP/WORKSの構成と初期reveal、Inbox/Adminのnoticeは改善。性能の残件を隠して「完全達成」とはしません。

## 転送量とCSS

| Route            | Before CSS transfer | Final CSS transfer | Final image transfer | Final requests |
| ---------------- | ------------------: | -----------------: | -------------------: | -------------: |
| `/`              |            40,283 B |           39,130 B |              8,404 B |             27 |
| `/works`         |            40,283 B |           39,130 B |            103,587 B |             35 |
| `/demos/cafe`    |            40,283 B |           48,842 B |             72,527 B |             27 |
| `/demos/inbox`   |            40,283 B |           42,210 B |              1,193 B |             21 |
| `/demos/admin`   |            40,283 B |           42,210 B |              1,193 B |             21 |
| `/demos/booking` |            40,283 B |           48,842 B |              1,193 B |             25 |
| `/contact`       |                   — |           39,130 B |              1,193 B |             20 |

転送量はHTMLが要求したstylesheetに加え、計測中の通常prefetchで取得した分を含みます。全てを初期render blockerと同一視しません。
`showcase.css`と`cafe-demo.css`はroot importからデモ側へ移し、TOP/WORKSの配信量低下を確認できたため保持。
新しい受付・デモidentityのCSS追加があり、全routeで減ったわけではありません。

新設したcontact/full-demoリンクの先読みを止めた比較:

- TOP: 30→27 requests。
- WORKS: 38→35 requests。
- Inbox/Admin: 29→21 requests、48,758→42,210 BのCSS（build間の小差を含む）。
- Cafe: 33→27、Booking:31→25、Contact:23→20 requests。

通常クリックでのclient navigationは維持し、E2Eは実リンク経由で11独立デモに進むことも確認。
数値を合わせる目的でno-JS相当の別ページを計測したり、Lighthouse時だけ演出を外したりしていません。

## 残っているLCP要素とボトルネック

| Route            | 最終LCP element / asset                                 | 残る原因                                                           |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `/`              | h1内の`EXPAND.`。画像ではない                           | 共通CSS・font・HTML解析後の描画待ち。初期title animationは撤去済み |
| `/works`         | `/previews/saas-desktop-master-4.webp` のresponsive派生 | high/eagerで取得。画像到着以外のCSS/render delayが残る             |
| `/demos/cafe`    | `/visuals/kissa-ritual-v2.webp` のresponsive派生        | priority/highは設定済み。デモ用と共通CSSの複数requestが残る        |
| `/demos/inbox`   | SMART INBOXのh1                                         | 旧privacy noticeではなくtitle。共通CSSの待ち                       |
| `/demos/admin`   | ADMIN DASHBOARDのh1                                     | 同上                                                               |
| `/demos/booking` | 日付期間を伝える見出し直下の段落                        | 共通CSSとdemo CSS。操作領域は初期表示                              |
| `/contact`       | 日本語h1                                                | 写真なし。共通CSS/render delay                                     |

Lighthouseのrender-blocking savings見積りは主に約400–600ms。改善量の確約ではありません。
global CSS全層の再編・purgeは今回の「巨大refactor禁止」と回帰リスクから行いません。
CSS inline化も検討しましたが、[Next.js公式のinlineCss説明](https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss)がexperimental/production非推奨であり、重複・cacheの代償があるため採用しませんでした。
目標未達は `PERF-LCP-002` としてOWNERへ開示して引き継ぎます。

## 拡張8routeの検査

先読み調整直前の同じ画面実装で、カテゴリとcaseも測定。

| Route               |    LCP |    TBT |
| ------------------- | -----: | -----: |
| `/works/lp`         | 3.113s | 24.5ms |
| `/works/api`        | 2.899s | 60.1ms |
| `/works/automation` | 3.150s | 64.3ms |
| `/works/qa`         | 2.921s | 63.8ms |
| `/projects/cafe`    | 2.720s | 25.5ms |
| `/projects/saas`    | 2.898s |   29ms |
| `/projects/ec`      | 2.647s |   23ms |
| `/projects/inbox`   | 2.194s |   30ms |

全てCLS0、accessibility/best-practices/SEO100。実際の読み上げ・実機確認を代替しません。
Chrome DevTools MCPはこの環境で利用できず、その専用trace手順は未実施。既存LighthouseとPlaywrightの測定であり、DevTools MCP traceを取得したと主張しません。

## 画像予算

新しい公開画像はWebP33点、合計1,108,938 B、最大59,510 B。巨大PNGを公開用に追加していません。
KISSA4枚の原本は合計577,794 BのWebP。Next/Imageのresponsive変換でviewport相応を配信。
各画像の元capture・生成手順・出典は `IMAGE_SOURCES.md`。全て寸法固定、画面外はlazy、priorityはHeroに限定。

## Evidence

- `outputs/master-pass/performance-before/`: 8f57c92を同じマシンで再測定した6route。
- `outputs/master-pass/performance-after/`: 最初の候補ビルド7route。
- `outputs/master-pass/performance-extended/`: 上記拡張8route。
- `outputs/master-pass/performance-final/`: 最終実装7route。
- `scripts/master-performance.mjs`: 再現可能なlocal-only計測。

パスはこのタスクの外側workspaceを基準とします。公開サイトへこれらの内部測定ファイルを追加していません。
