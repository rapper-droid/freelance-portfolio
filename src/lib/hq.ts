import { getProject } from "./portfolio";

/** Editorial records, not a live feed. Add only dated, source-backed facts. */
export const hqUpdatedAt = "2026-09-24";
export const hqConcept = "集まり、つくり、次へ広がる。";
export type HqBrand = {
  id: string;
  name: string;
  role: string;
  state: string;
  statement: string;
  description: string;
  href: string;
  cta: string;
  visual: "works" | "lab" | "music";
  /** Set when href leaves this site, so the link is rendered as a plain external anchor. */
  external?: boolean;
  /** Small, honest stage marker shown on the card (e.g. Public Beta). */
  stage?: string;
};
export const hqBrands: readonly HqBrand[] = [
  {
    id: "tetsu-works",
    name: "TETSU WORKS",
    role: "DESIGN & DEVELOPMENT",
    state: "受託制作",
    statement: "考えていたことを、使えるかたちに。",
    description:
      "Webサイトから業務ツール、自動化まで。相談を整理し、設計・制作・検証・納品までつなぐ、TSUDOWAの制作窓口です。",
    href: "/works",
    cta: "TETSU WORKSを見る",
    visual: "works",
  },
  {
    id: "tsudowa-music",
    name: "TSUDOWA MUSIC",
    role: "MUSIC, PLAY & PIXEL WORLDS",
    state: "Public Beta",
    stage: "Public Beta",
    statement: "気持ちを書く。曲になる。自由に鳴らす。",
    description:
      "指一本で音と夜の街が応えるJAM。6種類の音、6つのピクセル世界、景色の編集、端末への保存と再生。点数も失敗もありません。いまはFREE JAMを公開しています。",
    href: "https://music.tsudowa.com",
    cta: "自由に鳴らす",
    visual: "music",
    external: true,
  },
  {
    id: "tsukutta-lab",
    name: "TSUKUTTA LAB",
    role: "PRODUCTS, PLAY & EXPERIMENTS",
    state: "開発・研究",
    statement: "まだないものを、育てていく。",
    description:
      "小さなアイデアがプロダクトになり、試され、次の発想を残していく。プロダクト・ゲーム・実験的な制作を育てる、独立したブランドです。",
    href: "/lab",
    cta: "LABをのぞく",
    visual: "lab",
  },
];

/** The documented domain did not resolve on 2026-09-17. Never fabricate a live link. */
export const labPublication = {
  documentedOrigin: "https://tsukuttalab.com",
  verifiedPublicUrl: null as string | null,
  checkedAt: "2026-09-17",
  state: "public-url-unverified" as const,
};

export const hqSelections = [
  {
    slug: "cafe",
    industry: "HOSPITALITY / BRAND WEB",
    headline: "一杯に会いに行きたくなる、入口を。",
    problem: "お店の空気を保ったまま、注文と予約まで受けられるようにしたい。",
    solution: "写真、文字、余白を整え、注文と予約を同じ記録の上につなぐ。",
    result: "メニューから注文し、席を予約して、変更まで画面で終えられる。",
    visual: "photo",
  },
  {
    slug: "inbox",
    industry: "CUSTOMER SUPPORT / BUSINESS UI",
    headline: "問い合わせの山に、次の一手を。",
    problem: "どの相談から対応し、誰へ渡すかを迷わず決めたい。",
    solution: "優先度、担当、対応状況を一画面に。返信案の編集までつなぐ。",
    result:
      "絞り込みから状況更新、返信の確認まで。記録は画面をまたいでも残る。",
    visual: "screen",
  },
  {
    slug: "automation",
    industry: "OPERATIONS / AUTOMATION",
    headline: "自動で進める。判断は、置き去りにしない。",
    problem: "くり返す確認作業を減らしながら、実行前に内容を確かめたい。",
    solution: "入力、分類、人による確認、出力を順序のあるフローにする。",
    result: "確認した案件が、そのまま問い合わせ管理に届くところまで試せる。",
    visual: "screen",
  },
] as const;
export const selectedHqProjects = hqSelections.map((selection) => {
  const project = getProject(selection.slug);
  if (!project) throw new Error("HQ selection references a missing project");
  return { ...selection, project };
});

export type BuildRecord = {
  id: string;
  date: string;
  type: "Brand" | "Update" | "Development";
  brand: "tsudowa" | "tetsu-works" | "tsukutta-lab" | "tsudowa-music";
  title: string;
  summary: string;
  href: string;
  source: { kind: "git"; ref: string };
};
export const buildRecords: readonly BuildRecord[] = [
  {
    id: "music-public-beta",
    date: "2026-09-26",
    type: "Brand",
    brand: "tsudowa-music",
    title: "TSUDOWA MUSIC を Public Beta で公開しました。",
    summary:
      "指一本で音と景色が応えるFREE JAMを公開しました。6種類の音、6つのピクセル世界、景色の編集、端末への保存と同じ演奏の再生まで、実際に遊べます。気持ちから歌をつくる機能は次の大型アップデートで公開予定です。",
    href: "/#tsudowa-music",
    source: { kind: "git", ref: "32d17ba" },
  },
  {
    id: "kissa-shop",
    date: "2026-09-24",
    type: "Development",
    brand: "tetsu-works",
    title: "カフェのデモが、注文と予約を受ける店になりました。",
    summary:
      "メニューから注文し、受取時間を決め、席を予約して変更する。店側の運営画面から同じ記録を動かせます。架空店舗のため実際の注文・予約・支払いは発生しません。",
    href: "/kissa",
    source: { kind: "git", ref: "46bb2b69bd7235149acaea3c0d3fb429a7d9e8c2" },
  },
  {
    id: "forme-shop",
    date: "2026-09-24",
    type: "Development",
    brand: "tetsu-works",
    title: "商品ページのデモに、在庫と注文を入れました。",
    summary:
      "色とサイズで写真・価格・在庫が連動し、注文で在庫が減り取消で戻る。未払いのまま発送できないことも運営画面で確かめられます。商品・価格は架空です。",
    href: "/forme",
    source: { kind: "git", ref: "b7de10a073b5e325d7e83bf152c22d1a9052b5c0" },
  },
  {
    id: "one-record",
    date: "2026-09-24",
    type: "Update",
    brand: "tetsu-works",
    title: "自動化と問い合わせ管理と顧客台帳を、ひとつの記録に。",
    summary:
      "RELAYで確認した案件がSMART INBOXに届き、顧客台帳へ紐づけられます。承認した下書きを編集すると承認が外れます。メール送信とAI API接続は行いません。",
    href: "/demos/automation",
    source: { kind: "git", ref: "e2e422e70fa6510cdd618cb88a909d114352d816" },
  },
  {
    id: "showcase-rebuild",
    date: "2026-09-24",
    type: "Update",
    brand: "tetsu-works",
    title: "見るだけだった4つのデモを、動かせる形に。",
    summary:
      "STILLは文字と比率を編集して書き出せ、FLOWSTATEは実際のファイルを出し、REFINEは読み順とフォーカス順を表示し、SHIPは実行済みの検査記録を並べます。",
    href: "/works",
    source: { kind: "git", ref: "7cce8613f5664ae9a22a4c44cf8942ffd8c4180d" },
  },
  {
    id: "independent-demos",
    date: "2026-09-17",
    type: "Update",
    brand: "tetsu-works",
    title: "11の制作デモを、ひとつずつ体験できる形へ。",
    summary:
      "店舗サイト、商品ページ、業務ツール。それぞれの画面に集中できる単独表示を追加しました。すべて自主制作のデモです。",
    href: "/works",
    source: { kind: "git", ref: "8e777db815e9ede4b8890bff26e6b160275ace2b" },
  },
  {
    id: "sales-intake",
    date: "2026-09-17",
    type: "Development",
    brand: "tetsu-works",
    title: "相談の入口から、つくり方を整える。",
    summary:
      "相談内容の整理、受付番号、確認メールまでをつなぐ問い合わせ体験を実装しました。曖昧な段階から、文章で相談できる入口です。",
    href: "/contact",
    source: { kind: "git", ref: "3b794050378f92a916df3d09e44ad1970a004bec" },
  },
  {
    id: "parent-brand",
    date: "2026-09-17",
    type: "Brand",
    brand: "tsudowa",
    title: "TSUDOWAを、活動をつなぐ親ブランドに。",
    summary:
      "制作を担うTETSU WORKSと、プロダクト・実験を育てるTSUKUTTA LAB。異なる活動を、ひとつの思想でつなぐ構造を設けました。",
    href: "/#brands",
    source: { kind: "git", ref: "41f9068" },
  },
];
export function buildYears(records: readonly BuildRecord[] = buildRecords) {
  return [...new Set(records.map((record) => record.date.slice(0, 4)))]
    .sort()
    .reverse();
}
export const dateLabel = (date: string) => date.replaceAll("-", ".");
