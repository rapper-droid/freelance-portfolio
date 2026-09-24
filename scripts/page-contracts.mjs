import fs from "node:fs";
import path from "node:path";

/**
 * The ledger the rebuild is managed against (指示書 §04, §05).
 *
 * Not a page count. One row per template, with who the screen is for, what it
 * takes in, what changes, where the visitor goes next, what it stores, and
 * which of the twenty-three contract states apply — the ones that do not are
 * marked N/A *with a reason*, because "we did not think about it" and "it
 * cannot happen here" look identical in an empty cell.
 *
 * The route side is not written here. It is joined from ROUTE_INVENTORY.json,
 * which is built by requesting the running site, so the entity counts in this
 * document cannot drift from what is actually served. A template in the
 * inventory with no contract fails the run: that is the point — a new screen
 * cannot be added without saying what it is for.
 */

const ROOT = process.cwd();
const INVENTORY = "docs/rebuild/ROUTE_INVENTORY.json";
const OUT_JSON = "docs/rebuild/PAGE_CONTRACTS.json";
const OUT_MD = "docs/rebuild/PAGE_CONTRACTS.md";

/** The state contract every interactive screen is measured against (§05). */
const STATES = [
  "初期",
  "入力中",
  "hover",
  "focus",
  "pressed",
  "選択",
  "loading",
  "進行",
  "成功",
  "空",
  "検索0件",
  "validation error",
  "通信失敗",
  "offline",
  "権限不足",
  "期限切れ",
  "競合",
  "部分成功",
  "retry",
  "cancel",
  "undo",
  "disabled",
  "再訪",
];

/**
 * Why a state does not apply to a family. Anything not listed here applies.
 *
 * The recurring reasons are worth naming once: nothing on this site calls a
 * server except the contact form, so `通信失敗` and `offline` are only real
 * where a request is made; there are no accounts, so `権限不足` is never a
 * visitor-facing state; and a screen that writes nothing has no `再訪`.
 */
const NOT_APPLICABLE = {
  static: {
    入力中: "入力欄がない",
    選択: "選択状態を持つ操作がない",
    loading: "サーバー取得なし（静的生成）",
    進行: "複数段階の処理がない",
    成功: "完了する操作がない",
    空: "内容は静的で、空になりえない",
    検索0件: "検索がない",
    "validation error": "入力がない",
    通信失敗: "リクエストを出さない",
    offline: "初回表示後は追加取得がない",
    権限不足: "アカウントの概念がない",
    期限切れ: "期限を持つデータがない",
    競合: "他者と共有する状態がない",
    部分成功: "分割される処理がない",
    retry: "失敗しうる処理がない",
    cancel: "取り消す操作がない",
    undo: "変更が残らない",
    disabled: "無効化する操作がない",
    再訪: "保存しないため初回と同じ",
  },
  catalogue: {
    loading: "一覧は静的生成で、絞り込みは同期処理",
    進行: "複数段階の処理がない",
    通信失敗: "リクエストを出さない",
    offline: "初回表示後は追加取得がない",
    権限不足: "アカウントの概念がない",
    期限切れ: "期限を持つデータがない",
    競合: "他者と共有する状態がない",
    部分成功: "分割される処理がない",
    retry: "失敗しうる処理がない",
    undo: "絞り込みは解除で戻る",
  },
  form: {
    権限不足: "アカウントの概念がない",
    競合: "同じ相談を二人が編集しない",
    undo: "送信前は編集、送信後は取り消せないと明記",
  },
  shop: {
    権限不足: "ログインのない架空店舗",
    offline: "サーバーへ出ないため、切断しても操作は続く",
    通信失敗: "サーバーへ出ない（支払いは内部シミュレーター）",
  },
  console: {
    権限不足: "運営画面を分けているが、認証は持たない（明記）",
    offline: "サーバーへ出ない",
    通信失敗: "サーバーへ出ない",
  },
  demo: {
    権限不足: "アカウントの概念がない",
    offline: "サーバーへ出ない",
    通信失敗: "サーバーへ出ない",
    期限切れ: "期限を持つデータがない",
  },
};

const c = (template, fields) => ({ template, ...fields });

/** One row per template. Kept in the order a visitor meets them. */
const CONTRACTS = [
  c("/", {
    brand: "TSUDOWA",
    family: "static",
    audience: "TSUDOWA を初めて見る人、どの窓口か探している人",
    purpose: "親ブランドの構造を理解し、制作（WORKS）か実験（LAB）へ進む",
    inputs: "なし（読むだけ）",
    outputs: "なし",
    next: "/works・/lab・/contact・/history",
    highlight: "二つの世界と、日付つきの制作記録",
    reduces: "「何をしている人か」を問い合わせで聞く手間",
    media: "KISSA の店舗写真、各デモの実画面プレビュー",
    storage: "なし",
    sideEffects: "PostHog の portfolio_visit（設定時のみ）",
    evidence: "hq.spec.ts / visual-qa 4 幅 / qa:performance",
  }),
  c("/history", {
    brand: "TSUDOWA",
    family: "static",
    audience: "実際に何が作られたか確かめたい人",
    purpose: "年ごとの制作事実を、コミット参照つきで読む",
    inputs: "なし",
    outputs: "なし",
    next: "各記録の関連ページ",
    highlight: "手動更新であることと、確認日を明記した一覧",
    reduces: "「本当に動いているのか」を聞く手間",
    media: "なし（文字のみ）",
    storage: "なし",
    sideEffects: "なし",
    evidence: "hq.spec.ts（件数と日付形式）/ unit hq.test.ts",
  }),
  c("/lab", {
    brand: "TSUKUTTA LAB",
    family: "static",
    audience: "プロダクト・実験に関心がある人",
    purpose: "LAB が独立した活動であることを知る",
    inputs: "なし",
    outputs: "なし",
    next: "/・/contact",
    highlight: "公開 URL が未確認であることを、書かずに済ませない",
    reduces: "存在しないリンクを踏む手間",
    media: "LAB のコンセプト面",
    storage: "なし",
    sideEffects: "なし",
    evidence: "hq.spec.ts（tsukuttalab へのリンクが 0 件）",
  }),
  c("/privacy", {
    brand: "TSUDOWA",
    family: "static",
    audience: "問い合わせ前に取り扱いを確認したい人",
    purpose: "収集する項目・保管・第三者提供を確認する",
    inputs: "なし",
    outputs: "なし",
    next: "/contact",
    highlight: "実際に送信される項目だけを書く",
    reduces: "個別の確認メール",
    media: "なし",
    storage: "なし",
    sideEffects: "なし",
    evidence: "link-qa / visual-qa 4 幅",
  }),
  c("/works", {
    brand: "TETSU WORKS",
    family: "catalogue",
    audience: "依頼を検討している人",
    purpose: "自分の仕事に近い制作例と参考価格を見つける",
    inputs: "カテゴリ絞り込み（12 分類）",
    outputs: "絞り込まれたカード一覧、カテゴリのパーマリンク",
    next: "/projects/*・/demos/*・/kissa・/forme・/contact",
    highlight: "操作できる 2 店を冒頭で名指しする",
    reduces: "「何ができるか」を一件ずつ聞く手間",
    media: "11 件 × desktop / mobile プレビュー",
    storage: "なし（絞り込みは URL とメモリ）",
    sideEffects:
      "portfolio_visit / portfolio_price_view / 操作できる版クリック",
    evidence: "works-connect.spec.ts / figma-sales.spec.ts / qa:images",
  }),
  c("/works/[category]", {
    brand: "TETSU WORKS",
    family: "catalogue",
    audience: "依頼の種類が決まっている人",
    purpose: "その分類の制作例・範囲・必要な素材・参考価格を読む",
    inputs: "なし（URL が分類）",
    outputs: "なし",
    next: "/projects/*・/contact（分類を引き継ぐ）",
    highlight: "分類ごとの対応範囲と、事前に必要な素材",
    reduces: "見積もり前のやりとり",
    media: "その分類のカード群 + カテゴリ KV",
    storage: "なし",
    sideEffects: "portfolio_category_view",
    evidence: "sales-hub.spec.ts（12 分類の所属を完全一致で検査）",
  }),
  c("/projects/[slug]", {
    brand: "TETSU WORKS",
    family: "static",
    audience: "特定の制作例を詳しく見たい人",
    purpose: "背景・課題・実装・納品物・QA・限界を読む",
    inputs: "なし",
    outputs: "なし",
    next: "/demos/<slug>・操作できる版・関連サービス・/contact",
    highlight: "限界を価格の隣に書く。操作できる版はヒーロー直後",
    reduces: "実績の有無を確認する往復",
    media: "3 幅プレビュー + ビジュアルストーリー",
    storage: "なし",
    sideEffects: "portfolio_project_open / portfolio_price_view",
    evidence: "sales-hub.spec.ts（全 11 件を axe つきで巡回）",
  }),
  c("/demos/[slug]", {
    brand: "TETSU WORKS",
    family: "demo",
    audience: "動かして確かめたい人",
    purpose: "制作例を実際に操作する",
    inputs: "デモごと（選択・入力・チェック）",
    outputs: "デモごと（書き出し・記録・表示）",
    next: "/experience/<slug>・操作できる版・/contact",
    highlight: "見せかけを置かない。固定表示は固定表示と書く",
    reduces: "打ち合わせでの画面説明",
    media: "デモ内の作図・実画面",
    storage: "RELAY / INBOX / ADMIN のみ ops sandbox",
    sideEffects: "portfolio_live_demo_click",
    evidence:
      "portfolio.spec.ts / ops.spec.ts / showcase-p3.spec.ts / qa:controls",
  }),
  c("/experience/[slug]", {
    brand: "TETSU WORKS",
    family: "demo",
    audience: "デモだけを画面いっぱいで見たい人",
    purpose: "ポートフォリオの枠なしで同じデモを操作する",
    inputs: "デモと同じ",
    outputs: "デモと同じ",
    next: "操作できる版・/projects/<slug>",
    highlight: "枠を外しても、架空であることの表示は外さない",
    reduces: "共有時に説明を足す手間",
    media: "デモと同じ",
    storage: "デモと同じ（同じ sandbox を共有）",
    sideEffects: "なし",
    evidence: "standalone.spec.ts（11 件すべて）",
  }),
  c("/services", {
    brand: "TETSU WORKS",
    family: "catalogue",
    audience: "小さく頼める範囲を探している人",
    purpose: "範囲・価格・期間が決まったメニューを選ぶ",
    inputs: "なし",
    outputs: "なし",
    next: "/services/<slug>・/rescue",
    highlight: "公開しているメニューだけを並べる",
    reduces: "「いくらから頼めるか」の往復",
    media: "各メニューのデモ画面",
    storage: "なし",
    sideEffects: "service_view",
    evidence: "figma-sales.spec.ts / link-qa",
  }),
  c("/services/[slug]", {
    brand: "TETSU WORKS",
    family: "form",
    audience: "そのメニューを頼むか決める人",
    purpose: "範囲・進め方・検証済みの内容を読み、相談文を作る",
    inputs: "相談文メーカーの選択と自由記述",
    outputs: "下書き（コピー / フォームへ引き継ぎ）",
    next: "/contact（内容を引き継ぐ）",
    highlight: "検証した内容と、測っていない数字を分けて書く",
    reduces: "要件整理と最初の一通",
    media: "対応デモの実画面",
    storage: "なし（下書きは画面内）",
    sideEffects: "brief_created / consultation_cta_clicked",
    evidence: "offers のユニットテスト / e2e の下書き検査",
  }),
  c("/partners", {
    brand: "TETSU WORKS",
    family: "form",
    audience: "制作会社・デザイナー（実装の外注先を探す側）",
    purpose: "実装品質を確かめ、条件を整理して相談する",
    inputs: "相談文メーカー",
    outputs: "下書き",
    next: "/kissa・/forme・各デモ・/contact",
    highlight: "実装の証拠を screenshot ではなく動く店に置く",
    reduces: "スキル確認のやりとり",
    media: "各デモの実画面",
    storage: "なし",
    sideEffects: "brief_created",
    evidence: "link-qa / visual-qa 4 幅",
  }),
  c("/rescue", {
    brand: "TETSU WORKS",
    family: "form",
    audience: "何を頼めばよいか分からない人",
    purpose: "困りごとから相談文を組み立てる",
    inputs: "困りごとの選択と自由記述",
    outputs: "下書き",
    next: "/services・各デモ・/kissa・/contact",
    highlight: "専門用語を使わずに始められる",
    reduces: "要件が固まる前に相談できない停滞",
    media: "なし",
    storage: "なし",
    sideEffects: "brief_created",
    evidence: "link-qa / visual-qa 4 幅",
  }),
  c("/flow", {
    brand: "TETSU WORKS",
    family: "demo",
    audience: "自動化で何が減るのか知りたい人",
    purpose: "受付→整理→出力までを実際に流す",
    inputs: "サンプル入力（本文・ファイル）",
    outputs: "案件記録・下書き・集計 CSV",
    next: "/works・/contact",
    highlight: "通常処理と AI と未接続を別々に表示する",
    reduces: "転記・集計・下書き",
    media: "工程図と実出力",
    storage: "なし（画面内）",
    sideEffects: "scenario_started ほかサンプル funnel",
    evidence: "flow.spec.ts / qa:flow（3 トラック 7 工程 / axe）",
  }),
  c("/contact", {
    brand: "TETSU WORKS",
    family: "form",
    audience: "制作を相談したい人",
    purpose: "相談内容を送り、受付番号を受け取る",
    inputs: "種別・内容・連絡先（必須は最小限）",
    outputs: "受付番号、確認メール",
    next: "完了表示",
    highlight: "曖昧な段階でも送れる。送信前に内容を確認できる",
    reduces: "問い合わせ文を一から書く手間",
    media: "なし",
    storage: "Durable Object（CONTACT_STATE）。デモのデータは入らない",
    sideEffects: "実メール送信。portfolio_contact_submit / _success",
    evidence: "contact.spec.ts / contact のユニットテスト群 / abuse.test.ts",
  }),
  c("/contact/general", {
    brand: "TSUDOWA",
    family: "form",
    audience: "制作以外の用件がある人",
    purpose: "TSUDOWA 全体への問い合わせを送る",
    inputs: "内容・連絡先",
    outputs: "受付番号、確認メール",
    next: "完了表示・/contact（制作の相談）",
    highlight: "制作窓口と混ざらないよう入口を分ける",
    reduces: "宛先を迷う手間",
    media: "なし",
    storage: "CONTACT_STATE",
    sideEffects: "実メール送信",
    evidence: "contact.spec.ts / hq.spec.ts（導線）",
  }),

  // ------------------------------------------------------- AUTOMATION ----
  c("/automation", {
    brand: "TETSU WORKS",
    family: "demo",
    audience: "実行モデルが妥当かを判断する人（開発者・情報システム）",
    purpose: "RELAY の 1 回の実行を、業務の言葉ではなく契約の粒度で確認する",
    inputs:
      "同梱サンプルの選択、承認する操作の選択、相手先の挙動（成功・失敗・応答なし）",
    outputs: "実行計画、承認の紐づけ、操作ごとの結果、実行ログ（JSON）",
    next: "/demos/automation（業務側）・/demos/inbox（運用側）",
    highlight:
      "失敗と「結果が分からない」を分け、再実行で二重に実行しないことを実際に見せる",
    reduces: "「本当に安全に再実行できるのか」を問い合わせて確認する手間",
    media: "なし（識別子と状態が主役）",
    storage: "なし（この画面は何も保存しない）",
    sideEffects:
      "なし。実行は端末内の模擬アダプター。任意コード実行・任意URL取得なし",
    evidence: "automation-console.test.ts（17 件）/ automation.spec.ts（8 件）",
  }),

  // ------------------------------------------------------------ DAYBOOK ----
  c("/daybook", {
    brand: "TETSU WORKS",
    family: "form",
    audience: "予約の希望を文章で送りたい人",
    purpose:
      "希望の時間が取れるか判定し、取れないときは実際に空いている候補まで出す",
    inputs: "依頼の文章（例文4通りあり）、名前、連絡先、候補の選択、合意",
    outputs:
      "読み取れた日時と読み取れなかった項目、空き候補、仮押さえ、確定、変更の差分、依頼ごとの記録",
    next: "/daybook/admin",
    highlight:
      "断って終わらせないこと。埋まっているときに、前後の準備時間まで踏まえた候補が出る",
    reduces:
      "空き時間を聞き直す往復／営業時間を調べる／仮押さえの期限を覚えておく／変更のたびに全部を確認し直す",
    media: "なし（時刻と状態が主役）",
    storage: "daybook sandbox（相談・仮押さえ・予約）+ 破損時の控え",
    sideEffects: "なし。実際の予約は入らず、メールも送らない",
    evidence: "daybook-flow.test.ts（16 件）/ daybook.spec.ts / qa:visual",
  }),
  c("/daybook/admin", {
    brand: "TETSU WORKS",
    family: "console",
    audience: "予約を受ける側",
    purpose: "承認が要るものと、承認すると何が変わるかを読んで決める",
    inputs: "承認、取消",
    outputs:
      "予約者の合意とお店の承認の2つの記録、変更の旧→新、前後の準備時間を含む台帳、他システムの予定",
    next: "/daybook",
    highlight:
      "片方の記録だけでは確定しないこと。承認を押しても、断られた理由が記録に残るだけ",
    reduces:
      "何を承認するのか探す／変更で何が変わるのか読み直す／自分の予定と他システムの予定を見分ける",
    media: "なし",
    storage: "daybook sandbox（お客さま側と同じ1つの記録）",
    sideEffects: "なし。自分が作っていない予定は変更も削除もしない",
    evidence: "daybook-flow.test.ts / daybook.spec.ts",
  }),

  // -------------------------------------------------------- REPORT FLOW ----
  c("/report", {
    brand: "TETSU WORKS",
    family: "form",
    audience: "毎週・毎月、同じ形式のCSVを集計している人",
    purpose: "列の意味を一度決めて保存し、二回目からは質問なしで集計する",
    inputs:
      "CSVファイル（手元のもの、またはサンプル3週分）、列の役割、通貨、重複条件、読み取れない行の修正",
    outputs:
      "合計と件数、前回との差、変更の記録、集計結果CSV、例外だけのCSV、報告文用の要約",
    next: "/report/recipes・/report/history",
    highlight:
      "二回目に何も聞かないこと。聞くのは前になかった列と税区分のときだけ",
    reduces:
      "列の対応をやり直す／重複を目視で探す／集計し直す／前回と見比べる／読み取れない行を表計算で直す",
    media: "なし（数字と差分が主役）",
    storage: "report sandbox（ルール・履歴・作業中の下書き）+ 破損時の控え",
    sideEffects: "なし。ファイルはサーバーへ送信しない",
    evidence:
      "report-flow.test.ts（30 件・三週フロー）/ report.spec.ts / qa:visual",
  }),
  c("/report/recipes", {
    brand: "TETSU WORKS",
    family: "catalogue",
    audience: "保存したルールを確かめたい人",
    purpose: "列の対応・通貨・重複条件・承認済みの税区分と版を読む",
    inputs: "削除の確認",
    outputs: "削除、書き出し／読み込み",
    next: "/report",
    highlight:
      "版を上げても前の版を消さない（過去の集計が説明できなくなるため）",
    reduces: "「前回どう決めたか」を思い出す手間",
    media: "なし",
    storage: "report sandbox",
    sideEffects: "なし",
    evidence: "report.spec.ts / report-flow.test.ts",
  }),
  c("/report/history", {
    brand: "TETSU WORKS",
    family: "catalogue",
    audience: "先週の数字を確かめたい人",
    purpose: "過去の処理の合計・件数・例外の数と、使ったルールの版を読む",
    inputs: "なし",
    outputs: "書き出し／読み込み",
    next: "/report",
    highlight: "合計と読み込み行数を分けて記録する。明細は保存しない",
    reduces: "前回の報告を探し直す手間",
    media: "なし",
    storage: "report sandbox（最大 40 件）",
    sideEffects: "なし",
    evidence: "report.spec.ts / report-flow.test.ts",
  }),

  // ------------------------------------------------------------- KISSA ----
  c("/kissa", {
    brand: "KISSA（架空店舗）",
    family: "shop",
    audience: "店を探している人（の役）",
    purpose: "店の雰囲気を見て、注文か予約へ進む",
    inputs: "なし",
    outputs: "なし",
    next: "/kissa/menu・/kissa/reserve",
    highlight: "架空であることを全ページのバナーで明示",
    reduces: "—（入口）",
    media: "店舗写真 5 点",
    storage: "kissa sandbox（読み取りのみ）",
    sideEffects: "なし。noindex, follow",
    evidence: "kissa.spec.ts / qa:kissa 56 項目 / qa:performance",
  }),
  c("/kissa/menu", {
    brand: "KISSA（架空店舗）",
    family: "catalogue",
    audience: "注文する人",
    purpose: "14 品から選び、カートに入れる",
    inputs: "カテゴリ切替・商品選択",
    outputs: "カート（商品・数量）",
    next: "/kissa/menu/<id>・/kissa/order",
    highlight: "売り切れが運営画面と連動する",
    reduces: "店頭での確認",
    media: "14 品それぞれのイラスト（coverage 14/14）",
    storage: "kissa sandbox",
    sideEffects: "なし",
    evidence: "kissa.spec.ts / qa:images",
  }),
  c("/kissa/menu/[productId]", {
    brand: "KISSA（架空店舗）",
    family: "shop",
    audience: "その商品を選ぶ人",
    purpose: "温度・サイズを選び、数量を決めてカートに入れる",
    inputs: "バリエーション・数量",
    outputs: "カート行",
    next: "/kissa/order・/kissa/menu",
    highlight: "売り切れの組み合わせは押せず、理由を書く",
    reduces: "店頭での質問",
    media: "商品イラスト（詳細サイズ）",
    storage: "kissa sandbox",
    sideEffects: "なし",
    evidence: "kissa.spec.ts（14 実体を巡回）",
  }),
  c("/kissa/order", {
    brand: "KISSA（架空店舗）",
    family: "shop",
    audience: "注文を確定する人",
    purpose: "受取時間を決めて注文する",
    inputs: "受取時間・支払方法",
    outputs: "注文番号、注文記録",
    next: "/kissa/my",
    highlight: "調理時間と営業時間から受取枠を出す（7 日先まで繰り上げ）",
    reduces: "電話での時間調整",
    media: "カート内の商品イラスト",
    storage: "kissa sandbox",
    sideEffects: "なし（支払いは内部シミュレーター）",
    evidence: "shop-cart-order のユニットテスト / kissa.spec.ts",
  }),
  c("/kissa/reserve", {
    brand: "KISSA（架空店舗）",
    family: "shop",
    audience: "席を取る人",
    purpose: "空席から選び、仮押さえして確定する",
    inputs: "日時・人数・席",
    outputs: "予約番号、予約記録",
    next: "/kissa/my（変更・取消）",
    highlight: "仮押さえの期限切れが自動で解放される",
    reduces: "電話・往復メール",
    media: "席の配置図",
    storage: "kissa sandbox",
    sideEffects: "なし",
    evidence: "shop-reservation のユニットテスト / kissa.spec.ts",
  }),
  c("/kissa/my", {
    brand: "KISSA（架空店舗）",
    family: "shop",
    audience: "注文・予約した人",
    purpose: "状況を見て、変更・取消し、データを持ち出す",
    inputs: "変更内容、読み込むファイル",
    outputs: "更新された記録、書き出した JSON",
    next: "/kissa/menu・/kissa/reserve",
    highlight: "自分の予約は自分の枠を塞がない（変更できる）",
    reduces: "問い合わせての変更",
    media: "なし",
    storage: "kissa sandbox + 破損時の控え（--backup）",
    sideEffects: "なし",
    evidence: "sandbox.spec.ts（書出し・読込・控え・隔離）/ kissa.spec.ts",
  }),
  c("/kissa/admin", {
    brand: "KISSA（架空店舗）",
    family: "console",
    audience: "店側（の役）",
    purpose: "注文を進め、売り切れを切り替え、売上を見る",
    inputs: "状態変更・販売状態の切替",
    outputs: "注文状態、在庫表示、集計",
    next: "—",
    highlight: "客側と同じ記録を店側から動かす",
    reduces: "二重台帳",
    media: "なし",
    storage: "kissa sandbox",
    sideEffects: "なし。認証はないと明記",
    evidence: "kissa.spec.ts / qa:controls",
  }),

  // ------------------------------------------------------------- FORME ----
  c("/forme", {
    brand: "FORME（架空店舗）",
    family: "shop",
    audience: "商品を探している人（の役）",
    purpose: "店の世界観を見て、商品一覧へ進む",
    inputs: "なし",
    outputs: "なし",
    next: "/forme/items",
    highlight: "架空であることを全ページのバナーで明示",
    reduces: "—（入口）",
    media: "商品写真 3 点 + テクスチャ",
    storage: "forme sandbox（読み取りのみ）",
    sideEffects: "なし。noindex, follow",
    evidence: "forme.spec.ts / qa:forme 62 項目",
  }),
  c("/forme/items", {
    brand: "FORME（架空店舗）",
    family: "catalogue",
    audience: "商品を比べる人",
    purpose: "絞り込み・並び替え・3 点比較で候補を絞る",
    inputs: "絞り込み・並び替え・比較選択・お気に入り",
    outputs: "比較表、お気に入り",
    next: "/forme/items/<id>",
    highlight: "在庫が数として出る（売り切れを隠さない）",
    reduces: "問い合わせての在庫確認",
    media: "6 商品 × 色（写真 3 / 作図 8）",
    storage: "forme sandbox",
    sideEffects: "なし",
    evidence: "forme.spec.ts / qa:images（forme.colour.media）",
  }),
  c("/forme/items/[productId]", {
    brand: "FORME（架空店舗）",
    family: "shop",
    audience: "その商品を選ぶ人",
    purpose: "色とサイズを選び、価格と在庫を確かめて入れる",
    inputs: "色・サイズ・数量",
    outputs: "カート行",
    next: "/forme/cart",
    highlight: "色を変えると写真・価格・在庫が同時に変わる",
    reduces: "組み合わせごとの問い合わせ",
    media: "色ごとの写真、なければ作図",
    storage: "forme sandbox",
    sideEffects: "なし",
    evidence: "forme.spec.ts（6 実体）/ forme-shop のユニットテスト",
  }),
  c("/forme/cart", {
    brand: "FORME（架空店舗）",
    family: "shop",
    audience: "注文する人",
    purpose: "受け取り方法と地域を決め、送料込みで注文する",
    inputs: "配送/店頭、地域、支払方法",
    outputs: "注文番号、注文記録、在庫の減少",
    next: "/forme/my",
    highlight: "住所を取らずに送料を出す（地域だけ）",
    reduces: "送料の問い合わせ",
    media: "カート内の商品画像",
    storage: "forme sandbox",
    sideEffects: "なし（支払いは内部シミュレーター、再実行は冪等）",
    evidence: "forme-shop のユニットテスト / forme.spec.ts",
  }),
  c("/forme/my", {
    brand: "FORME（架空店舗）",
    family: "shop",
    audience: "注文した人",
    purpose: "状況を見て、支払い・取消しをし、データを持ち出す",
    inputs: "支払い、取消し、読み込むファイル",
    outputs: "更新された注文、戻る在庫、書き出した JSON",
    next: "/forme/items",
    highlight: "タブを閉じたあとでも支払える（決済が注文カードにある）",
    reduces: "支払い方法の問い合わせ",
    media: "注文商品の画像",
    storage: "forme sandbox + 破損時の控え",
    sideEffects: "なし",
    evidence: "sandbox.spec.ts / forme.spec.ts",
  }),
  c("/forme/admin", {
    brand: "FORME（架空店舗）",
    family: "console",
    audience: "店側（の役）",
    purpose: "在庫を動かし、取り扱いを止め、発送し、売上を見る",
    inputs: "在庫の増減、公開停止、発送",
    outputs: "在庫、注文状態、集計",
    next: "—",
    highlight: "未払いのまま発送できない",
    reduces: "二重台帳",
    media: "なし",
    storage: "forme sandbox（在庫は公開カタログからの差分）",
    sideEffects: "なし。認証はないと明記",
    evidence: "forme.spec.ts / qa:controls",
  }),
];

// ------------------------------------------------------------------ join ----
const inventory = JSON.parse(
  fs.readFileSync(path.join(ROOT, INVENTORY), "utf8"),
);
const pages = inventory.routes.filter((r) => r.kind === "page");

const byTemplate = new Map();
for (const row of pages) {
  const list = byTemplate.get(row.template) ?? [];
  list.push(row);
  byTemplate.set(row.template, list);
}

const contracts = new Map(CONTRACTS.map((x) => [x.template, x]));
const problems = [];

for (const template of byTemplate.keys())
  if (!contracts.has(template))
    problems.push(`no contract for template ${template}`);
for (const template of contracts.keys())
  if (!byTemplate.has(template))
    problems.push(`contract for ${template}, which the site does not serve`);

const rows = [...byTemplate.entries()]
  .map(([template, served]) => {
    const contract = contracts.get(template);
    if (!contract) return null;
    const na = NOT_APPLICABLE[contract.family] ?? {};
    return {
      id: template.replace(/[/[\]]/g, "_").replace(/^_|_$/g, "") || "home",
      ...contract,
      entities: served.map((r) => r.route),
      entityCount: served.length,
      noindex: served.every((r) => r.noindex === true),
      inSitemap: served.some((r) => r.inSitemap === true),
      states: Object.fromEntries(
        STATES.map((state) => [
          state,
          na[state] ? { applies: false, reason: na[state] } : { applies: true },
        ]),
      ),
    };
  })
  .filter(Boolean);

const applies = (row) =>
  Object.values(row.states).filter((s) => s.applies).length;

fs.writeFileSync(
  path.join(ROOT, OUT_JSON),
  JSON.stringify(
    {
      // `checkedAt` rather than `generatedAt`: the QA evidence recorder reads
      // every report through the same field.
      checkedAt: new Date().toISOString(),
      inventoryGeneratedAt: inventory.generatedAt,
      states: STATES,
      counts: {
        templates: rows.length,
        entities: rows.reduce((n, r) => n + r.entityCount, 0),
      },
      contracts: rows,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

// ------------------------------------------------------------------- md ----
const md = [];
md.push("# PAGE_CONTRACTS — 画面ごとの契約\n");
md.push(
  `生成: \`node scripts/page-contracts.mjs\`。route と実体数は
[ROUTE_INVENTORY.json](ROUTE_INVENTORY.json) から結合しているため、
実際に配信されている画面とずれない。テンプレートが増えて契約がなければ失敗する。\n`,
);
md.push(
  `**${rows.length} テンプレート / ${rows.reduce((n, r) => n + r.entityCount, 0)} 実体。** ` +
    `状態契約は ${STATES.length} 項目で、該当しないものは理由つきで N/A とする。\n`,
);

md.push("## 一覧\n");
md.push("| テンプレート | brand | 実体 | 利用者 | 目的 | 該当する状態 |");
md.push("| --- | --- | ---: | --- | --- | ---: |");
for (const row of rows)
  md.push(
    `| \`${row.template}\` | ${row.brand} | ${row.entityCount} | ${row.audience} | ${row.purpose} | ${applies(row)}/${STATES.length} |`,
  );

md.push("\n## 契約\n");
for (const row of rows) {
  md.push(`### \`${row.template}\`\n`);
  md.push(
    `${row.brand} / ${row.family} / 実体 ${row.entityCount} 件` +
      `${row.noindex ? " / **noindex**" : ""}${row.inSitemap ? " / sitemap 掲載" : ""}\n`,
  );
  md.push("| 項目 | 内容 |");
  md.push("| --- | --- |");
  for (const [label, key] of [
    ["利用者", "audience"],
    ["目的", "purpose"],
    ["入力", "inputs"],
    ["出力", "outputs"],
    ["次の操作", "next"],
    ["見せ場", "highlight"],
    ["減らす手間", "reduces"],
    ["画像", "media"],
    ["保存", "storage"],
    ["副作用・権限", "sideEffects"],
    ["完了判定と証拠", "evidence"],
  ])
    md.push(`| ${label} | ${row[key]} |`);

  const off = Object.entries(row.states).filter(([, s]) => !s.applies);
  md.push(
    `\n状態: ${applies(row)}/${STATES.length} 該当` +
      (off.length
        ? `。N/A — ${off.map(([k, s]) => `**${k}**（${s.reason}）`).join("、")}`
        : "。全項目が該当する"),
  );
  if (row.entityCount > 1)
    md.push(`\n実体: ${row.entities.map((e) => `\`${e}\``).join(" / ")}`);
  md.push("");
}

fs.writeFileSync(path.join(ROOT, OUT_MD), md.join("\n") + "\n", "utf8");

console.log(
  `PAGE_CONTRACTS: ${rows.length} templates / ${rows.reduce((n, r) => n + r.entityCount, 0)} entities`,
);
if (problems.length) {
  console.error("\n" + problems.join("\n"));
  process.exit(1);
}
console.log(`wrote ${OUT_JSON} and ${OUT_MD}`);
