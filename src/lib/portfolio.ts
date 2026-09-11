export const categories = [
  {
    id: "web",
    name: "Webサイト制作",
    short: "Webサイト",
    description: "ブランドの魅力を、伝わるWebサイトに。",
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
    scope: "商品LP・商品選択UI・カート画面・ECテーマ調整の相談",
    price: "30,000円〜",
    duration: "5〜10営業日〜",
    materials: "商品写真・説明・バリエーション・販売条件",
    tech: "React / TypeScript / CSS",
  },
  {
    id: "apps",
    name: "Webアプリ / 管理画面",
    short: "アプリ・管理画面",
    description: "日々の業務に、使いやすい仕組みを。",
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
    title: "KOMOREBI",
    name: "高級カフェ公式Webサイト",
    summary: "余白と静けさで伝える、一杯のための目的地。",
    categories: ["web", "coding", "responsive", "design"],
    theme: "cafe",
    brief:
      "新規オープンするカフェの世界観とメニューを伝える公式サイトを制作したい。",
    challenge: "雰囲気を伝えながら、メニューに迷わずたどり着けること。",
    solution:
      "大きなタイポグラフィとローカルのグラフィック、種類別メニューを組み合わせました。",
    concept:
      "静かな朝、木漏れ日、一杯の余韻。紙のような色と深いブラウンで編集。",
    features: [
      "ドリンク / フード切り替え",
      "店舗コンセプト・営業時間の提示",
      "モバイル専用の縦レイアウト",
    ],
    price: "50,000円〜",
    duration: "7〜14営業日",
    limitation: "架空店舗の自主制作。来店予約・実店舗案内は行いません。",
  },
  {
    ...common,
    slug: "saas",
    title: "FOLIO",
    name: "SaaSサービスLP",
    summary: "散らばる仕事を、ひとつの見通しに。",
    categories: ["lp", "web", "nextjs", "responsive", "coding"],
    theme: "saas",
    brief: "タスク管理サービスの機能とプランの違いを、初めての人にも伝えたい。",
    challenge: "抽象的になりがちな機能を、使う場面と一緒に紹介すること。",
    solution: "プロダクト画面を中心に据え、月額 / 年額の比較とFAQを配置。",
    concept: "明快な情報設計と、軽やかなライムのアクセント。",
    features: [
      "月額 / 年額プラン切り替え",
      "機能紹介・料金比較",
      "キーボードで開閉できるFAQ",
    ],
    price: "30,000円〜",
    duration: "5〜10営業日",
    limitation:
      "架空サービスのLP。掲載プランは想定価格で、申込や決済はできません。",
  },
  {
    ...common,
    slug: "ec",
    title: "FORM / 01",
    name: "EC商品販売LP",
    summary: "毎日に馴染む道具を、選びたくなる体験へ。",
    categories: ["ec", "lp", "coding", "responsive", "design"],
    theme: "ec",
    brief: "新しいタンブラーの商品紹介から、色・数量の選択まで制作してほしい。",
    challenge: "商品の佇まいと購入前の情報を、無理なく両立すること。",
    solution:
      "CSSで描く商品ビジュアルと連動するカラー選択、数量・小計・カート確認を実装。",
    concept: "プロダクトの質感を主役にした、静物展示のような商品ページ。",
    features: ["3色の商品切り替え", "数量・小計計算", "カート確認と削除"],
    price: "30,000円〜",
    duration: "5〜10営業日",
    limitation: "商品・価格は架空。注文・決済・個人情報入力はありません。",
  },
  {
    ...common,
    slug: "automation",
    title: "RELAY",
    name: "AI問い合わせ自動化システム",
    summary: "分類から下書き、人の確認までを見える化。",
    categories: ["automation", "api", "apps", "nextjs"],
    theme: "automation",
    brief:
      "問い合わせを分類し、返信下書きを作り、担当者の確認後に対応する仕組みを検討したい。",
    challenge: "自動化の範囲と人の判断を明確にし、送信事故を防ぐこと。",
    solution:
      "既存の分類ロジックを再利用し、受付→分類→下書き→人の確認を操作できるプレビューを実装。",
    concept: "自動化のブラックボックスをなくす、説明できるワークフロー。",
    features: [
      "入力内容のルール分類",
      "返信下書きの編集",
      "人の承認・差し戻し",
      "API契約のサンプル表示",
    ],
    price: "要件により見積",
    duration: "要件確定後に提示",
    limitation:
      "AI導入を想定したローカルシミュレーション。固定ルール・定型文を使用し、AI API接続やメール送信は行いません。",
  },
  {
    ...common,
    slug: "booking",
    title: "DAYBOOK",
    name: "予約管理ダッシュボード",
    summary: "今日の予定も、次の予約も。迷わない業務画面。",
    categories: ["apps", "nextjs", "responsive", "qa"],
    theme: "booking",
    brief:
      "小さなスタジオの予約を日付・時間別に整理し、追加と取消ができる画面を制作したい。",
    challenge: "重複予約の防止と、スマートフォンからの操作性。",
    solution:
      "日付選択、時間枠の競合検証、確認ダイアログと一覧を一画面にまとめました。",
    concept: "紙の手帳の見通しと、管理画面の操作性を両立。",
    features: [
      "日付別予約一覧",
      "予約追加・重複枠の検証",
      "取消確認ダイアログ",
      "検索・空状態",
    ],
    price: "要件により見積",
    duration: "要件確定後に提示",
    limitation:
      "架空の予約データ。変更は画面内のみで再読み込みすると初期化されます。実予約・共有DB・認証はありません。",
  },
  {
    ...common,
    slug: "improvement",
    title: "REFINE",
    name: "Webサイト改善 Before / After",
    summary: "情報はそのままに。伝わる順番を変える。",
    categories: ["improvement", "responsive", "coding", "web", "qa"],
    theme: "improvement",
    brief:
      "既存のサービスページが読みにくい。スマートフォンでも使いやすく改善したい。",
    challenge: "重要情報とCTAが埋もれ、次の操作が分かりにくいこと。",
    solution:
      "同じ原稿のBefore / Afterを切り替え、階層・余白・導線の変更を比較できるようにしました。",
    concept: "装飾を足す前に、情報を整える。",
    features: ["Before / After切り替え", "改善観点の注釈", "モバイルでの比較"],
    price: "5,000円〜 / 1ページ",
    duration: "1〜2営業日〜",
    limitation:
      "比較用に両方を自主制作。実顧客サイトや計測済みの成果改善ではありません。",
  },
  {
    ...common,
    slug: "creative",
    title: "STILL / STUDIO",
    name: "SNS / 広告クリエイティブ集",
    summary: "ひとつのブランドを、いくつもの接点へ。",
    categories: ["design", "lp", "ec"],
    theme: "creative",
    brief:
      "ブランドのトーンを揃えて、SNS投稿・ストーリー・広告バナーを展開したい。",
    challenge: "サイズが変わっても、視線の順番とブランドの一貫性を保つこと。",
    solution:
      "3つのオリジナルアート方向と用途別の比率切り替え、SVG書き出しを用意。",
    concept: "文字・形・余白だけで成立する、再利用できるビジュアルシステム。",
    features: [
      "3種類のアートディレクション",
      "正方形・縦長・横長の切り替え",
      "選択した作品のSVGダウンロード",
    ],
    price: "5,000円〜 / 1点",
    duration: "1〜3営業日〜",
    limitation:
      "自主制作の広告サンプル。広告配信実績や成果を示すものではありません。",
  },
  {
    ...common,
    slug: "qa",
    title: "SHIP / CHECK",
    name: "QA / 納品工程DEMO",
    summary: "つくって終わりにしない。引き継げる完成へ。",
    categories: ["qa", "apps", "nextjs"],
    theme: "qa",
    brief:
      "公開前のチェック内容と、納品時にもらえるファイルを具体的に確認したい。",
    challenge: "何を確認し、何が納品されるのかを曖昧にしないこと。",
    solution:
      "受入チェックの操作、未確認項目の可視化、納品マニフェストの生成を体験にしました。",
    concept: "品質を宣言するだけでなく、確認と引き継ぎの手順を見せる。",
    features: [
      "工程別チェックリスト",
      "全項目確認後のマニフェスト出力",
      "再チェック・進捗表示",
    ],
    price: "要件により見積",
    duration: "対象範囲確認後に提示",
    limitation:
      "チェック操作の体験デモです。チェックを付けても自動テストは実行されません。実際の検証結果はリポジトリのQA記録に記載します。",
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
    summary: "問い合わせを整理して、対応をスムーズに。",
    categories: ["automation", "apps", "nextjs"],
    theme: "automation",
    brief: "問い合わせの分類・担当・返信下書きをまとめたい。",
    challenge: "未対応の把握と、返信前の人の確認。",
    solution: "キーワード分類と担当管理、編集できる返信案を実装。",
    concept: "対応の優先順位が見える受信箱。",
    features: ["分類・緊急度フィルタ", "担当・状態変更", "返信案編集・コピー"],
    price: "要件により見積",
    duration: "仕様確認後に提示",
    limitation:
      "固定ルールで処理。AI APIやメール受送信なし。再読み込みで初期化。",
  },
  {
    ...common,
    featured: false,
    slug: "admin",
    title: "ADMIN DASHBOARD",
    name: "顧客管理ダッシュボード",
    summary: "顧客も取引状況も、ひとつの台帳に。",
    categories: ["apps", "nextjs", "qa"],
    theme: "booking",
    brief: "顧客情報の追加・編集と状況確認をしたい。",
    challenge: "保存データの破損や入力ミスへの対処。",
    solution: "CRUDと保存検証、削除前確認、操作履歴を実装。",
    concept: "小さなチームのためのシンプルな管理画面。",
    features: ["顧客CRUD", "検索・フィルタ", "localStorage・履歴"],
    price: "要件により見積",
    duration: "仕様確認後に提示",
    limitation:
      "架空データ。ブラウザ内保存のみ。認証・共有DB・バックアップなし。実顧客情報を入力しないでください。",
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
export const pricingNote =
  "参考価格・期間です。ページ数、機能、デザイン、素材、API・外部サービス、修正範囲で変動します。仕様と素材の確定後に正式なお見積もり・納期を提示します。";
export const getProject = (slug: string) =>
  projects.find((p) => p.slug === slug);
export const getCategory = (id: string) => categories.find((c) => c.id === id);
export const projectsFor = (id: CategoryId) =>
  projects.filter((p) => p.categories.includes(id));
