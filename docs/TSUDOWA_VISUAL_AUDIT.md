# TSUDOWA Visual Audit

実施日: 2026-09-17
対象: TSUDOWA移行ブランチの全37コンテンツURL

## 判定基準

- A: 明確な品質不足。公開前に修正が必要。
- B: 機能や理解を妨げないが、具体的な改善余地が残る。
- C: 今回の目的に対して変更不要。

## 初回監査で見つかったA

| 対象                | 問題                                                                         | 修正                                                       |
| ------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `/`                 | 親ブランド、受託部門、別ブランド、将来事業の関係が画面で説明されていなかった | TSUDOWA hero、Brand Architecture、TETSU WORKS bridgeを新設 |
| 全37 URLの共通shell | TANEBIのwordmark、mark、footer hierarchyが残っていた                         | TSUDOWA mark、header、footer、metadata、OGPへ統一          |
| `/demos/cafe`       | 小さい茶文字とtagのcontrastが3.35〜4.10:1                                    | 暖色を維持したまま5.19:1以上へ修正                         |

## 修正後の全URL分類

| URL                                                                                                                                                                                                                   |     数 |       最終判定       | 確認内容                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: | :------------------: | ------------------------------------------------------------- |
| `/`                                                                                                                                                                                                                   |      1 |          C           | 親ブランド理解、事業階層、CTA、section rhythm、desktop/mobile |
| `/privacy`                                                                                                                                                                                                            |      1 |          C           | 読みやすさ、semantic構造、共通footer                          |
| `/works`                                                                                                                                                                                                              |      1 |          C           | 11作品、filter、card hierarchy、CTA                           |
| `/works/web`, `/works/lp`, `/works/coding`, `/works/nextjs`, `/works/responsive`, `/works/improvement`, `/works/ec`, `/works/apps`, `/works/api`, `/works/automation`, `/works/design`, `/works/qa`                   |     12 |          C           | category固有copy、対象作品、料金・納品、画像、mobile          |
| `/projects/cafe`, `/projects/saas`, `/projects/ec`, `/projects/automation`, `/projects/booking`, `/projects/improvement`, `/projects/creative`, `/projects/qa`, `/projects/csv`, `/projects/inbox`, `/projects/admin` |     11 |          C           | case hierarchy、3 device preview、料金・納品、Live Demo導線   |
| `/demos/cafe`, `/demos/saas`, `/demos/ec`, `/demos/automation`, `/demos/booking`, `/demos/improvement`, `/demos/creative`, `/demos/qa`, `/demos/csv`, `/demos/inbox`, `/demos/admin`                                  |     11 |          C           | 独立案件の世界観、操作、状態、keyboard、contrast、responsive  |
| **合計**                                                                                                                                                                                                              | **37** | **A=0 / B=0 / C=37** | 修正後の再監査結果                                            |

`C`は「将来の改善案が存在しない」という意味ではありません。今回の公開準備に対する具体的なA/B指摘が残っていない、という判定です。ブランドの最終的な感覚評価は自動判定せず、`TSUDOWA_BRAND_FEEL`としてOWNER reviewに残します。

## 実ブラウザ証跡

- Design QA: 6代表ルート × 320 / 390 / 768 / 1024 / 1440 / 1920px = 36画面
- Full route QA: 37ルート × 320 / 390 / 768 / 1440px = 148表示
- Full route結果: HTTP 200、横overflow 0、broken image 0、runtime error 0
- Design QA結果: axe violation 0、keyboard focus failure 0、image decode failure 0
- Internal links: 37ルート、123リンク・anchor
- Playwright: tablet / desktop / mobile

主な証跡:

- `docs/screenshots/sales-ui/report.json`
- `docs/screenshots/portfolio/visual-report.json`
- `docs/link-report.json`
- `docs/screenshots/sales-ui/`
- `docs/screenshots/portfolio/`

## 目視所見

- Desktop heroは3秒以内に `TSUDOWA = 親ブランド` と理解でき、右側の輪と分岐が概念を補助する。
- Mobile heroはCTAを1つに絞り、ブランド構造から現在事業へ順に辿れる。
- TETSU WORKSは料金、作品、納品、工程、相談へ連続し、営業力を維持する。
- TSUKUTTA LABと未発表事業は大きく売らず、親ブランドの構造だけを示す。
- KISSA、FLOWSTATE、FORME、SMART INBOX、booking、adminは親ブランドの外観をコピーせず、独立案件として維持する。
- motionはreduced-motionで停止し、scroll reveal失敗時もcontentを隠さない。

## Performance

Lighthouse mobile simulated throttling、ローカルproduction build:

- Performance: 80〜98
- Accessibility: 全8ルート 100
- Best Practices: 全8ルート 100
- SEO: 全8ルート 100
- CLS: 全8ルート 0

フィールドCore Web Vitalsではありません。本番公開後の実測はOWNER review後に別途行います。
