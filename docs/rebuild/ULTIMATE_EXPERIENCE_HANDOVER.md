# ULTIMATE EXPERIENCE — 引き継ぎ

記録日: 2026-09-23（Asia/Tokyo）／入力指示書:
`TSUDOWA_TETSUWORKS_ULTIMATE_EXPERIENCE_MASTER_20260923.md`（600行を読了）

この文書は **次のセッションが迷わず再開するための事実** を書く。
「できたこと」と「できていないこと」を同じ精度で書く。秘密値は書かない。

---

## 1. Git の保存状況

| 項目           | 値                                                           |
| -------------- | ------------------------------------------------------------ |
| worktree       | `C:/Users/tetsu/tanebi-works-ultimate`                       |
| branch         | `claude/ultimate-experience-20260923`                        |
| 分岐元         | `origin/tsudowa/cloudflare-workers-candidate`（= `cbaf575`） |
| HEAD           | `git log --oneline -1` で確認（下の一覧の最上段）            |
| 先行           | 8 commit（すべて **未 push**）                               |
| 未コミット差分 | なし（このセッション分は全て commit 済み）                   |

```
（最新）この文書の更新と、検証の証拠ファイルの再生成
876c03f  chore(qa): refresh the recorded evidence after the final verification pass
d9bd299  fix(ops): a seeded case gets its arrival time, not a parsed sentence
e2e422e  feat(ops): RELAY, SMART INBOX and ADMIN become one record
41526f0  docs(rebuild): the handover, and KISSA in the route ledger
24911b2  fix(demos): the sample data follows the calendar instead of a fixed week
46bb2b6  feat(kissa): the cafe becomes a shop you can actually use
fc038dc  feat(shop): one domain layer behind the cafe's menu, orders and tables
cbaf575  (分岐元) Merge pull request #5 ...
```

**他の柱・他の worktree・`codex/*` ブランチは一切触っていない。**
本番 checkout `C:/Users/tetsu/freelance-portfolio` も未変更。

### push していない理由

初回 push は取り消せないため承認ゲート。`tsudowa/cloudflare-workers-candidate`
への PR を出すところから所長の判断。

---

## 2. 見られる URL（ローカル）

`npm run dev`（`http://localhost:3000`）で全て開ける。

> **`127.0.0.1` では動かない。** `next dev` は `127.0.0.1` を cross-origin と
> して拒否し、HTML は返すが hydration しない = 全てのボタンが無反応になる。
> 画面は正常に見えるので気づきにくい。QA は必ず `localhost` で行う。

### 新規（このセッションで作った KISSA）

| URL                       | 何ができるか                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| `/kissa`                  | 店舗トップ。営業時間・定休日・席数は 1 つの定義から表示          |
| `/kissa/menu`             | 14 品。分類チップ（件数つき）・検索・「いま注文できるものだけ」  |
| `/kissa/menu/[productId]` | 商品詳細。温度/サイズ/追加の軸は **その商品にあるものだけ** 出る |
| `/kissa/order`            | カート → 受取時間 → 内容確認 → 完了 → 支払シミュレーター         |
| `/kissa/reserve`          | 人数 → 時間 → 席。仮押さえ 10 分 → 確定                          |
| `/kissa/my`               | この端末の注文と予約。経過の表示、予約の変更・取消、注文の取消   |
| `/kissa/admin`            | 運営画面。注文の進行・本日の席・販売状態の切替・売上集計         |

`/demos/cafe` と `/experience/cafe` の上部に「画面を動かして試せます」パネルを
置いた。運営画面への導線もここにある（客側ヘッダーには出さない）。

### 既存（このセッションで直したもの）

| URL                 | 変更                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `/demos/automation` | RELAY。確認済みにすると **実際に記録が作られ**、SMART INBOX に出る    |
| `/demos/inbox`      | SMART INBOX。状態・担当・下書きが記録に残り、再読み込みしても消えない |
| `/demos/admin`      | ADMIN。顧客と問い合わせを紐づけられ、問い合わせから顧客を作れる       |
| `/demos/booking`    | 週が **今日から 7 日** になった（旧: 2026-09-18〜24 固定）            |

---

## 3. 完成した体験

「完成」とは、**画面から操作でき、その結果が保存され、他の画面に届く**こと。

### 3-1. KISSA（架空カフェ）

- **注文**: カートの数量変更・削除 → 調理時間と営業時間から計算した受取枠 →
  内容確認 → 注文確定 → 支払（承認/拒否/保留/中断/結果不明）。
  同じ注文・同じ金額の再実行は **課金せず前回の結果を返す**。
- **予約**: 人数に入る席だけ、滞在 90 分 + 片付け 15 分が空いている枠だけ。
  テーブル A/B と連結 A+B は **相互に** 塞ぐ。仮押さえは 10 分で自動解放。
- **変更 / 取消**: 予約の日時・席・人数を変更できる。新しい枠が取れなければ
  **元の予約は残る**。取消は履歴に残る。
- **運営 → 客**: 運営画面で「売り切れ」にすると、メニューと商品ページで即座に
  注文不可になる。「受取待ち」にすると客の確認画面の状態が変わる。
- **保存**: この端末の localStorage のみ。`schemaVersion` つきで、旧形式は
  破棄せず移行する。画面にそう書いてある。

### このセッションで見つけて直した不具合（4 件）

1. **支払の二重実行防止が一度も動いていなかった。** 注文から再構成する過去の
   試行が、保存済み reference を idempotency key として渡していた。照合側は
   別の導出キーを使うので永久に一致しない。reference が決定的なため「動いて
   いるように見えていた」。`paymentKeyFor()` に一本化した。
2. **受取枠が当日分しか出なかった。** 最終受付（18:30）を過ぎた時間帯、および
   定休日（水曜）は、誰が来ても注文できなかった。次の営業日へ送るようにした。
3. **予約変更で、自分自身の予約が空き枠を塞いでいた。**
4. **時間選択が `<ul role="radiogroup">`** で、`<li>` のリスト role が消えて
   いた。メニューカードは h1 → h3 で見出しを飛ばしていた。販売中バッジの緑は
   カード上で 4.29:1（基準 4.5:1 未満）。すべて直した。

---

### 3-2. RELAY + SMART INBOX + ADMIN（1 つの案件データ）

3 画面が別々の配列を持っていた。RELAY で返信を「確認済み」にしても誰にも届かず、
SMART INBOX の問い合わせ主は顧客一覧に存在せず、ADMIN は自分が記録であるはずの
問い合わせを 1 件も知らなかった。RELAY の上に並ぶ 4 ステップ（受付 → 分類 →
下書き → 人の確認）は、最後にラベルが変わるだけで終わっていた。

`src/lib/ops/` が 3 画面の共有記録。純粋関数が「何をしてよいか」を決めるので、
3 画面が食い違えない。

- **RELAY**: 確認済みにすると案件が作られ、受付番号と SMART INBOX への導線が出る。
  そのあと下書きを直すと、**記録側の確認済みが外れる**。差し戻しも記録に効く。
- **SMART INBOX**: 見本 6 件 + RELAY が受け付けた分。対応状況・担当・下書きは
  記録に書かれるので、再読み込みしても残り、ADMIN の集計にも出る。案件ごとに経過。
- **ADMIN**: 顧客一覧は従来どおり自分の保存領域を持ち、案件とは**明示的に紐づける**。
  既存顧客に紐づけるか、問い合わせから顧客を作るか。自動照合はしない（同名の別会社を
  取り違えると、他社の対応履歴が混ざる）。

**確認済みの返信を編集したら確認は外れる** — この記録が存在する理由そのもので、
専用のテストがある。

### 3-3. このフェーズで見つけて直した不具合（3 件）

1. **provider の更新系が、そのレンダー時点の state を見ていた。** RELAY は
   「作る → 下書きを書く → 承認する」を 1 つのハンドラで行う。React はその間に
   再レンダーしないので、承認は「作ったばかりの案件が見つからない」と言って失敗し、
   未確認の案件だけが残っていた。`commit()` が更新する ref を読むようにした。
2. **下書きを 1 文字打つたびに経過が 1 行増えていた。** 連続した編集はまとめる。
   ただし「確認済みを解除した」編集は別の事実なので残す。
3. **E2E 4 件がスクリーンショットを `../../outputs/` に書いていた。**
   ユーザーのホームの隣（`C:/Users/outputs`）で、そこが存在するかどうかで
   合否が変わっていた。`tests/e2e/flow.spec.ts` は既に同じ理由でこの慣習を
   拒否していた。リポジトリ内に書くようにし、CI も回収する。

### 3-4. 変えなかったもの（削る判断）

- **DAYBOOK は再読み込みでリセットされたまま。** 画面にそう書いてあり、E2E も
  その挙動を検証している。意図的な設計なので、揃えるためだけに変えない。
- **RELAY / INBOX と DAYBOOK は別の記録のまま。** スタジオの予約は問い合わせでは
  ない。1 つのモデルに押し込めば、どちらにも合わないものになる。

## 4. 未接続・やっていないこと

| 項目           | 状態                                                                  |
| -------------- | --------------------------------------------------------------------- |
| 決済           | **内部シミュレーターのみ。** 外部サービスへ接続していない。画面に明記 |
| 実予約・実注文 | 発生しない。架空店舗であることを全画面のバナーで明示                  |
| メール送信     | していない。KISSA からのメール導線自体がない                          |
| サーバー保存   | していない。KISSA の状態は訪問者のブラウザのみ                        |
| 複数端末の共有 | していない（意図的。公開デモで他人のカートと混ざるのは避ける）        |
| AI 処理        | KISSA では使っていない。`/flow` の extractor は既存のまま（決定的）   |
| 追加支出       | **0 円。** 新しい SaaS・API・アセットを一切導入していない             |

### 指示書のうち、着手していない範囲

| 優先度 | 範囲                                                             | 状態     |
| ------ | ---------------------------------------------------------------- | -------- |
| P1     | KISSA（メニュー・詳細・カート・注文・予約・変更・運営反映）      | **完了** |
| P2     | RELAY + SMART INBOX + ADMIN を 1 つの案件データで連動            | **完了** |
| P2     | DAYBOOK（日付は修正済み。保存しないのは意図的 — 3-4 節）         | 部分     |
| P2     | REPORT FLOW                                                      | 未着手   |
| P3     | FORME / FLOWSTATE / REFINE / STILL / SHIP の作り込み             | 未着手   |
| P4     | TSUDOWA 全ページ・`/works` 全分類・`/services`・partners・rescue | 未着手   |
| P5     | 画像の棚卸し、PAGE_CONTRACTS 台帳、画像台帳、コスト台帳          | 未着手   |

**P2 以降は「調査もしていない」のではなく「実装していない」。**
`npm run qa:controls` で全デモの操作系は実測済み（下記 5 節）。

---

## 5. 検証結果（すべて実行済み・数値は実測）

| 検証             | コマンド                           | 結果                                    |
| ---------------- | ---------------------------------- | --------------------------------------- |
| lint             | `npm run lint`                     | 0 errors, 0 warnings                    |
| typecheck        | `npm run typecheck`                | pass                                    |
| unit             | `npx vitest run`                   | **528 passed** / 39 files               |
| build            | `npm run build`                    | success                                 |
| E2E（3 幅）      | `npm run test:e2e`                 | **249 passed**（5.6 分）                |
| KISSA 通し       | `npm run qa:kissa`                 | **56/56**（390 / 768 / 1440）           |
| 操作系の実測     | `npm run qa:controls`              | 112 controls / **動かないボタン 0**     |
| リンク           | `npm run qa:links`                 | PASS 42 routes, 227 links               |
| デザイン（6 幅） | `npm run qa:design`                | PASS 6 routes × 6 幅、axe/focus/runtime |
| ルート台帳       | `node scripts/route-inventory.mjs` | **74 entries**、想定外ステータス 0      |

### アクセシビリティ

KISSA の 7 ルート全てで **axe 違反 0**（tablet / desktop / mobile）。
`tests/e2e/kissa.spec.ts` が CI で毎回検査する。

### `qa:controls` の 13 件について

全て「すでに選択されている選択肢」を押した場合で、変化しないのが正しい挙動。
中身は `artifacts/inert-controls/report.json`。**死んだボタンは 1 つもない。**

---

## 6. 本番に反映されていない範囲

| 配信先                                                         | 現在の中身                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| **tetsuworks.com**（Netlify / `codex/portfolio-sales-hub-v2`） | 古い。`/flow` も `/kissa` も無い。DAYBOOK は 2026-09-18 週のまま |
| **tsudowa-production.tetsuyasmile52l.workers.dev**             | `cbaf575` 相当。`/flow` はある。`/kissa` は無い                  |

**このセッションの 3 commit はどこにも deploy されていない。** 実測値:

```
tetsuworks.com/kissa      -> 404
tetsuworks.com/flow       -> 404
tsudowa-production/kissa  -> 404
tsudowa-production/flow   -> 200
```

反映には所長の承認が要る（本番デプロイ・初回 push は承認ゲート）。

---

## 7. 次のセッションが最初にやること

1. `cd C:/Users/tetsu/tanebi-works-ultimate` → `git log --oneline -3` で
   `24911b2` を確認。
2. `npm run dev` → **`http://localhost:3000/kissa`**（`127.0.0.1` は不可）。
3. 続きを作るなら **P3（FORME / FLOWSTATE / REFINE / STILL / SHIP）** から。
   共有記録の手本は 2 つある: `src/lib/shop/`（KISSA）と `src/lib/ops/`
   （RELAY + INBOX + ADMIN）。どちらも同じ形 — `schemaVersion` つきの
   localStorage、1 つの Context、判断は純粋関数。
   **provider の更新系は必ず ref から読むこと**（3-3 節の 1 番）。
4. 触ってはいけない場所: `C:/Users/tetsu/freelance-portfolio`、
   `codex/*` ブランチ、他 worktree の未コミット差分。

### 追加した npm scripts

```
npm run qa:kissa      # KISSA を通しで操作して 56 項目を検査
npm run qa:controls   # 全デモのボタンを押して、何も起きないものを報告
```

どちらも `localhost:3000` に対して実行する（`QA_BASE_URL` で変更可）。

---

## 8. 覚えておくべき落とし穴

- **`next dev` + `127.0.0.1` = hydration しない。** ページは完全に描画される
  ので、スクリーンショットだけ見ると正常に見える。`qa:kissa` は hydration の
  証拠（カートバッジの文言）を待ってから判定する。
- **Prettier の `format:check` は Windows ではリポジトリ全体が落ちる。**
  `core.autocrlf=true` で作業ツリーが CRLF になるため。CI（Linux）は LF なので
  通る。**354 ファイルを書き換えてはいけない。** 自分が触ったファイルだけを
  `npx prettier --check <paths>` で確認する。
- **`next dev` が `AGENTS.md` と `CLAUDE.md` を毎回生成する**（Next 16 の
  `agentRules`）。`.gitignore` に入れた。コミットしない。
- **Playwright MCP のスクリーンショット出力先は `C:/Users/tetsu`**。
  相対パスを渡すと worktree の外に書かれる。絶対パスで指定する。
