export const categories = [
  {
    id: "web",
    name: "Webサイト制作",
    short: "Webサイト",
    description: "ブランドの魅力を、伝わるWebサイトに。",
    audience: "これから公式サイトを用意する、企業・店舗・サービスの運営者。",
    scope: "構成設計・企業 / 店舗サイト・更新しやすいページ設計",
    price: "50,000円〜",
    duration: "7〜14営業日",
    materials: "ロゴ・掲載原稿・写真・ページ構成",
    tech: "Next.js / React / HTML / CSS",
  },
  {
    id: "lp",
    name: "LP制作",
    short: "LP制作",
    description: "伝える順番から設計する、サービスの入口。",
    audience: "広告やキャンペーンの受け皿になるページが必要な方。",
    scope: "訴求整理・ワイヤーフレーム・LPデザイン・コーディング",
    price: "30,000円〜",
    duration: "5〜10営業日",
    materials: "商品・サービス情報、想定読者、訴求、素材",
    tech: "Next.js / TypeScript / CSS",
  },
  {
    id: "coding",
    name: "HTML / CSS / JavaScript",
    short: "コーディング",
    description: "デザインの意図まで、丁寧に実装。",
    audience: "デザインは手元にあり、実装だけを任せたい方。",
    scope: "デザイン再現・静的ページ・フォームUI・既存コード修正",
    price: "5,000円〜 / 1ページ",
    duration: "1〜2営業日〜",
    materials: "デザインデータ・既存ソース・対象ページ",
    tech: "HTML / CSS / JavaScript",
  },
  {
    id: "nextjs",
    name: "TypeScript / Next.js",
    short: "Next.js",
    description: "使い続けられる、拡張しやすいWebへ。",
    audience: "TypeScript / Next.js を前提にした実装を任せたい方。",
    scope: "App Router・型設計・コンポーネント・SEO・アプリ実装",
    price: "要件により見積",
    duration: "仕様確認後に提示",
    materials: "機能要件・画面一覧・既存リポジトリ",
    tech: "Next.js / React / TypeScript",
  },
  {
    id: "responsive",
    name: "レスポンシブ対応",
    short: "レスポンシブ",
    description: "どの画面でも、迷わず使える。",
    audience: "PCでは問題ないが、スマートフォンで崩れている方。",
    scope: "スマートフォン最適化・タブレット対応・表示崩れ修正",
    price: "5,000円〜 / 1ページ",
    duration: "1〜2営業日〜",
    materials: "対象URL・ソース・対応したい端末",
    tech: "CSS Grid / Flexbox / Playwright",
  },
  {
    id: "improvement",
    name: "既存サイト修正 / 改善",
    short: "修正・改善",
    description: "いまあるサイトを、もっと使いやすく。",
    audience: "サイトはあるが、読みにくさや不具合が残っている方。",
    scope: "導線・可読性・表示崩れ・アクセシビリティ・バグ修正",
    price: "5,000円〜",
    duration: "1〜2営業日〜",
    materials: "現状URL・再現手順・変更したい内容・ソース",
    tech: "HTML / CSS / TypeScript / axe",
  },
  {
    id: "ec",
    name: "ECサイト / 商品ページ",
    short: "EC・商品ページ",
    description: "商品の価値が伝わる、購入体験を。",
    audience: "商品をオンラインで見せて、購入まで案内したい方。",
    scope: "商品LP・商品選択UI・カート画面・ECテーマ調整の相談",
    price: "内容により見積",
    duration: "5〜10営業日〜",
    materials: "商品写真・説明・バリエーション・販売条件",
    tech: "React / TypeScript / CSS",
  },
  {
    id: "apps",
    name: "Webアプリ / 管理画面",
    short: "アプリ・管理画面",
    description: "日々の業務に、使いやすい仕組みを。",
    audience: "表計算や手作業で回している業務を、画面で扱えるようにしたい方。",
    scope: "予約・顧客管理・検索・入力フォーム・業務ダッシュボード",
    price: "要件により見積",
    duration: "仕様確認後に提示",
    materials: "業務フロー・入力項目・権限・保存要件",
    tech: "React / Next.js / TypeScript",
  },
  {
    id: "api",
    name: "API / 外部サービス連携",
    short: "API連携",
    description: "ばらばらの作業を、ひとつの流れに。",
    audience: "既存のサービスやツールとデータを連携させたい方。",
    scope: "APIの仕様調査・連携設計・エラー処理・接続テストの相談",
    price: "要件により見積",
    duration: "接続先の仕様確認後",
    materials: "API仕様・利用条件・テスト環境（秘密情報は別管理）",
    tech: "TypeScript / REST / JSON / API契約設計",
  },
  {
    id: "automation",
    name: "AI業務自動化",
    short: "AI・業務自動化",
    description: "人が判断する時間を、もっと大切に。",
    audience: "問い合わせ対応やデータ整理に時間を取られている方。",
    scope: "問い合わせ整理・返信下書き・CSV加工・AI連携の設計相談",
    price: "要件により見積",
    duration: "業務フロー確認後",
    materials: "現在の手順・匿名サンプル・確認者・利用条件",
    tech: "TypeScript / CSV / AI API連携設計",
  },
  {
    id: "design",
    name: "デザイン / コンテンツ制作",
    short: "デザイン",
    description: "見た目と伝わり方を、ひとつに。",
    audience: "作るものは決まっているが、見せ方を整えたい方。",
    scope: "Webデザイン・バナー・広告クリエイティブ・コピー構成",
    price: "5,000円〜 / 1点",
    duration: "1〜3営業日〜",
    materials: "ブランド資料・用途・サイズ・掲載文・画像",
    tech: "SVG / CSS / デザイントークン",
  },
  {
    id: "qa",
    name: "テスト / QA / 納品",
    short: "テスト・納品",
    description: "完成を、確認できる形で渡す。",
    audience: "実装は終わっていて、公開前の確認と納品整備を任せたい方。",
    scope: "動作確認・E2E・アクセシビリティ検査・README・ソース整理",
    price: "要件により見積",
    duration: "対象範囲確認後",
    materials: "対象環境・受入条件・ソース・テスト用データ",
    tech: "Playwright / Vitest / axe-core",
  },
] as const;
export type CategoryId = (typeof categories)[number]["id"];
export type Project = {
  slug: string;
  title: string;
  name: string;
  summary: string;
  categories: CategoryId[];
  theme: string;
  brief: string;
  challenge: string;
  solution: string;
  concept: string;
  features: string[];
  tech: string[];
  deliverables: string[];
  qa: string[];
  price: string;
  duration: string;
  limitation: string;
  featured: boolean;
};
const common = {
  tech: ["Next.js", "React", "TypeScript", "CSS"],
  deliverables: [
    "ソースコード・設定ファイル",
    "起動・更新手順のREADME",
    "画面仕様・検証項目一覧",
  ],
  qa: [
    "PC / Tablet / Mobile表示",
    "キーボード操作・コントラスト",
    "リンク・入力・エラー状態",
  ],
  featured: true,
};
export const projects: Project[] = [
  {
    ...common,
    slug: "cafe",
    title: "KISSA",
    name: "カフェの公式サイトと、注文・席予約",
    summary: "見て終わりではなく、注文と予約まで進める店舗サイト。",
    categories: ["web", "coding", "responsive", "design"],
    theme: "cafe",
    brief:
      "新規オープンするカフェの世界観とメニューを伝え、注文と席の予約まで受けられる公式サイトを制作したい。",
    challenge: "雰囲気を伝えながら、注文と予約を迷わず終えられること。",
    solution:
      "メニューから注文、席の予約、変更・取消、そして店側の運営画面までを一つの記録でつなぎました。",
    concept:
      "静かな朝、木漏れ日、一杯の余韻。紙のような色と深いブラウンで編集。",
    features: [
      "14品のメニューと商品詳細・カート",
      "調理時間と営業時間から出す受取時間",
      "空席から選ぶ席予約と、仮押さえ・変更・取消",
      "運営画面（注文の進行・売り切れ・売上）",
    ],
    price: "50,000円〜",
    duration: "7〜14営業日",
    limitation:
      "架空店舗の自主制作です。注文も予約も画面上では最後まで進みますが、実際の注文・予約・支払いは発生せず、入力内容はお使いのブラウザにだけ保存されます。",
  },
  {
    ...common,
    slug: "saas",
    title: "FLOWSTATE",
    name: "SaaSサービスLP",
    summary: "機能の紹介だけで終わらせず、実際に出るファイルまで見せるLP。",
    categories: ["lp", "web", "nextjs", "responsive", "coding"],
    theme: "saas",
    brief: "タスク管理サービスの機能とプランの違いを、初めての人にも伝えたい。",
    challenge: "抽象的になりがちな機能を、使う場面と出てくる成果物で示すこと。",
    solution:
      "使用前後、実際に書き出せる週次まとめ、導入手順、そして接続していないものを接続していないと書く対応範囲表を並べました。",
    concept: "明快な情報設計と、軽やかなライムのアクセント。",
    features: [
      "月額 / 年額プラン切り替え",
      "実際に開ける週次まとめの書き出し",
      "対応範囲・必要な権限・接続状況の一覧",
      "キーボードで開閉できるFAQ",
    ],
    price: "30,000円〜",
    duration: "5〜10営業日",
    limitation:
      "架空サービスのLPです。掲載プランは想定価格で、申込や決済はできません。書き出しだけは本物で、押すと実際にファイルが作られます。外部サービスへは接続していません。",
  },
  {
    ...common,
    slug: "ec",
    title: "FORME",
    name: "オンラインショップと在庫管理",
    summary: "色とサイズで写真・価格・在庫が動く、数の決まった店。",
    categories: ["ec", "lp", "coding", "responsive", "design"],
    theme: "ec",
    brief:
      "新しいタンブラーの商品紹介から、色とサイズの選択、在庫と注文の管理まで制作してほしい。",
    challenge: "商品の佇まいを保ちながら、在庫と注文を正しく扱うこと。",
    solution:
      "組み合わせごとに在庫を数え、注文で減り取消で戻る仕組みと、未払いのまま発送させない運営画面を実装しました。",
    concept: "プロダクトの質感を主役にした、静物展示のような売り場。",
    features: [
      "6品・絞り込み・並び替え・3点比較・お気に入り",
      "色とサイズで連動する写真・価格・在庫",
      "配送/店頭の選択と、地域まで含む送料計算",
      "注文履歴・取消と、在庫が戻る運営画面",
    ],
    price: "内容により見積",
    duration: "5〜10営業日",
    limitation:
      "商品・価格・店舗はすべて架空です。注文は画面上で最後まで進みますが、実際の決済・配送は発生しません。住所や氏名は入力せず、配送地域だけで送料を計算します。",
  },
  {
    ...common,
    slug: "automation",
    title: "RELAY",
    name: "AI問い合わせ自動化システム",
    summary: "分類から下書き、人の確認まで。確認した内容はそのまま記録に残る。",
    categories: ["automation", "api", "apps", "nextjs"],
    theme: "automation",
    brief:
      "問い合わせを分類し、返信下書きを作り、担当者の確認後に対応する仕組みを検討したい。",
    challenge: "自動化の範囲と人の判断を明確にし、送信事故を防ぐこと。",
    solution:
      "受付→分類→下書き→人の確認を操作でき、確認済みにすると問い合わせ管理と顧客台帳に同じ記録として現れるようにしました。",
    concept: "自動化のブラックボックスをなくす、説明できるワークフロー。",
    features: [
      "入力内容のルール分類",
      "返信下書きの編集と、人の承認・差し戻し",
      "確認済みの案件が問い合わせ管理へ届く",
      "編集すると確認済みが外れる",
    ],
    price: "要件により見積",
    duration: "要件確定後に提示",
    limitation:
      "AI導入を想定したローカルシミュレーションです。固定ルール・定型文を使用し、AI API接続やメール送信は行いません。記録はお使いのブラウザにだけ残ります。",
  },
  {
    ...common,
    slug: "booking",
    title: "DAYBOOK",
    name: "予約管理ダッシュボード",
    summary: "今日の予定も、次の予約も。今日から一週間を、迷わず。",
    categories: ["apps", "nextjs", "responsive", "qa"],
    theme: "booking",
    brief:
      "小さなスタジオの予約を日付・時間別に整理し、追加と取消ができる画面を制作したい。",
    challenge: "重複予約の防止と、スマートフォンからの操作性。",
    solution:
      "今日を起点にした一週間、時間枠の競合検証、確認ダイアログと一覧を一画面にまとめました。",
    concept: "紙の手帳の見通しと、管理画面の操作性を両立。",
    features: [
      "今日から7日間の予約一覧",
      "予約追加・重複枠の検証",
      "取消確認ダイアログ",
      "検索・空状態",
    ],
    price: "要件により見積",
    duration: "要件確定後に提示",
    limitation:
      "架空の予約データです。表示される一週間は常に今日から始まります。変更は画面内のみで、再読み込みすると初期化されます。実予約・共有DB・認証はありません。",
  },
  {
    ...common,
    slug: "improvement",
    title: "REFINE",
    name: "Webサイト改善 Before / After",
    summary: "情報はそのままに。伝わる順番を、確かめられる形で変える。",
    categories: ["improvement", "responsive", "coding", "web", "qa"],
    theme: "improvement",
    brief:
      "既存のサービスページが読みにくい。スマートフォンでも使いやすく改善したい。",
    challenge: "重要情報とCTAが埋もれ、次の操作が分かりにくいこと。",
    solution:
      "同じ本文・同じリンクのまま順番だけを変え、画面幅・読み順・フォーカス順を実際に表示して比べられるようにしました。",
    concept: "装飾を足す前に、情報を整える。",
    features: [
      "Before / After / 並べて比較",
      "360 / 768 / 1200px の画面幅切り替え",
      "読み順とフォーカス順の表示",
      "対象版と測定条件の明示",
    ],
    price: "5,000円〜 / 1ページ",
    duration: "1〜2営業日〜",
    limitation:
      "比較用に両方を自主制作しています。Beforeはよくある構成であり、わざと崩した見本ではありません。売上・CVR・速度は測定していないため、改善率は一切表示していません。",
  },
  {
    ...common,
    slug: "creative",
    title: "STILL / STUDIO",
    name: "SNS / 広告クリエイティブ集",
    summary: "ひとつの内容を、いくつもの比率へ。書き換えれば全部が変わる。",
    categories: ["design", "lp", "ec"],
    theme: "creative",
    brief:
      "ブランドのトーンを揃えて、SNS投稿・ストーリー・広告バナーを展開したい。",
    challenge: "サイズが変わっても、視線の順番とブランドの一貫性を保つこと。",
    solution:
      "見出し・商品名・価格・期間・CTAを編集でき、トリミングとセーフエリアを確認しながら、三つの比率を同時に見られるようにしました。",
    concept: "文字・形・余白だけで成立する、再利用できるビジュアルシステム。",
    features: [
      "文字・価格・期間・CTAの編集",
      "図形の位置と大きさの調整、セーフエリア表示",
      "正方形・縦長・横長を同時にプレビュー",
      "画面の内容がそのまま入るSVG書き出し",
    ],
    price: "5,000円〜 / 1点",
    duration: "1〜3営業日〜",
    limitation:
      "自主制作の広告サンプルです。広告配信実績や成果を示すものではありません。書き出したSVGは実際に開けるファイルで、プレビュー用の補助線は含まれません。",
  },
  {
    ...common,
    slug: "qa",
    title: "SHIP / CHECK",
    name: "QA / 納品工程DEMO",
    summary: "つくって終わりにしない。手の確認と、機械の記録を分けて残す。",
    categories: ["qa", "apps", "nextjs"],
    theme: "qa",
    brief:
      "公開前のチェック内容と、納品時にもらえるファイルを具体的に確認したい。",
    challenge: "何を確認し、何が納品されるのかを曖昧にしないこと。",
    solution:
      "受入チェックの操作と納品マニフェストの生成に加え、実際に走った自動検査の記録を、再現手順つきで別枠に並べました。",
    concept: "品質を宣言するだけでなく、確認と引き継ぎの手順を見せる。",
    features: [
      "工程別チェックリストと進捗表示",
      "全項目確認後のマニフェスト出力",
      "実行済みの自動検査の記録（対象コミット・日時つき）",
      "未実施の検査を理由つきで表示",
    ],
    price: "要件により見積",
    duration: "対象範囲確認後に提示",
    limitation:
      "自主制作のデモです。チェックリストは手の確認の記録で、チェックを付けても自動テストは実行されません。自動検査の表は保存済みの記録で、ページを開いたときに走るものではありません。各行に再現手順を書いています。",
  },
  {
    ...common,
    featured: false,
    slug: "csv",
    title: "CSV AUTOMATOR",
    name: "CSVデータ加工ツール",
    summary: "読み込みから整理、集計、書き出しまで。",
    categories: ["automation", "apps", "coding", "qa"],
    theme: "automation",
    brief: "毎週のCSV整理を簡単な操作に置き換えたい。",
    challenge: "不正な入力や出力時の数式解釈への対処。",
    solution: "形式検証・表記統一・重複除去・安全なCSV出力を実装。",
    concept: "業務の一工程を確実に軽くする。",
    features: ["CSV入力・整形", "検索・集計", "数式対策付き出力"],
    price: "要件により見積",
    duration: "仕様確認後に提示",
    limitation: "ブラウザ内処理。UTF-8 / 2MB / 10,000行 / 50列まで。",
  },
  {
    ...common,
    featured: false,
    slug: "inbox",
    title: "SMART INBOX",
    name: "問い合わせ管理ツール",
    summary:
      "分類・優先度・担当・返信下書きを一画面に。受付から顧客台帳まで同じ記録。",
    categories: ["automation", "apps", "nextjs"],
    theme: "automation",
    brief: "問い合わせの分類・担当・返信下書きをまとめたい。",
    challenge:
      "未対応の把握と、返信前の人の確認、そして画面をまたいでも失われないこと。",
    solution:
      "キーワード分類と担当管理、編集できる返信案を、RELAY・顧客台帳と共通の記録の上に実装しました。",
    concept: "対応の優先順位が見える受信箱。",
    features: [
      "分類・緊急度・担当での絞り込み",
      "対応状況と担当の変更が記録に残る",
      "返信案の生成・編集・確認",
      "確認済みの返信を編集すると確認が外れる",
    ],
    price: "要件により見積",
    duration: "仕様確認後に提示",
    limitation:
      "固定ルールで処理します。AI APIやメールの受送信はありません。対応状況・担当・下書きはお使いのブラウザに保存され、再読み込みしても残ります。",
  },
  {
    ...common,
    featured: false,
    slug: "admin",
    title: "ADMIN DASHBOARD",
    name: "顧客管理ダッシュボード",
    summary: "顧客も取引状況も、届いた問い合わせも、ひとつの台帳に。",
    categories: ["apps", "nextjs", "qa"],
    theme: "booking",
    brief: "顧客情報の追加・編集と状況確認をしたい。",
    challenge:
      "保存データの破損や入力ミスへの対処と、問い合わせとの取り違え防止。",
    solution:
      "CRUDと保存検証、削除前確認、操作履歴に加え、問い合わせを顧客へ明示的に紐づける導線を実装しました。",
    concept: "小さなチームのためのシンプルな管理画面。",
    features: [
      "顧客CRUD・検索・フィルタ",
      "問い合わせと顧客の紐づけ（自動照合はしない）",
      "問い合わせから顧客を作成",
      "localStorage保存と操作履歴",
    ],
    price: "要件により見積",
    duration: "仕様確認後に提示",
    limitation:
      "架空データです。ブラウザ内保存のみで、認証・共有DB・バックアップはありません。同名の別会社を取り違えないよう、問い合わせの自動紐づけは行いません。実顧客情報を入力しないでください。",
  },
];
export const flow = [
  "募集内容・仕様確認",
  "必要素材確認",
  "設計",
  "制作・実装",
  "内部QA",
  "確認用共有",
  "修正",
  "最終QA",
  "成果物整理",
  "納品",
];

/**
 * The same ten steps, grouped into the four phases a client actually asks
 * about. Ten flat items are accurate but hard to hold in mind; the phases
 * are what makes the shape of a project graspable at a glance. The flat list
 * stays canonical -- this is a view of it, not a replacement, and the
 * step names below are the same strings.
 */
export const flowPhases = [
  {
    label: "相談・確認",
    icon: "talk" as const,
    checkpoint: "作るものと範囲を、着手前に合意します",
    actor: "人" as const,
    steps: [flow[0], flow[1]],
    note: "作るものと必要な素材を先に確定します。",
  },
  {
    label: "設計",
    icon: "draft" as const,
    checkpoint: null,
    actor: "人" as const,
    steps: [flow[2]],
    note: "画面と構造を決めてから手を動かします。",
  },
  {
    label: "制作・検証",
    icon: "build" as const,
    checkpoint: "確認用URLを共有。見て、直す指示をいただきます",
    actor: "人" as const,
    steps: [flow[3], flow[4], flow[5], flow[6], flow[7]],
    note: "実装しながら確認し、共有して直します。",
  },
  {
    label: "納品",
    icon: "deliver" as const,
    checkpoint: "納品物を確認いただいて完了です",
    actor: "人" as const,
    steps: [flow[8], flow[9]],
    note: "使い始められる形にまとめて渡します。",
  },
];

export const pricingNote =
  "参考価格・期間です。ページ数、機能、デザイン、素材、API・外部サービス、修正範囲で変動します。仕様と素材の確定後に正式なお見積もり・納期を提示します。";
export const getProject = (slug: string) =>
  projects.find((p) => p.slug === slug);
export const getCategory = (id: string) => categories.find((c) => c.id === id);
export const projectsFor = (id: CategoryId) =>
  projects.filter((p) => p.categories.includes(id));
