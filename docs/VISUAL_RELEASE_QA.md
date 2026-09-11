# ページ別ビジュアル更新 — QA

2026-09-11。開始点 `39b96d8`、ブランチ `codex/portfolio-figma-sales-ui`。既存Figma営業UIの上に、写真・商品画像・読めるUI図解を追加しました。

| 検証                      | 結果                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| format / lint / typecheck | 成功、lint警告なし                                                  |
| unit                      | 50件成功                                                            |
| production build          | 成功。Netlify本番URL・contact/analytics OFF設定を維持               |
| E2E                       | 66件成功。既存assertionを保持し、ECの3色画像・alt・読込検証を追加   |
| Visual QA                 | 37ルート×4幅＝148画面。欠損画像・横はみ出し・console/runtimeエラー0 |
| axe / keyboard focus      | トップ・全一覧・代表4詳細×4幅＝24画面成功                           |
| 内部リンク                | 120件成功                                                           |
| 素材                      | WebP 6点、合計297,502 bytes、最大91,350 bytes                       |
| プレビュー                | 11作品×3幅の実画像、主要8作品40枚を再生成                           |

Desktop1440 / Tablet768 / Mobile390 / 小画面320で確認。実機Safariの結果ではなくChromium相当viewportです。追加画像は同一ホストのNext Imageから配信し、公開AI APIやランタイム課金を追加していません。

## 目視確認と修正

- KISSA: Heroのアーチ状トリミングでカップを保持。店内の補助写真は横長、スマートフォンでは窓とカウンターが残る位置へ調整。
- FORME: 同じ構図の3色画像を選択に連動。素材感の寄りは上側に合わせ、ふたの接合部が切れないよう修正。価格・数量・カート動作を保持。
- FLOWSTATE: 従来の固定高プレビュー枠でボードが切れたため高さ制限を解除。スマートフォンは3工程を縦に配置。
- SMART INBOX: フローは紺・シアン、操作領域は読みやすい明色を維持。ルール処理と人の確認を明記し、自動送信を装わない。
- 改善比較・QA: 既存操作を保持し、詳細ページの図解だけを追加。
- 新プレビューrevisionのファイルをNext起動前に登録し、撮影後の詳細ページ画像404を解消。撮影スクリプトは画像のdecode失敗で終了します。

## 証跡

- [素材・用途・プロンプト](VISUAL_ASSETS.md) / [容量・ハッシュ](VISUAL_ASSETS.json)
- [全画面検査](screenshots/portfolio/visual-report.json)
- [axe・focus](screenshots/sales-ui/report.json)
- [リンク](link-report.json)
- [KISSA Desktop](screenshots/portfolio/cafe-desktop-firstview.png)
- [FORME Mobile](screenshots/sales-ui/projects-ec-390-visual-story.png)
- [FLOWSTATE Mobile](screenshots/sales-ui/projects-saas-390-visual-story.png)
- [INBOX Desktop](screenshots/sales-ui/projects-inbox-1440-visual-story.png)

既存の `RELEASE_QA.md` / `docs/performance/` は前回Figma UI更新のローカル計測記録です。今回のLighthouseは同じGitHub CIワークフローで実行し、当該commitのActions artifactに生データを保存します。本番配信性能を測った値とは区別します。

Netlify設定、環境変数、contact API、スパム対策、analytics、Sentry、12カテゴリURL・11作品を維持。mainの統合・本番設定の変更・本番デプロイは今回実施しません。
