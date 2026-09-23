import { getProject, type CategoryId } from "./portfolio";
// Independent of the original eight demo capture fixtures.
export const selectedSlugs = ["cafe", "saas", "ec", "inbox"] as const;
export const selectedProjects = selectedSlugs.map((slug) => getProject(slug)!);
export const caseLabels: Record<string, string> = {
  cafe: "Cafe Site & Orders",
  saas: "SaaS LP",
  ec: "Shop & Inventory",
  inbox: "AI Workflow",
};
export const services: {
  id: CategoryId;
  title: string;
  description: string;
}[] = [
  {
    id: "web",
    title: "WEB SITE",
    description: "コーポレート / 店舗 / サービスサイト",
  },
  { id: "lp", title: "LANDING PAGE", description: "広告・サービス訴求LP" },
  { id: "ec", title: "E-COMMERCE", description: "EC / 商品ページ" },
  { id: "apps", title: "WEB APP", description: "管理画面 / 業務ツール" },
  { id: "automation", title: "AI AUTOMATION", description: "AI / 業務自動化" },
  { id: "api", title: "API / INTEGRATION", description: "外部サービス連携" },
  { id: "design", title: "DESIGN", description: "UI / バナー / コンテンツ" },
  { id: "qa", title: "QA & DELIVERY", description: "テスト / 改善 / 納品整備" },
];
