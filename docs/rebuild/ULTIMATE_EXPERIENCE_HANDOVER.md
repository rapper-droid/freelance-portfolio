# ULTIMATE EXPERIENCE — 引き継ぎ

記録日: 2026-09-23（Asia/Tokyo）／入力指示書:
`TSUDOWA_TETSUWORKS_ULTIMATE_EXPERIENCE_MASTER_20260923.md`（600行を読了）

この文書は **次のセッションが迷わず再開するための事実** を書く。
「できたこと」と「できていないこと」を同じ精度で書く。秘密値は書かない。

---

## 1. Git の保存状況

| 項目           | 値                                                                 |
| -------------- | ------------------------------------------------------------------ |
| worktree       | `C:/Users/tetsu/tanebi-works-ultimate`                             |
| branch         | `claude/ultimate-experience-20260923`                              |
| 分岐元         | `origin/tsudowa/cloudflare-workers-candidate`（= `cbaf575`）       |
| HEAD           | `git log --oneline -1` で確認（下の一覧の最上段）                  |
| 状態           | **P1〜P5 すべて tsudowa.com へ deploy 済み**（version `afee9cdf`） |
| 未コミット差分 | なし（このセッション分は全て commit 済み）                         |

```
（最新）この文書の更新
（P5）  feat(sandbox) / chore(qa) / docs — 下の 3-8 節
3a552ef  docs: 検証記録と引き継ぎ
1db304c  chore(qa): 全ゲート再実行
755ad93  fix: 日本語の文 61 か所
7fcb533  chore(qa): 検証記録
c1e34fa  chore(qa): ゲート再実行
974df51  docs(rebuild): P4 の記録
e4c7c66  feat(works): the catalogue leads to the shops, and stops denying them
4409120  docs: record the release — tsudowa.com is live on this work
ec4422e  fix: the cart was empty on the deployed build, 3 regions had no keyboard
d1cc1d4  docs(rebuild): record the P3 phase in the handover
7cce861  feat(demos): STILL, REFINE, SHIP and FLOWSTATE stop being pictures
b7de10a  feat(forme): the EC demo becomes a shop with a finite number of things
531e2d1  docs(rebuild): correct the commit list in the handover
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

### 公開の経路

`claude/ultimate-experience-20260923` → PR #6 →
`tsudowa/cloudflare-workers-candidate`（merge commit `6d2668f`）→
`node scripts/workers-production.mjs deploy-candidate` → tsudowa.com。
tetsuworks.com（Netlify、Codex 所有ブランチ）は所長の判断で対象外。

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

### 新規（P3 で作った FORME）

| URL                        | 何ができるか                                                 |
| -------------------------- | ------------------------------------------------------------ |
| `/forme`                   | 店舗トップ。送料・税・クーポンの方針を明示                   |
| `/forme/items`             | 6 品。分類・検索・並び替え・在庫のみ・お気に入り・3 点比較   |
| `/forme/items/[productId]` | 商品詳細。色を変えると**写真・価格・在庫**が同時に変わる     |
| `/forme/cart`              | カート → 受け取り方法・地域 → 内容確認 → 完了                |
| `/forme/my`                | 注文の状況・支払・取消、お気に入り                           |
| `/forme/admin`             | 注文の進行・在庫の増減・取り扱い停止・売上。未払いは発送不可 |

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

### 3-5. FORME（架空のオンラインショップ / P3）

KISSA は「その朝つくるもの」を売り、FORME は「数が決まっているもの」を売る。
その違いがモデルに出ている。

- **在庫は SKU 単位の数**。「残り 2 点」と「売り切れ」は別の文。
- **在庫は差分で保存**。数か月前にブラウザへ書いた数が、後の版の補充を上書き
  しない。
- **注文と在庫の減少は同じ commit**。取消で在庫は戻る。棚は追加時・数量変更時・
  注文確定時の 3 回確認する（その間に動くから）。
- **価格は注文時点で控える**。カタログを直しても、過去の注文金額は動かない。
- **未払いのまま発送しない**。店頭受け取りは別（レジ払い）。ボタンは無効になり、
  理由を表示する。
- 送料は全国一律・一定額以上無料・北海道東北と九州沖縄に加算。加算は無料条件を
  満たしても残す（実費だから）。**クーポン・ポイント・会員階級は作らない**
  （条件・期限・併用・上限まで実装していないものを画面にだけ置かないため）。
- **レビュー・評価・受賞・人気順は作らない**。そのフィールドが増えるとテストが
  落ちる。

支払シミュレーターは KISSA のものをそのまま import している（§16 の指示）。

FORME で見つけて直した不具合：**支払が checkout の中にしかなかった。**
タブを閉じた客は二度と払えず、配送は未払いのままだから永久に発送できない。
支払を注文そのものに移した（`qa:forme` が見つけた）。

### 3-6. 見せかけをやめた 4 つのデモ（P3）

| デモ               | 直したこと                                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **STILL / STUDIO** | 固定の 3 枚 → 1 つの内容を 3 比率へ。文字・価格・期間・CTA・トリミングを編集でき、**3 比率を同時表示**。書き出した SVG は画面の内容を持ち、補助線を持たない          |
| **REFINE**         | Before をわざと崩す演出を**削除**。同じ本文・同じリンクで順番だけ変える。幅切替、読み順（実 DOM 順）、フォーカス順（実タブ順）、対象版と測定条件。改善率は表示しない |
| **SHIP / CHECK**   | 「これは保存済みの記録で、開いても検査は走らない」と明記。全行に**再現手順**と記録元ファイル。未実施 2 件（E2E・店舗デモ）を理由つきで表示                           |
| **FLOWSTATE**      | 使用前後、**実際に開ける出力**（Markdown の週次まとめ）、導入手順、対応範囲・権限・接続（6 件中 4 件を「未接続」と明記）、架空料金の注記、動く画面への導線           |

### 3-7. 制作例の説明と、店への導線（P4）

**直した嘘。** P1〜P3 で中身が変わったのに、カタログは古い説明のままだった。
どれも書いた時点では本当で、出荷した時点では嘘になっていた。

| 制作例                            | 書いてあったこと                         | 実際                                         |
| --------------------------------- | ---------------------------------------- | -------------------------------------------- |
| SMART INBOX                       | 「再読み込みで初期化」                   | 案件記録は残る。RELAY・ADMIN と同じ記録      |
| KISSA                             | 「来店予約・実店舗案内は行いません」     | 席を予約でき、変更・取消もできる             |
| FORME                             | 「注文・決済・個人情報入力はありません」 | 注文でき、在庫が減り、取消で戻る             |
| STILL / REFINE / SHIP / FLOWSTATE | P3 以前の機能一覧                        | 編集・書き出し・幅切替・検査記録が入っている |

11 件の `summary` / `challenge` / `solution` / `features` / `limitation` を
実態に合わせた。**`price` / `duration` / `categories` / `deliverables` /
`qa` は 1 文字も変えていない**（営業境界）。`categories` の `scope` も
変えていない — 売る範囲を広げるのは所長の判断で、文章の整理ではないため。

**足した導線。** KISSA と FORME は自分のデモページからしか辿れなかった。
そのデモページは `/works` → `/works/<分類>` → `/projects/<slug>` の先にある。

| 場所                            | 追加したもの                                                         |
| ------------------------------- | -------------------------------------------------------------------- |
| `/works` 冒頭                   | 2 つの店を名指しし、「実際の注文・予約・支払いは発生しません」と併記 |
| 制作例カード（11 件中 2 件）    | 3 つ目の操作「操作できる版」（塗りつぶし＝最強の行動）               |
| `/works/<分類>`                 | 同じカードなので自動で入る                                           |
| `/projects/cafe` `/projects/ec` | 「操作できる版」パネル（4 経路）をヒーローの直後に                   |
| `/partners`                     | 「ページ実装」の証拠を screenshot から `/kissa` へ。`/forme` を追加  |
| `/rescue`                       | 「注文・予約の受付」の行を追加                                       |
| `/history` `/`                  | P1〜P3 の成果を日付つきの記録 4 件として追加                         |

経路の正本は `src/lib/working-versions.ts`。パネル・カード・テストが同じ記録を読む。

**計測。** `portfolio_working_version_click` を追加した。showcase デモの
クリックに混ぜると「実際に店へ行った人」の数が読めなくなるため、別の名前にした。
パラメータは既存の `project` のみで、slug の許可リストを通る。

**テストで捕まえたもの。** `portfolio-claims.test.ts` は 22 個の価格・納期を
固定し、「できることを、できないと書く」文を落とす。書いた直後に 1 件捕まえた
（SHIP の limitation から「自主制作」が消えていた）。

### 3-8. 保存データと台帳（P5）

**直した重大な 1 件。** 新しい版で保存されたデータを読んだとき、画面は
「元のデータは変更していません」と書き、次の編集で `saveState` が上書きしていた。
予約を持っている人が、失ったうえに「失っていない」と言われる状態だった。

`src/lib/runtime/sandbox.ts` を共通化し、使えないデータは**必ず控えを取ってから**
新しい sandbox を作る。

| 事象             | 前                          | 後                                           |
| ---------------- | --------------------------- | -------------------------------------------- |
| 壊れたデータ     | 黙って破棄、次の保存で消滅  | `<key>--backup` へ控え、画面に理由を表示     |
| 新しい版のデータ | 「変更していません」→上書き | 控えを取り、戻す / 書き出す / 削除ができる   |
| 保存が使えない   | 同じ文言でまとめて表示      | 「使えない」と「読めない」を別の文言に分けた |

**足した能力。** 3 つの sandbox すべてに書き出し / 読み込みを付けた
（`src/components/sandbox-data.tsx`、`/kissa/my`・`/forme/my`・`/demos/inbox`）。
端末をまたいで持ち運べる。他の体験のファイルは形で弾く（KISSA に FORME の
ファイルを入れても半分だけ読み込まれない）。古い版の書き出しは migration を通す。

**隔離の検査。** 3 つの sandbox は別キーで、片方の初期化が他に影響しないことを
unit と E2E の両方で固定した。加えて `src/components/{kissa,forme,ops}` と
`src/lib/{shop,forme,ops}` に `fetch(` / `/api/` / `CONTACT_STATE` が
**1 つも無いこと**を構造として検査する（公開デモが本番へ出ない保証）。

**台帳。** 指示書 §04 の PAGE_CONTRACTS を作った。

| 台帳                | 中身                                    | コマンド               |
| ------------------- | --------------------------------------- | ---------------------- |
| PAGE_CONTRACTS.md   | 29 テンプレート / 89 実体 / 23 状態契約 | `npm run qa:contracts` |
| ROUTE_INVENTORY     | **97 entries**（81 → 97）               | `npm run qa:inventory` |
| IMAGE_COVERAGE.json | 必須 4 枠すべて 100%                    | `npm run qa:images`    |
| REVIEW_PACK.md      | レビュー用の入口                        | 手動                   |

ルート台帳は商品ページを 2 件しか数えていなかった（14 品と 6 品のうち）。
一覧ページの HTML から実体を読むように変え、**全実体**が入るようにした。

**性能。** `/kissa` と `/forme` は一度も測っていなかった。6 ルート足して 20 に。
さらに `qa:performance` は**閾値を一つも持っていなかった**ので予算を付けた。
composite スコアは負荷で数点動くため、握るのは決定的な指標
（a11y=100 / best-practices≥95 / CLS≤0.05 / 転送 JS≤320KB / SEO=100）。
`/kissa/*`・`/forme/*` は noindex なので SEO 予算から理由つきで除外する。

**削ったもの。** ダウンロード処理の同一コピーが 5 か所にあったので
`src/lib/runtime/download.ts` に集約した。`flow-result.tsx` は `click()` の直後に
`revokeObjectURL` していて、ブラウザによってはダウンロードが始まらない実装だった。

### 3-9. REPORT FLOW（P2 の積み残し）

**いちばん大きい発見は、ドメインが既にあって誰も使っていなかったこと。**
`src/lib/runtime/report/` に 924 行（recipe / compute / workflow）と 38 件の
テストがあり、**どの画面からも呼ばれていなかった**。作り直さず、この上に
道具を載せた。

**指示書 §15 が必須としている三連続フロー**を、実ブラウザで通した。

| 週    | 何が起きるか                             | 実測                                         |
| ----- | ---------------------------------------- | -------------------------------------------- |
| 1週目 | 列の意味を決めてルールを保存             | 合計 ¥221,000／12 行中 8 件を集計／例外 3 件 |
| 2週目 | 列の順番だけ違う → **質問ゼロ**          | 前回比を根拠つきで表示                       |
| 3週目 | 知らない列と税区分 → **その2点だけ確認** | 版が 2 に上がり、前の版は残る                |

**減らした手間**（依頼の6つ）。

| 毎回やっていたこと | どう減らしたか                                                        |
| ------------------ | --------------------------------------------------------------------- |
| 読む               | 表より先に合計・件数・除外を出し、「合計は読み取れた N 件だけ」と併記 |
| 探す               | 読み取れなかった行を最上部に、元ファイルの行番号つきで                |
| 直す               | その場で直して再集計。**元ファイルは変更しない**（差分は overlay）    |
| コピーする         | CSV 出力・例外だけの CSV・報告文用の要約をワンクリック                |
| ルールを思い出す   | 列名が一致すれば順番が変わっても自動適用。使った版を画面に表示        |
| 確認する           | 前回比は「何と何を比べたか」を先に書く。変更の記録を理由つきで        |

**新しい画面**: `/report`（道具）、`/report/recipes`（ルールと版）、
`/report/history`（処理履歴）。4 つ目の sandbox
（`tsudowa-report-sandbox-v1`）で、P5 と同じ控え・書き出し・読み込みを持つ。

**作り込んだ状態**: 不正CSV（5 種類を理由つきで拒否）、空（ルール0件・履歴0件）、
大量データ（5,000 行を 121ms・表は 50 行ずつ）、再読込（下書きごと復帰）、
保存容量不足（**下書きを先に捨ててルールを守る**）、修正の取り消し。

**意図的にやらなかったこと**: XLSX / PDF 出力は、実際に開いて中身を検証できる
形で出せないため選択肢に出していない（指示書 §15）。AI も使っていない。
増減の理由は「可能性」として出し、断定しない。

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

| 優先度 | 範囲                                                                                   | 状態                          |
| ------ | -------------------------------------------------------------------------------------- | ----------------------------- |
| P1     | KISSA（メニュー・詳細・カート・注文・予約・変更・運営反映）                            | **完了**                      |
| P2     | RELAY + SMART INBOX + ADMIN を 1 つの案件データで連動                                  | **完了**                      |
| P2     | DAYBOOK（日付は修正済み。保存しないのは意図的 — 3-4 節）                               | 部分                          |
| P2     | REPORT FLOW                                                                            | **完了**                      |
| P3     | FORME / FLOWSTATE / REFINE / STILL / SHIP の作り込み                                   | **完了**                      |
| P3     | Automation の技術画面（schema・mapping・retry・ログ）                                  | 未着手                        |
| P4     | TSUDOWA 全ページ・`/works` 全分類・`/services`・partners・rescue                       | **完了**                      |
| P5     | 全 route / 状態の台帳、画像 coverage、公開デモ隔離、性能、migration、docs、review pack | **完了**                      |
| P5     | 8 幅の visual baseline                                                                 | 部分（4 幅 + design QA 6 幅） |
| P5     | 許可された remote preview での検査                                                     | 未実施（本番未反映のため）    |

P4 で `/services` の中身を変えなかったのは、公開中の 2 件（`web-fix`・
`csv-routine`）が参照するデモが REFINE と CSV AUTOMATOR で、店ではないため。
REFINE の説明文だけ、P3 で足した幅切替と読み順に合わせて直した。

**P2 以降は「調査もしていない」のではなく「実装していない」。**
`npm run qa:controls` で全デモの操作系は実測済み（下記 5 節）。

---

## 5. 検証結果（すべて実行済み・数値は実測）

| 検証             | コマンド                 | 結果                                        |
| ---------------- | ------------------------ | ------------------------------------------- |
| lint             | `npm run lint`           | 0 errors, 0 warnings                        |
| typecheck        | `npm run typecheck`      | pass                                        |
| unit             | `npx vitest run`         | **660 passed** / 46 files                   |
| build            | `npm run build`          | success                                     |
| E2E（3 幅）      | `npm run test:e2e`       | **405 passed**                              |
| KISSA 通し       | `npm run qa:kissa`       | **57/57**（390 / 768 / 1440）               |
| FORME 通し       | `npm run qa:forme`       | **62/62**（390 / 768 / 1440）               |
| 表示崩れ（4 幅） | `npm run qa:visual`      | PASS **50 ルート** × 320/390/768/1440       |
| 操作系の実測     | `npm run qa:controls`    | **158 controls** / 動かないボタン 0         |
| リンク           | `npm run qa:links`       | PASS 42 routes, **237 links**               |
| SEO              | `npm run qa:seo`         | PASS 41 routes（要 `NEXT_PUBLIC_SITE_URL`） |
| デザイン（6 幅） | `npm run qa:design`      | PASS 6 routes × 6 幅、axe/focus/runtime     |
| ルート台帳       | `npm run qa:inventory`   | **100 entries**、想定外ステータス 0         |
| 日本語の改行     | `npm run qa:text`        | PASS（verify に組み込み済み）               |
| 性能（mobile）   | `npm run qa:performance` | **20 ルート、予算内**                       |
| 画像 coverage    | `npm run qa:images`      | 必須 4 枠すべて 100%                        |
| 画面契約         | `npm run qa:contracts`   | **32 テンプレート / 92 実体**               |

### 新しい検査が、本当に落ちることを確かめた

緑になる検査ではなく赤くなる検査であることを、4 件とも故意に壊して確認した。

| 検査             | 壊し方                       | 結果                     |
| ---------------- | ---------------------------- | ------------------------ |
| `qa:images`      | artId を存在しない値にする   | exit 1・id を表示        |
| `qa:contracts`   | 契約のテンプレート名を変える | exit 1・不足と余剰を表示 |
| `qa:performance` | 予算を 99 に上げる           | exit 1・route と数値     |
| `qa:text`        | （P4 で 61 件検出）          | exit 1                   |

### アクセシビリティ

KISSA と FORME の各 7 ルート、および P3 の 4 デモで **axe 違反 0**
（tablet / desktop / mobile）。`kissa.spec.ts`、`forme.spec.ts`、
`showcase-p3.spec.ts` が CI で毎回検査する。

`qa:visual` に `/history`・`/lab`・`/contact`・`/contact/general` を足した。
この 4 つは今まで一度も幅検査を通っていなかった。

### `qa:controls` の 19 件について

147 個の操作を実際に押して、画面が変わらなかったものを報告する仕組み。
19 件あるが、**死んだボタンは 1 つもない。** 内訳は 2 種類だけ。

| 種類                                       | 件数 | なぜ変わらないのが正しいか                      |
| ------------------------------------------ | ---: | ----------------------------------------------- |
| すでに選択されている選択肢・空の一覧のタブ |   17 | 「すべて」を選んだ状態で「すべて」を押している  |
| 「書き出したファイルを読み込む」           |    2 | OS のファイル選択を開くだけで、DOM は変わらない |

後者は `sandbox.spec.ts` が `setInputFiles` で実際にファイルを渡して検査する。
中身は `artifacts/inert-controls/report.json`。

---

## 6. 本番の状況

**tsudowa.com は公開済みです。**

| 配信先                                                         | 中身                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| **tsudowa.com**（Cloudflare Worker `tsudowa-production`）      | **P1〜P5 が反映済み**。version `afee9cdf`。PR #8 / `6b0445d` |
| **tetsuworks.com**（Netlify / `codex/portfolio-sales-hub-v2`） | 古いまま（`ce03541`）。所長の判断で今回は更新していません    |

実測（デプロイ後）:

```
tsudowa.com/kissa         -> 200   qa:kissa 56/56（本番に対して実行）
tsudowa.com/forme         -> 200   qa:forme 62/62（本番に対して実行）
tsudowa.com/demos/saas    -> 200   週次まとめの書き出しが本番で動作
tsudowa.com/demos/automation -> RELAY で受け付けた案件が INBOX に 7 件
33 ルート全て 200 / 実行時エラー 0 / sitemap に店舗は 0 件
tetsuworks.com/forme      -> 404（未更新のため）
```

- **PR**: [#6](https://github.com/rapper-droid/freelance-portfolio/pull/6)（merge 済み）
- **ロールバック先**: `9aaaed9e-1069-483c-aa64-01b2895d4e5c`
  （`npx wrangler rollback 9aaaed9e-1069-483c-aa64-01b2895d4e5c --name tsudowa-production`）
- 詳細は [docs/production-status.md](../production-status.md)

### デプロイして初めて分かった不具合（2 件）

ローカルのテストは全部通っていたのに、preview で壊れていました。

1. **カートが空のままだった。** `runtime/ids.ts` が `node:crypto` を import して
   おり、店舗はカートの行キー・注文番号・支払の idempotency をブラウザ側で計算
   する。Workers のバンドルに `node:crypto` は無く、
   `createHash is not a function` で落ちていた。Web Crypto は非同期なので使えない
   （純粋関数の中で await できない）。同期の SHA-256 を `runtime/sha256.ts` に
   実装した。**Node と 1 ビットも違わない出力**なので、既存の id は一切変わらない。
2. **横スクロール領域 3 か所がキーボードで到達できなかった。** うち 1 件は CI が
   768px で捕まえた（ローカルは Windows のフォント幅で溢れなかった）。残り 2 件は
   探して見つけたもので、REFINE の並べて表示と、KISSA の運営表（空の sandbox では
   表自体が描画されないため axe が一度も見ていなかった）。

## 7. 次のセッションが最初にやること

1. `cd C:/Users/tetsu/tanebi-works-ultimate` → `git log --oneline -3` で
   `e4c7c66` を確認。
2. `npm run dev` → **`http://localhost:3000/works`**（`127.0.0.1` は不可）。
   カードの「操作できる版」から店へ入れる。
3. **P1〜P5 は本番反映済み**（2026-09-24、version `afee9cdf`）。
   次に反映するときは PR → `tsudowa/cloudflare-workers-candidate` →
   `node scripts/workers-production.mjs deploy-candidate`（所長の承認が必要）。
   デプロイ後は必ず `node scripts/post-deploy-check.mjs https://tsudowa.com` と
   `QA_BASE_URL=https://tsudowa.com` での `qa:kissa` / `qa:forme` を通す。
4. 続きを作るなら **P3 の残り（Automation の技術画面 — 入力 sample・schema・
   mapping・実行計画・承認・各工程の状態・失敗・retry・出力とログ）** か、
   **REPORT FLOW**、または 8 幅の visual baseline から。
   レビューする人には [REVIEW_PACK.md](REVIEW_PACK.md) を渡す。
   共有記録の手本は 3 つ: `src/lib/shop/`（KISSA）、`src/lib/ops/`
   （RELAY + INBOX + ADMIN）、`src/lib/forme/`（FORME）。同じ形 —
   `schemaVersion` つきの localStorage、1 つの Context、判断は純粋関数。
   **provider の更新系は必ず ref から読むこと**（3-3 節の 1 番）。
5. 触ってはいけない場所: `C:/Users/tetsu/freelance-portfolio`、
   `codex/*` ブランチ、他 worktree の未コミット差分。

### 追加した npm scripts

```
npm run qa:kissa      # KISSA を通しで操作して 56 項目を検査
npm run qa:forme      # FORME を通しで操作して 62 項目を検査
npm run qa:controls   # 全デモのボタンを押して、何も起きないものを報告
npm run qa:text       # JSX の中で割れた日本語の文を検出（verify に組み込み済み）
npm run qa:images     # 商品画像・プレビュー・参照ファイルの充足（verify に組み込み済み）
npm run qa:inventory  # 全 97 route を実際に要求して台帳を作る
npm run qa:contracts  # 画面契約。台帳と結合するので、契約のない画面は落ちる
```

REPORT FLOW の検査は `tests/unit/report-flow.test.ts`（30 件・三週フロー）と
`tests/e2e/report.spec.ts`（9 件 × 3 幅）。

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
- **デモの中に置いたパネルは色を継承してはいけない。** 各デモは自分の
  アイデンティティで文字色を塗り替えるので、`color: inherit` のままだと
  暗いパネルに暗い文字が乗って 1.3:1 になる。実際に 2 回起きた
  （`demo-live-link.css` と `qa-evidence.css`）。色は明示的に書く。
- **JSX の中で日本語を改行すると、画面に空白が出る。** React は行間の改行を
  半角スペース 1 つに潰すので、`架空店舗のため、` で改行して次の行を
  `実際の注文…` から始めると、読み手には「架空店舗のため、 実際の注文」と
  見える。Prettier は印字幅で勝手に折るので、行を繋いでも元に戻される。
  文を `{"…"}` に入れると折られない。**61 か所を `755ad93` で直し、
  `npm run qa:text` が verify の中で検査する。** 手で直す必要はない
  （`node scripts/jsx-text-breaks.mjs --fix` → prettier）。
- **`next start` を止め忘れると、古いビルドを検査してしまう。** P5 で実際に起きた。
  直したはずの文字列が画面に残り、原因は前のプロセスが同じポートを握っていたこと
  だった。別ポートを使うか、`Get-NetTCPConnection -LocalPort <port>` で落とす。
- **PowerShell の `Set-Content -Encoding utf8` は日本語を壊すことがある。**
  日本語を含むファイルの書き換えは Python か Write ツールで行う。
- **時刻に依存する検査は、ある時間から落ちる。** `kissa-qa` は予約枠を
  `nth(8)` で選んでいて、午後になると残り枠が 9 件未満になり 30 秒待って落ちた。
  固定の添字ではなく「空いている最初の枠」を選び、件数を検査するように直した。
- **Playwright の `networkidle` は Turnstile のあるページで永久に来ない。**
  `/works` は 599ms で描画されているのに待ち続ける。ウィジェットが接続を保つため。
  待つなら要素で待つ。逆に店の画面は `domcontentloaded` では早すぎるので、
  `qa:kissa` と同じ hydration の印（カートバッジの文言）を待つ。
- **シェル経由で改行エスケープを含む JS を書くと潰れる。**
  正規表現や文字列に改行エスケープが要るときは Write ツールで書く。
