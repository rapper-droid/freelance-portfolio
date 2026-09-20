# HANDOFF — 再開のための最小情報

更新: 2026-09-21 / このファイルだけで再開できるようにしてある。

## 1. どこで作業しているか

| 項目         | 値                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------- |
| repo         | `rapper-droid/freelance-portfolio`（**public**。営業データを置かない）                              |
| worktree     | `…/work/tsudowa-visual-polish`                                                                      |
| branch       | `claude/growth-p0-20260920`（分岐元 `78f04e9` = 現在の本番と同じ内容）                              |
| 未 push      | このブランチは **origin に push していない**                                                        |
| 触っていない | `codex/*`、他の worktree、`~/tsukutta-lab`、`~/tanebi-hq`、`~/cw-apply-os`、`~/freelance-portfolio` |
| 非公開データ | `~/.tsudowa-growth/`（`npm run growth:brief -- --init` で作成）。Git 管理外                         |

## 2. 入力と正本

- 指示書: `TSUDOWA_GROWTH_ALL_IN_ONE_20260919.md`
  （SHA-256 `3c6eeb7d4d2ecef85db68a554a75c6b981d74ad9837da2473e3e574481b8f922`、全1467行）
- 現況: `docs/growth/CURRENT_STATE.md`
- 進捗: `docs/growth/TASK_STATE.json`
- 承認待ち: `docs/growth/ACTION_MANIFEST.md`

## 3. 実行できるコマンド

```bash
npm run verify        # lint → typecheck → unit → build
npm run test:e2e      # Playwright（mobile / tablet / desktop）
npm run growth:lint   # 出品・提案原稿を媒体ルールで検査
npm run growth:brief  # 今日見るもの（--init で置き場所作成、--cw で CW APPLY OS 用）
node scripts/growth-visual-qa.mjs   # 360/390/768/1440 の表示検査（要: localhost:3210 で起動）
```

## 4. 終わっていること

- 定額メニュー2本（W01 / W02）、`/services`、`/partners`、`/rescue`
- 相談文メーカー（送信しない。既存フォームへ sessionStorage で引き継ぐ）
- 案件サイト経由と自社直接の導線分離（流入元の記憶は12時間・タブ内のみ）
- CSVツールの改善（整形オプションの分離、変更セルの表示、数式無害化の修正）
- 計測イベントの追加（**本番は未計測**）
- 媒体別の原稿8本（未公開）、規約の一次情報記録、原稿リンター
- 営業台帳と日次サマリー（repo 外のローカル運用）

## 5. 終わっていないこと（次の3つ）

1. **候補の調査（GX-05）**: 協業募集の一次情報を集め、足切りと採点を通し、
   下書きを作る。CrowdWorks 案件は `npm run growth:brief -- --cw` で
   CW APPLY OS に渡す（この repo で二重管理しない）。送信は A-04 の承認後。
2. **事例3本・解説ページ・完成品テンプレートの仕上げ（GX-06/07）**。
3. **所長の判断待ち**: A-02（価格）、A-03（計測）、A-04（出品・応募・投稿）、
   A-05（営業URLの統一）。判断が出るまで、実装側は現状維持でよい。

申し送り（デザイン側の判断が要るもの）:

- トップページの `.hq-works-window` の画像が 320〜390px で数px はみ出す
- トップページのラボ図解のラベルが 320px で 7px（日本語の可読下限未満）
  いずれも今回の変更前から本番に存在。直すならアートディレクション側の判断が必要。

## 6. 触ってはいけないもの

- `src/lib/portfolio.ts` の既存 slug・カテゴリID・URL（既存の営業URLが壊れる）
- 既存の受付処理（`src/app/api/contact/route.ts`、`src/lib/contact*.ts`）の
  検証・レート制限・本文非保存の方針
- `wrangler.production.jsonc` の `routes`・Custom Domain・DNS・メール設定
- 他エージェントの worktree と `codex/*` ブランチ
- `.env*` / `.dev.vars` / secret の値

## 7. 前提を疑うときの確認先

- 本番が何を配信しているか: `docs/production-status.md` と
  `https://tsudowa.com/`（実際に開く）
- 価格の承認状態: `docs/growth/OFFER_REVIEW.md`
- 規約: `docs/growth/CHANNEL_POLICY.md`（確認日を見て、古ければ取り直す）
