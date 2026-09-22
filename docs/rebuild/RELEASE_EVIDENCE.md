# RELEASE_EVIDENCE — 段階ごとの実施状況

記録日: 2026-09-23（Asia/Tokyo）

## 段階の表（指示書 §24）

| 段階            | 状態               | 証拠                                                                               |
| --------------- | ------------------ | ---------------------------------------------------------------------------------- |
| 実装            | **DONE**（範囲内） | branch `claude/real-utility-20260922`、58 ファイル、+12,200 / −4 行                |
| テスト・build   | **PASS**           | `npm run verify` exit 0：lint → typecheck → vitest 397 本（34 ファイル）→ build    |
| E2E             | **PASS**（新規）   | `tests/e2e/flow.spec.ts` 9 本 × 3 プロファイル = **27 passed**                     |
| Visual QA       | **PASS**           | `qa:visual` 4 幅 × 43 ルート／`qa:flow` 4 幅 × 3 経路 7 段階、a11y 違反 0          |
| commit          | **実施**           | 5 commit、HEAD `8869e32`                                                           |
| push            | **実施**           | `origin/claude/real-utility-20260922` = `8869e321241b56f18bf4a866e2aae06ecec84006` |
| merge           | **未実施**         | 承認ゲート。`main` / `codex/portfolio-sales-hub-v2` / `tsudowa/…-candidate` 未変更 |
| deploy          | **未実施**         | 本番デプロイの明示許可が無いため実行していない                                     |
| 公開URLでの確認 | **未実施**         | 未デプロイのため対象が存在しない                                                   |

## commit の内訳

```
8869e32 docs(rebuild): record the baseline, the judgments and what is left undone
379d5fe test(qa): drive the sample's result state, not just the page it starts on
d4f5478 feat(works): lead with the job that gets smaller, not the product name
8757d1e feat(flow): show the work getting done, and what is not connected
0f235ca feat(runtime): one workflow runtime for intake, scheduling and reports
```

基点: `origin/claude/growth-p0-20260920` = `d85c531`（72 commit 先行・0 遅れの最新）

## 触っていないことの確認

| 対象                                          | 実測                                    |
| --------------------------------------------- | --------------------------------------- |
| `origin/main`                                 | `8ace069`（着手前と同一）               |
| `origin/codex/portfolio-sales-hub-v2`         | `ce03541`（着手前と同一。Netlify 本番） |
| `origin/tsudowa/cloudflare-workers-candidate` | `d5bad13`（着手前と同一。tsudowa.com）  |
| 本番 checkout `~/freelance-portfolio`         | 変更なし                                |
| 他 worktree（integration / rename）           | 変更なし                                |
| `/api/contact` と関連（受付・通知・Resend）   | **1 行も変更していない**                |

## 検証ログの要点

```
npm run verify   → exit 0
                   Test Files  34 passed (34)
                   Tests      397 passed (397)
                   ✓ Compiled successfully

npx playwright test tests/e2e/flow.spec.ts
                 → 27 passed (tablet / desktop / mobile)

npm run qa:visual → PASS 320 / 390 / 768 / 1440px × 43 routes
npm run qa:flow   → PASS 320 / 390 / 768 / 1440px
                    3 tracks / 7 steps / 3 panels / 4 stage labels / a11y 0

npm audit         → found 0 vulnerabilities
```

切り戻しの実測（`NEXT_PUBLIC_REAL_UTILITY=off` でビルドして確認）:

```
/flow      → 404
/api/flow  → 404
/works     → 200（ギャラリー保持、新セクションのみ消える）
```

## 着手前から失敗していたもの（今回が原因ではない）

いずれも基点 `d85c531` を checkout して同一の失敗を再現済み。**直していない。**

- `npm run qa:links` → `Broken anchor /history#independent-demos`
- `npm run test:e2e` の 15 件（5 テスト × 3 プロファイル）→
  `ENOENT: C:\Users\outputs\master-hq\...`。
  原因は `tests/e2e/portfolio.spec.ts` ほかが書き出す相対パス `../../outputs/`。

新規の `tests/e2e/flow.spec.ts` はこのパスを使わないため影響を受けない。

## セキュリティ確認

- 新規コードの秘密値スキャン: 0 件
- `NEXT_PUBLIC_` 化した秘密: 0 件（`ANTHROPIC_API_KEY` はサーバー側のみ）
- 公開サンプルは入力を保存せず、外部送信経路を持たない
- `npm audit` 0 件
- HawkScan（DAST）: **未実行**。稼働中のアプリと `HAWK_API_KEY` が
  この環境に無いため（SessionStart が `hawk runtime=false, HAWK_API_KEY=false` を報告）
