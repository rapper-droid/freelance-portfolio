# OWNER_ACTIONS — 所長に残る操作

更新日: 2026-09-23（Asia/Tokyo）／branch `claude/real-utility-20260922`

この環境で代行できなかった操作だけを、1 本にまとめた。
**認証待ちを隠して完成扱いにしていない**（指示書 §00-1）。

## A. いますぐ判断が要るもの

### A-1. push 先の確認（未実施）

作業ブランチ `claude/real-utility-20260922` を `origin` へ push した。
**`main` にも `codex/portfolio-sales-hub-v2` にも push していない。**

- `codex/portfolio-sales-hub-v2` への push は Netlify 本番ビルドが走るため承認ゲート。
- `main` への push・force push・PR マージも承認ゲート。
- `tsudowa/cloudflare-workers-candidate`（tsudowa.com の配信元）への反映も未実施。

→ **どのブランチへ載せるかは所長の判断。** 指示があれば PR を作る。

### A-2. 公開するかどうか（未実施）

deploy は 1 度も実行していない。公開するなら次の順で、各段階で止められる。

1. `tsudowa/cloudflare-workers-candidate` へ merge
2. `node scripts/workers-production.mjs deploy-candidate` で Worker を更新
3. 公開 URL（`https://tsudowa.com/flow` と `/works`）の実画面を確認
4. 問題があれば `NEXT_PUBLIC_REAL_UTILITY=off` で切り戻す（再デプロイ不要な範囲ではない点に注意：
   環境変数の変更後に再ビルドが要る）

**切り戻しの第一手は Worker のロールバック**（`docs/production-status.md` の手順）。
新体験だけを消したい場合に限り、上記のフラグを使う。

## B. 認証・鍵（この環境では代行できない）

| やること                               | なぜ所長でないとできないか                   |
| -------------------------------------- | -------------------------------------------- |
| Anthropic API キーの発行               | 課金アカウントに紐づくため                   |
| そのキーをサーバー側シークレットへ登録 | 秘密値の入力は所長が行う方針                 |
| 実AIの利用上限の決定                   | 費用の判断                                   |
| Google Calendar / Gmail の接続と審査   | OAuth 同意画面と審査は所有者のアカウント操作 |

手順は `CONNECTOR_SETUP.md` §4 に書いた。**鍵が入るまで実AIは未稼働のままで、
その状態は画面にもそう表示される。**

## C. 実行しなかった操作（指示どおり止めた）

- 実メール送信：0 件
- 実カレンダーの変更：0 件
- 本番デプロイ・DNS 変更：0 件
- DB の破壊的変更：0 件（そもそもスキーマ変更なし）
- 有料 API 呼び出し・新規契約：0 件
- `reset --hard` / `clean` / force push / 既存成果の削除：0 件

他の worktree（`tanebi-works-integration` / `tanebi-works-rename`）と
本番 checkout（`freelance-portfolio`）は**変更していない**。
他エージェントのプロセスも停止していない（停止したのは自分が起動した
開発サーバーのみ）。

## D. 次に着手するなら（未完了 9 項目の優先順）

`ACCEPTANCE.md` の FAIL 5 / BLOCKED 4。営業上の効き目が大きい順に並べた。

1. **A10 体験→相談の引き継ぎ**（FAIL）
   選んだ困りごと・使用ツール・頻度を `/contact` へ前埋めする。
   いちばん小さく、いちばん効く。問い合わせ原文や機密を URL に入れない。
2. **R01 実フォームからの起動**（FAIL）
   `/api/contact` の受付成功イベントを RELAY へ渡す。
   既存の同意文の範囲を先に確認する。範囲外ならテスト受付で検証する。
3. **O01 / O02 永続ジョブの接続**（BLOCKED）
   `StateBackedRunStore` を PRIVATE PILOT 経路につなぐ。
   実装と単体テストは済んでいるので、配線と検証だけ。
4. **B06 予約台帳の排他制御**（BLOCKED）
   同時予約を防ぐトランザクションは、台帳を持ってから。
5. **U08 品質ページへの実テスト結果**（FAIL）
   `/demos/qa` に対象 commit・実行日時・失敗件数を出す。
   秘密情報を公開レポートへ流さない。
6. **A05 旧デモの統合**（FAIL）
   `/demos/inbox` `/demos/admin` を共通 runtime へ寄せる。旧 URL は保つ。
7. **O07 管理者向けの停滞通知**（FAIL）
8. **O09 実原価の記録**（BLOCKED）— 実AI稼働後に自然に満たされる。

## E. 着手前から壊れていたもの（今回の変更が原因ではない）

報告のために記録する。**直していない**（別件のため）。

1. **`npm run qa:links` が失敗する**
   `Broken anchor /history#independent-demos`。
   `src/lib/hq.ts` に id は存在するが、`/history` の描画側に出ていない。
   基点 `d85c531` でも同じ失敗を再現済み。

2. **`npm run test:e2e` の 15 件が失敗する**（5 テスト × 3 プロファイル）
   `tests/e2e/portfolio.spec.ts` と `contact.spec.ts` がスクリーンショットを
   `../../outputs/master-hq/...` へ書く。リポジトリが 2 階層深い場所にある前提で、
   `C:/Users/tetsu/<repo>` からは `C:\Users\outputs\` になり書き込めない。
   基点でも同じ 5 件が失敗することを実測済み。
   → 直すなら、出力先をリポジトリ内（`artifacts/` など）へ移すか、
   環境変数で指定できるようにする。
