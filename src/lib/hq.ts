import { getProject } from "./portfolio";

/** Editorial records, not a live feed. Add only dated, source-backed facts. */
export const hqUpdatedAt = "2026-09-17";
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
  visual: "works" | "lab";
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
    problem: "お店の空気と、メニュー・アクセスの探しやすさを両立したい。",
    solution: "写真、文字、余白を整え、来店までの情報を一本につなぐ。",
    result: "メニューを切り替え、そのまま店舗情報へ進めるサイトに。",
    visual: "photo",
  },
  {
    slug: "inbox",
    industry: "CUSTOMER SUPPORT / BUSINESS UI",
    headline: "問い合わせの山に、次の一手を。",
    problem: "どの相談から対応し、誰へ渡すかを迷わず決めたい。",
    solution: "優先度、担当、対応状況を一画面に。返信案の編集までつなぐ。",
    result: "絞り込みから状況更新、返信案のコピーまで操作できる。",
    visual: "screen",
  },
  {
    slug: "automation",
    industry: "OPERATIONS / AUTOMATION",
    headline: "自動で進める。判断は、置き去りにしない。",
    problem: "くり返す確認作業を減らしながら、実行前に内容を確かめたい。",
    solution: "入力、分類、人による確認、出力を順序のあるフローにする。",
    result: "編集後の再確認を含めて、実行までの流れを試せる。",
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
  brand: "tsudowa" | "tetsu-works" | "tsukutta-lab";
  title: string;
  summary: string;
  href: string;
  source: { kind: "git"; ref: string };
};
export const buildRecords: readonly BuildRecord[] = [
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
