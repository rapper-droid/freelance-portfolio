# REVIEW PACK — つど環 / TETSU WORKS 再構築

レビューする人が、最短で「何が本当か」を確かめるための資料。
褒められる点ではなく、**直したものと未検証のもの**を先に書く。

記録日: 2026-09-24（Asia/Tokyo）
対象ブランチ: `claude/ultimate-experience-20260923`
指示書: `TSUDOWA_TETSUWORKS_ULTIMATE_EXPERIENCE_MASTER_20260923.md`

---

## 0. 30 秒で確かめる

```bash
cd C:/Users/tetsu/tanebi-works-ultimate
npm run dev          # http://localhost:3000（127.0.0.1 は hydration しない）
```

| 見るもの                    | URL                  | 何が確かめられるか                      |
| --------------------------- | -------------------- | --------------------------------------- |
| 注文と席予約ができる店      | `/kissa`             | 注文・受取時間・席予約・変更・運営画面  |
| 在庫のある店                | `/forme`             | 色 × サイズの在庫、注文、取消で戻る在庫 |
| ひとつの記録で繋がる 3 画面 | `/demos/automation`  | 確認 → SMART INBOX → ADMIN              |
| 自分のデータを持ち出す      | `/kissa/my` の一番下 | 書き出し・読み込み・控え・初期化        |
| 検証の記録                  | `/demos/qa`          | 実行済みの検査と、未実施の理由          |

**本番（tsudowa.com）には P1〜P3 までが反映済み。P4・P5 は未反映。**

---

## 1. 台帳（ここから読むのがいちばん早い）

| 台帳                                         | 中身                                              | 生成                   |
| -------------------------------------------- | ------------------------------------------------- | ---------------------- |
| [PAGE_CONTRACTS.md](PAGE_CONTRACTS.md)       | 29 テンプレート / 89 実体。目的・入出力・状態契約 | `npm run qa:contracts` |
| [ROUTE_INVENTORY.json](ROUTE_INVENTORY.json) | 97 route（page 89 / api 3 / asset 4 / error 1）   | `npm run qa:inventory` |
| [IMAGE_COVERAGE.json](IMAGE_COVERAGE.json)   | 商品画像・プレビュー・参照ファイルの充足          | `npm run qa:images`    |
| [../qa-evidence.json](../qa-evidence.json)   | 実行済みの検査と、未実施の理由                    | `npm run qa:evidence`  |
| [COST_REPORT.md](COST_REPORT.md)             | 追加支出 0 円の内訳                               | 手動                   |
| [OWNER_ACTIONS.md](OWNER_ACTIONS.md)         | 所長の操作が必要な項目                            | 手動                   |

台帳は**実際に配信されている画面から作る**。ルート台帳はサーバーを立てて 97 URL を
実際に要求し、観測したステータスを書く。PAGE_CONTRACTS はそれを結合するので、
画面が増えて契約が書かれていなければ CI が落ちる。

---

## 2. レビューで特に見てほしい判断

### 2-1. 直した「嘘」

| 場所             | 書いてあったこと                 | 実際                       |
| ---------------- | -------------------------------- | -------------------------- |
| SMART INBOX      | 「再読み込みで初期化」           | 記録は残る                 |
| KISSA            | 「来店予約は行いません」         | 席を予約でき、変更もできる |
| FORME            | 「注文・決済はありません」       | 注文でき、在庫が減る       |
| 新しい版のデータ | 「元のデータは変更していません」 | 次の編集で上書きしていた   |

最後の 1 件は P5 で直した。新しい版・壊れたデータは `<key>--backup` へ**控えを取って
から**新しい sandbox を作る。画面には控えの戻し・書き出し・削除がある。

### 2-2. 意図的にやらなかったこと

- **DAYBOOK は保存しない。** 画面にそう書き、テストで固定している。予約デモの目的は
  一週間の見通しで、端末に残す必要がない。
- **問い合わせと顧客の自動紐づけをしない。** 同名の別会社を取り違えるため、
  ADMIN では人が明示的に結ぶ。
- **`/services` のメニューを増やしていない。** 公開中の 2 件が参照するデモは REFINE と
  CSV で、店ではない。売る範囲を広げるのは所長の判断。
- **`categories` の `scope` を書き換えていない。** デモの能力が上がっても、
  営業の範囲は勝手に広げない。

### 2-3. 性能の予算（数字を厳しくしていない理由）

Lighthouse の performance スコアは負荷で数点動く。20 ルートを連続測定した直後の
`/` は 76、単独では 87〜90 だった。そこで**決定的な指標だけを厳密に**握る。

| 指標               | 予算     | 種別                                                             |
| ------------------ | -------- | ---------------------------------------------------------------- |
| accessibility      | = 100    | 厳密                                                             |
| best-practices     | ≥ 95     | 厳密                                                             |
| CLS                | ≤ 0.05   | 厳密                                                             |
| 転送 JS / route    | ≤ 320 KB | 厳密                                                             |
| SEO                | = 100    | 厳密（`/kissa/*`・`/forme/*` は noindex のため除外、理由を記録） |
| performance スコア | ≥ 60     | 煙感知器                                                         |

---

## 3. 検証結果（すべて実行済み・数値は実測）

| 検証             | コマンド                 | 結果                                   |
| ---------------- | ------------------------ | -------------------------------------- |
| lint             | `npm run lint`           | 0 errors, 0 warnings                   |
| 日本語の改行     | `npm run qa:text`        | PASS                                   |
| 画像 coverage    | `npm run qa:images`      | 必須 4 枠すべて 100%                   |
| typecheck        | `npm run typecheck`      | pass                                   |
| unit             | `npx vitest run`         | **629 passed** / 45 files              |
| build            | `npm run build`          | success                                |
| E2E（3 幅）      | `npm run test:e2e`       | **378 passed**                         |
| 表示崩れ（4 幅） | `npm run qa:visual`      | 47 ルート × 320/390/768/1440           |
| デザイン（6 幅） | `npm run qa:design`      | 6 ルート × 6 幅、axe/focus/runtime     |
| KISSA / FORME    | `qa:kissa` / `qa:forme`  | 56/56 / 62/62                          |
| 操作系           | `npm run qa:controls`    | 140 controls / 動かないボタン 0        |
| リンク           | `npm run qa:links`       | 42 routes / 234 links                  |
| SEO              | `npm run qa:seo`         | 41 routes（要 `NEXT_PUBLIC_SITE_URL`） |
| 性能（mobile）   | `npm run qa:performance` | **20 ルート、予算内**                  |
| ルート台帳       | `npm run qa:inventory`   | 97 entries / 想定外ステータス 0        |
| 画面契約         | `npm run qa:contracts`   | 29 テンプレート / 89 実体              |

### 検査が本当に落ちることを確かめた

新しい検査は「緑になる検査」ではなく「赤くなる検査」である必要がある。
4 件とも、故意に壊して落ちることを確認してから採用した。

| 検査             | 壊し方                          | 結果                       |
| ---------------- | ------------------------------- | -------------------------- |
| `qa:images`      | artId を存在しない値にする      | exit 1・件数と id を表示   |
| `qa:text`        | （P4 で 61 件検出して修正済み） | exit 1                     |
| `qa:contracts`   | 契約のテンプレート名を変える    | exit 1・不足と余剰を表示   |
| `qa:performance` | 予算を 99 に上げる              | exit 1・route と数値を表示 |

---

## 4. 未検証・未接続（ここが「まだ」の全部）

| 項目                    | 状態                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| 実決済                  | 内部シミュレーターのみ。外部サービス未接続                         |
| 実注文・実予約・実配送  | 発生しない。全画面で架空店舗と明示                                 |
| 実 AI                   | 未稼働。ルール処理の結果を AI の成果として表示しない               |
| メール送信              | `/contact` のみ実送信。デモからは出ない                            |
| 複数端末の共有          | しない（意図的）。**書き出し / 読み込みで移せる**                  |
| Remote preview での検査 | 未実施（P4・P5 は本番未反映のため）                                |
| Automation の技術画面   | 未着手（schema・mapping・retry・ログ）                             |
| REPORT FLOW             | 未着手                                                             |
| 8 幅の visual baseline  | 4 幅（320/390/768/1440）+ design QA 6 幅。8 幅の baseline は未整備 |
| 追加支出                | **0 円**。新しい SaaS・API・アセットを導入していない               |

---

## 5. 所長の操作が必要なもの

1. **本番反映の承認。** P4（`e4c7c66`）以降は未反映。手順は
   PR → `tsudowa/cloudflare-workers-candidate` →
   `node scripts/workers-production.mjs deploy-candidate`。
2. tetsuworks.com（Netlify / Codex 所有ブランチ）は今回の対象外のまま。
3. 実メール・実決済・外部 AI の有効化は、それぞれ別の承認が要る。

詳細は [OWNER_ACTIONS.md](OWNER_ACTIONS.md)。

---

## 6. 落とし穴（次のセッションが踏みやすい順）

- **`next dev` + `127.0.0.1` は hydration しない。** 画面は完全に描画されるので
  スクリーンショットでは気づけない。必ず `localhost`。
- **`next start` を止め忘れると、古いビルドを検査してしまう。** P5 中に実際に起きた:
  修正済みのはずの文字列が画面に残って見え、原因は前のプロセスが同じポートを
  握っていたことだった。ポートを変えるか、確実に落とす。
- **Prettier の `format:check` は Windows ではリポジトリ全体が落ちる**
  （`core.autocrlf=true`）。CI（Linux）は通る。触ったファイルだけ確認する。
- **シェル経由で `\n` を含む JS / 正規表現を書くと潰れる。** Write ツールを使う。
- **PowerShell の `Set-Content -Encoding utf8` は日本語を壊すことがある。**
  ファイル編集は Python か Write ツールで。
- **デモの中に置くパネルは色を継承しない。** 各デモが文字色を塗り替えるため、
  暗いパネルに暗い文字が乗る。実際に 2 回起きた。
